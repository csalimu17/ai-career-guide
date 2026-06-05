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
            {/* Eyebrow chip removed */}
            <h1 className="headline-gradient-vivid pb-2 text-4xl font-black leading-[1.15] tracking-[-0.05em] sm:text-5xl">
              The product terms that apply when you use AI Career Guide.
            </h1>
            <p className="text-lg leading-relaxed text-muted-foreground">
              Last updated: June 5, 2026. These terms explain how the service works, what you can expect, and what responsibilities come with account access.
            </p>
          </div>

          <article className="surface-card max-w-4xl space-y-8 px-6 py-8 sm:px-8">
            <section className="space-y-3">
              <h2 className="text-2xl font-black text-primary">1. Acceptance of Terms</h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                By accessing or using AI Career Guide, you agree to be bound by these Terms of Service. If you disagree with any part of the terms, you may not access the service. These terms apply to all visitors, users, and others who access or use the platform.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-black text-primary">2. Service Description & AI Disclaimer</h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                AI Career Guide provides resume building, ATS analysis, cover-letter support, and career workflow tools utilizing Artificial Intelligence. You acknowledge that AI-generated content may be inaccurate, incomplete, or inappropriate. You must manually review and verify all generated resumes, cover letters, and scores before using them in live job applications. We do not guarantee employment, interviews, or any specific career outcome.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-black text-primary">3. Accounts and Subscriptions</h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                You are responsible for safeguarding your account credentials. Some features are available on free plans, while others require a paid subscription processed securely via Stripe. Paid plan access is billed in advance on a subscription basis. You may cancel your subscription at any time through the billing portal, but no refunds are provided for partial subscription periods unless legally required.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-black text-primary">4. Acceptable Use & User Content</h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                You retain all rights to the resume content and personal data you upload. By uploading content, you grant us a license to process it solely to provide the service. You agree not to: (a) use the service for any illegal purpose; (b) attempt to reverse engineer or scrape the platform or its AI models; (c) upload malicious code; or (d) share accounts. We reserve the right to suspend or terminate accounts that violate these terms.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-black text-primary">5. Platform Changes & Availability</h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                We continuously update our services and may change, suspend, or discontinue any aspect of the platform at any time without notice. While we strive for high uptime, we do not guarantee that the service will be uninterrupted or error-free.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-black text-primary">6. Limitation of Liability & Indemnification</h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                To the maximum extent permitted by law, AI Career Guide and its operators shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly. You agree to indemnify and hold harmless AI Career Guide from any claims resulting from your use of the service or your violation of these terms.
              </p>
            </section>
          </article>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
