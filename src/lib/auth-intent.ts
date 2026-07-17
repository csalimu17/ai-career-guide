import { TEMPLATES } from "@/lib/templates-config";

export const AUTH_INTENT_STORAGE_KEY = "aicg.auth-intent.v1";

export type AuthIntent = {
  intent?: "create-cv" | "upload-cv" | "ats-check";
  template?: string;
  plan?: "pro" | "master";
  returnTo?: string;
};

const VALID_INTENTS = new Set(["create-cv", "upload-cv", "ats-check"]);
const VALID_PLANS = new Set(["pro", "master"]);
const VALID_TEMPLATES = new Set(TEMPLATES.map((template) => template.id));
const ALLOWED_RETURN_PATHS = [
  "/dashboard",
  "/onboarding",
  "/onboarding/upload",
  "/cv-editor",
  "/ats",
  "/resumes",
  "/jobs",
  "/tracker",
  "/cover-letters",
  "/interview-prep",
  "/settings",
];

export function getSafeReturnPath(value: string | null | undefined): string | undefined {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return undefined;
  try {
    const url = new URL(value, "https://aicareerguide.uk");
    if (url.origin !== "https://aicareerguide.uk") return undefined;
    if (!ALLOWED_RETURN_PATHS.includes(url.pathname)) return undefined;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return undefined;
  }
}

export function readAuthIntent(params: Pick<URLSearchParams, "get">): AuthIntent {
  const rawIntent = params.get("intent");
  const normalizedIntent = rawIntent === "scratch" ? "create-cv" : rawIntent === "upload" ? "upload-cv" : rawIntent;
  const template = params.get("template");
  const plan = params.get("plan");
  const returnTo = params.get("returnTo") ?? params.get("redirect");

  return {
    intent: normalizedIntent && VALID_INTENTS.has(normalizedIntent) ? (normalizedIntent as AuthIntent["intent"]) : undefined,
    template: template && VALID_TEMPLATES.has(template) ? template : undefined,
    plan: plan && VALID_PLANS.has(plan) ? (plan as AuthIntent["plan"]) : undefined,
    returnTo: getSafeReturnPath(returnTo),
  };
}

export function saveAuthIntent(intent: AuthIntent) {
  if (typeof window === "undefined") return;
  if (!Object.values(intent).some(Boolean)) return;
  window.localStorage.setItem(AUTH_INTENT_STORAGE_KEY, JSON.stringify(intent));
}

export function loadAuthIntent(): AuthIntent {
  if (typeof window === "undefined") return {};
  try {
    const stored = JSON.parse(window.localStorage.getItem(AUTH_INTENT_STORAGE_KEY) || "{}") as AuthIntent;
    return {
      intent: stored.intent && VALID_INTENTS.has(stored.intent) ? stored.intent : undefined,
      template: stored.template && VALID_TEMPLATES.has(stored.template) ? stored.template : undefined,
      plan: stored.plan && VALID_PLANS.has(stored.plan) ? stored.plan : undefined,
      returnTo: getSafeReturnPath(stored.returnTo),
    };
  } catch {
    return {};
  }
}

export function clearAuthIntent() {
  if (typeof window !== "undefined") window.localStorage.removeItem(AUTH_INTENT_STORAGE_KEY);
}

export function getIntentDestination(intent: AuthIntent, hasWorkspaceData: boolean): string | undefined {
  if (intent.returnTo) return intent.returnTo;
  if (intent.template) return `/cv-editor?template=${encodeURIComponent(intent.template)}${hasWorkspaceData ? "" : "&new=true"}`;
  if (intent.intent === "upload-cv") return hasWorkspaceData ? "/dashboard" : "/onboarding/upload";
  if (intent.intent === "ats-check") return "/ats";
  if (intent.intent === "create-cv") return "/cv-editor?new=true";
  if (intent.plan) return `/settings?plan=${intent.plan}&checkout=1`;
  return undefined;
}
