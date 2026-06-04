import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock, Calendar, Share2, MessageCircle, Twitter, Linkedin, Facebook, ChevronRight, Wand2, ArrowRight } from "lucide-react";
import { PublicHeader } from "@/components/marketing/public-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { getPostBySlug, BLOG_POSTS } from "@/lib/blog-data";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { absoluteUrl, createMetadata } from "@/lib/metadata";

const navigationItems = [
  { label: "CV Builder", href: "/cv-builder" },
  { label: "Blog", href: "/blog" },
  { label: "Pricing", href: "/pricing" },
  { label: "Dashboard", href: "/dashboard" },
];

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};

  return createMetadata({
    title: `${post.title} | AI Career Guide`,
    description: post.excerpt,
    path: `/blog/${slug}`,
    image: post.mainImage,
  });
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const relatedPosts = BLOG_POSTS.filter((p) => p.slug !== post.slug).slice(0, 2);

  return (
    <div className="min-h-screen bg-[#FDFDFC]">
      <PublicHeader items={navigationItems} ctaHref="/signup" ctaLabel="Start free" />

      <main className="pb-24 pt-10 sm:pt-16">
        {/* Article Progress Bar - Top Sticky */}
        <div className="fixed top-[64px] left-0 z-50 h-1 w-0 bg-primary transition-all duration-300" id="progress-bar" />

        <div className="app-shell pb-12 sm:pb-20">
          <Link href="/blog" className="group flex items-center text-sm font-bold text-muted-foreground hover:text-primary transition-colors">
            <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Back to Articles
          </Link>
        </div>

        <article className="app-shell max-w-5xl">
          {/* Article Header */}
          <header className="space-y-8 text-center pb-12">
            <div className="flex items-center justify-center gap-3">
              <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-none uppercase tracking-widest px-4 py-1">
                {post.category}
              </Badge>
              <span className="h-1 w-1 rounded-full bg-border" />
              <span className="text-sm font-medium text-muted-foreground uppercase tracking-widest">{post.readingTime}</span>
            </div>
            
            <h1 className="font-display mx-auto max-w-4xl text-3xl font-semibold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
              {post.title}
            </h1>

            <div className="flex flex-col items-center justify-center gap-4 border-y border-border/40 py-8">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 overflow-hidden rounded-full border-2 border-primary/20 shadow-sm">
                  <Image src={post.author.image} alt={post.author.name} width={48} height={48} unoptimized />
                </div>
                <div className="text-left">
                  <p className="font-bold text-slate-900">{post.author.name}</p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{post.author.role}</span>
                    <span className="h-1 w-1 rounded-full bg-border" />
                    <Calendar className="h-3 w-3" />
                    <span>{post.publishedAt}</span>
                  </div>
                </div>
              </div>
            </div>
          </header>

          {/* Featured Image */}
          <div className="relative aspect-[16/8] w-full overflow-hidden rounded-[2.5rem] border border-border/70 shadow-2xl mb-16">
            <Image
              src={post.mainImage}
              alt={post.title}
              fill
              className="object-cover"
              priority
            />
          </div>

          <div className="grid gap-12 lg:grid-cols-[1fr_300px]">
             {/* Content Area */}
             <div className="prose prose-slate prose-lg max-w-none prose-headings:font-display prose-headings:font-semibold prose-headings:tracking-tight prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-img:rounded-3xl">
                <p className="lead text-xl text-muted-foreground leading-relaxed italic">
                   {post.excerpt}
                </p>

                <h2>Introduction</h2>
                <p>
                  In the rapidly evolving hiring landscape of 2026, the traditional resume is no longer just a static document. It is a critical component of a digital career system that must interface perfectly with AI screening tools, while simultaneously telling a compelling human story to recruitment managers.
                </p>

                <blockquote>
                  &ldquo;The difference between a candidate who gets interviewed and one who gets ignored often comes down to how well they've optimized their narrative for both humans and machines.&rdquo;
                </blockquote>

                <h3>Why traditional formats are shifting</h3>
                <p>
                  We are seeing a massive shift toward <strong>Hybrid Formats</strong>. These layouts combine the best of reverse-chronological structures with skills-based blocks that are easier for Applicant Tracking Systems (ATS) to parse.
                </p>

                <ul>
                   <li><strong>Cleaner Hierarchy:</strong> Using clear section breaks and consistent header styles.</li>
                   <li><strong>Keyword Integration:</strong> Naturally weaving job-specific metadata into your professional summaries.</li>
                   <li><strong>Visual Clarity:</strong> Moving away from multi-column layouts that confuse older ATS parsers.</li>
                </ul>

                {/* Inline CTA / Lead Magnet */}
                <div className="my-12 overflow-hidden rounded-[2rem] border-2 border-primary/20 bg-primary/5 p-8 text-center sm:p-12">
                   <div className="mx-auto h-16 w-16 mb-6 icon-orb text-primary">
                      <Wand2 className="h-6 w-6" />
                   </div>
                   <h3 className="!mt-0 font-display text-2xl font-bold tracking-tight">Ready to build your 2026 CV?</h3>
                   <p className="text-muted-foreground text-lg mb-8">
                     Use our AI-guided editor to create a sharper version of your story in minutes.
                   </p>
                   <Button size="lg" className="rounded-2xl px-10" asChild>
                      <Link href="/signup">
                        Start for free
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                   </Button>
                </div>

                <h2>The Three Pillars of Modern Resumes</h2>
                <p>
                  To stay competitive, your resume must excel in these three areas:
                </p>
                <ol>
                   <li><strong>Searchability:</strong> Matching the semantic intent of the job description.</li>
                   <li><strong>Readability:</strong> Using white space and typography to guide the recruiter's eye.</li>
                   <li><strong>Proof of Impact:</strong> Moving beyond lists of duties to quantifiable achievements.</li>
                </ol>

                <p>
                  As we move deeper into 2026, the tools we use to build these documents become just as important as the content itself. A clean, ATS-friendly template is the foundation upon which your career success is built.
                </p>
             </div>

             {/* Sidebar / Desktop Sticky */}
             <aside className="hidden lg:block">
                <div className="sticky top-24 space-y-10">
                   {/* Table of Contents Mock */}
                   <div className="space-y-4">
                      <p className="text-[0.7rem] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Table of Contents</p>
                      <nav className="flex flex-col gap-3">
                         {["Introduction", "Why formats are shifting", "The Three Pillars", "Final Thoughts"].map((link) => (
                            <Link key={link} href="#" className="text-sm font-bold text-slate-900 border-l-2 border-transparent pl-4 hover:border-primary hover:text-primary transition-all">
                               {link}
                            </Link>
                         ))}
                      </nav>
                   </div>

                   {/* Social Share */}
                   <div className="space-y-4">
                      <p className="text-[0.7rem] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Share this guide</p>
                      <div className="flex gap-2">
                         {[Twitter, Linkedin, Facebook].map((Icon, i) => (
                            <Button key={i} variant="outline" size="icon" className="rounded-xl border-border/60 hover:bg-primary/5 hover:text-primary transition-colors">
                               <Icon className="h-4 w-4" />
                            </Button>
                         ))}
                         <Button variant="outline" size="icon" className="rounded-xl border-border/60 hover:bg-primary/5 hover:text-primary transition-colors">
                            <Share2 className="h-4 w-4" />
                         </Button>
                      </div>
                   </div>

                   {/* Vertical CTA */}
                   <div className="rounded-3xl brand-gradient-bg p-6 text-white space-y-4 shadow-lg">
                      <Badge variant="outline" className="border-white/30 text-white uppercase text-[0.6rem] tracking-widest font-black">Free Tool</Badge>
                      <h4 className="font-display text-xl font-bold leading-tight">Test your score</h4>
                      <p className="text-sm text-white/80">
                         Scan your CV against a job description and see your match rate immediately.
                      </p>
                      <Button variant="secondary" className="w-full bg-white text-primary hover:bg-white/95 rounded-xl font-bold" asChild>
                         <Link href="/signup">Upload CV</Link>
                      </Button>
                   </div>
                </div>
             </aside>
          </div>
        </article>

        {/* Related Articles Grid */}
        <section className="app-shell border-t border-border/40 mt-24 pt-16">
           <div className="space-y-10">
              <div className="flex items-end justify-between">
                 <h2 className="font-display text-2xl font-semibold tracking-tight">Keep reading</h2>
                 <Link href="/blog" className="text-sm font-bold text-primary flex items-center group">
                    View all guides
                    <ChevronRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                 </Link>
              </div>

              <div className="grid gap-8 md:grid-cols-2">
                 {relatedPosts.map((post) => (
                    <Link key={post.slug} href={`/blog/${post.slug}`} className="group flex gap-6 items-center">
                       <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-2xl border border-border/70 group-hover:shadow-md transition-all">
                          <Image src={post.mainImage} alt={post.title} fill className="object-cover transition-transform duration-500 group-hover:scale-110" />
                       </div>
                       <div className="space-y-1">
                          <div className="flex items-center gap-2 text-[0.65rem] font-bold uppercase tracking-widest text-primary">
                             <span>{post.category}</span>
                             <span className="h-1 w-1 rounded-full bg-border" />
                             <span className="text-muted-foreground">{post.readingTime}</span>
                          </div>
                          <h4 className="font-display text-lg font-bold tracking-tight text-slate-900 group-hover:text-primary transition-colors">{post.title}</h4>
                       </div>
                    </Link>
                 ))}
              </div>
           </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
