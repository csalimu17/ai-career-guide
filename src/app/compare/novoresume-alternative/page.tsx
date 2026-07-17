import { ComparisonLandingPage } from "@/components/marketing/comparison-landing-page";
import { createMetadata } from "@/lib/metadata";

export const metadata = createMetadata({
  title: "Novoresume Alternative for CV Templates and ATS Applications",
  description:
    "Compare AI Career Guide as a Novoresume alternative for CV templates, ATS checks, AI writing, cover letters, and job application tracking.",
  path: "/compare/novoresume-alternative",
  keywords: ["Novoresume alternative", "Novoresume competitor", "CV template alternative", "ATS CV builder"],
});

export const revalidate = 86400;

export default function NovoresumeAlternativePage() {
  return (
    <ComparisonLandingPage
      path="/compare/novoresume-alternative"
      competitorName="Novoresume"
      title="A Novoresume alternative for templates, ATS checks, and active applications."
      description="AI Career Guide helps UK job seekers create CVs, check role alignment, write cover letters, prepare for interviews, and track applications."
      positioning={["ATS-friendly templates", "AI editing support", "Job-search workflow included"]}
      points={[
        {
          title: "Template quality",
          aiCareerGuide: "Use ATS-friendly CV templates while keeping AI guidance and role-specific checks connected to the document.",
          competitor: "Novoresume is widely known for resume and CV templates and structured document building.",
        },
        {
          title: "Role-specific optimisation",
          aiCareerGuide: "Compare your CV to job descriptions and improve keywords, bullets, and section quality before applying.",
          competitor: "Novoresume is commonly evaluated as a template-led resume/CV builder.",
        },
        {
          title: "Career follow-through",
          aiCareerGuide: "Continue from the CV into cover letters, interview preparation, job search, and tracking.",
          competitor: "Novoresume is usually compared for document creation rather than full application workflow management.",
        },
      ]}
      faqs={[
        {
          question: "What is a good Novoresume alternative?",
          answer: "AI Career Guide is a good Novoresume alternative if you want CV templates plus ATS checks, AI editing, cover letters, interview prep, and application tracking.",
        },
        {
          question: "Can I use AI Career Guide for ATS-friendly CV templates?",
          answer: "Yes. AI Career Guide includes ATS-friendly template workflows and an ATS CV checker to review job-description alignment.",
        },
        {
          question: "Is AI Career Guide useful after I finish my CV?",
          answer: "Yes. You can use it for cover letters, job search, interview preparation, and application tracking after the CV is created.",
        },
      ]}
    />
  );
}
