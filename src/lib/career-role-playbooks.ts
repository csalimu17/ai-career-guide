export type RolePlaybook = {
  family: string
  headline: string
  focusAreas: string[]
  actionVerbs: string[]
  metricIdeas: string[]
  keywords: string[]
  bulletAngles: string[]
  bulletPatterns: string[]
  exampleBullets: string[]
}

type PlaybookRule = {
  match: RegExp
  playbook: RolePlaybook
}

const DEFAULT_PLAYBOOK: RolePlaybook = {
  family: "general professional",
  headline: "General professional",
  focusAreas: [
    "clear ownership",
    "measurable impact",
    "cross-functional delivery",
    "client or stakeholder communication",
  ],
  actionVerbs: ["built", "improved", "delivered", "coordinated", "streamlined", "supported"],
  metricIdeas: ["% uplift", "hours saved", "cycle time reduction", "revenue impact", "quality improvement"],
  keywords: ["delivery", "stakeholder", "improvement", "execution", "collaboration"],
  bulletAngles: [
    "Show the problem, the action, and the measurable result.",
    "Favor outcomes over responsibilities.",
    "Use one metric or scope signal per bullet where possible.",
  ],
  bulletPatterns: [
    "Action verb + what you built/improved + scale/result",
    "Action verb + collaboration + delivery outcome",
    "Action verb + process change + measurable efficiency gain",
  ],
  exampleBullets: [
    "Built a repeatable process that reduced manual work and improved turnaround time.",
    "Partnered with cross-functional teams to deliver a stronger customer-facing workflow.",
    "Improved quality and consistency by standardizing the way work was reviewed and shipped.",
  ],
}

