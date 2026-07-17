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
      <div className="min-h-screen bg-[#FDFDFC]">
        <PublicHeader items={marketingHeaderItems} ctaHref="/signup" ctaLabel="Start free" />

        <main className="pb-24">
          <section className="relative overflow-hidden border-b border-border/50 pb-12 pt-10 sm:pb-16 sm:pt-16">
            <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(239,246,255,0.96)_0%,rgba(255,255,255,0.92)_48%,rgba(255,247,237,0.82)_100%)]" />
            <div className="app-shell relative">
              <Link href="/guides" className="group inline-flex items-center text-sm font-bold text-muted-foreground transition-colors hover:text-primary">
                <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
                Back to guides
              </Link>

              <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
                <header className="space-y-6">
                  <div className="flex flex-wrap items-center gap-3">
                    <Badge className="border-none bg-primary/10 px-4 py-1 text-[0.68rem] font-bold uppercase tracking-[0.2em] text-primary">
                      {guide.category}
                    </Badge>
                    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      Updated {guide.updatedAt}
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      {guide.readingTime}
                    </span>
                  </div>
                  <h1 className="font-display max-w-5xl text-4xl font-semibold leading-[1.05] tracking-tight text-primary sm:text-6xl">
                    {guide.title}
                  </h1>
                  <p className="max-w-3xl text-lg leading-8 text-muted-foreground sm:text-xl">
                    {guide.excerpt}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {guide.keywords.slice(0, 5).map((keyword) => (
                      <span key={keyword} className="rounded-full border border-border/70 bg-white/76 px-3 py-1.5 text-xs font-semibold text-muted-foreground">
                        {keyword}
                      </span>
                    ))}
                  </div>
                </header>

                <aside className="rounded-[1.6rem] border border-white/80 bg-white/86 p-5 shadow-[0_28px_70px_-55px_rgba(15,23,42,0.45)] backdrop-blur">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-white">
                      <Sparkles className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Guide brief</p>
                      <p className="text-sm font-bold text-primary">{guide.audience}</p>
                    </div>
                  </div>
                  <div className="mt-5 grid gap-3">
                    {guide.takeaways.map((takeaway) => (
                      <p key={takeaway} className="flex items-start gap-2 text-sm leading-6 text-primary/84">
                        <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-secondary" />
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
              className="prose prose-slate prose-lg max-w-none prose-headings:font-display prose-headings:font-semibold prose-headings:tracking-tight prose-headings:text-primary prose-p:leading-8 prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-li:leading-7 prose-blockquote:rounded-2xl prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:bg-primary/5 prose-blockquote:px-5 prose-blockquote:py-4 prose-blockquote:not-italic prose-blockquote:text-primary"
              dangerouslySetInnerHTML={{ __html: guide.content }}
            />

            <aside className="top-8 space-y-4 lg:sticky">
              <div className="rounded-[1.4rem] border border-border/70 bg-white/90 p-5 shadow-sm">
                <Target className="h-5 w-5 text-secondary" />
                <p className="mt-4 text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Next best action</p>
                <p className="mt-2 text-sm leading-6 text-primary">
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
              <div className="rounded-[1.8rem] border border-primary/15 bg-primary/5 px-5 py-8 text-center sm:px-8 sm:py-12">
                <h2 className="font-display text-2xl font-bold tracking-tight text-primary sm:text-4xl">
                  Ready to apply the guide?
                </h2>
                <p className="mx-auto mt-3 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
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
                  <p className="eyebrow-chip w-fit">Related guides</p>
                  <h2 className="mt-3 font-display text-2xl font-semibold tracking-tight text-primary sm:text-4xl">
                    Keep building the next part of the workflow.
                  </h2>
                </div>
                <Link href="/guides" className="inline-flex items-center gap-2 text-sm font-bold text-primary">
                  Browse all guides
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                {combinedRelated.map((item) => (
                  <Link
                    key={item.slug}
                    href={`/guides/${item.slug}`}
                    className="group rounded-[1.4rem] border border-border/70 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-md"
                  >
                    <p className="text-xs font-bold uppercase tracking-widest text-primary">{item.category}</p>
                    <h3 className="mt-3 font-display text-lg font-semibold leading-tight tracking-tight text-primary group-hover:text-secondary">{item.title}</h3>
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">{item.excerpt}</p>
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
