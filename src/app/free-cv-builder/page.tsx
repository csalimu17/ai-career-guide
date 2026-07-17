import Link from "next/link";
import { Check, X, Sparkles, CheckCircle2, ChevronRight, ArrowRight, Shield, Download, FileText, LayoutGrid } from "lucide-react";
import { PublicHeader } from "@/components/marketing/public-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { marketingHeaderItems } from "@/lib/marketing-nav";
import { absoluteUrl, createMetadata } from "@/lib/metadata";

export const metadata = createMetadata({
  title: "Free AI CV Builder & ATS Optimizer",
  description: "Build a professional, ATS-friendly CV for free. Access AI editing recommendations, download clean PDF formats instantly, and bypass hidden trial traps.",
  path: "/free-cv-builder",
  keywords: ["free cv builder", "free resume builder", "truly free cv maker", "ats cv optimizer", "cv download free"],
});

export const revalidate = 86400;

const comparisonFeatures = [
  { name: "Truly Free PDF Downloads", ours: true, others: false, note: "No hidden charges at final download step" },
  { name: "Built-in ATS Compliance Checker", ours: true, others: false, note: "Interactive feedback on candidate match rate" },
  { name: "AI-Powered Writing Partner", ours: true, others: "partial", note: "Suggests high-impact action verbs and bullets" },
  { name: "Clean, Single & Two-Column Layouts", ours: true, others: true, note: "Standard professional template selections" },
  { name: "Integrated Job tracker", ours: true, others: false, note: "Save target job descriptions and log status" },
  { name: "No Credit Card Sign-up Trap", ours: true, others: false, note: "Start instantly without trial cancellation stress" },
];

const faqItems = [
  {
    question: "Is this CV builder actually free to use?",
    answer: "Yes! Unlike other sites that let you build a CV but force you to pay or input a credit card to download, we allow you to build and download a standard formatted PDF of your CV completely free."
  },
  {
    question: "How does the built-in ATS checker help my job search?",
    answer: "Most medium and large employers use Applicant Tracking Systems (ATS) to filter CVs. Our checker compares your CV content directly against any job description, highlights missing keywords, and gives you a score out of 100 before you send it out."
  },
  {
    question: "What templates are included for free?",
    answer: "Our flagship templates—including London Executive, Berlin Modular, and Munich Precision—are available on the free tier. They are designed to prioritize readability for recruiters and applicant tracking systems."
  },
  {
    question: "Can I import my existing CV?",
    answer: "Yes! You can upload your existing PDF or Word CV. Our AI parses your work history, skills, and education, allowing you to instantly swap styles or rewrite bullets without starting over."
  }
];

