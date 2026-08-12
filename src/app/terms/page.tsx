import { Shield, FileText, CheckCircle, Scale, AlertTriangle, HelpCircle, Key, DollarSign, Ban, ShieldAlert } from "lucide-react";
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
  title: "Terms of Service",
  description: "Read the comprehensive Terms of Service governing the use of AI Career Guide, including account responsibilities, subscription billing, and AI content disclaimers.",
  path: "/terms",
});

export const revalidate = 86400;

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-transparent relative overflow-hidden">
      {/* Dotted mesh grid overlay matching landing page hero */}
      <div className="career-grid pointer-events-none" />
      <PublicHeader items={navigationItems} ctaHref="/signup" ctaLabel="Start free" />

      <main className="relative z-10 pb-20 pt-16 sm:pb-24 sm:pt-20">
        <section className="app-shell max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="space-y-4 text-center sm:text-left">
            <div className="eyebrow-chip">
              <Scale className="h-3.5 w-3.5 text-primary" />
              <span>Legal & Compliance</span>
            </div>
            <h1 className="font-display headline-gradient-vivid pb-2 text-4xl font-semibold leading-[1.15] tracking-[-0.04em] sm:text-5xl">
              Terms of Service
            </h1>
            <p className="text-base sm:text-lg leading-relaxed text-slate-600">
              Last updated: June 6, 2026. Please read these terms carefully. They establish a binding contract between you and AI Career Guide governing the use of our platform.
            </p>
          </div>

          <article className="surface-card relative overflow-hidden p-6 sm:p-10 space-y-10">
            <div className="p-5 rounded-2xl bg-amber-50/70 border border-amber-100 text-amber-900 text-xs sm:text-sm leading-relaxed flex gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong>AI Output & Content Warning:</strong> AI Career Guide utilizes advanced AI orchestration strategies (incorporating Google Gemini, Groq Llama, and OpenRouter) to optimize CVs, draft cover letters, and score ATS compatibility. These systems produce automated suggestions. You retain sole responsibility for verifying the truthfulness, accuracy, and completeness of all information before applying to jobs or sharing content.
              </div>
            </div>

            <section className="space-y-4">
              <h2 className="font-display text-xl font-semibold text-slate-950 flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 shadow-sm transition-all duration-300 hover:scale-110 hover:rotate-3 text-sm font-bold">1</span>
                Contractual Agreement
              </h2>
              <div className="text-sm leading-relaxed text-slate-600 space-y-3">
                <p>
                  These Terms of Service ("Terms") constitute a legally binding agreement between you ("User", "you", or "your") and AI Career Guide ("we", "us", "our", or the "Company") regarding your access to and use of our website (aicareerguide.uk), applications, tools, and associated AI services.
                </p>
                <p>
                  By creating an account, clicking "I Agree", purchasing a subscription, or accessing any part of the platform, you acknowledge that you have read, understood, and agree to be bound by these Terms and our Privacy Policy. If you do not agree to all provisions, you must immediately cease using the platform.
                </p>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="font-display text-xl font-semibold text-slate-950 flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 shadow-sm transition-all duration-300 hover:scale-110 hover:rotate-3 text-sm font-bold">2</span>
                Eligibility and Registration
              </h2>
              <div className="text-sm leading-relaxed text-slate-600 space-y-3">
                <p>
                  <strong>Age Requirements:</strong> You must be at least 18 years of age, or the legal age of majority in your jurisdiction, to create an account or purchase paid plans. If you are under 18, you are strictly prohibited from using the platform.
                </p>
                <p>
                  <strong>Account Security:</strong> When registering, you must provide accurate, current, and complete details. You are solely responsible for all actions occurring under your account and for maintaining the absolute confidentiality of your credentials. You must immediately report any suspected breach or unauthorized credentials use to <a href="mailto:support@aicareerguide.uk" className="text-primary hover:underline">support@aicareerguide.uk</a>.
                </p>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="font-display text-xl font-semibold text-slate-950 flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 shadow-sm transition-all duration-300 hover:scale-110 hover:rotate-3 text-sm font-bold">3</span>
                Subscriptions, Billing, and Cancellations
              </h2>
              <div className="text-sm leading-relaxed text-slate-600 space-y-3">
                <p>
                  <strong>Billing Cycles:</strong> Paid plans (such as Pro or Master tiers) are billed on a recurring basis (monthly or annually) via our payment gateway, Stripe. Charges are processed automatically on the calendar day corresponding to the commencement of your paid subscription.
                </p>
                <p>
                  <strong>Automatic Renewal:</strong> To avoid service disruption, all paid subscriptions automatically renew at the end of each billing period unless cancelled prior to the renewal date.
                </p>
                <p>
                  <strong>Cancellation Policy:</strong> You may cancel your subscription at any time through your Billing Portal or Account Settings. Upon cancellation, your premium access will remain active until the end of the current paid cycle, after which your account will automatically downgrade to the Free Tier.
                </p>
                <p>
                  <strong>Refunds:</strong> All payments are non-refundable. Due to the immediate cost of querying API infrastructure (Gemini, Groq, OpenRouter) and caching data, we cannot offer automated refunds. However, if you experience a technical failure or service interruption, you may contact support within 14 days of the charge for a review of your request.
                </p>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="font-display text-xl font-semibold text-slate-950 flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 shadow-sm transition-all duration-300 hover:scale-110 hover:rotate-3 text-sm font-bold">4</span>
                Intellectual Property & Content Ownership
              </h2>
              <div className="text-sm leading-relaxed text-slate-600 space-y-3">
                <p>
                  <strong>Your Content:</strong> You retain full intellectual property ownership of any data, text, resumes, and job descriptions you upload or enter into our editor ("User Content"). You grant the Company a worldwide, royalty-free, non-exclusive license to host, parse, and process your content solely to provide the services described on the site.
                </p>
                <p>
                  <strong>AI Outputs:</strong> To the maximum extent permitted by law, you own the career outputs (such as restructured CV sections, improved bullet points, and customized cover letters) generated for you by the platform.
                </p>
                <p>
                  <strong>Platform IP:</strong> The application, designs, icons, custom Genkit orchestration logic, failover algorithms, UI layout, and copywriting are the exclusive property of AI Career Guide. You may not copy, reverse-engineer, distribute, or create derivative works of any platform code or structure without express written consent.
                </p>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="font-display text-xl font-semibold text-slate-950 flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 shadow-sm transition-all duration-300 hover:scale-110 hover:rotate-3 text-sm font-bold">5</span>
                Prohibited Use and AI Abuse Guardrails
              </h2>
              <div className="text-sm leading-relaxed text-slate-600 space-y-3">
                <p>
                  You agree to use the platform only for legitimate career planning purposes. You are strictly prohibited from:
                </p>
                <ul className="list-disc pl-5 space-y-2">
                  <li>Systematically extracting, scraping, crawling, or downloading data or content from our services using automated software.</li>
                  <li>Evading, altering, or circumventing the rate limits, daily token quotas, or cost caps set by the `UsageManager`.</li>
                  <li>Injecting malicious inputs, attempting to jailbreak underlying LLMs, or executing reverse-prompt engineering attacks.</li>
                  <li>Hosting or distributing resume content that contains malware, deceptive statements, or illegal material.</li>
                  <li>Creating multiple free-tier accounts to exploit quotas or bypass paid subscription barriers.</li>
                </ul>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="font-display text-xl font-semibold text-slate-950 flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 shadow-sm transition-all duration-300 hover:scale-110 hover:rotate-3 text-sm font-bold">6</span>
                Disclaimers of Warranties
              </h2>
              <div className="text-sm leading-relaxed text-slate-600 space-y-3 text-justify">
                <p>
                  THE PLATFORM, INCLUDING ALL TEMPLATES, RESUME OUTPUTS, COVER LETTERS, ATS SCORES, AND INTERVIEW SUGGESTIONS, IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS, WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED.
                </p>
                <p>
                  TO THE FULLEST EXTENT PERMISSIBLE UNDER APPLICABLE LAW, THE COMPANY DISCLAIMS ALL WARRANTIES, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, SYSTEM SECURITY, AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE PLATFORM WILL BE UNINTERRUPTED, COMPLETELY SECURE, ERROR-FREE, OR ACCURATE, OR THAT USE OF THE AI RECOMMENDATIONS WILL RESULT IN INTERVIEWS, PLACEMENTS, OR SPECIFIC JOB OFFERS.
                </p>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="font-display text-xl font-semibold text-slate-950 flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 shadow-sm transition-all duration-300 hover:scale-110 hover:rotate-3 text-sm font-bold">7</span>
                Limitation of Liability
              </h2>
              <div className="text-sm leading-relaxed text-slate-600 space-y-3">
                <p>
                  TO THE MAXIMUM EXTENT PERMITTED BY LAW, IN NO EVENT SHALL THE COMPANY, ITS DIRECTORS, EMPLOYEES, PARTNERS, OR SUPPLIERS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING WITHOUT LIMITATION LOSS OF PROFITS, DATA LOSS, OR OTHER INTANGIBLE LOSSES arising from:
                </p>
                <ul className="list-disc pl-5 space-y-1.5">
                  <li>Your access to, use of, or inability to use the platform.</li>
                  <li>Any inaccurate or incorrect information generated by the AI model strategy or fallback network.</li>
                  <li>Unauthorized access to, alteration of, or deletion of your CVs, data, or account details.</li>
                  <li>Decisions made by hiring managers, employers, or recruiters regarding your job applications.</li>
                </ul>
                <p>
                  IN NO EVENT SHALL OUR TOTAL LIABILITY FOR ALL CLAIMS EXCEED THE GREATER OF FIFTY POUNDS STERLING (£50) OR THE TOTAL AMOUNT PAID BY YOU TO US IN THE SIX (6) MONTHS PRECEDING THE CLAIM.
                </p>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="font-display text-xl font-semibold text-slate-950 flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 shadow-sm transition-all duration-300 hover:scale-110 hover:rotate-3 text-sm font-bold">8</span>
                Indemnification
              </h2>
              <p className="text-sm leading-relaxed text-slate-600">
                You agree to defend, indemnify, and hold harmless AI Career Guide, its developers, contractors, and licensing partners from and against any claims, damages, liabilities, losses, costs, and expenses (including reasonable attorneys' fees) arising out of or in connection with your breach of these Terms, your misuse of the platform, or any violations of third-party rights.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="font-display text-xl font-semibold text-slate-950 flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 shadow-sm transition-all duration-300 hover:scale-110 hover:rotate-3 text-sm font-bold">9</span>
                DMCA & Copyright Infringement
              </h2>
              <p className="text-sm leading-relaxed text-slate-600">
                We respect intellectual property rights. If you believe that any content hosted on our platform infringes your copyright, you may submit a formal notification under the Digital Millennium Copyright Act (DMCA) to our designated copyright agent at <a href="mailto:support@aicareerguide.uk" className="text-primary hover:underline">support@aicareerguide.uk</a>, providing the location of the infringing content, your contact information, and proof of ownership.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="font-display text-xl font-semibold text-slate-950 flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 shadow-sm transition-all duration-300 hover:scale-110 hover:rotate-3 text-sm font-bold">10</span>
                Governing Law & Class-Action Waiver
              </h2>
              <div className="text-sm leading-relaxed text-slate-600 space-y-3">
                <p>
                  <strong>Governing Law:</strong> These Terms and any related actions shall be governed by, and interpreted in accordance with, the laws of the United Kingdom, without reference to conflict of laws principles.
                </p>
                <p>
                  <strong>Dispute Resolution:</strong> Any dispute, claim, or controversy arising out of these Terms shall be settled in the courts of the United Kingdom, and both parties submit to the personal and exclusive jurisdiction of such courts.
                </p>
                <p>
                  <strong>Class Action Waiver:</strong> YOU AGREE THAT ANY CLAIMS OR DISPUTES SHALL BE LITIGATED SOLELY ON AN INDIVIDUAL BASIS. YOU WAIVE THE RIGHT TO PARTICIPATE AS A PLAINTIFF OR CLASS MEMBER IN ANY REPRESENTATIVE OR CLASS-ACTION PROCEEDING.
                </p>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="font-display text-xl font-semibold text-slate-950 flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 shadow-sm transition-all duration-300 hover:scale-110 hover:rotate-3 text-sm font-bold">11</span>
                Modifications to Terms & Services
              </h2>
              <p className="text-sm leading-relaxed text-slate-600">
                We reserve the right to modify these Terms at any time. We will indicate changes by updating the "Last Updated" date. If the revisions are material, we will make reasonable efforts to notify you via email or a platform notification. Continued use of the platform following the posting of changes constitutes your acceptance of the revised Terms.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="font-display text-xl font-semibold text-slate-950 flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 shadow-sm transition-all duration-300 hover:scale-110 hover:rotate-3 text-sm font-bold">12</span>
                Contact
              </h2>
              <p className="text-sm leading-relaxed text-slate-600">
                For legal inquiries, feedback, or support assistance, please reach out to us at:
                <br />
                <span className="block mt-2 font-bold text-slate-800">Email: support@aicareerguide.uk</span>
              </p>
            </section>
          </article>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
