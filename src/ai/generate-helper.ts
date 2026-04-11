import { ai, hasGoogleAI, hasOpenAI } from './genkit';
import { GenerateOptions } from 'genkit';

/**
 * Executes a Genkit generation with automatic provider fallback.
 * If the primary model (e.g. OpenAI) fails due to quota or capacity (429/RESOURCE_EXHAUSTED),
 * it will automatically retry using the fallback model (e.g. Gemini) if configured.
 * 
 * @param options - Standard Genkit GenerateOptions
 * @param fallbackModel - Optional identifier for the secondary model to use on failure.
 * @returns The successful generation result.
 */
export async function generateWithFallback(
  options: GenerateOptions,
  fallbackModel?: string
) {
  try {
    // Attempt primary call
    console.log(`[Genkit] Generating with model: ${options.model}`);
    return await ai.generate(options);
  } catch (error: any) {
    const isRecoverableFailure = 
      error.status === 'RESOURCE_EXHAUSTED' || 
      error.status === 'NOT_FOUND' ||
      error.message?.toLowerCase().includes('429') || 
      error.message?.toLowerCase().includes('quota') ||
      error.message?.toLowerCase().includes('not found') ||
      error.message?.toLowerCase().includes('404');

    if (isRecoverableFailure && fallbackModel && options.model !== fallbackModel) {
      console.warn(`[AI Fallback] Primary model ${options.model} failed. Attempting fallback to ${fallbackModel}...`);
      
      try {
        // Attempt fallback call
        return await ai.generate({
          ...options,
          model: fallbackModel,
        });
      } catch (fallbackError: any) {
        console.error(`[AI Fallback] BOTH primary (${options.model}) and fallback (${fallbackModel}) failed.`);
        throw fallbackError;
      }
    }

    if (isRecoverableFailure && !fallbackModel) {
      console.error(`[AI Fallback] Primary model ${options.model} failed, but no fallback key is configured. Please provide a key in .env.local to enable automatic failover.`);
    }

    // Rethrow if NO fallback available or NOT a recoverable error
    throw error;
  }
}
