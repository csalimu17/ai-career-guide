'use server';
/**
 * @fileOverview An interactive AI chat assistant for career guidance.
 *
 * - interactiveAiCareerAssistant - A function that handles the AI chat interaction.
 * - InteractiveAiCareerAssistantInput - The input type for the interactiveAiCareerAssistant function.
 * - InteractiveAiCareerAssistantOutput - The return type for the interactiveAiCareerAssistant function.
 */

import { ai } from '@/ai/genkit';
import { generateWithFallback } from '@/ai/generate-helper';
import { buildJobResearchContext, formatJobResearchContext } from '@/ai/job-research';
import { getGeminiModel, getFallbackGeminiModel } from '@/ai/model-router';
import { z } from 'genkit';
import { db } from '@/firebase/admin';

const InteractiveAiCareerAssistantInputSchema = z.object({
  message: z.string().describe('The user\'s message to the AI assistant.'),
  uid: z.string().optional().describe('The current user\'s unique ID for fetching their data.'),
  history: z.array(z.object({
    role: z.enum(['assistant', 'user']),
    content: z.string(),
  })).optional().describe('Previous chat history for context.'),
  jobTitle: z.string().optional().describe('Optional explicit target role title.'),
  jobDescription: z.string().optional().describe('Optional explicit job description or requirements text.'),
});
export type InteractiveAiCareerAssistantInput = z.infer<typeof InteractiveAiCareerAssistantInputSchema>;

const InteractiveAiCareerAssistantOutputSchema = z.object({
  response: z.string().describe('The AI assistant\'s response.'),
});
export type InteractiveAiCareerAssistantOutput = z.infer<typeof InteractiveAiCareerAssistantOutputSchema>;

// --- TOOLS ---

const listUserResumesTool = ai.defineTool(
  {
    name: 'listUserResumes',
    description: 'Lists the titles and updated dates of the user\'s current resumes/CVs.',
    inputSchema: z.object({ uid: z.string() }),
    outputSchema: z.string(),
  },
  async ({ uid }) => {
    try {
      const snapshot = await db.collection('users').doc(uid).collection('resumes').orderBy('updatedAt', 'desc').get();
      if (snapshot.empty) return "User has no resumes created yet.";
      
      const resumes = snapshot.docs.map(doc => {
        const data = doc.data();
        return `- ${data.name || 'Untitled CV'} (ID: ${doc.id}, Updated: ${data.updatedAt?.toDate()?.toLocaleDateString() || 'Recently'})`;
      });
      return "Current Resumes:\n" + resumes.join('\n');
    } catch (e) {
      return "Error fetching resumes.";
    }
  }
);

const listJobApplicationsTool = ai.defineTool(
  {
    name: 'listJobApplications',
    description: 'Lists the user\'s tracked job applications and their current status.',
    inputSchema: z.object({ uid: z.string() }),
    outputSchema: z.string(),
  },
  async ({ uid }) => {
    try {
      const snapshot = await db.collection('users').doc(uid).collection('jobApplications').orderBy('updatedAt', 'desc').limit(10).get();
      if (snapshot.empty) return "User has no tracked job applications yet.";
      
      const apps = snapshot.docs.map(doc => {
        const data = doc.data();
        return `- ${data.role} at ${data.company} (Status: ${data.status}, Updated: ${data.updatedAt?.toDate()?.toLocaleDateString() || 'Recently'})`;
      });
      return "Recent Job Applications:\n" + apps.join('\n');
    } catch (e) {
      return "Error fetching job applications.";
    }
  }
);

const getUserProfileTool = ai.defineTool(
  {
    name: 'getUserProfile',
    description: 'Fetches basic profile information about the user (name, plan).',
    inputSchema: z.object({ uid: z.string() }),
    outputSchema: z.string(),
  },
  async ({ uid }) => {
    try {
      const doc = await db.collection('users').doc(uid).get();
      if (!doc.exists) return "User profile not found.";
      const data = doc.data()!;
      return `User: ${data.firstName} ${data.lastName} (Plan: ${data.plan}, Verified: ${data.verified})`;
    } catch (e) {
      return "Error fetching user profile.";
    }
  }
);

// --- FLOW ---

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
    const fallbackModel = getFallbackGeminiModel('careerChat');

    const historyTranscript = (input.history || [])
      .slice(-10)
      .map((msg) => `${msg.role === 'assistant' ? 'Dan' : 'User'}: ${msg.content}`)
      .join('\n');

    // Pre-prompt with context about the user's situation if possible
    let userContextStr = '';
    if (input.uid) {
      userContextStr = `Current user ID is ${input.uid}. Use this ID when calling tools. You have tools to check their profile, resumes, and job applications if they ask or if it helps your advice.`;
    }

    const response = await generateWithFallback({
      model,
      config: { temperature: 0.4 },
      tools: [listUserResumesTool, listJobApplicationsTool, getUserProfileTool],
      system: `You are Dan, an elite Career Intelligence Advisor for resume strategy and job-search planning.
Personal Identity: Your name is Dan. You are helpful, professional, and strategic.

Your Capabilities:
- You may receive recent conversation turns as plain-text transcript context.
- You can look up the user's current resumes, job applications, and profile using tools.
- You provide actionable, high-quality advice for job seekers.

Site Context:
- /resumes: Where users see all their CVs.
- /tracker: Where users track their job applications.
- /editor: Where users edit a specific CV.
- /ats: Where users check their resume against a job description.

Behavior rules:
- Give clear, concise, practical guidance.
- If relevant, recommend specific pages on our site (e.g., "Check the ATS Optimizer for that").
- Ground advice in the supplied job research brief when appropriate.
- Prefer actionable advice over generic motivation.
- Organise answers into short sections or bullets.`,
      prompt: `User context: ${userContextStr}
Job research brief: ${formatJobResearchContext(jobResearchContext)}
Recent conversation:
${historyTranscript || '(none)'}

User message: ${input.message}`,
    }, fallbackModel || undefined);

    return {
      response:
        response.text ||
        'I could not generate a response just now. Please try again with a bit more detail about your goal or target role.',
    };
  }
);
