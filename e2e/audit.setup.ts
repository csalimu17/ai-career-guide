/**
 * Auth setup for the live audit spec.
 *
 * Runs ONCE as a Playwright "setup" project, signs into aicareerguide.uk (or
 * whichever E2E_BASE_URL points at) with email/password, and saves the
 * resulting browser storage so all the actual audit tests can reuse the
 * session without re-authenticating.
 *
 * Usage:
 *   E2E_BASE_URL=https://aicareerguide.uk \
 *   TEST_EMAIL=... \
 *   TEST_PASSWORD=... \
 *   npx playwright test --project=audit-mobile --project=audit-desktop
 *
 * The setup project runs first because audit-mobile / audit-desktop declare
 * `dependencies: ['audit-setup']` in playwright.config.ts.
 */

import { test as setup } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const AUTH_DIR = path.join(__dirname, ".auth");
const AUTH_FILE = path.join(AUTH_DIR, "user.json");

setup("authenticate", async ({ page }) => {
  const email = process.env.TEST_EMAIL;
  const password = process.env.TEST_PASSWORD;

  if (!email || !password) {
    throw new Error(
      "Missing TEST_EMAIL / TEST_PASSWORD. Set them in your shell or .env before running:\n" +
        "  export TEST_EMAIL='you@example.com'\n" +
        "  export TEST_PASSWORD='...'"
    );
  }

  // Open the login page and submit the form. The selectors are based on the
  // current login-page-client.tsx (Email + Password inputs + Sign in button).
  await page.goto("/login");
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.getByRole("button", { name: /sign in/i }).click();

  // The login page redirects via router.replace once the Firestore profile
  // settles. Wait for any non-login URL.
  await page.waitForURL((url) => !url.pathname.endsWith("/login"), {
    timeout: 45_000,
  });

  // Make sure the dir exists, then snapshot the auth state.
  if (!fs.existsSync(AUTH_DIR)) fs.mkdirSync(AUTH_DIR, { recursive: true });
  await page.context().storageState({ path: AUTH_FILE });
  console.log(`[audit.setup] Saved session to ${AUTH_FILE}`);
});

export { AUTH_FILE };