export default function FreeCvBuilderPage() {
  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "AI Career Guide CV Builder",
      operatingSystem: "Web",
      applicationCategory: "BusinessApplication",
      browserRequirements: "Requires HTML5 compatible browser",
      url: absoluteUrl("/free-cv-builder"),
      offers: {
        "@type": "Offer",
        price: "0.00",
        priceCurrency: "GBP",
      },
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
          name: "Free CV Builder",
          item: absoluteUrl("/free-cv-builder"),
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-[#FDFDFC]">
      {/* Schema Injection */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <PublicHeader items={marketingHeaderItems} ctaHref="/signup" ctaLabel="Start free" />

      <main className="relative overflow-hidden pt-12 sm:pt-20">
        {/* Background Gradients */}
        <div className="absolute top-0 right-0 -z-10 h-[600px] w-[600px] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-20 left-0 -z-10 h-[500px] w-[500px] bg-indigo-500/5 blur-[100px] rounded-full pointer-events-none" />

        <div className="app-shell pb-24 space-y-20 md:space-y-28">
          
          {/* Hero Header */}
          <section className="space-y-8 text-center max-w-4xl mx-auto">
            <Badge variant="secondary" className="px-4 py-1.5 text-sm uppercase tracking-widest bg-primary/10 text-primary border-none">
              Truly Free Access
            </Badge>
            <h1 className="font-display text-5xl font-semibold leading-[0.95] tracking-tight sm:text-7xl lg:text-8xl">
              Build a Professional <span className="headline-gradient-vivid">CV For Free</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Tired of builders that hide downloads behind paywalls? Create, edit, and export your ATS-friendly CV to PDF without any hidden trial traps.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center rounded-2xl bg-primary text-white px-8 py-4 text-base font-bold hover:bg-primary/95 transition-all shadow-lg shadow-primary/20"
              >
                Create Your Free CV
                <ChevronRight className="ml-2 h-5 w-5" />
              </Link>
              <Link
                href="/cv-templates"
                className="inline-flex items-center justify-center rounded-2xl border border-border bg-white px-8 py-4 text-base font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm"
              >
                Browse Free Templates
              </Link>
            </div>
          </section>

          {/* Quick Value Pillars */}
          <section className="grid gap-8 md:grid-cols-3">
            <Card className="rounded-[2rem] border border-border/70 bg-white p-8 shadow-sm">
              <CardContent className="p-0 space-y-4">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                  <Download className="h-6 w-6" />
                </div>
                <h3 className="font-display text-xl font-bold text-slate-900">100% Free Downloads</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  No generic watermarks, no trial deadlines. Export clean, formatted PDF files that look professional on any desktop or mobile device.
                </p>
              </CardContent>
            </Card>

            <Card className="rounded-[2rem] border border-border/70 bg-white p-8 shadow-sm">
              <CardContent className="p-0 space-y-4">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                  <Shield className="h-6 w-6" />
                </div>
                <h3 className="font-display text-xl font-bold text-slate-900">ATS Optimization Guide</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Our layouts use clean structures that are easier for recruiters to scan and more compatible with automated parsing systems.
                </p>
              </CardContent>
            </Card>

            <Card className="rounded-[2rem] border border-border/70 bg-white p-8 shadow-sm">
              <CardContent className="p-0 space-y-4">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-50 text-purple-600">
                  <Sparkles className="h-6 w-6" />
                </div>
                <h3 className="font-display text-xl font-bold text-slate-900">AI Career Assistance</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Get structural feedback, resume summaries, and skills matching tailored directly to your target job descriptions with our integrated coach.
                </p>
              </CardContent>
            </Card>
          </section>

          {/* Comparison Table Section */}
          <section className="space-y-8">
            <div className="text-center space-y-4 max-w-2xl mx-auto">
              <h2 className="font-display text-3xl font-bold sm:text-5xl text-slate-900">
                How we compare to the rest
              </h2>
              <p className="text-muted-foreground">
                We believe in providing transparent access to career tools. Here is how we stack up against other online platforms.
              </p>
            </div>

            <div className="overflow-hidden rounded-[2rem] border border-border/80 bg-white shadow-md">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b border-border bg-slate-50/70 text-xs font-bold uppercase tracking-wider text-slate-400">
                      <th className="px-6 py-5">Features & Transparency</th>
                      <th className="px-6 py-5 text-primary">AI Career Guide</th>
                      <th className="px-6 py-5">Other Builders</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60 text-sm">
                    {comparisonFeatures.map((feat, i) => (
                      <tr key={i} className="hover:bg-slate-50/40 transition-colors">
                        <td className="px-6 py-5">
                          <p className="font-bold text-slate-900">{feat.name}</p>
                          <p className="text-xs text-muted-foreground">{feat.note}</p>
                        </td>
                        <td className="px-6 py-5 text-primary">
                          <div className="flex items-center gap-2 font-bold">
                            <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                            <span>Included</span>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-slate-500">
                          {feat.others === true ? (
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="h-5 w-5 text-emerald-500/70 shrink-0" />
                              <span>Common</span>
                            </div>
                          ) : feat.others === "partial" ? (
                            <div className="flex items-center gap-2">
                              <Sparkles className="h-4 w-4 text-purple-400 shrink-0" />
                              <span>Premium only</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-rose-500">
                              <X className="h-5 w-5 shrink-0" />
                              <span>Paywalled / Locked</span>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* Interactive Steps Section */}
          <section className="grid gap-12 lg:grid-cols-2 items-center">
            <div className="space-y-6">
              <Badge variant="outline" className="text-primary border-primary/20 bg-primary/5">
                Onboarding Walkthrough
              </Badge>
              <h2 className="font-display text-3xl font-bold sm:text-5xl text-slate-900 leading-tight">
                Create a high-impact CV in 3 simple steps
              </h2>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white font-bold">1</div>
                  <div>
                    <h4 className="font-bold text-slate-900">Upload or Select Layout</h4>
                    <p className="text-sm text-muted-foreground mt-1">Import your old CV or select from our recruiter-approved professional layout standards.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white font-bold">2</div>
                  <div>
                    <h4 className="font-bold text-slate-900">Tailor with AI Advice</h4>
                    <p className="text-sm text-muted-foreground mt-1">Dan suggests bullet points, highlights formatting inconsistencies, and helps rewrite weak sentences.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white font-bold">3</div>
                  <div>
                    <h4 className="font-bold text-slate-900">Audit & Download PDF</h4>
                    <p className="text-sm text-muted-foreground mt-1">Run an ATS compatibility scan to confirm all keywords are mapped correctly, and save to PDF.</p>
                  </div>
                </div>
              </div>
            </div>

            <Card className="rounded-[2.5rem] overflow-hidden border border-border/70 shadow-xl relative aspect-[4/3] bg-slate-950 flex items-center justify-center text-white">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.15),transparent_60%)]" />
              <div className="space-y-4 text-center z-10 p-8">
                <FileText className="h-16 w-16 text-primary mx-auto animate-pulse" />
                <h3 className="font-display text-2xl font-bold">Calm, Structured Workspace</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                  Our workspace splits formatting details and content writing, allowing you to edit text without destroying page breaks.
                </p>
                <div className="pt-2">
                  <Link
                    href="/signup"
                    className="inline-flex items-center justify-center rounded-xl bg-white text-slate-950 px-6 py-2.5 text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all"
                  >
                    Open Free Builder <ArrowRight className="ml-2 h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </Card>
          </section>

          {/* FAQs Accordion */}
          <section className="max-w-4xl mx-auto space-y-8">
            <div className="text-center space-y-4">
              <h2 className="font-display text-3xl font-bold sm:text-5xl text-slate-900">FAQ</h2>
              <p className="text-muted-foreground">Clear answers to help you navigate our free builder tool.</p>
            </div>

            <Accordion type="single" collapsible className="space-y-4 w-full">
              {faqItems.map((item, idx) => (
                <AccordionItem
                  key={idx}
                  value={`item-${idx}`}
                  className="rounded-3xl border border-border/80 bg-white px-6 shadow-sm overflow-hidden"
                >
                  <AccordionTrigger className="font-bold text-slate-900 py-5 hover:text-primary hover:no-underline transition-colors text-left">
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-slate-500 leading-relaxed pb-5 pt-1 border-t border-slate-50">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </section>

          {/* Bottom CTA Block */}
          <section className="relative overflow-hidden rounded-[3rem] p-8 sm:p-16 brand-gradient-bg text-white shadow-2xl text-center">
            <div className="relative z-10 max-w-3xl mx-auto space-y-6">
              <Badge variant="outline" className="border-white/30 text-white hover:bg-white/10 uppercase tracking-widest">
                Start Instantly
              </Badge>
              <h2 className="font-display text-4xl font-semibold tracking-tight sm:text-6xl">
                Ready to create your CV?
              </h2>
              <p className="text-lg text-white/80 max-w-xl mx-auto">
                No credit cards, no download limits. Get started with our professional resume editor today.
              </p>
              <div className="pt-4">
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center rounded-2xl bg-white px-8 py-3.5 text-base font-bold text-primary hover:bg-white/95 transition-all shadow-md"
                >
                  Start Building Now
                  <ChevronRight className="ml-2 h-5 w-5" />
                </Link>
              </div>
            </div>
          </section>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
