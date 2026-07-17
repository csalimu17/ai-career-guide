import { FeatureLandingPage } from "@/components/marketing/feature-landing-page";
import { createMetadata } from "@/lib/metadata";

export const metadata = createMetadata({
  title: "AI Interview Prep & Mock Interview Practice",
  description:
    "Prepare for interviews with AI-generated questions, answer practice, role-specific feedback, and career guidance inside AI Career Guide.",
  path: "/ai-interview-prep",
  keywords: ["AI interview prep", "mock interview practice", "interview preparation", "AI interview coach", "job interview practice"],
});

export const revalidate = 86400;

export default function AiInterviewPrepPage() {
  return (
    <FeatureLandingPage
      eyebrow="AI Interview Prep"
      title="Practise the interview before it decides the outcome."
      description="Generate role-specific questions, practise stronger answers, and use AI feedback to prepare for technical, behavioural, and final-stage interviews."
      path="/ai-interview-prep"
      ctaLabel="Start interview prep"
      secondaryCtaLabel="Ask the assistant"
      secondaryCtaHref="/ai-career-assistant"
      proof={["Role-specific questions", "Answer feedback", "Technical and behavioural practice"]}
      points={[
        {
          title: "Generate questions for your target role",
          description: "Use your target job or career direction to prepare for the questions you are more likely to face.",
        },
        {
          title: "Practise answers before the real call",
          description: "Write or speak through responses, then review where the answer needs stronger evidence, structure, or clarity.",
        },
        {
          title: "Connect prep to your CV story",
          description: "Use your CV achievements and application history to shape sharper examples for common interview themes.",
        },
        {
          title: "Prepare across interview types",
          description: "Practise behavioural, technical, mixed, and target-role interview sessions without leaving the career workspace.",
        },
      ]}
      workflow={[
        {
          title: "Choose the interview style",
          description: "Prepare for technical questions, behavioural questions, a full mock interview, or a specific target role.",
        },
        {
          title: "Answer and review feedback",
          description: "Work through each question and use AI feedback to tighten structure, evidence, and confidence.",
        },
        {
          title: "Carry the lessons back into your search",
          description: "Use the feedback to update your CV, improve positioning, and prepare follow-up notes.",
        },
      ]}
      faqs={[
        {
          question: "Does the app include mock interview practice?",
          answer: "Yes. AI Career Guide includes interview preparation tools that generate questions and help you review answers.",
        },
        {
          question: "Can interview prep use my target role?",
          answer: "Yes. Interview practice can be shaped around your target job title and the kind of interview you need to prepare for.",
        },
        {
          question: "Is interview prep connected to the rest of the app?",
          answer: "Yes. It sits alongside the CV builder, assistant, job tracker, ATS checker, and cover letter workflow.",
        },
      ]}
    />
  );
}
