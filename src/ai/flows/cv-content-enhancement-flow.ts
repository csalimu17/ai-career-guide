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

import { generateWithFallback } from '@/ai/generate-helper';
import { buildJobResearchContext, formatJobResearchContext } from '@/ai/job-research';
import { getGeminiModel, getFallbackGeminiModel } from '@/ai/model-router';
import { jobFetcher } from '@/lib/jobs/job-fetcher';
import { buildRolePlaybookContext } from '@/lib/career-role-playbooks';
import { z } from 'zod';

const CvContentEnhancementInputSchema = z.object({
  action: z
    .enum(['generate_content', 'rewrite_bullet', 'suggest_skills', 'craft_summary', 'suggest_summary_variants', 'suggest_role_bullets', 'suggest_interests'])
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
const SummaryVariantItemSchema = z.object({ 
  style: z.string().describe('The style of the summary (e.g., short, professional, impact, long)'),
  summary: z.string().describe('The professional summary text')
});
const SummaryVariantsSchema = z.object({ summaryVariants: z.array(SummaryVariantItemSchema) });
const RoleBulletsSchema = z.object({ bullets: z.array(z.string()) });
const SuggestedInterestsSchema = z.object({ suggestedInterests: z.array(z.string()) });

function suggestionToText(suggestion: unknown): string {
  if (typeof suggestion === 'string') {
    return suggestion.trim();
  }

  if (typeof suggestion === 'number') {
    return String(suggestion);
  }

  if (Array.isArray(suggestion)) {
    return suggestion.map(suggestionToText).filter(Boolean).join(' ').trim();
  }

  if (!suggestion || typeof suggestion !== 'object') {
    return '';
  }

  const record = suggestion as Record<string, unknown>;
  const keys = [
    'text',
    'bullet',
    'content',
    'value',
    'name',
    'skill',
    'interest',
    'suggestion',
    'replacement',
    'message',
  ];

  for (const key of keys) {
    const value = suggestionToText(record[key]);
    if (value) return value;
  }

  return '';
}

function normalizeSuggestions(suggestions: unknown[]): string[] {
  return suggestions
    .map(suggestionToText)
    .map((suggestion) => suggestion.replace(/^[-•*\d.)\s]+/, '').trim())
    .filter(Boolean);
}

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
        system: `You are a high-end Career Strategist who writes in clear, standard English.
        
        CRITICAL RULES:
        1. NO ROBOTIC BUZZWORDS: Strictly avoid "Spearheaded", "Leveraged", "Pioneered", "Utilized", "Facilitated", or "Synergized". Use direct, human verbs like "Led", "Built", "Managed", "Improved", or "Created".
        2. BE SPECIFIC: Use industry-standard terms and tools naturally.
        3. BE IMPACTFUL: Focus on results and outcomes with narrative depth.
        4. TONE: Human, professional, and authentic — never like an AI prompt.`,
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
          }, { category: 'cvWriting' });
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
        system: `You are a professional CV Editor who avoids robotic "resume-speak" clichés.
        
        INSTRUCTIONS:
        - Rewrite the input to be more powerful and results-oriented while using PLAIN, DIRECT ENGLISH.
        - ABSOLUTELY NO: "Spearheaded", "Leveraged", "Pioneered", "Orchestrated", or "Utilized". 
        - USE INSTEAD: "Led", "Built", "Managed", "Improved", "Run", or "Created".
        - Use the CAR method (Context, Action, Result) but keep it sounding like a real person.
        - Keep the content concise and punchy.`,
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
      }, { category: 'cvWriting' });
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
          }, { category: 'cvWriting' });
          suggestions = normalizeSuggestions(response.output?.suggestedSkills || []);
          break;
        }
        case 'craft_summary': {
      if (!input.targetContent) {
        throw new Error('targetContent (summary points) is required for crafting a summary.');
      }

      const response = await generateWithFallback({
        model: writingModel,
        config: { temperature: 0.4 },
        system: `You are an expert CV writer who writes standard, authentic English.
        
        STRICT TONE RULES:
        1. NO BUZZWORDS: Strictly avoid robotic terms like "Spearheaded", "Leveraged", "Pioneered", "Utilized", "Empowered", or "Facilitated".
        2. HUMAN VOICE: Write like a real person summarizing their career value.
        3. DIRECT IMPACT: Focus on clear value propositions without flowery AI filler. Use verbs like "Led", "Built", or "Managed".`,
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
          }, { category: 'cvWriting' });
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
        system: `You are an expert CV writer who excels at creating human, non-robotic summaries.
        
        STRICT TONE RULES:
        1. AVOID CLICHÉS: Never use robotic buzzwords like "Spearheaded", "Leveraged", "Pioneered", or flowery adjectives like "Dynamic" or "Visionary".
        2. PLAIN ENGLISH: Use simple but powerful language that an employer can trust. Use words like "Built", "Managed", "Improved", or "Ran".`,
        prompt: `Generate 3 distinct professional summary variants for a CV based on the following input.
Each variant should be an object with 'style' and 'summary' fields.
Requested style for all variants: ${input.summaryStyle || 'professional'} (but make them distinct).

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
          }, { category: 'cvWriting' });
          suggestions = response.output?.summaryVariants;
          enhancedContent = typeof response.output?.summaryVariants?.[0] === 'object' 
            ? response.output?.summaryVariants?.[0].summary 
            : response.output?.summaryVariants?.[0];
          break;
        }
        case 'suggest_role_bullets': {
      if (!input.targetContent) {
        throw new Error('targetContent (job title) is required for suggesting role bullets.');
      }

      try {
        const response = await generateWithFallback({
          model: researchModel,
          config: { temperature: 0.45 },
          system: `You are an executive career advisor writing authentic, human resume bullet points for a candidate.

STRICT HUMAN WRITING RULES:
1. NO FORCED PERCENTAGES OR ROBOTIC METRICS: Do NOT put percentages (e.g. "by 18%", "by 24%") or fake formulaic numbers in every bullet point. At most ONE bullet out of 5 may mention a metric, and ONLY if natural. The remaining 4 bullets MUST describe real practical work, systems built, processes managed, problems solved, or team leadership without forced numbers.
2. NATURAL HUMAN VOICE: Write like a real professional describing their day-to-day work experience to a hiring manager over coffee. Avoid AI clichés like "Spearheaded", "Leveraged", "Pioneered", "Synergized", "Orchestrated", "Drive growth", "Elevate".
3. REALISTIC WORKPLACE SCOPE: Focus on practical, authentic accomplishments for a "${input.targetContent}". Examples of natural human bullets:
   - "Built and maintained the core user authentication system, migrating legacy sessions to OAuth 2.0."
   - "Collaborated with product designers and backend developers to ship key feature releases on schedule."
   - "Managed day-to-day operations and customer escalation channels for enterprise clients."
   - "Refactored front-end state management to improve page load speeds and overall responsiveness."
   - "Onboarded and mentored junior team members on coding standards and internal tooling."
4. DIVERSE RESPONSIBILITIES: Ensure the 5 bullets cover different aspects of the role (e.g., technical execution, team collaboration, process improvement, client communication).
5. UNIQUE SENTENCE STRUCTURES: Do NOT use the same sentence template for all bullets. Mix short direct statements with descriptive sentences so it sounds authentically written by a human.`,
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
            }, { category: 'cvWriting' });

            const rawBullets: unknown[] = response.output?.bullets || [];
            const bullets = normalizeSuggestions(rawBullets);
            suggestions = bullets;
            enhancedContent = bullets.map((b: string) => `- ${b}`).join('\n');
          } catch (err) {
            console.error('suggestRoleBulletsPrompt error:', err);
            throw err;
          }
          break;
        }
        case 'suggest_interests': {
      const response = await generateWithFallback({
        model: writingModel,
        config: { temperature: 0.6 },
        system: `You are a Career Character Coach who suggests authentic hobbies and interests that show personality, leadership, or unique technical character.
        
        RULES:
        1. AVOID CLICHÉS: Don't just say "Reading" or "Traveling". Suggest specific things like "Ultra-marathon running", "Chess strategy", "Post-process photography", or "Vintage hardware restoration".
        2. PERSONALITY: Suggest items that subtly hint at soft skills (e.g., Team sports for teamwork, Strategy games for logic).
        3. DIVERSITY: Provide 8-10 varied options ranging from active, creative, to intellectual.`,
        prompt: `Suggest hobbies and interests based on this profile:
${input.currentCvContent || '(not provided)'}

Job research context (for subtle culture fit):
${researchBrief || '(none available)'}

Role playbook:
${rolePlaybook || '(none available)'}`,
            output: { schema: SuggestedInterestsSchema },
          }, { category: 'cvWriting' });
          suggestions = normalizeSuggestions(response.output?.suggestedInterests || []);
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
