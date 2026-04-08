import "server-only";

import { db } from "@/firebase/admin";

export const GEMINI_MODELS = {
  fast: "googleai/gemini-2.5-flash",
  reasoning: "googleai/gemini-2.5-pro",
} as const;

export type AiTaskCategory =
  | "default"
  | "structuredExtraction"
  | "jobResearch"
  | "careerChat"
  | "atsAnalysis"
  | "cvWriting";

const CATEGORY_MODEL_MAP: Record<AiTaskCategory, string> = {
  default: GEMINI_MODELS.reasoning,
  structuredExtraction: GEMINI_MODELS.fast,
  jobResearch: GEMINI_MODELS.reasoning,
  careerChat: GEMINI_MODELS.reasoning,
  atsAnalysis: GEMINI_MODELS.reasoning,
  cvWriting: GEMINI_MODELS.reasoning,
};

const VALID_GEMINI_MODELS = new Set<string>(Object.values(GEMINI_MODELS));
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

async function readConfiguredRuntimeModel(forceRefresh = false) {
  const now = Date.now();
  if (!forceRefresh && now - cachedConfiguredModel.fetchedAt < CONFIG_CACHE_TTL_MS) {
    return cachedConfiguredModel.value;
  }

  try {
    const snapshot = await db.collection("systemConfigs").doc("global").get();
    const configuredModel = snapshot.exists ? snapshot.data()?.aiModel : null;
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
  if (!isReasoningCategory(category)) {
    return CATEGORY_MODEL_MAP[category];
  }

  const configuredModel = await readConfiguredRuntimeModel();
  return configuredModel ?? CATEGORY_MODEL_MAP[category];
}

export function getFallbackGeminiModel(category: AiTaskCategory = "default") {
  if (!isReasoningCategory(category)) {
    return CATEGORY_MODEL_MAP[category];
  }

  return GEMINI_MODELS.fast;
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
