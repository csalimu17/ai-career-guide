import { FeatureLandingPage } from "@/components/marketing/feature-landing-page";
import { createMetadata } from "@/lib/metadata";

export const metadata = createMetadata({
  title: "Built-In Job Search & Application Tracker",
  description:
    "Search live jobs, save opportunities, track applications, and keep your CV tailoring workflow connected inside AI Career Guide.",
  path: "/job-search",
  keywords: ["job search tool", "free job search", "job application tracker", "job tracker", "UK job search", "application tracking"],
});

export const revalidate = 86400;

export default function JobSearchPage() {
  return (
    <FeatureLandingPage
      eyebrow="Job Search"
      title="Find roles and keep every application moving."
      description="AI Career Guide includes live job discovery and application tracking so your CV, cover letters, ATS checks, and follow-ups stay connected."
      path="/job-search"
      ctaLabel="Start job search"
      secondaryCtaLabel="Explore CV builder"
      secondaryCtaHref="/cv-builder"
      proof={["Live job discovery", "Saved roles and pipeline stages", "CV tailoring connected to target jobs"]}
      points={[
        {
          title: "Search jobs from the same workspace",
          description: "Find relevant roles and review opportunities without disconnecting from the CV and cover letter work that supports each application.",
        },
        {
          title: "Save opportunities into a tracker",
          description: "Keep saved, started, applied, interviewing, offer, and rejected roles visible so your pipeline does not disappear into browser tabs.",
        },
        {
          title: "Tailor materials around real job descriptions",
          description: "Use target roles to improve ATS alignment, adjust keywords, and create stronger application documents.",
        },
        {
          title: "Keep momentum visible",
          description: "Track follow-ups, next steps, and application stages so the search becomes manageable instead of scattered.",
        },
      ]}
      workflow={[
        {
          title: "Search by role, location, and work style",
          description: "Start with a target title, region, or remote preference and review roles that match your search.",
        },
        {
          title: "Save and track the roles that matter",
          description: "Move opportunities into your tracker and keep the application stage visible across the workspace.",
        },
        {
          title: "Tailor your CV and prepare the next action",
          description: "Use each target role to guide ATS checks, cover letters, follow-ups, and interview preparation.",
        },
      ]}
      faqs={[
        {
          question: "Does AI Career Guide include job search?",
          answer: "Yes. The app includes built-in job discovery and an application tracker alongside the CV builder and ATS checker.",
        },
        {
          question: "Can I track jobs I find elsewhere?",
          answer: "Yes. The tracker is designed to keep applications visible whether they start from built-in search or external job boards.",
        },
        {
          question: "How does job search connect to the CV tools?",
          answer: "Target roles can guide ATS checks, CV tailoring, cover letter generation, and interview preparation.",
        },
      ]}
    />
  );
}
