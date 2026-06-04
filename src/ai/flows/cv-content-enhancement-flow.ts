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
  summaryStyle: z
    .enum(['professional', 'short', 'impact', 'long'])
    .optional()
    .describe('The style of summary variants to generate.'),
  preferredOutputFormat: z
    .enum(['paragraph', 'bullets'])
    .optional()
    .describe('Whether the enhanced content should be returned as a paragraph or as bullet points.'),
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

async function getLiveRoleSignals(jobTitle?: string, includeDeepContext: boolean = false) {
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

    const samples = await Promise.all(listings.slice(0, 4).map(async (listing, idx) => {
      const tags = listing.tags?.length ? `Tags: ${listing.tags.slice(0, 5).join(', ')}` : '';
      
      // For the first listing, fetch deeper context if requested
      let detail = listing.shortDescription;
      if (includeDeepContext && idx === 0 && listing.id && listing.source) {
        try {
          const fullDetail = await jobFetcher.fetchJobDescription(listing.source, listing.id);
          if (fullDetail) {
            detail = fullDetail.slice(0, 800) + '...';
          }
        } catch (e) {
          // Fallback to short description
        }
      }

      return [
        `${listing.role} at ${listing.company} (${listing.location})`,
        detail,
        tags,
      ]
        .filter(Boolean)
        .join(' | ');
    }));

    return samples.length ? `Live market signals from current job listings:\n- ${samples.join('\n- ')}` : '';
  } catch (error) {
    console.warn('[CvContentEnhancement] Live role lookup failed, using offline role playbook only.', error);
    return '';
  }
}

export async function enhanceCvContent(input: CvContentEnhancementInput): Promise<CvContentEnhancementOutput> {
  const ai = getAi();
  
  let enhancedContent: string | undefined;
  let suggestions: string[] | undefined;
  const researchBrief = await getResearchBrief(input);
  const activeJobTitle =
    input.jobTitle || (input.action === 'suggest_role_bullets' ? input.targetContent : undefined);
  const rolePlaybook = buildRolePlaybookContext(activeJobTitle, input.jobDescription || input.additionalContext);
  const liveRoleSignals = await getLiveRoleSignals(
    activeJobTitle, 
    input.action === 'suggest_role_bullets' // Use deep context for role suggestions
  );
  const writingModel = await getGeminiModel('cvWriting');
  const researchModel = await getGeminiModel('jobResearch');
  const fallbackWritingModel = getFallbackGeminiModel('cvWriting');
  const fallbackResearchModel = getFallbackGeminiModel('jobResearch');

  switch (input.action) {
        case 'generate_content': {
      const response = await generateWithFallback({
        model: writingModel,
        config: { temperature: 0.3 },
        system: `You are a high-end Career Strategist. Your task is to generate compelling CV content based on the user's request.
        
        CRITICAL RULES:
        1. BE SPECIFIC: Use industry-standard terms and tools.
        2. BE IMPACTFUL: Focus on results and outcomes, not just tasks.
        3. BE GUIDED: Use the provided Live market signals and job research to ensure the content is relevant to today's market.
        4. TONE: Confident, professional, and achievement-oriented.`,
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
        system: `You are a professional CV Editor specializing in high-impact achievement bullets.
        
        INSTRUCTIONS:
        - Rewrite the input bullet point to be more powerful, professional, and results-oriented.
        - Use the CAR method (Context, Action, Result).
        - Inject relevant keywords from the 'Live market signals' if they fit naturally.
        - Keep the content concise and punchy.
        - If multiple variants are requested, ensure they cover different angles (e.g., leadership, technical depth, operational efficiency).`,
        prompt: `Original content to transform:
${input.targetContent}

Current CV context for background:
${input.currentCvContent || '(not provided)'}

Target Job Description (Optimize for this):
${input.jobDescription || '(not provided)'}

Job research brief (Industry insights):
${researchBrief || '(none available)'}

Desired Format: ${input.preferredOutputFormat || 'paragraph'}

Instructions: 
1. Rewrite the original content to be more impactful and professional.
2. If format is 'bullets', return ONLY a list of bullet points starting with '- '. Do not include any introductory or concluding text.
3. If format is 'paragraph', return a single professional paragraph.
4. Align the tone with the job description and research brief provided.`,
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
        system: `You are a Career Intelligence Advisor...`,
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
        system: `You are an expert CV writer...`,
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
        config: { temperature: 0.7 },
        system: `You are an expert CV writer...`,
        prompt: `Generate 3 distinct professional summary variants for a CV based on the following input.
Requested style: ${input.summaryStyle || 'professional'}

Style Guidelines (MANDATORY):
- 'short': 1-2 powerful sentences. Extremely concise and punchy.
- 'professional': 3-4 balanced sentences. Standard high-quality professional summary.
- 'long': 5-6 detailed sentences. Comprehensive and thorough, highlighting a wide range of expertise and value.
- 'impact': Focused heavily on metrics, accomplishments, and specific value propositions.

You MUST strictly adhere to the requested length and tone for the '${input.summaryStyle || 'professional'}' style.

Input material:
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
          config: { temperature: 0.25 },
          system: `You are an elite Resume Strategist and Career Intelligence Expert who writes hyper-specific, role-tailored resume bullet points.
Your goal is to generate high-impact bullet points that sound like they come from a top 1% professional who actually held this position at this specific company.

STRICT GUIDELINES:
1. SPECIFICITY OVER GENERALISM: Do NOT write vague bullets like "managed teams", "improved processes", or "collaborated with stakeholders". Use company context to infer the real environment.
2. COMPANY CONTEXT: If a company name is provided, consider its industry, scale, and typical technology stack when crafting bullets. A startup's bullets ≠ an enterprise's bullets.
3. CAR/STAR METHOD: Context → Action → Result. Start every bullet with a strong past-tense action verb.
4. IMPROVE ON EXISTING: If the user already has a description for this role, treat it as a baseline — keep what's authentic, elevate the language, and inject missing impact or metrics.
5. INDUSTRY VERNACULAR: Inject real tools, platforms, and frameworks appropriate to this role at this type of company.
6. QUANTIFIABLE PLACEHOLDERS: Use '[X]%', '£[X]k', 'across [N] teams' as calibrated placeholders where metrics are inferred but unknown.
7. DIVERSE ANGLES: Cover distinct professional dimensions — delivery, technical depth, stakeholder/leadership, process improvement, measurable business impact.
8. NO DUPLICATES: Never start two bullets with the same verb or cover the same theme.`,
          prompt: `Target role title: ${input.targetContent}

${input.additionalContext ? `Role context from the CV (use this to ensure bullets are grounded in this person's real experience):\n${input.additionalContext}\n` : ''}
Job description or requirements (if provided):
${input.jobDescription || '(not provided)'}

Full CV text for background context:
${input.currentCvContent ? input.currentCvContent.slice(0, 1800) : '(not provided)'}

Job research context:
${researchBrief || '(none available)'}

Role playbook (architectural guidance):
${rolePlaybook || '(none available)'}

Live market signals (real-world requirements from current listings):
${liveRoleSignals || '(none available)'}

TASK: Generate exactly 5 highly specific, high-impact bullet points for someone who held the role of "${input.targetContent}"${input.additionalContext?.includes('Company:') ? ` at ${input.additionalContext.split('\n')[0].replace('Company: ', '')}` : ''}.
Each bullet must begin with a strong past-tense action verb and reflect the real scope of this specific role in this specific context.`,
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
