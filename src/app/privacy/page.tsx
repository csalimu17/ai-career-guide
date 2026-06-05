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
            {/* Eyebrow chip removed */}
            <h1 className="headline-gradient-vivid pb-2 text-4xl font-black leading-[1.15] tracking-[-0.05em] sm:text-5xl">
              How AI Career Guide handles your data and account information.
            </h1>
            <p className="text-lg leading-relaxed text-muted-foreground">
              Last updated: June 5, 2026. This page explains what information we collect, how it is used, and what controls are available to you.
            </p>
          </div>

          <article className="surface-card max-w-4xl space-y-8 px-6 py-8 sm:px-8">
            <p className="text-base leading-relaxed text-muted-foreground">
              Your privacy matters. AI Career Guide is designed to help you build better resumes and manage your job search without making your information harder to control. We are committed to protecting your personal information and your right to privacy.
            </p>

            <section className="space-y-3">
              <h2 className="text-2xl font-black text-primary">1. Information we collect</h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                We collect information you provide directly to us when you create an account, build a resume, use our AI tools, or contact support. This includes:
              </p>
              <ul className="list-disc pl-6 text-sm leading-relaxed text-muted-foreground space-y-1">
                <li><strong>Account Data:</strong> Email address, name, and authentication credentials (handled via Firebase Authentication).</li>
                <li><strong>Profile & Career Data:</strong> Your resume content, job history, skills, career preferences, and job application tracking data.</li>
                <li><strong>Payment Data:</strong> We use Stripe to process payments. We do not store your full credit card details, but we do store subscription status and billing history.</li>
                <li><strong>Usage Data:</strong> Basic analytics on how you interact with our platform to help us improve reliability and user experience.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-black text-primary">2. How we use your data</h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                We use your data solely to provide, maintain, and improve the AI Career Guide platform. This includes resume editing, AI-assisted content generation, Applicant Tracking System (ATS) analysis, onboarding personalization, processing transactions, and providing customer support. We do not sell your personal data to third parties.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-black text-primary">3. AI processing & Third-Party Services</h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                To provide our core features, your resume and job-description content are processed by our AI partners (including Google Gemini, Groq, and OpenRouter).
              </p>
              <ul className="list-disc pl-6 text-sm leading-relaxed text-muted-foreground space-y-1 mt-2">
                <li><strong>No Training on Your Data:</strong> We configure our AI provider APIs so that your personal data is NOT used to train their foundational models.</li>
                <li><strong>Data Sharing:</strong> Data is transmitted securely to these APIs strictly for generating suggestions, scores, or recommendations in real-time.</li>
                <li><strong>Infrastructure:</strong> Our database and hosting infrastructure is provided by Google Cloud (Firebase), which adheres to strict security and compliance standards.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-black text-primary">4. Security, Storage, and Data Retention</h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                We implement industry-standard security measures, including authenticated account access, strict database rules, and encrypted data transmission (HTTPS), to protect your information. Your data is stored securely in Firebase Firestore. We retain your personal information only for as long as your account is active or as necessary to fulfill the purposes outlined in this policy, comply with our legal obligations, or resolve disputes.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-black text-primary">5. Your privacy rights (GDPR & CCPA)</h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Depending on your location, you may have specific rights regarding your personal data, including the right to access, correct, or delete your information. You can update your profile data, manage your billing through the Stripe customer portal, and request complete account deletion directly within the app. Upon account deletion, all your resumes, cover letters, and tracked jobs are permanently removed from our active databases.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-black text-primary">6. Contact us</h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                If you have questions or comments about this privacy policy, or if you wish to exercise your data rights, please contact our support team.
              </p>
            </section>
          </article>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
