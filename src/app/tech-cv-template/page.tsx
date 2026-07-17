import { SeoLandingPage } from "@/components/marketing/seo-landing-page";
import { createMetadata } from "@/lib/metadata";

export const metadata = createMetadata({
  title: "Tech CV Template UK: Software, Data and Product Roles",
  description:
    "Use a UK tech CV template for software engineering, data, product, and digital roles, with ATS-friendly structure and examples.",
  path: "/tech-cv-template",
  keywords: ["tech CV template", "software engineer CV UK", "data analyst CV template", "product manager CV", "ATS tech CV"],
});

export const revalidate = 86400;

export default function TechCvTemplatePage() {
  return (
    <SeoLandingPage
      path="/tech-cv-template"
      eyebrow="Tech CV Template"
      title="A tech CV template for software, data, product, and digital roles."
      description="Build a tech CV that shows stack, scope, projects, product impact, collaboration, and measurable outcomes without losing ATS readability."
      proof={["Tech stack sections", "Project-focused examples", "ATS-friendly role keywords"]}
      primaryCtaLabel="Build tech CV"
      secondaryCtaLabel="Software engineer skills"
      secondaryCtaHref="/resume-skills/software-engineer"
      sections={[
        {
          title: "Put the tech stack where recruiters can find it",
          body: "List relevant languages, frameworks, tools, platforms, and methods clearly instead of burying them in paragraphs.",
          bullets: ["Group skills by category", "Prioritise target-role tools", "Avoid inflated skill lists"],
        },
        {
          title: "Show impact, not only tasks",
          body: "Tech CVs work better when bullets explain the problem, action, technology, and outcome.",
          bullets: ["Mention scale or users", "Include performance or quality gains", "Show collaboration"],
        },
        {
          title: "Use projects strategically",
          body: "Projects are especially useful for graduates, career changers, and candidates with limited commercial experience.",
          bullets: ["Name the stack", "Explain the purpose", "Link to portfolio or GitHub when useful"],
        },
      ]}
      examples={[
        {
          title: "Software engineer bullet",
          body: "Built a React and Node.js dashboard used by 12 internal teams, reducing manual status reporting by 40%.",
        },
        {
          title: "Data analyst bullet",
          body: "Created SQL queries and Power BI dashboards to track weekly conversion trends and identify a 14% drop-off in onboarding.",
        },
        {
          title: "Product manager bullet",
          body: "Led discovery for a self-serve onboarding flow, aligning design and engineering around a roadmap that reduced support tickets by 18%.",
        },
      ]}
      faqs={[
        {
          question: "What should a tech CV include?",
          answer: "A tech CV should include a focused profile, technical skills, experience, projects, education, certifications, and measurable outcomes.",
        },
        {
          question: "Should I include GitHub on a tech CV?",
          answer: "Include GitHub if it contains relevant, presentable work that supports the role. Do not link to empty or unfinished repositories.",
        },
        {
          question: "How do I make a tech CV ATS-friendly?",
          answer: "Use clear headings, include exact tools and role keywords from the job description, and avoid layouts that hide skills inside images or complex formatting.",
        },
      ]}
    />
  );
}
