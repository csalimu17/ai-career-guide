/**
 * @fileOverview Defines the ATS-safe resume template registry and shared preview helpers.
 */

import type { ResumeFontKey } from "@/lib/resume-fonts";

export type ResumeSectionId =
  | "summary"
  | "experience"
  | "projects"
  | "education"
  | "skills"
  | "certifications"
  | "languages"
  | "page-break";

export type TemplateAccessTier = "free" | "pro" | "master";
export type TemplateHeaderVariant = "classic" | "modern" | "minimal" | "executive" | "elegant";
export type TemplateHeadingVariant = "rule" | "eyebrow" | "serif";
export type TemplateEntryVariant = "standard" | "accented" | "outlined";
export type TemplateSkillVariant = "stacked" | "inline" | "compact";
export type TemplateDensity = "compact" | "comfortable" | "relaxed";

export type TemplateConfig = {
  id: string;
  name: string;
  description: string;
  preview: string;
  accessTier: TemplateAccessTier;
  isPremium: boolean;
  isAtsSafe: boolean;
  category: "Professional" | "Modern" | "Classic";
  layout: "single-column" | "two-column";
  sidebarPosition?: "left" | "right";
  sidebarSections?: ResumeSectionId[];
  legacyIds?: string[];
  defaults: {
    primaryColor: string;
    fontFamily: ResumeFontKey;
    fontSize: number;
    lineHeight: number;
    margins: number;
  };
  design: {
    headerVariant: TemplateHeaderVariant;
    headerAlignment: "left" | "center";
    contactLayout: "inline" | "stacked" | "split";
    headingVariant: TemplateHeadingVariant;
    headingCase: "uppercase" | "title";
    entryVariant: TemplateEntryVariant;
    skillVariant: TemplateSkillVariant;
    density: TemplateDensity;
    pageBorder: boolean;
    headerBand: boolean;
    subtleFill: boolean;
    headerIcon?: boolean;
    sectionDividers?: "none" | "thin" | "bold";
  };
  thumbnail: {
    scale: number;
  };
};

type TemplateDefinition = Omit<TemplateConfig, "isPremium">;

function defineTemplate(template: TemplateDefinition): TemplateConfig {
  return {
    ...template,
    isPremium: template.accessTier !== "free",
  };
}

export const DEFAULT_SECTION_ORDER: ResumeSectionId[] = [
  "summary",
  "experience",
  "projects",
  "education",
  "skills",
  "certifications",
  "languages",
];

