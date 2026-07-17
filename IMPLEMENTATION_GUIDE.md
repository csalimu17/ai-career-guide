# aicareerguide.uk — Implementation Guide
## Production-Grade AI Orchestration

**Version**: 1.0  
**Phase**: Architecture Implementation  
**Target**: 4-Week Deployment

---

## Phase 1: Core Architecture Implementation (Week 1-2)

### Step 1.1: Update Environment Configuration

**File**: `.env`

```bash
# AI Provider Keys
GEMINI_API_KEY=<redacted-google-api-key>
GROQ_API_KEY=<redacted-groq-api-key>
OPENROUTER_API_KEY=<redacted-openrouter-api-key>
OLLAMA_ENDPOINT=http://localhost:11434

# Cache Configuration
UPSTASH_REDIS_URL=https://YOUR_UPSTASH_URL
CACHE_PROVIDER=upstash

# Observability
PROMETHEUS_ENDPOINT=http://localhost:9090
HELICONE_API_KEY=sk-helicone-...
LOG_LEVEL=debug

# Feature Flags
ENABLE_CACHE=true
ENABLE_FALLBACK=true
ENABLE_OBSERVABILITY=true
```

### Step 1.2: Implement Provider Strategies

**File**: `src/ai/providers/base.strategy.ts`

```typescript
import { GenerateOptions, GenerateResponse } from 'genkit';

export interface RateLimitState {
  remainingRequests: number;
  resetTime: number;
  remainingTokens: number;
  totalTokens: number;
}

export interface ProviderHealth {
  status: 'healthy' | 'degraded' | 'unavailable';
  lastCheck: number;
  failureCount: number;
  consecutiveFailures: number;
  uptimePercent: number;
  avgLatency: number;
}

export abstract class AIProviderStrategy {
  abstract name: string;
  abstract supportedModels: string[];
  abstract rateLimit: { rpm: number; tpm: number };
  
  abstract execute(
    prompt: string,
    options: GenerateOptions
  ): Promise<GenerateResponse>;
  
  abstract isHealthy(): Promise<boolean>;
  
  abstract parseRateLimitHeaders(
    headers: Record<string, string>
  ): RateLimitState;

  protected estimateTokens(text: string): number {
    // Rough estimate: 1 token ≈ 4 characters
    return Math.ceil(text.length / 4);
  }

  protected calculateCost(tokens: number, provider: string): number {
    // Free tier = $0 cost
    return 0;
  }
}

export interface GenerateResponse {
  text: string;
  provider: string;
  model: string;
  latency: number;
  tokensUsed: number;
  estimatedCost: number;
  cacheHit: boolean;
  metadata?: {
    confidence?: number;
    falloverInfo?: {
      previousProviders: string[];
      retriesAttempted: number;
    };
  };
}
```

**File**: `src/ai/providers/gemini.strategy.ts`

```typescript
import { AIProviderStrategy, RateLimitState, GenerateResponse } from './base.strategy';
import { generateContent } from '@google-cloud/generative-ai';
import { GenerateOptions } from 'genkit';

export class GeminiStrategy extends AIProviderStrategy {
  name = 'gemini';
  supportedModels = ['gemini-flash-latest', 'gemini-flash-lite-latest'];
  rateLimit = { rpm: 15, tpm: 1500000 };
  
  private apiKey: string;

  constructor() {
    super();
    this.apiKey = process.env.GEMINI_API_KEY || '';
  }

  async execute(
    prompt: string,
    options: GenerateOptions
  ): Promise<GenerateResponse> {
    const startTime = performance.now();

    try {
      const response = await generateContent({
        apiKey: this.apiKey,
        model: options.model as string,
        generationConfig: {
          temperature: options.config?.temperature ?? 0.7,
          topP: options.config?.topP ?? 1.0,
          maxOutputTokens: options.config?.maxOutputTokens ?? 1024,
        },
        systemInstruction: options.system ?? '',
        contents: [
          {
            role: 'user',
            parts: [{ text: options.prompt }],
          },
        ],
      });

      const latency = performance.now() - startTime;
      const text = response.text || '';
      const tokensUsed = this.estimateTokens(text);

      return {
        text,
        provider: this.name,
        model: options.model as string,
        latency,
        tokensUsed,
        estimatedCost: this.calculateCost(tokensUsed, this.name),
        cacheHit: false,
      };
    } catch (error: any) {
      // Re-throw with normalized error info
      throw new ProviderError(
        this.name,
        error.status || error.statusCode || 'UNKNOWN',
        error.message
      );
    }
  }

  async isHealthy(): Promise<boolean> {
    try {
      const response = await generateContent({
        apiKey: this.apiKey,
        model: 'gemini-flash-latest',
        contents: [
          {
            role: 'user',
            parts: [{ text: 'ping' }],
          },
        ],
      });
      return !!response.text;
    } catch {
      return false;
    }
  }

  parseRateLimitHeaders(headers: Record<string, string>): RateLimitState {
    return {
      remainingRequests: parseInt(
        headers['x-goog-request-quota-remaining'] ?? '-1'
      ),
      resetTime: Date.now() + 60000,
      remainingTokens: parseInt(
        headers['x-goog-token-quota-remaining'] ?? '-1'
      ),
      totalTokens: 1500000,
    };
  }
}

export class ProviderError extends Error {
  constructor(
    public provider: string,
    public status: string | number,
    message: string
  ) {
    super(`[${provider}] ${message}`);
    this.name = 'ProviderError';
  }
}
```