const ROLE_RULES: PlaybookRule[] = [
  {
    match: /(frontend engineer|front-end engineer|ui engineer|web engineer)/i,
    playbook: {
      family: "frontend engineering",
      headline: "Frontend engineering",
      focusAreas: [
        "component architecture",
        "user-facing performance",
        "design system consistency",
        "accessible interactions",
      ],
      actionVerbs: ["built", "shipped", "optimized", "refined", "translated", "improved"],
      metricIdeas: ["page speed uplift", "conversion lift", "interaction latency", "adoption growth", "reduced support volume"],
      keywords: ["React", "TypeScript", "design systems", "accessibility", "performance", "UI"],
      bulletAngles: [
        "Show how the interface improved usability or conversion.",
        "Highlight reusable UI work or system consistency.",
        "Mention performance, accessibility, or handoff improvements.",
      ],
      bulletPatterns: [
        "Built a reusable UI component or flow and the result",
        "Translated design into production and the user outcome",
        "Improved performance/accessibility and the measurable lift",
      ],
      exampleBullets: [
        "Built reusable UI components that kept product experiences visually consistent across multiple screens.",
        "Translated design mockups into accessible interfaces that improved completion rates and reduced friction.",
        "Optimized frontend performance to make key pages feel faster and more reliable for users.",
      ],
    },
  },
  {
    match: /(full stack engineer|full-stack engineer|fullstack engineer|software engineer)/i,
    playbook: {
      family: "full stack engineering",
      headline: "Full stack engineering",
      focusAreas: [
        "end-to-end feature delivery",
        "APIs and frontend integration",
        "system reliability",
        "shipping across stack boundaries",
      ],
      actionVerbs: ["built", "shipped", "integrated", "improved", "refactored", "automated"],
      metricIdeas: ["delivery speed", "bug reduction", "latency improvement", "uptime gain", "workflow efficiency"],
      keywords: ["React", "Node.js", "APIs", "TypeScript", "database", "testing"],
      bulletAngles: [
        "Show ownership from interface to backend.",
        "Call out cross-functional delivery and quality improvements.",
        "Mention reliability, speed, or maintainability gains.",
      ],
      bulletPatterns: [
        "Built a full-stack feature and the production result",
        "Integrated frontend and backend changes and the business outcome",
        "Refactored a system to improve reliability or reduce work",
      ],
      exampleBullets: [
        "Built full-stack features that connected frontend interactions with stable backend workflows.",
        "Integrated API and UI changes to improve delivery speed and reduce production defects.",
        "Refactored shared application logic to improve maintainability and reduce repetitive work.",
      ],
    },
  },
  {
    match: /(backend engineer|back-end engineer|api engineer|platform engineer|infrastructure engineer)/i,
    playbook: {
      family: "backend engineering",
      headline: "Backend engineering",
      focusAreas: [
        "service reliability",
        "APIs and data flows",
        "scalability and observability",
        "automation and performance",
      ],
      actionVerbs: ["built", "scaled", "stabilized", "optimized", "automated", "instrumented"],
      metricIdeas: ["uptime", "latency reduction", "throughput gain", "error reduction", "operational hours saved"],
      keywords: ["APIs", "microservices", "databases", "observability", "scalability", "performance"],
      bulletAngles: [
        "Describe the service or system improved.",
        "Tie work to reliability, latency, or throughput.",
        "Show the operational effect of the backend change.",
      ],
      bulletPatterns: [
        "Built or stabilized a backend service and the reliability gain",
        "Optimized an API or data flow and the performance result",
        "Automated or instrumented a system and the operational improvement",
      ],
      exampleBullets: [
        "Built backend services that supported reliable data flow between product components.",
        "Optimized API performance to reduce latency and improve the user experience.",
        "Added observability and automated checks that made production issues easier to spot and resolve.",
      ],
    },
  },
  {
    match: /(devops|sre|site reliability|cloud engineer|platform engineer)/i,
    playbook: {
      family: "cloud and devops engineering",
      headline: "Cloud and DevOps engineering",
      focusAreas: [
        "infrastructure as code",
        "CI/CD pipeline automation",
        "system reliability and monitoring",
        "cloud cost optimization",
      ],
      actionVerbs: ["automated", "provisioned", "scaled", "orchestrated", "migrated", "hardened"],
      metricIdeas: ["deployment frequency", "mean time to recovery (MTTR)", "cloud spend reduction", "uptime percentage", "automation coverage"],
      keywords: ["AWS", "Terraform", "Kubernetes", "Docker", "CI/CD", "Monitoring", "IaC"],
      bulletAngles: [
        "Focus on automation and reliability.",
        "Highlight infrastructure improvements and cost savings.",
        "Mention security hardening and disaster recovery.",
      ],
      bulletPatterns: [
        "Automated a manual process + tool used + time/reliability gain",
        "Provisioned cloud infrastructure + scale + cost/performance result",
        "Improved monitoring or CI/CD + metric uplift",
      ],
      exampleBullets: [
        "Automated deployment pipelines using Terraform and Github Actions, reducing manual release effort by 40%.",
        "Optimized AWS cloud infrastructure to improve system reliability while reducing monthly spend by 15%.",
        "Implemented comprehensive monitoring and alerting that reduced MTTR for production incidents.",
      ],
    },
  },
  {
    match: /(data scientist|machine learning|ml engineer|ai engineer|data engineer)/i,
    playbook: {
      family: "data science and ai",
      headline: "Data science and AI",
      focusAreas: [
        "model development and validation",
        "data pipeline engineering",
        "statistical analysis",
        "productionizing ML workflows",
      ],
      actionVerbs: ["modeled", "engineered", "extracted", "predicted", "optimized", "visualized"],
      metricIdeas: ["model accuracy/F1 score", "inference latency", "data processing speed", "business decision impact", "forecast error reduction"],
      keywords: ["Python", "PyTorch", "SQL", "Spark", "MLOps", "Statistics", "ETL"],
      bulletAngles: [
        "Show the link between data insights and business value.",
        "Mention specific modeling techniques or data scale.",
        "Highlight the production impact of ML models.",
      ],
      bulletPatterns: [
        "Developed a predictive model + technique + accuracy/business result",
        "Built a data pipeline + scale + processing efficiency gain",
        "Performed statistical analysis + insight found + decision influenced",
      ],
      exampleBullets: [
        "Developed machine learning models that improved forecast accuracy by 20%, directly informing inventory decisions.",
        "Built scalable data pipelines that processed millions of daily records with 30% faster throughput.",
        "Analyzed complex datasets to identify growth opportunities, leading to a measurable increase in user retention.",
      ],
    },
  },
  {
    match: /(product manager|product owner|product lead|head of product)/i,
    playbook: {
      family: "product management",
      headline: "Product management",
      focusAreas: [
        "roadmap strategy",
        "user discovery and research",
        "stakeholder management",
        "product-led growth",
      ],
      actionVerbs: ["defined", "launched", "prioritized", "validated", "scaled", "aligned"],
      metricIdeas: ["user adoption %", "retention lift", "feature engagement", "revenue growth", "time-to-market reduction"],
      keywords: ["Roadmap", "Agile", "Discovery", "NPS", "Stakeholders", "KPIs"],
      bulletAngles: [
        "Focus on the 'why' behind the product decisions.",
        "Show cross-functional leadership and alignment.",
        "Highlight measurable user or business outcomes.",
      ],
      bulletPatterns: [
        "Led product discovery + insight + feature/roadmap impact",
        "Launched a new feature/product + scale + adoption or revenue result",
        "Prioritized engineering efforts + constraint solved + delivery improvement",
      ],
      exampleBullets: [
        "Led user discovery sessions that identified a critical friction point, resulting in a redesigned checkout flow with 15% higher conversion.",
        "Defined and executed a 6-month product roadmap that aligned engineering and design around high-impact growth features.",
        "Launched a new mobile experience that achieved 50k+ active users within the first quarter.",
      ],
    },
  },
  {
    match: /(customer success|account manager|csm|client relationship|support lead)/i,
    playbook: {
      family: "customer success and retention",
      headline: "Customer success and retention",
      focusAreas: [
        "churn reduction",
        "account expansion",
        "customer onboarding",
        "relationship health",
      ],
      actionVerbs: ["retained", "onboarded", "expanded", "advocated", "resolved", "consulted"],
      metricIdeas: ["net retention rate (NRR)", "churn % reduction", "customer lifetime value (CLV)", "CSAT/NPS score", "expansion revenue"],
      keywords: ["Retention", "Onboarding", "Churn", "Expansion", "CSAT", "Accounts"],
      bulletAngles: [
        "Show how you deepened customer value.",
        "Highlight retention wins and expansion opportunities.",
        "Mention process improvements for the customer journey.",
      ],
      bulletPatterns: [
        "Managed a portfolio of accounts + size + retention/growth result",
        "Onboarded new clients + process used + time-to-value improvement",
        "Resolved critical customer issues + method + satisfaction uplift",
      ],
      exampleBullets: [
        "Managed a $2M portfolio of enterprise accounts, achieving a 98% net retention rate through proactive health checks.",
        "Streamlined the client onboarding process, reducing time-to-value by 20% for new customers.",
        "Partnered with product teams to advocate for customer needs, leading to the resolution of top friction points.",
      ],
    },
  },
  {
    match: /(hr|people ops|human resources|talent acquisition|recruiter)/i,
    playbook: {
      family: "people operations and talent",
      headline: "People operations and talent",
      focusAreas: [
        "talent acquisition strategy",
        "employee engagement",
        "performance management",
        "culture and inclusion",
      ],
      actionVerbs: ["recruited", "implemented", "designed", "scaled", "facilitated", "optimized"],
      metricIdeas: ["time-to-hire", "retention rate", "engagement score lift", "cost-per-hire reduction", "diversity representation"],
      keywords: ["Recruitment", "Onboarding", "Culture", "Compliance", "Performance", "Employer Brand"],
      bulletAngles: [
        "Highlight the impact of people programs on the business.",
        "Show scale in hiring or organizational growth.",
        "Mention culture-building and employee well-being.",
      ],
      bulletPatterns: [
        "Scaled a team or function + growth rate + quality/culture result",
        "Implemented a new people program + goal + engagement uplift",
        "Optimized recruitment workflows + tool + time-to-hire reduction",
      ],
      exampleBullets: [
        "Scaled the engineering team from 10 to 50 members while maintaining a high bar for technical talent and culture fit.",
        "Implemented a new performance review framework that improved manager-employee alignment and engagement scores.",
        "Redesigned the onboarding experience to ensure all new hires reached full productivity 25% faster.",
      ],
    },
  },
  {
    match: /(finance|accountant|financial analyst|controller|auditor)/i,
    playbook: {
      family: "finance and accounting",
      headline: "Finance and accounting",
      focusAreas: [
        "financial planning and analysis",
        "audit and compliance",
        "cost control",
        "reporting and forecasting",
      ],
      actionVerbs: ["forecasted", "audited", "reconciled", "optimized", "analyzed", "reported"],
      metricIdeas: ["budget variance reduction", "cost savings found", "reporting speed", "audit accuracy", "cash flow improvement"],
      keywords: ["FP&A", "Audit", "Compliance", "Forecasting", "Budgeting", "ERP"],
      bulletAngles: [
        "Show accuracy and risk management.",
        "Highlight cost-saving or revenue-protecting insights.",
        "Mention process automation in reporting.",
      ],
      bulletPatterns: [
        "Managed annual budgets + size + variance reduction result",
        "Optimized financial reporting + tool + time saved or accuracy gain",
        "Identified cost-saving opportunities + area + bottom-line impact",
      ],
      exampleBullets: [
        "Managed annual budgets exceeding $5M, maintaining a variance of less than 2% across all departments.",
        "Automated month-end reconciliation processes, cutting reporting time by 3 days while improving data accuracy.",
        "Identified and implemented cost-saving initiatives that reduced operational overhead by 10% annually.",
      ],
    },
  },
  {
    match: /(content strategist|copywriter|content creator|social media manager|writer)/i,
    playbook: {
      family: "content and communication",
      headline: "Content and communication",
      focusAreas: [
        "content strategy and planning",
        "audience engagement",
        "brand voice consistency",
        "multi-channel distribution",
      ],
      actionVerbs: ["authored", "strategized", "grew", "translated", "edited", "launched"],
      metricIdeas: ["engagement rate", "traffic growth %", "subscriber growth", "conversion from content", "brand sentiment"],
      keywords: ["SEO", "Copywriting", "Social Media", "Brand Voice", "Content Calendar", "Analytics"],
      bulletAngles: [
        "Link content to audience growth or action.",
        "Show expertise in specific channels or formats.",
        "Highlight brand consistency and strategy.",
      ],
      bulletPatterns: [
        "Developed a content strategy + goal + audience/engagement result",
        "Authored high-impact content + channel + conversion or traffic gain",
        "Managed social media or brand presence + scale + growth metric",
      ],
      exampleBullets: [
        "Developed a multi-channel content strategy that grew organic website traffic by 40% in six months.",
        "Authored compelling copy for lead-generation campaigns, resulting in a 20% increase in qualified sign-ups.",
        "Managed a global social media presence, increasing total follower engagement by 50% through targeted storytelling.",
      ],
    },
  },
  {
    match: /(operations manager|ops manager|business operations manager|operations lead)/i,
    playbook: {
      family: "operations leadership",
      headline: "Operations leadership",
      focusAreas: [
        "process ownership",
        "team coordination",
        "service quality",
        "scalability",
      ],
      actionVerbs: ["led", "streamlined", "standardized", "coordinated", "improved", "reduced"],
      metricIdeas: ["cycle time", "error rate", "cost savings", "service levels", "throughput"],
      keywords: ["operations", "process", "coordination", "efficiency", "service", "standardization"],
      bulletAngles: [
        "Show how you improved the operating model.",
        "Tie the work to service quality or efficiency.",
        "Highlight the volume or complexity managed.",
      ],
      bulletPatterns: [
        "Led a process change and the efficiency gain",
        "Standardized an operations workflow and the quality improvement",
        "Coordinated a team or service line and the reliability result",
      ],
      exampleBullets: [
        "Led process improvements that reduced bottlenecks and made operations more predictable.",
        "Standardized recurring workflows to improve service quality and reduce avoidable errors.",
        "Coordinated cross-functional work to keep delivery reliable at higher volume.",
      ],
    },
  },
  {
    match: /(software|frontend|front-end|backend|back-end|full stack|fullstack|developer|engineer|programmer|web)/i,
    playbook: {
      family: "software engineering",
      headline: "Software engineering",
      focusAreas: [
        "shipping reliable features",
        "code quality and maintainability",
        "performance and scalability",
        "testing and deployment",
      ],
      actionVerbs: ["built", "shipped", "refactored", "optimized", "automated", "reduced"],
      metricIdeas: ["latency reduction", "build time reduction", "bug reduction", "traffic handled", "conversion uplift"],
      keywords: ["TypeScript", "React", "Node.js", "APIs", "testing", "performance", "scalability"],
      bulletAngles: [
        "Call out products shipped and the technical constraints solved.",
        "Mention performance, reliability, or delivery speed.",
        "Include collaboration with product/design/QA when relevant.",
      ],
      bulletPatterns: [
        "Built or shipped a feature/system and the technical result",
        "Refactored or optimized a workflow and the measurable impact",
        "Automated a repeated task and the time or error reduction",
      ],
      exampleBullets: [
        "Built a reusable component workflow that improved release consistency across multiple product areas.",
        "Optimized API and frontend performance, reducing page latency and improving user experience.",
        "Partnered with product and design to ship features that increased engagement and reduced support issues.",
      ],
    },
  },
  {
    match: /(product manager|product owner|product lead|program manager|project manager)/i,
    playbook: {
      family: "product and delivery",
      headline: "Product and delivery",
      focusAreas: ["roadmap execution", "stakeholder alignment", "discovery and prioritization", "delivery outcomes"],
      actionVerbs: ["launched", "prioritized", "aligned", "coordinated", "validated", "improved"],
      metricIdeas: ["adoption uplift", "cycle time reduction", "conversion lift", "NPS gain", "release cadence"],
      keywords: ["roadmap", "stakeholders", "prioritization", "launch", "discovery", "delivery"],
      bulletAngles: [
        "Show how decisions improved delivery or customer outcomes.",
        "Tie work to roadmap, launch, and adoption metrics.",
        "Include cross-functional influence rather than task lists.",
      ],
      bulletPatterns: [
        "Defined or prioritized a roadmap item and the business outcome",
        "Aligned stakeholders around a launch or product change",
        "Validated customer or user needs and the impact on adoption",
      ],
      exampleBullets: [
        "Prioritized a roadmap sequence that balanced customer demand with delivery capacity and launch risk.",
        "Aligned engineering, design, and support around a release plan that improved adoption.",
        "Validated customer needs through feedback and translated them into product changes with clearer impact.",
      ],
    },
  },
  {
    match: /(data analyst|data scientist|analytics|bi analyst|business intelligence|insights)/i,
    playbook: {
      family: "data and analytics",
      headline: "Data and analytics",
      focusAreas: ["insight generation", "dashboards and reporting", "experimentation", "decision support"],
      actionVerbs: ["analyzed", "built", "automated", "measured", "modeled", "validated"],
      metricIdeas: ["accuracy improvement", "time saved", "revenue impact", "forecast lift", "dashboard usage"],
      keywords: ["SQL", "Python", "dashboards", "experimentation", "reporting", "visualization"],
      bulletAngles: [
        "Make the analytical method explicit.",
        "Show the business decision influenced by the analysis.",
        "Mention volume, frequency, or audience size where possible.",
      ],
      bulletPatterns: [
        "Analyzed data set / process + method + decision or insight",
        "Built dashboard / report + audience + action taken",
        "Automated analysis + time saved or error reduction",
      ],
      exampleBullets: [
        "Analyzed product usage data to identify drop-off points and guide improvements to the user journey.",
        "Built dashboards for leadership that made weekly performance tracking faster and more reliable.",
        "Automated recurring reporting, cutting manual effort and improving the consistency of decisions.",
      ],
    },
  },
  {
    match: /(designer|ux|ui|product design|graphic designer|creative)/i,
    playbook: {
      family: "design and creative",
      headline: "Design and creative",
      focusAreas: ["user outcomes", "visual systems", "research and iteration", "brand consistency"],
      actionVerbs: ["designed", "refined", "tested", "shipped", "iterated", "simplified"],
      metricIdeas: ["conversion lift", "engagement gain", "task completion improvement", "handoff reduction"],
      keywords: ["user research", "wireframes", "prototypes", "accessibility", "design systems"],
      bulletAngles: [
        "Show how the design improved usability or conversion.",
        "Reference research or testing when available.",
        "Call out the system or workflow, not just visuals.",
      ],
      bulletPatterns: [
        "Designed a workflow or interface and the user outcome",
        "Improved a design system or process and the consistency gain",
        "Tested and refined a concept and the measurable UX result",
      ],
      exampleBullets: [
        "Designed a cleaner onboarding flow that reduced friction for new users.",
        "Refined the design system to keep product experiences consistent across teams.",
        "Ran user feedback sessions and iterated on key screens to improve clarity and completion rates.",
      ],
    },
  },
  {
    match: /(sales|account executive|business development|bdr|sdr|client success|customer success)/i,
    playbook: {
      family: "revenue and customer growth",
      headline: "Revenue and customer growth",
      focusAreas: ["pipeline growth", "closing and retention", "account expansion", "relationship management"],
      actionVerbs: ["generated", "closed", "expanded", "retained", "qualified", "grew"],
      metricIdeas: ["quota attainment", "pipeline value", "retention rate", "expansion revenue", "win rate"],
      keywords: ["pipeline", "quota", "accounts", "renewal", "retention", "revenue"],
      bulletAngles: [
        "Show direct commercial impact.",
        "Use deal size, conversion, retention, or quota metrics.",
        "Highlight trust-building and consultative selling.",
      ],
      bulletPatterns: [
        "Generated pipeline or deals + source/channel + result",
        "Expanded or retained accounts + relationship work + revenue effect",
        "Qualified opportunities + conversion rate + quota impact",
      ],
      exampleBullets: [
        "Generated qualified pipeline through outbound and referral activity, supporting stronger monthly coverage.",
        "Expanded key accounts by building trust with decision-makers and identifying upsell opportunities.",
        "Improved conversion from first meeting to closed opportunity by tightening qualification and follow-up.",
      ],
    },
  },
  {
    match: /(marketing|growth|content|seo|paid media|brand|social)/i,
    playbook: {
      family: "marketing and growth",
      headline: "Marketing and growth",
      focusAreas: ["audience growth", "conversion", "campaign execution", "content performance"],
      actionVerbs: ["grew", "launched", "optimized", "scaled", "tested", "converted"],
      metricIdeas: ["CTR improvement", "lead volume", "CAC reduction", "traffic growth", "conversion uplift"],
      keywords: ["campaigns", "audience", "content", "SEO", "conversion", "analytics"],
      bulletAngles: [
        "Tie execution to measurable growth.",
        "Mention channel, audience, and result together.",
        "Show testing or optimization rather than one-off tasks.",
      ],
      bulletPatterns: [
        "Launched a campaign or channel and the growth result",
        "Optimized a funnel or content system and the conversion improvement",
        "Tested and scaled a tactic and the measurable lift",
      ],
      exampleBullets: [
        "Launched a campaign that increased qualified traffic and improved lead volume.",
        "Optimized content and SEO workflows to grow organic visibility and conversion quality.",
        "Ran structured tests across channels to improve efficiency and reduce wasted spend.",
      ],
    },
  },
  {
    match: /(operations|ops|admin|coordinator|office manager|business operations)/i,
    playbook: {
      family: "operations and administration",
      headline: "Operations and administration",
      focusAreas: ["process improvement", "coordination", "service quality", "efficiency"],
      actionVerbs: ["coordinated", "streamlined", "improved", "organized", "supported", "standardized"],
      metricIdeas: ["cycle time reduction", "error reduction", "service levels", "cost savings", "throughput"],
      keywords: ["process", "coordination", "efficiency", "service", "operations", "compliance"],
      bulletAngles: [
        "Show the process before and after.",
        "Highlight the volume managed or the time saved.",
        "Emphasize reliability and stakeholder support.",
      ],
      bulletPatterns: [
        "Coordinated a process + team/stakeholder + efficiency result",
        "Streamlined an operational workflow + error/cycle-time reduction",
        "Managed volume or service levels + reliability gain",
      ],
      exampleBullets: [
        "Streamlined a recurring process, reducing cycle time and improving team reliability.",
        "Coordinated daily operations across stakeholders to keep service levels consistent.",
        "Standardized handoffs and documentation to reduce errors and make delivery more predictable.",
      ],
    },
  },
]

