import Link from "next/link";
import { ArrowRight, CheckCircle2, FileSearch, ListChecks, ScanSearch, Sparkles, Target, Workflow } from "lucide-react";
import { PublicHeader } from "@/components/marketing/public-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { marketingHeaderItems } from "@/lib/marketing-nav";
import { absoluteUrl, createMetadata } from "@/lib/metadata";
import { siteConfig } from "@/lib/site";

const checkerCards = [
  {
    icon: ScanSearch,
    title: "Scan your CV against a real role",
    description:
      "Upload or build your CV, then compare it to a live job description to reveal alignment gaps before you apply.",
  },
  {
    icon: ListChecks,
    title: "See missing keywords and weak sections",
    description:
      "Spot where experience, skills, and summary wording are underperforming so you can make targeted edits quickly.",
  },
  {
    icon: Sparkles,
    title: "Use AI to improve weak bullets",
    description:
      "Strengthen experience blocks with role-aware suggestions instead of guessing how to rewrite everything manually.",
  },
  {
    icon: Workflow,
    title: "Turn the scan into a better application flow",
    description:
      "Move from ATS feedback into editing, template switching, and job tracking without breaking your momentum.",
  },
];

const faqItems = [
  {
    question: "What does an ATS CV checker do?",
    answer:
      "An ATS CV checker compares your CV to a job description and highlights gaps in keywords, relevance, structure, and section quality that may affect screening performance.",
  },
  {
    question: "Can the checker help me improve my CV after the scan?",
    answer:
      "Yes. AI Career Guide combines ATS analysis with editing tools and AI writing help so you can act on the feedback immediately.",
  },
  {
    question: "Does this work for resumes as well as CVs?",
    answer:
      "Yes. The ATS checker supports both CV and resume workflows, so you can use the same scan-and-improve process for either document style.",
  },
  {
    question: "Can I use the ATS checker with a CV I already have?",
    answer:
      "Yes. You can upload an existing CV, run the checker, and then improve the document inside the same platform.",
  },
  {
    question: "Can I start with a free ATS checker?",
    answer:
      "Yes. AI Career Guide includes a free ATS checker entry point so you can scan your CV, review gaps, and decide later if you need more volume or premium features.",
  },
];

export const metadata = createMetadata({
  title: "Free ATS CV Checker",
  description:
    "Check your CV against real job descriptions, find missing keywords, improve weak bullets, and strengthen ATS performance with one free AI-powered ATS CV checker.",
  path: "/ats-cv-checker",
  keywords: [
    "ATS CV checker",
    "free ATS checker",
    "free ATS CV checker",
    "ATS resume checker",
    "CV checker",
    "resume checker",
    "ATS CV scan",
    "CV keyword checker",
    "resume keyword checker",
    "job description CV checker",
  ],
});

export const revalidate = 86400;