export const TEMPLATES: TemplateConfig[] = [
  // --- PROFESSIONAL SERIES ---
  defineTemplate({
    id: "london-executive",
    name: "London Executive",
    description: "Authority-driven design with heavy serifs, formal rules, and executive header spacing.",
    preview: "/templates/london-executive.png",
    accessTier: "free",
    isAtsSafe: true,
    category: "Professional",
    layout: "single-column",
    defaults: {
      primaryColor: "#1e293b",
      fontFamily: "georgia",
      fontSize: 11,
      lineHeight: 1.5,
      margins: 48,
    },
    design: {
      headerVariant: "executive",
      headerAlignment: "left",
      contactLayout: "inline",
      headerBand: true,
      headingVariant: "serif",
      headingCase: "uppercase",
      entryVariant: "standard",
      skillVariant: "compact",
      density: "comfortable",
      pageBorder: false,
      subtleFill: false,
      sectionDividers: "bold",
    },
    legacyIds: ["classic-ats", "monarch-classic"],
    thumbnail: { scale: 0.38 },
  }),
  defineTemplate({
    id: "new-york-finance",
    name: "New York Finance",
    description: "Strict, high-density layout optimized for traditional firms and recruitment scanners.",
    preview: "/templates/new-york-finance.png",
    accessTier: "pro",
    isAtsSafe: true,
    category: "Professional",
    layout: "single-column",
    defaults: {
      primaryColor: "#0f172a",
      fontFamily: "times-new-roman",
      fontSize: 10,
      lineHeight: 1.4,
      margins: 40,
    },
    design: {
      headerVariant: "classic",
      headerAlignment: "center",
      contactLayout: "inline",
      headerBand: false,
      headingVariant: "rule",
      headingCase: "uppercase",
      entryVariant: "standard",
      skillVariant: "inline",
      density: "compact",
      pageBorder: false,
      subtleFill: false,
      sectionDividers: "bold",
    },
    legacyIds: ["precision-ledger", "capital-serif"],
    thumbnail: { scale: 0.36 },
  }),
  defineTemplate({
    id: "singapore-boardroom",
    name: "Singapore Boardroom",
    description: "Centered, balanced layout with a subtle premium border and generous white space.",
    preview: "/templates/singapore-boardroom.png",
    accessTier: "pro",
    isAtsSafe: true,
    category: "Professional",
    layout: "single-column",
    defaults: {
      primaryColor: "#1f2937",
      fontFamily: "cambria",
      fontSize: 11,
      lineHeight: 1.6,
      margins: 52,
    },
    design: {
      headerVariant: "elegant",
      headerAlignment: "center",
      contactLayout: "inline",
      headerBand: false,
      headingVariant: "serif",
      headingCase: "title",
      entryVariant: "standard",
      skillVariant: "compact",
      density: "relaxed",
      pageBorder: true,
      subtleFill: true,
      sectionDividers: "none",
    },
    legacyIds: ["boardroom-signature", "regent-outline"],
    thumbnail: { scale: 0.4 },
  }),
  defineTemplate({
    id: "sydney-growth",
    name: "Sydney Growth",
    description: "Modern professional look with accented experience blocks and dynamic header.",
    preview: "/templates/sydney-growth.png",
    accessTier: "free",
    isAtsSafe: true,
    category: "Professional",
    layout: "single-column",
    defaults: {
      primaryColor: "#2563eb",
      fontFamily: "inter",
      fontSize: 11,
      lineHeight: 1.5,
      margins: 44,
    },
    design: {
      headerVariant: "modern",
      headerAlignment: "left",
      contactLayout: "split",
      headerBand: true,
      headingVariant: "eyebrow",
      headingCase: "uppercase",
      entryVariant: "accented",
      skillVariant: "compact",
      density: "comfortable",
      pageBorder: false,
      subtleFill: false,
      sectionDividers: "thin",
    },
    legacyIds: ["atlas-modern", "summit-strategy"],
    thumbnail: { scale: 0.38 },
  }),

  // --- MODERN SERIES ---
  defineTemplate({
    id: "san-fran-stack",
    name: "San Francisco Tech",
    description: "Tech-forward two-column layout with a left sidebar for skills and education.",
    preview: "/templates/san-fran-stack.png",
    accessTier: "pro",
    isAtsSafe: true,
    category: "Modern",
    layout: "two-column",
    sidebarPosition: "left",
    sidebarSections: ["skills", "languages", "education", "certifications"],
    defaults: {
      primaryColor: "#334155",
      fontFamily: "inter",
      fontSize: 10,
      lineHeight: 1.5,
      margins: 40,
    },
    design: {
      headerVariant: "modern",
      headerAlignment: "left",
      contactLayout: "stacked",
      headerBand: false,
      headingVariant: "eyebrow",
      headingCase: "uppercase",
      entryVariant: "standard",
      skillVariant: "compact",
      density: "comfortable",
      pageBorder: false,
      subtleFill: true,
      sectionDividers: "none",
    },
    legacyIds: ["modern-ats", "urban-signal"],
    thumbnail: { scale: 0.36 },
  }),
  defineTemplate({
    id: "berlin-modular",
    name: "Berlin Modular",
    description: "Highly structured and precise, using modern space-grotesk typography.",
    preview: "/templates/berlin-modular.png",
    accessTier: "free",
    isAtsSafe: true,
    category: "Modern",
    layout: "single-column",
    defaults: {
      primaryColor: "#000000",
      fontFamily: "space-grotesk",
      fontSize: 11,
      lineHeight: 1.4,
      margins: 48,
    },
    design: {
      headerVariant: "minimal",
      headerAlignment: "left",
      contactLayout: "inline",
      headerBand: true,
      headingVariant: "rule",
      headingCase: "uppercase",
      entryVariant: "outlined",
      skillVariant: "compact",
      density: "comfortable",
      pageBorder: false,
      subtleFill: false,
      sectionDividers: "bold",
    },
    legacyIds: ["slate-focus", "compact-slate"],
    thumbnail: { scale: 0.38 },
  }),
  defineTemplate({
    id: "stockholm-clean",
    name: "Stockholm Clean",
    description: "Minimalist two-column design with a right-hand sidebar for key details.",
    preview: "/templates/stockholm-clean.png",
    accessTier: "pro",
    isAtsSafe: true,
    category: "Modern",
    layout: "two-column",
    sidebarPosition: "right",
    sidebarSections: ["skills", "languages", "certifications", "education"],
    defaults: {
      primaryColor: "#475569",
      fontFamily: "manrope",
      fontSize: 10.5,
      lineHeight: 1.6,
      margins: 44,
    },
    design: {
      headerVariant: "elegant",
      headerAlignment: "left",
      contactLayout: "inline",
      headerBand: false,
      headingVariant: "rule",
      headingCase: "title",
      entryVariant: "standard",
      skillVariant: "compact",
      density: "relaxed",
      pageBorder: false,
      subtleFill: true,
      sectionDividers: "thin",
    },
    legacyIds: ["nordic-minimal", "horizon-brief"],
    thumbnail: { scale: 0.38 },
  }),
  defineTemplate({
    id: "austin-bold",
    name: "Austin Bold",
    description: "Vibrant and energetic, perfect for startups and creative agencies.",
    preview: "/templates/austin-bold.png",
    accessTier: "master",
    isAtsSafe: true,
    category: "Modern",
    layout: "single-column",
    defaults: {
      primaryColor: "#7c3aed",
      fontFamily: "montserrat",
      fontSize: 11,
      lineHeight: 1.5,
      margins: 48,
    },
    design: {
      headerVariant: "modern",
      headerAlignment: "center",
      contactLayout: "stacked",
      headerBand: true,
      headingVariant: "eyebrow",
      headingCase: "uppercase",
      entryVariant: "accented",
      skillVariant: "compact",
      density: "comfortable",
      pageBorder: false,
      subtleFill: false,
      sectionDividers: "bold",
    },
    legacyIds: ["studio-premier"],
    thumbnail: { scale: 0.38 },
  }),

  // --- CLASSIC & CREATIVE SERIES ---
  defineTemplate({
    id: "paris-atelier",
    name: "Paris Atelier",
    description: "Elegant and sophisticated, using high-end serif typography and serif rules.",
    preview: "/templates/paris-atelier.png",
    accessTier: "pro",
    isAtsSafe: true,
    category: "Classic",
    layout: "single-column",
    defaults: {
      primaryColor: "#431407",
      fontFamily: "playfair",
      fontSize: 12,
      lineHeight: 1.6,
      margins: 56,
    },
    design: {
      headerVariant: "elegant",
      headerAlignment: "center",
      contactLayout: "inline",
      headerBand: false,
      headingVariant: "serif",
      headingCase: "title",
      entryVariant: "standard",
      skillVariant: "inline",
      density: "relaxed",
      pageBorder: true,
      subtleFill: false,
      sectionDividers: "none",
    },
    legacyIds: ["elegant-professional", "serif-balance"],
    thumbnail: { scale: 0.42 },
  }),
  defineTemplate({
    id: "milan-chic",
    name: "Milan Chic",
    description: "A high-fashion, two-column take on the classic professional resume with a left sidebar.",
    preview: "/templates/milan-chic.png",
    accessTier: "pro",
    isAtsSafe: true,
    category: "Classic",
    layout: "two-column",
    sidebarPosition: "left",
    sidebarSections: ["skills", "languages", "education"],
    defaults: {
      primaryColor: "#111827",
      fontFamily: "garamond",
      fontSize: 11,
      lineHeight: 1.5,
      margins: 48,
    },
    design: {
      headerVariant: "executive",
      headerAlignment: "left",
      contactLayout: "split",
      headerBand: false,
      headingVariant: "serif",
      headingCase: "uppercase",
      entryVariant: "standard",
      skillVariant: "compact",
      density: "comfortable",
      pageBorder: false,
      subtleFill: true,
      sectionDividers: "thin",
    },
    legacyIds: ["minimal-professional", "formal-outline"],
    thumbnail: { scale: 0.38 },
  }),
  defineTemplate({
    id: "vienna-heritage",
    name: "Vienna Heritage",
    description: "Traditional and dependable, perfect for academic, medical, or civil roles.",
    preview: "/templates/vienna-heritage.png",
    accessTier: "free",
    isAtsSafe: true,
    category: "Classic",
    layout: "single-column",
    defaults: {
      primaryColor: "#000000",
      fontFamily: "times-new-roman",
      fontSize: 11,
      lineHeight: 1.4,
      margins: 52,
    },
    design: {
      headerVariant: "classic",
      headerAlignment: "left",
      contactLayout: "inline",
      headerBand: false,
      headingVariant: "rule",
      headingCase: "uppercase",
      entryVariant: "standard",
      skillVariant: "inline",
      density: "comfortable",
      pageBorder: false,
      subtleFill: false,
      sectionDividers: "bold",
    },
    legacyIds: ["monarch-classic"],
    thumbnail: { scale: 0.4 },
  }),
  defineTemplate({
    id: "amsterdam-grid",
    name: "Amsterdam Grid",
    description: "Strong structural lines and geometric balance using modern roboto typography.",
    preview: "/templates/amsterdam-grid.png",
    accessTier: "pro",
    isAtsSafe: true,
    category: "Classic",
    layout: "single-column",
    defaults: {
      primaryColor: "#334155",
      fontFamily: "roboto",
      fontSize: 11,
      lineHeight: 1.5,
      margins: 44,
    },
    design: {
      headerVariant: "modern",
      headerAlignment: "left",
      contactLayout: "stacked",
      headerBand: false,
      headingVariant: "rule",
      headingCase: "uppercase",
      entryVariant: "outlined",
      skillVariant: "compact",
      density: "comfortable",
      pageBorder: false,
      subtleFill: true,
      sectionDividers: "thin",
    },
    thumbnail: { scale: 0.38 },
  }),
  defineTemplate({
    id: "tokyo-precise",
    name: "Tokyo Precise",
    description: "Compact, efficient, and highly organized for technical and engineering roles.",
    preview: "/templates/tokyo-precise.png",
    accessTier: "pro",
    isAtsSafe: true,
    category: "Professional",
    layout: "single-column",
    defaults: {
      primaryColor: "#334155",
      fontFamily: "inter",
      fontSize: 10,
      lineHeight: 1.4,
      margins: 36,
    },
    design: {
      headerVariant: "minimal",
      headerAlignment: "left",
      contactLayout: "inline",
      headerBand: true,
      headingVariant: "rule",
      headingCase: "uppercase",
      entryVariant: "standard",
      skillVariant: "compact",
      density: "compact",
      pageBorder: false,
      subtleFill: false,
      sectionDividers: "thin",
    },
    thumbnail: { scale: 0.35 },
  }),
  defineTemplate({
    id: "lisbon-coastal",
    name: "Lisbon Coastal",
    description: "Relaxed, modern design with soft colors and elegant manrope typography.",
    preview: "/templates/lisbon-coastal.png",
    accessTier: "master",
    isAtsSafe: true,
    category: "Modern",
    layout: "two-column",
    sidebarPosition: "right",
    sidebarSections: ["skills", "languages", "education"],
    defaults: {
      primaryColor: "#0d9488",
      fontFamily: "manrope",
      fontSize: 11,
      lineHeight: 1.6,
      margins: 52,
    },
    design: {
      headerVariant: "modern",
      headerAlignment: "left",
      contactLayout: "split",
      headerBand: false,
      headingVariant: "eyebrow",
      headingCase: "title",
      entryVariant: "standard",
      skillVariant: "compact",
      density: "relaxed",
      pageBorder: false,
      subtleFill: true,
      sectionDividers: "none",
    },
    thumbnail: { scale: 0.4 },
  }),
  defineTemplate({
    id: "madrid-vibrant",
    name: "Madrid Vibrant",
    description: "Friendly and approachable with vibrant accents and montserrat typography.",
    preview: "/templates/madrid-vibrant.png",
    accessTier: "free",
    isAtsSafe: true,
    category: "Classic",
    layout: "single-column",
    defaults: {
      primaryColor: "#ea580c",
      fontFamily: "montserrat",
      fontSize: 11,
      lineHeight: 1.5,
      margins: 48,
    },
    design: {
      headerVariant: "modern",
      headerAlignment: "left",
      contactLayout: "stacked",
      headerBand: false,
      headingVariant: "serif",
      headingCase: "title",
      entryVariant: "accented",
      skillVariant: "compact",
      density: "comfortable",
      pageBorder: false,
      subtleFill: false,
      sectionDividers: "thin",
    },
    thumbnail: { scale: 0.38 },
  }),
  defineTemplate({
    id: "seattle-fog",
    name: "Seattle Fog",
    description: "Minimalist grayscale design for a clean, distraction-free modern resume.",
    preview: "/templates/seattle-fog.png",
    accessTier: "free",
    isAtsSafe: true,
    category: "Modern",
    layout: "single-column",
    defaults: {
      primaryColor: "#64748b",
      fontFamily: "inter",
      fontSize: 10.5,
      lineHeight: 1.5,
      margins: 52,
    },
    design: {
      headerVariant: "minimal",
      headerAlignment: "left",
      contactLayout: "inline",
      headerBand: false,
      headingVariant: "rule",
      headingCase: "uppercase",
      entryVariant: "standard",
      skillVariant: "inline",
      density: "relaxed",
      pageBorder: false,
      subtleFill: false,
      sectionDividers: "thin",
    },
    thumbnail: { scale: 0.4 },
  }),
  defineTemplate({
    id: "dublin-edge",
    name: "Dublin Edge",
    description: "Sharp lines and strong roboto typography for a bold technical profile.",
    preview: "/templates/dublin-edge.png",
    accessTier: "pro",
    isAtsSafe: true,
    category: "Modern",
    layout: "two-column",
    sidebarPosition: "left",
    sidebarSections: ["skills", "languages", "certifications"],
    defaults: {
      primaryColor: "#1e40af",
      fontFamily: "roboto",
      fontSize: 10,
      lineHeight: 1.4,
      margins: 40,
    },
    design: {
      headerVariant: "executive",
      headerAlignment: "left",
      contactLayout: "split",
      headerBand: true,
      headingVariant: "rule",
      headingCase: "uppercase",
      entryVariant: "standard",
      skillVariant: "compact",
      density: "comfortable",
      pageBorder: false,
      subtleFill: true,
      sectionDividers: "none",
    },
    thumbnail: { scale: 0.36 },
  }),
  defineTemplate({
    id: "oslo-skyline",
    name: "Oslo Skyline",
    description: "Clean Scandinavian design with optimized space and modern inter typography.",
    preview: "/templates/oslo-skyline.png",
    accessTier: "free",
    isAtsSafe: true,
    category: "Modern",
    layout: "single-column",
    defaults: {
      primaryColor: "#0f172a",
      fontFamily: "inter",
      fontSize: 11,
      lineHeight: 1.5,
      margins: 48,
    },
    design: {
      headerVariant: "modern",
      headerAlignment: "left",
      contactLayout: "stacked",
      headerBand: true,
      headingVariant: "eyebrow",
      headingCase: "title",
      entryVariant: "outlined",
      skillVariant: "compact",
      density: "comfortable",
      pageBorder: false,
      subtleFill: false,
      sectionDividers: "thin",
    },
    thumbnail: { scale: 0.38 },
  }),
  defineTemplate({
    id: "munich-precision",
    name: "Munich Precision",
    description: "Strictly organized professional layout for maximum corporate impact.",
    preview: "/templates/munich-precision.png",
    accessTier: "free",
    isAtsSafe: true,
    category: "Professional",
    layout: "single-column",
    defaults: {
      primaryColor: "#111827",
      fontFamily: "calibri",
      fontSize: 11,
      lineHeight: 1.4,
      margins: 44,
    },
    design: {
      headerVariant: "classic",
      headerAlignment: "left",
      contactLayout: "inline",
      headerBand: false,
      headingVariant: "rule",
      headingCase: "uppercase",
      entryVariant: "standard",
      skillVariant: "inline",
      density: "comfortable",
      pageBorder: false,
      subtleFill: false,
      sectionDividers: "bold",
    },
    thumbnail: { scale: 0.38 },
  }),
  defineTemplate({
    id: "toronto-tower",
    name: "Toronto Tower",
    description: "Modern, high-impact design using montserrat for high-level management roles.",
    preview: "/templates/toronto-tower.png",
    accessTier: "pro",
    isAtsSafe: true,
    category: "Professional",
    layout: "single-column",
    defaults: {
      primaryColor: "#0f172a",
      fontFamily: "montserrat",
      fontSize: 11,
      lineHeight: 1.5,
      margins: 48,
    },
    design: {
      headerVariant: "executive",
      headerAlignment: "center",
      contactLayout: "split",
      headerBand: true,
      headingVariant: "serif",
      headingCase: "uppercase",
      entryVariant: "standard",
      skillVariant: "compact",
      density: "comfortable",
      pageBorder: false,
      subtleFill: true,
      sectionDividers: "bold",
    },
    thumbnail: { scale: 0.38 },
  }),
];

