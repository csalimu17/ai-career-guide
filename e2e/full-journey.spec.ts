import { test, expect } from "@playwright/test";

function buildTestEmail(projectName: string) {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const slug = projectName.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
  return `e2e+${slug}-${stamp}@example.com`;
}

async function dismissToasts(page: import("@playwright/test").Page) {
  const closeButtons = page.getByRole("button", { name: /close/i });
  const count = await closeButtons.count();
  for (let i = 0; i < Math.min(count, 3); i++) {
    await closeButtons.nth(i).click({ trial: true }).catch(() => undefined);
  }
}

async function signUp(page: import("@playwright/test").Page, email: string, password: string) {
  await page.goto("/");
  await expect(page).toHaveTitle(/AI Career Guide|AI CV Builder/i);

  const startFree = page.getByRole("link", { name: /start free/i }).first();
  if (await startFree.count()) {
    await startFree.click();
  } else {
    await page.goto("/signup");
  }

  await expect(page).toHaveURL(/\/signup/i);

  await page.getByLabel(/first name/i).fill("E2E");
  await page.getByLabel(/last name/i).fill("User");
  await page.getByLabel(/email address/i).fill(email);
  await page.getByLabel(/^password$/i).fill(password);

  await page.getByRole("button", { name: /create account/i }).click();
}

async function signIn(page: import("@playwright/test").Page, email: string, password: string) {
  await page.goto("/login");
  await expect(page).toHaveURL(/\/login/i);

  await page.getByLabel(/email address/i).fill(email);
  await page.getByLabel(/password/i).fill(password);
  await page.getByRole("button", { name: /sign in/i }).click();
}

async function completeOnboarding(page: import("@playwright/test").Page) {
  await page.waitForURL(/\/onboarding/i, { timeout: 120_000 });

  const launchButton = page.getByRole("button", { name: /launch calibration/i });
  await launchButton.click({ force: true });

  const goalButton = page.getByRole("button", { name: /get a job fast/i });
  const experienceHeading = page.getByRole("heading", { name: /level of experience/i });

  // After the launch CTA, we should land on either the goal step or the experience step (if the UI advances quickly).
  await Promise.race([
    goalButton.waitFor({ state: "visible", timeout: 30_000 }),
    experienceHeading.waitFor({ state: "visible", timeout: 30_000 }),
  ]);

  if (await goalButton.isVisible().catch(() => false)) {
    await goalButton.click({ force: true });
  }

  await expect(experienceHeading).toBeVisible();
  await page.getByRole("button", { name: /entry level/i }).click();

  await page.getByPlaceholder(/fintech|healthcare|ai/i).fill("Fintech");
  await page.getByPlaceholder(/senior frontend engineer/i).fill("Frontend Engineer");
  await page.getByRole("button", { name: /looks good/i }).click();

  await page.getByRole("combobox").filter({ hasText: /select years/i }).first().click();
  await page.getByRole("option", { name: /1 - 3 years/i }).click();

  await page.getByRole("combobox").filter({ hasText: /select status/i }).first().click();
  await page.getByRole("option", { name: /actively searching/i }).click();

  await page.getByRole("button", { name: /finish setup/i }).click();

  await page.getByRole("button", { name: /build from zero/i }).click();
}

async function assertEditorLoads(page: import("@playwright/test").Page, isMobile: boolean) {
  await page.waitForURL(/\/cv-editor/i, { timeout: 120_000 });
  await expect(page.locator("body")).not.toContainText(/Unhandled Runtime Error|Application error/i);

  if (isMobile) {
    await expect(page.getByText(/preview/i)).toBeVisible();
    await expect(page.getByText(/design/i)).toBeVisible();
  } else {
    await expect(
      page.getByRole("button", { name: /resume assistant|return to preview/i })
    ).toBeVisible();
    await expect(page.getByText(/live sync active/i)).toBeVisible();
  }
}

async function checkResumesPage(page: import("@playwright/test").Page) {
  await page.goto("/resumes");
  await expect(page.locator("body")).not.toContainText(/Unhandled Runtime Error|Application error/i);
  await expect(page.getByPlaceholder(/search cvs by name/i)).toBeVisible();
}

