'use server';
/**
 * @fileOverview This file implements a Genkit flow for AI-assisted CV content enhancement.
 * It provides functionalities like generating content, rewriting bullet points, suggesting missing skills,
 * and crafting professional summaries to help users create impactful CVs.
 *
 * - enhanceCvContent - A function that orchestrates various AI tools for CV content enhancement.
 * - CvContentEnhancementInput - The input type for the enhanceCvContent function.
 * - CvContentEnhancementOutput - The return type for the enhanceCvContent function.
 */

import { getAi } from '@/ai/genkit';
import { generateWithFallback } from '@/ai/generate-helper';
import { buildJobResearchContext, formatJobResearchContext } from '@/ai/job-research';
import { getGeminiModel, getFallbackGeminiModel } from '@/ai/model-router';
import { jobFetcher } from '@/lib/jobs/job-fetcher';
import { buildRolePlaybookContext } from '@/lib/career-role-playbooks';
import { z } from 'zod';

const CvContentEnhancementInputSchema = z.object({
  action: z
    .enum(['generate_content', 'rewrite_bullet', 'suggest_skills', 'craft_summary', 'suggest_summary_variants', 'suggest_role_bullets'])
    .describe('The specific AI action to perform on the CV content.'),
  currentCvContent: z
    .string()
    .optional()
    .describe('The full current content of the CV, used for overall context.'),
  targetContent: z
    .string()
    .optional()
    .describe('Specific piece of content to be processed (e.g., a bullet point to rewrite, draft summary points).'),
  jobDescription: z
    .string()
    .optional()
    .describe('An optional job description to tailor the AI output.'),
  additionalContext: z
    .string()
    .optional()
    .describe('Any additional specific context for content generation.'),
  jobTitle: z
    .string()
    .optional()
    .describe('The job title that should anchor role-specific tailoring.'),
  preferredOutputFormat: z
    .enum(['paragraph', 'bullets'])
    .optional()
    .describe('Preferred output shape for the generated content.'),
});
export type CvContentEnhancementInput = z.infer<typeof CvContentEnhancementInputSchema>;

const CvContentEnhancementOutputSchema = z.object({
  enhancedContent: z
    .string()
    .optional()
    .describe('The AI-generated or rewritten content.'),
  suggestions: z
    .array(z.string())
    .optional()
    .describe('A list of suggestions, e.g., missing skills.'),
});
export type CvContentEnhancementOutput = z.infer<typeof CvContentEnhancementOutputSchema>;

const GeneratedContentSchema = z.object({ generatedContent: z.string() });
const RewrittenBulletSchema = z.object({ rewrittenBullet: z.string() });
const SuggestedSkillsSchema = z.object({ suggestedSkills: z.array(z.string()) });
const ProfessionalSummarySchema = z.object({ professionalSummary: z.string() });
const SummaryVariantsSchema = z.object({ summaryVariants: z.array(z.string()) });
const RoleBulletsSchema = z.object({ bullets: z.array(z.string()) });

async function getResearchBrief(input: CvContentEnhancementInput) {
  if (!input.jobDescription && !input.targetContent && !input.additionalContext) {
    return '';
  }

  const context = await buildJobResearchContext({
    jobTitle: input.jobTitle || (input.action === 'suggest_role_bullets' ? input.targetContent : undefined),
    jobDescription: input.jobDescription || input.additionalContext,
    message: input.additionalContext,
  });

  return formatJobResearchContext(context);
}

async function getLiveRoleSignals(jobTitle?: string) {
  if (!jobTitle) {
    return '';
  }

  try {
    const { listings } = await jobFetcher.fetchJobs({
      keywords: jobTitle,
      location: 'United Kingdom',
      workplace: 'all',
      page: 1,
    });

    const samples = listings.slice(0, 4).map((listing) => {
      const tags = listing.tags?.length ? `Tags: ${listing.tags.slice(0, 5).join(', ')}` : '';
      return [
        `${listing.role} at ${listing.company} (${listing.location})`,
        listing.shortDescription,
        tags,
      ]
        .filter(Boolean)
        .join(' | ');
    });

    return samples.length ? `Live market signals from current job listings:\n- ${samples.join('\n- ')}` : '';
  } catch (error) {
    console.warn('[CvContentEnhancement] Live role lookup failed, using offline role playbook only.', error);
    return '';
  }
}

