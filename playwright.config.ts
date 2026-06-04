import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.E2E_BASE_URL ?? "http://127.0.0.1:3000";
const isCI = !!process.env.CI;

export default defineConfig({
  testDir: "./e2e",
  timeout: 8 * 60 * 1000,
  expect: { timeout: 30_000 },
  fullyParallel: false,
  workers: 1,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    actionTimeout: 30_000,
    navigationTimeout: 60_000,
  },
  webServer: baseURL.includes("127.0.0.1:3000")
    ? {
        command: "npm run build && npm run start -- -p 3000",
        url: baseURL,
        reuseExistingServer: !isCI,
        timeout: 300_000,
      }
    : undefined,
  projects: [
    {
      name: "mobile-chrome",
      use: {
        ...devices["Pixel 5"],
      },
      testIgnore: /audit\.spec\.ts/,
    },
    {
      name: "desktop-chrome",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 900 },
      },
      testIgnore: /audit\.spec\.ts/,
    },
    // ---- live audit projects (e2e/audit.spec.ts + audit.setup.ts) ----
    // Run with:
    //   E2E_BASE_URL=https://aicareerguide.uk TEST_EMAIL=... TEST_PASSWORD=... \
    //   npx playwright test --project=audit-mobile --project=audit-desktop
    // The setup project signs in once and writes e2e/.auth/user.json, then
    // both viewport projects reuse that session.
    {
      name: "audit-setup",
      testMatch: /audit\.setup\.ts/,
    },
    {
      name: "audit-mobile",
      testMatch: /audit\.spec\.ts/,
      use: {
        ...devices["iPhone 13"],
      },
      dependencies: ["audit-setup"],
    },
    {
      name: "audit-desktop",
      testMatch: /audit\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 900 },
      },
      dependencies: ["audit-setup"],
    },
  ],
});
