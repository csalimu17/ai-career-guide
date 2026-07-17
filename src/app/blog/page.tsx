import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Calendar, CheckCircle2, Clock, Search, Sparkles, Target } from "lucide-react";
import { PublicHeader } from "@/components/marketing/public-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { BLOG_CATEGORY_DETAILS, BLOG_POSTS, getPostAudience, getPostTakeaways, type BlogPost } from "@/lib/blog-data";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { marketingHeaderItems } from "@/lib/marketing-nav";
import { absoluteUrl, createMetadata } from "@/lib/metadata";

const blogDescription =
  "Premium career advice on CV writing, AI resume optimisation, ATS screening, cover letters, interview prep, job tracking, and modern job search strategy.";

export const metadata = createMetadata({
  title: "Career Intelligence Blog",
  description: blogDescription,
  path: "/blog",
  keywords: [
    "career advice blog",
    "CV writing tips",
    "ATS resume tips",
    "AI resume optimization",
    "job search strategy",
    "interview prep",
    "cover letter tips",
  ],
});

export const revalidate = 86400;

const allCategories = Object.keys(BLOG_CATEGORY_DETAILS) as BlogPost["category"][];

function sortPosts(posts: BlogPost[]) {
  return [...posts].sort((a, b) => new Date(b.updatedAt || b.publishedAt).getTime() - new Date(a.updatedAt || a.publishedAt).getTime());
}

