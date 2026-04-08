import Image from "next/image";
import Link from "next/link";
import { type LucideIcon, ArrowRight, Briefcase, CheckCircle2, ClipboardList, LayoutTemplate, Search, Sparkles, Upload, Wand2 } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PublicHeader } from "@/components/marketing/public-header";
import { PricingPlanCard } from "@/components/marketing/pricing-plan-card";
import { SiteFooter } from "@/components/marketing/site-footer";
import { BILLING_PLANS } from "@/lib/plans";
import { absoluteUrl, createMetadata } from "@/lib/metadata";
import { siteConfig } from "@/lib/site";

const navigationItems = [
  { label: "Platform", href: "#platform" },
  { label: "Workflow", href: "#workflow" },
  { label: "Pricing", href: "#pricing" },
  { label: "Support", href: "/support" },
];

const featureCards: Array<{
  icon: LucideIcon;
  title: string;
  description: string;
}> = [
  {
    icon: Upload,
    title: "Import your current CV",
    description: "Start from your existing resume so the platform can help you iterate faster instead of rebuilding from zero.",
  },
  {
    icon: Wand2,
    title: "Refine content with AI",
    description: "Improve summaries, bullets, and skills with suggestions that stay grounded in a professional resume structure.",
  },
  {
    icon: Search,
    title: "Score against real job descriptions",
    description: "Run ATS-style analysis to see missing keywords, weak alignment, and where to improve before you apply.",
  },
  {
    icon: LayoutTemplate,
    title: "Switch templates without reformatting",
    description: "Move between clean, ATS-friendly layouts while keeping the same resume data and section order intact.",
  },
  {
    icon: ClipboardList,
    title: "Track your search in one place",
    description: "Manage applications, statuses, and follow-ups from the same workspace where you tailor each resume.",
  },
  {
    icon: Briefcase,
    title: "Stay ready for the next application",
    description: "Keep a polished master resume, then create targeted versions when the right role appears.",
  },
];

const workflowSteps = [
  {
    step: "01",
    title: "Set up your profile and target roles",
    description: "Tell AI Career Guide what you're aiming for so the workspace can tailor onboarding, guidance, and recommendations.",
  },
  {
    step: "02",
    title: "Build or upload your master resume",
    description: "Use the editor and template system to create a resume foundation that stays readable, structured, and easy to iterate on.",
  },
  {
    step: "03",
    title: "Run ATS checks before you apply",
    description: "Compare your resume to a specific job, spot the gaps, and strengthen alignment before sending anything out.",
  },
];

const testimonials = [
  {
    quote:
      "The split between editing and previewing finally made resume updates feel calm. I could improve content and layout without fighting formatting.",
    author: "Samira A.",
    role: "Senior Product Designer",
  },
  {
    quote:
      "The ATS scoring exposed exactly why my resume was underperforming. After two iterations, I started getting interviews again.",
    author: "Daniel M.",
    role: "Frontend Engineer",
  },
  {
    quote:
      "Having templates, resume editing, and job tracking in one app made the whole search feel more strategic and less chaotic.",
    author: "Olivia T.",
    role: "Operations Manager",
  },
];

const faqItems = [
  {
    question: "Is AI Career Guide only for new resumes?",
    answer:
      "No. You can upload an existing CV, improve it with AI, switch templates, and use ATS analysis without starting over.",
  },
  {
    question: "Are the templates ATS-friendly?",
    answer:
      "Yes. The product is built around clean structure, clear hierarchy, and resume layouts designed to stay readable to applicant tracking systems.",
  },
  {
    question: "Can I start free and upgrade later?",
    answer:
      "Yes. You can begin on the free plan, explore the editor and core workflow, then upgrade when you need more scans, templates, or AI assistance.",
  },
  {
    question: "What happens after I create an account?",
    answer:
      "You'll go through a short onboarding flow, then choose whether to upload an existing CV or start building from scratch in the editor.",
  },
];

export const metadata = createMetadata({
  title: "AI Resume Builder, ATS Optimizer & Career Workspace",
  description: siteConfig.description,
  path: "/",
  keywords: [
    "AI career platform",
    "resume optimization",
    "job search dashboard",
    "career workspace",
  ],
});

