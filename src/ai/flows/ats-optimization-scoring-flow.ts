'use server';
/**
 * @fileOverview This file implements an advanced Genkit flow for analyzing a CV against a job description.
 * It provides a deep ATS compatibility score, categorical breakdowns, identifies missing keywords, 
 * and offers actionable improvement suggestions.
 */

import { getAi } from '@/ai/genkit';
import { generateWithFallback } from '@/ai/generate-helper';
import { buildJobResearchContext, formatJobResearchContext } from '@/ai/job-research';
import { getFallbackModels, getGeminiModel } from '@/ai/model-router';
import { z } from 'zod';

const AtsOptimizationScoringInputSchema = z.object({
  cvContent: z
    .string()
    .describe("The user's resume or CV content, which may be parsed from a document."),
  jobDescription: z.string().describe('The job description against which the CV should be optimized.'),
});
export type AtsOptimizationScoringInput = z.infer<typeof AtsOptimizationScoringInputSchema>;

const AtsOptimizationScoringOutputSchema = z.object({
  headline: z
    .string()
    .describe('A concise headline verdict summarizing the ATS readiness of the CV for this role.'),
  matchSummary: z
    .string()
    .describe('A short practical summary explaining the main ATS strengths and the main gap to close next.'),
  totalScore: z
    .number()
    .min(0)
    .max(100)
    .describe('An overall compatibility score indicating how well the CV matches the job.'),
  atsScore: z
    .number()
    .min(0)
    .max(100)
    .describe('Compatibility score for ATS (same as totalScore).'),
  measurableImpactScore: z
    .number()
    .min(0)
    .max(100)
    .describe('Score specifically for measurable achievements and metrics.'),
  categories: z.object({
    keywordMatch: z.number().min(0).max(100).describe('Score for keyword alignment.'),
    completeness: z.number().min(0).max(100).describe('Score for having all standard resume sections.'),
    formatting: z.number().min(0).max(100).describe('Score for ATS-friendly formatting (no tables, columns, etc).'),
    impact: z.number().min(0).max(100).describe('Score for measurable achievements and metrics.'),
    readability: z.number().min(0).max(100).describe('Score for clarity and concise language.'),
    contactInfo: z.number().min(0).max(100).describe('Score for completeness of contact details.'),
  }),
  missingKeywords: z
    .array(z.string())
    .describe('Important keywords from the job description missing in the CV.'),
  matchedKeywords: z
    .array(z.string())
    .describe('Important job description keywords that are already represented in the CV.'),
  keywordCoverage: z
    .number()
    .min(0)
    .max(100)
    .describe('Estimated percentage of critical job-description keywords covered by the CV.'),
  warnings: z
    .array(z.string())
    .describe('Specific risks like complex graphics or missing contact details.'),
  strengths: z
    .array(z.string())
    .describe('The strongest ATS-positive signals currently present in the CV.'),
  quickWins: z
    .array(z.string())
    .describe('The fastest high-impact improvements the user should make next.'),
  sectionFeedback: z
    .array(z.object({
      section: z.string(),
      status: z.enum(['strong', 'needs-work', 'missing']),
      score: z.number().min(0).max(100),
      summary: z.string(),
      fixes: z.array(z.string()),
    }))
    .describe('Section-by-section ATS feedback covering major resume sections and concrete fixes.'),
  recommendations: z
    .array(z.object({
      title: z.string(),
      description: z.string(),
      priority: z.enum(['high', 'medium', 'low']),
    }))
    .describe('Prioritized quick-fix recommendations.'),
  suggestions: z
    .array(z.object({
      title: z.string(),
      description: z.string(),
      priority: z.enum(['high', 'medium', 'low']),
    }))
    .describe('Alias for recommendations.'),
});
export type AtsOptimizationScoringOutput = z.infer<typeof AtsOptimizationScoringOutputSchema>;

export async function atsOptimizationScoring(input: AtsOptimizationScoringInput): Promise<AtsOptimizationScoringOutput> {
  const ai = getAi();
  
  const jobResearchContext = await buildJobResearchContext({
    jobDescription: input.jobDescription,
  });
      const model = await getGeminiModel('atsAnalysis');
      const fallbackModels = await getFallbackModels('atsAnalysis');

      const response = await generateWithFallback({
        model,
        config: { temperature: 0.1 },
        system: `You are an expert ATS (Applicant Tracking System) analyst, recruiter, and resume strategist.
Your goal is to provide a deep, brutally honest, yet constructive analysis of how a CV matches a specific job description.

Follow these strict guidelines:
1. ATS SCORE: Calculate a realistic score (0-100). 100 is a perfect match. Most resumes score between 40-70.
2. KEYWORDS: Extract critical hard skills, tools, and certifications from the job description and mark which represent "missingKeywords" and "matchedKeywords".
3. CATEGORIES: Provide granular scores for keywordMatch, completeness (sections), formatting (ATS passability), impact (metrics used), readability, and contactInfo.
4. SECTION FEEDBACK: Analyze standard sections (Experience, Education, Skills, Summary). Identify if they are 'strong', 'needs-work', or 'missing'. Provide specific 'fixes'.
5. RECOMMENDATIONS: List 3-5 prioritized actions the user should take immediately to increase their score.

Output must strictly adhere to the provided schema.`,
        prompt: `Analyze the following CV against the target Job Description.
        
        Using the Job Research Context provided, identify not just literal keyword matches but also semantic alignment (e.g., if they ask for 'Cloud' and the user has 'AWS/GCP').

        Job Research Context:
        ${formatJobResearchContext(jobResearchContext)}
        
        Target Job Description:
        ${input.jobDescription}
        
        Candidate CV Content:
        ${input.cvContent}

        Ensure the 'headline' is professional and summary-like (e.g., "Strong technical alignment with experience gaps in leadership").`,
        output: { schema: AtsOptimizationScoringOutputSchema },
      }, fallbackModels);
  return response.output!;
}
