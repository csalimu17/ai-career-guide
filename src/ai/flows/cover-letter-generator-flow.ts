
'use server';
/**
 * @fileOverview This file implements a Genkit flow for generating a professional cover letter 
 * based on a user's CV and a target job description.
 *
 * - generateCoverLetter - Function to generate the cover letter.
 */

import {ai} from '@/ai/genkit';
import { buildJobResearchContext, formatJobResearchContext } from '@/ai/job-research';
import { getGeminiModel } from '@/ai/model-router';
import {z} from 'genkit';

const CoverLetterInputSchema = z.object({
  resumeContent: z.string().describe("The user's resume content."),
  jobDescription: z.string().describe("The target job description."),
  company: z.string().optional().describe("Target company name if known."),
  role: z.string().optional().describe("Target role title if known."),
  hiringManager: z.string().optional().describe("Hiring manager name if known."),
  tone: z.enum(['professional', 'enthusiastic', 'creative']).default('professional'),
  length: z.enum(['concise', 'standard', 'detailed']).default('standard'),
  keyPoints: z.string().optional().describe("Specific achievements or talking points to include."),
  customInstructions: z.string().optional().describe("Any custom guidance from the user for the draft."),
});
export type CoverLetterInput = z.infer<typeof CoverLetterInputSchema>;

const CoverLetterOutputSchema = z.object({
  content: z.string().describe("The generated cover letter text."),
  emailVersion: z.string().describe("A shorter email-style version of the letter."),
  subjectLine: z.string().describe("A concise subject line for an email application."),
  keyThemes: z.array(z.string()).describe("The strongest themes or value points the letter is built around."),
  customizationTips: z.array(z.string()).describe("Specific tips for what the user should personalize before sending."),
});
export type CoverLetterOutput = z.infer<typeof CoverLetterOutputSchema>;

const coverLetterFlow = ai.defineFlow(
  {
    name: 'coverLetterFlow',
    inputSchema: CoverLetterInputSchema,
    outputSchema: CoverLetterOutputSchema,
  },
  async input => {
    const jobResearchContext = await buildJobResearchContext({
      jobTitle: input.role,
      jobDescription: input.jobDescription,
    });
    const model = await getGeminiModel('cvWriting');

    const response = await ai.generate({
      model,
      config: { temperature: input.tone === 'creative' ? 0.6 : input.tone === 'enthusiastic' ? 0.45 : 0.3 },
      system: `You are an expert career consultant and cover-letter strategist.

Craft a compelling, professional cover-letter package that matches the target role closely.

Rules:
- Highlight resume evidence that maps directly to the job requirements.
- Use the job research brief to understand the role title correctly.
- Maintain the requested tone and length.
- Use the company and role naturally when provided.
- Use the hiring manager only if supplied; otherwise use a safe opener like "Dear Hiring Team".
- Focus on how the candidate can solve problems implied by the role.
- Do not invent metrics, tools, credentials, employers, or achievements.
- Avoid placeholders like [Your Name] or [Company].
- Return JSON only.`,
      prompt: `Requested tone: ${input.tone}
Requested length: ${input.length}
Company: ${input.company || '(not provided)'}
Role: ${input.role || '(not provided)'}
Hiring manager: ${input.hiringManager || '(not provided)'}

Job research brief:
${formatJobResearchContext(jobResearchContext)}

Extra points to weave in if relevant:
${input.keyPoints || '(none provided)'}

Custom guidance:
${input.customInstructions || '(none provided)'}

Resume:
${input.resumeContent}

Job Description:
${input.jobDescription}`,
      output: { schema: CoverLetterOutputSchema },
    });

    return response.output!;
  }
);

export async function generateCoverLetter(input: CoverLetterInput): Promise<CoverLetterOutput> {
  return coverLetterFlow(input);
}
