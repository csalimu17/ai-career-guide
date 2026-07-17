import Link from "next/link";
import { ArrowRight, Check, FileSearch, LayoutTemplate, ShieldCheck, Sparkles } from "lucide-react";
import { PublicHeader } from "@/components/marketing/public-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { PricingPlanCard } from "@/components/marketing/pricing-plan-card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { marketingHeaderItems } from "@/lib/marketing-nav";
import { PLANS } from "@/lib/plans";
import { absoluteUrl, createMetadata } from "@/lib/metadata";

export const metadata = createMetadata({
  title: "AI CV Builder for UK Job Seekers | AI Career Guide",
  description: "Build a stronger UK CV, check it against job descriptions and apply with confidence. Start free or upload your existing CV.",
  path: "/",
  keywords: ["AI CV builder UK", "free CV builder UK", "ATS CV checker", "CV templates"],
});

const faq = [
  ["Can I use my existing CV?", "Yes. Upload your current CV and continue in the editor without starting again."],
  ["Is there a free plan?", "Yes. The Free plan includes one CV, three ATS scans, five AI generations and five ATS-safe templates."],
  ["Will the templates work with ATS software?", "The templates use clear structure and restrained layouts designed to remain readable by applicant tracking systems."],
  ["Do I need to be good at writing?", "No. The guided builder helps turn responsibilities into specific evidence while keeping you in control of the final wording."],
];

export default function Home() {
  const structuredData = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faq.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) };
  return <div className="min-h-screen bg-[#fbfaf7]">
    <PublicHeader items={marketingHeaderItems} />
    <main id="main-content">
      <section className="marketing-section overflow-hidden border-b border-slate-200/80 pt-12 sm:pt-20">
        <div className="marketing-shell grid items-center gap-12 lg:grid-cols-[.9fr_1.1fr] lg:gap-16">
          <div className="max-w-2xl pb-14 sm:pb-20">
            <p className="marketing-kicker">AI CV builder for UK job seekers</p>
            <h1 className="marketing-title mt-5">Build a stronger CV. Match more jobs. Apply with confidence.</h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">Turn your experience into clear, specific evidence, tailor it to the role and keep every application moving in one calm workspace.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button size="lg" asChild><Link href="/signup?intent=create-cv">Build My CV Free <ArrowRight className="h-4 w-4" /></Link></Button>
              <Button size="lg" variant="outline" asChild><Link href="/signup?intent=upload-cv">Upload My CV</Link></Button>
            </div>
            <p className="mt-4 flex items-center gap-2 text-sm font-medium text-slate-600"><Check className="h-4 w-4 text-teal-600" /> Free plan available. No payment details to start.</p>
          </div>
          <ProductProof />
        </div>
      </section>

      <section className="border-b border-slate-200 bg-white py-6">
        <div className="marketing-shell grid gap-4 text-sm text-slate-700 sm:grid-cols-3">
          <p className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-purple-700" /> Your CV stays private to your account</p>
          <p className="flex items-center gap-2"><FileSearch className="h-5 w-5 text-teal-700" /> Compare against a real job description</p>
          <p className="flex items-center gap-2"><LayoutTemplate className="h-5 w-5 text-coral-700" /> Switch layouts without rewriting content</p>
        </div>
      </section>

      <section id="product" className="marketing-section">
        <div className="marketing-shell">
          <Heading kicker="A clear way forward" title="From first draft to focused application in three steps." copy="Start with what you have. The workspace keeps the process structured and shows you the next useful action." />
          <div className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-slate-200 bg-slate-200 md:grid-cols-3">
            {[['01','Bring your experience','Build from guided prompts or upload your current CV.'],['02','Make the evidence stronger','Clarify outcomes, remove vague wording and tailor important keywords.'],['03','Check before you apply','Compare the finished CV with the role and export when it is ready.']].map(([n,t,c]) => <article key={n} className="bg-white p-7 lg:p-9"><span className="font-display text-sm font-semibold text-purple-700">{n}</span><h3 className="mt-8 font-display text-xl font-semibold text-slate-950">{t}</h3><p className="mt-3 leading-7 text-slate-600">{c}</p></article>)}
          </div>
        </div>
      </section>

      <section className="marketing-section bg-slate-950 text-white">
        <div className="marketing-shell grid gap-12 lg:grid-cols-2 lg:items-center">
          <Heading dark kicker="Better applications" title="Good CV advice becomes useful when it is built into the work." copy="Move from general responsibilities to credible evidence, then check structure and role fit without juggling documents and tabs." />
          <ul className="grid gap-5 sm:grid-cols-2">
            {['Write clearer achievement bullets','Find missing role keywords','Keep formatting consistent','Prepare cover letters and interviews'].map(x => <li key={x} className="border-t border-white/20 pt-5 text-lg"><Check className="mb-4 h-5 w-5 text-teal-300" />{x}</li>)}
          </ul>
        </div>
      </section>

      <section className="marketing-section">
        <div className="marketing-shell grid gap-10 lg:grid-cols-[.75fr_1.25fr] lg:items-end">
          <Heading kicker="Templates" title="Professional structure, without design guesswork." copy="Choose a clear layout, preserve your selected template through signup and change it later without re-entering your experience." />
          <div className="grid grid-cols-3 gap-3" aria-label="CV template examples">
            {['Classic','Modern','Compact'].map((x,i) => <div key={x} className="template-mini"><div className={i===1?'bg-teal-600':'bg-purple-700'} /><span>{x}</span></div>)}
          </div>
        </div>
        <div className="marketing-shell mt-8"><Button variant="outline" asChild><Link href="/cv-templates">Explore CV templates <ArrowRight className="h-4 w-4" /></Link></Button></div>
      </section>

      <section className="marketing-section border-y border-slate-200 bg-white">
        <div className="marketing-shell grid gap-10 lg:grid-cols-2 lg:items-center">
          <div className="rounded-2xl border border-slate-200 bg-[#fbfaf7] p-7"><div className="flex justify-between border-b border-slate-200 pb-5"><strong>Role match</strong><strong className="text-teal-700">Focused review</strong></div><div className="mt-6 flex flex-wrap gap-2">{['stakeholder management','forecasting','process improvement','team leadership'].map((x,i)=><span key={x} className={`rounded-md px-3 py-2 text-sm ${i<3?'bg-teal-50 text-teal-800':'bg-coral-50 text-coral-800'}`}>{x}</span>)}</div><p className="mt-6 text-sm leading-6 text-slate-600">The checker highlights relevant terms and gaps. It does not promise a hiring outcome or invent experience.</p></div>
          <Heading kicker="ATS checker" title="See how well your CV speaks to the role." copy="Paste a job description to compare relevant language, identify gaps and make a more deliberate final edit." />
        </div>
      </section>

      <section className="marketing-section"><div className="marketing-shell"><Heading kicker="Plans" title="Start free. Upgrade when your search needs more volume." copy="Exact limits make it easy to compare. Agency support is available separately for organisations." /><div className="mt-10 grid gap-4 lg:grid-cols-3 [&>article]:max-sm:p-5">{[PLANS.free,PLANS.pro,PLANS.master].map(p=><PricingPlanCard key={p.id} plan={{...p,features:p.features.slice(0,4)}}/>)}</div><div className="mt-5 flex flex-col gap-3 border-l-4 border-teal-600 bg-white p-5 sm:flex-row sm:items-center sm:justify-between"><p><strong>Hiring team or career organisation?</strong> Agency support is scoped separately.</p><Link className="shrink-0 font-semibold text-purple-700 underline" href="/pricing">Compare all plans</Link></div></div></section>

      <section className="marketing-section border-y border-slate-200 bg-white"><div className="marketing-shell grid gap-10 lg:grid-cols-[.7fr_1.3fr]"><Heading kicker="Questions" title="A few things worth knowing before you start." /><Accordion type="single" collapsible>{faq.map(([q,a],i)=><AccordionItem key={q} value={`${i}`}><AccordionTrigger className="text-left text-base">{q}</AccordionTrigger><AccordionContent className="text-base leading-7 text-slate-600">{a}</AccordionContent></AccordionItem>)}</Accordion></div></section>
      <section className="marketing-section"><div className="marketing-shell rounded-2xl bg-purple-700 px-6 py-14 text-center text-white sm:px-12"><Sparkles className="mx-auto h-6 w-6 text-teal-200"/><h2 className="mx-auto mt-5 max-w-3xl font-display text-3xl font-semibold sm:text-4xl">Your next application can start with a stronger CV.</h2><p className="mt-4 text-purple-100">Build for free, save your work and improve it at your pace.</p><Button className="mt-8 bg-white text-purple-800 hover:bg-slate-100" size="lg" asChild><Link href="/signup?intent=create-cv">Build My CV Free</Link></Button></div></section>
    </main><SiteFooter /><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(structuredData)}} />
  </div>;
}

