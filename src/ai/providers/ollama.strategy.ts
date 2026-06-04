import { AIProviderStrategy, RateLimitState, AIProviderResponse, ProviderError } from './base.strategy';
import { GenerateOptions } from 'genkit';

export class OllamaStrategy extends AIProviderStrategy {
  name = 'ollama';
  supportedModels = ['mistral', 'llama3', 'qwen2.5'];
  rateLimit = { rpm: 100, tpm: 500000 };
  
  private endpoint: string;

  constructor() {
    super();
    this.endpoint = process.env.OLLAMA_ENDPOINT || 'http://localhost:11434';
  }

  async execute(
    prompt: string,
    options: GenerateOptions
  ): Promise<AIProviderResponse> {
    const startTime = performance.now();

    try {
      const modelName = options.model as string || 'mistral';
      const response = await fetch(`${this.endpoint}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: modelName,
          prompt: options.prompt,
          stream: false,
          system: options.system as string,
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
      const inputTokens = this.estimateTokens(prompt);
      const outputTokens = this.estimateTokens(text);

      return {
        text,
        provider: this.name,
        model: modelName,
        latency,
        tokensUsed: inputTokens + outputTokens,
        cost: 0, // Self-hosted = free
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
