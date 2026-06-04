import { getAi, hasGoogleAI, hasOpenAI } from './genkit';
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
  fallbackModel?: string | string[]
) {
  try {
    // Attempt primary call
    console.log(`[Genkit] Generating with model: ${options.model}`);
    return await getAi().generate(options);
  } catch (error: any) {
    const isRecoverableFailure = 
      error.status === 'RESOURCE_EXHAUSTED' || 
      error.status === 'UNAVAILABLE' ||
      error.status === 'NOT_FOUND' ||
      error.message?.toLowerCase().includes('429') || 
      error.message?.toLowerCase().includes('503') ||
      error.message?.toLowerCase().includes('quota') ||
      error.message?.toLowerCase().includes('unavailable') ||
      error.message?.toLowerCase().includes('service unavailable') ||
      error.message?.toLowerCase().includes('not found') ||
      error.message?.toLowerCase().includes('404');

    const fallbackModels = (Array.isArray(fallbackModel) ? fallbackModel : fallbackModel ? [fallbackModel] : [])
      .filter(Boolean)
      .filter((model, index, all) => all.indexOf(model) === index)
      .filter((model) => model !== options.model);

    if (isRecoverableFailure && fallbackModels.length > 0) {
      let lastError: any = error;

      for (const model of fallbackModels) {
        console.warn(`[AI Fallback] Primary model ${options.model} failed. Attempting fallback to ${model}...`);
        try {
          return await getAi().generate({
            ...options,
            model,
          });
        } catch (fallbackError: any) {
          lastError = fallbackError;
          console.error(`[AI Fallback] Fallback model ${model} failed.`);
        }
      }

      console.error(`[AI Fallback] All models failed. Primary: ${options.model}. Fallbacks: ${fallbackModels.join(", ")}.`);
      throw lastError;
    }

    if (isRecoverableFailure && fallbackModels.length === 0) {
      console.error(`[AI Fallback] Primary model ${options.model} failed, but no fallback key is configured. Please provide a key in .env.local to enable automatic failover.`);
    }

    // Rethrow if NO fallback available or NOT a recoverable error
    throw error;
  }
}
