import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { PublicHeader } from "@/components/marketing/public-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { marketingHeaderItems } from "@/lib/marketing-nav";
import { absoluteUrl, createMetadata } from "@/lib/metadata";
import { siteConfig } from "@/lib/site";

const comparisonPages = [
  {
    name: "Zety Alternative",
    href: "/compare/zety-alternative",
    summary: "For job seekers comparing CV building, ATS checks, and UK-focused application workflows.",
  },
  {
    name: "Resume.io Alternative",
    href: "/compare/resume-io-alternative",
    summary: "For users weighing polished templates against a broader CV, ATS, and job search workspace.",
  },
  {
    name: "Rezi Alternative",
    href: "/compare/rezi-alternative",
    summary: "For people comparing AI resume optimisation with a full career execution platform.",
  },
  {
    name: "Kickresume Alternative",
    href: "/compare/kickresume-alternative",
    summary: "For users comparing resume/CV creation, cover letters, websites, and practical UK job-search tooling.",
  },
  {
    name: "Novoresume Alternative",
    href: "/compare/novoresume-alternative",
    summary: "For job seekers comparing premium CV templates with ATS checks and ongoing application support.",
  },
  {
    name: "Enhancv Alternative",
    href: "/compare/enhancv-alternative",
    summary: "For candidates comparing visual resume builders with a UK CV and ATS-first career workspace.",
  },
];

export const metadata = createMetadata({
  title: "Compare AI Career Guide with CV Builder Alternatives",
  description:
    "Compare AI Career Guide with Zety, Resume.io, Rezi, Kickresume, Novoresume, and Enhancv alternatives for UK CV building and ATS checks.",
  path: "/compare",
  keywords: ["CV builder alternatives", "AI resume builder comparison", "Zety alternative", "Resume.io alternative", "Rezi alternative"],
});

export const revalidate = 86400;

export default function ComparePage() {
  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "Compare AI Career Guide with CV Builder Alternatives",
      description:
        "Comparison hub for AI Career Guide alternatives and competitor pages.",
      url: absoluteUrl("/compare"),
      isPartOf: {
        "@type": "WebSite",
        name: siteConfig.name,
        url: siteConfig.url,
      },
      mainEntity: {
        "@type": "ItemList",
        itemListElement: comparisonPages.map((page, index) => ({
          "@type": "ListItem",
          position: index + 1,
          url: absoluteUrl(page.href),
          name: page.name,
        })),
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
          name: "Compare",
          item: absoluteUrl("/compare"),
        },
      ],
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
                CV Builder Comparisons
              </Badge>
              <div className="space-y-4">
                <h1 className="font-display mx-auto max-w-5xl pb-[0.08em] text-[2.35rem] font-semibold leading-[1.05] tracking-tight text-primary sm:text-5xl lg:text-[4.6rem]">
                  Compare AI Career Guide with popular CV builder alternatives.
                </h1>
                <p className="mx-auto max-w-3xl text-[1rem] leading-7 text-muted-foreground sm:text-[1.18rem]">
                  Use these comparison pages to evaluate CV builders, AI resume tools, ATS checkers, and broader career platforms before choosing your job-search workflow.
                </p>
              </div>
              <div className="grid gap-3 sm:flex sm:justify-center">
                <Button size="lg" asChild>
                  <Link href="/signup">
                    Start free
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/pricing">See pricing</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="pb-14 sm:pb-20">
          <div className="app-shell grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {comparisonPages.map((page) => (
              <Card key={page.href} className="border border-border/70 bg-white/90">
                <CardContent className="flex h-full flex-col gap-4 p-5 sm:p-6">
                  <CheckCircle2 className="h-5 w-5 text-secondary" />
                  <div className="space-y-2">
                    <h2 className="font-display text-[1.22rem] font-semibold text-primary">
                      {page.name}
                    </h2>
                    <p className="text-sm leading-6 text-muted-foreground">{page.summary}</p>
                  </div>
                  <Link href={page.href} className="mt-auto inline-flex items-center gap-2 text-sm font-bold text-primary hover:text-secondary">
                    Read comparison
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>

      <SiteFooter />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
    </div>
  );
}
