import { SeoLandingPage } from "@/components/marketing/seo-landing-page";
import { createMetadata } from "@/lib/metadata";

export const metadata = createMetadata({
  title: "UK CV Format: ATS-Friendly Layout, Sections and Examples",
  description:
    "Learn the best UK CV format for modern job applications, including section order, length, layout, ATS readability, and recruiter-friendly wording.",
  path: "/uk-cv-format",
  keywords: ["UK CV format", "CV format UK", "ATS friendly CV format", "professional CV layout", "UK resume format"],
});

export const revalidate = 86400;

export default function UkCvFormatPage() {
  return (
    <SeoLandingPage
      path="/uk-cv-format"
      eyebrow="UK CV Format"
      title="The UK CV format that stays clear for recruiters and ATS systems."
      description="A practical guide to formatting a UK CV with the right section order, readable layout, and job-specific evidence."
      proof={["Two-page UK CV guidance", "ATS-readable headings", "Recruiter-friendly layout rules"]}
      primaryCtaLabel="Format my CV"
      secondaryCtaLabel="Check my ATS score"
      sections={[
        {
          title: "Use a simple section order",
          body: "For most UK candidates, the safest order is contact details, profile, key skills, experience, education, and then optional sections.",
          bullets: ["Use standard headings", "Keep contact details at the top", "Place strongest evidence above the fold"],
        },
        {
          title: "Keep the layout clean",
          body: "Avoid tables, heavy graphics, unusual columns, and decorative icons when ATS compatibility matters.",
          bullets: ["Use readable spacing", "Prefer text over images", "Export as a clean PDF when requested"],
        },
        {
          title: "Format around relevance",
          body: "Your format should help the recruiter find proof that you match the role quickly.",
          bullets: ["Prioritise recent relevant roles", "Use bullet points, not paragraphs", "Show numbers where possible"],
        },
      ]}
      examples={[
        {
          title: "Recommended UK CV order",
          body: "Contact details, personal profile, key skills, professional experience, education, certifications, projects, languages, interests.",
        },
        {
          title: "Best CV length",
          body: "Most UK CVs should be one to two pages. Senior candidates can use two pages when the extra space adds relevant evidence.",
        },
        {
          title: "ATS-safe formatting",
          body: "Use standard headings, normal text, clear dates, common fonts, and simple spacing so parsing systems can read your CV.",
        },
      ]}
      faqs={[
        {
          question: "How long should a UK CV be?",
          answer: "Most UK CVs should be one or two pages. Graduates can often use one page, while experienced candidates usually need two pages if the content is relevant.",
        },
        {
          question: "What is the best font for a UK CV?",
          answer: "Use a readable font such as Arial, Calibri, Inter, Times New Roman, or another clean professional font. Avoid decorative typefaces.",
        },
        {
          question: "Is a two-column CV ATS-friendly?",
          answer: "A simple two-column CV can work, but a single-column layout is safer when ATS parsing is critical.",
        },
      ]}
    />
  );
}
