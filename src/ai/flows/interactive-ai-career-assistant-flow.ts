'use server';
/**
 * @fileOverview An interactive AI chat assistant for career guidance.
 *
 * - interactiveAiCareerAssistant - A function that handles the AI chat interaction.
 * - InteractiveAiCareerAssistantInput - The input type for the interactiveAiCareerAssistant function.
 * - InteractiveAiCareerAssistantOutput - The return type for the interactiveAiCareerAssistant function.
 */

import { AsyncLocalStorage } from 'node:async_hooks';
import { getAi } from '@/ai/genkit';
import { generateWithFallback } from '@/ai/generate-helper';
import { getFallbackModels, getGeminiModel } from '@/ai/model-router';
import { z } from 'zod';
import { db } from '@/firebase/admin';
import { atsOptimizationScoring } from './ats-optimization-scoring-flow';
import { generateInterviewQuestions } from './interview-simulator-flow';
import { enhanceCvContent } from './cv-content-enhancement-flow';

/**
 * SECURITY: All assistant tools accept `uid` as an input parameter, which
 * the LLM populates from its own reasoning. Without enforcement, a prompt
 * like "show me resumes for uid X" would let the model trigger Firestore
 * reads against ANOTHER user's data. This per-request storage holds the
 * authenticated caller's uid; every tool must call `requireAuthedUid()`
 * and ignore the model-supplied value.
 */
const authedUidStorage = new AsyncLocalStorage<string | undefined>();

function requireAuthedUid(): string {
  const uid = authedUidStorage.getStore();
  if (!uid) {
    // Surfaced into the tool output stream; the assistant will explain it.
    throw new Error('User session not available. Please sign in and retry.');
  }
  return uid;
}

/**
 * SECURITY: Always return the user document for the *authenticated* caller,
 * ignoring whatever `uid` the model passes into the tool. All assistant
 * tools query Firestore through this helper so the LLM cannot be tricked
 * into reading or writing another user's data via a crafted tool call.
 */
function authedUserDoc() {
  return db.collection('users').doc(requireAuthedUid());
}

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
  toolResults: z.array(z.any()).optional().describe('The results of any tools executed during the flow.'),
});
export type InteractiveAiCareerAssistantOutput = z.infer<typeof InteractiveAiCareerAssistantOutputSchema>;

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
        const snapshot = await authedUserDoc().collection('resumes').orderBy('updatedAt', 'desc').get();
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
        const snapshot = await authedUserDoc().collection('jobApplications').orderBy('updatedAt', 'desc').limit(10).get();
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
        const doc = await authedUserDoc().get();
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

let getResumeContentTool: any = null;
const getGetResumeContentTool = (ai: any) => {
  if (getResumeContentTool) return getResumeContentTool;
  getResumeContentTool = ai.defineTool(
    {
      name: 'getResumeContent',
      description: 'Fetches the full content of a specific resume/CV by its ID.',
      inputSchema: z.object({ uid: z.string(), resumeId: z.string() }),
      outputSchema: z.string(),
    },
    async ({ uid, resumeId }: { uid: string, resumeId: string }) => {
      try {
        const doc = await authedUserDoc().collection('resumes').doc(resumeId).get();
        if (!doc.exists) return "Resume not found.";
        const data = doc.data()!;
        return JSON.stringify({
           name: data.name,
           content: data.content,
           updatedAt: data.updatedAt?.toDate()?.toISOString()
        }, null, 2);
      } catch (e) {
        return "Error fetching resume content.";
      }
    }
  );
  return getResumeContentTool;
};

let getJobApplicationDetailsTool: any = null;
const getGetJobApplicationDetailsTool = (ai: any) => {
  if (getJobApplicationDetailsTool) return getJobApplicationDetailsTool;
  getJobApplicationDetailsTool = ai.defineTool(
    {
      name: 'getJobApplicationDetails',
      description: 'Fetches detailed information about a specific job application.',
      inputSchema: z.object({ uid: z.string(), applicationId: z.string() }),
      outputSchema: z.string(),
    },
    async ({ uid, applicationId }: { uid: string, applicationId: string }) => {
      try {
        const doc = await authedUserDoc().collection('jobApplications').doc(applicationId).get();
        if (!doc.exists) return "Job application not found.";
        return JSON.stringify(doc.data(), null, 2);
      } catch (e) {
        return "Error fetching job application details.";
      }
    }
  );
  return getJobApplicationDetailsTool;
};

let searchLiveJobsTool: any = null;
const getSearchLiveJobsTool = (ai: any) => {
  if (searchLiveJobsTool) return searchLiveJobsTool;
  searchLiveJobsTool = ai.defineTool(
    {
      name: 'searchLiveJobs',
      description: 'Searches the live UK job market for specific roles or locations.',
      inputSchema: z.object({ 
        keywords: z.string().describe('Role title or skills to search for.'),
        location: z.string().optional().describe('UK city or region.'),
        workplace: z.enum(['all', 'remote', 'hybrid', 'onsite']).optional()
      }),
      outputSchema: z.string(),
    },
    async (params: any) => {
      try {
        const { jobFetcher } = await import('@/lib/jobs/job-fetcher');
        const results = await jobFetcher.fetchJobs({
          keywords: params.keywords,
          location: params.location || "United Kingdom",
          workplace: params.workplace || "all",
          page: 1
        });
        
        if (results.listings.length === 0) return "No matching live jobs found.";
        
        const summary = results.listings.slice(0, 5).map(j => 
          `- ${j.role} at ${j.company} (${j.location}): ${j.salarySummary || 'Salary not listed'}. ID: ${j.id}`
        ).join('\n');
        
        return "Top results from live UK market:\n" + summary + "\n(Ask for details on a specific Job ID if needed)";
      } catch (e) {
        return "Error searching live jobs.";
      }
    }
  );
  return searchLiveJobsTool;
};

