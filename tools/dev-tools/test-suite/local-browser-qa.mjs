import fs from "node:fs";
import path from "node:path";
import process from "node:process";

import { chromium } from "playwright";

const mode = process.argv[2] ?? "public";
const projectRoot = process.cwd();
const artifactDir = path.join(projectRoot, "qa_second_pass");
const publicBaseUrl = process.env.QA_BASE_URL ?? "http://127.0.0.1:3001";
const devBaseUrl = process.env.QA_DEV_BASE_URL ?? "http://127.0.0.1:3002";

function ensure(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function slugifyRoute(routePath) {
  if (routePath === "/") return "home";
  return routePath.replace(/^\//, "").replace(/[/?=&]+/g, "-").replace(/^-+|-+$/g, "");
}

function extractMediaBox(buffer) {
  const text = buffer.toString("latin1");
  const match = text.match(/\/MediaBox\s*\[\s*0\s+0\s+([0-9.]+)\s+([0-9.]+)\s*\]/);
  if (!match) return null;

  return {
    width: Number.parseFloat(match[1]),
    height: Number.parseFloat(match[2]),
  };
}

async function inspectPage(context, { baseUrl, routePath, titlePattern, mustContainText, screenshotName }) {
  const page = await context.newPage();
  const pageErrors = [];

  page.on("pageerror", (error) => {
    pageErrors.push(error.message);
  });

  const response = await page.goto(`${baseUrl}${routePath}`, {
    waitUntil: "domcontentloaded",
    timeout: 60000,
  });
  await page.waitForTimeout(1500);

  ensure(response, `No response received for ${routePath}.`);
  ensure(response.status() < 400, `Expected ${routePath} to return < 400, received ${response.status()}.`);

  const title = await page.title();
  const bodyText = await page.locator("body").innerText();

  if (titlePattern) {
    ensure(titlePattern.test(title), `Unexpected title for ${routePath}: "${title}".`);
  }

  if (mustContainText) {
    ensure(bodyText.includes(mustContainText), `Expected ${routePath} to contain "${mustContainText}".`);
  }

  ensure(!/Application error|Unhandled Runtime Error/i.test(bodyText), `Detected runtime error copy on ${routePath}.`);
  ensure(pageErrors.length === 0, `Uncaught browser errors on ${routePath}: ${pageErrors.join(" | ")}`);

  if (screenshotName) {
    await page.screenshot({
      path: path.join(artifactDir, screenshotName),
      fullPage: true,
    });
  }

  await page.close();

  return {
    routePath,
    title,
    bodySample: bodyText.replace(/\s+/g, " ").trim().slice(0, 180),
  };
}

async function runPublicQa() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1200 },
  });

  const results = [];
  const publicChecks = [
    {
      routePath: "/",
      titlePattern: /AI Resume Builder|AI Career Guide/i,
      mustContainText: "AI Career Guide",
      screenshotName: "public-home.png",
    },
    {
      routePath: "/pricing",
      titlePattern: /Pricing \| AI Career Guide/i,
      mustContainText: "Pricing",
      screenshotName: "public-pricing.png",
    },
    {
      routePath: "/support",
      titlePattern: /Support \| AI Career Guide/i,
      mustContainText: "Support",
    },
    {
      routePath: "/privacy",
      titlePattern: /Privacy policy \| AI Career Guide/i,
      mustContainText: "Privacy",
    },
    {
      routePath: "/terms",
      titlePattern: /Terms of service \| AI Career Guide/i,
      mustContainText: "Terms",
    },
    {
      routePath: "/login",
      titlePattern: /Log in \| AI Career Guide/i,
      mustContainText: "Log In",
      screenshotName: "public-login.png",
    },
    {
      routePath: "/signup",
      titlePattern: /Create account \| AI Career Guide/i,
      mustContainText: "Create your account",
      screenshotName: "public-signup.png",
    },
  ];

  for (const check of publicChecks) {
    results.push(await inspectPage(context, { baseUrl: publicBaseUrl, ...check }));
  }

  await browser.close();

  return {
    mode: "public",
    baseUrl: publicBaseUrl,
    checkedRoutes: results,
  };
}

