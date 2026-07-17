import { SeoLandingPage } from "@/components/marketing/seo-landing-page";
import { createMetadata } from "@/lib/metadata";

export const metadata = createMetadata({
  title: "Career Change CV UK: Template, Examples and ATS Tips",
  description:
    "Build a career change CV for UK job applications with transferable skills, role-focused examples, ATS keywords, and practical structure.",
  path: "/career-change-cv",
  keywords: ["career change CV", "career change CV UK", "transferable skills CV", "career change resume", "CV for changing careers"],
});

export const revalidate = 86400;

export default function CareerChangeCvPage() {
  return (
    <SeoLandingPage
      path="/career-change-cv"
      eyebrow="Career Change CV"
      title="A career change CV that connects your past experience to your next role."
      description="Position transferable skills, explain the pivot clearly, and tailor your CV so recruiters can see why your background fits the role."
      proof={["Transferable skills structure", "ATS keyword guidance", "Career pivot examples"]}
      primaryCtaLabel="Build career change CV"
      secondaryCtaLabel="Check ATS alignment"
      sections={[
        {
          title: "Lead with the target role",
          body: "A career change CV should make the next direction clear before the recruiter starts interpreting your old job titles.",
          bullets: ["Use a focused profile", "Add a relevant skills section", "Match the job description language"],
        },
        {
          title: "Reframe existing achievements",
          body: "Your previous roles can still prove communication, analysis, leadership, customer handling, or project ownership.",
          bullets: ["Translate duties into outcomes", "Remove irrelevant detail", "Prioritise transferable achievements"],
        },
        {
          title: "Use projects and training",
          body: "Courses, certifications, portfolio work, volunteering, and side projects can show commitment to the new direction.",
          bullets: ["Include recent learning", "Show practical application", "Keep claims evidence-backed"],
        },
      ]}
      examples={[
        {
          title: "Retail to customer success",
          body: "Lead with customer communication, issue resolution, account ownership, and target delivery rather than store operations alone.",
        },
        {
          title: "Teaching to project coordination",
          body: "Emphasise planning, stakeholder management, documentation, risk handling, and deadline ownership.",
        },
        {
          title: "Admin to data analyst",
          body: "Prioritise Excel reporting, data cleanup, process improvement, dashboard exposure, and analytical projects.",
        },
      ]}
      faqs={[
        {
          question: "How do I write a CV when changing careers?",
          answer: "Start with the target role, add transferable skills, reframe past achievements, and include projects or training that support the new direction.",
        },
        {
          question: "Should I hide unrelated experience?",
          answer: "No. Keep relevant parts and reduce unrelated detail. The goal is to make the connection clear, not erase your history.",
        },
        {
          question: "Can ATS systems understand career changes?",
          answer: "ATS systems mainly parse keywords and structure, so use role-relevant headings, skills, and terminology from the target job description.",
        },
      ]}
    />
  );
}
