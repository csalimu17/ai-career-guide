# AI Model Fallback System Setup Guide

## Overview

This guide enables seamless failover across three AI providers (Google Gemini, Groq, OpenRouter) to ensure 99.5% uptime and operational continuity during provider outages.

---

## Phase 1: Provision Secondary API Keys

### 1.1 Groq API Key Setup

1. Visit https://console.groq.com/keys
2. Create a new API key or copy an existing one
3. Store securely (do not commit to repository)
4. Add to `.env`:
   ```bash
   GROQ_API_KEY=gsk_...
   ```

### 1.2 OpenRouter API Key Setup

1. Visit https://openrouter.ai/settings/keys
2. Create a new API key
3. Add to `.env`:
   ```bash
   OPENROUTER_API_KEY=sk-or-v1-...
   ```

### 1.3 Firebase Service Account Setup

**Purpose**: Enable runtime model override persistence in Firestore

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your Firebase project
3. Navigate to **Service Accounts** (Project Settings → Service Accounts)
4. Click "Generate New Private Key"
5. Download the JSON file to secure location
6. Add environment variable:
   ```bash
   GOOGLE_APPLICATION_CREDENTIALS=/absolute/path/to/firebase-key.json
   ```

---

## Phase 2: Verify Configuration

### 2.1 Create Validation Script

Create `scripts/validate-ai-config.ts`:

```typescript
import { getAi } from '@/ai/genkit';
import { getGeminiModel, getFallbackGeminiModel, CATEGORY_MODEL_MAP } from '@/ai/model-router';

type ValidationResult = {
  provider: string;
  model: string;
  status: 'healthy' | 'error';
  message: string;
};

async function validateProvider(model: string): Promise<ValidationResult> {
  try {
    const ai = getAi();
    const response = await ai.generate({
      model,
      config: { temperature: 0 },
      prompt: 'Respond with only: OK',
    });
    
    if (response.text.includes('OK')) {
      return {
        provider: model.split('/')[0],
        model,
        status: 'healthy',
        message: `✅ ${model} responding correctly`,
      };
    }
  } catch (error) {
    return {
      provider: model.split('/')[0],
      model,
      status: 'error',
      message: `❌ ${model}: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
  
  return {
    provider: model.split('/')[0],
    model,
    status: 'error',
    message: `❌ ${model}: Unexpected response format`,
  };
}

export async function validateAiConfiguration() {
  console.log('\n=== AI Provider Configuration Validation ===\n');
  
  const primaryModel = await getGeminiModel('default');
  const fallbackModel = getFallbackGeminiModel('default');
  
  console.log(`Primary Model: ${primaryModel}`);
  console.log(`Fallback Model: ${fallbackModel || 'NONE (⚠️ NO REDUNDANCY)'}\n`);
  
  const modelsToTest = [
    primaryModel,
    ...(fallbackModel ? [fallbackModel] : []),
    ...Object.values(CATEGORY_MODEL_MAP).filter(m => m !== primaryModel && m !== fallbackModel),
  ];
  
  const results: ValidationResult[] = [];
  
  for (const model of modelsToTest) {
    const result = await validateProvider(model);
    results.push(result);
    console.log(result.message);
  }
  
  const healthy = results.filter(r => r.status === 'healthy');
  const failed = results.filter(r => r.status === 'error');
  
  console.log(`\n=== Summary ===`);
  console.log(`Healthy Providers: ${healthy.length}`);
  console.log(`Failed Providers: ${failed.length}`);
  
  if (healthy.length < 2) {
    console.error('\n❌ CRITICAL: Less than 2 providers operational. Fallback system disabled.');
    process.exit(1);
  }
  
  console.log('\n✅ All providers operational. Fallback system active.');
  return true;
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  validateAiConfiguration().catch(console.error);
}
```

### 2.2 Run Validation

```bash
npx tsx scripts/validate-ai-config.ts
```

**Expected Output** (with all keys configured):
```
=== AI Provider Configuration Validation ===

Primary Model: googleai/gemini-flash-latest
Fallback Model: groq/llama-3.1-8b-instant

✅ googleai/gemini-flash-latest responding correctly
✅ groq/llama-3.1-8b-instant responding correctly

