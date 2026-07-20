import Link from "next/link";
import { ArrowRight, Check, CheckCircle2, ChevronRight, FileText, LayoutTemplate, ScanSearch, Sparkles, Target } from "lucide-react";
import { PublicHeader } from "@/components/marketing/public-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { marketingHeaderItems } from "@/lib/marketing-nav";
import { absoluteUrl, createMetadata } from "@/lib/metadata";
import { siteConfig } from "@/lib/site";
import { PLANS } from "@/lib/plans";

const faqItems = [
  {
    question: "Is this CV builder suitable for ATS-friendly CVs?",
    answer:
      "Yes. AI Career Guide is built around readable layouts, structured sections, and CV formatting that stays friendly to applicant tracking systems.",
  },
  {
    question: "Can I use the CV builder on mobile?",
    answer:
      "Yes. You can edit CV content, use AI bullet suggestions, reorder sections, and preview your CV on mobile as well as desktop.",
  },
  {
    question: "Can I upload my existing CV first?",
    answer:
      "Yes. You can import an existing CV, clean it up in the editor, improve sections with AI, and switch templates without starting over.",
  },
  {
    question: "Does it also work as a resume builder?",
    answer:
      "Yes. The platform supports both CV and resume workflows, including editing, AI refinement, ATS checks, and job application tracking.",
  },
  {
    question: "Can I use this as a free CV editor?",
    answer:
      "Yes. You can start with the free plan and use the CV editor to write, reorder, refine, and preview your CV before upgrading for more advanced usage.",
  },
];

export const metadata = createMetadata({
  title: "Free AI CV Builder & Online CV Editor",
  description:
    "Use a free AI CV builder and CV editor to create a professional CV, improve bullet points, check ATS fit, and tailor your CV for real job applications.",
  path: "/cv-builder",
  keywords: [
    "CV builder",
    "AI CV builder",
    "free CV builder",
    "free CV editor",
    "online CV builder",
    "professional CV builder",
    "ATS friendly CV builder",
    "create a CV online",
    "build a CV",
    "CV maker",
  ],
});

export const revalidate = 86400;

