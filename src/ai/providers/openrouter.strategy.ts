import { AIProviderStrategy, RateLimitState, AIProviderResponse, ProviderError } from './base.strategy';
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
  ): Promise<AIProviderResponse> {
    const startTime = performance.now();

    try {
      const rawModel = options.model as string;
      const modelName = rawModel?.startsWith('openrouterapi/')
        ? rawModel.replace('openrouterapi/', '')
        : 'openrouter/auto';

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
        temperature: Math.min(options.config?.temperature ?? 0.7, 1.0),
        top_p: options.config?.topP ?? 1.0,
        max_tokens: Math.min(options.config?.maxOutputTokens ?? 2048, 4000),
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
