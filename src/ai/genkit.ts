import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { GEMINI_MODELS } from '@/ai/model-router';

const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY;

// Keep the base Genkit runtime on the stable fast model. Flows can opt into a configured model explicitly.
export const defaultGeminiModel = GEMINI_MODELS.fast;
export const fastGeminiModel = GEMINI_MODELS.fast;
export const reasoningGeminiModel = GEMINI_MODELS.reasoning;

if (!apiKey) {
  console.warn('[Genkit] WARNING: No API key found (GEMINI_API_KEY). AI features may fail.');
} else {
  console.log(`[Genkit] Initialized with API Key of length: ${apiKey.length}`);
}

export const ai = genkit({
  plugins: [
    googleAI({ apiKey })
  ],
  model: defaultGeminiModel,
});
