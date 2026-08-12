import Link from "next/link";
import { ArrowRight, BookOpen, Calendar, CheckCircle2, Clock, Compass, Search } from "lucide-react";
import { PublicHeader } from "@/components/marketing/public-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GUIDE_POSTS, type GuidePost } from "@/lib/guide-data";
import { marketingHeaderItems } from "@/lib/marketing-nav";
import { absoluteUrl, createMetadata } from "@/lib/metadata";

const guidesDescription =
  "Read premium guides on CV writing, ATS optimisation, CV templates, AI career assistants, job search, cover letters, interview prep, and application tracking.";

export const metadata = createMetadata({
  title: "Premium CV, ATS, Job Search & Interview Guides",
  description: guidesDescription,
  path: "/guides",
  keywords: [
    "cv guides",
    "resume guides",
    "how to write a cv",
    "ats cv checker guide",
    "cover letter guide",
    "interview prep guide",
    "job search strategy",
  ],
});

export const revalidate = 86400;

const featuredGuide = GUIDE_POSTS[0];
const guideCategories = Array.from(new Set(GUIDE_POSTS.map((guide) => guide.category)));

function GuideCard({ guide, compact = false }: { guide: GuidePost; compact?: boolean }) {
  return (
    <Link key={guide.slug} href={`/guides/${guide.slug}`} className="group block h-full">
      <article className="flex h-full flex-col surface-card p-5 relative overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-md sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <div className="eyebrow-chip text-[0.65rem] inline-flex">
            {guide.category}
          </div>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500">
            <Clock className="h-3.5 w-3.5" />
            {guide.readingTime}
          </span>
        </div>
        <h2 className="mt-4 font-display text-[1.35rem] font-semibold leading-tight tracking-tight text-slate-950 transition-colors group-hover:text-primary sm:text-2xl">
          {guide.title}
        </h2>
        <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-[0.96rem]">
          {guide.excerpt}
        </p>
        {!compact ? (
          <div className="mt-5 grid gap-2">
            {guide.takeaways.slice(0, 2).map((takeaway) => (
              <p key={takeaway} className="flex items-start gap-2 text-sm leading-5 text-slate-700">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" />
                {takeaway}
              </p>
            ))}
          </div>
        ) : null}
        <div className="mt-auto pt-5">
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-primary">
            Read guide
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </span>
        </div>
      </article>
    </Link>
  );
}

