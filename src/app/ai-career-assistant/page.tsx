import { FeatureLandingPage } from "@/components/marketing/feature-landing-page";
import { createMetadata } from "@/lib/metadata";

export const metadata = createMetadata({
  title: "AI Career Assistant for CVs, Jobs & Interviews",
  description:
    "Meet Dan, the AI career assistant inside AI Career Guide. Get CV edits, ATS feedback, job search support, cover letter help, and interview preparation in one workspace.",
  path: "/ai-career-assistant",
  keywords: ["AI career assistant", "AI career mentor", "AI CV assistant", "career coach AI", "AI job search assistant"],
});

export const revalidate = 86400;

export default function AiCareerAssistantPage() {
  return (
    <FeatureLandingPage
      eyebrow="AI Career Assistant"
      title="Dan helps turn your career search into a clearer plan."
      description="Ask for CV improvements, ATS advice, job search direction, career planning, and interview preparation from the same assistant that understands your workspace."
      path="/ai-career-assistant"
      ctaLabel="Ask Dan for help"
      secondaryCtaLabel="Open ATS checker"
      secondaryCtaHref="/ats-cv-checker"
      proof={["CV edits and strategy", "ATS feedback and role fit", "Interview and career planning"]}
      points={[
        {
          title: "Get guidance that understands your CV",
          description: "Dan can help improve summaries, bullet points, skills, role positioning, and job-description alignment without forcing you to start again.",
        },
        {
          title: "Move from advice to action",
          description: "The assistant connects naturally to CV editing, ATS checks, job tracking, and interview prep so suggestions can become real next steps.",
        },
        {
          title: "Ask career questions in plain English",
          description: "Use Dan for role research, growth paths, skill gaps, application planning, and interview practice when the next move feels unclear.",
        },
        {
          title: "Keep the work in one product",
          description: "Instead of bouncing between chat tools, templates, job boards, and trackers, AI Career Guide keeps the context together.",
        },
      ]}
      workflow={[
        {
          title: "Ask Dan to review your direction",
          description: "Start with your target role, current CV, or a job description and get practical guidance on what to improve.",
        },
        {
          title: "Turn suggestions into stronger application materials",
          description: "Use the editor, ATS checker, cover letter tools, and templates to apply the guidance quickly.",
        },
        {
          title: "Prepare for the next stage",
          description: "Use the assistant for interview questions, answer practice, and follow-up planning after applications are underway.",
        },
      ]}
      faqs={[
        {
          question: "What can the AI career assistant help with?",
          answer: "Dan can help with CV edits, ATS feedback, career planning, job search strategy, cover letter direction, and interview preparation.",
        },
        {
          question: "Is this separate from the CV builder?",
          answer: "No. The assistant is part of the same AI Career Guide workspace, so it supports the CV builder, ATS checker, jobs, tracker, and interview tools.",
        },
        {
          question: "Can I use the assistant before I have a finished CV?",
          answer: "Yes. You can ask for help with direction, positioning, target roles, and first-draft structure before your CV is complete.",
        },
      ]}
    />
  );
}