export async function enhanceCvContent(input: CvContentEnhancementInput): Promise<CvContentEnhancementOutput> {
  const ai = getAi();
  
  const flow = ai.defineFlow(
    {
      name: 'cvContentEnhancementFlow',
      inputSchema: CvContentEnhancementInputSchema,
      outputSchema: CvContentEnhancementOutputSchema,
    },
    async (innerInput: CvContentEnhancementInput) => {
      let enhancedContent: string | undefined;
      let suggestions: string[] | undefined;
      const researchBrief = await getResearchBrief(innerInput);
      const activeJobTitle =
        innerInput.jobTitle || (innerInput.action === 'suggest_role_bullets' ? innerInput.targetContent : undefined);
      const rolePlaybook = buildRolePlaybookContext(activeJobTitle, innerInput.jobDescription || innerInput.additionalContext);
      const liveRoleSignals = await getLiveRoleSignals(activeJobTitle);
      const writingModel = await getGeminiModel('cvWriting');
      const researchModel = await getGeminiModel('jobResearch');
      const fallbackWritingModel = getFallbackGeminiModel('cvWriting');
      const fallbackResearchModel = getFallbackGeminiModel('jobResearch');

      switch (innerInput.action) {
        case 'generate_content': {
          const response = await generateWithFallback({
            model: writingModel,
            config: { temperature: 0.3 },
            system: `You are an expert career advisor and CV writer...`,
            prompt: `Current CV context:
${innerInput.currentCvContent || '(not provided)'}

Specific generation request and context:
${innerInput.additionalContext || '(not provided)'}

Job research brief:
${researchBrief || '(none available)'}

Role playbook:
${rolePlaybook || '(none available)'}

Live market signals:
${liveRoleSignals || '(none available)'}`,
            output: { schema: GeneratedContentSchema },
          }, fallbackWritingModel || undefined);
          enhancedContent = response.output?.generatedContent;
          break;
        }
        case 'rewrite_bullet': {
          if (!innerInput.targetContent) {
            throw new Error('targetContent is required for rewriting a bullet point.');
          }

          const response = await generateWithFallback({
            model: writingModel,
            config: { temperature: 0.2 },
            system: `You are an expert CV writer...`,
            prompt: `Original bullet point:
${innerInput.targetContent}

Current CV context:
${innerInput.currentCvContent || '(not provided)'}

Job description:
${innerInput.jobDescription || '(not provided)'}

Job research brief:
${researchBrief || '(none available)'}

Role playbook:
${rolePlaybook || '(none available)'}

Live market signals:
${liveRoleSignals || '(none available)'}

Preferred output format:
${innerInput.preferredOutputFormat || 'paragraph'}`,
            output: { schema: RewrittenBulletSchema },
          }, fallbackWritingModel || undefined);
          enhancedContent = response.output?.rewrittenBullet;
          break;
        }
        case 'suggest_skills': {
          if (!innerInput.currentCvContent) {
            throw new Error('currentCvContent is required for suggesting skills.');
          }

          const response = await generateWithFallback({
            model: writingModel,
            config: { temperature: 0.1 },
            system: `You are a Career Intelligence Advisor...`,
            prompt: `Current CV content:
${innerInput.currentCvContent}

Job description:
${innerInput.jobDescription || '(not provided)'}

Job research brief:
${researchBrief || '(none available)'}

Role playbook:
${rolePlaybook || '(none available)'}`,
            output: { schema: SuggestedSkillsSchema },
          }, fallbackWritingModel || undefined);
          suggestions = response.output?.suggestedSkills;
          break;
        }
        case 'craft_summary': {
          if (!innerInput.targetContent) {
            throw new Error('targetContent (summary points) is required for crafting a summary.');
          }

          const response = await generateWithFallback({
            model: writingModel,
            config: { temperature: 0.4 },
            system: `You are an expert CV writer...`,
            prompt: `Key points or raw summary material:
${innerInput.targetContent}

Current CV context:
${innerInput.currentCvContent || '(not provided)'}

Job description:
${innerInput.jobDescription || '(not provided)'}

Job research brief:
${researchBrief || '(none available)'}

Role playbook:
${rolePlaybook || '(none available)'}`,
            output: { schema: ProfessionalSummarySchema },
          }, fallbackWritingModel || undefined);
          enhancedContent = response.output?.professionalSummary;
          break;
        }
        case 'suggest_summary_variants': {
          if (!innerInput.targetContent) {
            throw new Error('targetContent (summary points) is required for suggesting summary variants.');
          }

          const response = await generateWithFallback({
            model: writingModel,
            config: { temperature: 0.6 },
            system: `You are an expert CV writer...`,
            prompt: `Summary points:
${innerInput.targetContent}

Current CV context:
${innerInput.currentCvContent || '(not provided)'}

Job description:
${innerInput.jobDescription || '(not provided)'}

Job research brief:
${researchBrief || '(none available)'}

Role playbook:
${rolePlaybook || '(none available)'}`,
            output: { schema: SummaryVariantsSchema },
          }, fallbackWritingModel || undefined);
          suggestions = response.output?.summaryVariants;
          enhancedContent = response.output?.summaryVariants?.[0];
          break;
        }
        case 'suggest_role_bullets': {
          if (!innerInput.targetContent) {
            throw new Error('targetContent (job title) is required for suggesting role bullets.');
          }

          try {
            const response = await generateWithFallback({
              model: researchModel,
              config: { temperature: 0.2 },
              system: `You are an expert resume strategist...`,
              prompt: `Target role title:
${innerInput.targetContent}

Job description or requirements:
${innerInput.jobDescription || innerInput.additionalContext || '(not provided)'}

Job research brief:
${researchBrief || '(none available)'}

Role playbook:
${rolePlaybook || '(none available)'}

Live market signals:
${liveRoleSignals || '(none available)'}`,
              output: { schema: RoleBulletsSchema },
            }, fallbackResearchModel || undefined);

            const bullets = response.output?.bullets || [];
            suggestions = bullets;
            enhancedContent = bullets.map((b: string) => `- ${b}`).join('\n');
          } catch (err) {
            console.error('suggestRoleBulletsPrompt error:', err);
            throw err;
          }
          break;
        }
        default:
          throw new Error(`Unsupported action: ${innerInput.action}`);
      }

      return {
        enhancedContent,
        suggestions,
      };
    }
  );

  return flow(input);
}
