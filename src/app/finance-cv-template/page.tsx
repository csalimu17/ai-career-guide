import { SeoLandingPage } from "@/components/marketing/seo-landing-page";
import { createMetadata } from "@/lib/metadata";

export const metadata = createMetadata({
  title: "Finance CV Template UK: Analyst, Accounting and Banking CVs",
  description:
    "Use a UK finance CV template for analyst, accounting, banking, and commercial finance roles, with ATS-friendly structure and examples.",
  path: "/finance-cv-template",
  keywords: ["finance CV template", "finance CV UK", "financial analyst CV", "accounting CV template", "banking CV template"],
});

export const revalidate = 86400;

export default function FinanceCvTemplatePage() {
  return (
    <SeoLandingPage
      path="/finance-cv-template"
      eyebrow="Finance CV Template"
      title="A finance CV template for analyst, accounting, and banking roles."
      description="Structure your finance CV around modelling, reporting, controls, stakeholder work, systems, and measurable commercial impact."
      proof={["Finance keyword guidance", "ATS-friendly template structure", "Examples for analyst and accounting roles"]}
      primaryCtaLabel="Build finance CV"
      secondaryCtaLabel="Find resume skills"
      secondaryCtaHref="/resume-skills/financial-analyst"
      sections={[
        {
          title: "Lead with finance capability",
          body: "Recruiters need to see the tools, reporting exposure, and commercial context that match the role.",
          bullets: ["Mention Excel, modelling, or ERP systems", "Show reporting cadence", "Name relevant sectors or products"],
        },
        {
          title: "Quantify outcomes",
          body: "Finance CVs are stronger when achievements include figures, time saved, risk reduced, or reporting improved.",
          bullets: ["Use GBP values where safe", "Add volume or frequency", "Show variance or forecast impact"],
        },
        {
          title: "Keep formatting conservative",
          body: "Finance employers often prefer clean, precise layouts over highly decorative CVs.",
          bullets: ["Use standard headings", "Keep bullet points tight", "Avoid visual clutter"],
        },
      ]}
      examples={[
        {
          title: "Financial analyst bullet",
          body: "Built a weekly revenue dashboard in Excel and Power BI, reducing manual reporting time by six hours per month.",
        },
        {
          title: "Accounting bullet",
          body: "Reconciled 1,200+ monthly transactions and resolved discrepancies with suppliers before month-end close.",
        },
        {
          title: "Commercial finance bullet",
          body: "Supported quarterly forecasting by analysing margin trends across three product lines and highlighting cost variance drivers.",
        },
      ]}
      faqs={[
        {
          question: "What skills should a finance CV include?",
          answer: "Finance CVs often include Excel, financial modelling, forecasting, variance analysis, reconciliations, reporting, stakeholder management, and relevant systems.",
        },
        {
          question: "Should a finance CV be one or two pages?",
          answer: "Most finance CVs should be one to two pages depending on experience. Keep it concise and evidence-led.",
        },
        {
          question: "How do I make a finance CV ATS-friendly?",
          answer: "Use standard headings, include relevant finance keywords from the job description, and avoid complex tables or decorative layouts.",
        },
      ]}
    />
  );
}
