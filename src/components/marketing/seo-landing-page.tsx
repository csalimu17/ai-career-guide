import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { PublicHeader } from "@/components/marketing/public-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { marketingHeaderItems } from "@/lib/marketing-nav";
import { absoluteUrl } from "@/lib/metadata";
import { siteConfig } from "@/lib/site";

type SeoSection = {
  title: string;
  body: string;
  bullets?: string[];
};

type SeoFaq = {
  question: string;
  answer: string;
};

type SeoRelatedLink = {
  label: string;
  href: string;
  description?: string;
};

type SeoLandingPageProps = {
  path: string;
  eyebrow: string;
  title: string;
  description: string;
  proof: string[];
  sections: SeoSection[];
  examples?: SeoSection[];
  faqs: SeoFaq[];
  primaryCtaLabel?: string;
  secondaryCtaLabel?: string;
  secondaryCtaHref?: string;
  relatedLinks?: SeoRelatedLink[];
};

export function SeoLandingPage({
  path,
  eyebrow,
  title,
  description,
  proof,
  sections,
  examples = [],
  faqs,
  primaryCtaLabel = "Build your CV",
  secondaryCtaLabel = "Check ATS fit",
  secondaryCtaHref = "/ats-cv-checker",
  relatedLinks = [],
}: SeoLandingPageProps) {
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
          name: title,
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
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(240,249,255,0.96)_0%,rgba(255,255,255,0.92)_46%,rgba(255,247,237,0.78)_100%)]" />
          <div className="app-shell relative space-y-8">
            <div className="mx-auto max-w-4xl space-y-6 text-center">
              <Badge className="border-none bg-primary/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-primary">
                {eyebrow}
              </Badge>
              <div className="space-y-4">
                <h1 className="font-display mx-auto max-w-5xl pb-[0.08em] text-[2.4rem] font-semibold leading-[1.03] tracking-tight text-primary sm:text-5xl lg:text-[4.8rem]">
                  {title}
                </h1>
                <p className="mx-auto max-w-3xl text-[1rem] leading-7 text-muted-foreground sm:text-[1.18rem]">
                  {description}
                </p>
              </div>
              <div className="grid gap-3 sm:flex sm:justify-center">
                <Button size="lg" asChild>
                  <Link href="/signup">
                    {primaryCtaLabel}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href={secondaryCtaHref}>{secondaryCtaLabel}</Link>
                </Button>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              {proof.map((item) => (
                <div key={item} className="rounded-[1.25rem] border border-white/80 bg-white/86 px-5 py-4 text-center shadow-sm backdrop-blur">
                  <p className="text-sm font-bold leading-6 text-primary">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="pb-14 sm:pb-20">
          <div className="app-shell grid gap-4 md:grid-cols-3">
            {sections.map((section) => (
              <Card key={section.title} className="border border-border/70 bg-white/90">
                <CardContent className="space-y-4 p-5 sm:p-7">
                  <CheckCircle2 className="h-5 w-5 text-secondary" />
                  <h2 className="font-display text-[1.2rem] font-semibold leading-tight text-primary">
                    {section.title}
                  </h2>
                  <p className="text-sm leading-6 text-muted-foreground">{section.body}</p>
                  {section.bullets?.length ? (
                    <ul className="space-y-2 text-sm leading-6 text-foreground/82">
                      {section.bullets.map((bullet) => (
                        <li key={bullet} className="flex gap-2">
                          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-secondary" />
                          <span>{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {examples.length ? (
          <section className="pb-14 sm:pb-20">
            <div className="app-shell space-y-6">
              <div className="max-w-3xl space-y-3">
                <p className="eyebrow-chip w-fit">Examples</p>
                <h2 className="font-display text-[1.9rem] font-semibold tracking-tight text-primary sm:text-4xl">
                  Copy the structure, then tailor it to the role.
                </h2>
              </div>
              <div className="grid gap-4 lg:grid-cols-3">
                {examples.map((example) => (
                  <article key={example.title} className="surface-card px-5 py-5 sm:px-6">
                    <h3 className="text-[1.05rem] font-bold text-primary">{example.title}</h3>
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">{example.body}</p>
                    {example.bullets?.length ? (
                      <ul className="mt-4 space-y-2 text-sm leading-6 text-foreground/82">
                        {example.bullets.map((bullet) => (
                          <li key={bullet} className="flex gap-2">
                            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/70" />
                            <span>{bullet}</span>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </article>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {relatedLinks.length ? (
          <section className="pb-14 sm:pb-20">
            <div className="app-shell space-y-6">
              <div className="max-w-3xl space-y-3">
                <p className="eyebrow-chip w-fit">Related resources</p>
                <h2 className="font-display text-[1.9rem] font-semibold tracking-tight text-primary sm:text-4xl">
                  Keep building from the closest example.
                </h2>
              </div>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {relatedLinks.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="surface-card group flex h-full flex-col justify-between gap-4 px-5 py-5 transition-colors hover:text-secondary"
                  >
                    <span className="text-[1rem] font-bold leading-6 text-primary transition-colors group-hover:text-secondary">
                      {item.label}
                    </span>
                    {item.description ? (
                      <span className="text-sm leading-6 text-muted-foreground">{item.description}</span>
                    ) : null}
                    <span className="inline-flex items-center gap-2 text-sm font-bold text-primary">
                      Open example
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        <section className="pb-14 sm:pb-20">
          <div className="app-shell grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
            <div className="space-y-3">
              <p className="eyebrow-chip w-fit">FAQ</p>
              <h2 className="font-display text-[1.9rem] font-semibold tracking-tight text-primary sm:text-4xl">
                Quick answers for UK CVs.
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
                  Turn the guidance into an ATS-friendly CV.
                </h2>
                <p className="max-w-2xl text-sm leading-6 text-white/82 sm:text-base">
                  Build your CV, switch templates, check ATS alignment, and generate application materials from the same workspace.
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
