import Link from "next/link";
import { CheckCircle2, ShieldCheck, Sparkles, Zap } from "lucide-react";

import { PublicHeader } from "@/components/marketing/public-header";
import { PricingPlanCard } from "@/components/marketing/pricing-plan-card";
import { SiteFooter } from "@/components/marketing/site-footer";
import { Button } from "@/components/ui/button";
import { BILLING_PLANS } from "@/lib/plans";
import { absoluteUrl, createMetadata } from "@/lib/metadata";
import { siteConfig } from "@/lib/site";

import { marketingHeaderItems } from "@/lib/marketing-nav";

export const metadata = createMetadata({
  title: "AI CV Builder Pricing Plans UK — Free, Pro & Master",
  description: "Compare AI Career Guide plans and choose the right setup for CV building, ATS checks, cover letters, and application tracking.",
  path: "/pricing",
  keywords: [
    "CV builder cost",
    "ATS checker pricing",
    "free CV builder UK",
    "resume builder pricing",
    "AI Career Guide plans",
  ],
});

export const revalidate = 86400;

export default function PricingPage() {
  const paidPrices = BILLING_PLANS
    .map((plan) => Number(plan.price.replace(/[^\d.]/g, "")))
    .filter((price) => Number.isFinite(price));
  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "Product",
      name: siteConfig.name,
      brand: {
        "@type": "Brand",
        name: siteConfig.name,
      },
      category: "AI CV Builder and Career Platform",
      description:
        "AI Career Guide plans for CV building, ATS CV checks, cover letters, interview preparation, and application tracking.",
      url: absoluteUrl("/pricing"),
      image: absoluteUrl(siteConfig.ogImage),
      offers: {
        "@type": "AggregateOffer",
        lowPrice: Math.min(...paidPrices).toFixed(2),
        highPrice: Math.max(...paidPrices).toFixed(2),
        priceCurrency: "GBP",
        offerCount: BILLING_PLANS.length,
        availability: "https://schema.org/InStock",
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "OfferCatalog",
      name: "AI Career Guide pricing",
      url: absoluteUrl("/pricing"),
      itemListElement: BILLING_PLANS.map((plan) => {
        const price = plan.price.replace(/[^\d.]/g, "");

        return {
          "@type": "Offer",
          name: `${siteConfig.name} ${plan.name}`,
          price: price || undefined,
          priceCurrency: price ? "GBP" : undefined,
          availability: "https://schema.org/InStock",
          url: absoluteUrl("/pricing"),
          itemOffered: {
            "@type": "SoftwareApplication",
            name: `${siteConfig.name} ${plan.name}`,
            applicationCategory: "BusinessApplication",
            operatingSystem: "Web",
            featureList: plan.features,
          },
        };
      }),
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
          name: "Pricing",
          item: absoluteUrl("/pricing"),
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-transparent relative overflow-hidden">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <div className="career-grid pointer-events-none" />
      <PublicHeader items={marketingHeaderItems} ctaHref="/signup" ctaLabel="Start free" />

      <main className="relative z-10 pb-16 pt-12 sm:pb-24 sm:pt-20">
        <section className="app-shell space-y-8">
          <div className="surface-card space-y-4 px-5 py-6 sm:hidden">
            <div className="eyebrow-chip">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span>Pricing Plans</span>
            </div>
            <p className="font-display headline-gradient-vivid pb-1 text-3xl font-semibold leading-[1.15] tracking-[-0.04em]">
              Pricing that supports the way mobile job searches actually happen.
            </p>
            <p className="text-sm leading-relaxed text-slate-600">
              Start free, then upgrade when you need more ATS scans, more AI assistance, and premium CV workflows.
            </p>
            <p className="border-t border-slate-100 pt-4 text-sm leading-6 text-slate-600">
              <strong>At a glance:</strong> Free helps you build, Pro supports active tailoring, and Master adds capacity for a high-volume search.
            </p>
          </div>

          <div className="hidden max-w-none space-y-5 sm:block">
            <div className="eyebrow-chip inline-flex">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span>Pricing Plans</span>
            </div>
            <h1 className="font-display headline-gradient-vivid max-w-6xl pb-3 text-3xl font-semibold leading-[1.15] tracking-[-0.04em] sm:text-[2.8rem] lg:text-[3.75rem]">
              Pricing that grows with the intensity of your job search.
            </h1>
            <p className="text-base leading-relaxed text-slate-600 sm:text-lg">
              Start with the free workflow, then upgrade when you need more ATS scans, more AI assistance, and premium CV templates for active applications.
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            {BILLING_PLANS.filter((plan) => plan.id !== "agency").map((plan) => (
              <PricingPlanCard key={plan.id} plan={plan} />
            ))}
          </div>
          <aside className="mt-6 border-l-4 border-teal-500 surface-card p-6 relative overflow-hidden" aria-labelledby="agency-heading">
            <h2 id="agency-heading" className="font-display text-xl font-semibold text-slate-950">Agency support is for organisations</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">White-labelled candidate portals, integrations and recruiter reporting are scoped separately from individual plans.</p>
            <Button variant="outline" asChild className="mt-4"><Link href="/support">Discuss Agency support</Link></Button>
          </aside>
        </section>

        <section className="app-shell mt-12 grid gap-4 sm:mt-14 sm:gap-5 lg:grid-cols-3">
          {[
            {
              icon: CheckCircle2,
              title: "Start without friction",
              description: "The free tier is intentionally useful, so new users can finish onboarding and begin improving CVs before spending anything.",
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
            <div key={item.title} className="group surface-card px-5 py-5 sm:px-6 sm:py-6 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md block">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-secondary/10 text-secondary border border-secondary/20 shadow-sm transition-all duration-300 group-hover:scale-110 group-hover:rotate-3">
                <item.icon className="h-5 w-5" />
              </div>
              <h2 className="font-display text-xl font-semibold text-slate-950">{item.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.description}</p>
            </div>
          ))}
        </section>

        <section className="app-shell mt-12 sm:mt-14">
          <div className="surface-card space-y-6 px-5 py-6 sm:px-8 sm:py-8">
            <h2 className="font-display text-2xl font-semibold tracking-tight text-slate-950">Billing, Cancellation & Limits FAQ</h2>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <h3 className="font-semibold text-slate-900 text-base">How does billing work?</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  All paid subscriptions are billed monthly in GBP (£). Your subscription renews automatically on your billing cycle date unless cancelled. You will receive invoice emails via Stripe.
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-slate-900 text-base">Can I cancel or change my plan anytime?</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Yes, absolutely. You can access the secure Customer Billing Portal from your account settings at any time to upgrade, downgrade, or cancel your plan. There are no cancellation fees or lock-ins.
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-slate-900 text-base">What happens when I cancel?</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  If you cancel your subscription, your premium entitlements (such as advanced templates and AI credits) will remain fully active until the end of your current billing cycle. After that, your account will return to the Free plan tier and your stored CVs will be preserved.
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-slate-900 text-base">How do AI usage limits work?</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Your monthly allowance of ATS scans and AI generations resets at the start of each billing period. Free limits are a lifetime allowance, and upgrading immediately transitions you to the generous monthly quotas.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="app-shell mt-12 sm:mt-14">
          <div className="surface-card space-y-5 px-5 py-6 sm:px-8 sm:py-8">
            <div className="max-w-3xl space-y-2">
              <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-primary">Comparing CV builders?</p>
              <h2 className="font-display text-xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
                See how AI Career Guide fits against popular alternatives.
              </h2>
              <p className="text-sm leading-relaxed text-slate-600 sm:text-base">
                If you are choosing between CV builders, compare the full workflow: CV creation, ATS checks, cover letters, interview prep, and application tracking.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <Button variant="outline" asChild>
                <Link href="/compare">All comparisons</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/compare/resume-io-alternative">Resume.io alternative</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/compare/rezi-alternative">Rezi alternative</Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="app-shell mt-12 sm:mt-14">
          <div className="surface-card flex flex-col gap-5 px-5 py-6 sm:px-8 sm:py-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-primary">Need help choosing?</p>
              <h2 className="font-display text-xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
                Start free, then upgrade once your application volume justifies it.
              </h2>
              <p className="max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
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
