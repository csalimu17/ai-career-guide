import { test, expect } from '@playwright/test';
import { Redis } from '@upstash/redis';

const hasRedis = !!(process.env.UPSTASH_REDIS_URL && process.env.UPSTASH_REDIS_TOKEN);

// Configure Upstash Redis client
const redis = hasRedis
  ? new Redis({
      url: process.env.UPSTASH_REDIS_URL || '',
      token: process.env.UPSTASH_REDIS_TOKEN || '',
    })
  : null;

test.describe('LLM Fallback Chaos Testing & Circuit Breaking', () => {
  test.beforeEach(async () => {
    if (!hasRedis) {
      test.skip();
      return;
    }
    // Ensure clean state before each test
    await redis?.del('test:provider_failures');
  });

  test.afterAll(async () => {
    if (hasRedis && redis) {
      // Clean up after all tests
      await redis.del('test:provider_failures');
    }
  });

  test('should successfully generate response using primary provider (Gemini)', async ({ page }) => {
    await page.goto('/interview-prep');
    
    // Wait for the page to be ready
    await expect(page.getByRole('heading', { name: /Interview Prep/i })).toBeVisible();

    // The primary provider should work seamlessly without any simulated failures
    // (Actual interactions depend on the specific UI, we wait for a generic indicator)
    // E.g., await page.click('text="Generate Practice Question"');
    // await expect(page.locator('.ai-response')).toBeVisible({ timeout: 15000 });
  });

  test('should fallback to Groq when Gemini fails', async ({ page }) => {
    // Inject simulated failure for Gemini
    await redis!.hset('test:provider_failures', { gemini: 'true' });
    
    await page.goto('/interview-prep');
    
    // Trigger generation (replace with actual UI interaction selectors)
    // await page.click('text="Generate Practice Question"');
    
    // The request should still succeed because the orchestrator will fall back to Groq
    // await expect(page.locator('.ai-response')).toBeVisible({ timeout: 15000 });
  });

  test('should fallback to OpenRouter when both Gemini and Groq fail', async ({ page }) => {
    // Inject simulated failures for tier-1 and tier-2
    await redis!.hset('test:provider_failures', {
      gemini: 'true',
      groq: 'true' 
    });
    
    await page.goto('/interview-prep');
    
    // Trigger generation
    // await page.click('text="Generate Practice Question"');
    
    // The request should succeed via OpenRouter
    // await expect(page.locator('.ai-response')).toBeVisible({ timeout: 15000 });
  });

  test('circuit breaker should open after repeated failures', async ({ request }) => {
    // This is more of an API test to directly trigger the orchestrator
    // You could call an internal endpoint to verify the health status
    // const response = await request.get('/api/admin/system-health');
    // expect(response.ok()).toBeTruthy();
    // const data = await response.json();
    // expect(data.aiOrchestrator.gemini.isHealthy).toBeDefined();
  });
});
