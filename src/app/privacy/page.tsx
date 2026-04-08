import { Lock } from "lucide-react";
import { PublicHeader } from "@/components/marketing/public-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { createMetadata } from "@/lib/metadata";

const navigationItems = [
  { label: "Home", href: "/" },
  { label: "Pricing", href: "/pricing" },
  { label: "Support", href: "/support" },
  { label: "Terms", href: "/terms" },
];

export const metadata = createMetadata({
  title: "Privacy policy",
  description: "Read how AI Career Guide handles personal data, AI processing, storage, and account rights.",
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <div className="min-h-screen">
      <PublicHeader items={navigationItems} ctaHref="/signup" ctaLabel="Start free" />

      <main className="pb-20 pt-16 sm:pb-24 sm:pt-20">
        <section className="app-shell space-y-8">
          <div className="max-w-3xl space-y-4">
            <div className="eyebrow-chip">
              <Lock className="h-3.5 w-3.5" />
              Privacy policy
            </div>
            <h1 className="text-4xl font-black tracking-[-0.05em] text-primary sm:text-5xl">
              How AI Career Guide handles your data and account information.
            </h1>
            <p className="text-lg leading-relaxed text-muted-foreground">
              Last updated: March 25, 2026. This page explains what information we collect, how it is used, and what controls are available to you.
            </p>
          </div>

          <article className="surface-card max-w-4xl space-y-8 px-6 py-8 sm:px-8">
            <p className="text-base leading-relaxed text-muted-foreground">
              Your privacy matters. AI Career Guide is designed to help you build better resumes and manage your job search without making your information harder to control.
            </p>

            <section className="space-y-3">
              <h2 className="text-2xl font-black text-primary">1. Information we collect</h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                We collect information you provide directly, including account details, resume content, career preferences, and job application tracking data you choose to store in the app.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-black text-primary">2. How we use your data</h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                We use your data to provide resume editing, AI-assisted content generation, ATS analysis, onboarding personalization, billing support, and product reliability improvements.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-black text-primary">3. AI processing</h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Resume and job-description content may be processed by AI systems to generate suggestions, scores, or recommendations. That processing is limited to product functionality and is not intended to sell or repackage your data.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-black text-primary">4. Security and access control</h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                We use authenticated account access, database rules, and server-side billing checks to reduce unauthorized access and keep your workspace limited to your account context.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-black text-primary">5. Your rights</h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                You can update profile data, request account deletion, and contact support for access-related issues. Where available, billing and security controls are also accessible in-app.
              </p>
            </section>
          </article>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
