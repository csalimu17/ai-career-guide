'use server';
/**
 * @fileOverview This file implements an advanced Genkit flow for analyzing a CV against a job description.
 * It provides a deep ATS compatibility score, categorical breakdowns, identifies missing keywords, 
 * and offers actionable improvement suggestions.
 */

import {ai} from '@/ai/genkit';
import { buildJobResearchContext, formatJobResearchContext } from '@/ai/job-research';
import { getGeminiModel } from '@/ai/model-router';
import {z} from 'genkit';

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

const atsOptimizationScoringFlow = ai.defineFlow(
  {
    name: 'atsOptimizationScoringFlow',
    inputSchema: AtsOptimizationScoringInputSchema,
    outputSchema: AtsOptimizationScoringOutputSchema,
  },
  async input => {
    const jobResearchContext = await buildJobResearchContext({
      jobDescription: input.jobDescription,
    });
    const model = await getGeminiModel('atsAnalysis');

    const response = await ai.generate({
      model,
      config: { temperature: 0.1 },
      system: `You are an expert ATS analyst, recruiter, and resume strategist.
        
        Score the CV against the target role with rigorous and standardized judgment. Use the following REQUIRED SCORING RUBRIC for all scores (0-100):
        
        ### SCORING RUBRIC:
        - 0-30: CRITICAL MISMATCH. The CV lacks the majority of core certifications, technical skills, or required years of experience.
        - 31-50: WEAK MATCH. Missing several "must-have" requirements. Experience level or industry is only tangentially related.
        - 51-70: FAIR MATCH. Meets the basic technical requirements but lacks depth in key areas or fails to demonstrate impact.
        - 71-85: STRONG MATCH. Meets all primary requirements. Significant overlap in skills and responsibilities.
        - 86-100: OUTSTANDING. Matches nearly all keywords, shows exceptional measurable impact, and has perfect ATS-friendly formatting.
        
        ### GUIDELINES:
        - Weight explicit "Must-have" or "Required" qualifications significantly higher than "Preferred" ones.
        - Calculate 'keywordMatch' based on the ratio of required JD keywords found in the CV.
        - 'measurableImpactScore' depends on the presence of metrics (%, $, numbers) in experience bullets.
        - 'formatting' score must decrease significantly if columns, tables, or complex graphics are used.
        - DO NOT inflate scores. A score of 70 should genuinely represent a candidate who is just 'okay' for the role.
        - Return JSON only.`,
      prompt: `Return a detailed ATS assessment including:
        0. headline and matchSummary.
        1. totalScore and atsScore from 0-100 (FOLLOW THE RUBRIC).
        2. measurableImpactScore from 0-100.
        3. categories for keywordMatch, completeness, formatting, impact, readability, and contactInfo.
        4. missingKeywords: 5-12 important missing terms.
        5. matchedKeywords: 5-12 important matched terms.
        6. keywordCoverage percentage.
        7. warnings about ATS risks.
        8. strengths: 3-5 points.
        9. quickWins: 3-5 fast improvements.
        10. sectionFeedback across major resume sections.
        11. recommendations and suggestions with title, description, and priority.
        
        Job research brief:
        ${formatJobResearchContext(jobResearchContext)}
        
        Job Description:
        ${input.jobDescription}
        
        CV Content:
        ${input.cvContent}`,
      output: { schema: AtsOptimizationScoringOutputSchema },
    });

    return response.output!;
  }
);

export async function atsOptimizationScoring(input: AtsOptimizationScoringInput): Promise<AtsOptimizationScoringOutput> {
  return atsOptimizationScoringFlow(input);
}
