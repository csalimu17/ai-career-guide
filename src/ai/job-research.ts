import { ai } from '@/ai/genkit';
import { getGeminiModel } from '@/ai/model-router';
import { z } from 'genkit';

const JobResearchInputSchema = z.object({
  message: z.string().optional(),
  jobTitle: z.string().optional(),
  jobDescription: z.string().optional(),
});

export const JobResearchContextSchema = z.object({
  inferredTitle: z.string().describe('Best-fit role title inferred from the available input.'),
  topic: z.string().describe('Short role family or job topic label.'),
  seniority: z.string().describe('Detected or likely seniority, or "unspecified".'),
  responsibilities: z.array(z.string()).describe('The most important responsibilities for this role.'),
  requirements: z.array(z.string()).describe('The most important explicit or likely requirements for this role.'),
  keywords: z.array(z.string()).describe('Priority keywords, tools, domains, or competencies tied to this role.'),
  confidence: z.enum(['high', 'medium', 'low']).describe('Confidence in the inferred role fit.'),
  reasoningNote: z.string().describe('One short sentence on what signals drove the inference.'),
});

export type JobResearchInput = z.infer<typeof JobResearchInputSchema>;
export type JobResearchContext = z.infer<typeof JobResearchContextSchema>;

function cleanText(value?: string) {
  return value?.replace(/\s+/g, ' ').trim() || '';
}

function guessTitleFromMessage(message: string) {
  const patterns = [
    /(?:for|as|about|target(?:ing)?|title|role)\s+(?:an?\s+)?([A-Za-z][A-Za-z0-9+&/,\- ]{2,60})/i,
    /(?:job|position)\s+(?:of|as)\s+([A-Za-z][A-Za-z0-9+&/,\- ]{2,60})/i,
  ];

  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match?.[1]) {
      return cleanText(match[1]);
    }
  }

  return '';
}

function extractRequirementLines(jobDescription: string) {
  const snippets = jobDescription
    .split(/\r?\n|[.;]\s+/)
    .map((line) => line.replace(/^[-*•\d.)\s]+/, '').trim())
    .filter(Boolean);

  const weighted = snippets.filter((line) =>
    /(require|must|need|experience|qualification|skill|responsib|proficien|knowledge|expert|familiar)/i.test(line)
  );

  return (weighted.length ? weighted : snippets).slice(0, 8);
}

function buildFallbackContext(input: JobResearchInput): JobResearchContext {
  const normalizedTitle = cleanText(input.jobTitle) || guessTitleFromMessage(cleanText(input.message)) || 'General role';
  const normalizedDescription = cleanText(input.jobDescription);
  const requirements = normalizedDescription ? extractRequirementLines(normalizedDescription) : [];
  const keywords = requirements
    .flatMap((line) => line.split(/[,/]| and /i))
    .map((item) => item.trim())
    .filter((item) => item.length > 2)
    .slice(0, 10);

  return {
    inferredTitle: normalizedTitle,
    topic: normalizedTitle,
    seniority: 'unspecified',
    responsibilities: requirements.slice(0, 5),
    requirements,
    keywords,
    confidence: normalizedDescription || normalizedTitle !== 'General role' ? 'medium' : 'low',
    reasoningNote: normalizedDescription
      ? 'Built from the supplied role title and job-description language.'
      : 'Built from the available title or message with limited requirement detail.',
  };
}

export function formatJobResearchContext(context: JobResearchContext) {
  const lines = [
    `Detected role title: ${context.inferredTitle}`,
    `Detected topic: ${context.topic}`,
    `Detected seniority: ${context.seniority}`,
    `Inference confidence: ${context.confidence}`,
    `Why this fit: ${context.reasoningNote}`,
    context.responsibilities.length
      ? `Core responsibilities:\n- ${context.responsibilities.join('\n- ')}`
      : 'Core responsibilities: none confidently identified.',
    context.requirements.length
      ? `Key requirements:\n- ${context.requirements.join('\n- ')}`
      : 'Key requirements: none explicitly identified.',
    context.keywords.length
      ? `Priority keywords: ${context.keywords.join(', ')}`
      : 'Priority keywords: none confidently identified.',
  ];

  return lines.join('\n');
}

export async function buildJobResearchContext(input: JobResearchInput): Promise<JobResearchContext> {
  const normalizedInput = {
    message: cleanText(input.message),
    jobTitle: cleanText(input.jobTitle),
    jobDescription: cleanText(input.jobDescription),
  };

  if (!normalizedInput.message && !normalizedInput.jobTitle && !normalizedInput.jobDescription) {
    return buildFallbackContext(input);
  }

  try {
    const model = await getGeminiModel('jobResearch');
    const response = await ai.generate({
      model,
      config: { temperature: 0.1 },
      system: `You are a career-role research analyst.

Infer the user's target job topic from the supplied message, role title, and job description.

Rules:
- Prefer explicit evidence from the input.
- If a full job description is present, extract the real requirements from it.
- If only a title is present, infer likely modern responsibilities and requirement clusters for that title.
- Do not claim to have browsed the web or cite company-specific facts that are not in the input.
- When the title is broad, return the most likely role family instead of being vague.
- Keep responsibilities and requirements concrete, useful, and resume-tailoring friendly.
- Return JSON only.`,
      prompt: `User message:
${normalizedInput.message || '(none provided)'}

Job title:
${normalizedInput.jobTitle || '(none provided)'}

Job description:
${normalizedInput.jobDescription || '(none provided)'}`,
      output: { schema: JobResearchContextSchema },
    });

    return response.output || buildFallbackContext(input);
  } catch (error) {
    console.error('[JobResearch] Falling back to deterministic role inference:', error);
    return buildFallbackContext(input);
  }
}
