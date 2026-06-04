import "server-only";

import { getAi } from "@/ai/genkit";
import {
  getConfiguredRuntimeModel,
  getFallbackGeminiModel,
  getGeminiModel,
  persistRuntimeModelRepair,
} from "@/ai/model-router";

export type RuntimeHandshakeResult = {
  status: "success" | "repaired" | "error";
  configuredModel: string;
  activeModel: string | null;
  response: string | null;
  error: string | null;
  repaired: boolean;
  repairSummary: string | null;
};

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return typeof error === "string" ? error : "Unknown runtime error";
}

function isRecoverableModelFailure(message: string) {
  return /(resource_exhausted|quota|429|rate limit|rate_limits|too many requests|not found|unsupported model)/i.test(message);
}

async function performHandshake(model: string) {
  const response = await getAi().generate({
    model,
    config: { temperature: 0 },
    prompt: 'Say "System Operational" if you can hear me.',
  });

  return response.text;
}

export async function runAiRuntimeHandshake(options?: { allowRepair?: boolean }): Promise<RuntimeHandshakeResult> {
  const configuredModel = await getGeminiModel("default");

  try {
    const response = await performHandshake(configuredModel);
    return {
      status: "success",
      configuredModel,
      activeModel: configuredModel,
      response,
      error: null,
      repaired: false,
      repairSummary: null,
    };
  } catch (error) {
    const primaryError = getErrorMessage(error);

    if (!options?.allowRepair || !isRecoverableModelFailure(primaryError)) {
      return {
        status: "error",
        configuredModel,
        activeModel: null,
        response: null,
        error: primaryError,
        repaired: false,
        repairSummary: null,
      };
    }

    const fallbackModel = getFallbackGeminiModel("default");

    if (!fallbackModel || fallbackModel === configuredModel) {
      return {
        status: "error",
        configuredModel,
        activeModel: null,
        response: null,
        error: primaryError,
        repaired: false,
        repairSummary: null,
      };
    }

    try {
      const fallbackResponse = await performHandshake(fallbackModel);
      await persistRuntimeModelRepair(fallbackModel, {
        previousModel: configuredModel,
        reason: primaryError,
        source: "governance_diagnostics",
      });

      return {
        status: "repaired",
        configuredModel: fallbackModel,
        activeModel: fallbackModel,
        response: fallbackResponse,
        error: primaryError,
        repaired: true,
        repairSummary: `Primary model failed, so runtime was switched to ${fallbackModel} for stability.`,
      };
    } catch (fallbackError) {
      const fallbackMessage = getErrorMessage(fallbackError);
      return {
        status: "error",
        configuredModel,
        activeModel: null,
        response: null,
        error: `${primaryError}\nFallback ${fallbackModel} also failed: ${fallbackMessage}`,
        repaired: false,
        repairSummary: null,
      };
    }
  }
}

export async function getAiRuntimeStatusSummary() {
  const configuredModel = (await getConfiguredRuntimeModel()) ?? (await getGeminiModel("default"));
  const fallbackModel = getFallbackGeminiModel("default");

  return {
    configuredModel,
    fallbackModel,
  };
}
