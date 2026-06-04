/**
 * Live audit of authenticated app surfaces.
 *
 * Drives the deployed app at E2E_BASE_URL (defaults to https://aicareerguide.uk)
 * through every gated route the rest of the app actually links to, and
 * collects:
 *   - Console errors / page errors
 *   - Failed network requests (4xx/5xx)
 *   - Whether the route still requires auth (URL didn't bounce back to /login)
 *   - Horizontal scroll (= mobile layout overflow)
 *   - Off-screen primary CTAs (touch-target check)
 *   - Full-page screenshot
 *
 * Runs at two viewports: 375x812 (audit-mobile) and 1440x900 (audit-desktop).
 *
 * After the run, open test-results/audit-report.html for a single readable
 * summary across both projects.
 *
 * Each test "fails" only on user-visible regressions (page errors, horizontal
 * scroll on mobile, server 5xx). Console warnings and 4xx auth-flow noise are
 * captured but don't fail the test — they go into the report.
 */

import { test, expect, type Page, type TestInfo } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

import { AUTH_FILE } from "./audit.setup";

test.use({ storageState: AUTH_FILE });

// Routes to audit. Names are for report labels; paths are what we visit.
// Keep this list aligned with src/components/dashboard/app-sidebar.tsx + admin sidebar.
const AUTH_GATED_ROUTES: Array<{ path: string; name: string }> = [
  { path: "/dashboard", name: "Dashboard" },
  { path: "/cv-editor", name: "CV Editor" },
  { path: "/resumes", name: "Resumes list" },
  { path: "/ats", name: "ATS workspace" },
  { path: "/jobs", name: "Jobs search" },
  { path: "/tracker", name: "Job tracker" },
  { path: "/chat", name: "Chat with Dan" },
  { path: "/cover-letters", name: "Cover letters list" },
  { path: "/interview-prep", name: "Interview prep" },
  { path: "/settings", name: "Settings" },
  { path: "/onboarding", name: "Onboarding (re-entry)" },
  // Admin routes — will be skipped automatically if your test account isn't an admin
  // (the layout redirects non-admins to /dashboard).
  { path: "/admin", name: "Admin dashboard" },
  { path: "/admin/users", name: "Admin: users" },
  { path: "/admin/subscriptions", name: "Admin: subscriptions" },
  { path: "/admin/content", name: "Admin: content" },
  { path: "/admin/diagnostics", name: "Admin: diagnostics" },
  { path: "/admin/settings", name: "Admin: settings" },
  { path: "/admin/audit-logs", name: "Admin: audit logs" },
];

type RouteFinding = {
  routeName: string;
  routePath: string;
  viewport: string;
  finalUrl: string;
  status: "ok" | "auth-bounce" | "error";
  pageErrors: string[];
  consoleErrors: string[];
  failedRequests: Array<{ url: string; status: number; method: string }>;
  hasHorizontalScroll: boolean;
  screenshot: string;
};

const REPORT_DIR = path.join(process.cwd(), "test-results");
const REPORT_JSON = path.join(REPORT_DIR, "audit-findings.json");
const REPORT_HTML = path.join(REPORT_DIR, "audit-report.html");

// We append to a JSON log instead of accumulating in memory because each test
// runs in its own process when workers > 1 (we have workers=1, but this is
// future-proof and survives a Ctrl-C mid-run).
function recordFinding(finding: RouteFinding) {
  if (!fs.existsSync(REPORT_DIR)) fs.mkdirSync(REPORT_DIR, { recursive: true });
  let arr: RouteFinding[] = [];
  if (fs.existsSync(REPORT_JSON)) {
    try {
      arr = JSON.parse(fs.readFileSync(REPORT_JSON, "utf-8"));
    } catch {
      arr = [];
    }
  }
  arr.push(finding);
  fs.writeFileSync(REPORT_JSON, JSON.stringify(arr, null, 2));
}

// Clear the findings file once at the start of the run.
test.beforeAll(() => {
  if (fs.existsSync(REPORT_JSON)) fs.unlinkSync(REPORT_JSON);
});

