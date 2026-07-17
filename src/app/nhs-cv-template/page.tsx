import { SeoLandingPage } from "@/components/marketing/seo-landing-page";
import { createMetadata } from "@/lib/metadata";

export const metadata = createMetadata({
  title: "NHS CV Template UK: Healthcare CV Structure and Examples",
  description:
    "Use an NHS CV template for UK healthcare applications, with examples for clinical, admin, support, and transferable healthcare roles.",
  path: "/nhs-cv-template",
  keywords: ["NHS CV template", "healthcare CV UK", "NHS job application CV", "clinical CV template", "healthcare assistant CV"],
});

export const revalidate = 86400;

export default function NhsCvTemplatePage() {
  return (
    <SeoLandingPage
      path="/nhs-cv-template"
      eyebrow="NHS CV Template"
      title="An NHS CV template for clear healthcare applications."
      description="Structure your healthcare CV around role requirements, patient-facing experience, compliance, communication, and measurable contribution."
      proof={["Healthcare-focused sections", "NHS application language", "ATS-readable layout"]}
      primaryCtaLabel="Build NHS CV"
      secondaryCtaLabel="See UK CV format"
      secondaryCtaHref="/uk-cv-format"
      sections={[
        {
          title: "Show healthcare relevance early",
          body: "Open with your healthcare setting, patient contact, administrative exposure, or transferable care experience.",
          bullets: ["Mention NHS or healthcare exposure", "Highlight safeguarding or confidentiality", "Keep the profile role-specific"],
        },
        {
          title: "Use clear compliance evidence",
          body: "Healthcare recruiters need to see reliability, documentation, communication, and safe working practices.",
          bullets: ["Include training where relevant", "Use standard job titles", "Show patient or service impact"],
        },
        {
          title: "Tailor to the person specification",
          body: "NHS applications often map closely to essential and desirable criteria, so align your CV wording with the job advert.",
          bullets: ["Use criteria keywords", "Add examples of teamwork", "Keep achievements specific"],
        },
      ]}
      examples={[
        {
          title: "Healthcare assistant CV focus",
          body: "Patient support, observations, dignity, communication, infection control, and accurate record keeping.",
        },
        {
          title: "NHS admin CV focus",
          body: "Appointment coordination, patient records, confidentiality, stakeholder communication, and system accuracy.",
        },
        {
          title: "Clinical CV focus",
          body: "Specialism, caseload, outcomes, governance, multidisciplinary work, and continuing professional development.",
        },
      ]}
      faqs={[
        {
          question: "What should an NHS CV include?",
          answer: "An NHS CV should include contact details, a focused profile, relevant skills, healthcare experience, education, training, certifications, and role-specific achievements.",
        },
        {
          question: "Should I tailor my CV to the NHS person specification?",
          answer: "Yes. Match your CV to the essential and desirable criteria in the job advert, using clear examples where possible.",
        },
        {
          question: "Can I use this template for non-clinical NHS roles?",
          answer: "Yes. The same structure can be adapted for admin, support, operations, and non-clinical healthcare roles.",
        },
      ]}
    />
  );
}
