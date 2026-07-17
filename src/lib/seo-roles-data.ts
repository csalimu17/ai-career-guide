export interface JobRoleSEO {
  slug: string;
  title: string;
  description: string;
  category: string;
  keywords: string[];
  actionVerbs: string[];
  atsAdvice: string;
  certifications: string[];
}

export const JOB_ROLES_SEO: JobRoleSEO[] = [
  {
    slug: "software-engineer",
    title: "Software Engineer",
    category: "Technology",
    description: "Learn the high-demand keywords, action verbs, and ATS resume formatting tips to get more software engineer interviews.",
    keywords: ["TypeScript", "React", "Next.js", "Node.js", "Docker", "Kubernetes", "AWS (S3, EC2, Lambda)", "PostgreSQL", "CI/CD Pipelines", "System Design", "Microservices", "REST APIs", "Unit Testing (Jest)"],
    actionVerbs: ["Engineered", "Optimized", "Architected", "Deployed", "Refactored", "Automated", "Integrated", "Migrated"],
    atsAdvice: "Ensure your technical skills are listed under clean category headings (e.g. Languages, Databases, Cloud). Avoid visual graphs representing your skill level — parsers cannot read them and recruiters want to see years of experience or project context, not 4/5 stars.",
    certifications: ["AWS Certified Developer", "AWS Certified Solutions Architect", "Google Cloud Professional Cloud Developer"],
  },
  {
    slug: "product-manager",
    title: "Product Manager",
    category: "Management",
    description: "Discover the critical product management keywords, Agile methodologies, and metrics to rank your PM resume high.",
    keywords: ["Product Roadmap", "Agile/Scrum", "User Research", "A/B Testing", "KPI Tracking", "Cross-Functional Collaboration", "SQL", "Product Analytics (Mixpanel/Amplitude)", "Jira/Confluence", "Stakeholder Communication", "Market Analysis", "User Story Mapping"],
    actionVerbs: ["Launched", "Spearheaded", "Analyzed", "Defined", "Prioritized", "Coordinated", "Iterated", "Drove"],
    atsAdvice: "Focus heavily on product metrics. Include details on how you increased conversion, reduced churn, or aligned stakeholders. Use simple bullet points instead of visual timelines to detail your product release history.",
    certifications: ["Certified Scrum Product Owner (CSPO)", "Pragmatic Institute Certified", "Product Management Certificate (PMC)"],
  },
  {
    slug: "data-analyst",
    title: "Data Analyst",
    category: "Data Science",
    description: "Optimize your data analyst resume for ATS screening with targeted query, statistical, and business intelligence keywords.",
    keywords: ["Python (Pandas/NumPy)", "SQL Queries", "Tableau", "Power BI", "Data Modeling", "ETL Pipelines", "Statistical Analysis", "A/B Testing", "Data Cleansing", "Excel (VLOOKUP/Pivot)", "Data Governance", "Predictive Analytics"],
    actionVerbs: ["Extracted", "Modeled", "Visualized", "Interpreted", "Discovered", "Synthesized", "Automated", "Forecasted"],
    atsAdvice: "Make sure you include the database types you work with (e.g. PostgreSQL, BigQuery, Snowflake) and detail the exact business outcomes of your analyses, such as time saved through automated reporting.",
    certifications: ["Google Data Analytics Professional Certificate", "Microsoft Certified: Power BI Data Analyst Associate", "Tableau Desktop Certified Associate"],
  },
  {
    slug: "project-manager",
    title: "Project Manager",
    category: "Management",
    description: "The ultimate ATS checklist for project manager resumes, featuring CSM, PMP, budgeting, and risk mitigation keywords.",
    keywords: ["PMP", "Scrum/Agile", "Budget Management (CapEx/OpEx)", "Risk Mitigation", "Resource Allocation", "Jira", "MS Project", "Stakeholder Communication", "Scope Management", "Milestone Tracking", "Vendor Management", "Change Management"],
    actionVerbs: ["Coordinated", "Delivered", "Managed", "Mitigated", "Structured", "Executed", "Optimized", "Aligned"],
    atsAdvice: "List your CSM or PMP credentials clearly in your summary header and experience section. Use standard metrics showing average project size, team count, and budget totals.",
    certifications: ["Project Management Professional (PMP)", "Certified ScrumMaster (CSM)", "PRINCE2 Practitioner"],
  },
  {
    slug: "digital-marketer",
    title: "Digital Marketer",
    category: "Marketing",
    description: "Rank for SEO, SEM, conversion rate, and performance marketing keywords on your digital marketer resume.",
    keywords: ["SEO/SEM", "Google Analytics 4", "Conversion Rate Optimization (CRO)", "A/B Testing", "Content Strategy", "Email Marketing (Klaviyo/Mailchimp)", "Paid Social (Meta Ads)", "PPC Campaigns", "Copywriting", "SQL", "CRM Management", "Customer Acquisition Cost (CAC)"],
    actionVerbs: ["Increased", "Generated", "Acquired", "Optimized", "Grew", "Launched", "Scaled", "Designed"],
    atsAdvice: "Include specific channel performance numbers. Avoid fancy text fields or graphics for advertising portfolios. Instead, include clickable URLs (e.g. GitHub, Portfolio, LinkedIn) that the parser can extract.",
    certifications: ["Google Analytics Individual Qualification (GAIQ)", "HubSpot Inbound Marketing Certification", "Google Ads Search Certification"],
  },
  {
    slug: "financial-analyst",
    title: "Financial Analyst",
    category: "Finance",
    description: "ATS keywords, Excel modeling, budgeting, and forecasting terminology to maximize your financial analyst resume visibility.",
    keywords: ["Financial Modeling", "Corporate Budgeting", "Forecasting", "Excel (VBA/Macros)", "Variance Analysis", "SQL", "FP&A", "Revenue Projections", "Due Diligence", "Data Visualization", "GAAP Principles", "Portfolio Management"],
    actionVerbs: ["Analyzed", "Forecasted", "Modeled", "Evaluated", "Projected", "Audited", "Streamlined", "Reconciled"],
    atsAdvice: "Keep layout completely minimalist. Corporate finance recruiters hate excessive design elements. Focus on detailing complex financial models you constructed and key compliance guidelines you maintained.",
    certifications: ["Chartered Financial Analyst (CFA)", "Certified Management Accountant (CMA)", "FMVA Certification"],
  },
  {
    slug: "sales-executive",
    title: "Sales Executive",
    category: "Sales",
    description: "Optimize your sales resume for ATS screening with quotas, revenue generation, and pipeline management keywords.",
    keywords: ["Salesforce CRM", "Lead Generation", "B2B Sales", "Quota Attainment", "Pipeline Management", "Contract Negotiation", "Account Management", "Cold Outreach", "Enterprise Sales", "Customer Retention", "Sales Enablement"],
    actionVerbs: ["Exceeded", "Negotiated", "Closed", "Generated", "Expanded", "Secured", "Retained", "Accelerated"],
    atsAdvice: "Ensure your percentage of quota attainment is listed for every sales role. Use simple numbers: 'Achieved 124% of annual quota, securing $1.2M in recurring revenue.'",
    certifications: ["Salesforce Certified Administrator", "HubSpot Sales Software Certification", "Certified Sales Professional (CSP)"],
  },
  {
    slug: "hr-specialist",
    title: "HR Specialist",
    category: "Human Resources",
    description: "Get more HR interviews by optimizing your resume with recruitment, payroll, onboarding, and compliance keywords.",
    keywords: ["Workday ATS", "Talent Acquisition", "Employee Relations", "Onboarding/Offboarding", "Payroll Administration", "Benefits Management", "HR Compliance", "Performance Management", "HRIS Administration", "Conflict Resolution"],
    actionVerbs: ["Recruited", "Onboarded", "Implemented", "Designed", "Mediated", "Facilitated", "Restructured", "Drafted"],
    atsAdvice: "As HR specialists, you know ATS constraints best. Ensure you list all HRIS and ATS platforms you have hands-on experience with, as these are highly searched parameters.",
    certifications: ["SHRM Certified Professional (SHRM-CP)", "PHR (Professional in Human Resources)", "aPHR Associate"],
  },
];

export function getRoleBySlug(slug: string) {
  return JOB_ROLES_SEO.find((role) => role.slug === slug);
}
