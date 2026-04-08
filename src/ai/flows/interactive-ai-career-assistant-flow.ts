'use server';
/**
 * @fileOverview An interactive AI chat assistant for career guidance.
 *
 * - interactiveAiCareerAssistant - A function that handles the AI chat interaction.
 * - InteractiveAiCareerAssistantInput - The input type for the interactiveAiCareerAssistant function.
 * - InteractiveAiCareerAssistantOutput - The return type for the interactiveAiCareerAssistant function.
 */

import { ai } from '@/ai/genkit';
import { buildJobResearchContext, formatJobResearchContext } from '@/ai/job-research';
import { getGeminiModel } from '@/ai/model-router';
import { z } from 'genkit';

const InteractiveAiCareerAssistantInputSchema = z.object({
  message: z.string().describe('The user\'s message to the AI assistant.'),
  jobTitle: z.string().optional().describe('Optional explicit target role title.'),
  jobDescription: z.string().optional().describe('Optional explicit job description or requirements text.'),
});
export type InteractiveAiCareerAssistantInput = z.infer<typeof InteractiveAiCareerAssistantInputSchema>;

const InteractiveAiCareerAssistantOutputSchema = z.object({
  response: z.string().describe('The AI assistant\'s response.'),
});
export type InteractiveAiCareerAssistantOutput = z.infer<typeof InteractiveAiCareerAssistantOutputSchema>;

export async function interactiveAiCareerAssistant(input: InteractiveAiCareerAssistantInput): Promise<InteractiveAiCareerAssistantOutput> {
  return interactiveAiCareerAssistantFlow(input);
}

const interactiveAiCareerAssistantFlow = ai.defineFlow(
  {
    name: 'interactiveAiCareerAssistantFlow',
    inputSchema: InteractiveAiCareerAssistantInputSchema,
    outputSchema: InteractiveAiCareerAssistantOutputSchema,
  },
  async (input) => {
    const jobResearchContext = await buildJobResearchContext({
      message: input.message,
      jobTitle: input.jobTitle,
      jobDescription: input.jobDescription,
    });
    const model = await getGeminiModel('careerChat');

    const response = await ai.generate({
      model,
      config: { temperature: 0.35 },
      system: `You are an elite Career Intelligence Advisor for resume strategy, job-fit research, interview preparation, and job-search planning.

Behavior rules:
- Give clear, concise, practical guidance.
- If the user is asking about a role, title, or requirements, ground your advice in the supplied job research brief.
- Distinguish clearly between explicit requirements from the user input and likely role expectations inferred from the title.
- When inferring, use wording like "likely", "typically", or "for this kind of role".
- Prefer actionable advice over generic motivation.
- When helpful, organize the answer into short sections or bullets.
- Do not claim to have looked anything up online.`,
      prompt: `User message:
${input.message}

Job research brief:
${formatJobResearchContext(jobResearchContext)}`,
      output: { schema: InteractiveAiCareerAssistantOutputSchema },
    });

    return response.output || {
      response: 'I could not generate a response just now. Please try again with the role title or job requirements.',
    };
  }
);