export default function GuidesPage() {
  const latestGuides = [...GUIDE_POSTS].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 6);
  const guidesJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${absoluteUrl("/guides")}#collection`,
        url: absoluteUrl("/guides"),
        name: "Premium CV, ATS, Job Search & Interview Guides",
        description: guidesDescription,
        isPartOf: { "@type": "WebSite", name: "AI Career Guide", url: absoluteUrl("/") },
        hasPart: GUIDE_POSTS.slice(0, 12).map((guide) => ({
          "@type": "Article",
          headline: guide.title,
          url: absoluteUrl(`/guides/${guide.slug}`),
          datePublished: guide.publishedAt,
          dateModified: guide.updatedAt,
          description: guide.excerpt,
          keywords: guide.keywords.join(", "),
        })),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
          { "@type": "ListItem", position: 2, name: "Guides", item: absoluteUrl("/guides") },
        ],
      },
    ],
  };

  return (
    <div className="min-h-screen bg-transparent relative overflow-hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(guidesJsonLd) }}
      />
      <div className="career-grid pointer-events-none" />
      <PublicHeader items={marketingHeaderItems} ctaHref="/signup" ctaLabel="Start free" />

      <main className="relative z-10 pb-24">
        <section className="relative overflow-hidden border-b border-slate-100/50 pb-14 pt-12 sm:pb-20 sm:pt-20">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(110,88,255,0.08),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(51,184,255,0.06),transparent_40%)]" />
          <div className="app-shell relative grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-end">
            <div className="space-y-6">
              <div className="eyebrow-chip w-fit">
                <BookOpen className="h-3.5 w-3.5 text-primary" />
                <span>Career Intelligence Library</span>
              </div>
              <div className="space-y-4">
                <h1 className="font-display max-w-4xl text-4xl font-semibold leading-[1.02] tracking-tight text-slate-950 sm:text-6xl lg:text-7xl">
                  Premium guides for building better applications.
                </h1>
                <p className="max-w-2xl text-lg leading-8 text-slate-600">
                  Clear, practical playbooks for CV writing, ATS checks, templates, AI assistance, job search, cover letters, and interview preparation.
                </p>
              </div>
              <div className="grid gap-3 sm:flex">
                <Button size="lg" asChild>
                  <Link href="/cv-builder">
                    Build your CV
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/ai-career-assistant">Ask the assistant</Link>
                </Button>
              </div>
            </div>

            <Link href={`/guides/${featuredGuide.slug}`} className="group surface-card p-5 relative overflow-hidden sm:p-7 block">
              <div className="flex items-center justify-between gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20 shadow-sm transition-all duration-300 group-hover:scale-110 group-hover:rotate-3">
                  <BookOpen className="h-5 w-5" />
                </div>
                <span className="text-xs font-bold uppercase tracking-[0.22em] text-slate-500">Featured playbook</span>
              </div>
              <h2 className="mt-6 font-display text-2xl font-semibold leading-tight tracking-tight text-slate-950 sm:text-4xl">
                {featuredGuide.title}
              </h2>
              <p className="mt-4 text-sm leading-6 text-slate-600 sm:text-base">{featuredGuide.excerpt}</p>
              <div className="mt-6 grid gap-2">
                {featuredGuide.takeaways.map((takeaway) => (
                  <p key={takeaway} className="flex items-start gap-2 text-sm leading-5 text-slate-700">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" />
                    {takeaway}
                  </p>
                ))}
              </div>
              <span className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-primary">
                Open featured guide
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          </div>
        </section>

        <section className="py-10 sm:py-14">
          <div className="app-shell grid gap-4 md:grid-cols-3">
            {[
              { icon: Search, label: "Search intent", value: "Guides built around real CV, ATS, and job-search questions." },
              { icon: Compass, label: "Actionable next steps", value: "Every guide connects advice to a practical workflow in the app." },
              { icon: Calendar, label: "Freshness", value: `${GUIDE_POSTS.length} guides updated for 2026 job searches.` },
            ].map((item) => (
              <div key={item.label} className="group surface-card p-5 relative overflow-hidden space-y-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md block">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-500/10 text-teal-600 border border-teal-500/20 shadow-sm transition-all duration-300 group-hover:scale-110 group-hover:rotate-3">
                  <item.icon className="h-5 w-5" />
                </div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">{item.label}</p>
                <p className="text-sm font-semibold leading-6 text-slate-950">{item.value}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="pb-16 sm:pb-20">
          <div className="app-shell space-y-6">
            <div className="max-w-3xl space-y-3">
              <div className="eyebrow-chip w-fit">Popular resources</div>
              <h2 className="font-display text-[1.9rem] font-semibold tracking-tight text-slate-950 sm:text-4xl">
                High-intent CV and application guides for UK job seekers.
              </h2>
            </div>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {[
                { label: "Cover letter examples", href: "/cover-letter-examples" },
                { label: "CV personal statement examples", href: "/cv-personal-statement-examples" },
                { label: "Career change CV", href: "/career-change-cv" },
                { label: "NHS CV template", href: "/nhs-cv-template" },
                { label: "Finance CV template", href: "/finance-cv-template" },
                { label: "Tech CV template", href: "/tech-cv-template" },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="surface-card group flex items-center justify-between gap-4 px-5 py-4 text-sm font-semibold text-slate-950 transition-colors hover:text-primary"
                >
                  {item.label}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="pb-16 sm:pb-24">
          <div className="app-shell space-y-10">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl space-y-3">
                <div className="eyebrow-chip w-fit">Latest playbooks</div>
                <h2 className="font-display text-[1.9rem] font-semibold tracking-tight text-slate-950 sm:text-4xl">
                  Start with the guides that unlock better applications fastest.
                </h2>
              </div>
              <p className="max-w-sm text-sm leading-6 text-slate-600">
                Each guide is designed to answer a specific search question and move the reader toward a clearer next step.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {latestGuides.map((guide) => (
                <GuideCard key={guide.slug} guide={guide} />
              ))}
            </div>
          </div>
        </section>

        <section className="pb-16 sm:pb-24">
          <div className="app-shell space-y-10">
            <div className="max-w-3xl space-y-3">
              <div className="eyebrow-chip w-fit">Browse by topic</div>
              <h2 className="font-display text-[1.9rem] font-semibold tracking-tight text-slate-950 sm:text-4xl">
                Find the exact playbook for the stage you are in.
              </h2>
            </div>

            <div className="space-y-10">
              {guideCategories.map((category) => {
                const guides = GUIDE_POSTS.filter((guide) => guide.category === category);
                return (
                  <div key={category} className="space-y-4">
                    <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-3">
                      <h3 className="font-display text-2xl font-semibold tracking-tight text-slate-950">{category}</h3>
                      <span className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
                        {guides.length} guide{guides.length === 1 ? "" : "s"}
                      </span>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                      {guides.map((guide) => (
                        <GuideCard key={guide.slug} guide={guide} compact />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
