'use server';
// Trigger rebuild

import { getAi } from '@/ai/genkit';
import { generateWithFallback } from '@/ai/generate-helper';
import { getGeminiModel } from '@/ai/model-router';
import { z } from 'zod';

// --- GENERATE QUESTIONS ---

const GenerateInterviewQuestionsInputSchema = z.object({
  jobTitle: z.string(),
  jobDescription: z.string().optional(),
  interviewType: z.enum(["technical", "behavioral", "mixed"]),
  count: z.number().default(5),
});
export type GenerateInterviewQuestionsInput = z.infer<typeof GenerateInterviewQuestionsInputSchema>;

const GenerateInterviewQuestionsOutputSchema = z.object({
  questions: z.array(z.object({
    id: z.string(),
    question: z.string(),
    type: z.string(),
    intent: z.string(),
    tips: z.string(),
  })),
});
export type GenerateInterviewQuestionsOutput = z.infer<typeof GenerateInterviewQuestionsOutputSchema>;

export async function generateInterviewQuestions(input: GenerateInterviewQuestionsInput): Promise<GenerateInterviewQuestionsOutput> {
  const model = await getGeminiModel("careerChat");
  
  const system = `You are an expert Interview Coach at a top-tier recruitment firm.
  Your goal is to generate high-quality, role-specific interview questions.
  
  For each question, provide:
  - id: a unique identifier
  - question: the text of the interview question
  - type: behavioral, technical, or situational
  - intent: why an interviewer is asking this question
  - tips: what the candidate should focus on in their STAR response
  
  Output must strictly adhere to the provided schema.`;

  const prompt = `Generate ${input.count} interview questions for the following role:
  
  Role: ${input.jobTitle}
  Description: ${input.jobDescription || "N/A"}
  Type: ${input.interviewType}`;

  const response = await generateWithFallback({
    model,
    config: { 
      temperature: 0.7,
    },
    system,
    prompt,
    output: { schema: GenerateInterviewQuestionsOutputSchema }
  });

  return response.output!;
}

// --- ANALYZE RESPONSE ---

const AnalyzeInterviewResponseInputSchema = z.object({
  question: z.string(),
  answer: z.string(),
});
export type AnalyzeInterviewResponseInput = z.infer<typeof AnalyzeInterviewResponseInputSchema>;

const AnalyzeInterviewResponseOutputSchema = z.object({
  score: z.number(),
  feedback: z.string(),
  strengths: z.array(z.string()),
  improvements: z.array(z.string()),
  suggestedAnswer: z.string(),
});
export type AnalyzeInterviewResponseOutput = z.infer<typeof AnalyzeInterviewResponseOutputSchema>;

export async function analyzeInterviewResponse(input: AnalyzeInterviewResponseInput): Promise<AnalyzeInterviewResponseOutput> {
  const model = await getGeminiModel("default");

  const system = `You are an AI Interview Coach. Analyze the candidate's response.
  Provide a comprehensive analysis including:
  - score: 1-100 based on clarity, structure (STAR), and impact.
  - feedback: a detailed paragraph of constructive feedback.
  - strengths: 3 key highlights of their answer.
  - improvements: 3 specific areas to strengthen.
  - suggestedAnswer: a rewritten version of their answer that is more impactful.
  
  Output must strictly adhere to the provided schema.`;

  const prompt = `Question: ${input.question}
  Candidate Answer: ${input.answer}`;

  const response = await generateWithFallback({
    model,
    config: { 
      temperature: 0.4,
    },
    system,
    prompt,
    output: { schema: AnalyzeInterviewResponseOutputSchema }
  });

  return response.output!;
}