export default function CvBuilderPage() {
  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: "CV Builder",
      url: absoluteUrl("/cv-builder"),
      description:
        "AI CV builder page for creating a professional CV, improving ATS fit, and tailoring applications inside AI Career Guide.",
      isPartOf: {
        "@type": "WebSite",
        name: siteConfig.name,
        url: siteConfig.url,
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: `${siteConfig.name} CV Builder`,
      applicationCategory: "BusinessApplication",
      applicationSubCategory: "CV Builder",
      operatingSystem: "Web",
      url: absoluteUrl("/cv-builder"),
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "GBP",
      },
      featureList: [
        "AI CV builder",
        "Resume builder",
        "ATS CV checker",
        "CV templates",
        "AI bullet suggestions",
        "Job application tracker",
      ],
      description:
        "Create, improve, and tailor CVs online with AI-assisted editing, ATS checks, template switching, and job search tools.",
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqItems.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.answer,
        },
      })),
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
          name: "CV Builder",
          item: absoluteUrl("/cv-builder"),
        },
      ],
    },
  ];

  return (
    <div className="career-home min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <PublicHeader items={marketingHeaderItems} ctaHref="/signup?intent=create-cv" ctaLabel="Build My CV Free" />

      <main id="main-content">
        {/* Hero Section */}
        <section className="career-hero">
          <div className="career-orb career-orb-a" />
          <div className="career-orb career-orb-b" />
          <div className="career-grid" />
          
          <div className="marketing-shell relative z-10 grid gap-10 pb-16 pt-14 lg:grid-cols-[0.88fr_1.12fr] lg:items-center lg:pb-24 lg:pt-20">
            <div className="hero-copy">
              <p className="career-kicker">
                <span />
                Free AI CV Builder
              </p>
              <h1 className="text-slate-900 dark:text-white">
                Create a professional CV. <em>With AI guidance.</em> Built for UK job seekers.
              </h1>
              <p className="hero-lede">
                AI Career Guide is a free CV builder and CV editor that helps you write stronger summaries, improve bullet points, switch templates, and tailor your CV to real jobs without losing structure.
              </p>
              
              <div className="hero-actions">
                <Link className="career-primary" href="/signup?intent=create-cv">
                  Build My CV Free <ArrowRight className="h-4 w-4" />
                </Link>
                <Link className="career-secondary" href="/signup?intent=upload-cv">
                  Upload My CV
                </Link>
              </div>
              
              <p className="hero-trust">
                <Check className="h-4 w-4 text-[#059c94] shrink-0" /> Free plan available <span /> No card required
              </p>
            </div>
            
            <CareerCanvas />
          </div>
        </section>

        {/* Workflow Section */}
        <Workflow />

        {/* Studio Section (Chapter 01) */}
        <section id="studio" className="studio-chapter">
          <div className="marketing-shell">
            <div className="chapter-intro">
              <p className="career-kicker">
                <span />
                01 · CV Studio
              </p>
              <h2>Your experience, transformed into evidence.</h2>
              <p>
                Write inside a focused document studio. Dan spots vague language, offers a stronger version, and keeps every edit yours to approve.
              </p>
            </div>

            <div className="studio-scene">
              <div className="studio-toolbar">
                <span className="studio-dots">● ● ●</span>
                <span>CV Studio / Operations Manager</span>
                <span>Saved just now</span>
              </div>
              
              <div className="studio-layout">
                <div className="studio-rail">
                  <b>Structure</b>
                  {["Profile", "Experience", "Education", "Skills"].map((x, i) => (
                    <span className={i === 1 ? "active" : ""} key={x}>
                      {i === 1 ? "◈" : "○"} {x}
                    </span>
                  ))}
                </div>
                
                <CVPaper />
                
                <div className="rewrite-panel">
                  <p className="panel-label">DAN · AI REWRITE</p>
                  <strong>Make this achievement specific</strong>
                  
                  <div className="rewrite-before">
                    <small>ORIGINAL</small>
                    <s>Responsible for improving team processes.</s>
                  </div>
                  
                  <div className="rewrite-after">
                    <small>SUGGESTED</small>
                    <p>Redesigned weekly planning across a 12-person team, cutting overdue work by 28%.</p>
                  </div>
                  
                  <div className="rewrite-actions">
                    <button className="px-3 py-1.5 text-xs rounded-md border border-slate-200">Dismiss</button>
                    <button className="px-3 py-1.5 text-xs text-white rounded-md bg-[#5141db]">Apply rewrite</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ATS Diagnostic Section (Chapter 02) */}
        <section id="ats" className="ats-chapter">
          <div className="ats-stars" />
          <div className="marketing-shell relative z-10 grid gap-12 lg:grid-cols-[0.65fr_1.35fr] lg:items-center">
            <div>
              <p className="career-kicker dark">
                <span />
                02 · ATS Diagnostic
              </p>
              <h2>See the signal recruiters’ systems see.</h2>
              <p className="chapter-copy-dark">
                Compare your CV against the role, understand keyword coverage, and leave with a precise action queue—not a mystery score.
              </p>
              <Link className="text-link-dark" href="/signup?intent=ats-check">
                Run an ATS check <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="diagnostic-console">
              <div className="score-module">
                <div className="score-ring">
                  <div>
                    <strong>82</strong>
                    <span>Strong match</span>
                  </div>
                </div>
                <p>Role alignment</p>
                <small>7 actions remain</small>
              </div>

              <div className="keyword-module">
                <div className="console-heading">
                  <span>KEYWORD COVERAGE</span>
                  <b>14 / 18</b>
                </div>
                {[
                  ["Stakeholder management", 92],
                  ["Forecasting", 86],
                  ["Process improvement", 78],
                  ["Budget ownership", 38],
                ].map(([x, n]) => (
                  <div className="keyword-row" key={x as string}>
                    <div>
                      <span>{x}</span>
                      <small>{n}%</small>
                    </div>
                    <i>
                      <b style={{ width: `${n}%` }} />
                    </i>
                  </div>
                ))}
              </div>

              <div className="action-module">
                <span>PRIORITY ACTION</span>
                <strong>Add budget ownership evidence</strong>
                <p>The job description mentions this twice. Add a truthful example if you have one.</p>
                <button className="flex items-center gap-1 text-[#89e7df] font-bold">
                  Open in editor <ChevronRight className="h-3 w-3" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Templates Section (Chapter 03) */}
        <Templates />

        {/* Pricing Section */}
        <Pricing />

        {/* FAQ Section */}
        <section className="faq-chapter">
          <div className="marketing-shell grid gap-10 lg:grid-cols-[0.7fr_1.3fr]">
            <div>
              <p className="career-kicker">
                <span />
                Before you begin
              </p>
              <h2>A few useful answers.</h2>
            </div>
            
            <Accordion type="single" collapsible className="w-full">
              {faqItems.map((item, i) => (
                <AccordionItem key={item.question} value={`${i}`}>
                  <AccordionTrigger className="text-left text-base">{item.question}</AccordionTrigger>
                  <AccordionContent className="text-base leading-7 text-slate-600">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        {/* Call to Action Section */}
        <section className="final-command">
          <div className="marketing-shell">
            <div className="final-inner">
              <div className="command-grid" />
              <p>YOUR NEXT MOVE</p>
              <h2>Turn your next application into your strongest one.</h2>
              <span>Build for free. Keep control of every word.</span>
              <Link href="/signup?intent=create-cv">
                Enter your CV Studio <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

/* Local UI Helpers */

function CareerCanvas() {
  return (
    <div className="career-canvas" aria-label="Career workspace preview">
      <div className="canvas-top">
        <div>
          <span className="status-dot" />
          CAREER CANVAS
        </div>
        <span>Operations Manager · Draft 3</span>
      </div>
      
      <div className="canvas-body">
        <div className="dan-float">
          <div className="dan-avatar">D</div>
          <div>
            <small>DAN · CAREER AGENT</small>
            <strong>3 ways to sharpen this CV</strong>
            <p>I found one vague achievement and two missing role keywords.</p>
          </div>
        </div>
        
        <CVPaper />
        
        <div className="ats-float">
          <div className="mini-ring">
            <b>82</b>
          </div>
          <div>
            <small>ATS MATCH</small>
            <strong>Strong foundation</strong>
            <span>14 of 18 keywords covered</span>
          </div>
        </div>
        
        <div className="diff-float">
          <small>AI REWRITE · READY</small>
          <s>Managed a busy team...</s>
          <p>Led a 12-person team across three delivery streams...</p>
          <button>
            Review change <ChevronRight className="h-3 w-3" />
          </button>
        </div>
      </div>
      
      <div className="pipeline-strip">
        <span>
          <i />
          CV strengthened
        </span>
        <b>→</b>
        <span>
          <i />
          ATS checked
        </span>
        <b>→</b>
        <span className="next">
          <i />
          Next: tailor to role
        </span>
      </div>
    </div>
  );
}

function CVPaper() {
  return (
    <div className="cv-paper">
      <div className="cv-name">ALEX MORGAN</div>
      <div className="cv-role">OPERATIONS MANAGER</div>
      <div className="cv-contact">London · alex@email.com · 07•• ••• •••</div>
      
      <div className="cv-section">
        <b>PROFILE</b>
        <p>Operations leader with experience improving delivery systems, team performance and cross-functional planning.</p>
      </div>
      
      <div className="cv-section">
        <b>EXPERIENCE</b>
        <strong>Senior Operations Manager</strong>
        <small>Northstar Group · 2021—Present</small>
        <p>• Redesigned weekly planning across a 12-person team, cutting overdue work by 28%.</p>
        <p>• Built forecasting dashboards used by three department leads.</p>
      </div>
      
      <div className="cv-section muted-lines">
        <b>EARLIER EXPERIENCE</b>
        <i />
        <i />
        <i />
      </div>
    </div>
  );
}

function Workflow() {
  return (
    <section className="workflow">
      <div className="marketing-shell">
        <p className="workflow-label">ONE CONNECTED WORKFLOW</p>
        <div className="workflow-rail" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
          {[
            ["01", "Build", "Shape your experience"],
            ["02", "Diagnose", "Find the gaps"],
            ["03", "Tailor", "Match the target role"],
          ].map(([n, t, c]) => (
            <div className={n === "01" ? "active" : ""} key={t}>
              <span>{n}</span>
              <p>
                <strong>{t}</strong>
                <small>{c}</small>
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const templateCovers = [
  { name: "Executive", fit: "Leadership & finance", style: "executive", badge: "Recruiter ready" },
  { name: "Modern", fit: "Product & technology", style: "modern", badge: "ATS safe" },
  { name: "Editorial", fit: "Creative & communications", style: "editorial", badge: "Recruiter ready" },
  { name: "Precision", fit: "Operations & consulting", style: "precision", badge: "ATS safe" },
];

function TemplateDocument({ style }: { style: string }) {
  return (
    <div className={`cv-cover cv-cover-${style}`} aria-hidden="true" style={{ fontFamily: "var(--font-plus-jakarta-sans)" }}>
      <div className="cv-cover-sidebar">
        <div className="cv-cover-monogram">AM</div>
        <div className="cv-cover-side-block">
          <b>CONTACT</b>
          <span>London, UK</span>
          <span>alex.morgan@email.com</span>
          <span>+44 7700 900 123</span>
        </div>
        <div className="cv-cover-side-block">
          <b>EXPERTISE</b>
          <span>Strategy & planning</span>
          <span>Team leadership</span>
          <span>Process design</span>
          <span>Commercial growth</span>
        </div>
      </div>
      
      <div className="cv-cover-main">
        <header>
          <p className="cv-cover-eyebrow">OPERATIONS LEADER</p>
          <h3>Alex Morgan</h3>
          <p className="cv-cover-contact">London, UK&nbsp;&nbsp;•&nbsp;&nbsp;alex.morgan@email.com&nbsp;&nbsp;•&nbsp;&nbsp;+44 7700 900 123</p>
        </header>
        
        <section>
          <h4>Profile</h4>
          <p>Operations leader with 8+ years building high-performing teams and scalable systems across fast-growth organisations.</p>
        </section>
        
        <section>
          <h4>Experience</h4>
          <div className="cv-cover-role">
            <div>
              <strong>Senior Operations Manager</strong>
              <small>Northstar Group · London</small>
            </div>
            <time>2021—Present</time>
          </div>
          <ul>
            <li>Led a 12-person team across three delivery streams, improving on-time delivery by 28%.</li>
            <li>Built forecasting systems adopted by three departments and the executive team.</li>
          </ul>
        </section>
      </div>
    </div>
  );
}

function Templates() {
  return (
    <section className="templates-chapter">
      <div className="marketing-shell">
        <div className="template-heading">
          <div>
            <p className="career-kicker">
              <span />
              Designed to get noticed
            </p>
            <h2>Choose the CV recruiters remember.</h2>
          </div>
          <p>
            Your content stays intact while you explore a new look. Switch designs in one click—without rewriting a single section.
          </p>
        </div>
        
        <div className="template-runway" aria-label="CV template previews">
          {templateCovers.map((template) => (
            <article className="template-card" key={template.name}>
              <Link className="template-cover-link" href="/signup?intent=create-cv" aria-label={`Use the ${template.name} CV template`}>
                <span className="template-badge">
                  <Check className="h-2 w-2 text-emerald-600" />
                  {template.badge}
                </span>
                <TemplateDocument style={template.style} />
                <span className="template-use">
                  Use this template <ArrowRight className="h-3 w-3" />
                </span>
              </Link>
              
              <div className="template-meta">
                <div>
                  <h3>{template.name}</h3>
                  <p>{template.fit}</p>
                </div>
                <span>A4 · 2 pages</span>
              </div>
            </article>
          ))}
        </div>
        
        <Link className="template-link" href="/cv-templates">
          Explore all CV templates <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}

function Pricing() {
  return (
    <section className="pricing-chapter">
      <div className="marketing-shell">
        <div className="pricing-head">
          <div>
            <p className="career-kicker">
              <span />
              Choose your pace
            </p>
            <h2>Start free. Scale when your search does.</h2>
          </div>
          <Link href="/pricing" className="flex items-center gap-1 text-[#5143cf] font-bold">
            Compare every feature <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        
        <div className="pricing-rail">
          {[PLANS.free, PLANS.pro, PLANS.master].map((p, i) => (
            <article className={i === 1 ? "featured" : ""} key={p.id}>
              {i === 1 && <span className="popular">MOST POPULAR</span>}
              <p>{p.name}</p>
              <h3>
                {p.price}
                <small>{p.price !== "£0" ? " / month" : " forever"}</small>
              </h3>
              
              <ul>
                {p.features.slice(0, 4).map((x) => (
                  <li key={x}>
                    <Check className="h-3 w-3 text-emerald-500 shrink-0 inline-block mr-1" />
                    {x}
                  </li>
                ))}
              </ul>
              
              <Link href={`/signup?intent=select-plan&plan=${p.id}`} className="mt-4 flex items-center justify-center gap-1 font-bold">
                {i === 0 ? "Start free" : `Choose ${p.name}`} <ArrowRight className="h-3 w-3" />
              </Link>
            </article>
          ))}
        </div>
        
        <p className="agency-line">
          <b>Career organisation or hiring team?</b> Agency support is scoped separately. <Link href="/pricing">View Agency</Link>
        </p>
      </div>
    </section>
  );
}
