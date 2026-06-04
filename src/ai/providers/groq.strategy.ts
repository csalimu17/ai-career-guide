import { AIProviderStrategy, RateLimitState, AIProviderResponse, ProviderError } from './base.strategy';
import Groq from 'groq-sdk';
import { GenerateOptions } from 'genkit';

export class GroqStrategy extends AIProviderStrategy {
  name = 'groq';
  supportedModels = ['llama-3.1-8b-instant', 'llama-3.3-70b-versatile', 'qwen-2.5-32b'];
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
  ): Promise<AIProviderResponse> {
    const startTime = performance.now();

    try {
      const rawModel = options.model as string;
      const modelName = rawModel?.startsWith('groq/')
        ? rawModel.replace('groq/', '')
        : 'llama-3.1-8b-instant';
      const response = await this.client.chat.completions.create({
        model: modelName,
        messages: [
          ...(options.system ? [{
            role: 'system',
            content: options.system as string,
          } as const] : []),
          {
            role: 'user',
            content: options.prompt as string,
          } as const,
        ],
        temperature: options.config?.temperature ?? 0.7,
        top_p: options.config?.topP ?? 1.0,
        max_tokens: options.config?.maxOutputTokens ?? 2048,
      });

      const latency = performance.now() - startTime;
      const text = response.choices[0]?.message?.content || '';
      const tokensUsed =
        response.usage?.total_tokens ||
        this.estimateTokens(text);

      const inputTokens = response.usage?.prompt_tokens || this.estimateTokens(prompt);
      const outputTokens = response.usage?.completion_tokens || this.estimateTokens(text);

      return {
        text,
        provider: this.name,
        model: modelName,
        latency,
        tokensUsed: inputTokens + outputTokens,
        cost: this.calculateCost(inputTokens, outputTokens, modelName),
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
