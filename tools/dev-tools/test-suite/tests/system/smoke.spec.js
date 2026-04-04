/**
 * Smoke test for AI Career Guide.
 * Verifies site reachability and core metadata.
 */

const { test, expect } = require('@playwright/test');

test('Site is reachable and has correct title', async ({ page }) => {
  const url = process.env.NEXT_PUBLIC_APP_URL || 'https://aicareerguide.uk';
  
  // Set a generous timeout for the first load (to allow for cold starts)
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  
  // Check title
  await expect(page).toHaveTitle(/AI Career Guide/i);
  
  // Check for the logo text
  const logoText = page.locator('text=AiCareerGuide.');
  await expect(logoText).toBeVisible();
});

test('Icons and OpenGraph images are accessible', async ({ page }) => {
  const url = process.env.NEXT_PUBLIC_APP_URL || 'https://aicareerguide.uk';
  
  const iconUrls = [
    '/icon',
    '/apple-icon',
    '/opengraph-image'
  ];

  for (const path of iconUrls) {
    const response = await page.goto(`${url}${path}`);
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toMatch(/image\//);
  }
});
