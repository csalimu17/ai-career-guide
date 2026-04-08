import { ai, fastGeminiModel } from '@/ai/genkit';
import { z } from 'genkit';

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
export const parseLinkedInJobs = ai.defineFlow(
  {
    name: 'parseLinkedInJobs',
    inputSchema: z.object({
      text: z.string().describe('Messy text copied from LinkedIn'),
    }),
    outputSchema: LinkedInJobParseSchema,
  },
  async (input) => {
    const { text } = input;

    const response = await ai.generate({
      model: fastGeminiModel,
      system: `You are a professional career assistant specializing in job tracking.
Your task is to extract job application details from messy, copy-pasted text from LinkedIn's "Applied Jobs" or "My Jobs" pages.

STATUS MAPPING RULES:
- "Applied", "Viewed", "In-review", "Application viewed", "Resume viewed" -> 'applied'
- "Saved", "In progress" -> 'saved'
- "Interviewing", "Interview", "Phone screen" -> 'interviewing'
- "Not selected", "Rejected", "Application closed" -> 'rejected'
- "Offer", "Hired" -> 'offer'

EXTRACTION RULES:
- Identify the Company name and Job Title (Role) clearly.
- Extract location if present.
- Extract any relative dates (e.g., "2 days ago", "1 month ago").
- If a URL is found that looks like a LinkedIn job link (linkedin.com/jobs/view/...), include it.
- Filter out noise like "Promoted", "Easy Apply", "Footer" text, etc.
- If no jobs are found, return an empty array.

Return structured JSON ONLY.`,
      prompt: `TEXT TO PARSE:
---
${text}
---`,
      output: { schema: LinkedInJobParseSchema }
    });

    return response.output || { jobs: [] };
  }
);