**File**: `src/ai/providers/groq.strategy.ts`

```typescript
import { AIProviderStrategy, RateLimitState, GenerateResponse } from './base.strategy';
import Groq from 'groq-sdk';
import { GenerateOptions } from 'genkit';

export class GroqStrategy extends AIProviderStrategy {
  name = 'groq';
  supportedModels = ['llama-3.1-8b-instant', 'llama-3.3-70b-versatile'];
  rateLimit = { rpm: 30, tpm: 1000000 };
  
  private client: Groq;

  constructor() {
    super();
    this.client = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });
  }

  async execute(
    prompt: string,
    options: GenerateOptions
  ): Promise<GenerateResponse> {
    const startTime = performance.now();

    try {
      const response = await this.client.chat.completions.create({
        model: options.model as string,
        messages: [
          {
            role: 'system',
            content: options.system || '',
          },
          {
            role: 'user',
            content: options.prompt,
          },
        ],
        temperature: options.config?.temperature ?? 0.7,
        top_p: options.config?.topP ?? 1.0,
        max_tokens: options.config?.maxOutputTokens ?? 1024,
      });

      const latency = performance.now() - startTime;
      const text = response.choices[0]?.message?.content || '';
      const tokensUsed =
        response.usage?.completion_tokens ||
        this.estimateTokens(text);

      return {
        text,
        provider: this.name,
        model: options.model as string,
        latency,
        tokensUsed,
        estimatedCost: this.calculateCost(tokensUsed, this.name),
        cacheHit: false,
      };
    } catch (error: any) {
      throw new ProviderError(
        this.name,
        error.status || error.statusCode || 'UNKNOWN',
        error.message
      );
    }
  }

  async isHealthy(): Promise<boolean> {
    try {
      await this.client.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: 'ping' }],
        max_tokens: 10,
      });
      return true;
    } catch {
      return false;
    }
  }

  parseRateLimitHeaders(headers: Record<string, string>): RateLimitState {
    return {
      remainingRequests: parseInt(
        headers['x-ratelimit-remaining-requests'] ?? '-1'
      ),
      resetTime:
        Date.now() + parseInt(headers['x-ratelimit-reset'] ?? '60') * 1000,
      remainingTokens: parseInt(
        headers['x-ratelimit-remaining-tokens'] ?? '-1'
      ),
      totalTokens: 1000000,
    };
  }
}
```

**File**: `src/ai/providers/openrouter.strategy.ts`