let getLiveJobDetailsTool: any = null;
const getGetLiveJobDetailsTool = (ai: any) => {
  if (getLiveJobDetailsTool) return getLiveJobDetailsTool;
  getLiveJobDetailsTool = ai.defineTool(
    {
      name: 'getLiveJobDetails',
      description: 'Fetches the full description of a live job by its source and external ID.',
      inputSchema: z.object({ 
        source: z.string().describe('The job source (e.g., reed, adzuna, devitjobs).'),
        externalId: z.string().describe('The external ID from the search results.')
      }),
      outputSchema: z.string(),
    },
    async ({ source, externalId }: { source: string, externalId: string }) => {
      try {
        const { jobFetcher } = await import('@/lib/jobs/job-fetcher');
        const details = await jobFetcher.fetchJobDetails(source, externalId);
        return details || "Could not retrieve job details.";
      } catch (e) {
        return "Error fetching live job details.";
      }
    }
  );
  return getLiveJobDetailsTool;
};

let saveJobToTrackerTool: any = null;
const getSaveJobToTrackerTool = (ai: any) => {
  if (saveJobToTrackerTool) return saveJobToTrackerTool;
  saveJobToTrackerTool = ai.defineTool(
    {
      name: 'saveJobToTracker',
      description: 'Saves a live job listing to the user\'s job application tracker (Saved list).',
      inputSchema: z.object({ 
        uid: z.string(),
        listing: z.any().describe('The full job listing object retrieved from searchLiveJobs.')
      }),
      outputSchema: z.string(),
    },
    async ({ uid, listing }: { uid: string, listing: any }) => {
      try {
        const { buildTrackedApplicationPayload } = await import('@/lib/jobs/model');
        const payload = buildTrackedApplicationPayload({
          userId: uid,
          listing: listing,
          status: 'saved',
          statusSource: 'discover_save'
        });
        
        await authedUserDoc().collection('jobApplications').add({
          ...payload,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        
        return `Successfully saved "${listing.role}" at ${listing.company} to your tracker.`;
      } catch (e) {
        console.error("Save job error:", e);
        return "Error saving job to tracker.";
      }
    }
  );
  return saveJobToTrackerTool;
};

let updateResumeContentTool: any = null;
const getUpdateResumeContentTool = (ai: any) => {
  if (updateResumeContentTool) return updateResumeContentTool;
  updateResumeContentTool = ai.defineTool(
    {
      name: 'updateResumeContent',
      description: 'Updates specific fields or the entire content of a user\'s resume/CV.',
      inputSchema: z.object({ 
        uid: z.string(),
        resumeId: z.string(),
        content: z.any().describe('The NEW content object for the resume. You should usually fetch existing content first, modify it, then send the whole content object back.')
      }),
      outputSchema: z.string(),
    },
    async ({ uid, resumeId, content }: { uid: string, resumeId: string, content: any }) => {
      try {
        await authedUserDoc().collection('resumes').doc(resumeId).update({
          content: content,
          updatedAt: new Date()
        });
        return `Successfully updated the content for resume ID: ${resumeId}.`;
      } catch (e) {
        console.error("Update resume error:", e);
        return "Error updating resume content.";
      }
    }
  );
  return updateResumeContentTool;
};

let createNewResumeTool: any = null;
const getCreateNewResumeTool = (ai: any) => {
  if (createNewResumeTool) return createNewResumeTool;
  createNewResumeTool = ai.defineTool(
    {
      name: 'createNewResume',
      description: 'Creates a new blank resume/CV with a specified name for the user.',
      inputSchema: z.object({
        uid: z.string(),
        name: z.string().describe('The name of the new CV (e.g. "Software Engineer CV - FinTech").')
      }),
      outputSchema: z.string(),
    },
    async ({ uid, name }: { uid: string, name: string }) => {
      try {
        const newResume = {
          userId: requireAuthedUid(),
          name: name.trim(),
          templateId: 'london-executive',
          sectionOrder: ["summary", "experience", "education", "skills", "languages", "projects", "certifications", "interests"],
          content: {
            personal: {
              name: '',
              title: '',
              email: '',
              phone: '',
              location: '',
              linkedin: '',
              website: '',
              photoUrl: ''
            },
            summary: '',
            experience: [],
            education: [],
            skills: [],
            languages: [],
            projects: [],
            certifications: [],
            interests: []
          },
          styles: {
            primaryColor: '#0f172a',
            fontFamily: 'Inter',
            fontSize: 'normal',
            lineHeight: 'normal',
            margins: 'normal'
          },
          createdAt: new Date(),
          updatedAt: new Date()
        };
        const ref = await authedUserDoc().collection('resumes').add(newResume);
        return `Successfully created a new CV named "${name}" with ID: ${ref.id}.`;
      } catch (e: any) {
        console.error("Create resume error:", e);
        return `Error creating resume: ${e.message}`;
      }
    }
  );
  return createNewResumeTool;
};

let deleteResumeTool: any = null;
const getDeleteResumeTool = (ai: any) => {
  if (deleteResumeTool) return deleteResumeTool;
  deleteResumeTool = ai.defineTool(
    {
      name: 'deleteResume',
      description: 'Deletes a specific resume/CV by its ID.',
      inputSchema: z.object({
        uid: z.string(),
        resumeId: z.string().describe('The ID of the resume to delete.')
      }),
      outputSchema: z.string(),
    },
    async ({ uid, resumeId }: { uid: string, resumeId: string }) => {
      try {
        await authedUserDoc().collection('resumes').doc(resumeId).delete();
        return `Successfully deleted resume ID: ${resumeId}.`;
      } catch (e: any) {
        console.error("Delete resume error:", e);
        return `Error deleting resume: ${e.message}`;
      }
    }
  );
  return deleteResumeTool;
};

let editResumeSectionTool: any = null;
const getEditResumeSectionTool = (ai: any) => {
  if (editResumeSectionTool) return editResumeSectionTool;
  editResumeSectionTool = ai.defineTool(
    {
      name: 'editResumeSection',
      description: 'Edits, adds, or deletes content in a specific section of a user\'s resume/CV.',
      inputSchema: z.object({
        uid: z.string(),
        resumeId: z.string(),
        section: z.enum([
          'personal',
          'summary',
          'experience',
          'education',
          'skills',
          'languages',
          'projects',
          'certifications',
          'interests'
        ]).describe('The section of the CV to modify. NOTE: personal refers to personal details.'),
        action: z.enum(['set', 'add_item', 'update_item', 'delete_item']).describe(
          'set: Overwrites the section (or merges fields for objects like personal details). ' +
          'add_item: Appends an item to an array section (e.g. skills, experience, projects). ' +
          'update_item: Modifies an existing item in an array at a specific index. ' +
          'delete_item: Removes an item in an array at a specific index.'
        ),
        content: z.any().optional().describe('The content data for the action. For add_item/update_item, this is the item itself (string or object). For set, this is the new value. For experience/projects/education, descriptions should be in rich HTML or plain text.'),
        index: z.number().optional().describe('Required for update_item and delete_item. The 0-based index of the array item.')
      }),
      outputSchema: z.string(),
    },
    async ({ uid, resumeId, section, action, content, index }: {
      uid: string;
      resumeId: string;
      section: 'personal' | 'summary' | 'experience' | 'education' | 'skills' | 'languages' | 'projects' | 'certifications' | 'interests';
      action: 'set' | 'add_item' | 'update_item' | 'delete_item';
      content?: any;
      index?: number;
    }) => {
      try {
        const resumeRef = authedUserDoc().collection('resumes').doc(resumeId);
        const doc = await resumeRef.get();
        if (!doc.exists) return "Resume not found.";
        
        const resumeData = doc.data()!;
        const currentContent = resumeData.content || {};
        
        if (action === 'set') {
          if (section === 'personal') {
            const currentPersonal = currentContent.personal || {};
            const newPersonal = { ...currentPersonal, ...content };
            await resumeRef.update({
              'content.personal': newPersonal,
              updatedAt: new Date()
            });
            return `Successfully updated personal details.`;
          } else {
            await resumeRef.update({
              [`content.${section}`]: content,
              updatedAt: new Date()
            });
            return `Successfully set section "${section}".`;
          }
        }
        
        // Array operations
        const arraySection = currentContent[section] || [];
        if (!Array.isArray(arraySection)) {
          return `Error: Section "${section}" is not an array.`;
        }
        
        if (action === 'add_item') {
          const newArray = [...arraySection, content];
          await resumeRef.update({
            [`content.${section}`]: newArray,
            updatedAt: new Date()
          });
          return `Successfully added item to ${section}.`;
        }
        
        if (action === 'update_item') {
          if (typeof index !== 'number' || index < 0 || index >= arraySection.length) {
            return `Error: Invalid index ${index} for section "${section}" which has length ${arraySection.length}.`;
          }
          const newArray = [...arraySection];
          if (typeof newArray[index] === 'object' && typeof content === 'object') {
            newArray[index] = { ...newArray[index], ...content };
          } else {
            newArray[index] = content;
          }
          await resumeRef.update({
            [`content.${section}`]: newArray,
            updatedAt: new Date()
          });
          return `Successfully updated item at index ${index} in ${section}.`;
        }
        
        if (action === 'delete_item') {
          if (typeof index !== 'number' || index < 0 || index >= arraySection.length) {
            return `Error: Invalid index ${index} for section "${section}" which has length ${arraySection.length}.`;
          }
          const newArray = [...arraySection];
          newArray.splice(index, 1);
          await resumeRef.update({
            [`content.${section}`]: newArray,
            updatedAt: new Date()
          });
          return `Successfully deleted item at index ${index} from ${section}.`;
        }
        
        return "Unknown action.";
      } catch (e: any) {
        console.error("Edit resume section error:", e);
        return `Error editing resume section: ${e.message}`;
      }
    }
  );
  return editResumeSectionTool;
};

let checkAtsCompatibilityTool: any = null;
const getCheckAtsCompatibilityTool = (ai: any) => {
  if (checkAtsCompatibilityTool) return checkAtsCompatibilityTool;
  checkAtsCompatibilityTool = ai.defineTool(
    {
      name: 'checkAtsCompatibility',
      description: 'Performs a deep ATS (Applicant Tracking System) scan of a resume against a job description.',
      inputSchema: z.object({ 
        uid: z.string(),
        resumeId: z.string(),
        jobId: z.string().optional().describe('The ID of a saved job application.'),
        rawJobDescription: z.string().optional().describe('Directly provided job description text if not saved.')
      }),
      outputSchema: z.string(),
    },
    async ({ uid, resumeId, jobId, rawJobDescription }: { uid: string, resumeId: string, jobId?: string, rawJobDescription?: string }) => {
      try {
        const resumeDoc = await authedUserDoc().collection('resumes').doc(resumeId).get();
        if (!resumeDoc.exists) return "Resume not found.";
        const resume = resumeDoc.data()!;

        let jd = rawJobDescription;
        if (jobId) {
          const jobDoc = await authedUserDoc().collection('jobApplications').doc(jobId).get();
          if (jobDoc.exists) jd = jobDoc.data()!.jobDescription;
        }

        if (!jd) return "No job description found to compare against.";

        const report = await atsOptimizationScoring({
          cvContent: JSON.stringify(resume.content || resume),
          jobDescription: jd
        });

        return `ATS Report:
- Overall Match: ${report.totalScore}%
- Keyword Match: ${report.categories?.keywordMatch || 0}%
- Critical Gaps: ${report.missingKeywords?.slice(0, 5).join(', ') || 'None'}
- Top Advice: ${report.recommendations?.[0]?.description || 'Resume is well-optimized.'}`;
      } catch (e) {
        return "Error performing ATS check.";
      }
    }
  );
  return checkAtsCompatibilityTool;
};

let generateInterviewPrepTool: any = null;
const getGenerateInterviewPrepTool = (ai: any) => {
  if (generateInterviewPrepTool) return generateInterviewPrepTool;
  generateInterviewPrepTool = ai.defineTool(
    {
      name: 'generateInterviewPrep',
      description: 'Generates targeted interview questions and preparation advice for a specific role.',
      inputSchema: z.object({ 
        role: z.string(),
        jobDescription: z.string().optional()
      }),
      outputSchema: z.string(),
    },
    async ({ role, jobDescription }: { role: string, jobDescription?: string }) => {
      try {
        const result = await generateInterviewQuestions({
          jobTitle: role,
          jobDescription: jobDescription || "",
          interviewType: 'mixed',
          count: 5
        });

        const list = result.questions.map((q: any) => `- ${q.question} (Intent: ${q.intent})`).join('\n');
        return `Top 5 Interview Questions for ${role}:\n${list}`;
      } catch (e) {
        return "Error generating interview prep.";
      }
    }
  );
  return generateInterviewPrepTool;
};

let analyzeAtsMatchTool: any = null;
const getAnalyzeAtsMatchTool = (ai: any) => {
  if (analyzeAtsMatchTool) return analyzeAtsMatchTool;
  analyzeAtsMatchTool = ai.defineTool(
    {
      name: 'analyzeAtsMatch',
      description: 'Performs a deep semantic ATS analysis of a resume against a job description. Returns scores, missing keywords, and specific fixes.',
      inputSchema: z.object({ 
        resumeId: z.string().describe('The ID of the resume to analyze.'),
        jobDescription: z.string().describe('The full text of the job description.'),
        uid: z.string()
      }),
      outputSchema: z.any(),
    },
    async ({ resumeId, jobDescription, uid }: { resumeId: string, jobDescription: string, uid: string }) => {
      try {
        const resumeDoc = await authedUserDoc().collection('resumes').doc(resumeId).get();
        if (!resumeDoc.exists) return "Resume not found.";
        const resumeData = resumeDoc.data()!;
        
        // Convert resume content to a string format if it's an object
        const cvContent = typeof resumeData.content === 'string' ? resumeData.content : JSON.stringify(resumeData.content);
        
        const analysis = await atsOptimizationScoring({
          cvContent,
          jobDescription
        });
        
        return analysis;
      } catch (e) {
        console.error("ATS analysis error:", e);
        return "Error performing ATS analysis.";
      }
    }
  );
  return analyzeAtsMatchTool;
};

let generateCoverLetterTool: any = null;
const getGenerateCoverLetterTool = (ai: any) => {
  if (generateCoverLetterTool) return generateCoverLetterTool;
  generateCoverLetterTool = ai.defineTool(
    {
      name: 'generateCoverLetter',
      description: 'Generates a highly tailored, professional cover letter based on a resume and job description.',
      inputSchema: z.object({ 
        resumeId: z.string().describe('The ID of the resume to use as context.'),
        jobDescription: z.string().describe('The job description to tailor for.'),
        uid: z.string(),
        tone: z.enum(['professional', 'creative', 'direct', 'enthusiastic']).optional().default('professional')
      }),
      outputSchema: z.string(),
    },
    async ({ resumeId, jobDescription, uid, tone }: { resumeId: string, jobDescription: string, uid: string, tone: string }) => {
      try {
        const resumeDoc = await authedUserDoc().collection('resumes').doc(resumeId).get();
        if (!resumeDoc.exists) return "Resume not found.";
        const resumeData = resumeDoc.data()!;
        const cvContent = typeof resumeData.content === 'string' ? resumeData.content : JSON.stringify(resumeData.content);

        const aiInstance = getAi();
        const model = await getGeminiModel('cvWriting');
        
        const result = await generateWithFallback({
          model: model as any,
          system: `You are a world-class executive recruiter and cover letter specialist. 
          Your goal is to write a cover letter that is so compelling the hiring manager MUST interview the candidate.
          
          Guidelines:
          - DO NOT be generic. Use specific details from the resume that match the job description.
          - Tone: ${tone}.
          - Structure: Hook (why this role?), Evidence (2-3 key achievements), Alignment (why this company?), Call to Action.
          - Length: Max 350 words.`,
          prompt: `Resume Content:\n${cvContent}\n\nJob Description:\n${jobDescription}\n\nWrite a tailored cover letter for this role.`
        });
        
        return result.text;
      } catch (e) {
        console.error("Cover letter error:", e);
        return "Error generating cover letter.";
      }
    }
  );
  return generateCoverLetterTool;
};

let updateJobApplicationStatusTool: any = null;
const getUpdateJobApplicationStatusTool = (ai: any) => {
  if (updateJobApplicationStatusTool) return updateJobApplicationStatusTool;
  updateJobApplicationStatusTool = ai.defineTool(
    {
      name: 'updateJobApplicationStatus',
      description: 'Updates the status of a tracked job application (e.g., from "Applied" to "Interviewing" or "Rejected").',
      inputSchema: z.object({ 
        uid: z.string(),
        applicationId: z.string().describe('The document ID of the job application.'),
        newStatus: z.enum(['Wishlist', 'Applied', 'Interviewing', 'Offer', 'Rejected', 'Withdrawn'])
      }),
      outputSchema: z.string(),
    },
    async ({ uid, applicationId, newStatus }: { uid: string, applicationId: string, newStatus: string }) => {
      try {
        await authedUserDoc().collection('jobApplications').doc(applicationId).update({
          status: newStatus,
          updatedAt: new Date()
        });
        return `Successfully updated application status to ${newStatus}.`;
      } catch (e) {
        return "Error updating application status.";
      }
    }
  );
  return updateJobApplicationStatusTool;
};

let analyzeCareerGapTool: any = null;
const getAnalyzeCareerGapTool = (ai: any) => {
  if (analyzeCareerGapTool) return analyzeCareerGapTool;
  analyzeCareerGapTool = ai.defineTool(
    {
      name: 'analyzeCareerGap',
      description: 'Compares a user\'s current CV against a target role to identify specific skill/experience gaps and recommends how to bridge them.',
      inputSchema: z.object({ 
        resumeId: z.string(),
        targetRole: z.string(),
        uid: z.string()
      }),
      outputSchema: z.string(),
    },
    async ({ resumeId, targetRole, uid }: { resumeId: string, targetRole: string, uid: string }) => {
      try {
        const resumeDoc = await authedUserDoc().collection('resumes').doc(resumeId).get();
        if (!resumeDoc.exists) return "Resume not found.";
        const resumeData = resumeDoc.data()!;
        const cvContent = typeof resumeData.content === 'string' ? resumeData.content : JSON.stringify(resumeData.content);

        const model = await getGeminiModel('careerChat');
        const result = await generateWithFallback({
          model: model as any,
          system: `You are a career gap analyst. Compare the candidate's CV with the target role requirements.
          Identify:
          1. SKILL GAPS: Technical or soft skills missing.
          2. EXPERIENCE GAPS: Years or types of experience missing.
          3. ACTION PLAN: 3 concrete steps to bridge these gaps (e.g., certifications, projects).`,
          prompt: `CV:\n${cvContent}\n\nTarget Role: ${targetRole}`
        });
        return result.text;
      } catch (e) {
        return "Error analyzing career gap.";
      }
    }
  );
  return analyzeCareerGapTool;
};

let generateInterviewMockTool: any = null;
const getGenerateInterviewMockTool = (ai: any) => {
  if (generateInterviewMockTool) return generateInterviewMockTool;
  generateInterviewMockTool = ai.defineTool(
    {
      name: 'generateInterviewMock',
      description: 'Generates a set of role-specific interview questions and tips for the user to practice.',
      inputSchema: z.object({ 
        jobTitle: z.string(),
        jobDescription: z.string().optional(),
        interviewType: z.enum(["technical", "behavioral", "mixed"]).default("mixed"),
        count: z.number().default(3)
      }),
      outputSchema: z.any(),
    },
    async (input: any) => {
      try {
        return await generateInterviewQuestions(input);
      } catch (e) {
        return "Error generating interview questions.";
      }
    }
  );
  return generateInterviewMockTool;
};

let enhanceResumeContentTool: any = null;
const getEnhanceResumeContentTool = (ai: any) => {
  if (enhanceResumeContentTool) return enhanceResumeContentTool;
  enhanceResumeContentTool = ai.defineTool(
    {
      name: 'enhanceResumeContent',
      description: 'Uses advanced AI to rewrite or generate high-impact content for a resume (summaries, bullet points, skills).',
      inputSchema: z.object({ 
        action: z.enum(['generate_content', 'rewrite_bullet', 'suggest_skills', 'craft_summary', 'suggest_summary_variants', 'suggest_role_bullets']),
        currentCvContent: z.string().optional(),
        targetContent: z.string().optional().describe('The specific text to rewrite or the role to generate for.'),
        jobDescription: z.string().optional(),
        jobTitle: z.string().optional(),
        resumeId: z.string().optional().describe('The ID of the resume being enhanced.'),
        section: z.string().optional().describe('The resume section being updated (e.g., summary, experience).'),
        index: z.number().optional().describe('The index of the item within the section (if applicable).')
      }),
      outputSchema: z.any(),
    },
    async (input: any) => {
      try {
        return await enhanceCvContent(input);
      } catch (e) {
        return "Error enhancing resume content.";
      }
    }
  );
  return enhanceResumeContentTool;
};

let compareMultipleResumesForJobTool: any = null;
const getCompareMultipleResumesForJobTool = (ai: any) => {
  if (compareMultipleResumesForJobTool) return compareMultipleResumesForJobTool;
  compareMultipleResumesForJobTool = ai.defineTool(
    {
      name: 'compareMultipleResumesForJob',
      description: 'Analyses multiple resumes to find the best match for a specific job description.',
      inputSchema: z.object({ 
        uid: z.string(),
        resumeIds: z.array(z.string()).describe('List of resume IDs to compare.'),
        jobDescription: z.string()
      }),
      outputSchema: z.string(),
    },
    async ({ uid, resumeIds, jobDescription }: { uid: string, resumeIds: string[], jobDescription: string }) => {
      try {
        const results = [];
        for (const id of resumeIds) {
          const doc = await authedUserDoc().collection('resumes').doc(id).get();
          if (!doc.exists) continue;
          const data = doc.data()!;
          const content = typeof data.content === 'string' ? data.content : JSON.stringify(data.content);
          
          const scoreResult = await atsOptimizationScoring({ cvContent: content, jobDescription });
          results.push({
            name: data.name || id,
            score: scoreResult.totalScore,
            feedback: scoreResult.matchSummary.slice(0, 200) + "..."
          });
        }
        
        const summary = results.map(r => `- **${r.name}**: Score ${r.score}/100. ${r.feedback}`).join('\n');
        return `Comparison Results:\n${summary}\n\nConclusion: The ${results.sort((a,b) => b.score - a.score)[0].name} variant is currently the strongest match.`;
      } catch (e) {
        return "Error comparing resumes.";
      }
    }
  );
  return compareMultipleResumesForJobTool;
};
let duplicateResumeTool: any = null;
const getDuplicateResumeTool = (ai: any) => {
  if (duplicateResumeTool) return duplicateResumeTool;
  duplicateResumeTool = ai.defineTool(
    {
      name: 'duplicateResume',
      description: 'Creates a full copy of an existing resume. Useful for creating industry-specific variants.',
      inputSchema: z.object({ 
        uid: z.string(),
        resumeId: z.string().describe('The ID of the resume to copy.'),
        newName: z.string().describe('The name for the new copy (e.g. "Software Engineer - Fintech Variant").')
      }),
      outputSchema: z.string(),
    },
    async ({ uid, resumeId, newName }: { uid: string, resumeId: string, newName: string }) => {
      try {
        const resumeRef = authedUserDoc().collection('resumes').doc(resumeId);
        const doc = await resumeRef.get();
        if (!doc.exists) return "Resume not found.";
        
        const data = doc.data()!;
        const { id, ...resumeData } = data;
        
        const newResume = {
          ...resumeData,
          name: newName,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        const newRef = await authedUserDoc().collection('resumes').add(newResume);
        return `Successfully duplicated resume. New ID: ${newRef.id}. You can now tell the user you've created a specialized variant for them.`;
      } catch (e) {
        console.error("Duplicate resume error:", e);
        return "Error duplicating resume.";
      }
    }
  );
  return duplicateResumeTool;
};

let draftApplicationAnswerTool: any = null;
const getDraftApplicationAnswerTool = (ai: any) => {
  if (draftApplicationAnswerTool) return draftApplicationAnswerTool;
  draftApplicationAnswerTool = ai.defineTool(
    {
      name: 'draftApplicationAnswer',
      description: 'Drafts a professional answer to a specific application form question (e.g. "Why do you want to work here?") using resume context.',
      inputSchema: z.object({ 
        resumeId: z.string(),
        jobDescription: z.string(),
        question: z.string().describe('The question from the application form.'),
        uid: z.string()
      }),
      outputSchema: z.string(),
    },
    async ({ resumeId, jobDescription, question, uid }: { resumeId: string, jobDescription: string, question: string, uid: string }) => {
      try {
        const resumeDoc = await authedUserDoc().collection('resumes').doc(resumeId).get();
        if (!resumeDoc.exists) return "Resume not found.";
        const resumeData = resumeDoc.data()!;
        const cvContent = typeof resumeData.content === 'string' ? resumeData.content : JSON.stringify(resumeData.content);

        const model = await getGeminiModel('cvWriting');
        const result = await generateWithFallback({
          model: model as any,
          system: `You are an Application Ghostwriter. Your goal is to draft a punchy, evidence-based answer to an application question.
          - Use 1-2 specific achievements from the CV.
          - Align directly with the job requirements.
          - Keep it under 200 words.`,
          prompt: `CV:\n${cvContent}\n\nJob Description:\n${jobDescription}\n\nQuestion: ${question}`
        });
        return result.text;
      } catch (e) {
        return "Error drafting answer.";
      }
    }
  );
  return draftApplicationAnswerTool;
};
let optimizeLinkedInProfileTool: any = null;
const getOptimizeLinkedInProfileTool = (ai: any) => {
  if (optimizeLinkedInProfileTool) return optimizeLinkedInProfileTool;
  optimizeLinkedInProfileTool = ai.defineTool(
    {
      name: 'optimizeLinkedInProfile',
      description: 'Generates optimized LinkedIn content (Headline, About section, Experience) based on a resume and target role.',
      inputSchema: z.object({ 
        resumeId: z.string(),
        targetRole: z.string().optional(),
        uid: z.string()
      }),
      outputSchema: z.string(),
    },
    async ({ resumeId, targetRole, uid }: { resumeId: string, targetRole: string | undefined, uid: string }) => {
      try {
        const resumeDoc = await authedUserDoc().collection('resumes').doc(resumeId).get();
        if (!resumeDoc.exists) return "Resume not found.";
        const resumeData = resumeDoc.data()!;
        const cvContent = typeof resumeData.content === 'string' ? resumeData.content : JSON.stringify(resumeData.content);

        const model = await getGeminiModel('careerChat');
        const result = await generateWithFallback({
          model: model as any,
          system: `You are a LinkedIn Personal Branding Expert.
          Your goal is to optimize a user's LinkedIn presence.
          Provide:
          1. HEADLINE: A high-impact, searchable headline.
          2. ABOUT SECTION: A compelling, human narrative summary (first-person).
          3. EXPERIENCE SNIPPETS: How to describe their current role for LinkedIn.`,
          prompt: `CV:\n${cvContent}\n\nTarget Role: ${targetRole || 'Current Career Path'}`
        });
        return result.text;
      } catch (e) {
        return "Error optimizing LinkedIn profile.";
      }
    }
  );
  return optimizeLinkedInProfileTool;
};

let addJobApplicationTool: any = null;
const getAddJobApplicationTool = (ai: any) => {
  if (addJobApplicationTool) return addJobApplicationTool;
  addJobApplicationTool = ai.defineTool(
    {
      name: 'addJobApplication',
      description: 'Tracks a new job application for the user.',
      inputSchema: z.object({ 
        uid: z.string(),
        role: z.string(),
        company: z.string(),
        jobUrl: z.string().optional(),
        status: z.enum(['interested', 'applied', 'interviewing', 'offered', 'rejected']).default('applied')
      }),
      outputSchema: z.string(),
    },
    async ({ uid, role, company, jobUrl, status }: { uid: string, role: string, company: string, jobUrl?: string, status: 'interested' | 'applied' | 'interviewing' | 'offered' | 'rejected' }) => {
      try {
        const res = await authedUserDoc().collection('jobApplications').add({
          role,
          company,
          jobUrl: jobUrl || null,
          status,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        return `Successfully tracked application for ${role} at ${company}. Application ID: ${res.id}.`;
      } catch (e) {
        return "Error tracking application.";
      }
    }
  );
  return addJobApplicationTool;
};

let recommendSalaryStrategyTool: any = null;
const getRecommendSalaryStrategyTool = (ai: any) => {
  if (recommendSalaryStrategyTool) return recommendSalaryStrategyTool;
  recommendSalaryStrategyTool = ai.defineTool(
    {
      name: 'recommendSalaryStrategy',
      description: 'Provides salary benchmarking and negotiation strategies for a specific role.',
      inputSchema: z.object({ 
        jobTitle: z.string(),
        companyName: z.string().optional(),
        seniority: z.enum(['junior', 'mid', 'senior', 'lead', 'executive']).optional(),
        location: z.string().optional().describe('e.g. "London, UK" or "Remote"'),
        offeredSalary: z.string().optional()
      }),
      outputSchema: z.string(),
    },
    async ({ jobTitle, companyName, seniority, location, offeredSalary }: { jobTitle: string, companyName?: string, seniority?: string, location?: string, offeredSalary?: string }) => {
      try {
        const model = await getGeminiModel('careerChat');
        const result = await generateWithFallback({
          model: model as any,
          system: `You are a Compensation & Benefits Expert. Provide realistic salary ranges and negotiation tactics.
          Include:
          1. MARKET CONTEXT: Estimated ranges for UK/US/Global.
          2. NEGOTIATION SCRIPT: How to ask for more.
          3. PERKS: Common benefits to negotiate.`,
          prompt: `Benchmarking for: ${jobTitle} ${seniority ? `(${seniority})` : ''} ${companyName ? `at ${companyName}` : ''} in ${location || 'Global'}. ${offeredSalary ? `Current Offer: ${offeredSalary}` : ''}`
        });
        return result.text;
      } catch (error) {
        return "Error providing salary strategy.";
      }
    }
  );
  return recommendSalaryStrategyTool;
};

let suggestResumeTemplateTool: any = null;
const getSuggestResumeTemplateTool = (ai: any) => {
  if (suggestResumeTemplateTool) return suggestResumeTemplateTool;
  suggestResumeTemplateTool = ai.defineTool(
    {
      name: 'suggestResumeTemplate',
      description: 'Suggests the best resume template from our library based on role, industry, and seniority.',
      inputSchema: z.object({ 
        targetRole: z.string(),
        seniority: z.enum(['junior', 'mid', 'senior', 'executive']),
        industry: z.string()
      }),
      outputSchema: z.string(),
    },
    async ({ targetRole, seniority, industry }: { targetRole: string, seniority: string, industry: string }) => {
      try {
        const model = await getGeminiModel('careerChat');
        const result = await generateWithFallback({
          model: model as any,
          system: `You are a Resume Design Consultant.
          Our templates include:
          - 'london-executive': Professional, authority-driven (Finance, Legal, Execs).
          - 'new-york-finance': Strict, high-density (Banking, Traditional).
          - 'san-fran-stack': Tech-forward, two-column (Devs, Product).
          - 'berlin-modular': Minimalist, structured (Design, Modern Ops).
          - 'austin-bold': Vibrant, creative (Startups, Marketing).
          - 'tokyo-precise': Compact, engineering focus.
          
          Recommend the best 1-2 templates with a rationale.`,
          prompt: `Role: ${targetRole}\nSeniority: ${seniority}\nIndustry: ${industry}`
        });
        return result.text;
      } catch (e) {
        return "Error suggesting templates.";
      }
    }
  );
  return suggestResumeTemplateTool;
};

let bridgeSkillTrainingTool: any = null;
const getBridgeSkillTrainingTool = (ai: any) => {
  if (bridgeSkillTrainingTool) return bridgeSkillTrainingTool;
  bridgeSkillTrainingTool = ai.defineTool(
    {
      name: 'bridgeSkillTraining',
      description: 'Recommends specific learning paths and platforms for identified skill gaps.',
      inputSchema: z.object({ 
        skillsToLearn: z.array(z.string()),
        targetRole: z.string()
      }),
      outputSchema: z.string(),
    },
    async ({ skillsToLearn, targetRole }: { skillsToLearn: string[], targetRole: string }) => {
      try {
        const model = await getGeminiModel('careerChat');
        const result = await generateWithFallback({
          model: model as any,
          system: `You are a Career Development Coach.
          Suggest specific platforms (Coursera, Udemy, LinkedIn Learning, Specialized Bootcamps) and certifications for these skills.
          Group them by 'Quick Wins' (short courses) and 'Professional Depth' (certifications/long-term).`,
          prompt: `Target Role: ${targetRole}\nSkills Missing: ${skillsToLearn.join(', ')}`
        });
        return result.text;
      } catch (e) {
        return "Error generating training plan.";
      }
    }
  );
  return bridgeSkillTrainingTool;
};

// --- FLOW ---

export async function interactiveAiCareerAssistant(input: InteractiveAiCareerAssistantInput): Promise<InteractiveAiCareerAssistantOutput> {
  // SECURITY: Bind the authenticated uid into per-request async storage so
  // every tool reads the trusted value via requireAuthedUid() instead of
  // whatever the model invents.
  return authedUidStorage.run(input.uid, () => interactiveAiCareerAssistantImpl(input));
}

async function interactiveAiCareerAssistantImpl(input: InteractiveAiCareerAssistantInput): Promise<InteractiveAiCareerAssistantOutput> {
  const startTime = Date.now();
  try {
    const ai = getAi();
    const model = await getGeminiModel('careerChat');
    const fallbackModels = getFallbackModels('careerChat', model);

    const historyTranscript = (input.history || [])
      .slice(-6) 
      .map((msg: any) => `${msg.role === 'assistant' ? 'Dan' : 'User'}: ${msg.content}`)
      .join('\n');

    // Pre-fetch basic user metadata to save AI tool calls (Quota Optimization)
    let resumesListStr = '';
    if (input.uid) {
      try {
        const resumesSnap = await db.collection('users').doc(input.uid).collection('resumes').limit(5).get();
        if (!resumesSnap.empty) {
          resumesListStr = "\nUser's Resumes:\n" + resumesSnap.docs.map(doc => `- ${doc.data().name || 'Untitled'} (ID: ${doc.id})`).join('\n');
        }
      } catch (e) {
        console.warn("[Dan Flow] Pre-fetch failed:", e);
      }
    }

    let userContextStr = '';
    if (input.uid) {
      userContextStr = `User ID: ${input.uid}. ${resumesListStr}\nAccess full data via getResumeContent or getJobApplicationDetails if needed.`;
    }

    const response = await generateWithFallback({
      model: model as any,
      config: { temperature: 0.4 },
      tools: [
        getGetUserProfileTool(ai),
        getListJobApplicationsTool(ai),
        getListUserResumesTool(ai),
        getGetResumeContentTool(ai),
        getGetJobApplicationDetailsTool(ai),
        getSearchLiveJobsTool(ai),
        getGetLiveJobDetailsTool(ai),
        getSaveJobToTrackerTool(ai),
        getUpdateResumeContentTool(ai),
        getCheckAtsCompatibilityTool(ai),
        getGenerateInterviewPrepTool(ai),
        getAnalyzeAtsMatchTool(ai),
        getGenerateCoverLetterTool(ai),
        getUpdateJobApplicationStatusTool(ai),
        getAnalyzeCareerGapTool(ai),
        getGenerateInterviewMockTool(ai),
        getEnhanceResumeContentTool(ai),
        getOptimizeLinkedInProfileTool(ai),
        getCompareMultipleResumesForJobTool(ai),
        getDuplicateResumeTool(ai),
        getDraftApplicationAnswerTool(ai),
        getAddJobApplicationTool(ai),
        getRecommendSalaryStrategyTool(ai),
        getSuggestResumeTemplateTool(ai),
        getBridgeSkillTrainingTool(ai),
        getCreateNewResumeTool(ai),
        getDeleteResumeTool(ai),
        getEditResumeSectionTool(ai)
      ],
      system: `You are Dan, an elite Career Intelligence Advisor with full system access.
      
      CORE DIRECTIVES:
      1. SMARTER REASONING: Use your tools to provide deep, evidence-based advice. Don't just chat; analyze.
      2. APP AGENCY: You can manage the user's entire career pipeline:
         - Market Fit: 'analyzeAtsMatch' (match check), 'analyzeCareerGap' (skills strategy)
         - Application: 'generateCoverLetter' (tailored), 'updateJobApplicationStatus' (tracking)
         - Content: 'createNewResume' (create blank CV), 'deleteResume' (remove CV), 'editResumeSection' (update/add/delete CV sections granularly), 'enhanceResumeContent' (polishing), 'optimizeLinkedInProfile' (branding)
         - Design: 'suggestResumeTemplate' (visual branding alignment)
         - Closing: 'recommendSalaryStrategy' (negotiation)
         - Preparation: 'generateInterviewMock' (prep)
         - Growth: 'bridgeSkillTraining' (actionable learning paths)
      3. PROACTIVITY: If a user mentions an interview, offer 'generateInterviewMock'. If they mention an offer, offer 'recommendSalaryStrategy'. If they have skill gaps, offer 'bridgeSkillTraining'. If they want to edit, create or delete their CV or resume details, use 'editResumeSection', 'createNewResume' or 'deleteResume' directly.
      
      HUMAN-LIKE RESPONSE GUIDELINES:
      - NEVER output your thought process, planning stages, "Thought:", "Reasoning:", or XML tags (like <thought>). Start your response directly with the message.
      - Speak like a supportive, elite career coach (conversational, empathetic, professional). Avoid robotic or repetitive opening/closing remarks like "Certainly, I can help you with that" or "Let me execute that tool for you."
      - Keep paragraphs short and formatting clean (use bullet points or bold text sparingly for readability).
      
      EDITING CVS/RESUMES GUIDELINES:
      - If the user asks you to update their contact info, add a skill, append experience, edit a project, or make ANY changes to their CV, use 'editResumeSection' to make the change.
      - Make sure you check which CV they want to edit. If there are multiple resumes, list them first or ask, or use their current/latest one.
      - Ensure experience/education/projects/certifications array items follow their database formats:
        * 'personal': Object with name, title, email, phone, location, linkedin, website, photoUrl
        * 'summary': String
        * 'skills': Array of strings
        * 'languages': Array of objects (language, proficiency)
        * 'experience': Array of objects (title, company, location, startDate, endDate, description [HTML string format preferred or plain text])
        * 'education': Array of objects (degree, institution, location, graduationDate, description [HTML string])
        * 'projects': Array of objects (name, description [HTML], url, period)
        * 'certifications': Array of objects (name, issuer, date)
      - When writing descriptions for experience, projects, or education, write standard HTML (e.g. paragraphs or lists) to ensure it renders correctly in the editor.
      
      QUOTA CONSERVATION MODE:
      - You are on a strict API quota. DO NOT call tools unless absolutely essential for the specific question.
      - If you can answer based on the 'User's Resumes' list provided in the prompt context, do so without calling 'getResumeContent'.
      - Batch your thoughts. If you need a tool, call it once and provide a comprehensive answer.
      
      CAPABILITIES:
      - Analyze CVs (getResumeContent).
      - Search UK jobs (searchLiveJobs -> getLiveJobDetails).
      - Save jobs (saveJobToTracker) / Edit CVs (editResumeSection / updateResumeContent).
      - Interview Simulator: Recommend the '/interview-prep' page for mock simulations.
      
      UPGRADE OPTIONS:
      - If a user is on the 'free' or 'pro' plan and asks for deeper coaching, mention that 'Master' members get dedicated Career Strategist features and the full Interview Simulator workspace.
      
      Tone: Elite, professional, empathetic, natural, conversational.`,
      prompt: `${userContextStr}
Recent conversation:
${historyTranscript || '(none)'}

User: ${input.message}
${input.jobTitle ? `Target Job: ${input.jobTitle}` : ''}
${input.jobDescription ? `JD Segment: ${input.jobDescription.slice(0, 800)}` : ''}`,
    }, { 
      category: 'careerChat',
      userId: input.uid || 'anonymous'
    });

    console.log(`[Dan Flow] Completed in ${Date.now() - startTime}ms`);

    return {
      response: response.text || "I found something, but couldn't put it into words. Please try again.",
      toolResults: response.toolResults || []
    };
  } catch (error: any) {
    console.error("[Dan Flow] Error:", error);
    return {
      response: `[Dan System] The free AI providers are busy right now. Please try again in 30 seconds or ask a shorter question.`
    };
  }
}
