import Link from "next/link";
import { CheckCircle2, ShieldCheck, Sparkles, Zap } from "lucide-react";

import { PublicHeader } from "@/components/marketing/public-header";
import { PricingPlanCard } from "@/components/marketing/pricing-plan-card";
import { SiteFooter } from "@/components/marketing/site-footer";
import { Button } from "@/components/ui/button";
import { BILLING_PLANS } from "@/lib/plans";
import { createMetadata } from "@/lib/metadata";

const navigationItems = [
  { label: "Home", href: "/" },
  { label: "Support", href: "/support" },
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
];

export const metadata = createMetadata({
  title: "Pricing",
  description: "Compare AI Career Guide plans and choose the right setup for resume building, ATS checks, cover letters, and application tracking.",
  path: "/pricing",
  keywords: ["resume pricing", "ATS tool pricing", "career SaaS plans"],
});

export default function PricingPage() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "OfferCatalog",
    name: "AI Career Guide pricing",
    itemListElement: BILLING_PLANS.map((plan) => ({
      "@type": "Offer",
      name: plan.name,
      price: plan.price.replace(/[^\d.]/g, ""),
      priceCurrency: "GBP",
      availability: "https://schema.org/InStock",
    })),
  };

  return (
    <div className="min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <PublicHeader items={navigationItems} ctaHref="/signup" ctaLabel="Start free" />

      <main className="pb-16 pt-12 sm:pb-24 sm:pt-20">
        <section className="app-shell space-y-8">
          <div className="surface-card space-y-4 px-5 py-6 sm:hidden">
            <div className="eyebrow-chip">
              <Sparkles className="h-3.5 w-3.5" />
              Clear, scalable plans
            </div>
            <h1 className="text-3xl font-black leading-tight text-primary">
              Pricing that supports the way mobile job searches actually happen.
            </h1>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Start free, then upgrade when you need more ATS scans, more AI assistance, and premium resume workflows.
            </p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Free", value: "Build" },
                { label: "Pro", value: "Tailor" },
                { label: "Master", value: "Scale" },
              ].map((item) => (
                <div key={item.label} className="rounded-[1.1rem] border border-border/70 bg-white/80 px-3 py-3 text-center shadow-sm">
                  <p className="text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{item.label}</p>
                  <p className="mt-1 text-sm font-black text-primary">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="hidden max-w-3xl space-y-5 sm:block">
            <div className="eyebrow-chip">
              <Sparkles className="h-3.5 w-3.5" />
              Clear, scalable plans
            </div>
            <h1 className="text-3xl font-black tracking-[-0.05em] text-primary sm:text-5xl lg:text-6xl">
              Pricing that grows with the intensity of your job search.
            </h1>
            <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
              Start with the free workflow, then upgrade when you need more ATS scans, more AI assistance, and premium resume templates for active applications.
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            {BILLING_PLANS.map((plan) => (
              <PricingPlanCard key={plan.id} plan={plan} />
            ))}
          </div>
        </section>

        <section className="app-shell mt-12 grid gap-4 sm:mt-14 sm:gap-5 lg:grid-cols-3">
          {[
            {
              icon: CheckCircle2,
              title: "Start without friction",
              description: "The free tier is intentionally useful, so new users can finish onboarding and begin improving resumes before spending anything.",
            },
            {
              icon: Zap,
              title: "Upgrade when momentum builds",
              description: "Pro and Master are built for active searches where faster iteration, more scans, and more AI support start to matter.",
            },
            {
              icon: ShieldCheck,
              title: "Billing stays manageable",
              description: "Subscription management routes through Stripe so payment details, invoices, and changes stay clear and recoverable.",
            },
          ].map((item) => (
            <div key={item.title} className="surface-card px-5 py-5 sm:px-6 sm:py-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary/10 text-secondary">
                <item.icon className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-bold text-primary">{item.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.description}</p>
            </div>
          ))}
        </section>

        <section className="app-shell mt-12 sm:mt-14">
          <div className="surface-card flex flex-col gap-5 px-5 py-6 sm:px-8 sm:py-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-secondary">Need help choosing?</p>
              <h2 className="text-xl font-black tracking-tight text-primary sm:text-3xl">
                Start free, then upgrade once your application volume justifies it.
              </h2>
              <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                If you&apos;re testing the workflow, the free plan is enough. If you&apos;re actively applying and tailoring for multiple roles, Pro is usually the best fit.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild className="w-full sm:w-auto">
                <Link href="/signup">Create account</Link>
              </Button>
              <Button variant="outline" asChild className="w-full sm:w-auto">
                <Link href="/support">Talk to support</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
