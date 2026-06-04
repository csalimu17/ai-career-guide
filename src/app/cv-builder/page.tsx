import Link from "next/link";
import { ArrowRight, CheckCircle2, FileText, LayoutTemplate, ScanSearch, Sparkles, Target } from "lucide-react";
import { PublicHeader } from "@/components/marketing/public-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { absoluteUrl, createMetadata } from "@/lib/metadata";
import { siteConfig } from "@/lib/site";

const navigationItems = [
  { label: "CV Builder", href: "/cv-builder" },
  { label: "Platform", href: "/#platform" },
  { label: "Workflow", href: "/#workflow" },
  { label: "Pricing", href: "/#pricing" },
  { label: "Support", href: "/support" },
];

const benefitCards = [
  {
    icon: FileText,
    title: "Build from scratch or upload an existing CV",
    description:
      "Start with your current document or create a new one inside a guided editor built for modern CV structure and clarity.",
  },
  {
    icon: Sparkles,
    title: "Use AI to improve summaries and bullet points",
    description:
      "Generate stronger role-focused content suggestions without losing control over tone, achievements, or section order.",
  },
  {
    icon: ScanSearch,
    title: "Check ATS fit before you apply",
    description:
      "Compare your CV against a job description to catch missing keywords, weak alignment, and opportunities to improve fast.",
  },
  {
    icon: LayoutTemplate,
    title: "Switch templates without reformatting",
    description:
      "Move between polished CV templates while keeping the same core experience, education, skills, and summary content.",
  },
];

const workflowSteps = [
  {
    title: "Choose your target role",
    description:
      "Tell the platform what kind of role you want so your CV builder workflow can stay focused on the right direction.",
  },
  {
    title: "Draft and improve your CV",
    description:
      "Write manually, upload an existing CV, or use AI bullet suggestions to strengthen each block of experience and impact.",
  },
  {
    title: "Tailor it for applications",
    description:
      "Run ATS checks, adjust wording for a live vacancy, then export a cleaner, more targeted version of your CV.",
  },
];

const faqItems = [
  {
    question: "Is this CV builder suitable for ATS-friendly CVs?",
    answer:
      "Yes. AI Career Guide is built around readable layouts, structured sections, and CV formatting that stays friendly to applicant tracking systems.",
  },
  {
    question: "Can I use the CV builder on mobile?",
    answer:
      "Yes. You can edit CV content, use AI bullet suggestions, reorder sections, and preview your CV on mobile as well as desktop.",
  },
  {
    question: "Can I upload my existing CV first?",
    answer:
      "Yes. You can import an existing CV, clean it up in the editor, improve sections with AI, and switch templates without starting over.",
  },
  {
    question: "Does it also work as a resume builder?",
    answer:
      "Yes. The platform supports both CV and resume workflows, including editing, AI refinement, ATS checks, and job application tracking.",
  },
  {
    question: "Can I use this as a free CV editor?",
    answer:
      "Yes. You can start with the free plan and use the CV editor to write, reorder, refine, and preview your CV before upgrading for more advanced usage.",
  },
];

export const metadata = createMetadata({
  title: "Free CV Builder & CV Editor",
  description:
    "Use a free AI CV builder and CV editor to create a professional CV, improve bullet points, check ATS fit, and tailor your CV for real job applications.",
  path: "/cv-builder",
  keywords: [
    "CV builder",
    "AI CV builder",
    "free CV builder",
    "free CV editor",
    "online CV builder",
    "professional CV builder",
    "ATS friendly CV builder",
    "create a CV online",
    "build a CV",
    "CV maker",
  ],
});

