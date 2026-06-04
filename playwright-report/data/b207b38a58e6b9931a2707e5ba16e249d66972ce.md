# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: full-journey.spec.ts >> First-time user journey works end-to-end
- Location: e2e\full-journey.spec.ts:209:5

# Error details

```
TimeoutError: locator.click: Timeout 30000ms exceeded.
Call log:
  - waiting for getByRole('button', { name: /get a job fast/i })
    - locator resolved to <button class="group relative flex flex-col items-start rounded-[1.8rem] border-2 border-transparent bg-primary/[0.02] p-6 text-left transition-all hover:border-primary/50 hover:bg-primary/5">…</button>
  - attempting click action
    2 × waiting for element to be visible, enabled and stable
      - element is not stable
    - retrying click action
    - waiting 20ms
    - waiting for element to be visible, enabled and stable
    - element is not stable
  - retrying click action
    - waiting 100ms
    - waiting for element to be visible, enabled and stable
  - element was detached from the DOM, retrying

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - banner [ref=e3]:
      - generic [ref=e4]:
        - generic [ref=e5]:
          - button "Go back" [ref=e6] [cursor=pointer]:
            - img
          - button "Go forward" [disabled]:
            - img
        - generic [ref=e7]:
          - paragraph [ref=e8]: Guided setup
          - paragraph [ref=e9]: Profile calibration
    - main [ref=e10]:
      - generic [ref=e12]:
        - generic [ref=e14]:
          - heading "Career Calibration" [level=1] [ref=e16]
          - generic [ref=e21]:
            - generic [ref=e22]: Initialization
            - generic [ref=e23]: 17% Synchronized
        - generic [ref=e26]:
          - generic [ref=e27]:
            - img "Guide Mascot" [ref=e29]
            - heading "Ready to transform your career?" [level=2] [ref=e30]
            - paragraph [ref=e31]: I'll guide you through a quick setup to ensure my advice and CV optimizations are perfectly tailored to you.
          - generic [ref=e32]:
            - button "Launch calibration" [ref=e33] [cursor=pointer]:
              - text: Launch calibration
              - img
            - button "Skip to CV Upload" [ref=e34] [cursor=pointer]:
              - text: Skip to CV Upload
              - img [ref=e35]
    - region "Notifications (F8)":
      - list
  - region "Notifications (F8)":
    - list
  - alert [ref=e37]: Workspace | AI Career Guide
  - iframe [ref=e38]:
    
```

# Test source

