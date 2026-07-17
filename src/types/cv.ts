import { z } from 'zod';

export interface ParsedDocument {
  rawText: string;
  method: 'native' | 'ocr' | 'fallback' | 'apdf' | 'python-robust';
  isScanned: boolean;
}

export const ResumeDataSchema = z.object({
  personalDetails: z.object({
    name: z.string().optional(),
    email: z.string().describe("Email address ONLY. Never place in location.").optional(),
    phone: z.string().describe("Phone number ONLY. Never place in location.").optional(),
    location: z.string().describe("City and State or Country ONLY. DO NOT include email, phone, or zip codes.").optional(),
    linkedin: z.string().optional(),
    website: z.string().optional(),
  }).optional(),
  summary: z.string().optional(),
  workExperience: z.array(z.object({
    title: z.string().describe("Short precise job title ONLY (e.g. 'Software Engineer'). DO NOT include bullet points or descriptions here.").optional(),
    company: z.string().optional(),
    location: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    description: z.array(z.string()).describe("List of job responsibilities, achievements, and bullet points.").optional(),
  })).optional(),
  education: z.array(z.object({
    degree: z.string().optional(),
    institution: z.string().optional(),
    location: z.string().optional(),
    graduationDate: z.string().optional(),
    description: z.string().optional(),
  })).optional(),
  skills: z.array(z.string()).optional(),
  languages: z.array(z.object({
    language: z.string().optional(),
    proficiency: z.string().optional(),
  })).optional(),
  projects: z.array(z.object({
    id: z.union([z.string(), z.number()]).optional(),
    name: z.string().optional(),
    description: z.string().optional(),
    url: z.string().optional(),
    period: z.string().optional(),
  })).optional(),
  certifications: z.array(z.object({
    id: z.union([z.string(), z.number()]).optional(),
    name: z.string().optional(),
    issuer: z.string().optional(),
    date: z.string().optional(),
  })).optional(),
  customSections: z.array(z.object({
    title: z.string().optional(),
    content: z.string().optional(),
  })).optional(),
});

export const CvDataExtractionOutputSchema = z.object({
  ...ResumeDataSchema.shape,
  metadata: z.object({
    confidence: z.number(),
    sectionConfidence: z.record(z.string(), z.number()).optional(),
    parsingMethod: z.enum(['multimodal', 'text-llm', 'ocr-llm', 'fallback', 'apdf-enhanced', 'hybrid-job']),
    missingFields: z.array(z.string()),
    warnings: z.array(z.string()).optional(),
    isWeak: z.boolean(),
    jobId: z.string().optional(),
    strategyUsed: z.string().optional(),
    rawTextLength: z.number().optional(),
    guardian: z.object({
      activated: z.boolean(),
      status: z.enum(['healthy', 'recovered', 'manual-review']),
      summary: z.string(),
      attempts: z.number(),
      appliedFixes: z.array(z.string()),
      lastError: z.string().optional(),
    }).optional(),
    sourceLanguage: z.string().optional(),
    isTranslated: z.boolean().optional(),
  }).optional(),
});

export type CvDataExtractionOutput = z.infer<typeof CvDataExtractionOutputSchema>;
export type ResumeData = z.infer<typeof ResumeDataSchema>;