export default function AtsCvCheckerPage() {
  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: "ATS CV Checker",
      url: absoluteUrl("/ats-cv-checker"),
      description:
        "ATS CV checker page for scanning CVs against real job descriptions and improving ATS performance inside AI Career Guide.",
      isPartOf: {
        "@type": "WebSite",
        name: siteConfig.name,
        url: siteConfig.url,
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: `${siteConfig.name} ATS CV Checker`,
      applicationCategory: "BusinessApplication",
      applicationSubCategory: "ATS CV Checker",
      operatingSystem: "Web",
      url: absoluteUrl("/ats-cv-checker"),
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "GBP",
      },
      featureList: [
        "ATS CV checker",
        "ATS resume checker",
        "Job description keyword analysis",
        "AI bullet suggestions",
        "Resume tailoring",
        "Application tracking",
      ],
      description:
        "Check CVs and resumes against job descriptions, identify missing keywords, improve weak sections, and act on ATS feedback inside one workflow.",
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
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: absoluteUrl("/"),
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "ATS CV Checker",
          item: absoluteUrl("/ats-cv-checker"),
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <PublicHeader items={marketingHeaderItems} ctaHref="/signup?intent=ats-check" ctaLabel="Check My CV" />

      <main className="pb-24">
        <section className="relative overflow-hidden pb-16 pt-12 sm:pb-24 sm:pt-20">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(51,184,255,0.15),transparent_30%),radial-gradient(circle_at_78%_18%,rgba(124,99,255,0.14),transparent_25%),radial-gradient(circle_at_82%_82%,rgba(255,159,110,0.13),transparent_24%)]" />
          <div className="app-shell relative grid gap-8 lg:grid-cols-[1.02fr_0.98fr] lg:items-center">
            <div className="space-y-6">
              <div className="eyebrow-chip w-fit">Free ATS CV Checker</div>
              <div className="sr-only">
                Free ATS checker, free ATS CV checker, ATS resume checker, CV keyword checker, resume keyword checker, and job description CV scan.
              </div>
              <div className="space-y-4">
                <h1 className="headline-gradient-vivid font-display max-w-4xl pb-[0.08em] text-[2.35rem] font-semibold leading-[1.15] tracking-[-0.07em] sm:text-5xl lg:text-[4.35rem]">
                  <span className="block">Check your CV</span>
                  <span className="block">for ATS gaps</span>
                  <span className="block">before you apply.</span>
                </h1>
                <p className="max-w-2xl text-[1rem] leading-7 text-muted-foreground sm:text-[1.15rem]">
                  AI Career Guide helps you compare your CV to real job descriptions, find missing keywords, improve weak sections, and turn free ATS feedback into a stronger application.
                </p>
              </div>

              <div className="grid gap-3 sm:flex sm:flex-row">
                <Button size="lg" asChild>
                  <Link href="/signup">
                    Check My CV
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/cv-builder">View CV Builder</Link>
                </Button>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  { label: "Free ATS scan", value: "Match job-specific wording" },
                  { label: "Section insight", value: "Find weak summary and bullets" },
                  { label: "Fast action", value: "Edit and improve in one flow" },
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
                    <p className="text-[0.65rem] font-bold uppercase tracking-[0.22em] text-muted-foreground">ATS Checker Snapshot</p>
                    <h2 className="mt-2 font-display text-[1.4rem] font-semibold text-primary sm:text-[1.7rem]">Know what to fix before submission.</h2>
                  </div>
                  <div className="icon-orb h-12 w-12 shrink-0 text-primary">
                    <FileSearch className="h-5 w-5" />
                  </div>
                </div>

                <div className="mt-5 grid gap-3">
                  {[
                    "Compare your CV against a real vacancy",
                    "Find missing keywords and underpowered experience bullets",
                    "Improve weak sections with AI writing support",
                    "Move straight into editing and rechecking without leaving the workflow",
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
              <p className="eyebrow-chip w-fit">What this checker helps you catch</p>
              <h2 className="font-display text-[1.9rem] font-semibold tracking-tight text-primary sm:text-4xl">
                Stronger ATS performance starts with clearer evidence and better alignment.
              </h2>
              <p className="text-[0.95rem] leading-relaxed text-muted-foreground sm:text-base">
                Most ATS problems are not about gaming the system. They are about relevance, clarity, and whether your CV reflects the role closely enough to pass initial screening.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {checkerCards.map((card) => (
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

        <section className="pb-16 sm:pb-24">
          <div className="app-shell">
            <div className="surface-card grid gap-6 px-5 py-6 sm:px-8 sm:py-8 lg:grid-cols-[1fr_auto] lg:items-center">
              <div className="space-y-3 sm:space-y-4">
                <p className="eyebrow-chip w-fit">Explore related pages</p>
                <h2 className="font-display text-[1.9rem] font-semibold tracking-tight text-primary sm:text-4xl">
                  Build, check, and tailor inside one connected search cluster.
                </h2>
                <p className="max-w-3xl text-[0.95rem] leading-relaxed text-muted-foreground sm:text-base">
                  AI Career Guide keeps your tools connected: move seamlessly from ATS scans directly into the CV editor and builder, instead of bouncing between isolated, disconnected apps.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
                <Button asChild>
                  <Link href="/cv-builder">View CV builder</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/signup?intent=create-cv">Build My CV Free</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="pb-16 sm:pb-24">
          <div className="app-shell grid gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:gap-8">
            <div className="space-y-3 sm:space-y-4">
              <p className="eyebrow-chip w-fit">ATS CV checker FAQ</p>
              <h2 className="font-display text-[1.9rem] font-semibold tracking-tight text-primary sm:text-4xl">
                Questions people ask before using an ATS CV checker.
              </h2>
            </div>

            <Accordion type="single" collapsible className="space-y-4">
              {faqItems.map((item, index) => (
                <AccordionItem key={item.question} value={`ats-checker-faq-${index}`} className="surface-card px-4 sm:px-6">
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
