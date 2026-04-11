import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { openAI } from '@genkit-ai/compat-oai/openai';
import { GEMINI_MODELS, OPENAI_MODELS } from '@/ai/model-router';

const googleApiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY;
const openaiApiKey = process.env.OPENAI_API_KEY;

// Keep the base Genkit runtime on a flexible model.
// Re-prioritized for low-cost Google Gemini strategy
export const defaultGeminiModel = googleApiKey ? GEMINI_MODELS.fast : OPENAI_MODELS.fast;
export const fastGeminiModel = googleApiKey ? GEMINI_MODELS.fast : OPENAI_MODELS.fast;
export const reasoningGeminiModel = googleApiKey ? GEMINI_MODELS.reasoning : OPENAI_MODELS.reasoning;

export const hasGoogleAI = !!googleApiKey;
export const hasOpenAI = !!openaiApiKey;

if (!googleApiKey && !openaiApiKey) {
  console.warn('[Genkit] ❌ CRITICAL: No API keys found. AI features will not work.');
} else {

  const activeKeys = [
    googleApiKey ? 'GoogleAI' : null,
    openaiApiKey ? 'OpenAI' : null
  ].filter(Boolean).join(' & ');
  console.log(`[Genkit] ✅ Initialized with: ${activeKeys}`);
}

export const ai = genkit({
  plugins: [
    ...(googleApiKey ? [googleAI({ apiKey: googleApiKey })] : []),
    ...(openaiApiKey ? [openAI({ apiKey: openaiApiKey })] : [])
  ],
  model: defaultGeminiModel,
});