```typescript
import { AIProviderStrategy, RateLimitState, GenerateResponse } from './base.strategy';
import OpenAI from 'openai';
import { GenerateOptions } from 'genkit';

export class OpenRouterStrategy extends AIProviderStrategy {
  name = 'openrouter';
  supportedModels = ['openrouter/free'];
  rateLimit = { rpm: 200, tpm: 2000000 };
  
  private client: OpenAI;

  constructor() {
    super();
    this.client = new OpenAI({
      apiKey: process.env.OPENROUTER_API_KEY,
      baseURL: 'https://openrouter.ai/api/v1',
      defaultHeaders: {
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'https://aicareerguide.uk',
        'X-Title': 'AI Career Guide',
      },
    });
  }

  async execute(
    prompt: string,
    options: GenerateOptions
  ): Promise<GenerateResponse> {
    const startTime = performance.now();

    try {
      const response = await this.client.chat.completions.create({
        model: 'openrouter/free',
        messages: [
          {
            role: 'system',
            content: options.system || '',
          },
          {
            role: 'user',
            content: options.prompt,
          },
        ],
        temperature: Math.min(options.config?.temperature ?? 0.7, 1.0),
        top_p: options.config?.topP ?? 1.0,
        max_tokens: Math.min(options.config?.maxOutputTokens ?? 1024, 2000),
      });

      const latency = performance.now() - startTime;
      const text = response.choices[0]?.message?.content || '';
      const tokensUsed =
        response.usage?.completion_tokens ||
        this.estimateTokens(text);

      return {
        text,
        provider: this.name,
        model: 'openrouter/free',
        latency,
        tokensUsed,
        estimatedCost: this.calculateCost(tokensUsed, this.name),
        cacheHit: false,
      };
    } catch (error: any) {
      throw new ProviderError(
        this.name,
        error.status || error.statusCode || 'UNKNOWN',
        error.message
      );
    }
  }

  async isHealthy(): Promise<boolean> {
    try {
      await this.client.chat.completions.create({
        model: 'openrouter/free',
        messages: [{ role: 'user', content: 'ping' }],
        max_tokens: 10,
      });
      return true;
    } catch {
      return false;
    }
  }

  parseRateLimitHeaders(headers: Record<string, string>): RateLimitState {
    return {
      remainingRequests: parseInt(
        headers['x-ratelimit-limit-requests'] ?? '-1'
      ),
      resetTime: Date.now() + 60000,
      remainingTokens: parseInt(
        headers['x-ratelimit-limit-tokens'] ?? '-1'
      ),
      totalTokens: 2000000,
    };
  }
}
```

**File**: `src/ai/providers/ollama.strategy.ts`

```typescript
import { AIProviderStrategy, RateLimitState, GenerateResponse } from './base.strategy';
import { GenerateOptions } from 'genkit';

export class OllamaStrategy extends AIProviderStrategy {
  name = 'ollama';
  supportedModels = ['mistral', 'llama2'];
  rateLimit = { rpm: 100, tpm: 500000 };
  
  private endpoint: string;

  constructor() {
    super();
    this.endpoint = process.env.OLLAMA_ENDPOINT || 'http://localhost:11434';
  }

  async execute(
    prompt: string,
    options: GenerateOptions
  ): Promise<GenerateResponse> {
    const startTime = performance.now();

    try {
      const response = await fetch(`${this.endpoint}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: options.model,
          prompt: options.prompt,
          stream: false,
          template: options.system ? `${options.system}\n[INST] {{prompt}} [/INST]` : undefined,
          options: {
            temperature: options.config?.temperature ?? 0.7,
            top_p: options.config?.topP ?? 1.0,
            num_predict: options.config?.maxOutputTokens ?? 1024,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      const latency = performance.now() - startTime;
      const text = data.response || '';
      const tokensUsed = this.estimateTokens(text);

      return {
        text,
        provider: this.name,
        model: options.model as string,
        latency,
        tokensUsed,
        estimatedCost: 0, // Self-hosted = free
        cacheHit: false,
      };
    } catch (error: any) {
      throw new ProviderError(
        this.name,
        'UNKNOWN',
        error.message
      );
    }
  }

  async isHealthy(): Promise<boolean> {
    try {
      const response = await fetch(`${this.endpoint}/api/tags`);
      return response.ok;
    } catch {
      return false;
    }
  }

  parseRateLimitHeaders(): RateLimitState {
    return {
      remainingRequests: -1,
      resetTime: Infinity,
      remainingTokens: -1,
      totalTokens: -1,
    };
  }
}
```

### Step 1.3: Implement Request Coordinator

**File**: `src/ai/orchestrator/request-coordinator.ts`

```typescript
import { AIProviderStrategy, GenerateResponse, ProviderError } from '../providers/base.strategy';
import { GenerateOptions } from 'genkit';
import pino from 'pino';

const logger = pino();

export interface RequestCoordinationContext {
  requestId: string;
  timestamp: number;
  priority: 'critical' | 'high' | 'normal' | 'low';
  userId: string;
  category: string;
  retryCount: number;
  attemptedProviders: string[];
}

export class RequestCoordinator {
  private strategies: Map<string, AIProviderStrategy>;
  private circuitBreakers: Map<string, CircuitBreaker>;

