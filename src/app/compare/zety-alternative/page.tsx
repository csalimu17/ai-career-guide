import { ComparisonLandingPage } from "@/components/marketing/comparison-landing-page";
import { createMetadata } from "@/lib/metadata";

export const metadata = createMetadata({
  title: "Zety Alternative for UK CV Building, ATS Checks and Job Search",
  description:
    "Compare AI Career Guide as a Zety alternative for UK CV building, ATS CV checking, cover letters, interview prep, and application tracking.",
  path: "/compare/zety-alternative",
  keywords: ["Zety alternative", "Zety competitor", "UK CV builder alternative", "AI CV builder alternative"],
});

export const revalidate = 86400;

export default function ZetyAlternativePage() {
  return (
    <ComparisonLandingPage
      path="/compare/zety-alternative"
      competitorName="Zety"
      title="A Zety alternative for UK CVs, ATS checks, and the full job search."
      description="AI Career Guide is built for job seekers who want CV creation, ATS feedback, cover letters, interview prep, job search, and application tracking in one UK-focused workspace."
      positioning={["UK-first CV language", "ATS checker included", "Career workspace beyond the CV"]}
      points={[
        {
          title: "CV building",
          aiCareerGuide: "Build a UK-style CV, switch templates, improve bullets with AI, and keep the document connected to job descriptions.",
          competitor: "Zety is widely known for resume and CV building, templates, and career documents.",
        },
        {
          title: "ATS workflow",
          aiCareerGuide: "Run ATS-style checks against job descriptions and move directly into editing weak sections.",
          competitor: "Zety content often focuses on builder workflows, examples, and career advice.",
        },
        {
          title: "Application workflow",
          aiCareerGuide: "Use the same workspace for CVs, cover letters, job search, tracking, and interview preparation.",
          competitor: "Zety is usually evaluated first as a document builder and resume/CV advice destination.",
        },
      ]}
      faqs={[
        {
          question: "What is the best Zety alternative for UK CVs?",
          answer: "AI Career Guide is a strong Zety alternative if you want a UK-focused CV builder with ATS checks, AI writing support, cover letters, interview prep, and application tracking in one workspace.",
        },
        {
          question: "Does AI Career Guide replace a CV builder only?",
          answer: "No. It includes CV building, but also supports ATS analysis, cover letters, job discovery, application tracking, and interview preparation.",
        },
        {
          question: "Should I choose AI Career Guide or Zety?",
          answer: "Choose based on your workflow. If you want a broader AI career workspace for UK applications, AI Career Guide is designed around that end-to-end process.",
        },
      ]}
    />
  );
}
