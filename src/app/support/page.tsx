import Link from "next/link";
import { ArrowRight, BookOpen, Mail, MessageSquare, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PublicHeader } from "@/components/marketing/public-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { createMetadata } from "@/lib/metadata";
import { siteConfig } from "@/lib/site";

const navigationItems = [
  { label: "Home", href: "/" },
  { label: "Pricing", href: "/pricing" },
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
];

export const metadata = createMetadata({
  title: "Support",
  description: "Get help with onboarding, ATS scoring, resume editing, billing, and account recovery in AI Career Guide.",
  path: "/support",
});

export default function SupportPage() {
  return (
    <div className="min-h-screen">
      <PublicHeader items={navigationItems} ctaHref="/signup" ctaLabel="Start free" />

      <main className="pb-20 pt-16 sm:pb-24 sm:pt-20">
        <section className="app-shell space-y-8">
          <div className="max-w-3xl space-y-4">
            <div className="eyebrow-chip">
              <Sparkles className="h-3.5 w-3.5" />
              Support
            </div>
            <h1 className="text-4xl font-black tracking-[-0.05em] text-primary sm:text-5xl">
              Help for onboarding, editing, ATS scans, billing, and account recovery.
            </h1>
            <p className="text-lg leading-relaxed text-muted-foreground">
              Whether you&apos;re just getting started or troubleshooting a blocked workflow, these support paths point you to the right next step.
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <Card className="border border-border/70 bg-white/90">
              <CardHeader className="space-y-4 p-8">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/8 text-primary">
                  <Mail className="h-5 w-5" />
                </div>
                <CardTitle>Email support</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-8 pt-0">
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Best for billing questions, account recovery issues, and anything that needs a human reply.
                </p>
                <Button asChild>
                  <a href={`mailto:${siteConfig.supportEmail}?subject=AI%20Career%20Guide%20Support`}>
                    Email {siteConfig.supportEmail}
                  </a>
                </Button>
              </CardContent>
            </Card>

            <Card className="border border-border/70 bg-white/90">
              <CardHeader className="space-y-4 p-8">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary/10 text-secondary">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <CardTitle>In-app help routes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-8 pt-0">
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Premium users can access in-product help after logging in, while all users can continue through onboarding, settings, and billing routes directly.
                </p>
                <Button variant="outline" asChild>
                  <Link href="/login">Log in to your workspace</Link>
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="surface-card px-6 py-8 sm:px-8">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                <BookOpen className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground">Quick guides</p>
                <h2 className="text-2xl font-black text-primary">Useful recovery and next-step links</h2>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {[
                {
                  title: "Complete onboarding",
                  description: "Set career goals, choose a starting path, and move into the editor with a clean setup.",
                  href: "/onboarding",
                },
                {
                  title: "Improve ATS performance",
                  description: "Run or rerun ATS analysis when you need to understand match gaps for a specific role.",
                  href: "/ats",
                },
                {
                  title: "Open the resume editor",
                  description: "Return to the builder if you want to update content, switch templates, or export a new version.",
                  href: "/editor",
                },
              ].map((item) => (
                <Link key={item.title} href={item.href} className="rounded-[1.4rem] border border-border/70 bg-white/90 p-5 transition-all hover:-translate-y-0.5 hover:border-primary/15 hover:shadow-sm">
                  <p className="text-lg font-bold text-primary">{item.title}</p>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.description}</p>
                  <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-secondary">
                    Open <ArrowRight className="h-4 w-4" />
                  </span>
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
