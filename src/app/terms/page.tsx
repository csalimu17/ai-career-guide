import { Shield } from "lucide-react";
import { PublicHeader } from "@/components/marketing/public-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { createMetadata } from "@/lib/metadata";

const navigationItems = [
  { label: "Home", href: "/" },
  { label: "Pricing", href: "/pricing" },
  { label: "Support", href: "/support" },
  { label: "Privacy", href: "/privacy" },
];

export const metadata = createMetadata({
  title: "Terms of service",
  description: "Read the terms that govern the use of AI Career Guide, including subscriptions, platform usage, and account responsibilities.",
  path: "/terms",
});

export default function TermsPage() {
  return (
    <div className="min-h-screen">
      <PublicHeader items={navigationItems} ctaHref="/signup" ctaLabel="Start free" />

      <main className="pb-20 pt-16 sm:pb-24 sm:pt-20">
        <section className="app-shell space-y-8">
          <div className="max-w-3xl space-y-4">
            <div className="eyebrow-chip">
              <Shield className="h-3.5 w-3.5" />
              Terms of service
            </div>
            <h1 className="text-4xl font-black tracking-[-0.05em] text-primary sm:text-5xl">
              The product terms that apply when you use AI Career Guide.
            </h1>
            <p className="text-lg leading-relaxed text-muted-foreground">
              Last updated: March 25, 2026. These terms explain how the service works, what you can expect, and what responsibilities come with account access.
            </p>
          </div>

          <article className="surface-card max-w-4xl space-y-8 px-6 py-8 sm:px-8">
            <section className="space-y-3">
              <h2 className="text-2xl font-black text-primary">1. Using the service</h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                AI Career Guide provides resume building, ATS analysis, cover-letter support, and career workflow tools. By using the platform, you agree to use it lawfully and protect your account credentials.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-black text-primary">2. Accounts and subscriptions</h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Some features are available on free plans, while others require a paid subscription. Paid plan access, billing updates, and cancellations are managed through the linked billing workflow.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-black text-primary">3. Your content</h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                You keep responsibility for the resume content, job descriptions, and supporting information you provide. You should review all generated content before using it in live applications.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-black text-primary">4. Platform changes</h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                We may improve, revise, or retire parts of the service over time. We aim to do that without breaking the core product intent: helping users create better application materials and manage their search effectively.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-black text-primary">5. Limitation of liability</h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                The service is provided as a software tool to support your job-search process. Final hiring outcomes depend on many factors outside the platform, and all generated content should be reviewed before use.
              </p>
            </section>
          </article>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