function categoryAnchor(category: string) {
  return `topic-${category.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;
}

function PostCard({ post, compact = false }: { post: BlogPost; compact?: boolean }) {
  const takeaways = getPostTakeaways(post);
  return (
    <Link href={`/blog/${post.slug}`} className="group block h-full">
      <article className="flex h-full flex-col overflow-hidden rounded-[1.35rem] border border-border/70 bg-white/92 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-md">
        <div className="relative aspect-[16/10] overflow-hidden bg-muted">
          <Image
            src={post.mainImage}
            alt={post.title}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute left-4 top-4">
            <Badge className="border-none bg-white/92 text-primary shadow-sm backdrop-blur">
              {post.category}
            </Badge>
          </div>
        </div>
        <div className="flex flex-1 flex-col p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-3 text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground/75">
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              {post.updatedAt || post.publishedAt}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              {post.readingTime}
            </span>
          </div>
          <h2 className="mt-4 font-display text-[1.25rem] font-semibold leading-tight tracking-tight text-primary transition-colors group-hover:text-secondary sm:text-2xl">
            {post.title}
          </h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-[0.96rem]">
            {post.excerpt}
          </p>
          {!compact ? (
            <div className="mt-5 grid gap-2">
              {takeaways.slice(0, 2).map((takeaway) => (
                <p key={takeaway} className="flex items-start gap-2 text-sm leading-5 text-primary/80">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-secondary" />
                  {takeaway}
                </p>
              ))}
            </div>
          ) : null}
          <div className="mt-auto pt-5">
            <span className="inline-flex items-center gap-2 text-sm font-bold text-primary">
              Read article
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}

export default function BlogPage() {
  const sortedPosts = sortPosts(BLOG_POSTS);
  const featuredPost = sortedPosts.find((post) => post.featured) || sortedPosts[0];
  const latestPosts = sortedPosts.slice(0, 6);
  const blogJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${absoluteUrl("/blog")}#collection`,
        url: absoluteUrl("/blog"),
        name: "Career Intelligence Blog",
        description: blogDescription,
        isPartOf: { "@type": "WebSite", name: "AI Career Guide", url: absoluteUrl("/") },
        hasPart: sortedPosts.slice(0, 12).map((post) => ({
          "@type": "BlogPosting",
          headline: post.title,
          url: absoluteUrl(`/blog/${post.slug}`),
          datePublished: post.publishedAt,
          dateModified: post.updatedAt || post.publishedAt,
          description: post.excerpt,
          image: absoluteUrl(post.mainImage),
        })),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
          { "@type": "ListItem", position: 2, name: "Blog", item: absoluteUrl("/blog") },
        ],
      },
    ],
  };

  return (
    <div className="min-h-screen bg-[#FDFDFC]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogJsonLd) }}
      />
      <PublicHeader items={marketingHeaderItems} ctaHref="/signup" ctaLabel="Start free" />

      <main className="pb-24">
        <section className="relative overflow-hidden border-b border-border/50 pb-14 pt-12 sm:pb-20 sm:pt-20">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(239,246,255,0.96)_0%,rgba(255,255,255,0.92)_46%,rgba(255,247,237,0.82)_100%)]" />
          <div className="app-shell relative grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-end">
            <div className="space-y-6">
              <Badge variant="secondary" className="border-none bg-primary/10 px-4 py-1.5 text-sm uppercase tracking-widest text-primary">
                Career Intelligence Blog
              </Badge>
              <div className="space-y-4">
                <h1 className="font-display max-w-4xl text-4xl font-semibold leading-[1.02] tracking-tight text-primary sm:text-6xl lg:text-7xl">
                  Premium insights for a sharper job search.
                </h1>
                <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
                  Practical analysis on CVs, ATS screening, AI hiring, cover letters, job tracking, interviews, and the systems behind modern applications.
                </p>
              </div>
              <div className="grid gap-3 sm:flex">
                <Button size="lg" asChild>
                  <Link href="/ai-career-assistant">
                    Ask the assistant
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/guides">Browse guides</Link>
                </Button>
              </div>
            </div>

            {featuredPost ? (
              <Link href={`/blog/${featuredPost.slug}`} className="group overflow-hidden rounded-[1.7rem] border border-white/80 bg-white/86 shadow-[0_30px_80px_-55px_rgba(15,23,42,0.45)] backdrop-blur">
                <div className="relative aspect-[16/9] overflow-hidden">
                  <Image
                    src={featuredPost.mainImage}
                    alt={featuredPost.title}
                    fill
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    priority
                  />
                </div>
                <div className="p-5 sm:p-7">
                  <div className="flex items-center justify-between gap-4">
                    <Badge className="border-none bg-primary/10 text-primary">{featuredPost.category}</Badge>
                    <span className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Featured analysis</span>
                  </div>
                  <h2 className="mt-5 font-display text-2xl font-semibold leading-tight tracking-tight text-primary sm:text-4xl">
                    {featuredPost.title}
                  </h2>
                  <p className="mt-4 text-sm leading-6 text-muted-foreground sm:text-base">{featuredPost.excerpt}</p>
                  <p className="mt-5 text-sm font-semibold leading-6 text-primary/80">{getPostAudience(featuredPost)}</p>
                  <span className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-primary">
                    Read featured article
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </div>
              </Link>
            ) : null}
          </div>
        </section>

        <section className="py-10 sm:py-14">
          <div className="app-shell grid gap-4 md:grid-cols-3">
            {[
              { icon: Target, label: "Expert Insights", value: "Practical guides written by hiring specialists to accelerate your career transition." },
              { icon: Sparkles, label: "Actionable Steps", value: "Every guide includes clear takeaways and templates you can apply to your CV immediately." },
              { icon: Search, label: "Proven Strategies", value: "Structured answers to key job-search questions, tailored to the UK job market." },
            ].map((item) => (
              <div key={item.label} className="rounded-[1.4rem] border border-border/70 bg-white/90 p-5 shadow-sm">
                <item.icon className="h-5 w-5 text-secondary" />
                <p className="mt-4 text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">{item.label}</p>
                <p className="mt-2 text-sm font-semibold leading-6 text-primary">{item.value}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="pb-16 sm:pb-24">
          <div className="app-shell space-y-8">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl space-y-3">
                <p className="eyebrow-chip w-fit">Latest intelligence</p>
                <h2 className="font-display text-[1.9rem] font-semibold tracking-tight text-primary sm:text-4xl">
                  Read the newest analysis from the career workspace.
                </h2>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="default" size="sm" asChild>
                  <Link href="/blog">All</Link>
                </Button>
                {allCategories.map((cat) => (
                  <Button key={cat} variant="outline" size="sm" asChild>
                    <Link href={`/blog#${categoryAnchor(cat)}`}>{cat}</Link>
                  </Button>
                ))}
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {latestPosts.map((post) => (
                <PostCard key={post.slug} post={post} />
              ))}
            </div>
          </div>
        </section>

        <section className="pb-16 sm:pb-24">
          <div className="app-shell space-y-10">
            <div className="max-w-3xl space-y-3">
              <p className="eyebrow-chip w-fit">Browse by topic</p>
              <h2 className="font-display text-[1.9rem] font-semibold tracking-tight text-primary sm:text-4xl">
                Build topical authority around the whole career journey.
              </h2>
            </div>

            <div className="space-y-10">
              {allCategories.map((cat) => {
                const posts = sortedPosts.filter((post) => post.category === cat);
                if (!posts.length) return null;
                return (
                  <div key={cat} id={categoryAnchor(cat)} className="scroll-mt-28 space-y-4">
                    <div className="flex flex-col gap-2 border-b border-border/60 pb-4 sm:flex-row sm:items-end sm:justify-between">
                      <div>
                        <h3 className={`font-display text-2xl font-semibold tracking-tight ${BLOG_CATEGORY_DETAILS[cat].color}`}>{cat}</h3>
                        <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">{BLOG_CATEGORY_DETAILS[cat].description}</p>
                      </div>
                      <span className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
                        {posts.length} article{posts.length === 1 ? "" : "s"}
                      </span>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                      {posts.slice(0, 3).map((post) => (
                        <PostCard key={post.slug} post={post} compact />
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
