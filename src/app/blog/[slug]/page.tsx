import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Calendar, CheckCircle2, ChevronRight, Clock, Sparkles, Target, Wand2 } from "lucide-react";
import { PublicHeader } from "@/components/marketing/public-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import {
  BLOG_POSTS,
  getPostAudience,
  getPostBySlug,
  getPostDateIso,
  getPostKeywords,
  getPostTakeaways,
  getPostUpdatedIso,
} from "@/lib/blog-data";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { marketingHeaderItems } from "@/lib/marketing-nav";
import { absoluteUrl, createMetadata } from "@/lib/metadata";
import { BlogAtsWidget } from "@/components/marketing/blog-ats-widget";
import { siteConfig } from "@/lib/site";

export const revalidate = 86400;

export async function generateStaticParams() {
  return BLOG_POSTS.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};

  return createMetadata({
    title: post.title,
    description: post.excerpt,
    path: `/blog/${slug}`,
    image: post.mainImage,
    type: "article",
    keywords: getPostKeywords(post),
  });
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const takeaways = getPostTakeaways(post);
  const relatedSameCategory = BLOG_POSTS.filter((p) => p.slug !== post.slug && p.category === post.category).slice(0, 3);
  const fallbackRelated = BLOG_POSTS.filter((p) => p.slug !== post.slug && !relatedSameCategory.includes(p)).slice(0, 3 - relatedSameCategory.length);
  const relatedPosts = [...relatedSameCategory, ...fallbackRelated];

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: post.title,
      description: post.excerpt,
      image: absoluteUrl(post.mainImage),
      datePublished: getPostDateIso(post),
      dateModified: getPostUpdatedIso(post),
      keywords: getPostKeywords(post).join(", "),
      inLanguage: "en-GB",
      author: {
        "@type": "Person",
        name: post.author.name,
        jobTitle: post.author.role,
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
        "@id": absoluteUrl(`/blog/${slug}`),
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
          name: "Blog",
          item: absoluteUrl("/blog"),
        },
        {
          "@type": "ListItem",
          position: 3,
          name: post.title,
          item: absoluteUrl(`/blog/${slug}`),
        },
      ],
    },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="min-h-screen bg-[#FDFDFC]">
        <PublicHeader items={marketingHeaderItems} ctaHref="/signup" ctaLabel="Start free" />

        <main className="pb-24">
          <section className="relative overflow-hidden border-b border-border/50 pb-12 pt-10 sm:pb-16 sm:pt-16">
            <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(239,246,255,0.96)_0%,rgba(255,255,255,0.92)_48%,rgba(255,247,237,0.82)_100%)]" />
            <div className="app-shell relative">
              <Link href="/blog" className="group inline-flex items-center text-sm font-bold text-muted-foreground transition-colors hover:text-primary">
                <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
                Back to blog
              </Link>

              <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
                <header className="space-y-6">
                  <div className="flex flex-wrap items-center gap-3">
                    <Badge className="border-none bg-primary/10 px-4 py-1 text-[0.68rem] font-bold uppercase tracking-[0.2em] text-primary">
                      {post.category}
                    </Badge>
                    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      Updated {post.updatedAt || post.publishedAt}
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      {post.readingTime}
                    </span>
                  </div>
                  <h1 className="font-display max-w-5xl text-4xl font-semibold leading-[1.05] tracking-tight text-primary sm:text-6xl">
                    {post.title}
                  </h1>
                  <p className="max-w-3xl text-lg leading-8 text-muted-foreground sm:text-xl">
                    {post.excerpt}
                  </p>
                  <div className="flex items-center gap-4 border-y border-border/50 py-5">
                    <div className="h-12 w-12 overflow-hidden rounded-full border border-border/70 bg-white">
                      <Image src={post.author.image} alt={post.author.name} width={48} height={48} unoptimized />
                    </div>
                    <div>
                      <p className="font-bold text-primary">{post.author.name}</p>
                      <p className="text-sm text-muted-foreground">{post.author.role}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {getPostKeywords(post).slice(0, 5).map((keyword) => (
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
                      <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">What you will learn</p>
                      <p className="text-sm font-bold text-primary">{getPostAudience(post)}</p>
                    </div>
                  </div>
                  <div className="mt-5 grid gap-3">
                    {takeaways.map((takeaway) => (
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

          <div className="app-shell py-10 sm:py-14">
            <div className="relative aspect-[16/8] w-full overflow-hidden rounded-[1.8rem] border border-border/70 bg-muted shadow-[0_30px_90px_-65px_rgba(15,23,42,0.55)]">
              <Image
                src={post.mainImage}
                alt={post.title}
                fill
                sizes="(max-width: 1024px) 100vw, 84vw"
                className="object-cover"
                priority
              />
            </div>
          </div>

          <article className="app-shell grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
            <div className="space-y-12">
              <div
                className="prose prose-slate prose-lg max-w-none prose-headings:font-display prose-headings:font-semibold prose-headings:tracking-tight prose-headings:text-primary prose-p:leading-8 prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-li:leading-7 prose-img:rounded-3xl prose-blockquote:rounded-2xl prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:bg-primary/5 prose-blockquote:px-5 prose-blockquote:py-4 prose-blockquote:not-italic prose-blockquote:text-primary prose-table:text-sm"
                dangerouslySetInnerHTML={{ __html: post.content }}
              />

              <div className="overflow-hidden rounded-[1.8rem] border border-primary/20 bg-primary/5 p-6 text-center sm:p-10">
                <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-white">
                  <Wand2 className="h-6 w-6" />
                </div>
                <h2 className="font-display text-2xl font-bold tracking-tight text-primary sm:text-4xl">
                  Turn this insight into a stronger application.
                </h2>
                <p className="mx-auto mt-3 max-w-2xl text-base leading-7 text-muted-foreground">
                  Use AI Career Guide to build the CV, run the ATS check, generate the cover letter, track the role, and prepare for the interview in one workspace.
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

            <aside className="top-8 hidden space-y-5 lg:sticky lg:block">
              <div className="rounded-[1.4rem] border border-border/70 bg-white/90 p-5 shadow-sm">
                <Target className="h-5 w-5 text-secondary" />
                <p className="mt-4 text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Recommended next step</p>
                <p className="mt-2 text-sm leading-6 text-primary">
                  Check whether your current CV matches the role you are targeting before you send the next application.
                </p>
                <Button className="mt-5 w-full" asChild>
                  <Link href="/ats-cv-checker">Run ATS check</Link>
                </Button>
              </div>
              <BlogAtsWidget />
            </aside>
          </article>

          <section className="app-shell mt-20 border-t border-border/50 pt-14 sm:mt-24 sm:pt-16">
            <div className="space-y-8">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="eyebrow-chip w-fit">Keep reading</p>
                  <h2 className="mt-3 font-display text-2xl font-semibold tracking-tight text-primary sm:text-4xl">
                    Related career intelligence.
                  </h2>
                </div>
                <Link href="/blog" className="inline-flex items-center gap-2 text-sm font-bold text-primary">
                  View all articles
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>

              <div className="grid gap-5 md:grid-cols-3">
                {relatedPosts.map((related) => (
                  <Link key={related.slug} href={`/blog/${related.slug}`} className="group overflow-hidden rounded-[1.35rem] border border-border/70 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
                    <div className="relative aspect-[16/10] overflow-hidden">
                      <Image
                        src={related.mainImage}
                        alt={related.title}
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                    <div className="p-5">
                      <p className="text-xs font-bold uppercase tracking-widest text-primary">{related.category}</p>
                      <h3 className="mt-3 font-display text-lg font-semibold leading-tight tracking-tight text-primary group-hover:text-secondary">{related.title}</h3>
                      <p className="mt-3 text-sm leading-6 text-muted-foreground">{related.excerpt}</p>
                    </div>
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