function clean(value: string) {
  return value.replace(/\s+/g, " ").trim()
}

function extractKeywords(jobDescription?: string) {
  if (!jobDescription) return []

  return jobDescription
    .split(/\r?\n|[.;]/)
    .map((line) => line.replace(/^[-*•\d.)\s]+/, "").trim())
    .filter(Boolean)
    .filter((line) => /(require|must|need|experience|skill|responsib|proficien|knowledge|familiar|expert)/i.test(line))
    .slice(0, 6)
}

export function getRolePlaybook(jobTitle?: string, jobDescription?: string): RolePlaybook {
  const normalizedTitle = clean(jobTitle || "")
  const rule = ROLE_RULES.find((entry) => entry.match.test(normalizedTitle))
  const playbook = rule?.playbook ?? DEFAULT_PLAYBOOK
  const descriptionKeywords = extractKeywords(jobDescription)

  return {
    ...playbook,
    keywords: [...new Set([...playbook.keywords, ...descriptionKeywords])].slice(0, 12),
  }
}

export function buildRolePlaybookContext(jobTitle?: string, jobDescription?: string) {
  const playbook = getRolePlaybook(jobTitle, jobDescription)

  return [
    `Role family: ${playbook.family}`,
    `Role headline: ${playbook.headline}`,
    `High-signal focus areas: ${playbook.focusAreas.join(", ")}`,
    `Preferred action verbs: ${playbook.actionVerbs.join(", ")}`,
    `Metric ideas: ${playbook.metricIdeas.join(", ")}`,
    `Priority keywords: ${playbook.keywords.join(", ")}`,
    `Bullet strategy: ${playbook.bulletAngles.join(" ")}`,
    `Bullet patterns: ${playbook.bulletPatterns.join(" | ")}`,
    `Example bullets: ${playbook.exampleBullets.join(" || ")}`,
  ].join("\n")
}
