import { SeoLandingPage } from "@/components/marketing/seo-landing-page";
import { createMetadata } from "@/lib/metadata";

export const metadata = createMetadata({
  title: "CV Personal Statement Examples UK",
  description:
    "Use UK CV personal statement examples for graduates, career changers, experienced professionals, and role-targeted applications.",
  path: "/cv-personal-statement-examples",
  keywords: ["CV personal statement examples", "personal statement for CV", "CV profile examples UK", "professional summary examples"],
});

export const revalidate = 86400;

export default function CvPersonalStatementExamplesPage() {
  return (
    <SeoLandingPage
      path="/cv-personal-statement-examples"
      eyebrow="CV Personal Statement"
      title="CV personal statement examples that quickly explain your fit."
      description="Write a sharper CV profile by summarising your target role, strongest evidence, and relevant skills in a few focused lines."
      proof={["UK CV profile guidance", "Examples by career stage", "ATS-friendly wording"]}
      primaryCtaLabel="Write my CV profile"
      secondaryCtaLabel="See CV examples"
      secondaryCtaHref="/cv-examples"
      sections={[
        {
          title: "Make the target role clear",
          body: "The reader should understand what kind of role you are aiming for within the first sentence.",
          bullets: ["Name your career area", "Mention seniority or sector", "Avoid vague ambition statements"],
        },
        {
          title: "Add proof, not personality filler",
          body: "Replace phrases like hard-working and passionate with evidence from your experience, education, or projects.",
          bullets: ["Use metrics where possible", "Mention relevant tools", "Highlight sector exposure"],
        },
        {
          title: "Keep it short",
          body: "A UK CV personal statement should usually be three to five lines, not a long autobiography.",
          bullets: ["Use direct language", "Cut repeated CV details", "Tailor to the vacancy"],
        },
      ]}
      examples={[
        {
          title: "Experienced professional profile",
          body: "Operations manager with seven years of experience improving customer delivery, team performance, and reporting processes across fast-paced service environments.",
        },
        {
          title: "Graduate profile",
          body: "Recent economics graduate with strong Excel, research, and data presentation skills, seeking an analyst role where academic modelling and internship experience can support commercial decisions.",
        },
        {
          title: "Career change profile",
          body: "Retail team leader transitioning into customer success, bringing stakeholder communication, issue resolution, and target ownership from high-volume customer-facing environments.",
        },
      ]}
      faqs={[
        {
          question: "What is a CV personal statement?",
          answer: "A CV personal statement is a short profile near the top of your CV that summarises your fit for the target role.",
        },
        {
          question: "How many words should a CV personal statement be?",
          answer: "Most CV personal statements should be around 40 to 80 words, depending on seniority and complexity.",
        },
        {
          question: "Should I write my CV personal statement in first person?",
          answer: "UK CVs usually avoid first-person pronouns. Write concise phrases such as 'Project manager with...' instead of 'I am a project manager...'.",
        },
      ]}
    />
  );
}
