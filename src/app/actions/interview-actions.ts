"use server"
// Trigger rebuild

import { generateInterviewQuestions, analyzeInterviewResponse } from "@/ai/flows/interview-simulator-flow"

export async function generateInterviewQuestionsAction(params: {
  jobTitle: string,
  jobDescription?: string,
  interviewType: "technical" | "behavioral" | "mixed",
  count?: number
}) {
  try {
    const result = await generateInterviewQuestions({
      ...params,
      count: params.count ?? 5
    });
    return { success: true, data: result };
  } catch (error: any) {
    console.error("Generate Questions Error:", error);
    return { success: false, error: error.message || "Failed to generate questions" };
  }
}

export async function analyzeInterviewResponseAction(params: {
  question: string,
  answer: string
}) {
  try {
    const result = await analyzeInterviewResponse(params);
    return { success: true, data: result };
  } catch (error: any) {
    console.error("Analyze Response Error:", error);
    return { success: false, error: error.message || "Failed to analyze response" };
  }
}