=== Summary ===
Healthy Providers: 2
Failed Providers: 0

✅ All providers operational. Fallback system active.
```

---

## Phase 3: Test Failover Logic

### 3.1 Create Failover Test Script

Create `scripts/test-failover.ts`:

```typescript
import { runAiRuntimeHandshake, getAiRuntimeStatusSummary } from '@/ai/runtime-health';

async function testFailoverSystem() {
  console.log('\n=== AI Failover System Test ===\n');
  
  // Test 1: Normal operation
  console.log('Test 1: Normal Operation');
  const normalResult = await runAiRuntimeHandshake({ allowRepair: false });
  console.log(`Status: ${normalResult.status}`);
  console.log(`Active Model: ${normalResult.activeModel}`);
  console.log(`Response: "${normalResult.response}"\n`);
  
  if (normalResult.status !== 'success') {
    console.error('❌ Primary model failed even without repair enabled');
    return;
  }
  
  // Test 2: With repair enabled
  console.log('Test 2: Failover with Repair Enabled');
  const repairResult = await runAiRuntimeHandshake({ allowRepair: true });
  console.log(`Status: ${repairResult.status}`);
  console.log(`Active Model: ${repairResult.activeModel}`);
  console.log(`Repaired: ${repairResult.repaired}`);
  console.log(`Repair Summary: ${repairResult.repairSummary}\n`);
  
  // Test 3: Runtime status
  console.log('Test 3: Runtime Status Summary');
  const status = await getAiRuntimeStatusSummary();
  console.log(`Configured Model: ${status.configuredModel}`);
  console.log(`Fallback Model: ${status.fallbackModel}\n`);
  
  if (status.fallbackModel) {
    console.log('✅ Failover system active and operational');
  } else {
    console.log('❌ No fallback model available');
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  testFailoverSystem().catch(console.error);
}
```

### 3.2 Run Failover Test

```bash
npx tsx scripts/test-failover.ts
```

---

## Phase 4: Monitor Failover Events

### 4.1 Add Health Check Endpoint

Create `src/app/api/health/models/route.ts`:

```typescript
import { runAiRuntimeHandshake } from '@/ai/runtime-health';

export async function GET() {
  try {
    const result = await runAiRuntimeHandshake({ allowRepair: true });
    
    return Response.json(
      {
        status: result.status,
        configuredModel: result.configuredModel,
        activeModel: result.activeModel,
        repaired: result.repaired,
        error: result.error,
      },
      {
        status: result.status === 'success' || result.status === 'repaired' ? 200 : 503,
      }
    );
  } catch (error) {
    return Response.json(
      {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
```

### 4.2 Monitor Endpoint

```bash
# Check health every 30 seconds
while true; do
  curl -s http://localhost:3000/api/health/models | jq .
  sleep 30
done
```

---

## Phase 5: Deployment Validation

### 5.1 Pre-Deployment Checklist

```bash
# 1. Verify all API keys configured
echo "Checking API keys..."
[ -n "$GEMINI_API_KEY" ] && echo "✅ GEMINI_API_KEY" || echo "❌ GEMINI_API_KEY missing"
[ -n "$GROQ_API_KEY" ] && echo "✅ GROQ_API_KEY" || echo "❌ GROQ_API_KEY missing"
[ -n "$OPENROUTER_API_KEY" ] && echo "✅ OPENROUTER_API_KEY" || echo "❌ OPENROUTER_API_KEY missing"
[ -n "$GOOGLE_APPLICATION_CREDENTIALS" ] && echo "✅ GOOGLE_APPLICATION_CREDENTIALS" || echo "❌ GOOGLE_APPLICATION_CREDENTIALS missing"

# 2. Run validation
npx tsx scripts/validate-ai-config.ts

# 3. Run failover tests
npx tsx scripts/test-failover.ts

# 4. Build and verify
npm run build
```

### 5.2 Post-Deployment Verification

1. **Test in staging environment**:
   ```bash
   curl -X GET https://staging.example.com/api/health/models
   ```

2. **Monitor for 24 hours**:
   - Track model selection decisions
   - Verify no unexpected failovers
   - Check fallback metrics

3. **Document baseline metrics**:
   - Primary provider success rate
   - Average response time per provider
   - Failover frequency

---

## Phase 6: Runtime Model Override

### 6.1 Manual Model Switch

Use the admin diagnostics endpoint to switch models at runtime:

```bash
curl -X POST http://localhost:3000/api/diagnostics/extraction \
  -H "Content-Type: application/json" \
  -d '{
    "action": "switch_model",
    "model": "groq/llama-3.3-70b-versatile",
    "reason": "Primary model quota exhausted"
  }'
```

### 6.2 Automatic Repair Triggers

The system automatically repairs models when it detects:
- **Service Unavailable (503)**: Temporary rate limiting
- **Quota Exceeded**: Provider hit rate/quota limits
- **Resource Exhausted**: Model overloaded
- **Not Found (404)**: Model deprecated or renamed
- **Rate Limit (429)**: Too many requests

---

## Troubleshooting

### Issue: "Fallback Model: null"

**Cause**: No secondary API keys configured

**Solution**:
1. Verify `GROQ_API_KEY` and `OPENROUTER_API_KEY` are set
2. Ensure values are not empty strings or "undefined"
3. Run validation script to confirm key validity

### Issue: "Could not load default credentials"

**Cause**: Firebase Admin SDK cannot authenticate

**Solution**:
1. Set `GOOGLE_APPLICATION_CREDENTIALS` to service account JSON path
2. Verify service account has Firestore permissions
3. Check JSON file is readable and valid

### Issue: Provider model not responding

**Cause**: Model name mismatch or deprecation

**Solution**:
1. Check model availability on provider dashboard
2. Update model name in `src/ai/model-router.ts`
3. Run validation to confirm new model works

---

## Configuration Reference

### Model Router (src/ai/model-router.ts)

Update model names as providers deprecate old versions:

```typescript
export const GEMINI_MODELS = {
  fast: "googleai/gemini-flash-latest",      // Update on deprecation
  reasoning: "googleai/gemini-flash-latest",
  lite: "googleai/gemini-flash-lite-latest",
} as const;

export const GROQ_MODELS = {
  fast: `groq/${process.env.GROQ_MODEL || "llama-3.3-70b-versatile"}`,
  reasoning: `groq/${process.env.GROQ_MODEL || "llama-3.3-70b-versatile"}`,
} as const;

export const OPENROUTER_MODELS = {
  free: `${OPENROUTER_PLUGIN_NAMESPACE}/${process.env.OPENROUTER_MODEL || "openrouter/free"}`,
} as const;
```

### Genkit Configuration (src/ai/genkit.ts)

Provider initialization happens automatically based on env vars:

```typescript
const plugins: any[] = [];

// Google always initialized
plugins.push(googleAI({ apiKey: effectiveGoogleKey }));

// Groq added if key exists
if (!isStaleEnv(groqApiKey)) {
  plugins.push(
    openAICompatible({
      name: 'groq',
      apiKey: groqApiKey!,
      baseURL: 'https://api.groq.com/openai/v1',
    })
  );
}

// OpenRouter added if key exists
if (!isStaleEnv(openRouterApiKey)) {
  plugins.push(
    openAICompatible({
      name: OPENROUTER_PLUGIN_NAMESPACE,
      apiKey: openRouterApiKey!,
      baseURL: 'https://openrouter.ai/api/v1',
      defaultHeaders: {
        'HTTP-Referer': openRouterReferer,
        'X-Title': openRouterTitle,
      },
    })
  );
}
```

---

## Success Criteria

- ✅ All three providers configured and validated
- ✅ Fallback model available and responding
- ✅ Health endpoint returning 200
- ✅ Failover test script completes without errors
- ✅ Runtime configuration stored in Firestore
- ✅ No errors in server logs related to provider initialization

---

## Next Steps

1. Provision API keys for Groq and OpenRouter
2. Configure Firebase service account
3. Run validation scripts
4. Deploy to staging
5. Monitor for 24 hours
6. Deploy to production
7. Set up monitoring alerts for provider health

---

**Last Updated**: 2026-04-25  
**Version**: 1.0
