import { FeatureLandingPage } from "@/components/marketing/feature-landing-page";
import { createMetadata } from "@/lib/metadata";

export const metadata = createMetadata({
  title: "AI Cover Letter Generator for Job Applications",
  description:
    "Generate tailored cover letters and shorter application email drafts that stay aligned with your CV, target role, and job search workflow.",
  path: "/cover-letter-generator",
  keywords: ["AI cover letter generator", "cover letter generator", "tailored cover letter", "job application letter", "cover letter AI"],
});

export const revalidate = 86400;

export default function CoverLetterGeneratorPage() {
  return (
    <FeatureLandingPage
      eyebrow="Cover Letter Generator"
      title="Create cover letters that fit the role, not just the template."
      description="Turn your CV, target role, and application context into a tailored cover letter and shorter email version without starting from a blank page."
      path="/cover-letter-generator"
      ctaLabel="Generate a cover letter"
      secondaryCtaLabel="Explore ATS checker"
      secondaryCtaHref="/ats-cv-checker"
      proof={["Tailored long-form letters", "Short email versions", "Aligned with CV and target role"]}
      points={[
        {
          title: "Generate role-specific cover letters",
          description: "Use the target job and your career background to create letters that speak to the role instead of generic filler.",
        },
        {
          title: "Keep your CV and letter aligned",
          description: "Make sure the strengths in your CV are reflected in the application narrative you send alongside it.",
        },
        {
          title: "Create shorter outreach versions",
          description: "Prepare concise email-style versions for applications, recruiters, and follow-ups where a full letter is too much.",
        },
        {
          title: "Use cover letters as part of the full workflow",
          description: "Move from CV building to ATS checking, cover letter creation, job tracking, and interview prep in one place.",
        },
      ]}
      workflow={[
        {
          title: "Start with your CV and target role",
          description: "Use your existing career story and the job you want to apply for as the foundation.",
        },
        {
          title: "Generate and refine the letter",
          description: "Create a draft, then adjust tone, evidence, and emphasis before sending.",
        },
        {
          title: "Track the application",
          description: "Save the role, manage the status, and prepare for follow-ups or interviews from the same workspace.",
        },
      ]}
      faqs={[
        {
          question: "Can AI Career Guide generate cover letters?",
          answer: "Yes. The app can generate tailored cover letters and shorter email versions for applications.",
        },
        {
          question: "Will the cover letter match my CV?",
          answer: "The workflow is designed to keep cover letters aligned with your CV, target role, and application context.",
        },
        {
          question: "Can I use this with the job tracker?",
          answer: "Yes. Cover letters fit into the wider application workflow alongside job search, tracking, ATS checks, and interview prep.",
        },
      ]}
    />
  );
}