const TEMPLATE_LOOKUP = new Map(TEMPLATES.map((template) => [template.id, template]));
const LEGACY_TEMPLATE_LOOKUP = new Map(
  TEMPLATES.flatMap((template) =>
    (template.legacyIds ?? []).map((legacyId) => [legacyId, template.id] as const)
  )
);

export const TEMPLATE_ACCESS_ORDER: Record<TemplateAccessTier, number> = {
  free: 0,
  pro: 1,
  master: 2,
};

export function normalizeTemplateAccessTier(plan?: string | null): TemplateAccessTier {
  const normalizedPlan = (plan ?? "free").toLowerCase();

  if (normalizedPlan === "master") return "master";
  if (normalizedPlan === "pro") return "pro";
  return "free";
}

export function resolveTemplateId(templateId?: string | null): string {
  if (!templateId) return TEMPLATES[0].id;
  return TEMPLATE_LOOKUP.has(templateId)
    ? templateId
    : LEGACY_TEMPLATE_LOOKUP.get(templateId) ?? TEMPLATES[0].id;
}

export function getTemplateConfig(templateId?: string | null): TemplateConfig {
  return TEMPLATE_LOOKUP.get(resolveTemplateId(templateId)) ?? TEMPLATES[0];
}

export function canAccessTemplate(template: TemplateConfig | string, plan?: string | null) {
  const resolvedTemplate = typeof template === "string" ? getTemplateConfig(template) : template;
  return (
    TEMPLATE_ACCESS_ORDER[normalizeTemplateAccessTier(plan)] >=
    TEMPLATE_ACCESS_ORDER[resolvedTemplate.accessTier]
  );
}

