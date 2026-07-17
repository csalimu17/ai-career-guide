import { ComparisonLandingPage } from "@/components/marketing/comparison-landing-page";
import { createMetadata } from "@/lib/metadata";

export const metadata = createMetadata({
  title: "Rezi Alternative for AI CV Building and ATS Checks",
  description:
    "Compare AI Career Guide as a Rezi alternative for AI CV building, ATS checking, cover letters, interview preparation, and job tracking.",
  path: "/compare/rezi-alternative",
  keywords: ["Rezi alternative", "AI resume builder alternative", "AI CV builder", "ATS resume checker alternative"],
});

export const revalidate = 86400;

export default function ReziAlternativePage() {
  return (
    <ComparisonLandingPage
      path="/compare/rezi-alternative"
      competitorName="Rezi"
      title="A Rezi alternative for AI CV building and full career execution."
      description="AI Career Guide is for job seekers who want AI-assisted CV writing and ATS feedback, plus cover letters, interview prep, live job search, and application tracking."
      positioning={["AI CV writing", "ATS feedback loop", "Beyond resume optimisation"]}
      points={[
        {
          title: "AI writing support",
          aiCareerGuide: "Use AI to improve summaries, bullets, skills, cover letters, and interview preparation in the same account.",
          competitor: "Rezi is strongly associated with AI resume building and resume optimisation.",
        },
        {
          title: "ATS alignment",
          aiCareerGuide: "Check fit against job descriptions and then edit the CV in the same workflow.",
          competitor: "Rezi is often evaluated for ATS-oriented resume building and AI resume tools.",
        },
        {
          title: "Career workspace",
          aiCareerGuide: "Connect CV building to job search, applications, cover letters, and interview practice.",
          competitor: "Rezi is usually compared as an AI resume builder rather than a full job-search workspace.",
        },
      ]}
      faqs={[
        {
          question: "What is a good Rezi alternative?",
          answer: "AI Career Guide is a good Rezi alternative if you want AI CV writing and ATS checks alongside cover letters, job tracking, interview prep, and UK-focused CV guidance.",
        },
        {
          question: "Does AI Career Guide include ATS checking?",
          answer: "Yes. AI Career Guide includes an ATS CV checker flow that compares your CV against job descriptions and highlights areas to improve.",
        },
        {
          question: "Is this only for resumes?",
          answer: "No. AI Career Guide supports both CV and resume workflows, with UK CV pages and language built into the public site.",
        },
      ]}
    />
  );
}