  constructor(strategies: Map<string, AIProviderStrategy>) {
    this.strategies = strategies;
    this.circuitBreakers = new Map();
    
    strategies.forEach((_, provider) => {
      this.circuitBreakers.set(provider, new CircuitBreaker(provider));
    });
  }

  async execute(
    options: GenerateOptions,
    context: RequestCoordinationContext
  ): Promise<GenerateResponse> {
    const providerHierarchy = this.getProviderHierarchy();

    for (const provider of providerHierarchy) {
      if (context.attemptedProviders.includes(provider)) {
        continue;
      }

      const circuitBreaker = this.circuitBreakers.get(provider);
      if (circuitBreaker?.isOpen()) {
        logger.warn(`[Circuit Breaker] ${provider} is open, skipping`);
        continue;
      }

      try {
        const response = await this.executeWithBackoff(
          provider,
          options,
          context
        );
        
        circuitBreaker?.recordSuccess();
        return response;
      } catch (error: any) {
        circuitBreaker?.recordFailure();
        context.attemptedProviders.push(provider);
        
        logger.warn({
          msg: '[Fallback] Provider failed',
          provider,
          error: error.message,
          nextProvider: providerHierarchy[providerHierarchy.indexOf(provider) + 1],
        });

        continue;
      }
    }

    throw new Error('All providers exhausted');
  }

  private async executeWithBackoff(
    provider: string,
    options: GenerateOptions,
    context: RequestCoordinationContext,
    attempt: number = 0
  ): Promise<GenerateResponse> {
    const maxRetries = 3;

    if (attempt >= maxRetries) {
      throw new Error(`${provider} failed after ${maxRetries} attempts`);
    }

    try {
      if (attempt > 0) {
        // Exponential backoff with jitter
        const baseDelay = 100;
        const exponentialDelay = baseDelay * Math.pow(2, attempt);
        const jitter = Math.random() * exponentialDelay;
        const totalDelay = exponentialDelay + jitter;

        logger.debug({
          msg: '[Backoff] Waiting before retry',
          provider,
          attempt: attempt + 1,
          delayMs: Math.round(totalDelay),
        });

        await new Promise((resolve) => setTimeout(resolve, totalDelay));
      }

      const strategy = this.strategies.get(provider);
      if (!strategy) throw new Error(`Unknown provider: ${provider}`);

      const response = await strategy.execute(options.prompt, options);
      
      return response;
    } catch (error: any) {
      if (this.isRetryable(error) && attempt < maxRetries - 1) {
        return this.executeWithBackoff(
          provider,
          options,
          context,
          attempt + 1
        );
      }
      throw error;
    }
  }

  private getProviderHierarchy(): string[] {
    // Tier-1: Gemini > Tier-2: Groq > Tier-3: OpenRouter > Tier-4: Ollama
    return ['gemini', 'groq', 'openrouter', 'ollama'];
  }

  private isRetryable(error: any): boolean {
    if (error instanceof ProviderError) {
      const status = error.status;
      return (
        status === 429 || // Rate limit
        status === 503 || // Service unavailable
        status === 500 || // Server error
        error.message.includes('timeout')
      );
    }
    return false;
  }
}

class CircuitBreaker {
  private failureCount = 0;
  private successCount = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  private lastFailure = 0;
  private readonly failureThreshold = 5;
  private readonly resetTimeout = 60000; // 1 minute

  constructor(private provider: string) {}

  recordSuccess(): void {
    this.failureCount = 0;
    if (this.state === 'half-open') {
      this.state = 'closed';
      logger.info(`[Circuit Breaker] ${this.provider} recovered`);
    }
  }

  recordFailure(): void {
    this.failureCount++;
    this.lastFailure = Date.now();

    if (this.failureCount >= this.failureThreshold) {
      this.state = 'open';
      logger.error(`[Circuit Breaker] ${this.provider} opened after ${this.failureCount} failures`);
    }
  }

  isOpen(): boolean {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailure > this.resetTimeout) {
        this.state = 'half-open';
        this.failureCount = 0;
        logger.info(`[Circuit Breaker] ${this.provider} entering half-open state`);
        return false;
      }
      return true;
    }
    return false;
  }
}
```

---

## Phase 2: Caching Layer Implementation (Week 3-4)

### Step 2.1: Redis Cache Service

**File**: `src/ai/cache/cache.service.ts`

```typescript
import { Redis } from '@upstash/redis';
import pino from 'pino';
import crypto from 'crypto';

