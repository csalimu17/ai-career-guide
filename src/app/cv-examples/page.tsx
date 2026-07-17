import { SeoLandingPage } from "@/components/marketing/seo-landing-page";
import { CV_EXAMPLE_PAGES } from "@/lib/cv-example-pages";
import { createMetadata } from "@/lib/metadata";

export const metadata = createMetadata({
  title: "UK CV Examples for Jobs, Graduates and Career Changers",
  description:
    "Browse practical UK CV examples for job applications, graduates, career changers, and experienced professionals, with ATS-friendly structure guidance.",
  path: "/cv-examples",
  keywords: ["UK CV examples", "CV examples", "professional CV examples", "graduate CV example", "ATS CV examples"],
});

export const revalidate = 86400;

export default function CvExamplesPage() {
  return (
    <SeoLandingPage
      path="/cv-examples"
      eyebrow="UK CV Examples"
      title="UK CV examples you can adapt for stronger job applications."
      description="Use these CV examples to understand the structure, evidence, and wording UK recruiters expect, then build a tailored CV inside AI Career Guide."
      proof={["UK-first CV structure", "ATS-friendly sections", "Examples for different career stages"]}
      primaryCtaLabel="Build from an example"
      secondaryCtaLabel="Browse CV templates"
      secondaryCtaHref="/cv-templates"
      relatedLinks={CV_EXAMPLE_PAGES.map((page) => ({
        label: `${page.role} CV example`,
        href: `/cv-examples/${page.slug}`,
        description: page.description,
      }))}
      sections={[
        {
          title: "Start with recruiter-readable structure",
          body: "A strong UK CV usually opens with contact details, a targeted profile, relevant skills, experience, education, and optional extras such as certifications or projects.",
          bullets: ["Keep headings standard", "Put the most relevant evidence first", "Use concise bullets with outcomes"],
        },
        {
          title: "Match examples to the role",
          body: "The best CV example is not the prettiest one. It is the one closest to your target job, seniority, and sector.",
          bullets: ["Mirror role keywords naturally", "Show scope, tools, and results", "Avoid generic personality claims"],
        },
        {
          title: "Turn examples into tailored applications",
          body: "Use examples as structure, then run your CV against the job description so it reflects the actual vacancy.",
          bullets: ["Check missing keywords", "Rewrite weak bullets", "Export a clean PDF"],
        },
      ]}
      examples={[
        {
          title: "Experienced professional CV",
          body: "Best for candidates with a clear work history and measurable achievements.",
          bullets: ["Lead with a targeted profile", "Group skills around the role", "Use metrics in experience bullets"],
        },
        {
          title: "Graduate CV",
          body: "Best for early-career candidates with limited direct experience.",
          bullets: ["Put education and projects near the top", "Show internships and societies", "Translate coursework into role skills"],
        },
        {
          title: "Career change CV",
          body: "Best when your previous titles do not directly match the role you want next.",
          bullets: ["Open with transferable strengths", "Prioritise relevant achievements", "Explain the pivot without over-explaining"],
        },
      ]}
      faqs={[
        {
          question: "What should a UK CV example include?",
          answer: "A UK CV example should include contact details, a short profile, relevant skills, work experience, education, and optional sections such as projects, certifications, languages, or interests where useful.",
        },
        {
          question: "Should a UK CV include a photo?",
          answer: "For most UK job applications, a photo is not expected. A clean text-first format is usually safer for recruiters and applicant tracking systems.",
        },
        {
          question: "Can I use one CV example for every application?",
          answer: "Use one example as your base structure, but tailor the wording, skills, and achievements to each job description before applying.",
        },
      ]}
    />
  );
}
