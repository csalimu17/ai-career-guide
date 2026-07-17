import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { PublicHeader } from "@/components/marketing/public-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { marketingHeaderItems } from "@/lib/marketing-nav";
import { absoluteUrl } from "@/lib/metadata";
import { siteConfig } from "@/lib/site";

type FeaturePoint = {
  title: string;
  description: string;
};

type FeatureFaq = {
  question: string;
  answer: string;
};

type FeatureLandingPageProps = {
  eyebrow: string;
  title: string;
  description: string;
  path: string;
  ctaLabel: string;
  secondaryCtaLabel?: string;
  secondaryCtaHref?: string;
  points: FeaturePoint[];
  workflow: FeaturePoint[];
  proof: string[];
  faqs: FeatureFaq[];
};

export function FeatureLandingPage({
  eyebrow,
  title,
  description,
  path,
  ctaLabel,
  secondaryCtaLabel = "Explore CV builder",
  secondaryCtaHref = "/cv-builder",
  points,
  workflow,
  proof,
  faqs,
}: FeatureLandingPageProps) {
  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: title,
      url: absoluteUrl(path),
      description,
      isPartOf: {
        "@type": "WebSite",
        name: siteConfig.name,
        url: siteConfig.url,
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: `${siteConfig.name} ${eyebrow}`,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      url: absoluteUrl(path),
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "GBP",
      },
      featureList: [...points.map((point) => point.title), ...workflow.map((step) => step.title)],
      description,
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
          name: eyebrow,
          item: absoluteUrl(path),
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen">
      <PublicHeader items={marketingHeaderItems} ctaHref="/signup" ctaLabel="Start free" />
      <main className="pb-24">
        <section className="relative overflow-hidden pb-16 pt-12 sm:pb-24 sm:pt-20">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(240,249,255,0.95)_0%,rgba(255,255,255,0.88)_42%,rgba(255,247,237,0.78)_100%)]" />
          <div className="app-shell relative space-y-8">
            <div className="mx-auto max-w-4xl space-y-6 text-center">
              <div className="eyebrow-chip mx-auto w-fit">{eyebrow}</div>
              <div className="space-y-4">
                <h1 className="font-display mx-auto max-w-5xl pb-[0.08em] text-[2.45rem] font-semibold leading-[1.05] tracking-tight text-primary sm:text-5xl lg:text-[4.8rem]">
                  {title}
                </h1>
                <p className="mx-auto max-w-3xl text-[1rem] leading-7 text-muted-foreground sm:text-[1.18rem]">
                  {description}
                </p>
              </div>
              <div className="grid gap-3 sm:flex sm:justify-center">
                <Button size="lg" asChild>
                  <Link href="/signup">
                    {ctaLabel}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href={secondaryCtaHref}>{secondaryCtaLabel}</Link>
                </Button>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {proof.map((item) => (
                <div key={item} className="rounded-[1.4rem] border border-white/70 bg-white/82 px-5 py-4 text-center shadow-sm backdrop-blur">
                  <p className="text-sm font-bold leading-6 text-primary">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="pb-16 sm:pb-24">
          <div className="app-shell space-y-8">
            <div className="max-w-3xl space-y-3">
              <p className="eyebrow-chip w-fit">Why it matters</p>
              <h2 className="font-display text-[1.9rem] font-semibold tracking-tight text-primary sm:text-4xl">
                Built into the same workspace as your CV, ATS checks, and applications.
              </h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {points.map((point) => (
                <Card key={point.title} className="border border-border/70 bg-white/88">
                  <CardContent className="space-y-3 p-5 sm:p-7">
                    <CheckCircle2 className="h-5 w-5 text-secondary" />
                    <h3 className="font-display text-[1.08rem] font-semibold text-primary sm:text-[1.22rem]">{point.title}</h3>
                    <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">{point.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="pb-16 sm:pb-24">
          <div className="app-shell grid gap-6 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
            <div className="space-y-3">
              <p className="eyebrow-chip w-fit">How it fits</p>
              <h2 className="font-display text-[1.9rem] font-semibold tracking-tight text-primary sm:text-4xl">
                A connected flow, not another disconnected tool.
              </h2>
              <p className="text-[0.95rem] leading-relaxed text-muted-foreground sm:text-base">
                Each feature is designed to support the next career action: improve the CV, target the right role, apply with confidence, then prepare for the conversation.
              </p>
            </div>
            <div className="grid gap-3">
              {workflow.map((step, index) => (
                <div key={step.title} className="surface-card px-4 py-4 sm:px-6">
                  <p className="text-[0.62rem] font-bold uppercase tracking-[0.2em] text-muted-foreground">Step {index + 1}</p>
                  <h3 className="mt-2 text-[1.04rem] font-bold text-primary">{step.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="pb-16 sm:pb-24">
          <div className="app-shell grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="space-y-3">
              <p className="eyebrow-chip w-fit">FAQ</p>
              <h2 className="font-display text-[1.9rem] font-semibold tracking-tight text-primary sm:text-4xl">
                Clear answers before you start.
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
      </main>
      <SiteFooter />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
    </div>
  );
}
