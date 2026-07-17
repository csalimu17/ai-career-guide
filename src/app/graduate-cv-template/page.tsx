import { SeoLandingPage } from "@/components/marketing/seo-landing-page";
import { createMetadata } from "@/lib/metadata";

export const metadata = createMetadata({
  title: "Graduate CV Template UK: ATS-Friendly First Job CV",
  description:
    "Use an ATS-friendly UK graduate CV template for first jobs, internships, placements, and entry-level applications, with examples and section guidance.",
  path: "/graduate-cv-template",
  keywords: ["graduate CV template", "UK graduate CV", "student CV template", "entry level CV", "first job CV template"],
});

export const revalidate = 86400;

export default function GraduateCvTemplatePage() {
  return (
    <SeoLandingPage
      path="/graduate-cv-template"
      eyebrow="Graduate CV Template"
      title="A UK graduate CV template for first jobs and entry-level roles."
      description="Build a graduate CV that turns education, projects, internships, part-time work, and transferable skills into a clear application story."
      proof={["Designed for first jobs", "Works for internships and placements", "ATS-friendly graduate structure"]}
      primaryCtaLabel="Build graduate CV"
      secondaryCtaLabel="See UK CV format"
      secondaryCtaHref="/uk-cv-format"
      sections={[
        {
          title: "Lead with potential and relevance",
          body: "Graduate CVs should make the target role obvious and translate academic or project experience into useful workplace evidence.",
          bullets: ["Write a focused profile", "Name your degree and key modules", "Show tools, projects, and outcomes"],
        },
        {
          title: "Use experience broadly",
          body: "Internships, placements, societies, volunteering, part-time work, and coursework can all prove employability when framed well.",
          bullets: ["Highlight teamwork and ownership", "Add measurable results", "Use action verbs"],
        },
        {
          title: "Keep it concise",
          body: "A graduate CV should usually be one page unless you have substantial relevant placements, projects, or technical experience.",
          bullets: ["Cut school details if degree is stronger", "Avoid long personal statements", "Tailor skills to the vacancy"],
        },
      ]}
      examples={[
        {
          title: "Graduate profile example",
          body: "Recent Business Management graduate with placement experience in customer operations, strong Excel reporting skills, and a track record of improving team processes through clear documentation.",
        },
        {
          title: "Project bullet example",
          body: "Analysed customer survey data from 450 responses, built a dashboard in Excel, and presented three retention recommendations to a five-person project panel.",
        },
        {
          title: "Part-time work bullet example",
          body: "Handled 60+ customer queries per shift while balancing university deadlines, developing prioritisation, communication, and problem-solving skills.",
        },
      ]}
      faqs={[
        {
          question: "What should a graduate CV include?",
          answer: "A graduate CV should include contact details, a short profile, education, relevant skills, projects, work experience, internships, volunteering, and achievements.",
        },
        {
          question: "Should education go before experience on a graduate CV?",
          answer: "If your degree, modules, dissertation, or projects are stronger than your work history, place education before experience. If you have a strong placement, lead with experience.",
        },
        {
          question: "Can a graduate CV be two pages?",
          answer: "Yes, but one page is often enough. Use two pages only if the extra content is relevant to the role and improves your application.",
        },
      ]}
    />
  );
}
