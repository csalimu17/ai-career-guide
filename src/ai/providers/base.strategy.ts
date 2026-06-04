import { GenerateOptions } from 'genkit';

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
  ): Promise<AIProviderResponse>;
  
  abstract isHealthy(): Promise<boolean>;
  
  abstract parseRateLimitHeaders(
    headers: Record<string, string>
  ): RateLimitState;

  protected estimateTokens(text: string): number {
    // Rough estimate: 1 token ≈ 4 characters
    return Math.ceil(text.length / 4);
  }

  protected calculateCost(
    inputTokens: number,
    outputTokens: number,
    model: string
  ): number {
    const pricing: Record<string, { input: number; output: number }> = {
      'gemini-1.5-flash': { input: 0.000000075, output: 0.0000003 },
      'gemini-1.5-pro': { input: 0.0000035, output: 0.0000105 },
      'llama-3.1-70b-versatile': { input: 0.00000059, output: 0.00000079 },
      'llama-3.3-70b-specdec': { input: 0.00000059, output: 0.00000099 },
      'gpt-3.5-turbo': { input: 0.0000005, output: 0.0000015 },
    };

    const modelPricing = pricing[model] || { input: 0, output: 0 };
    return inputTokens * modelPricing.input + outputTokens * modelPricing.output;
  }
}

export interface AIProviderResponse {
  text: string;
  provider: string;
  model: string;
  latency: number;
  tokensUsed: number;
  cost: number;
  cacheHit: boolean;
  metadata?: {
    confidence?: number;
    falloverInfo?: {
      previousProviders: string[];
      retriesAttempted: number;
    };
  };
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