async function runPrintQa() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1800 },
  });

  const results = [];
  const qaPage = await context.newPage();
  const galleryErrors = [];

  qaPage.on("pageerror", (error) => {
    galleryErrors.push(error.message);
  });

  const galleryResponse = await qaPage.goto(`${devBaseUrl}/qa/resume-templates`, {
    waitUntil: "domcontentloaded",
    timeout: 60000,
  });
  await qaPage.waitForTimeout(2000);

  ensure(galleryResponse, "No response received for the template QA gallery.");
  ensure(galleryResponse.status() < 400, `Template QA gallery returned ${galleryResponse.status()}.`);
  ensure(galleryErrors.length === 0, `Template QA gallery page errors: ${galleryErrors.join(" | ")}`);

  const templateCount = await qaPage.locator("[data-template-id]").count();
  ensure(templateCount >= 15, `Expected at least 15 rendered template surfaces, found ${templateCount}.`);

  await qaPage.screenshot({
    path: path.join(artifactDir, "qa-template-gallery.png"),
    fullPage: true,
  });

  results.push({
    routePath: "/qa/resume-templates",
    templateCount,
  });

  await qaPage.close();

  const printRoute = "/qa/resume-templates?template=executive&mode=print";
  const printPage = await context.newPage();
  const printErrors = [];

  printPage.on("pageerror", (error) => {
    printErrors.push(error.message);
  });

  const printResponse = await printPage.goto(`${devBaseUrl}${printRoute}`, {
    waitUntil: "domcontentloaded",
    timeout: 60000,
  });
  await printPage.waitForTimeout(2000);

  ensure(printResponse, "No response received for the print QA page.");
  ensure(printResponse.status() < 400, `Print QA page returned ${printResponse.status()}.`);
  ensure(printErrors.length === 0, `Print QA page errors: ${printErrors.join(" | ")}`);

  const printSheet = printPage.locator(".resume-preview-sheet").first();
  ensure((await printSheet.count()) === 1, "Expected exactly one print sheet on the focused QA page.");

  const printStyle = await printSheet.evaluate((element) => element.getAttribute("style") ?? "");
  ensure(printStyle.includes("min-height: 297mm"), `Print sheet is not enforcing A4 min-height. Style: ${printStyle}`);

  const printWidth = await printSheet.evaluate((element) => element.getBoundingClientRect().width);
  ensure(printWidth >= 780 && printWidth <= 810, `Print sheet width is ${printWidth}px instead of an A4-like width.`);

  await printPage.screenshot({
    path: path.join(artifactDir, "qa-template-print.png"),
    fullPage: true,
  });

  const pdfPath = path.join(artifactDir, "editor-current-template.pdf");
  await printPage.pdf({
    path: pdfPath,
    preferCSSPageSize: true,
    printBackground: true,
  });

  const pdfBuffer = fs.readFileSync(pdfPath);
  const mediaBox = extractMediaBox(pdfBuffer);

  ensure(mediaBox, "Failed to read the generated PDF MediaBox.");
  ensure(
    Math.abs(mediaBox.width - 595) < 8 && Math.abs(mediaBox.height - 842) < 8,
    `Expected an A4 MediaBox, received ${mediaBox.width} x ${mediaBox.height}.`
  );

  results.push({
    routePath: printRoute,
    printWidth,
    mediaBox,
    pdfPath,
  });

  await printPage.close();
  await browser.close();

  return {
    mode: "print",
    baseUrl: devBaseUrl,
    checkedRoutes: results,
  };
}

async function main() {
  fs.mkdirSync(artifactDir, { recursive: true });

  const summary = mode === "print" ? await runPrintQa() : await runPublicQa();
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
