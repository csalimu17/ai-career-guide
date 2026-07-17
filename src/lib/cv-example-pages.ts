export type CvExamplePage = {
  slug: string;
  role: string;
  title: string;
  description: string;
  keywords: string[];
  proof: string[];
  profile: string;
  sections: {
    title: string;
    body: string;
    bullets: string[];
  }[];
  examples: {
    title: string;
    body: string;
    bullets: string[];
  }[];
  faqs: {
    question: string;
    answer: string;
  }[];
};

export const CV_EXAMPLE_PAGES: CvExamplePage[] = [
  {
    slug: "software-engineer-cv-example",
    role: "Software Engineer",
    title: "Software engineer CV example for UK tech roles.",
    description:
      "Use this software engineer CV example to structure technical skills, projects, impact metrics, and ATS keywords for UK developer jobs.",
    keywords: ["software engineer CV example", "software developer CV UK", "developer CV example", "tech CV example", "programmer CV UK"],
    proof: ["ATS-friendly developer structure", "Technical skills grouped clearly", "Impact-led engineering bullets"],
    profile:
      "Software engineer with experience building reliable web applications, improving system performance, and shipping user-facing features with React, TypeScript, Node.js, and cloud services.",
    sections: [
      {
        title: "Lead with the stack recruiters scan for",
        body: "UK tech recruiters often skim for language, framework, cloud, testing, and delivery signals before reading the full CV.",
        bullets: ["Group skills by frontend, backend, cloud, testing, and tooling", "Put strongest commercial technologies in the first half of the CV", "Avoid long unranked lists of every tool used once"],
      },
      {
        title: "Turn engineering work into outcomes",
        body: "A strong software engineer CV explains what changed because of your work, not only what technology you used.",
        bullets: ["Mention latency, reliability, conversion, cost, or deployment frequency improvements", "Show ownership across discovery, implementation, testing, and release", "Use project scope where metrics are unavailable"],
      },
      {
        title: "Make projects credible",
        body: "Projects work best when they describe the user problem, your architecture choices, and the result.",
        bullets: ["Name the product area or user workflow", "Include testing, accessibility, security, or observability where relevant", "Link GitHub or portfolio only when it helps the application"],
      },
    ],
    examples: [
      {
        title: "Profile example",
        body: "Software engineer with 4 years of experience delivering SaaS features in React, TypeScript, Node.js, and PostgreSQL, with recent work improving onboarding performance and release reliability.",
        bullets: ["Names seniority", "Includes stack", "Connects work to product outcomes"],
      },
      {
        title: "Achievement bullet",
        body: "Reduced dashboard load time by 38% by splitting heavy bundles, optimising API queries, and adding route-level caching for high-traffic customer pages.",
        bullets: ["Starts with measurable impact", "Shows technical method", "Uses language ATS systems understand"],
      },
      {
        title: "Skills section",
        body: "Frontend: React, Next.js, TypeScript, Tailwind. Backend: Node.js, REST APIs, PostgreSQL. Quality: Jest, Playwright, CI/CD, accessibility testing.",
        bullets: ["Grouped for scanability", "Relevant to UK tech roles", "No filler soft-skill list"],
      },
    ],
    faqs: [
      {
        question: "How long should a software engineer CV be in the UK?",
        answer: "Most UK software engineer CVs should be two pages, unless you are very early career or applying for an academic-style technical role.",
      },
      {
        question: "Should I include every programming language I know?",
        answer: "No. Prioritise the languages and frameworks relevant to the target role, especially those you have used commercially or in strong portfolio projects.",
      },
      {
        question: "Do software engineer CVs need projects?",
        answer: "Projects are useful for graduates, career changers, and developers with limited commercial experience. Experienced engineers should prioritise work impact first.",
      },
    ],
  },
  {
    slug: "data-analyst-cv-example",
    role: "Data Analyst",
    title: "Data analyst CV example for UK analytics jobs.",
    description:
      "Build a stronger data analyst CV with examples for SQL, dashboards, commercial impact, stakeholder work, and ATS-friendly analytics keywords.",
    keywords: ["data analyst CV example", "data analyst CV UK", "analytics CV example", "SQL CV example", "Power BI CV UK"],
    proof: ["SQL and dashboard evidence", "Commercial insight bullets", "ATS analytics keyword coverage"],
    profile:
      "Data analyst with experience turning operational, product, and customer data into clear dashboards, decision-ready insights, and measurable process improvements.",
    sections: [
      {
        title: "Show the decision your analysis supported",
        body: "Hiring managers want analysts who influence decisions, not only produce reports.",
        bullets: ["Name the business question or operational problem", "Explain the dataset, tool, or method", "Show what changed after the analysis"],
      },
      {
        title: "Make technical skills easy to verify",
        body: "Put SQL, Excel, Python, BI tools, and data modelling skills in a clean section that matches job descriptions.",
        bullets: ["Separate tools from methods", "Include dashboard platforms used in real work", "Avoid vague phrases such as data-driven mindset"],
      },
      {
        title: "Balance insight and stakeholder communication",
        body: "A strong UK data analyst CV proves you can explain findings to non-technical teams.",
        bullets: ["Mention stakeholder groups", "Use plain-language outcomes", "Include repeatable reporting or automation work"],
      },
    ],
    examples: [
      {
        title: "Profile example",
        body: "Data analyst with 3 years of experience using SQL, Power BI, Excel, and Python to automate reporting, identify revenue leakage, and support trading and operations decisions.",
        bullets: ["Clear tools", "Commercial scope", "Outcome-led"],
      },
      {
        title: "Achievement bullet",
        body: "Built a Power BI trading dashboard that reduced weekly manual reporting by 6 hours and gave regional managers daily visibility into margin variance.",
        bullets: ["Quantified time saved", "Names the user", "Shows business value"],
      },
      {
        title: "Skills section",
        body: "SQL, Power BI, Tableau, Excel, Python, Pandas, data cleansing, cohort analysis, KPI reporting, dashboard design, stakeholder presentation.",
        bullets: ["Keyword-rich", "Relevant to ATS", "Still readable"],
      },
    ],
    faqs: [
      {
        question: "What should a data analyst CV include?",
        answer: "Include a profile, technical skills, analytics achievements, dashboard or reporting examples, work experience, education, and relevant certifications.",
      },
      {
        question: "Should I put SQL projects on my CV?",
        answer: "Yes, especially if you are early career. Describe the business question, the data source, your SQL approach, and the insight or output.",
      },
      {
        question: "Is Power BI or Tableau better for a UK data analyst CV?",
        answer: "Both are valuable. Match the tool listed in the job description and show evidence of dashboards that supported real decisions.",
      },
    ],
  },
  {
    slug: "project-manager-cv-example",
    role: "Project Manager",
    title: "Project manager CV example for UK delivery roles.",
    description:
      "Use this UK project manager CV example to present delivery scope, budgets, risks, stakeholders, Agile experience, and measurable outcomes.",
    keywords: ["project manager CV example", "project manager CV UK", "delivery manager CV", "Agile project manager CV", "PM CV example"],
    proof: ["Delivery impact examples", "Stakeholder and risk wording", "Agile and Prince2 keyword coverage"],
    profile:
      "Project manager with experience delivering cross-functional change, coordinating stakeholders, managing risks, and keeping complex workstreams on track.",
    sections: [
      {
        title: "Quantify delivery scale",
        body: "Project manager CVs become stronger when they show budgets, teams, timeframes, vendors, users, or workstreams.",
        bullets: ["Include project size and business area", "Mention delivery method where relevant", "Use dates and outcomes to prove control"],
      },
      {
        title: "Show risk and stakeholder ownership",
        body: "Recruiters look for evidence that you can manage ambiguity, blockers, and competing priorities.",
        bullets: ["Mention steering groups or senior stakeholders", "Describe risk, dependency, and issue management", "Show how you kept delivery moving"],
      },
      {
        title: "Match methodology to the role",
        body: "Use Agile, Scrum, Prince2, waterfall, or hybrid language only where it reflects your actual experience and the target job.",
        bullets: ["Put certifications near the skills section", "Show tools such as Jira, MS Project, or Monday.com", "Avoid method buzzwords without delivery proof"],
      },
    ],
    examples: [
      {
        title: "Profile example",
        body: "Project manager with 6 years of experience delivering digital, operations, and process improvement projects across multi-disciplinary teams using Agile and hybrid delivery methods.",
        bullets: ["Seniority", "Scope", "Delivery methods"],
      },
      {
        title: "Achievement bullet",
        body: "Delivered a 9-month CRM migration across sales and support teams, coordinating 12 stakeholders and completing rollout 3 weeks ahead of plan.",
        bullets: ["Timeline", "Stakeholder scale", "Outcome"],
      },
      {
        title: "Skills section",
        body: "Project planning, RAID management, stakeholder engagement, Agile delivery, budget tracking, Jira, MS Project, change control, governance reporting.",
        bullets: ["Matches PM roles", "Clear ATS terms", "No generic padding"],
      },
    ],
    faqs: [
      {
        question: "How do I write a UK project manager CV?",
        answer: "Lead with delivery scope, project types, stakeholder level, methods used, and measurable outcomes such as savings, timelines, adoption, or risk reduction.",
      },
      {
        question: "Should I include Prince2 on a project manager CV?",
        answer: "Include Prince2 if you have the certification or direct experience, especially for public sector, finance, and structured governance roles.",
      },
      {
        question: "What metrics should project managers use on a CV?",
        answer: "Use budget size, delivery timeline, team size, number of stakeholders, adoption rate, cost savings, defects reduced, or time saved.",
      },
    ],
  },
  {
    slug: "marketing-manager-cv-example",
    role: "Marketing Manager",
    title: "Marketing manager CV example for UK growth roles.",
    description:
      "Create a marketing manager CV that highlights campaigns, channels, revenue impact, brand work, analytics, and conversion improvements.",
    keywords: ["marketing manager CV example", "marketing CV UK", "digital marketing CV example", "growth marketing CV", "marketing CV template"],
    proof: ["Campaign metrics", "Channel and tooling keywords", "Growth and brand positioning"],
    profile:
      "Marketing manager with experience planning multi-channel campaigns, improving conversion journeys, managing content and paid channels, and reporting commercial performance.",
    sections: [
      {
        title: "Lead with channel ownership",
        body: "Marketing CVs should make it obvious which channels, audiences, budgets, and funnel stages you have owned.",
        bullets: ["Separate paid, organic, email, content, and lifecycle experience", "Name analytics and CRM tools", "Avoid broad claims without channel proof"],
      },
      {
        title: "Use metrics that connect to growth",
        body: "Good marketing bullets show performance changes across traffic, conversion, pipeline, retention, or revenue.",
        bullets: ["Use baseline and uplift where possible", "Mention budget or audience size", "Tie campaigns to commercial goals"],
      },
      {
        title: "Balance strategy with execution",
        body: "UK marketing manager roles often require both planning and hands-on delivery.",
        bullets: ["Show campaign planning", "Show copy, content, or creative management", "Show reporting and optimisation"],
      },
    ],
    examples: [
      {
        title: "Profile example",
        body: "Marketing manager with 5 years of B2B SaaS experience across content, SEO, email, paid social, and lifecycle campaigns, with a track record of improving qualified pipeline.",
        bullets: ["Audience", "Channels", "Commercial outcome"],
      },
      {
        title: "Achievement bullet",
        body: "Increased organic demo requests by 42% by rebuilding comparison pages, improving internal links, and refreshing high-intent content around buyer objections.",
        bullets: ["Outcome first", "SEO and CRO detail", "Relevant to growth roles"],
      },
      {
        title: "Skills section",
        body: "SEO, GA4, HubSpot, paid social, lifecycle email, CRO, content strategy, campaign planning, landing pages, reporting, stakeholder management.",
        bullets: ["Tool and channel mix", "ATS readable", "Specific enough for UK roles"],
      },
    ],
    faqs: [
      {
        question: "What should a marketing manager CV focus on?",
        answer: "Focus on channel ownership, campaign results, budget responsibility, tools, audience knowledge, and how your work improved pipeline, revenue, or conversion.",
      },
      {
        question: "Should I include marketing tools on my CV?",
        answer: "Yes. Include relevant tools such as GA4, HubSpot, Salesforce, Mailchimp, Klaviyo, Meta Ads, Google Ads, Ahrefs, Semrush, or CMS platforms.",
      },
      {
        question: "How do I show marketing impact without revenue data?",
        answer: "Use proxy metrics such as qualified leads, conversion rate, organic traffic, email engagement, cost per lead, retention, or time saved.",
      },
    ],
  },
  {
    slug: "finance-analyst-cv-example",
    role: "Finance Analyst",
    title: "Finance analyst CV example for UK finance teams.",
    description:
      "Use this finance analyst CV example to highlight forecasting, variance analysis, reporting, Excel, modelling, stakeholder support, and commercial insight.",
    keywords: ["finance analyst CV example", "financial analyst CV UK", "FP&A CV example", "accounting analyst CV", "finance CV UK"],
    proof: ["Forecasting and variance wording", "Excel and modelling keywords", "Commercial finance examples"],
    profile:
      "Finance analyst with experience in forecasting, management reporting, variance analysis, and commercial insight for operational and leadership teams.",
    sections: [
      {
        title: "Prioritise reporting and analysis outcomes",
        body: "A finance analyst CV should show how your work improved visibility, planning, controls, or commercial decisions.",
        bullets: ["Mention P&L, cash flow, budgets, or forecasts where relevant", "Use month-end and reporting cadence language", "Show stakeholder groups supported"],
      },
      {
        title: "Make Excel and modelling credible",
        body: "Excel is expected, so show depth through models, automation, scenario planning, or reconciliations.",
        bullets: ["Mention Power Query, pivots, VBA, or modelling only if accurate", "Show time saved or error reduction", "Include BI or ERP systems where relevant"],
      },
      {
        title: "Connect numbers to decisions",
        body: "Finance teams value analysts who explain the implication behind the variance.",
        bullets: ["Use commercial language", "Explain drivers, not just reports", "Show recommendations or decision support"],
      },
    ],
    examples: [
      {
        title: "Profile example",
        body: "Finance analyst with 4 years of experience supporting budgeting, forecasting, month-end reporting, and variance analysis across multi-site operations.",
        bullets: ["Relevant finance cycle", "Clear scope", "UK hiring language"],
      },
      {
        title: "Achievement bullet",
        body: "Automated weekly margin reporting in Excel and Power Query, reducing manual preparation by 5 hours and improving branch-level variance visibility.",
        bullets: ["Tool", "Time saved", "Business insight"],
      },
      {
        title: "Skills section",
        body: "Forecasting, budgeting, variance analysis, Excel, Power Query, financial modelling, month-end reporting, P&L analysis, ERP systems, stakeholder reporting.",
        bullets: ["FP&A keywords", "ATS friendly", "Specific and credible"],
      },
    ],
    faqs: [
      {
        question: "What should a finance analyst CV include?",
        answer: "Include a profile, finance skills, reporting and forecasting achievements, systems experience, work history, education, and qualifications such as ACCA or CIMA if relevant.",
      },
      {
        question: "Should I include Excel on a finance CV?",
        answer: "Yes, but show the level of Excel work through models, automation, Power Query, pivots, scenario analysis, or reconciliations.",
      },
      {
        question: "How do I show finance impact on a CV?",
        answer: "Use outcomes such as improved forecast accuracy, reduced reporting time, clearer margin visibility, cost savings, or better control over variances.",
      },
    ],
  },
  {
    slug: "nurse-cv-example",
    role: "Nurse",
    title: "Nurse CV example for UK healthcare applications.",
    description:
      "Write a stronger UK nurse CV with examples for clinical skills, NMC registration, patient care, ward experience, safeguarding, and NHS applications.",
    keywords: ["nurse CV example", "nursing CV UK", "NHS nurse CV", "registered nurse CV example", "healthcare CV example"],
    proof: ["NHS-friendly structure", "Clinical skill examples", "Registration and compliance signals"],
    profile:
      "Registered nurse with experience delivering safe patient care, coordinating multidisciplinary communication, maintaining accurate records, and supporting ward standards.",
    sections: [
      {
        title: "Put registration and clinical area early",
        body: "Healthcare recruiters need to see NMC status, clinical setting, and core competencies quickly.",
        bullets: ["Include NMC registration where applicable", "Name wards, specialties, or patient groups", "Keep mandatory training and certifications clear"],
      },
      {
        title: "Show safe care and communication",
        body: "Strong nurse CVs show judgement, documentation, safeguarding awareness, and teamwork.",
        bullets: ["Mention care planning and escalation", "Show multidisciplinary collaboration", "Use patient safety and record-keeping language"],
      },
      {
        title: "Reflect the job description",
        body: "NHS and private healthcare adverts often list specific competencies. Your CV should mirror relevant ones accurately.",
        bullets: ["Match clinical skills to the vacancy", "Include systems such as EPR if used", "Avoid overloading the CV with unrelated placements"],
      },
    ],
    examples: [
      {
        title: "Profile example",
        body: "NMC-registered nurse with acute ward experience, strong patient assessment skills, and a calm approach to care planning, documentation, and multidisciplinary communication.",
        bullets: ["Registration", "Clinical context", "Care quality"],
      },
      {
        title: "Achievement bullet",
        body: "Supported improved discharge coordination by updating care plans promptly, escalating changes to senior nurses, and liaising with physiotherapy and family contacts.",
        bullets: ["Patient pathway focus", "Team communication", "Practical care outcome"],
      },
      {
        title: "Skills section",
        body: "Patient assessment, medication administration, care planning, safeguarding, infection control, EPR documentation, discharge planning, multidisciplinary teamwork.",
        bullets: ["Clinical keywords", "NHS relevant", "ATS readable"],
      },
    ],
    faqs: [
      {
        question: "Should a nurse CV include NMC registration?",
        answer: "Yes, if you are registered. Put NMC registration clearly near the top so healthcare recruiters can verify eligibility quickly.",
      },
      {
        question: "How long should a nurse CV be in the UK?",
        answer: "Most UK nurse CVs should be two pages, with recent and relevant clinical experience prioritised.",
      },
      {
        question: "What skills should I include on a nursing CV?",
        answer: "Include clinical assessment, care planning, medication administration, safeguarding, infection control, documentation, escalation, and multidisciplinary communication where relevant.",
      },
    ],
  },
];

export function getCvExamplePage(slug: string) {
  return CV_EXAMPLE_PAGES.find((page) => page.slug === slug);
}
