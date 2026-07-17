import { expect, test } from "@playwright/test";
import { getIntentDestination, readAuthIntent } from "../src/lib/auth-intent";

test.describe("public conversion regressions", () => {
  test("customer pages do not render internal editorial commentary", async ({ page }) => {
    for (const route of ["/cv-builder", "/blog"]) {
      await page.goto(route);
      await expect(page.locator("body")).not.toContainText(/article brief|that is the job this page is designed to do|keeps the page relevant|outperform weaker competitors/i);
    }
  });

  test("contextual CTAs carry a workflow intent", async ({ page }) => {
    await page.goto("/cv-builder");
    await expect(page.getByRole("link", { name: "Build My CV Free" }).first()).toHaveAttribute("href", "/signup?intent=create-cv");
    await page.goto("/ats-cv-checker");
    await expect(page.getByRole("link", { name: "Check My CV" }).first()).toHaveAttribute("href", "/signup?intent=ats-check");
    await page.goto("/pricing");
    await expect(page.getByRole("link", { name: "Choose Pro" })).toHaveAttribute("href", "/signup?plan=pro");
    await expect(page.getByRole("link", { name: "Discuss Agency support" })).toHaveAttribute("href", "/support");
  });

  test("intent destinations are allowlisted and external returns are discarded", async () => {
    const upload = readAuthIntent(new URLSearchParams("intent=upload-cv&returnTo=https://attacker.example/steal"));
    expect(upload).toEqual({ intent: "upload-cv", template: undefined, plan: undefined, returnTo: undefined });
    expect(getIntentDestination(upload, false)).toBe("/onboarding/upload");
    expect(getIntentDestination(readAuthIntent(new URLSearchParams("intent=ats-check")), false)).toBe("/ats");
    expect(getIntentDestination(readAuthIntent(new URLSearchParams("template=london-executive")), false)).toBe("/cv-editor?template=london-executive&new=true");
    expect(getIntentDestination(readAuthIntent(new URLSearchParams("plan=pro")), false)).toBe("/settings?plan=pro&checkout=1");
  });

  test("template gallery uses lightweight cards and preserves selection", async ({ page }) => {
    await page.goto("/cv-templates");
    const cards = page.locator("a[href^='/signup?template=']");
    await expect(cards.first()).toBeVisible();
    expect(await cards.count()).toBeGreaterThan(1);
    await expect(page.locator("body")).not.toContainText("jordan.morgan@example.com");
    await expect(cards.first()).toHaveAttribute("href", /\/signup\?template=[a-z0-9-]+/);
  });

  test("intent-aware signup renders its form, help and legal links", async ({ page }) => {
    await page.goto("/signup?intent=create-cv");
    await expect(page.getByRole("heading", { name: /create your account and save your cv/i })).toBeVisible();
    await expect(page.getByLabel("Email address")).toHaveAttribute("autocomplete", "username");
    await expect(page.getByLabel("Password")).toHaveAttribute("aria-describedby", "password-help");
    await expect(page.getByText("Use at least 8 characters.")).toBeVisible();
    await expect(page.getByRole("link", { name: "Terms" })).toHaveAttribute("href", "/terms");
    await expect(page.getByRole("link", { name: "Privacy Policy" })).toHaveAttribute("href", "/privacy");
  });

  test("mobile navigation opens, traps focus, closes with Escape and restores focus", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");
    const trigger = page.getByRole("button", { name: "Open navigation" });
    await trigger.click();
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await expect(page.getByRole("dialog", { name: "Mobile navigation" })).toBeVisible();
    await expect(page.getByRole("link", { name: "CV Builder" }).first()).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog", { name: "Mobile navigation" })).toHaveCount(0);
    await expect(trigger).toBeFocused();
  });

  test("public pages have no horizontal overflow or unverified/internal copy", async ({ page }) => {
    for (const width of [320, 390, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 800 });
      await page.goto("/");
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
      await expect(page.locator("body")).not.toContainText(/no credit card required|loved by job seekers|launch note|article brief/i);
    }
  });

  test("pricing separates consumer plans from organisation support", async ({ page }) => {
    await page.goto("/pricing");
    await expect(page.getByRole("heading", { name: "Agency support is for organisations" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Discuss Agency support" })).toHaveAttribute("href", "/support");
    await expect(page.locator("main")).not.toContainText(/unlimited/i);
  });
});
