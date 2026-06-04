import { AIProviderStrategy, RateLimitState, AIProviderResponse, ProviderError } from './base.strategy';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GenerateOptions } from 'genkit';

export class GeminiStrategy extends AIProviderStrategy {
  name = 'gemini';
  supportedModels = ['gemini-flash-latest', 'gemini-flash-lite-latest', 'gemini-2.0-flash', 'gemini-3.1-flash-lite-preview'];
  rateLimit = { rpm: 15, tpm: 1500000 };
  
  private genAI: GoogleGenerativeAI;

  constructor() {
    super();
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '';
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  async execute(
    prompt: string,
    options: GenerateOptions
  ): Promise<AIProviderResponse> {
    const startTime = performance.now();

    try {
      const modelName = (options.model as string)?.replace('googleai/', '') || 'gemini-2.0-flash';
      const model = this.genAI.getGenerativeModel({ 
        model: modelName,
        systemInstruction: options.system as string,
      });

      const result = await model.generateContent({
        contents: [
          {
            role: 'user',
            parts: [{ text: options.prompt as string }],
          },
        ],
        generationConfig: {
          temperature: options.config?.temperature ?? 0.7,
          topP: options.config?.topP ?? 1.0,
          maxOutputTokens: options.config?.maxOutputTokens ?? 2048,
        },
      });

      const response = result.response;
      const text = response.text() || '';
      const latency = performance.now() - startTime;
      const tokensUsed = this.estimateTokens(text);

      const inputTokens = this.estimateTokens(prompt);
      const outputTokens = this.estimateTokens(text);

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
      const model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
      const result = await model.generateContent('ping');
      return !!result.response.text();
    } catch {
      return false;
    }
  }

  parseRateLimitHeaders(headers: Record<string, string>): RateLimitState {
    // Note: Google's SDK doesn't always expose these headers easily in the response object
    // but the guide assumes they exist. We'll provide defaults if missing.
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