export function getTemplateTierLabel(accessTier: TemplateAccessTier) {
  if (accessTier === "master") return "Master";
  if (accessTier === "pro") return "Pro";
  return "Free";
}

export function getTemplateCountForPlan(plan?: string | null) {
  return TEMPLATES.filter((template) => canAccessTemplate(template, plan)).length;
}

export function getTemplatePresetStyles(templateId?: string | null) {
  const template = getTemplateConfig(templateId);
  return {
    primaryColor: template.defaults.primaryColor,
    fontFamily: template.defaults.fontFamily,
    fontSize: template.defaults.fontSize,
    lineHeight: template.defaults.lineHeight,
    margins: template.defaults.margins,
  };
}

export function buildTemplatePreviewResume(templateId?: string | null) {
  const template = getTemplateConfig(templateId);

  return {
    id: `preview-${template.id}`,
    name: "Template Preview",
    templateId: template.id,
    sectionOrder: DEFAULT_SECTION_ORDER,
    styles: {
      ...getTemplatePresetStyles(template.id),
    },
    content: {
      personal: {
        name: "Jordan Morgan",
        title: "Senior Product Analyst",
        email: "jordan.morgan@email.com",
        phone: "+44 7700 900123",
        location: "London, UK",
        linkedin: "linkedin.com/in/jordanmorgan",
        website: "jordanmorgan.dev",
        photoUrl: "",
      },
      summary:
        "<p>ATS-safe resume sample showing clean hierarchy, measurable outcomes, and premium recruiter-friendly formatting.</p>",
      experience: [
        {
          id: "exp-1",
          title: "Senior Product Analyst",
          company: "Northbridge Labs",
          period: "2022 - Present",
          description:
            "<ul><li>Improved reporting workflows and reduced manual review time by 38%.</li><li>Partnered with design and engineering to ship high-trust candidate tooling.</li></ul>",
        },
      ],
      projects: [
        {
          id: "proj-1",
          name: "Resume Workflow Refresh",
          url: "",
          description:
            "<p>Redesigned a cross-platform resume experience focused on print quality, ATS parsing, and mobile usability.</p>",
        },
      ],
      education: [
        {
          id: "edu-1",
          degree: "BSc Business Information Systems",
          institution: "University of Manchester",
          period: "2018",
        },
      ],
      skills: [
        "Resume Strategy",
        "Stakeholder Communication",
        "ATS Optimization",
        "Product Analytics",
        "Content Systems",
      ],
      certifications: [
        {
          id: "cert-1",
          name: "Professional Scrum Product Owner",
          date: "2024",
        },
      ],
      languages: [
        { language: "English", proficiency: "Native" },
        { language: "French", proficiency: "Professional Working" },
      ],
    },
  };
}