const logger = pino();

export interface CachedResponse {
  id: string;
  response: any;
  model: string;
  tokens: number;
  cost: number;
  timestamp: number;
  version: number;
}

export class CacheService {
  private redis: Redis;
  private readonly defaultTTL = 3600; // 1 hour

  constructor() {
    this.redis = new Redis({
      url: process.env.UPSTASH_REDIS_URL || '',
      token: process.env.UPSTASH_REDIS_TOKEN || '',
    });
  }

  async get(key: string): Promise<CachedResponse | null> {
    try {
      const cached = await this.redis.get(key);
      if (cached) {
        logger.debug({ msg: '[Cache Hit]', key });
        return JSON.parse(cached as string);
      }
      return null;
    } catch (error) {
      logger.error({ msg: '[Cache Get Error]', key, error });
      return null;
    }
  }

  async set(
    key: string,
    response: any,
    ttl: number = this.defaultTTL
  ): Promise<void> {
    try {
      const cached: CachedResponse = {
        id: key,
        response,
        model: response.model,
        tokens: response.tokensUsed,
        cost: response.estimatedCost,
        timestamp: Date.now(),
        version: 1,
      };

      await this.redis.setex(
        key,
        ttl,
        JSON.stringify(cached)
      );

      logger.debug({ msg: '[Cache Set]', key, ttl });
    } catch (error) {
      logger.error({ msg: '[Cache Set Error]', key, error });
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.redis.del(key);
      logger.debug({ msg: '[Cache Delete]', key });
    } catch (error) {
      logger.error({ msg: '[Cache Delete Error]', key, error });
    }
  }

  async deletePattern(pattern: string): Promise<void> {
    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
        logger.debug({ msg: '[Cache Delete Pattern]', pattern, count: keys.length });
      }
    } catch (error) {
      logger.error({ msg: '[Cache Delete Pattern Error]', pattern, error });
    }
  }

  generateKey(
    prompt: string,
    model: string,
    category: string,
    contextHash?: string
  ): string {
    const normalized = prompt.toLowerCase().trim();
    const components = [normalized, model, category, contextHash || '0'];
    const hash = crypto
      .createHash('sha256')
      .update(components.join('|'))
      .digest('hex')
      .slice(0, 16);

    return `cache:${hash}`;
  }
}
```

### Step 2.2: Golden Prompts Catalog

**File**: `src/ai/cache/golden-prompts.ts`

```typescript
export interface GoldenPrompt {
  id: string;
  category: string;
  template: string;
  frequency: number;
  avgTokens: number;
  avgLatency: number;
  cacheTTL: number;
  priority: 'high' | 'medium' | 'low';
  description: string;
}

export const GOLDEN_PROMPTS: GoldenPrompt[] = [
  {
    id: 'gp_001_cv_bullet_improvement',
    category: 'cvWriting',
    template: 'Improve this CV bullet point using STAR method: "{bullet}"',
    frequency: 150,
    avgTokens: 250,
    avgLatency: 450,
    cacheTTL: 604800, // 7 days
    priority: 'high',
    description: 'CV bullet optimization',
  },
  {
    id: 'gp_002_role_title_classifier',
    category: 'jobResearch',
    template: 'Classify this job title and infer role requirements: "{jobTitle}"',
    frequency: 200,
    avgTokens: 400,
    avgLatency: 600,
    cacheTTL: 604800,
    priority: 'high',
    description: 'Job title classification',
  },
  {
    id: 'gp_003_interview_prep_star',
    category: 'careerChat',
    template: 'Generate a STAR-format response for: "{question}"',
    frequency: 120,
    avgTokens: 600,
    avgLatency: 800,
    cacheTTL: 259200,
    priority: 'high',
    description: 'Interview prep STAR method',
  },
  {
    id: 'gp_004_ats_score_analysis',
    category: 'atsAnalysis',
    template: 'Score this CV for ATS compatibility: "{cvContent}"',
    frequency: 100,
    avgTokens: 350,
    avgLatency: 700,
    cacheTTL: 604800,
    priority: 'high',
    description: 'ATS compatibility scoring',
  },
];

export const CACHE_TTL_POLICIES: Record<string, number> = {
  default: 3600,
  structuredExtraction: 86400,
  jobResearch: 172800,
  careerChat: 1800,
  atsAnalysis: 604800,
  cvWriting: 86400,
  marketingChat: 3600,
};

