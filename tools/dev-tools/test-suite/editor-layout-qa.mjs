import fs from "node:fs";
import path from "node:path";
import process from "node:process";

import { chromium } from "playwright";

const baseUrl = process.env.QA_BASE_URL ?? "http://127.0.0.1:3001";
const artifactDir = path.join(process.cwd(), "qa_second_pass");

function ensure(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function main() {
  fs.mkdirSync(artifactDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const routePath = "/qa/editor-shell";
  const page = await browser.newPage({
    viewport: { width: 1600, height: 1100 },
  });

  const response = await page.goto(`${baseUrl}${routePath}`, {
    waitUntil: "domcontentloaded",
    timeout: 60000,
  });
  await page.waitForTimeout(3000);

  ensure(response, `No response received for ${routePath}.`);
  ensure(response.status() < 400, `Expected ${routePath} to return < 400, received ${response.status()}.`);

  const bodyText = await page.locator("body").innerText();
  ensure(!/Application error|Unhandled Runtime Error/i.test(bodyText), `Detected runtime error copy on ${routePath}.`);

  const tabs = await page.locator('[role="tab"]').allInnerTexts();
  ensure(tabs.some((tab) => /Preview/i.test(tab)), "Preview tab is missing.");
  ensure(tabs.some((tab) => /Templates/i.test(tab)), "Templates tab is missing.");
  ensure(tabs.some((tab) => /Theme/i.test(tab)), "Theme tab is missing.");

  const layout = await page.evaluate(() => {
    const nav = document.querySelector("aside.w-20");
    const main = document.querySelector("main");
    const asides = Array.from(document.querySelectorAll("aside"));
    const designPane = asides[asides.length - 1];

    return {
      navWidth: nav ? nav.getBoundingClientRect().width : 0,
      mainWidth: main ? main.getBoundingClientRect().width : 0,
      designPaneWidth: designPane ? designPane.getBoundingClientRect().width : 0,
    };
  });

  ensure(layout.mainWidth > 0 && layout.designPaneWidth > 0, "Editor split panes were not detected.");
  ensure(
    Math.abs(layout.mainWidth - layout.designPaneWidth) < 24,
    `Expected near-equal editor and preview widths, received ${layout.mainWidth}px and ${layout.designPaneWidth}px.`
  );

  await page.getByRole("tab", { name: /Templates/i }).click();
  await page.waitForTimeout(500);
  const hasTemplateStudio = await page.locator("text=Template studio").isVisible();
  ensure(hasTemplateStudio, "Template studio panel did not render.");

  await page.getByRole("tab", { name: /Theme/i }).click();
  await page.waitForTimeout(500);
  const hasStyleControls = await page.locator("text=Style controls").isVisible();
  ensure(hasStyleControls, "Theme panel did not render style controls.");

  await page.getByRole("tab", { name: /Preview/i }).click();
  await page.waitForTimeout(500);

  const previewCard = page.locator("text=Live preview").first();
  ensure((await previewCard.count()) === 1, "Preview card was not found.");

  await page.screenshot({
    path: path.join(artifactDir, "editor-layout-desktop.png"),
    fullPage: true,
  });

  console.log(
    JSON.stringify(
      {
        routePath,
        status: response.status(),
        layout,
        tabs,
      },
      null,
      2
    )
  );

  await browser.close();
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
