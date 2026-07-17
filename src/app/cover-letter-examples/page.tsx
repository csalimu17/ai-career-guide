import { SeoLandingPage } from "@/components/marketing/seo-landing-page";
import { createMetadata } from "@/lib/metadata";

export const metadata = createMetadata({
  title: "Cover Letter Examples UK for Job Applications",
  description:
    "Browse UK cover letter examples for job applications, career changes, graduates, and professional roles, with AI writing guidance.",
  path: "/cover-letter-examples",
  keywords: ["cover letter examples UK", "cover letter examples", "job application letter examples", "UK cover letter", "AI cover letter generator"],
});

export const revalidate = 86400;

export default function CoverLetterExamplesPage() {
  return (
    <SeoLandingPage
      path="/cover-letter-examples"
      eyebrow="Cover Letter Examples"
      title="Cover letter examples for stronger UK job applications."
      description="Use these cover letter examples to structure a focused application, connect your CV to the job description, and avoid generic filler."
      proof={["UK application wording", "Role-targeted structure", "Works with the cover letter generator"]}
      primaryCtaLabel="Generate cover letter"
      secondaryCtaLabel="Build a CV first"
      secondaryCtaHref="/cv-builder"
      sections={[
        {
          title: "Open with the role fit",
          body: "A strong cover letter should make the target role obvious and explain why your recent experience or motivation is relevant.",
          bullets: ["Name the role", "Mention the employer or team", "Use one clear reason for fit"],
        },
        {
          title: "Use proof from your CV",
          body: "The cover letter should not repeat your CV line by line. It should select two or three pieces of evidence and explain why they matter.",
          bullets: ["Choose relevant achievements", "Reference tools or sectors", "Show impact, not duties only"],
        },
        {
          title: "Finish with momentum",
          body: "Close by reinforcing interest and making it easy for the recruiter to move you to the next step.",
          bullets: ["Stay concise", "Avoid over-apologising", "Keep tone professional"],
        },
      ]}
      examples={[
        {
          title: "Professional cover letter opening",
          body: "I am applying for the Operations Manager role because my background in process improvement, team coordination, and customer delivery aligns closely with the requirements in your advert.",
        },
        {
          title: "Graduate cover letter evidence",
          body: "During my final-year project, I analysed survey data from 450 responses and presented recommendations that improved the clarity of our customer retention proposal.",
        },
        {
          title: "Career change cover letter bridge",
          body: "Although my background is in retail management, the strongest parts of my experience map directly to account coordination: stakeholder communication, prioritisation, and target ownership.",
        },
      ]}
      faqs={[
        {
          question: "How long should a UK cover letter be?",
          answer: "Most UK cover letters should be around three to five short paragraphs and fit comfortably on one page.",
        },
        {
          question: "Should every application have a different cover letter?",
          answer: "Yes. You can reuse a structure, but the role fit, evidence, and wording should be tailored to each job description.",
        },
        {
          question: "Can AI write my cover letter?",
          answer: "AI can help draft and tailor a cover letter, but you should review the wording so it accurately reflects your experience and target role.",
        },
      ]}
    />
  );
}
