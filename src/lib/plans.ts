import { PlanEntitlements } from "./product-rules";

export type PlanId = "free" | "pro" | "master" | "agency";

export interface Plan {
  id: PlanId;
  name: string;
  price: string;
  stripePriceId: string | null;
  stripePriceIdAliases?: string[];
  features: string[];
  highlight?: boolean;
  limits: PlanEntitlements & {
    hasAiCareerAssistant: boolean;
  };
}

export const PLANS: Record<PlanId, Plan> = {
  free: {
    id: "free",
    name: "Free",
    price: "\u00A30",
    stripePriceId: null,
    features: ["1 AI CV", "3 ATS Scans", "5 ATS-safe templates", "Community Chat"],
    limits: {
      maxResumes: 1,
      atsChecks: 3,
      aiGenerations: 5,
      premiumTemplates: false,
      jobTracker: false,
      coverLetters: 0,
      hasAiCareerAssistant: true,
    },
  },
  pro: {
    id: "pro",
    name: "Pro",
    price: "\u00A312.99",
    stripePriceId: "price_1TED7BBn4UHJM6HhiXH4EA9h",
    stripePriceIdAliases: ["price_1TD8OsB6KiU2Sp65vyiGVJar"],
    features: [
      "10 CVs",
      "50 ATS Scans",
      "10 CV templates",
      "Cover Letter Generator",
      "AI Interview Prep",
    ],
    highlight: true,
    limits: {
      maxResumes: 10,
      atsChecks: 50,
      aiGenerations: 50,
      premiumTemplates: true,
      jobTracker: true,
      coverLetters: 5,
      hasAiCareerAssistant: true,
    },
  },
  master: {
    id: "master",
    name: "Master",
    price: "\u00A318.99",
    stripePriceId: "price_1TEDAXBn4UHJM6HhSgPkwNw8",
    stripePriceIdAliases: [
      "price_1TD8OtB6KiU2Sp65EilBLETK",
      "price_1TD8OtB6KiU2Sp65EiBLETK",
    ],
    features: [
      "100 CVs",
      "1,000 ATS Scans",
      "20 full-library templates",
      "AI Career Assistant (1,000 generations)",
      "Priority Support",
    ],
    limits: {
      maxResumes: 100,
      atsChecks: 1000,
      aiGenerations: 1000,
      premiumTemplates: true,
      jobTracker: true,
      coverLetters: 100,
      hasAiCareerAssistant: true,
    },
  },
  agency: {
    id: "agency",
    name: "Agency",
    price: "Custom",
    stripePriceId: null,
    features: [
      "White-labelled Candidate Portals",
      "Unified ATS Integrations (Merge.dev)",
      "Agency Template Enforcer",
      "Recruiter Analytics Dashboard",
    ],
    limits: {
      maxResumes: 9999,
      atsChecks: 9999,
      aiGenerations: 9999,
      premiumTemplates: true,
      jobTracker: true,
      coverLetters: 9999,
      hasAiCareerAssistant: true,
    },
  },
};

export const BILLING_PLANS = Object.values(PLANS);

export const PLAN_CONFIGS = Object.fromEntries(
  Object.entries(PLANS).map(([id, plan]) => [id, plan.limits])
);

export function getPlan(planId: string = "free"): Plan {
  return PLANS[planId as PlanId] || PLANS.free;
}

export function getPlanLimits(planId: string = "free") {
  return getPlan(planId).limits;
}

export function getPlanByPriceId(priceId: string): Plan | null {
  return BILLING_PLANS.find(
    (plan) => plan.stripePriceId === priceId || plan.stripePriceIdAliases?.includes(priceId)
  ) || null;
}

export function canCreateResume(planId: string, currentCount: number): boolean {
  const limits = getPlanLimits(planId);
  return currentCount < limits.maxResumes;
}
