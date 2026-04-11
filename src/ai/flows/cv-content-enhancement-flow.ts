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

import { ai } from '@/ai/genkit';
import { generateWithFallback } from '@/ai/generate-helper';
import { buildJobResearchContext, formatJobResearchContext } from '@/ai/job-research';
import { getGeminiModel, getFallbackGeminiModel } from '@/ai/model-router';
import { jobFetcher } from '@/lib/jobs/job-fetcher';
import { buildRolePlaybookContext } from '@/lib/career-role-playbooks';
import { z } from 'genkit';

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

const cvContentEnhancementFlow = ai.defineFlow(
  {
    name: 'cvContentEnhancementFlow',
    inputSchema: CvContentEnhancementInputSchema,
    outputSchema: CvContentEnhancementOutputSchema,
  },
  async input => {
    let enhancedContent: string | undefined;
    let suggestions: string[] | undefined;
    const researchBrief = await getResearchBrief(input);
    const activeJobTitle =
      input.jobTitle || (input.action === 'suggest_role_bullets' ? input.targetContent : undefined);
    const rolePlaybook = buildRolePlaybookContext(activeJobTitle, input.jobDescription || input.additionalContext);
    const liveRoleSignals = await getLiveRoleSignals(activeJobTitle);
    const writingModel = await getGeminiModel('cvWriting');
    const researchModel = await getGeminiModel('jobResearch');
    const fallbackWritingModel = getFallbackGeminiModel('cvWriting');
    const fallbackResearchModel = getFallbackGeminiModel('jobResearch');

    switch (input.action) {
      case 'generate_content': {
        const response = await generateWithFallback({
          model: writingModel,
          config: { temperature: 0.3 },
          system: `You are an expert career advisor and CV writer.

Generate polished, recruiter-friendly CV content.

Rules:
- Match the tone of the existing CV when possible.
- USE NATURAL, HUMAN, CONVERSATIONAL LANGUAGE. Avoid being overly robotic or excessively formal.
- Prefer concrete achievements, domain language, and credible phrasing.
- Explicitly avoid AI cliches like "spearheaded", "orchestrated", "synergized", "delved", "testament", etc.
- Do not add conversational filler.
- If the prompt asks for bullets, return bullet lines with one idea per bullet and no leading commentary.
- Return JSON only.`,
          prompt: `Current CV context:
${input.currentCvContent || '(not provided)'}

Specific generation request and context:
${input.additionalContext || '(not provided)'}

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
        if (!input.targetContent) {
          throw new Error('targetContent is required for rewriting a bullet point.');
        }

        const response = await generateWithFallback({
          model: writingModel,
          config: { temperature: 0.2 },
          system: `You are an expert CV writer.

Rewrite resume content to be sharper, achievement-oriented, and ATS-aware.

Rules:
- Start with a strong action verb (but avoid AI cliches like "spearheaded" or "orchestrated").
- Write in a natural, human, conversational tone. Do not sound like a robot.
- Keep claims credible and grounded in the source content.
- If job requirements are available, align the bullet to those requirements.
- Add measurable framing only when it can be expressed as a placeholder.
- If the requested output is bullets, rewrite the whole section into 4-6 concise bullet points rather than a single paragraph.
- When rewriting into bullets, keep each line focused on one action/result and avoid repeating the same sentence shape.
- Return JSON only.`,
          prompt: `Original bullet point:
${input.targetContent}

Current CV context:
${input.currentCvContent || '(not provided)'}

Job description:
${input.jobDescription || '(not provided)'}

Job research brief:
${researchBrief || '(none available)'}

Role playbook:
${rolePlaybook || '(none available)'}

Live market signals:
${liveRoleSignals || '(none available)'}

Preferred output format:
${input.preferredOutputFormat || 'paragraph'}`,
          output: { schema: RewrittenBulletSchema },
        }, fallbackWritingModel || undefined);
        enhancedContent = response.output?.rewrittenBullet;
        break;
      }
      case 'suggest_skills': {
        if (!input.currentCvContent) {
          throw new Error('currentCvContent is required for suggesting skills.');
        }

        const response = await generateWithFallback({
          model: writingModel,
          config: { temperature: 0.1 },
          system: `You are a Career Intelligence Advisor.

Identify the most valuable skills that are missing, under-emphasized, or worth surfacing more clearly for the target role.

Rules:
- Prioritize role-defining tools, methods, domains, and soft skills.
- Avoid duplicates and generic filler.
- Return 3-5 concise skills.
- Return JSON only.`,
          prompt: `Current CV content:
${input.currentCvContent}

Job description:
${input.jobDescription || '(not provided)'}

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
        if (!input.targetContent) {
          throw new Error('targetContent (summary points) is required for crafting a summary.');
        }

        const response = await generateWithFallback({
          model: writingModel,
          config: { temperature: 0.4 },
          system: `You are an expert CV writer and positioning strategist.

Write a concise professional summary that sounds credible, current, and aligned to the target role.

Rules:
- 3-5 sentences.
- Use natural, authentic, human language. Do not sound disjointed or robotic.
- Lead with role fit and strongest differentiators.
- Weave in relevant domain keywords naturally.
- Crucially, avoid buzzword stuffing, empty adjectives, and AI cliches ("delve", "spearhead", "testament").
- Return JSON only.`,
          prompt: `Key points or raw summary material:
${input.targetContent}

Current CV context:
${input.currentCvContent || '(not provided)'}

Job description:
${input.jobDescription || '(not provided)'}

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
        if (!input.targetContent) {
          throw new Error('targetContent (summary points) is required for suggesting summary variants.');
        }

        const response = await generateWithFallback({
          model: writingModel,
          config: { temperature: 0.6 },
          system: `You are an expert CV writer and career strategist.

Create three distinct summary options that all fit the same candidate and role, but differ in emphasis.

Rules:
- Exactly 3 options.
- Each option should be 3-4 sentences.
- Write like a real human. Use conversational, fluid sentence phrasing without sounding robotic or "AI-generated."
- Avoid common AI-isms like "spearheaded", "orchestrated", "synergized", "adept at", or "a testament to".
- Keep them polished, credible, and recruiter-friendly.
- Vary the emphasis, for example: leadership, technical depth, growth trajectory, execution, customer impact, or domain expertise.
- Return JSON only.`,
          prompt: `Summary points:
${input.targetContent}

Current CV context:
${input.currentCvContent || '(not provided)'}

Job description:
${input.jobDescription || '(not provided)'}

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
        if (!input.targetContent) {
          throw new Error('targetContent (job title) is required for suggesting role bullets.');
        }

        try {
          const response = await generateWithFallback({
            model: researchModel,
            config: { temperature: 0.2 },
            system: `You are an expert resume strategist and job-role researcher.

Produce role bullets that reflect what strong candidates for the target title are expected to deliver.

Rules:
- Use the title and requirements to infer the correct role family.
- Produce natural, human-like summaries of responsibilities. Formulate them as someone would actually speak.
- Focus on modern, high-signal responsibilities and outcomes for that role.
- Start each bullet with a strong action verb (avoiding "spearheaded", "orchestrated", etc).
- Include placeholders for measurable scope or impact such as [X]%, [Y], or [Z].
- Avoid generic filler that could apply to any job. 
- Do not sound like a generic robotic list; make them specific.
- Use the role playbook and live market signals to keep the bullets aligned to current market expectations.
- Vary the bullets so they cover delivery, collaboration, process, and impact rather than repeating the same angle.
- Return 4-6 bullets as JSON only.`,
            prompt: `Target role title:
${input.targetContent}

Job description or requirements:
${input.jobDescription || input.additionalContext || '(not provided)'}

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
        throw new Error(`Unsupported action: ${input.action}`);
    }

    return {
      enhancedContent,
      suggestions,
    };
  }
);

export async function enhanceCvContent(
  input: CvContentEnhancementInput
): Promise<CvContentEnhancementOutput> {
  return cvContentEnhancementFlow(input);
}
