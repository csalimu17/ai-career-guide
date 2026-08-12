import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Calendar, CheckCircle2, Clock, Sparkles, Target } from "lucide-react";
import { PublicHeader } from "@/components/marketing/public-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { marketingHeaderItems } from "@/lib/marketing-nav";
import { absoluteUrl, createMetadata } from "@/lib/metadata";
import { getGuideBySlug, GUIDE_POSTS } from "@/lib/guide-data";
import { siteConfig } from "@/lib/site";

export const revalidate = 86400;

export async function generateStaticParams() {
  return GUIDE_POSTS.map((guide) => ({
    slug: guide.slug,
  }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const guide = getGuideBySlug(slug);
  if (!guide) return {};

  return createMetadata({
    title: guide.title,
    description: guide.excerpt,
    path: `/guides/${slug}`,
    type: "article",
    keywords: guide.keywords,
  });
}

export default async function GuidePostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const guide = getGuideBySlug(slug);
  if (!guide) notFound();

  const relatedGuides = GUIDE_POSTS.filter((item) => item.slug !== guide.slug && item.category === guide.category).slice(0, 3);
  const fallbackRelated = GUIDE_POSTS.filter((item) => item.slug !== guide.slug && !relatedGuides.includes(item)).slice(0, 3 - relatedGuides.length);
  const combinedRelated = [...relatedGuides, ...fallbackRelated];

  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: guide.title,
      description: guide.excerpt,
      datePublished: guide.publishedAt,
      dateModified: guide.updatedAt,
      keywords: guide.keywords.join(", "),
      inLanguage: "en-GB",
      author: {
        "@type": "Organization",
        name: siteConfig.name,
        url: siteConfig.url,
      },
      publisher: {
        "@type": "Organization",
        name: siteConfig.name,
        logo: {
          "@type": "ImageObject",
          url: absoluteUrl(siteConfig.searchLogo),
        },
      },
      mainEntityOfPage: {
        "@type": "WebPage",
        "@id": absoluteUrl(`/guides/${guide.slug}`),
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
          name: "Guides",
          item: absoluteUrl("/guides"),
        },
        {
          "@type": "ListItem",
          position: 3,
          name: guide.title,
          item: absoluteUrl(`/guides/${guide.slug}`),
        },
      ],
    },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <div className="min-h-screen bg-transparent relative overflow-hidden">
        {/* Dotted mesh grid overlay matching landing page hero */}
        <div className="career-grid pointer-events-none" />
        <PublicHeader items={marketingHeaderItems} ctaHref="/signup" ctaLabel="Start free" />

        <main className="relative z-10 pb-24">
          <section className="relative overflow-hidden border-b border-slate-100/50 pb-12 pt-10 sm:pb-16 sm:pt-16">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(110,88,255,0.08),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(51,184,255,0.06),transparent_40%)]" />
            <div className="app-shell relative">
              <Link href="/guides" className="group inline-flex items-center text-sm font-semibold text-slate-500 transition-colors hover:text-primary">
                <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
                Back to guides
              </Link>

              <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
                <header className="space-y-6">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="eyebrow-chip text-[0.68rem] inline-flex">
                      {guide.category}
                    </div>
                    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500">
                      <Calendar className="h-4 w-4" />
                      Updated {guide.updatedAt}
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500">
                      <Clock className="h-4 w-4" />
                      {guide.readingTime}
                    </span>
                  </div>
                  <h1 className="font-display max-w-5xl text-4xl font-semibold leading-[1.05] tracking-tight text-slate-950 sm:text-6xl">
                    {guide.title}
                  </h1>
                  <p className="max-w-3xl text-lg leading-8 text-slate-600 sm:text-xl">
                    {guide.excerpt}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {guide.keywords.slice(0, 5).map((keyword) => (
                      <span key={keyword} className="rounded-full border border-slate-100 bg-slate-50/50 px-3 py-1.5 text-xs font-semibold text-slate-500">
                        {keyword}
                      </span>
                    ))}
                  </div>
                </header>

                <aside className="surface-card p-5 relative overflow-hidden">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20 shadow-sm transition-all duration-300 hover:scale-110">
                      <Sparkles className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Guide brief</p>
                      <p className="text-sm font-bold text-slate-950">{guide.audience}</p>
                    </div>
                  </div>
                  <div className="mt-5 grid gap-3">
                    {guide.takeaways.map((takeaway) => (
                      <p key={takeaway} className="flex items-start gap-2 text-sm leading-6 text-slate-700">
                        <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-teal-600" />
                        {takeaway}
                      </p>
                    ))}
                  </div>
                </aside>
              </div>
            </div>
          </section>

          <article className="app-shell grid gap-10 py-14 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start">
            <div
              className="prose prose-slate prose-lg max-w-none prose-headings:font-display prose-headings:font-semibold prose-headings:tracking-tight prose-headings:text-slate-950 prose-p:leading-8 prose-p:text-slate-600/90 prose-strong:text-slate-950 prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-li:leading-7 prose-li:text-slate-600/90 prose-blockquote:rounded-2xl prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:bg-primary/5 prose-blockquote:px-5 prose-blockquote:py-4 prose-blockquote:not-italic prose-blockquote:text-slate-900"
              dangerouslySetInnerHTML={{ __html: guide.content }}
            />

            <aside className="top-8 space-y-4 lg:sticky">
              <div className="surface-card p-5 relative overflow-hidden">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-500/10 text-teal-600 border border-teal-500/20 shadow-sm transition-all duration-300 hover:scale-110">
                  <Target className="h-5 w-5" />
                </div>
                <p className="mt-4 text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Next best action</p>
                <p className="mt-2 text-sm leading-6 text-slate-700">
                  Turn this advice into a cleaner CV, stronger ATS match, and more organised application workflow.
                </p>
                <div className="mt-5 grid gap-2">
                  <Button asChild>
                    <Link href="/cv-builder">
                      Open CV builder
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/ats-cv-checker">Run ATS check</Link>
                  </Button>
                </div>
              </div>
            </aside>
          </article>

          <section className="pb-16 sm:pb-24">
            <div className="app-shell">
              <div className="surface-card px-5 py-8 text-center sm:px-8 sm:py-12 relative overflow-hidden">
                <h2 className="font-display text-2xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                  Ready to apply the guide?
                </h2>
                <p className="mx-auto mt-3 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
                  Use the builder, assistant, ATS checker, templates, cover letters, job tracker, and interview prep tools together instead of managing the search across disconnected tabs.
                </p>
                <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
                  <Button size="lg" asChild>
                    <Link href="/signup">
                      Start free
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" asChild>
                    <Link href="/ai-career-assistant">Ask Dan for help</Link>
                  </Button>
                </div>
              </div>
            </div>
          </section>

          <section className="pb-16 sm:pb-24">
            <div className="app-shell space-y-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <div className="eyebrow-chip w-fit">Related guides</div>
                  <h2 className="mt-3 font-display text-2xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                    Keep building the next part of the workflow.
                  </h2>
                </div>
                <Link href="/guides" className="inline-flex items-center gap-2 text-sm font-semibold text-primary">
                  Browse all guides
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                {combinedRelated.map((item) => (
                  <Link
                    key={item.slug}
                    href={`/guides/${item.slug}`}
                    className="group surface-card p-5 relative overflow-hidden transition-all hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-md block"
                  >
                    <p className="text-xs font-bold uppercase tracking-widest text-primary">{item.category}</p>
                    <h3 className="mt-3 font-display text-lg font-semibold leading-tight tracking-tight text-slate-950 group-hover:text-primary transition-colors">{item.title}</h3>
                    <p className="mt-3 text-sm leading-6 text-slate-600">{item.excerpt}</p>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        </main>

        <SiteFooter />
      </div>
    </>
  );
}
