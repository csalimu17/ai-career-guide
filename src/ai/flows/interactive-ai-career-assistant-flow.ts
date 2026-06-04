'use server';
/**
 * @fileOverview An interactive AI chat assistant for career guidance.
 *
 * - interactiveAiCareerAssistant - A function that handles the AI chat interaction.
 * - InteractiveAiCareerAssistantInput - The input type for the interactiveAiCareerAssistant function.
 * - InteractiveAiCareerAssistantOutput - The return type for the interactiveAiCareerAssistant function.
 */

import { getAi } from '@/ai/genkit';
import { generateWithFallback } from '@/ai/generate-helper';
import { buildJobResearchContext, formatJobResearchContext } from '@/ai/job-research';
import { getGeminiModel, getFallbackGeminiModel } from '@/ai/model-router';
import { z } from 'zod';
import { db } from '@/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

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
// --- TOOLS ---
let listUserResumesTool: any = null;
const getListUserResumesTool = (ai: any) => {
  if (listUserResumesTool) return listUserResumesTool;
  listUserResumesTool = ai.defineTool(
    {
      name: 'listUserResumes',
      description: 'Lists the titles and updated dates of the user\'s current resumes/CVs.',
      inputSchema: z.object({ uid: z.string() }),
      outputSchema: z.string(),
    },
    async ({ uid }: { uid: string }) => {
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
  return listUserResumesTool;
};

let listJobApplicationsTool: any = null;
const getListJobApplicationsTool = (ai: any) => {
  if (listJobApplicationsTool) return listJobApplicationsTool;
  listJobApplicationsTool = ai.defineTool(
    {
      name: 'listJobApplications',
      description: 'Lists the user\'s tracked job applications and their current status.',
      inputSchema: z.object({ uid: z.string() }),
      outputSchema: z.string(),
    },
    async ({ uid }: { uid: string }) => {
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
  return listJobApplicationsTool;
};

let getUserProfileTool: any = null;
const getGetUserProfileTool = (ai: any) => {
  if (getUserProfileTool) return getUserProfileTool;
  getUserProfileTool = ai.defineTool(
    {
      name: 'getUserProfile',
      description: 'Fetches basic profile information about the user (name, plan).',
      inputSchema: z.object({ uid: z.string() }),
      outputSchema: z.string(),
    },
    async ({ uid }: { uid: string }) => {
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
  return getUserProfileTool;
};

let createResumeTool: any = null;
const getCreateResumeTool = (ai: any) => {
  if (createResumeTool) return createResumeTool;
  createResumeTool = ai.defineTool(
    {
      name: 'createResume',
      description: 'Creates a new resume/CV for the user with the provided name and summary.',
      inputSchema: z.object({ uid: z.string(), name: z.string(), summary: z.string().optional() }),
      outputSchema: z.string(),
    },
    async ({ uid, name, summary }: { uid: string; name: string; summary?: string }) => {
      try {
        const resumesRef = db.collection('users').doc(uid).collection('resumes');
        const docRef = await resumesRef.add({
          userId: uid,
          name: name,
          templateId: 'modern-clean', // default
          sectionOrder: ["summary", "experience", "education", "skills", "languages", "projects", "certifications"],
          content: {
            personal: { name: "", title: "", email: "", phone: "", location: "", linkedin: "", website: "" },
            summary: summary || "",
            experience: [],
            education: [],
            skills: [],
            languages: [],
            projects: [],
            certifications: [],
          },
          styles: { primaryColor: "hsl(221.2 83.2% 53.3%)", fontFamily: "inter", fontSize: "10pt", lineHeight: "1.5", margins: "default" },
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });
        return `Successfully created resume '${name}' with ID: ${docRef.id}`;
      } catch (e) {
        return "Error creating resume.";
      }
    }
  );
  return createResumeTool;
};

let trackJobApplicationTool: any = null;
const getTrackJobApplicationTool = (ai: any) => {
  if (trackJobApplicationTool) return trackJobApplicationTool;
  trackJobApplicationTool = ai.defineTool(
    {
      name: 'trackJobApplication',
      description: 'Tracks a new job application for the user.',
      inputSchema: z.object({ uid: z.string(), company: z.string(), role: z.string(), status: z.string() }),
      outputSchema: z.string(),
    },
    async ({ uid, company, role, status }: { uid: string; company: string; role: string; status: string }) => {
      try {
        const appsRef = db.collection('users').doc(uid).collection('jobApplications');
        const docRef = await appsRef.add({
          company,
          role,
          status,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });
        return `Successfully tracked job application at '${company}' for role '${role}' with ID: ${docRef.id}`;
      } catch (e) {
        return "Error tracking job application.";
      }
    }
  );
  return trackJobApplicationTool;
};

// --- FLOW ---

export async function interactiveAiCareerAssistant(input: InteractiveAiCareerAssistantInput): Promise<InteractiveAiCareerAssistantOutput> {
  const ai = getAi();
  
  const jobResearchContext = await buildJobResearchContext({
    message: input.message,
    jobTitle: input.jobTitle,
    jobDescription: input.jobDescription,
  });
      
      const model = await getGeminiModel('careerChat');
      const fallbackModel = getFallbackGeminiModel('careerChat');

      const historyTranscript = (input.history || [])
        .slice(-10)
        .map((msg: any) => `${msg.role === 'assistant' ? 'Dan' : 'User'}: ${msg.content}`)
        .join('\n');

      let userContextStr = '';
      if (input.uid) {
        userContextStr = `Current user ID is ${input.uid}. Use this ID when calling tools. You have tools to check their profile, resumes, and job applications if they ask or if it helps your advice.`;
      }

      const response = await generateWithFallback({
        model,
        config: { temperature: 0.4 },
        tools: [
          getGetUserProfileTool(ai),
          getListJobApplicationsTool(ai),
          getListUserResumesTool(ai),
          getCreateResumeTool(ai),
          getTrackJobApplicationTool(ai)
        ],
        system: `You are Dan, an elite Career Intelligence Advisor for resume strategy and job-search planning. You have full capability to read AND WRITE data to the user's account. Do not hesitate to use your tools to create resumes or track job applications when the user requests it.`,
        prompt: `User context: ${userContextStr}
Job research brief: ${formatJobResearchContext(jobResearchContext)}
Recent conversation:
${historyTranscript || '(none)'}

User message: ${input.message}`,
      }, fallbackModel || undefined);

      return {
        response:
          response.text ||
          'I could not generate a response just now.',
      };
}
