import Link from "next/link";
import { ArrowRight, CheckCircle2, MinusCircle } from "lucide-react";
import { PublicHeader } from "@/components/marketing/public-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { marketingHeaderItems } from "@/lib/marketing-nav";
import { absoluteUrl } from "@/lib/metadata";
import { siteConfig } from "@/lib/site";

type ComparisonPoint = {
  title: string;
  aiCareerGuide: string;
  competitor: string;
};

type ComparisonFaq = {
  question: string;
  answer: string;
};

type ComparisonLandingPageProps = {
  path: string;
  competitorName: string;
  title: string;
  description: string;
  positioning: string[];
  points: ComparisonPoint[];
  faqs: ComparisonFaq[];
};

export function ComparisonLandingPage({
  path,
  competitorName,
  title,
  description,
  positioning,
  points,
  faqs,
}: ComparisonLandingPageProps) {
  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: title,
      description,
      url: absoluteUrl(path),
      inLanguage: "en-GB",
      isPartOf: {
        "@type": "WebSite",
        name: siteConfig.name,
        url: siteConfig.url,
      },
      about: [
        {
          "@type": "SoftwareApplication",
          name: siteConfig.name,
          applicationCategory: "BusinessApplication",
        },
        {
          "@type": "SoftwareApplication",
          name: competitorName,
          applicationCategory: "BusinessApplication",
        },
      ],
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
          name: `${competitorName} Alternative`,
          item: absoluteUrl(path),
        },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqs.map((item) => ({
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
    <div className="min-h-screen bg-[#FDFDFC]">
      <PublicHeader items={marketingHeaderItems} ctaHref="/signup" ctaLabel="Start free" />

      <main className="pb-24">
        <section className="relative overflow-hidden pb-14 pt-12 sm:pb-20 sm:pt-20">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(240,249,255,0.96)_0%,rgba(255,255,255,0.94)_48%,rgba(255,247,237,0.76)_100%)]" />
          <div className="app-shell relative space-y-8">
            <div className="mx-auto max-w-4xl space-y-6 text-center">
              <Badge className="border-none bg-primary/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-primary">
                Alternative comparison
              </Badge>
              <div className="space-y-4">
                <h1 className="font-display mx-auto max-w-5xl pb-[0.08em] text-[2.35rem] font-semibold leading-[1.05] tracking-tight text-primary sm:text-5xl lg:text-[4.6rem]">
                  {title}
                </h1>
                <p className="mx-auto max-w-3xl text-[1rem] leading-7 text-muted-foreground sm:text-[1.18rem]">
                  {description}
                </p>
              </div>
              <div className="grid gap-3 sm:flex sm:justify-center">
                <Button size="lg" asChild>
                  <Link href="/signup">
                    Try AI Career Guide
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/cv-builder">Explore CV builder</Link>
                </Button>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              {positioning.map((item) => (
                <div key={item} className="rounded-[1.25rem] border border-white/80 bg-white/86 px-5 py-4 text-center shadow-sm backdrop-blur">
                  <p className="text-sm font-bold leading-6 text-primary">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="pb-14 sm:pb-20">
          <div className="app-shell space-y-6">
            <div className="max-w-3xl space-y-3">
              <p className="eyebrow-chip w-fit">Feature comparison</p>
              <h2 className="font-display text-[1.9rem] font-semibold tracking-tight text-primary sm:text-4xl">
                Where AI Career Guide is designed differently.
              </h2>
              <p className="text-sm leading-6 text-muted-foreground sm:text-base">
                This comparison is a practical buying guide for job seekers choosing between specialist CV builders, AI resume tools, and broader career platforms.
              </p>
            </div>
            <div className="grid gap-4">
              {points.map((point) => (
                <Card key={point.title} className="border border-border/70 bg-white/90">
                  <CardContent className="grid gap-4 p-5 sm:p-6 lg:grid-cols-[0.75fr_1fr_1fr] lg:items-start">
                    <h3 className="font-display text-[1.08rem] font-semibold text-primary">
                      {point.title}
                    </h3>
                    <div className="rounded-[1rem] border border-secondary/15 bg-secondary/5 p-4">
                      <div className="flex items-center gap-2 text-sm font-bold text-primary">
                        <CheckCircle2 className="h-4 w-4 text-secondary" />
                        AI Career Guide
                      </div>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">{point.aiCareerGuide}</p>
                    </div>
                    <div className="rounded-[1rem] border border-border/80 bg-slate-50/70 p-4">
                      <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                        <MinusCircle className="h-4 w-4 text-slate-400" />
                        {competitorName}
                      </div>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">{point.competitor}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="pb-14 sm:pb-20">
          <div className="app-shell grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
            <div className="space-y-3">
              <p className="eyebrow-chip w-fit">FAQ</p>
              <h2 className="font-display text-[1.9rem] font-semibold tracking-tight text-primary sm:text-4xl">
                Choosing a {competitorName} alternative.
              </h2>
            </div>
            <div className="grid gap-3">
              {faqs.map((item) => (
                <div key={item.question} className="surface-card px-4 py-4 sm:px-6">
                  <h3 className="text-[0.98rem] font-bold text-primary">{item.question}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="app-shell">
          <div className="brand-gradient-bg rounded-[2rem] px-6 py-8 text-white sm:px-10 sm:py-10">
            <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
              <div className="space-y-2">
                <h2 className="font-display text-2xl font-semibold sm:text-3xl">
                  Try the full CV, ATS, cover letter, and job search workflow.
                </h2>
                <p className="max-w-2xl text-sm leading-6 text-white/82 sm:text-base">
                  AI Career Guide is built for people who want more than a document builder: create the CV, check role fit, write the application, and keep the search moving.
                </p>
              </div>
              <Button asChild variant="secondary">
                <Link href="/signup?intent=create-cv">Build My CV Free</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
    </div>
  );
}
