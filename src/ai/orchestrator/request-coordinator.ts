import { AIProviderStrategy, AIProviderResponse, ProviderError } from '../providers/base.strategy';
import { GenerateOptions } from 'genkit';
import { CacheService } from '../cache/cache.service';
import { Redis } from '@upstash/redis';
import pino from 'pino';

const logger = pino();

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL || '',
  token: process.env.UPSTASH_REDIS_TOKEN || '',
});

export interface RequestCoordinationContext {
  requestId: string;
  timestamp: number;
  priority: 'critical' | 'high' | 'normal' | 'low';
  userId: string;
  userTier: string;
  category: string;
  retryCount: number;
  attemptedProviders: string[];
}

export class RequestCoordinator {
  private strategies: Map<string, AIProviderStrategy>;
  private circuitBreakers: Map<string, CircuitBreaker>;
  private cacheService: CacheService;

  constructor(strategies: Map<string, AIProviderStrategy>) {
    this.strategies = strategies;
    this.circuitBreakers = new Map();
    this.cacheService = new CacheService();
    
    strategies.forEach((_, provider) => {
      this.circuitBreakers.set(provider, new CircuitBreaker(provider));
    });
  }

  async execute(
    options: GenerateOptions,
    context: RequestCoordinationContext
  ): Promise<AIProviderResponse> {
    const promptString = typeof options.prompt === 'string' ? options.prompt : JSON.stringify(options.prompt);
    const cacheKey = this.cacheService.generateKey(promptString, 'orchestrator', context.category);
    
    // Check Cache
    const cachedResponse = await this.cacheService.get(cacheKey);
    if (cachedResponse) {
      logger.info({ msg: '[Orchestrator Cache Hit]', cacheKey });
      return {
        text: cachedResponse.response,
        model: cachedResponse.model,
        tokensUsed: cachedResponse.tokens,
        cost: cachedResponse.cost,
        latency: 0,
        cacheHit: true,
        provider: 'cache'
      };
    }

    const providerHierarchy = this.getProviderHierarchy();

    for (const provider of providerHierarchy) {
      if (context.attemptedProviders.includes(provider)) {
        continue;
      }

      const circuitBreaker = this.circuitBreakers.get(provider);
      
      // Check for simulated failure (test-only; skip if Redis is unavailable)
      let isSimulatedFailure: string | null = null;
      try {
        isSimulatedFailure = await redis.hget('test:provider_failures', provider);
      } catch {
        // Redis unreachable — treat as no simulated failure
      }
      if (isSimulatedFailure === 'true') {
        logger.warn(`[Simulation] Forced failure for ${provider}`);
        continue;
      }

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

        // Save to cache
        await this.cacheService.set(cacheKey, response);

        return response;
      } catch (error: any) {
        circuitBreaker?.recordFailure();
        context.attemptedProviders.push(provider);
        
        logger.warn({
          msg: '[Fallback] Provider failed',
          provider,
          error: error.message,
          nextProvider: providerHierarchy[providerHierarchy.indexOf(provider) + 1] || 'NONE',
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
  ): Promise<AIProviderResponse> {
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

      // We need to pass the prompt string as the first argument as per base strategy definition
      const response = await strategy.execute(options.prompt as string, options);
      
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
    // If it's a generic error but message contains timeout or rate limit, retry
    const msg = error.message?.toLowerCase() || '';
    return msg.includes('timeout') || msg.includes('rate limit') || msg.includes('too many requests');
  }

  getHealthStatuses(): Record<string, any> {
    const statuses: Record<string, any> = {};
    this.circuitBreakers.forEach((cb, provider) => {
      statuses[provider] = {
        state: cb.getState(),
        failureCount: cb.getFailureCount(),
        isHealthy: !cb.isOpen(),
      };
    });
    return statuses;
  }
}

class CircuitBreaker {
  private failureCount = 0;
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

  getState(): 'closed' | 'open' | 'half-open' {
    return this.state;
  }

  getFailureCount(): number {
    return this.failureCount;
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
