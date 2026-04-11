import "server-only";

import { db } from "@/firebase/admin";

export const GEMINI_MODELS = {
  fast: "googleai/gemini-1.5-flash",
  reasoning: "googleai/gemini-1.5-pro",
  lite: "googleai/gemini-2.5-flash-lite",
} as const;


export const OPENAI_MODELS = {
  fast: "openai/gpt-4o-mini",
  reasoning: "openai/gpt-4o",
} as const;

export type AiTaskCategory =
  | "default"
  | "structuredExtraction"
  | "jobResearch"
  | "careerChat"
  | "atsAnalysis"
  | "cvWriting"
  | "marketingChat";


const CATEGORY_MODEL_MAP: Record<AiTaskCategory, string> = {
  default: GEMINI_MODELS.reasoning,
  structuredExtraction: GEMINI_MODELS.fast,
  jobResearch: GEMINI_MODELS.fast,
  careerChat: GEMINI_MODELS.fast,
  atsAnalysis: GEMINI_MODELS.fast,
  cvWriting: GEMINI_MODELS.fast,
  marketingChat: GEMINI_MODELS.fast,
};


const OPENAI_CATEGORY_MODEL_MAP: Record<AiTaskCategory, string> = {
  default: OPENAI_MODELS.reasoning,
  structuredExtraction: OPENAI_MODELS.fast,
  jobResearch: OPENAI_MODELS.reasoning,
  careerChat: OPENAI_MODELS.reasoning,
  atsAnalysis: OPENAI_MODELS.reasoning,
  cvWriting: OPENAI_MODELS.reasoning,
  marketingChat: OPENAI_MODELS.fast,
};


const LEGACY_GEMINI_MODEL_REPAIRS: Record<string, string> = {
  "googleai/gemini-1.5-flash": GEMINI_MODELS.fast,
  "googleai/gemini-1.5-pro": GEMINI_MODELS.reasoning,
};

const VALID_GEMINI_MODELS = new Set<string>([
  GEMINI_MODELS.fast,
  GEMINI_MODELS.reasoning,
  GEMINI_MODELS.lite,
  "googleai/gemini-2.0-flash",
  "googleai/gemini-2.0-flash-lite",
  "googleai/gemini-2.0-flash-lite-001",
  "googleai/gemini-2.5-flash-lite",
  "googleai/gemini-2.5-pro",
]);
const CONFIG_CACHE_TTL_MS = 60_000;

let cachedConfiguredModel: { value: string | null; fetchedAt: number } = {
  value: null,
  fetchedAt: 0,
};

function isReasoningCategory(category: AiTaskCategory) {
  return category !== "structuredExtraction";
}

export function isValidGeminiModel(value?: string | null): value is string {
  return typeof value === "string" && VALID_GEMINI_MODELS.has(value);
}

function normalizeConfiguredGeminiModel(value?: string | null) {
  if (!value) return null;
  return LEGACY_GEMINI_MODEL_REPAIRS[value] ?? value;
}

async function readConfiguredRuntimeModel(forceRefresh = false) {
  const now = Date.now();
  if (!forceRefresh && now - cachedConfiguredModel.fetchedAt < CONFIG_CACHE_TTL_MS) {
    return cachedConfiguredModel.value;
  }

  try {
    const snapshot = await db.collection("systemConfigs").doc("global").get();
    const configuredModel = normalizeConfiguredGeminiModel(snapshot.exists ? snapshot.data()?.aiModel : null);
    cachedConfiguredModel = {
      value: isValidGeminiModel(configuredModel) ? configuredModel : null,
      fetchedAt: now,
    };
  } catch (error) {
    console.error("[AI Model Router] Failed to read runtime model override:", error);
    cachedConfiguredModel = {
      value: null,
      fetchedAt: now,
    };
  }

  return cachedConfiguredModel.value;
}

export async function getConfiguredRuntimeModel(forceRefresh = false) {
  return readConfiguredRuntimeModel(forceRefresh);
}

export async function getGeminiModel(category: AiTaskCategory = "default"): Promise<string> {
  const openaiApiKey = process.env.OPENAI_API_KEY;
  const googleApiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY;

  // Prioritize Gemini for cost efficiency if available
  if (googleApiKey) {
    const configuredModel = await readConfiguredRuntimeModel();
    if (configuredModel && isValidGeminiModel(configuredModel)) {
      return configuredModel;
    }
    return CATEGORY_MODEL_MAP[category];
  }

  // Fallback to OpenAI only if Gemini is not configured
  if (openaiApiKey) {
    return OPENAI_CATEGORY_MODEL_MAP[category];
  }

  // Final fallback to default mapping (might fail if no keys, but keeps logic solid)
  return CATEGORY_MODEL_MAP[category];
}

export function getFallbackGeminiModel(category: AiTaskCategory = "default") {
  const openaiApiKey = process.env.OPENAI_API_KEY;
  const googleApiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY;

  if (googleApiKey) {
    const primaryModel = CATEGORY_MODEL_MAP[category];

    if (primaryModel === GEMINI_MODELS.fast) {
      return GEMINI_MODELS.lite;
    }

    if (primaryModel === GEMINI_MODELS.reasoning) {
      return GEMINI_MODELS.fast;
    }

    if (primaryModel === GEMINI_MODELS.lite) {
      return openaiApiKey ? OPENAI_CATEGORY_MODEL_MAP[category] : null;
    }
  }

  if (openaiApiKey) {
    return null;
  }

  return null;
}

export async function persistRuntimeModelRepair(nextModel: string, metadata?: Record<string, unknown>) {
  if (!isValidGeminiModel(nextModel)) {
    throw new Error(`Invalid Gemini model "${nextModel}" cannot be persisted.`);
  }

  await db.collection("systemConfigs").doc("global").set(
    {
      aiModel: nextModel,
      aiModelAutoRepair: {
        activeModel: nextModel,
        repairedAt: new Date().toISOString(),
        ...metadata,
      },
    },
    { merge: true }
  );

  cachedConfiguredModel = {
    value: nextModel,
    fetchedAt: Date.now(),
  };
}
