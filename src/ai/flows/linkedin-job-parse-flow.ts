import { getAi, fastGeminiModel } from '@/ai/genkit';
import { z } from 'zod';

export const LinkedInJobParseSchema = z.object({
  jobs: z.array(z.object({
    company: z.string().describe('The name of the company'),
    role: z.string().describe('The job title or role'),
    location: z.string().optional().describe('City, State or Remote'),
    status: z.enum(['saved', 'applied', 'interviewing', 'offer', 'rejected']).describe('The tracking status'),
    appliedDateLabel: z.string().optional().describe('Relative date like "2 days ago" or "Applied on Mar 10"'),
    sourceUrl: z.string().optional().describe('LinkedIn job URL if found'),
  }))
});

/**
 * LinkedIn Job Extraction Flow
 * ----------------------------
 * Parses messy clipboard text from LinkedIn "My Jobs" or "Applied" pages.
 */
export async function parseLinkedInJobs(input: { text: string }): Promise<z.infer<typeof LinkedInJobParseSchema>> {
  const ai = getAi();
  
  const flow = ai.defineFlow(
    {
      name: 'parseLinkedInJobs',
      inputSchema: z.object({
        text: z.string().describe('Messy text copied from LinkedIn'),
      }),
      outputSchema: LinkedInJobParseSchema,
    },
    async (innerInput: { text: string }) => {
      const { text } = innerInput;

      const response = await ai.generate({
        model: fastGeminiModel,
        system: `You are a professional career assistant specialization...`,
        prompt: `TEXT TO PARSE:
---
${text}
---`,
        output: { schema: LinkedInJobParseSchema }
      });

      return response.output || { jobs: [] };
    }
  );

  return flow(input);
}
