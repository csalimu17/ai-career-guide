"use server";

import { getAi } from "@/ai/genkit";
import { reasoningGeminiModel } from "@/ai/genkit";
import { z } from "zod";
import { AgentRole, CAREER_AGENTS, RoutingResult } from "./CareerAgents";

const RoutingSchema = z.object({
  role: z.enum(["STRATEGIST", "ATS", "MANAGER", "RECRUITER", "GENERAL"]),
  reason: z.string(),
});

export const classifyCareerRouting = async (text: string): Promise<RoutingResult> => {
  const roles = Object.keys(CAREER_AGENTS).join(", ");
  const ai = getAi();
  
  try {
    const { output } = await ai.generate({
      model: reasoningGeminiModel,
      prompt: `
        Classify this career-related query into one of the following roles: ${roles}.
        
        Guidelines:
        - STRATEGIST: Questions about goals, branding, summary, or "how to tell my story".
        - ATS: Questions about keywords, tech stack, formatting for systems, or specific tools.
        - MANAGER: Questions about making experience sound "better", showing results, or business impact.
        - RECRUITER: Questions about summaries, quick pitches, or how to appear more attractive to companies.
        - GENERAL: Formatting, general layout, or tool help.

        User Query: "${text}"
      `,
      output: { schema: RoutingSchema }
    });

    if (!output) throw new Error("No classification output");
    return output;
  } catch (error) {
    console.error("[CareerRouting] Classification failed:", error);
    return { role: "GENERAL", reason: "Fallback due to system error" };
  }
}

export const getCareerAgentResponse = async (
  role: AgentRole, 
  text: string, 
  resumeContext: any
): Promise<string> => {
  const agent = CAREER_AGENTS[role];
  const ai = getAi();
  
  try {
    const { text: responseText } = await ai.generate({
      model: reasoningGeminiModel,
      system: agent.systemPrompt + "\n\nUse the following resume context to provide specific help:\n" + JSON.stringify(resumeContext, null, 2),
      prompt: text,
    });

    return responseText || "I'm sorry, I couldn't process that. Please try again.";
  } catch (error) {
    console.error("[CareerRouting] Response generation failed:", error);
    return "The career advisor service encountered an error. Please try again later.";
  }
}
