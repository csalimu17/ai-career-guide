import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { openAICompatible } from '@genkit-ai/compat-oai';
import { GEMINI_MODELS, GROQ_MODELS, OPENROUTER_MODELS, OPENROUTER_PLUGIN_NAMESPACE } from '@/ai/model-router';

const googleApiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY || process.env.GOOGLE_API_KEY;
const groqApiKey = process.env.GROQ_API_KEY;
const openRouterApiKey = process.env.OPENROUTER_API_KEY;
const openRouterReferer = process.env.OPENROUTER_HTTP_REFERER || process.env.NEXT_PUBLIC_APP_URL || 'https://aicareerguide.uk';
const openRouterTitle = process.env.OPENROUTER_APP_NAME || 'AI Career Guide';

export const hasGoogleAI = !!googleApiKey;
export const hasGroqAI = !!groqApiKey;
export const hasOpenRouterAI = !!openRouterApiKey;
export const hasAnyAiProvider = hasGoogleAI || hasGroqAI || hasOpenRouterAI;

export const defaultGeminiModel = hasGoogleAI
  ? GEMINI_MODELS.fast
  : hasGroqAI
    ? GROQ_MODELS.fast
    : OPENROUTER_MODELS.free;
export const fastGeminiModel = defaultGeminiModel;
export const reasoningGeminiModel = hasGoogleAI
  ? GEMINI_MODELS.reasoning
  : hasGroqAI
    ? GROQ_MODELS.reasoning
    : OPENROUTER_MODELS.free;

if (!hasAnyAiProvider) {
  console.warn('[Genkit] No Gemini, Groq, or OpenRouter credentials found. AI features will not work.');
}

const isServer = typeof window === 'undefined';

let aiInstance: any = null;

const isStaleEnv = (val?: string) => !val || val === 'undefined' || val === 'null' || val === '';

export const getAi = () => {
  if (!isServer) {
    throw new Error('Genkit cannot be used on the client side.');
  }

  if (aiInstance) return aiInstance;

  const effectiveGoogleKey = isStaleEnv(googleApiKey) ? 'dummy-key-for-init' : googleApiKey;
  const plugins: any[] = [googleAI({ apiKey: effectiveGoogleKey })];

  if (!isStaleEnv(groqApiKey)) {
    plugins.push(
      openAICompatible({
        name: 'groq',
        apiKey: groqApiKey!,
        baseURL: 'https://api.groq.com/openai/v1',
      })
    );
  }

  if (!isStaleEnv(openRouterApiKey)) {
    plugins.push(
      openAICompatible({
        name: OPENROUTER_PLUGIN_NAMESPACE,
        apiKey: openRouterApiKey!,
        baseURL: 'https://openrouter.ai/api/v1',
        defaultHeaders: {
          'HTTP-Referer': openRouterReferer,
          'X-Title': openRouterTitle,
        },
      })
    );
  }

  aiInstance = genkit({
    plugins,
    model: defaultGeminiModel,
  });

  return aiInstance;
};
