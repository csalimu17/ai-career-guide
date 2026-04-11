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
    match: /(account executive|ae\b|business development representative|bdr\b|sales development representative|sdr\b)/i,
    playbook: {
      family: "sales and pipeline generation",
      headline: "Sales and pipeline generation",
      focusAreas: [
        "prospecting",
        "pipeline creation",
        "qualification and conversion",
        "deal progression",
      ],
      actionVerbs: ["prospected", "qualified", "generated", "closed", "expanded", "converted"],
      metricIdeas: ["pipeline value", "meetings booked", "conversion rate", "quota attainment", "win rate"],
      keywords: ["pipeline", "prospecting", "qualification", "quota", "conversion", "accounts"],
      bulletAngles: [
        "Show how you created or moved pipeline forward.",
        "Use funnel metrics and commercial outcomes.",
        "Keep the language consultative and specific.",
      ],
      bulletPatterns: [
        "Prospected into a market and the pipeline created",
        "Qualified opportunities and the conversion result",
        "Moved deals through the funnel and the revenue outcome",
      ],
      exampleBullets: [
        "Prospected into target accounts to generate qualified pipeline and stronger meeting volume.",
        "Qualified opportunities through structured discovery, improving conversion into active deals.",
        "Worked with account stakeholders to move opportunities through the funnel and strengthen win rates.",
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