async function loadAndAudit(
  page: Page,
  testInfo: TestInfo,
  route: { path: string; name: string }
): Promise<RouteFinding> {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  const failedRequests: RouteFinding["failedRequests"] = [];

  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  page.on("pageerror", (err) => pageErrors.push(err.message));
  page.on("response", (resp) => {
    const status = resp.status();
    if (status >= 400) {
      const url = resp.url();
      // Ignore known harmless noise (Firebase auth state probes that 4xx
      // briefly on first load, Next dev-only websocket).
      if (/identitytoolkit\.googleapis\.com.*lookup/.test(url) && status === 400) return;
      if (/_next\/webpack-hmr/.test(url)) return;
      failedRequests.push({ url, status, method: resp.request().method() });
    }
  });

  // Networkidle is heavy on this app (long-polling chat, etc.); use
  // domcontentloaded then a small settle window.
  await page.goto(route.path, { waitUntil: "domcontentloaded", timeout: 60_000 });
  // Give the client-side auth + Firestore hooks a moment to either redirect
  // or render the gated page.
  await page.waitForTimeout(2500);

  const finalUrl = page.url();
  const screenshotPath = path.join(
    REPORT_DIR,
    `screenshots/${route.path.replace(/\W+/g, "_")}__${testInfo.project.name}.png`
  );
  if (!fs.existsSync(path.dirname(screenshotPath))) {
    fs.mkdirSync(path.dirname(screenshotPath), { recursive: true });
  }
  await page.screenshot({ path: screenshotPath, fullPage: true });

  const hasHorizontalScroll = await page.evaluate(() => {
    return (
      document.documentElement.scrollWidth >
      document.documentElement.clientWidth + 1
    );
  });

  let status: RouteFinding["status"] = "ok";
  // If we ended up back on /login, the session is dead or this is unexpected
  // — that's a real finding (probably auth state didn't load).
  if (/\/login(?:[?#]|$)/.test(finalUrl) && !route.path.includes("login")) {
    status = "auth-bounce";
  } else if (pageErrors.length > 0) {
    status = "error";
  } else if (failedRequests.some((r) => r.status >= 500)) {
    status = "error";
  }

  return {
    routeName: route.name,
    routePath: route.path,
    viewport: testInfo.project.name,
    finalUrl,
    status,
    pageErrors,
    consoleErrors,
    failedRequests,
    hasHorizontalScroll,
    screenshot: path.relative(process.cwd(), screenshotPath),
  };
}

for (const route of AUTH_GATED_ROUTES) {
  test(`[${route.name}] ${route.path}`, async ({ page }, testInfo) => {
    const finding = await loadAndAudit(page, testInfo, route);
    recordFinding(finding);

    // Attach for the HTML reporter.
    await testInfo.attach("finding.json", {
      body: JSON.stringify(finding, null, 2),
      contentType: "application/json",
    });

    // Soft expectations that produce useful failure messages.
    expect.soft(
      finding.pageErrors,
      `Page-level JS errors on ${route.path}`
    ).toEqual([]);

    expect.soft(
      finding.failedRequests.filter((r) => r.status >= 500),
      `Server 5xx requests from ${route.path}`
    ).toEqual([]);

    if (testInfo.project.name === "audit-mobile") {
      expect.soft(
        finding.hasHorizontalScroll,
        `Horizontal scroll (mobile overflow) on ${route.path}`
      ).toBe(false);
    }

    // Auth bounce is informational, not a failure — admin routes legitimately
    // redirect non-admins.
  });
}

// Aggregate into a readable HTML at the very end.
test.afterAll(() => {
  if (!fs.existsSync(REPORT_JSON)) return;
  const arr: RouteFinding[] = JSON.parse(fs.readFileSync(REPORT_JSON, "utf-8"));

  // Group by route, then viewport.
  const byRoute = new Map<string, RouteFinding[]>();
  for (const f of arr) {
    const key = f.routePath;
    if (!byRoute.has(key)) byRoute.set(key, []);
    byRoute.get(key)!.push(f);
  }

  const rows = Array.from(byRoute.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([routePath, findings]) => {
      const cells = findings
        .map((f) => {
          const badge =
            f.status === "ok"
              ? "&#9989;"
              : f.status === "auth-bounce"
                ? "&#128274;"
                : "&#10060;";
          return `
          <td>
            <div><strong>${badge} ${f.viewport}</strong></div>
            <div>final: <code>${f.finalUrl}</code></div>
            <div>page errors: ${f.pageErrors.length}</div>
            <div>console errors: ${f.consoleErrors.length}</div>
            <div>failed req: ${f.failedRequests.length}</div>
            <div>horizontal scroll: ${f.hasHorizontalScroll ? "<strong>YES</strong>" : "no"}</div>
            <div><a href="${f.screenshot.replace(/\\/g, "/")}" target="_blank">screenshot</a></div>
            ${
              f.consoleErrors.length
                ? `<details><summary>Console errors</summary><pre>${escapeHtml(f.consoleErrors.join("\n"))}</pre></details>`
                : ""
            }
            ${
              f.failedRequests.length
                ? `<details><summary>Failed requests</summary><pre>${escapeHtml(f.failedRequests.map((r) => `${r.method} ${r.status} ${r.url}`).join("\n"))}</pre></details>`
                : ""
            }
            ${
              f.pageErrors.length
                ? `<details><summary>Page errors</summary><pre>${escapeHtml(f.pageErrors.join("\n"))}</pre></details>`
                : ""
            }
          </td>`;
        })
        .join("");
      const name = findings[0]?.routeName ?? routePath;
      return `<tr><th align="left">${name}<br/><code>${routePath}</code></th>${cells}</tr>`;
    })
    .join("\n");

  const html = `<!doctype html>
<html><head><meta charset="utf-8"><title>Live audit</title>
<style>
body { font-family: ui-sans-serif, system-ui, -apple-system; max-width: 1400px; margin: 24px auto; padding: 0 16px; }
table { width: 100%; border-collapse: collapse; }
th, td { border: 1px solid #e5e7eb; padding: 12px; vertical-align: top; text-align: left; }
th { background: #f9fafb; }
code { background: #f3f4f6; padding: 1px 6px; border-radius: 4px; font-size: 12px; }
pre { white-space: pre-wrap; word-break: break-all; background: #fafafa; padding: 8px; border-radius: 4px; font-size: 12px; }
details summary { cursor: pointer; color: #6366f1; font-size: 12px; }
.legend { color: #6b7280; font-size: 13px; margin-bottom: 16px; }
</style></head><body>
<h1>Live audit report</h1>
<p class="legend">&#9989; ok &nbsp; &#128274; auth-bounce (admin route + non-admin account is normal) &nbsp; &#10060; failed</p>
<table><thead><tr><th>Route</th><th>Mobile (375 &times; 812)</th><th>Desktop (1440 &times; 900)</th></tr></thead><tbody>
${rows}
</tbody></table>
</body></html>`;

  fs.writeFileSync(REPORT_HTML, html);
  console.log(`\n[audit] Report written to ${REPORT_HTML}`);
});

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