export default function CvBuilderPage() {
  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: "CV Builder",
      url: absoluteUrl("/cv-builder"),
      description:
        "AI CV builder page for creating a professional CV, improving ATS fit, and tailoring applications inside AI Career Guide.",
      isPartOf: {
        "@type": "WebSite",
        name: siteConfig.name,
        url: siteConfig.url,
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: `${siteConfig.name} CV Builder`,
      applicationCategory: "BusinessApplication",
      applicationSubCategory: "CV Builder",
      operatingSystem: "Web",
      url: absoluteUrl("/cv-builder"),
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "GBP",
      },
      featureList: [
        "AI CV builder",
        "Resume builder",
        "ATS CV checker",
        "CV templates",
        "AI bullet suggestions",
        "Job application tracker",
      ],
      description:
        "Create, improve, and tailor CVs online with AI-assisted editing, ATS checks, template switching, and job search tools.",
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqItems.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.answer,
        },
      })),
    },
  ];

  return (
    <div className="min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <PublicHeader items={navigationItems} ctaHref="/signup" ctaLabel="Build my CV" />

      <main className="pb-24">
        <section className="relative overflow-hidden pb-16 pt-12 sm:pb-24 sm:pt-20">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(51,184,255,0.15),transparent_30%),radial-gradient(circle_at_78%_18%,rgba(124,99,255,0.14),transparent_25%),radial-gradient(circle_at_82%_82%,rgba(255,159,110,0.13),transparent_24%)]" />
          <div className="app-shell relative grid gap-8 lg:grid-cols-[1.02fr_0.98fr] lg:items-center">
            <div className="space-y-6">
              <div className="eyebrow-chip w-fit">Free AI CV Builder</div>
              <div className="sr-only">
                Free CV builder, free CV editor, AI CV builder, online CV builder, professional CV builder, and ATS-friendly CV builder.
              </div>
              <div className="space-y-4">
                <h1 className="headline-gradient-vivid font-display max-w-4xl pb-[0.08em] text-[2.35rem] font-semibold leading-[1.15] tracking-[-0.07em] sm:text-5xl lg:text-[4.35rem]">
                  <span className="block">Create a professional CV</span>
                  <span className="block">with AI guidance</span>
                  <span className="block">and better ATS signals.</span>
                </h1>
                <p className="max-w-2xl text-[1rem] leading-7 text-muted-foreground sm:text-[1.15rem]">
                  AI Career Guide is a free CV builder and CV editor that helps you write stronger summaries, improve bullet points, switch templates, and tailor your CV to real jobs without losing structure.
                </p>
              </div>

              <div className="grid gap-3 sm:flex sm:flex-row">
                <Button size="lg" asChild>
                  <Link href="/signup">
                    Build my CV
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/pricing">See pricing</Link>
                </Button>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  { label: "Free CV editor", value: "Bullet and summary suggestions" },
                  { label: "ATS checks", value: "Job-based keyword alignment" },
                  { label: "Flexible templates", value: "Swap designs without rewriting" },
                ].map((item) => (
                  <div key={item.label} className="canva-block px-4 py-4">
                    <p className="text-[0.62rem] font-bold uppercase tracking-[0.16em] text-muted-foreground sm:tracking-[0.22em]">
                      {item.label}
                    </p>
                    <p className="mt-2 text-[0.92rem] font-bold leading-6 text-primary">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="surface-card space-y-4 p-4 sm:p-6">
              <div className="rounded-[1.6rem] border border-border/70 bg-white/88 p-4 sm:p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[0.65rem] font-bold uppercase tracking-[0.22em] text-muted-foreground">CV Builder Snapshot</p>
                    <h2 className="mt-2 font-display text-[1.4rem] font-semibold text-primary sm:text-[1.7rem]">One workspace, cleaner applications.</h2>
                  </div>
                  <div className="icon-orb h-12 w-12 shrink-0 text-primary">
                    <Target className="h-5 w-5" />
                  </div>
                </div>

                <div className="mt-5 grid gap-3">
                  {[
                    "Create a new CV or import your current one",
                    "Use AI bullet suggestions inside each experience block",
                    "Check ATS fit against a real vacancy before applying",
                    "Export a sharper CV and track applications in the same place",
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-3 rounded-[1.1rem] border border-border/70 bg-background/90 px-3.5 py-3">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-secondary" />
                      <p className="text-sm leading-6 text-primary">{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="pb-14 sm:pb-20">
          <div className="app-shell space-y-7">
            <div className="max-w-3xl space-y-3">
              <p className="eyebrow-chip w-fit">Why this CV builder works</p>
              <h2 className="font-display text-[1.9rem] font-semibold tracking-tight text-primary sm:text-4xl">
                Built for job seekers who want better outcomes, not just prettier templates.
              </h2>
              <p className="text-[0.95rem] leading-relaxed text-muted-foreground sm:text-base">
                A strong CV builder should help you write more clearly, tailor faster, and keep your applications moving. That is the job this page is designed to do.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {benefitCards.map((card) => (
                <Card key={card.title} className="border border-border/70 bg-white/88">
                  <CardContent className="space-y-4 p-5 sm:p-7">
                    <div className="icon-orb h-14 w-14 text-primary">
                      <card.icon className="h-5 w-5" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="font-display text-[1.08rem] font-semibold text-primary sm:text-[1.22rem]">{card.title}</h3>
                      <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">{card.description}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="pb-14 sm:pb-20">
          <div className="app-shell grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="space-y-3">
              <p className="eyebrow-chip w-fit">How to build a stronger CV</p>
              <h2 className="font-display text-[1.85rem] font-semibold tracking-tight text-primary sm:text-4xl">
                A simple workflow for creating and refining your CV online.
              </h2>
              <p className="text-[0.95rem] leading-relaxed text-muted-foreground sm:text-base">
                This keeps the page relevant for people searching how to build a CV while also matching what the product actually helps them do.
              </p>
            </div>

            <div className="grid gap-3">
              {workflowSteps.map((step, index) => (
                <div key={step.title} className="surface-card px-4 py-4 sm:px-7">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                    <div className="font-display text-[2.15rem] font-semibold tracking-[-0.08em] text-secondary/35">
                      {String(index + 1).padStart(2, "0")}
                    </div>
                    <div className="space-y-1.5">
                      <h3 className="text-[1.02rem] font-bold text-primary">{step.title}</h3>
                      <p className="text-[0.9rem] leading-6 text-muted-foreground sm:text-base">{step.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="pb-16 sm:pb-24">
          <div className="app-shell">
            <div className="surface-card grid gap-6 px-5 py-6 sm:px-8 sm:py-8 lg:grid-cols-[1fr_auto] lg:items-center">
              <div className="space-y-3 sm:space-y-4">
                <p className="eyebrow-chip w-fit">Internal next step</p>
                <h2 className="font-display text-[1.9rem] font-semibold tracking-tight text-primary sm:text-4xl">
                  Start with the CV builder, then move into ATS checks and job tracking.
                </h2>
                <p className="max-w-3xl text-[0.95rem] leading-relaxed text-muted-foreground sm:text-base">
                  The strongest ranking pages also help users continue deeper into the product. Once they arrive here, we want them to discover the broader workflow naturally.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
                <Button asChild>
                  <Link href="/signup">Start free</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/pricing">Compare plans</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="pb-16 sm:pb-24">
          <div className="app-shell grid gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:gap-8">
            <div className="space-y-3 sm:space-y-4">
              <p className="eyebrow-chip w-fit">CV builder FAQ</p>
              <h2 className="font-display text-[1.9rem] font-semibold tracking-tight text-primary sm:text-4xl">
                Questions people ask before using an online CV builder.
              </h2>
            </div>

            <Accordion type="single" collapsible className="space-y-4">
              {faqItems.map((item, index) => (
                <AccordionItem key={item.question} value={`cv-builder-faq-${index}`} className="surface-card px-4 sm:px-6">
                  <AccordionTrigger className="py-4 text-left text-[0.95rem] font-bold text-primary hover:no-underline sm:py-6 sm:text-base">
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent className="pb-4 text-sm leading-relaxed text-muted-foreground sm:pb-6">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
