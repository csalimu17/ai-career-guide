
/**
 * @fileOverview Centralized product rules and plan entitlements.
 */

export type PlanType = 'free' | 'pro' | 'master';

export interface PlanEntitlements {
  maxResumes: number;
  aiGenerations: number;
  atsChecks: number;
  premiumTemplates: boolean;
  jobTracker: boolean;
  coverLetters: number;
}

export const PLAN_LIMITS: Record<PlanType, PlanEntitlements> = {
  free: {
    maxResumes: 1,
    aiGenerations: 5,
    atsChecks: 3,
    premiumTemplates: false,
    jobTracker: false,
    coverLetters: 0,
  },
  pro: {
    maxResumes: 10,
    aiGenerations: 50,
    atsChecks: 25,
    premiumTemplates: true,
    jobTracker: true,
    coverLetters: 5,
  },
  master: {
    maxResumes: 100,
    aiGenerations: 1000,
    atsChecks: 1000,
    premiumTemplates: true,
    jobTracker: true,
    coverLetters: 100,
  },
};

export function getPlanLimit(plan: PlanType | undefined, type: keyof PlanEntitlements) {
  const p = plan || 'free';
  return PLAN_LIMITS[p][type];
}
