import { ComparisonLandingPage } from "@/components/marketing/comparison-landing-page";
import { createMetadata } from "@/lib/metadata";

export const metadata = createMetadata({
  title: "Enhancv Alternative for AI CVs, ATS Checks and UK Applications",
  description:
    "Compare AI Career Guide as an Enhancv alternative for UK CV building, ATS checks, AI writing, cover letters, and job application tracking.",
  path: "/compare/enhancv-alternative",
  keywords: ["Enhancv alternative", "Enhancv competitor", "AI CV builder alternative", "ATS CV checker"],
});

export const revalidate = 86400;

export default function EnhancvAlternativePage() {
  return (
    <ComparisonLandingPage
      path="/compare/enhancv-alternative"
      competitorName="Enhancv"
      title="An Enhancv alternative for UK CVs, ATS checks, and connected applications."
      description="AI Career Guide is for candidates who want AI-assisted CV building, ATS feedback, cover letters, interview preparation, job search, and application tracking."
      positioning={["UK CV and resume workflows", "ATS checker built in", "Less isolated document work"]}
      points={[
        {
          title: "Visual CV building",
          aiCareerGuide: "Create polished CVs while keeping ATS readability, job matching, and practical application workflows in view.",
          competitor: "Enhancv is widely known for resume building, visual presentation, and AI-assisted resume content.",
        },
        {
          title: "ATS and job matching",
          aiCareerGuide: "Use job-description checks to find missing keywords and improve weak sections before applying.",
          competitor: "Enhancv is commonly evaluated as a resume builder with design and AI writing strengths.",
        },
        {
          title: "Full career workspace",
          aiCareerGuide: "Move from CV edits into cover letters, interview practice, job search, and application tracking.",
          competitor: "Enhancv is usually compared first as a resume/CV builder rather than a complete job-search workspace.",
        },
      ]}
      faqs={[
        {
          question: "Is AI Career Guide an Enhancv alternative?",
          answer: "Yes. AI Career Guide is an Enhancv alternative for users who want AI CV building plus ATS checking, cover letters, job tracking, and interview prep.",
        },
        {
          question: "Which is better for ATS-focused applications?",
          answer: "AI Career Guide is designed to connect CV editing with ATS-style job-description checks, so it is a strong fit for role-targeted applications.",
        },
        {
          question: "Does AI Career Guide support UK CV language?",
          answer: "Yes. AI Career Guide uses UK CV positioning across its public pages and includes dedicated UK CV format and examples pages.",
        },
      ]}
    />
  );
}
