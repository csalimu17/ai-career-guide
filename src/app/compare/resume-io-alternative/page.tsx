import { ComparisonLandingPage } from "@/components/marketing/comparison-landing-page";
import { createMetadata } from "@/lib/metadata";

export const metadata = createMetadata({
  title: "Resume.io Alternative for UK CVs and ATS Job Applications",
  description:
    "Compare AI Career Guide as a Resume.io alternative for UK CV building, ATS CV checks, cover letters, interview prep, and job application tracking.",
  path: "/compare/resume-io-alternative",
  keywords: ["Resume.io alternative", "Resume.io competitor", "UK CV builder", "ATS CV checker alternative"],
});

export const revalidate = 86400;

export default function ResumeIoAlternativePage() {
  return (
    <ComparisonLandingPage
      path="/compare/resume-io-alternative"
      competitorName="Resume.io"
      title="A Resume.io alternative for UK CVs and role-targeted applications."
      description="AI Career Guide gives UK job seekers a connected way to build CVs, check ATS fit, generate cover letters, prepare for interviews, and track applications."
      positioning={["CV builder plus ATS checks", "UK application guidance", "Job tracker built into the workflow"]}
      points={[
        {
          title: "Template-led creation",
          aiCareerGuide: "Create ATS-friendly CVs with templates while keeping AI guidance, role targeting, and scan feedback close to the editor.",
          competitor: "Resume.io is widely known for polished templates and a straightforward resume/CV builder experience.",
        },
        {
          title: "Role targeting",
          aiCareerGuide: "Compare your CV with a job description and act on missing keywords or weak sections before applying.",
          competitor: "Resume.io is commonly evaluated for document creation, templates, and career-document guidance.",
        },
        {
          title: "Search management",
          aiCareerGuide: "Track roles, generate cover letters, and prepare interview answers after the CV is built.",
          competitor: "Resume.io is strongest as a resume/CV document creation platform.",
        },
      ]}
      faqs={[
        {
          question: "Is AI Career Guide a Resume.io alternative?",
          answer: "Yes. It can be used as a Resume.io alternative if you want CV building plus ATS checks, AI career support, cover letters, job tracking, and interview prep.",
        },
        {
          question: "Is AI Career Guide focused on UK CVs?",
          answer: "Yes. The public pages and product positioning are built around UK CV language, formats, and job-search workflows.",
        },
        {
          question: "Can I start free?",
          answer: "Yes. AI Career Guide has a free starting point so job seekers can begin building and improving a CV before choosing whether to upgrade.",
        },
      ]}
    />
  );
}