async function checkJobsPage(page: import("@playwright/test").Page) {
  await page.goto("/jobs");
  await expect(page.locator("body")).not.toContainText(/Unhandled Runtime Error|Application error/i);

  const shouldMockExternal = process.env.E2E_MOCK_EXTERNAL === "1";
  if (shouldMockExternal) {
    await page.route("**/api/jobs/search**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          listings: [
            {
              id: "mock-1",
              externalJobId: "mock-1",
              source: "adzuna",
              sourceUrl: "https://example.com/job/mock-1",
              company: "Mock Company",
              role: "Product Manager",
              location: "London",
              workplaceType: "hybrid",
              employmentType: "full-time",
              shortDescription: "Lead product delivery across a cross-functional squad.",
              postedLabel: "Today",
              tags: ["Mock"],
              listingOrigin: "api_search",
            },
          ],
          isStale: false,
          count: 1,
        }),
      });
    });
  }

  await page.getByPlaceholder("Role or skill...").fill("Product Manager");

  await page.getByRole("button", { name: /^search$/i }).click();

  await page.waitForTimeout(1500);
  await expect(page.locator("body")).not.toContainText(/Search failed/i);
}

async function checkAtsScan(page: import("@playwright/test").Page) {
  await page.goto("/ats");
  await expect(page.locator("body")).not.toContainText(/Unhandled Runtime Error|Application error/i);

  const shouldMockExternal = process.env.E2E_MOCK_EXTERNAL === "1";
  if (shouldMockExternal) {
    await page.route("**/api/ats/scan", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          headline: "Good match with clear keyword gaps",
          matchSummary: "Solid baseline alignment; add stakeholder and roadmap language to increase match confidence.",
          totalScore: 72,
          atsScore: 72,
          measurableImpactScore: 55,
          categories: {
            keywordMatch: 70,
            completeness: 82,
            formatting: 90,
            impact: 55,
            readability: 78,
            contactInfo: 85,
          },
          missingKeywords: ["stakeholder management", "roadmap", "OKRs"],
          matchedKeywords: ["Next.js", "React", "UI", "frontend"],
          keywordCoverage: 68,
          warnings: ["Add measurable outcomes to top bullets."],
          strengths: ["Clear tech stack alignment", "Readable structure"],
          quickWins: ["Add metrics to experience bullets", "Mirror key tooling from the JD"],
          sectionFeedback: [
            { section: "Summary", status: "needs-work", score: 62, summary: "Solid but generic.", fixes: ["Add role-specific keywords"] },
            { section: "Experience", status: "needs-work", score: 70, summary: "Good scope; add impact.", fixes: ["Add metrics"] },
            { section: "Skills", status: "strong", score: 85, summary: "Covers core tools.", fixes: [] },
            { section: "Education", status: "missing", score: 40, summary: "Not found.", fixes: ["Add education or relevant training"] },
          ],
          recommendations: [
            { title: "Quantify impact", description: "Add numbers and outcomes to top bullets.", priority: "high" },
          ],
          suggestions: [
            { title: "Quantify impact", description: "Add numbers and outcomes to top bullets.", priority: "high" },
          ],
        }),
      });
    });
  }

  await page.getByPlaceholder(/Paste your CV here/i).fill(
    "Frontend Engineer. Built React/Next.js apps, improved performance, shipped features, collaborated with design and product."
  );
  await page.getByPlaceholder(/Paste the Job Description here/i).fill(
    "We are hiring a Frontend Engineer to build Next.js features, collaborate with stakeholders, and ship high-quality UI."
  );

  await page.getByRole("button", { name: /run ats diagnostic/i }).click();

  await page.waitForTimeout(3000);
  await expect(page.locator("body")).not.toContainText(/Analysis failed/i);
  await expect(page.getByText(/match score/i)).toBeVisible();
}

test("First-time user journey works end-to-end", async ({ page, isMobile }, testInfo) => {
  testInfo.setTimeout(10 * 60 * 1000);

  const reusedEmail = process.env.E2E_EMAIL;
  const email = reusedEmail ?? buildTestEmail(testInfo.project.name);
  const password = process.env.E2E_PASSWORD ?? "Password123!";

  page.on("pageerror", (err) => {
    throw err;
  });

  if (reusedEmail) {
    await signIn(page, email, password);
  } else {
    await signUp(page, email, password);
  }

  await page.waitForURL(/\/(dashboard|onboarding|cv-editor)/i, { timeout: 120_000 });
  if (page.url().includes("/onboarding")) {
    await completeOnboarding(page);
  } else if (page.url().includes("/dashboard")) {
    await page.waitForTimeout(1500);
    if (page.url().includes("/onboarding")) {
      await completeOnboarding(page);
    }
  }

  if (!page.url().includes("/cv-editor")) {
    await page.goto("/cv-editor");
  }

  await assertEditorLoads(page, isMobile);

  await checkResumesPage(page);
  await checkJobsPage(page);
  await checkAtsScan(page);

  await dismissToasts(page);
});
