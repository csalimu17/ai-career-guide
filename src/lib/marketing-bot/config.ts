export const PRODUCT_CTA_MAP = {
  resume_builder: {
    label: "Open Resume Builder",
    url: "/editor",
    description: "Best when the visitor wants to write or rewrite their CV quickly.",
  },
  ats_optimizer: {
    label: "Open ATS Optimizer",
    url: "/ats",
    description: "Best when the visitor wants better job-description matching and ATS alignment.",
  },
  career_workspace: {
    label: "Open Career Workspace",
    url: "/dashboard",
    description: "Best for planning, tracking applications, and broader career strategy.",
  },
  general_signup: {
    label: "Create free account",
    url: "/signup",
    description: "Use when the best next step is a general signup or onboarding flow.",
  },
} as const;

export type ProductKey = keyof typeof PRODUCT_CTA_MAP;

export function normalizeProduct(input: string): ProductKey {
  if (input === "resume_builder") return "resume_builder";
  if (input === "ats_optimizer") return "ats_optimizer";
  if (input === "career_workspace") return "career_workspace";
  return "general_signup";
}

export const QUICK_ACTIONS = [
  "Pick the right tool for me",
  "How can I improve my ATS score?",
  "Help me fix my CV",
  "Plan my next AI career move",
] as const;
