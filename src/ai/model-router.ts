import { db } from "@/firebase/admin";

const googleApiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY || process.env.GOOGLE_API_KEY;
const groqApiKey = process.env.GROQ_API_KEY;
const openRouterApiKey = process.env.OPENROUTER_API_KEY;

export const OPENROUTER_PLUGIN_NAMESPACE = "openrouterapi";

export const GEMINI_MODELS = {
  fast: "googleai/gemini-2.0-flash",
  reasoning: "googleai/gemini-flash-latest",
  lite: "googleai/gemini-flash-lite-latest",
} as const;

export const GROQ_MODELS = {
  fast: `groq/${process.env.GROQ_MODEL || "llama-3.1-8b-instant"}`,
  reasoning: `groq/${process.env.GROQ_MODEL || "llama-3.1-8b-instant"}`,
} as const;

export const OPENROUTER_MODELS = {
  free: `${OPENROUTER_PLUGIN_NAMESPACE}/${process.env.OPENROUTER_MODEL || "openrouter/free"}`,
} as const;

export type AiTaskCategory =
  | "default"
  | "structuredExtraction"
  | "jobResearch"
  | "careerChat"
  | "atsAnalysis"
  | "cvWriting"
  | "marketingChat";

export const CATEGORY_MODEL_MAP: Record<AiTaskCategory, string> = {
  default: GEMINI_MODELS.fast,
  structuredExtraction: GEMINI_MODELS.lite,
  jobResearch: GEMINI_MODELS.fast,
  careerChat: GEMINI_MODELS.fast,
  atsAnalysis: GEMINI_MODELS.fast,
  cvWriting: GEMINI_MODELS.fast,
  marketingChat: GEMINI_MODELS.fast,
};

export const GROQ_CATEGORY_MODEL_MAP: Record<AiTaskCategory, string> = {
  default: GROQ_MODELS.fast,
  structuredExtraction: GROQ_MODELS.fast,
  jobResearch: GROQ_MODELS.fast,
  careerChat: GROQ_MODELS.fast,
  atsAnalysis: GROQ_MODELS.fast,
  cvWriting: GROQ_MODELS.fast,
  marketingChat: GROQ_MODELS.fast,
};

export const OPENROUTER_CATEGORY_MODEL_MAP: Record<AiTaskCategory, string> = {
  default: OPENROUTER_MODELS.free,
  structuredExtraction: OPENROUTER_MODELS.free,
  jobResearch: OPENROUTER_MODELS.free,
  careerChat: OPENROUTER_MODELS.free,
  atsAnalysis: OPENROUTER_MODELS.free,
  cvWriting: OPENROUTER_MODELS.free,
  marketingChat: OPENROUTER_MODELS.free,
};

const LEGACY_MODEL_REPAIRS: Record<string, string> = {
  "googleai/gemini-1.5-flash": GEMINI_MODELS.fast,
  "googleai/gemini-1.5-pro": GEMINI_MODELS.fast,
  "googleai/gemini-pro-latest": GEMINI_MODELS.fast,
  "googleai/gemini-2.5-pro": GEMINI_MODELS.fast,
  "gemini-1.5-flash": GEMINI_MODELS.fast,
  "gemini-1.5-pro": GEMINI_MODELS.fast,
  "gemini-2.5-pro": GEMINI_MODELS.fast,
  "openrouter/free": OPENROUTER_MODELS.free,
  "llama-3.1-8b-instant": GROQ_MODELS.fast,
};

const VALID_RUNTIME_MODELS = new Set<string>([
  GEMINI_MODELS.fast,
  GEMINI_MODELS.reasoning,
  GEMINI_MODELS.lite,
  GROQ_MODELS.fast,
  GROQ_MODELS.reasoning,
  OPENROUTER_MODELS.free,
  "googleai/gemini-2.0-flash",
  "googleai/gemini-2.0-flash-lite",
  "googleai/gemini-2.0-flash-lite-001",
  "googleai/gemini-2.5-flash",
  "googleai/gemini-2.5-flash-lite",
  "googleai/gemini-3.1-flash-lite-preview",
  "gemini-2.0-flash",
  "googleai/gemini-2.0-flash-thinking-exp-01-21",
  "groq/llama-3.3-70b-versatile",
  "groq/qwen/qwen3-32b",
  `${OPENROUTER_PLUGIN_NAMESPACE}/openrouter/free`,
]);

const CONFIG_CACHE_TTL_MS = 60_000;

let cachedConfiguredModel: { value: string | null; fetchedAt: number } = {
  value: null,
  fetchedAt: 0,
};