export default function Home() {
  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: siteConfig.name,
      url: siteConfig.url,
      logo: absoluteUrl("/icon"),
      sameAs: [siteConfig.url],
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: siteConfig.name,
      url: siteConfig.url,
    },
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: siteConfig.name,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      offers: {
        "@type": "AggregateOffer",
        lowPrice: "0",
        highPrice: "18.99",
        offerCount: BILLING_PLANS.length,
        priceCurrency: "GBP",
      },
      description: siteConfig.description,
      url: siteConfig.url,
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqItems.map((item) => ({
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
    <div className="min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <PublicHeader items={navigationItems} ctaHref="/signup" ctaLabel="Start free" />

      <main>
        <section className="relative overflow-hidden pb-14 pt-10 sm:pb-24 sm:pt-24">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(8,145,178,0.08),transparent_34%),radial-gradient(circle_at_right_center,rgba(249,115,22,0.08),transparent_28%)]" />
          <div className="app-shell relative grid items-center gap-8 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="space-y-6">
              <Badge className="eyebrow-chip border-primary/10 bg-primary/5 text-primary hover:bg-primary/5">
                <Sparkles className="h-3.5 w-3.5" />
                AI-powered career workspace
              </Badge>

              <div className="space-y-4">
                <h1 className="headline-gradient-vivid max-w-4xl pb-[0.08em] text-[2.5rem] font-black leading-[0.94] tracking-[-0.06em] sm:pb-[0.1em] sm:text-6xl sm:leading-[0.95] lg:text-7xl">
                  Build a stronger application system, not just another CV.
                </h1>
                <p className="max-w-2xl text-[0.98rem] leading-7 text-muted-foreground sm:text-xl">
                  AI Career Guide helps you create polished resumes, improve ATS match quality, generate sharper content, and manage your search in one premium workspace.
                </p>
              </div>

              <div className="grid gap-3 sm:flex sm:flex-row">
                <Button size="lg" asChild>
                  <Link href="/signup">
                    Start free
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/pricing">See plans</Link>
                </Button>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {[
                  { label: "Resume builder", value: "Canva-style editing with live preview" },
                  { label: "ATS workflow", value: "Role-specific scoring and gap detection" },
                  { label: "Search tracking", value: "Applications, statuses, and follow-ups" },
                ].map((item) => (
                  <div key={item.label} className="rounded-[1.15rem] border border-white/80 bg-white/78 px-4 py-3.5 shadow-sm backdrop-blur">
                    <p className="text-[0.6rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground sm:tracking-[0.22em]">{item.label}</p>
                    <p className="mt-2 text-[0.88rem] font-semibold leading-6 text-primary">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="surface-card relative overflow-hidden p-2.5 sm:p-4">
                <div className="mb-2.5 flex items-center justify-between rounded-[1.1rem] border border-border/70 bg-white/80 px-3.5 py-2.5">
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full bg-rose-400" />
                    <div className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                    <div className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                  </div>
                  <span className="text-[0.58rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground sm:tracking-[0.22em]">
                    AI Career Guide workspace
                  </span>
                </div>
                <div className="overflow-hidden rounded-[1.15rem] border border-border/70">
                  <Image
                    src="/dashboard-preview.jpg"
                    alt="AI Career Guide Dashboard"
                    width={1400}
                    height={1050}
                    priority
                    sizes="(max-width: 1024px) 100vw, 46vw"
                    className="h-auto w-full object-cover"
                  />
                </div>
              </div>

              <div className="absolute -bottom-6 -left-4 hidden max-w-[260px] rounded-[1.4rem] border border-white/80 bg-white/90 p-4 shadow-[0_24px_50px_-34px_rgba(15,23,42,0.5)] backdrop-blur md:block">
                <div className="flex items-center justify-between">
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground sm:tracking-[0.22em]">Live ATS result</p>
                  <span className="rounded-full bg-secondary/10 px-2.5 py-1 text-xs font-semibold text-secondary">92% match</span>
                </div>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
                  <div className="h-full w-[92%] rounded-full bg-secondary" />
                </div>
                <p className="mt-3 text-sm leading-relaxed text-primary">
                  Strong relevance for product, design, and cross-functional collaboration keywords.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="pb-14 sm:pb-24">
          <div className="app-shell">
            <div className="section-shell grid gap-5 px-4 py-5 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-10">
              <div className="space-y-3">
                <p className="text-[0.6rem] font-semibold uppercase tracking-[0.15em] text-secondary sm:tracking-[0.24em]">Trusted workflow</p>
                <h2 className="text-[1.7rem] font-black tracking-tight text-primary sm:text-4xl">
                  From onboarding to application tracking, the path stays clear.
                </h2>
                <p className="text-[0.92rem] leading-6 text-muted-foreground">
                  The product is structured so every next step is obvious: set up your profile, build a master resume, improve it against real jobs, and track the search from one place.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  { label: "Tailored flow", value: "Personalized onboarding and resume setup" },
                  { label: "Premium clarity", value: "Cleaner templates, sharper hierarchy, calmer editing" },
                  { label: "Search control", value: "Track active roles without losing the resume context" },
                ].map((item) => (
                  <Card key={item.label} className="border border-border/70 bg-white/90">
                    <CardContent className="p-4">
                      <p className="text-[0.6rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground sm:tracking-[0.22em]">{item.label}</p>
                      <p className="mt-2 text-[0.88rem] font-semibold leading-6 text-primary">{item.value}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="workflow" className="pb-14 sm:pb-24">
          <div className="app-shell grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="space-y-3">
              <p className="text-[0.6rem] font-semibold uppercase tracking-[0.24em] text-secondary">How it works</p>
              <h2 className="text-[1.7rem] font-black tracking-tight text-primary sm:text-4xl">
                A cleaner three-step workflow for faster applications.
              </h2>
              <p className="max-w-xl text-[0.92rem] leading-6 text-muted-foreground">
                Instead of juggling separate tools, the app keeps editing, ATS refinement, and application tracking close together so momentum is easier to maintain.
              </p>
            </div>

            <div className="grid gap-3">
              {workflowSteps.map((step) => (
                <div key={step.step} className="surface-card px-4 py-4 sm:px-7">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                    <div className="text-[2rem] font-black tracking-[-0.08em] text-secondary/30">{step.step}</div>
                    <div className="space-y-1.5">
                      <h3 className="text-[1rem] font-bold text-primary">{step.title}</h3>
                      <p className="text-[0.88rem] leading-6 text-muted-foreground sm:text-base">{step.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="platform" className="pb-16 sm:pb-24">
          <div className="app-shell space-y-8 sm:space-y-10">
            <div className="max-w-3xl space-y-3 sm:space-y-4">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-secondary">Platform</p>
              <h2 className="text-[1.8rem] font-black tracking-tight text-primary sm:text-4xl">
                Everything you need to move from draft to interview-ready.
              </h2>
              <p className="text-[0.95rem] leading-relaxed text-muted-foreground sm:text-base">
                The product keeps the essentials together: resume editing, AI enhancements, ATS validation, cover letter generation, job tracking, and account controls.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {featureCards.map((feature) => (
                <Card key={feature.title} className="group border border-border/70 bg-white/88">
                  <CardContent className="space-y-4 p-5 sm:p-7">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/6 text-primary transition-transform duration-300 group-hover:scale-105">
                      <feature.icon className="h-5 w-5" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-[1.02rem] font-bold text-primary sm:text-xl">{feature.title}</h3>
                      <p className="text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="pb-16 sm:pb-24">
          <div className="app-shell">
            <div className="surface-card grid gap-6 overflow-hidden px-4 py-6 sm:px-8 sm:py-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
              <div className="space-y-4 sm:space-y-5">
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-secondary">Built for confidence</p>
                <h2 className="text-[1.8rem] font-black tracking-tight text-primary sm:text-4xl">
                  Sharper resumes, better signals, and fewer dead ends.
                </h2>
                <p className="text-[0.95rem] leading-relaxed text-muted-foreground sm:text-base">
                  The editor, ATS checks, settings, and navigation are built to feel like one coherent product, so users always have a next step and a way back.
                </p>
                <div className="grid gap-3">
                  {[
                    "Clear next actions from onboarding through dashboard and editor",
                    "Cleaner visual hierarchy across forms, cards, navigation, and settings",
                    "Metadata, icons, robots, and sitemap configured for production SEO",
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-secondary" />
                      <p className="text-sm leading-relaxed text-primary">{item}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="overflow-hidden rounded-[1.4rem] border border-border/70 bg-white/85 p-3 sm:rounded-[1.8rem] sm:p-4">
                <Image
                  src="/resume-preview.jpg"
                  alt="AI-Generated Professional Resume"
                  width={1200}
                  height={1600}
                  sizes="(max-width: 1024px) 100vw, 42vw"
                  className="h-auto w-full rounded-[1.2rem] object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="pb-16 sm:pb-24">
          <div className="app-shell space-y-7 sm:space-y-8">
            <div className="max-w-3xl space-y-3 sm:space-y-4">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-secondary">Loved by job seekers</p>
              <h2 className="text-[1.8rem] font-black tracking-tight text-primary sm:text-4xl">
                Built to feel calmer, clearer, and more strategic than a typical resume tool.
              </h2>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              {testimonials.map((testimonial) => (
                <Card key={testimonial.author} className="border border-border/70 bg-white/88">
                  <CardContent className="space-y-4 p-5 sm:p-7">
                    <div className="flex gap-1 text-accent">
                      {Array.from({ length: 5 }).map((_, index) => (
                        <Sparkles key={index} className="h-4 w-4" />
                      ))}
                    </div>
                    <p className="text-[0.95rem] leading-relaxed text-primary/90 sm:text-base">&ldquo;{testimonial.quote}&rdquo;</p>
                    <div>
                      <p className="font-bold text-primary">{testimonial.author}</p>
                      <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section id="pricing" className="pb-16 sm:pb-24">
          <div className="app-shell space-y-7 sm:space-y-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl space-y-3 sm:space-y-4">
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-secondary">Pricing</p>
                <h2 className="text-[1.8rem] font-black tracking-tight text-primary sm:text-4xl">
                  Start free, then scale into deeper ATS analysis and premium templates.
                </h2>
                <p className="text-[0.95rem] leading-relaxed text-muted-foreground sm:text-base">
                  Every plan gives you a clear next step. The free tier is enough to start, while Pro and Master unlock more volume, polish, and support.
                </p>
              </div>
              <Button variant="outline" asChild>
                <Link href="/pricing">View full pricing page</Link>
              </Button>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              {BILLING_PLANS.map((plan) => (
                <PricingPlanCard key={plan.id} plan={plan} />
              ))}
            </div>
          </div>
        </section>

        <section className="pb-16 sm:pb-24">
          <div className="app-shell grid gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:gap-8">
            <div className="space-y-3 sm:space-y-4">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-secondary">FAQ</p>
              <h2 className="text-[1.8rem] font-black tracking-tight text-primary sm:text-4xl">
                Questions people ask before they trust a resume platform.
              </h2>
              <p className="text-[0.95rem] leading-relaxed text-muted-foreground sm:text-base">
                These answers focus on how the app behaves in practice: setup, pricing, ATS safety, and what happens after signup.
              </p>
            </div>

            <Accordion type="single" collapsible className="space-y-4">
              {faqItems.map((item, index) => (
                <AccordionItem key={item.question} value={`faq-${index}`} className="surface-card px-4 sm:px-6">
                  <AccordionTrigger className="py-4 text-left text-[0.95rem] font-bold text-primary hover:no-underline sm:py-6 sm:text-base">
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent className="pb-4 text-sm leading-relaxed text-muted-foreground sm:pb-6">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        <section className="pb-16 sm:pb-24">
          <div className="app-shell">
            <div className="overflow-hidden rounded-[1.6rem] bg-primary px-5 py-8 text-white shadow-[0_40px_100px_-52px_hsl(var(--primary))] sm:px-10 sm:py-14 sm:rounded-[2.2rem]">
              <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center lg:gap-8">
                <div className="space-y-3 sm:space-y-4">
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-white/70">Ready when you are</p>
                  <h2 className="max-w-3xl text-[2rem] font-black tracking-tight sm:text-5xl">
                    Build the version of your career story that actually gets read.
                  </h2>
                  <p className="max-w-2xl text-[0.95rem] leading-relaxed text-white/72 sm:text-lg">
                    Create your account, complete onboarding, and choose whether to upload an existing CV or start from scratch in the AI-guided editor.
                  </p>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
                  <Button variant="secondary" size="lg" asChild className="bg-white text-primary hover:bg-white/95">
                    <Link href="/signup">Start free</Link>
                  </Button>
                  <Button variant="outline" size="lg" asChild className="border-white/20 bg-white/10 text-white hover:bg-white/15">
                    <Link href="/login">Log in</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
