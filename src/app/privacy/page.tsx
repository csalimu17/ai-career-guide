import { Lock, Eye, Database, Globe, UserCheck, ShieldAlert, Cpu, Scale } from "lucide-react";
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
  title: "Privacy Policy",
  description: "Read the Privacy Policy for AI Career Guide to learn how we protect and manage your personal details, uploaded resumes, and AI processing data.",
  path: "/privacy",
});

export const revalidate = 86400;

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-50/50">
      <PublicHeader items={navigationItems} ctaHref="/signup" ctaLabel="Start free" />

      <main className="pb-20 pt-16 sm:pb-24 sm:pt-20">
        <section className="app-shell max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="space-y-4 text-center sm:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-[11px] font-bold uppercase tracking-wider">
              <Lock className="h-3.5 w-3.5 text-indigo-600" />
              <span>Security & Privacy</span>
            </div>
            <h1 className="headline-gradient-vivid pb-2 text-4xl font-black leading-[1.15] tracking-[-0.05em] sm:text-5xl">
              Privacy Policy
            </h1>
            <p className="text-base sm:text-lg leading-relaxed text-muted-foreground">
              Last updated: June 6, 2026. This policy describes how we collect, process, protect, and share your personal data in compliance with GDPR, UK GDPR, and CCPA/CPRA.
            </p>
          </div>

          <article className="surface-card rounded-[2rem] border border-slate-100 bg-white p-6 sm:p-10 shadow-sm space-y-10">
            <p className="text-sm leading-relaxed text-slate-600">
              AI Career Guide ("we", "us", "our") takes the security and privacy of your career information seriously. This policy applies to personal data collected when you register an account, upload a CV, search for jobs, or use our AI services. We act as the <strong>Data Controller</strong> for your personal data.
            </p>

            <section className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 text-sm font-black">
                  <Database className="h-4 w-4 text-indigo-600" />
                </span>
                1. Data Categories We Process
              </h2>
              <div className="text-sm leading-relaxed text-slate-600 space-y-3">
                <p>We collect and process the following categories of information:</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/50">
                        <th className="p-3 font-bold text-slate-700">Category</th>
                        <th className="p-3 font-bold text-slate-700">Data Fields</th>
                        <th className="p-3 font-bold text-slate-700">Source</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      <tr>
                        <td className="p-3 font-bold text-slate-800">Account Identity</td>
                        <td className="p-3">Email, UID, sign-up timestamp</td>
                        <td className="p-3">User Registration</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-bold text-slate-800">Professional Details</td>
                        <td className="p-3">Full name, phone, location (city/state), work history, education history, skills, languages, certifications</td>
                        <td className="p-3">Direct Input / Uploaded CV File</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-bold text-slate-800">Job Tracker Data</td>
                        <td className="p-3">Saved roles, company names, application dates, statuses, notes, LinkedIn import files</td>
                        <td className="p-3">User Action</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-bold text-slate-800">Transaction Details</td>
                        <td className="p-3">Billing email, subscription tier, billing period, Stripe transaction ID (we do not store credit card info)</td>
                        <td className="p-3">Stripe Gateway</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-bold text-slate-800">Diagnostic & Usage</td>
                        <td className="p-3">IP address, browser type, device information, LLM token counts, request latency logs, cookies</td>
                        <td className="p-3">Server Telemetry</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 text-sm font-black">
                  <Eye className="h-4 w-4 text-indigo-600" />
                </span>
                2. Legal Basis for Processing (EEA/UK Users)
              </h2>
              <div className="text-sm leading-relaxed text-slate-600 space-y-3">
                <p>We process your personal data under the following legal bases of the GDPR and UK GDPR:</p>
                <ul className="list-disc pl-5 space-y-2">
                  <li><strong>Performance of Contract:</strong> To manage your account, store your resume configurations, execute ATS scoring reports, and fulfill billing and paid subscription plans.</li>
                  <li><strong>Consent:</strong> When you upload document files (PDF/Word/TXT) for extraction. You grant consent for us and our AI subprocessors to parse the file text. You can revoke consent by deleting the document or your account.</li>
                  <li><strong>Legitimate Interests:</strong> To run diagnostics, monitor application performance, track error rates, enforce cost quotas via the `UsageManager`, and protect our systems from malicious abuse.</li>
                  <li><strong>Legal Obligation:</strong> To maintain transaction records and fulfill business tax requirements.</li>
                </ul>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 text-sm font-black">
                  <Cpu className="h-4 w-4 text-indigo-600" />
                </span>
                3. Subprocessors & Third-Party AI Integrations
              </h2>
              <div className="text-sm leading-relaxed text-slate-600 space-y-3">
                <p>
                  To provide optimized suggestions, cover letters, and score ATS compatibilities, we integrate with third-party service providers. Below is a detailed list of our subprocessors:
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/50">
                        <th className="p-3 font-bold text-slate-700">Subprocessor</th>
                        <th className="p-3 font-bold text-slate-700">Purpose</th>
                        <th className="p-3 font-bold text-slate-700">Data Transferred</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      <tr>
                        <td className="p-3 font-bold text-slate-800">Google Cloud Platform</td>
                        <td className="p-3">Firebase Authentication, Firestore DB, Cloud Storage, App Hosting</td>
                        <td className="p-3">Full account details, files, and CV inputs</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-bold text-slate-800">Google AI (Gemini API)</td>
                        <td className="p-3">Primary LLM extraction and career advising</td>
                        <td className="p-3">CV text, job descriptions</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-bold text-slate-800">Groq Inc.</td>
                        <td className="p-3">Secondary fallback LLM processor</td>
                        <td className="p-3">CV text, job descriptions</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-bold text-slate-800">OpenRouter</td>
                        <td className="p-3">Tertiary fallback LLM pool</td>
                        <td className="p-3">CV text, job descriptions</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-bold text-slate-800">Upstash</td>
                        <td className="p-3">Redis cache and usage tracking database</td>
                        <td className="p-3">Temporarily cached responses and token counts</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-bold text-slate-800">Stripe, Inc.</td>
                        <td className="p-3">Subscription billing and portal operations</td>
                        <td className="p-3">Email, invoice data, and billing metadata</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p className="p-3 rounded-xl bg-indigo-50/50 border border-indigo-100/50 text-xs mt-2 text-indigo-950">
                  <strong>Model Training Policy:</strong> We explicitly verify that Google AI, Groq, and OpenRouter do not use the data transmitted during our API calls to train their baseline models.
                </p>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 text-sm font-black">
                  <Globe className="h-4 w-4 text-indigo-600" />
                </span>
                4. International Data Transfers
              </h2>
              <p className="text-sm leading-relaxed text-slate-600">
                Because our servers and AI integrations are located globally, your personal data may be transferred to and stored in countries outside the United Kingdom and European Economic Area (specifically the United States). For all such transfers, we rely on standard contract safeguards (such as the UK International Data Transfer Agreement and EU Standard Contractual Clauses) to ensure your data receives an equivalent level of protection.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 text-sm font-black">
                  <UserCheck className="h-4 w-4 text-indigo-600" />
                </span>
                5. Your Data Rights (GDPR & UK GDPR)
              </h2>
              <div className="text-sm leading-relaxed text-slate-600 space-y-3">
                <p>Under the General Data Protection Regulation, you hold the following rights:</p>
                <ul className="list-disc pl-5 space-y-2">
                  <li><strong>Right to Access:</strong> You can download or view all resume documents and profile information stored in our databases.</li>
                  <li><strong>Right to Rectification:</strong> You can update incorrect data directly inside the dashboard.</li>
                  <li><strong>Right to Erasure (Deletion):</strong> You can request the permanent deletion of your account. Once requested, all database entries, resume templates, files, and tracker data will be deleted within 30 days.</li>
                  <li><strong>Right to Restrict or Object:</strong> You may object to the processing of your data based on legitimate interests.</li>
                  <li><strong>Right to Portability:</strong> You may request to receive your personal data in a structured, machine-readable JSON format.</li>
                  <li><strong>Right to Lodge a Complaint:</strong> You have the right to file a complaint with a data protection authority. In the UK, this is the Information Commissioner's Office (ICO) at <a href="https://ico.org.uk" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">ico.org.uk</a>.</li>
                </ul>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 text-sm font-black">
                  <Scale className="h-4 w-4 text-indigo-600" />
                </span>
                6. California Consumer Privacy Act (CCPA/CPRA)
              </h2>
              <div className="text-sm leading-relaxed text-slate-600 space-y-3">
                <p>If you are a resident of California, you are granted the following rights:</p>
                <ul className="list-disc pl-5 space-y-1.5">
                  <li>The right to know what personal information we collect, use, and disclose.</li>
                  <li>The right to request the deletion of your personal information.</li>
                  <li>The right to correct inaccurate personal information.</li>
                  <li>The right to opt-out of the "sale" or "sharing" of personal information. (AI Career Guide does not sell or share your personal information for targeted advertising).</li>
                  <li>The right to non-discrimination for exercising your privacy rights.</li>
                </ul>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 text-sm font-black">
                  <ShieldAlert className="h-4 w-4 text-indigo-600" />
                </span>
                7. Data Retention & Security Safeguards
              </h2>
              <div className="text-sm leading-relaxed text-slate-600 space-y-3">
                <p>
                  <strong>Data Retention:</strong> We store your personal information only for as long as necessary to provide the services or until you delete your account. If your account is completely inactive for a period of 24 consecutive months, we reserve the right to delete all your records after notifying you.
                </p>
                <p>
                  <strong>Data Security:</strong> We deploy industry-standard security measures, including database rules restricting document access strictly to the owner's authenticated ID, secure SSL/TLS communication protocols, encryption at rest on Google Cloud, and strict parameter isolation to defend against cross-site scripting (XSS) and injection attacks.
                </p>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 text-sm font-black">8</span>
                Cookies and Local Storage
              </h2>
              <p className="text-sm leading-relaxed text-slate-600">
                We use cookies and local storage tokens solely for essential functionalities, including keeping your user session authenticated (via Firebase Auth) and facilitating secure transaction handshakes with Stripe. We do not use third-party tracking cookies, analytics cookies, or behavioral advertising cookies.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 text-sm font-black">9</span>
                Contact and DPO Information
              </h2>
              <p className="text-sm leading-relaxed text-slate-600">
                For privacy requests, data access applications, or questions regarding this Privacy Policy, please contact our Data Protection Officer at:
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