```ts
  1   | import { test, expect } from "@playwright/test";
  2   | 
  3   | function buildTestEmail(projectName: string) {
  4   |   const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  5   |   const slug = projectName.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
  6   |   return `e2e+${slug}-${stamp}@example.com`;
  7   | }
  8   | 
  9   | async function dismissToasts(page: import("@playwright/test").Page) {
  10  |   const closeButtons = page.getByRole("button", { name: /close/i });
  11  |   const count = await closeButtons.count();
  12  |   for (let i = 0; i < Math.min(count, 3); i++) {
  13  |     await closeButtons.nth(i).click({ trial: true }).catch(() => undefined);
  14  |   }
  15  | }
  16  | 
  17  | async function signUp(page: import("@playwright/test").Page, email: string, password: string) {
  18  |   await page.goto("/");
  19  |   await expect(page).toHaveTitle(/AI Career Guide|AI CV Builder/i);
  20  | 
  21  |   const startFree = page.getByRole("link", { name: /start free/i }).first();
  22  |   if (await startFree.count()) {
  23  |     await startFree.click();
  24  |   } else {
  25  |     await page.goto("/signup");
  26  |   }
  27  | 
  28  |   await expect(page).toHaveURL(/\/signup/i);
  29  | 
  30  |   await page.getByLabel(/first name/i).fill("E2E");
  31  |   await page.getByLabel(/last name/i).fill("User");
  32  |   await page.getByLabel(/email address/i).fill(email);
  33  |   await page.getByLabel(/^password$/i).fill(password);
  34  | 
  35  |   await page.getByRole("button", { name: /create account/i }).click();
  36  | }
  37  | 
  38  | async function signIn(page: import("@playwright/test").Page, email: string, password: string) {
  39  |   await page.goto("/login");
  40  |   await expect(page).toHaveURL(/\/login/i);
  41  | 
  42  |   await page.getByLabel(/email address/i).fill(email);
  43  |   await page.getByLabel(/password/i).fill(password);
  44  |   await page.getByRole("button", { name: /sign in/i }).click();
  45  | }
  46  | 
  47  | async function completeOnboarding(page: import("@playwright/test").Page) {
  48  |   await page.waitForURL(/\/onboarding/i, { timeout: 120_000 });
  49  | 
  50  |   const launchButton = page.getByRole("button", { name: /launch calibration/i });
  51  |   await launchButton.click({ force: true });
  52  | 
  53  |   const goalButton = page.getByRole("button", { name: /get a job fast/i });
  54  |   const experienceHeading = page.getByRole("heading", { name: /level of experience/i });
  55  | 
  56  |   // After the launch CTA, we should land on either the goal step or the experience step (if the UI advances quickly).
  57  |   await Promise.race([
  58  |     goalButton.waitFor({ state: "visible", timeout: 30_000 }),
  59  |     experienceHeading.waitFor({ state: "visible", timeout: 30_000 }),
  60  |   ]);
  61  | 
  62  |   if (await goalButton.isVisible().catch(() => false)) {
> 63  |     await goalButton.click();
      |                      ^ TimeoutError: locator.click: Timeout 30000ms exceeded.
  64  |   }
  65  | 
  66  |   await expect(experienceHeading).toBeVisible();
  67  |   await page.getByRole("button", { name: /entry level/i }).click();
  68  | 
  69  |   await page.getByPlaceholder(/fintech|healthcare|ai/i).fill("Fintech");
  70  |   await page.getByPlaceholder(/senior frontend engineer/i).fill("Frontend Engineer");
  71  |   await page.getByRole("button", { name: /looks good/i }).click();
  72  | 
  73  |   await page.getByRole("combobox").filter({ hasText: /select years/i }).first().click();
  74  |   await page.getByRole("option", { name: /1 - 3 years/i }).click();
  75  | 
  76  |   await page.getByRole("combobox").filter({ hasText: /select status/i }).first().click();
  77  |   await page.getByRole("option", { name: /actively searching/i }).click();
  78  | 
  79  |   await page.getByRole("button", { name: /finish setup/i }).click();
  80  | 
  81  |   await page.getByRole("button", { name: /build from zero/i }).click();
  82  | }
  83  | 
  84  | async function assertEditorLoads(page: import("@playwright/test").Page, isMobile: boolean) {
  85  |   await page.waitForURL(/\/cv-editor/i, { timeout: 120_000 });
  86  |   await expect(page.locator("body")).not.toContainText(/Unhandled Runtime Error|Application error/i);
  87  | 
  88  |   if (isMobile) {
  89  |     await expect(page.getByText(/preview/i)).toBeVisible();
  90  |     await expect(page.getByText(/design/i)).toBeVisible();
  91  |   } else {
  92  |     await expect(
  93  |       page.getByRole("button", { name: /resume assistant|return to preview/i })
  94  |     ).toBeVisible();
  95  |     await expect(page.getByText(/live sync active/i)).toBeVisible();
  96  |   }
  97  | }
  98  | 
  99  | async function checkResumesPage(page: import("@playwright/test").Page) {
  100 |   await page.goto("/resumes");
  101 |   await expect(page.locator("body")).not.toContainText(/Unhandled Runtime Error|Application error/i);
  102 |   await expect(page.getByPlaceholder(/search cvs by name/i)).toBeVisible();
  103 | }
  104 | 
  105 | async function checkJobsPage(page: import("@playwright/test").Page) {
  106 |   await page.goto("/jobs");
  107 |   await expect(page.locator("body")).not.toContainText(/Unhandled Runtime Error|Application error/i);
  108 | 
  109 |   const shouldMockExternal = process.env.E2E_MOCK_EXTERNAL === "1";
  110 |   if (shouldMockExternal) {
  111 |     await page.route("**/api/jobs/search**", async (route) => {
  112 |       await route.fulfill({
  113 |         status: 200,
  114 |         contentType: "application/json",
  115 |         body: JSON.stringify({
  116 |           listings: [
  117 |             {
  118 |               id: "mock-1",
  119 |               externalJobId: "mock-1",
  120 |               source: "adzuna",
  121 |               sourceUrl: "https://example.com/job/mock-1",
  122 |               company: "Mock Company",
  123 |               role: "Product Manager",
  124 |               location: "London",
  125 |               workplaceType: "hybrid",
  126 |               employmentType: "full-time",
  127 |               shortDescription: "Lead product delivery across a cross-functional squad.",
  128 |               postedLabel: "Today",
  129 |               tags: ["Mock"],
  130 |               listingOrigin: "api_search",
  131 |             },
  132 |           ],
  133 |           isStale: false,
  134 |           count: 1,
  135 |         }),
  136 |       });
  137 |     });
  138 |   }
  139 | 
  140 |   await page.getByPlaceholder("Role or skill...").fill("Product Manager");
  141 | 
  142 |   await page.getByRole("button", { name: /^search$/i }).click();
  143 | 
  144 |   await page.waitForTimeout(1500);
  145 |   await expect(page.locator("body")).not.toContainText(/Search failed/i);
  146 | }
  147 | 
  148 | async function checkAtsScan(page: import("@playwright/test").Page) {
  149 |   await page.goto("/ats");
  150 |   await expect(page.locator("body")).not.toContainText(/Unhandled Runtime Error|Application error/i);
  151 | 
  152 |   const shouldMockExternal = process.env.E2E_MOCK_EXTERNAL === "1";
  153 |   if (shouldMockExternal) {
  154 |     await page.route("**/api/ats/scan", async (route) => {
  155 |       await route.fulfill({
  156 |         status: 200,
  157 |         contentType: "application/json",
  158 |         body: JSON.stringify({
  159 |           headline: "Good match with clear keyword gaps",
  160 |           matchSummary: "Solid baseline alignment; add stakeholder and roadmap language to increase match confidence.",
  161 |           totalScore: 72,
  162 |           atsScore: 72,
  163 |           measurableImpactScore: 55,
```