function Heading({kicker,title,copy,dark=false}:{kicker:string;title:string;copy?:string;dark?:boolean}) { return <div className="max-w-2xl"><p className={`marketing-kicker ${dark?'!text-teal-300':''}`}>{kicker}</p><h2 className={`mt-4 font-display text-3xl font-semibold tracking-tight sm:text-4xl ${dark?'text-white':'text-slate-950'}`}>{title}</h2>{copy&&<p className={`mt-5 text-base leading-7 ${dark?'text-slate-300':'text-slate-600'}`}>{copy}</p>}</div> }
function ProductProof(){return <div className="relative self-end rounded-t-2xl border border-b-0 border-slate-300 bg-white p-4 shadow-[0_24px_70px_-35px_rgba(15,23,42,.35)] sm:p-6"><div className="mb-5 flex items-center justify-between border-b border-slate-200 pb-4"><div><p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Experience · Operations Manager</p><p className="mt-1 font-display font-semibold text-slate-900">Strengthen this bullet</p></div><span className="rounded-md bg-teal-50 px-2 py-1 text-xs font-semibold text-teal-800">Evidence added</span></div><div className="grid gap-3 md:grid-cols-2"><div className="rounded-xl bg-slate-100 p-5"><span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Before</span><p className="mt-4 leading-7 text-slate-700">Responsible for improving team processes and managing stakeholder relationships.</p></div><div className="rounded-xl border border-purple-200 bg-purple-50/60 p-5"><span className="text-xs font-semibold uppercase tracking-wider text-purple-700">Stronger draft</span><p className="mt-4 leading-7 text-slate-800">Redesigned weekly planning across a 12-person team, cutting overdue work by 28% while giving three department leads clearer delivery forecasts.</p></div></div><div className="mt-4 flex flex-wrap gap-2 text-xs"><span className="rounded-md bg-slate-100 px-2.5 py-1.5">process improvement</span><span className="rounded-md bg-slate-100 px-2.5 py-1.5">stakeholder management</span><span className="rounded-md bg-coral-50 px-2.5 py-1.5 text-coral-800">measurable outcome</span></div></div>}