export function getCacheTTL(category: string): number {
  return CACHE_TTL_POLICIES[category] || CACHE_TTL_POLICIES.default;
}

export function identifyGoldenPrompt(prompt: string): GoldenPrompt | undefined {
  return GOLDEN_PROMPTS.find((gp) =>
    prompt.includes(gp.template.split('{')[0])
  );
}
```

---

## Phase 3: Observability Implementation (Week 5-6)

### Step 3.1: Prometheus Metrics

**File**: `src/ai/observability/metrics.ts`

```typescript
import { register, Counter, Histogram, Gauge } from 'prom-client';

export const aiRequestsTotal = new Counter({
  name: 'ai_requests_total',
  help: 'Total AI requests by provider and model',
  labelNames: ['provider', 'model', 'status', 'category'],
});

export const aiRequestLatency = new Histogram({
  name: 'ai_request_latency_ms',
  help: 'Request latency in milliseconds',
  labelNames: ['provider'],
  buckets: [10, 50, 100, 200, 500, 1000, 2000, 5000],
});

export const aiTokensUsed = new Counter({
  name: 'ai_tokens_used_total',
  help: 'Total tokens consumed',
  labelNames: ['provider', 'model'],
});

export const aiCostTotal = new Counter({
  name: 'ai_cost_usd_total',
  help: 'Total cost in USD',
  labelNames: ['provider'],
});

export const aiCacheHits = new Counter({
  name: 'ai_cache_hits_total',
  help: 'Cache hit count',
  labelNames: ['category'],
});

export const aiFailoverEvents = new Counter({
  name: 'ai_fallover_events_total',
  help: 'Number of fallover events',
  labelNames: ['from_provider', 'to_provider', 'success'],
});

export const aiProviderAvailability = new Gauge({
  name: 'ai_provider_availability',
  help: 'Provider availability percentage',
  labelNames: ['provider'],
});

export function recordRequest(
  provider: string,
  model: string,
  status: 'success' | 'failure',
  category: string
): void {
  aiRequestsTotal.inc({ provider, model, status, category });
}

export function recordLatency(provider: string, latency: number): void {
  aiRequestLatency.observe({ provider }, latency);
}

export function recordTokens(provider: string, model: string, tokens: number): void {
  aiTokensUsed.inc({ provider, model }, tokens);
}

export function recordCost(provider: string, cost: number): void {
  aiCostTotal.inc({ provider }, cost);
}

export function recordCacheHit(category: string): void {
  aiCacheHits.inc({ category });
}

export function recordFailover(
  fromProvider: string,
  toProvider: string,
  success: boolean
): void {
  aiFailoverEvents.inc({
    from_provider: fromProvider,
    to_provider: toProvider,
    success: success ? 'true' : 'false',
  });
}

export function setProviderAvailability(provider: string, availability: number): void {
  aiProviderAvailability.set({ provider }, availability);
}

export function getMetrics(): string {
  return register.metrics();
}
```

### Step 3.2: Metrics Endpoint

**File**: `src/app/api/metrics/route.ts`

```typescript
import { getMetrics } from '@/ai/observability/metrics';

export async function GET() {
  try {
    const metrics = getMetrics();
    return new Response(metrics, {
      headers: {
        'Content-Type': 'text/plain; version=0.0.4',
      },
    });
  } catch (error) {
    return new Response('Error collecting metrics', { status: 500 });
  }
}
```

---

## Deployment Instructions

### Pre-Deployment Checklist

```bash
# 1. Install dependencies
npm install groq-sdk openai @upstash/redis prom-client pino

# 2. Set environment variables
export GEMINI_API_KEY="<redacted-google-api-key>"
export GROQ_API_KEY="<redacted-groq-api-key>"
export OPENROUTER_API_KEY="<redacted-openrouter-api-key>"
export UPSTASH_REDIS_URL="<YOUR_UPSTASH_URL>"

# 3. Build
npm run build

# 4. Test
npm run test

# 5. Deploy
npm run deploy
```

### Testing the Implementation

```bash
# Health check all providers
curl http://localhost:3000/api/health/models

# Get Prometheus metrics
curl http://localhost:3000/api/metrics

# Test fallover manually
curl -X POST http://localhost:3000/api/test/fallover
```

---

**Next Phase**: Performance Testing & Hardening (Week 7-8)
