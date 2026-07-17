import { ComparisonLandingPage } from "@/components/marketing/comparison-landing-page";
import { createMetadata } from "@/lib/metadata";

export const metadata = createMetadata({
  title: "Kickresume Alternative for UK CVs, ATS Checks and Job Search",
  description:
    "Compare AI Career Guide as a Kickresume alternative for UK CV building, ATS CV checks, cover letters, interview prep, and application tracking.",
  path: "/compare/kickresume-alternative",
  keywords: ["Kickresume alternative", "Kickresume competitor", "AI CV builder alternative", "CV builder comparison"],
});

export const revalidate = 86400;

export default function KickresumeAlternativePage() {
  return (
    <ComparisonLandingPage
      path="/compare/kickresume-alternative"
      competitorName="Kickresume"
      title="A Kickresume alternative for UK CVs and practical job-search execution."
      description="AI Career Guide is built for job seekers who want CV building, ATS feedback, cover letters, interview preparation, job search, and application tracking in one workflow."
      positioning={["UK CV guidance", "ATS checks in the workflow", "Applications beyond the document"]}
      points={[
        {
          title: "Creative CV creation",
          aiCareerGuide: "Build clean, ATS-friendly CVs while keeping role targeting and job-search follow-through close to the editor.",
          competitor: "Kickresume is widely known for resume and cover letter creation, templates, and creative career-document tools.",
        },
        {
          title: "ATS readiness",
          aiCareerGuide: "Check your CV against job descriptions and improve missing keywords or weak sections before applying.",
          competitor: "Kickresume is often evaluated for document creation and presentation-led career materials.",
        },
        {
          title: "Ongoing application flow",
          aiCareerGuide: "Move from CV building into cover letters, interview prep, saved jobs, and application tracking.",
          competitor: "Kickresume is commonly compared as a resume/CV and cover letter builder.",
        },
      ]}
      faqs={[
        {
          question: "Is AI Career Guide a Kickresume alternative?",
          answer: "Yes. AI Career Guide is a Kickresume alternative for users who want CV building plus ATS checks, job tracking, cover letters, and interview prep.",
        },
        {
          question: "Which is better for UK CVs?",
          answer: "AI Career Guide is positioned around UK CV language and application workflows, which may suit UK job seekers who want CV guidance plus ATS analysis.",
        },
        {
          question: "Does AI Career Guide include cover letters?",
          answer: "Yes. AI Career Guide includes cover letter generation as part of the broader career workspace.",
        },
      ]}
    />
  );
}