function getModelProvider(value?: string | null) {
  if (!value) return null;
  if (value.startsWith("googleai/")) return "google";
  if (value.startsWith("groq/")) return "groq";
  if (value.startsWith(`${OPENROUTER_PLUGIN_NAMESPACE}/`)) return "openrouter";
  return null;
}

function isProviderConfigured(provider: ReturnType<typeof getModelProvider>) {
  if (provider === "google") return !!googleApiKey;
  if (provider === "groq") return !!groqApiKey;
  if (provider === "openrouter") return !!openRouterApiKey;
  return false;
}

export function isValidGeminiModel(value?: string | null): value is string {
  return typeof value === "string" && VALID_RUNTIME_MODELS.has(value);
}

export function isValidRuntimeModel(value?: string | null): value is string {
  if (typeof value !== "string") return false;
  return Boolean(normalizeConfiguredGeminiModel(value));
}

function normalizeConfiguredGeminiModel(value?: string | null) {
  if (!value) return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  if (trimmed in LEGACY_MODEL_REPAIRS) {
    return LEGACY_MODEL_REPAIRS[trimmed];
  }

  if (trimmed.startsWith("gemini-")) {
    return `googleai/${trimmed}`;
  }

  if (trimmed.startsWith("openrouter/")) {
    return `${OPENROUTER_PLUGIN_NAMESPACE}/${trimmed}`;
  }

  if (
    trimmed.startsWith("llama-") ||
    trimmed.startsWith("qwen/") ||
    trimmed.startsWith("meta-llama/") ||
    trimmed.startsWith("openai/gpt-oss")
  ) {
    return `groq/${trimmed}`;
  }

  return trimmed;
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
      value: isValidRuntimeModel(configuredModel) ? configuredModel : null,
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

function getDefaultModelForProvider(
  provider: "google" | "groq" | "openrouter",
  category: AiTaskCategory
) {
  if (provider === "google") return CATEGORY_MODEL_MAP[category];
  if (provider === "groq") return GROQ_CATEGORY_MODEL_MAP[category];
  return OPENROUTER_CATEGORY_MODEL_MAP[category];
}

export async function getGeminiModel(category: AiTaskCategory = "default"): Promise<string> {
  console.log(`[AI Model Router] Selecting model for category: ${category}`);
  console.log(`[AI Model Router] Keys: Google=${!!googleApiKey}, Groq=${!!groqApiKey}, OpenRouter=${!!openRouterApiKey}`);

  const configuredModel = await readConfiguredRuntimeModel();
  if (configuredModel) {
    const provider = getModelProvider(configuredModel);
    if (!provider || isProviderConfigured(provider)) {
      console.log(`[AI Model Router] Using configured runtime model: ${configuredModel}`);
      return configuredModel;
    }
    console.warn(`[AI Model Router] Ignoring configured model without active credentials: ${configuredModel}`);
  }

  const providerOrder: Array<"google" | "groq" | "openrouter"> = ["google", "groq", "openrouter"];
  for (const provider of providerOrder) {
    if (!isProviderConfigured(provider)) continue;
    const model = getDefaultModelForProvider(provider, category);
    console.log(`[AI Model Router] Using ${provider} model: ${model}`);
    return model;
  }

  const model = CATEGORY_MODEL_MAP[category];
  console.warn(`[AI Model Router] No free-provider keys found. Falling back to static default: ${model}`);
  return model;
}

export function getFallbackModels(category: AiTaskCategory = "default", currentModel?: string | null) {
  const fallbackCandidates = [
    CATEGORY_MODEL_MAP[category],
    GROQ_CATEGORY_MODEL_MAP[category],
    OPENROUTER_CATEGORY_MODEL_MAP[category],
  ];

  const filtered = fallbackCandidates.filter((model) => {
    if (!model || model === currentModel) return false;
    const provider = getModelProvider(model);
    return provider ? isProviderConfigured(provider) : true;
  });

  return Array.from(new Set(filtered));
}

export function getFallbackGeminiModel(category: AiTaskCategory = "default", currentModel?: string | null) {
  return getFallbackModels(category, currentModel)[0] ?? null;
}

export async function persistRuntimeModelRepair(nextModel: string, metadata?: Record<string, unknown>) {
  const normalizedModel = normalizeConfiguredGeminiModel(nextModel);
  if (!isValidRuntimeModel(normalizedModel)) {
    throw new Error(`Invalid runtime model "${nextModel}" cannot be persisted.`);
  }

  await db.collection("systemConfigs").doc("global").set(
    {
      aiModel: normalizedModel,
      aiModelAutoRepair: {
        activeModel: normalizedModel,
        repairedAt: new Date().toISOString(),
        ...metadata,
      },
    },
    { merge: true }
  );

  cachedConfiguredModel = {
    value: normalizedModel,
    fetchedAt: Date.now(),
  };
}
