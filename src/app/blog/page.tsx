import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Clock, User, Calendar, Search } from "lucide-react";
import { PublicHeader } from "@/components/marketing/public-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { BLOG_POSTS } from "@/lib/blog-data";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { absoluteUrl, createMetadata } from "@/lib/metadata";

const navigationItems = [
  { label: "CV Builder", href: "/cv-builder" },
  { label: "Pricing", href: "/pricing" },
  { label: "Support", href: "/support" },
  { label: "Dashboard", href: "/dashboard" },
];

export const metadata = createMetadata({
  title: "Career Advice Blog | AI Career Guide",
  description: "Expert tips on resume building, AI optimization, and career growth in 2026.",
  path: "/blog",
});

export default function BlogPage() {
  const featuredPost = BLOG_POSTS[0];
  const otherPosts = BLOG_POSTS.slice(1);

  return (
    <div className="min-h-screen bg-[#FDFDFC]">
      <PublicHeader items={navigationItems} ctaHref="/signup" ctaLabel="Start free" />

      <main className="pb-24 pt-12 sm:pt-20">
        <div className="app-shell space-y-12 sm:space-y-20">
          {/* Hero Section */}
          <section className="space-y-6 text-center">
            <Badge variant="secondary" className="px-4 py-1.5 text-sm uppercase tracking-widest bg-primary/10 text-primary border-none">
              The Career Intelligence Blog
            </Badge>
            <h1 className="font-display mx-auto max-w-4xl text-4xl font-semibold leading-[0.95] tracking-tight sm:text-6xl lg:text-7xl">
              Stay ahead in the <span className="headline-gradient-vivid">modern job market</span>
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
              Expert guides, AI strategies, and technical insights to help you build a sharper career system.
            </p>
          </section>

          {/* Featured Post */}
          <section>
            <Link href={`/blog/${featuredPost.slug}`} className="group relative block overflow-hidden rounded-[2.5rem] border border-border/70 bg-white shadow-xl transition-all duration-500 hover:shadow-2xl">
              <div className="grid lg:grid-cols-2">
                <div className="relative aspect-[16/9] overflow-hidden lg:aspect-auto">
                  <Image
                    src={featuredPost.mainImage}
                    alt={featuredPost.title}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                </div>
                <div className="flex flex-col justify-center p-8 sm:p-12 space-y-6">
                  <div className="flex items-center gap-4 text-sm font-medium text-muted-foreground uppercase tracking-widest">
                    <span className="text-primary">{featuredPost.category}</span>
                    <span className="h-1 w-1 rounded-full bg-border" />
                    <span>{featuredPost.readingTime}</span>
                  </div>
                  <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl group-hover:text-primary transition-colors">
                    {featuredPost.title}
                  </h2>
                  <p className="text-lg leading-relaxed text-muted-foreground">
                    {featuredPost.excerpt}
                  </p>
                  <div className="flex items-center gap-4 pt-4 border-t border-border/40">
                    <div className="h-10 w-10 overflow-hidden rounded-full border border-border/70">
                      <Image src={featuredPost.author.image} alt={featuredPost.author.name} width={40} height={40} unoptimized />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">{featuredPost.author.name}</p>
                      <p className="text-sm text-muted-foreground">{featuredPost.author.role}</p>
                    </div>
                    <div className="ml-auto flex items-center text-primary font-bold group/btn">
                      Read full article
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          </section>

          {/* Post Grid */}
          <section className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <h3 className="font-display text-2xl font-semibold tracking-tight">Recent Articles</h3>
              <div className="flex gap-2">
                {["All", "Resume Tips", "AI Intelligence", "Career Advice"].map((cat) => (
                  <Button 
                    key={cat} 
                    variant={cat === "All" ? "default" : "outline"} 
                    size="sm" 
                    className="rounded-full px-5"
                  >
                    {cat}
                  </Button>
                ))}
              </div>
            </div>

            <div className="grid gap-8 md:grid-cols-2">
              {otherPosts.map((post) => (
                <Link key={post.slug} href={`/blog/${post.slug}`} className="group space-y-4">
                  <div className="relative aspect-[16/10] overflow-hidden rounded-[2rem] border border-border/70 shadow-sm transition-all duration-500 group-hover:shadow-md">
                    <Image
                      src={post.mainImage}
                      alt={post.title}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute bottom-4 left-4">
                       <Badge className="bg-white/90 text-primary backdrop-blur hover:bg-white uppercase tracking-wider font-bold">
                        {post.category}
                       </Badge>
                    </div>
                  </div>
                  <div className="space-y-2 px-2">
                    <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-widest text-muted-foreground/70">
                      <Calendar className="h-3 w-3" />
                      <span>{post.publishedAt}</span>
                      <span className="h-1 w-1 rounded-full bg-border" />
                      <Clock className="h-3 w-3" />
                      <span>{post.readingTime}</span>
                    </div>
                    <h4 className="font-display text-xl font-bold tracking-tight text-slate-900 transition-colors group-hover:text-primary">
                      {post.title}
                    </h4>
                    <p className="line-clamp-2 text-[0.95rem] leading-relaxed text-muted-foreground">
                      {post.excerpt}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* Newsletter / CTA Section */}
          <section className="relative overflow-hidden rounded-[3rem] p-8 sm:p-16 brand-gradient-bg text-white shadow-2xl">
             <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                <Search className="h-64 w-64 rotate-12" />
             </div>
             <div className="relative z-10 max-w-2xl space-y-6">
                <Badge variant="outline" className="border-white/30 text-white hover:bg-white/10 uppercase tracking-widest">
                  Newsletter
                </Badge>
                <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-5xl">
                  Get the edge in your career pursuit
                </h2>
                <p className="text-lg text-white/80">
                  Weekly insights on AI trends, resume optimization, and interview signals. Join 12,000+ career explorers.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <input 
                    type="email" 
                    placeholder="Enter your email" 
                    className="flex-1 rounded-2xl bg-white/10 border border-white/20 px-6 py-3.5 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                  <Button variant="secondary" size="lg" className="bg-white text-primary hover:bg-white/95 rounded-2xl">
                    Subscribe
                  </Button>
                </div>
                <p className="text-xs text-white/50">
                  Zero spam. Only the high-signal career intelligence you actually need.
                </p>
             </div>
          </section>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
