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
  | "interests"
  | "page-break";

export type TemplateAccessTier = "free" | "pro" | "master";
export type TemplateHeaderVariant = "classic" | "modern" | "minimal" | "executive" | "elegant" | "banner" | "monogram";
export type TemplateHeadingVariant = "rule" | "eyebrow" | "serif";
export type TemplateEntryVariant = "standard" | "accented" | "outlined" | "timeline" | "boxed";
export type TemplateSkillVariant = "stacked" | "inline" | "compact" | "dots";
export type TemplateDensity = "compact" | "comfortable" | "relaxed";
export type TemplatePhotoVariant = "soft-square" | "rounded-square" | "circle" | "framed";
export type TemplateContactVariant = "text" | "chips";
export type TemplateSidebarVariant = "plain" | "panel" | "tint";

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
    photoVariant: TemplatePhotoVariant;
    contactVariant: TemplateContactVariant;
    sidebarVariant?: TemplateSidebarVariant;
  };
  thumbnail: {
    scale: number;
  };
};

type TemplateDefinition = Omit<TemplateConfig, "isPremium" | "design"> & {
  design: Omit<
    TemplateConfig["design"],
    "photoVariant" | "contactVariant" | "sidebarVariant"
  > &
    Partial<
      Pick<
        TemplateConfig["design"],
        "photoVariant" | "contactVariant" | "sidebarVariant"
      >
    >;
};

function defineTemplate(template: TemplateDefinition): TemplateConfig {
  return {
    ...template,
    design: {
      photoVariant: "soft-square",
      contactVariant: "text",
      sidebarVariant: template.layout === "two-column" ? "panel" : "plain",
      ...template.design,
    },
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
  "interests",
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
      fontFamily: "cormorant-garamond",
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
      photoVariant: "framed",
      contactVariant: "chips",
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
      primaryColor: "#16213a",
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
      photoVariant: "rounded-square",
      contactVariant: "text",
    },
    legacyIds: ["precision-ledger", "capital-serif"],
    thumbnail: { scale: 0.36 },
  }),
  defineTemplate({
    id: "singapore-boardroom",
    name: "Singapore Boardroom",
    description: "Executive centered emblem layout with high-end serif rules and luxury styling.",
    preview: "/templates/singapore-boardroom.png",
    accessTier: "pro",
    isAtsSafe: true,
    category: "Professional",
    layout: "single-column",
    defaults: {
      primaryColor: "#0f766e",
      fontFamily: "merriweather",
      fontSize: 11,
      lineHeight: 1.6,
      margins: 52,
    },
    design: {
      headerVariant: "monogram",
      headerAlignment: "center",
      contactLayout: "inline",
      headerBand: false,
      headingVariant: "serif",
      headingCase: "title",
      entryVariant: "accented",
      skillVariant: "compact",
      density: "relaxed",
      pageBorder: true,
      subtleFill: true,
      sectionDividers: "none",
      photoVariant: "circle",
      contactVariant: "chips",
    },
    legacyIds: ["boardroom-signature", "regent-outline"],
    thumbnail: { scale: 0.4 },
  }),
  defineTemplate({
    id: "sydney-growth",
    name: "Sydney Growth",
    description: "Modern high-impact hero banner with visual timeline entries for fast-growing companies.",
    preview: "/templates/sydney-growth.png",
    accessTier: "free",
    isAtsSafe: true,
    category: "Professional",
    layout: "single-column",
    defaults: {
      primaryColor: "#2563eb",
      fontFamily: "lexend",
      fontSize: 11,
      lineHeight: 1.5,
      margins: 44,
    },
    design: {
      headerVariant: "banner",
      headerAlignment: "left",
      contactLayout: "split",
      headerBand: true,
      headingVariant: "eyebrow",
      headingCase: "uppercase",
      entryVariant: "timeline",
      skillVariant: "compact",
      density: "comfortable",
      pageBorder: false,
      subtleFill: false,
      sectionDividers: "thin",
      photoVariant: "rounded-square",
      contactVariant: "chips",
    },
    legacyIds: ["atlas-modern", "summit-strategy"],
    thumbnail: { scale: 0.38 },
  }),

  // --- MODERN SERIES ---
  defineTemplate({
    id: "san-fran-stack",
    name: "San Francisco Tech",
    description: "Tech-forward two-column layout with contrast hero header and modern boxed entries.",
    preview: "/templates/san-fran-stack.png",
    accessTier: "pro",
    isAtsSafe: true,
    category: "Modern",
    layout: "two-column",
    sidebarPosition: "left",
    sidebarSections: ["skills", "languages", "education", "certifications", "interests"],
    defaults: {
      primaryColor: "#334155",
      fontFamily: "inter",
      fontSize: 10,
      lineHeight: 1.5,
      margins: 40,
    },
    design: {
      headerVariant: "banner",
      headerAlignment: "left",
      contactLayout: "stacked",
      headerBand: false,
      headingVariant: "eyebrow",
      headingCase: "uppercase",
      entryVariant: "boxed",
      skillVariant: "compact",
      density: "comfortable",
      pageBorder: false,
      subtleFill: true,
      sectionDividers: "none",
      photoVariant: "rounded-square",
      contactVariant: "chips",
      sidebarVariant: "tint",
    },
    legacyIds: ["modern-ats", "urban-signal"],
    thumbnail: { scale: 0.36 },
  }),
  defineTemplate({
    id: "berlin-modular",
    name: "Berlin Modular",
    description: "Highly structured modular layout with Space Grotesk font and boxed section blocks.",
    preview: "/templates/berlin-modular.png",
    accessTier: "free",
    isAtsSafe: true,
    category: "Modern",
    layout: "single-column",
    defaults: {
      primaryColor: "#0f172a",
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
      entryVariant: "boxed",
      skillVariant: "compact",
      density: "comfortable",
      pageBorder: false,
      subtleFill: false,
      sectionDividers: "bold",
      photoVariant: "rounded-square",
      contactVariant: "chips",
    },
    legacyIds: ["slate-focus", "compact-slate"],
    thumbnail: { scale: 0.38 },
  }),
  defineTemplate({
    id: "stockholm-clean",
    name: "Stockholm Clean",
    description: "Minimalist two-column design with right-hand sidebar panel and rounded skill tags.",
    preview: "/templates/stockholm-clean.png",
    accessTier: "pro",
    isAtsSafe: true,
    category: "Modern",
    layout: "two-column",
    sidebarPosition: "right",
    sidebarSections: ["skills", "languages", "certifications", "education", "interests"],
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
      photoVariant: "circle",
      contactVariant: "chips",
      sidebarVariant: "panel",
    },
    legacyIds: ["nordic-minimal", "horizon-brief"],
    thumbnail: { scale: 0.38 },
  }),
  defineTemplate({
    id: "austin-bold",
    name: "Austin Bold",
    description: "Vibrant creative hero banner header with violet accent theme and timeline history.",
    preview: "/templates/austin-bold.png",
    accessTier: "master",
    isAtsSafe: true,
    category: "Modern",
    layout: "single-column",
    defaults: {
      primaryColor: "#8b5cf6",
      fontFamily: "outfit",
      fontSize: 11,
      lineHeight: 1.5,
      margins: 48,
    },
    design: {
      headerVariant: "banner",
      headerAlignment: "left",
      contactLayout: "stacked",
      headerBand: true,
      headingVariant: "eyebrow",
      headingCase: "uppercase",
      entryVariant: "timeline",
      skillVariant: "compact",
      density: "comfortable",
      pageBorder: false,
      subtleFill: false,
      sectionDividers: "bold",
      photoVariant: "circle",
      contactVariant: "chips",
    },
    legacyIds: ["studio-premier"],
    thumbnail: { scale: 0.38 },
  }),

  // --- CLASSIC & CREATIVE SERIES ---
  defineTemplate({
    id: "paris-atelier",
    name: "Paris Atelier",
    description: "Luxury couture layout with elegant serif monogram header and double-line dividers.",
    preview: "/templates/paris-atelier.png",
    accessTier: "pro",
    isAtsSafe: true,
    category: "Classic",
    layout: "single-column",
    defaults: {
      primaryColor: "#78350f",
      fontFamily: "playfair",
      fontSize: 12,
      lineHeight: 1.6,
      margins: 56,
    },
    design: {
      headerVariant: "monogram",
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
      photoVariant: "framed",
      contactVariant: "text",
    },
    legacyIds: ["elegant-professional", "serif-balance"],
    thumbnail: { scale: 0.42 },
  }),
  defineTemplate({
    id: "milan-chic",
    name: "Milan Chic",
    description: "High-fashion two-column editorial layout with left sidebar and executive typography.",
    preview: "/templates/milan-chic.png",
    accessTier: "pro",
    isAtsSafe: true,
    category: "Classic",
    layout: "two-column",
    sidebarPosition: "left",
    sidebarSections: ["skills", "languages", "education", "certifications", "interests"],
    defaults: {
      primaryColor: "#111827",
      fontFamily: "cormorant-garamond",
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
      entryVariant: "accented",
      skillVariant: "compact",
      density: "comfortable",
      pageBorder: false,
      subtleFill: true,
      sectionDividers: "thin",
      photoVariant: "framed",
      sidebarVariant: "tint",
      contactVariant: "chips",
    },
    legacyIds: ["minimal-professional", "formal-outline"],
    thumbnail: { scale: 0.38 },
  }),
  defineTemplate({
    id: "vienna-heritage",
    name: "Vienna Heritage",
    description: "Traditional academic and legal layout with double rule dividers and formal serif fonts.",
    preview: "/templates/vienna-heritage.png",
    accessTier: "free",
    isAtsSafe: true,
    category: "Classic",
    layout: "single-column",
    defaults: {
      primaryColor: "#111827",
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
      contactVariant: "text",
    },
    legacyIds: ["monarch-classic"],
    thumbnail: { scale: 0.4 },
  }),
  defineTemplate({
    id: "amsterdam-grid",
    name: "Amsterdam Grid",
    description: "Clean modern grid layout with boxed experience entries and split contact bar.",
    preview: "/templates/amsterdam-grid.png",
    accessTier: "pro",
    isAtsSafe: true,
    category: "Classic",
    layout: "single-column",
    defaults: {
      primaryColor: "#0f4c5c",
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
      entryVariant: "boxed",
      skillVariant: "compact",
      density: "comfortable",
      pageBorder: false,
      subtleFill: true,
      sectionDividers: "thin",
      contactVariant: "chips",
    },
    thumbnail: { scale: 0.38 },
  }),
  defineTemplate({
    id: "tokyo-precise",
    name: "Tokyo Precise",
    description: "Ultra-compact technical single-column layout for engineering and systems architects.",
    preview: "/templates/tokyo-precise.png",
    accessTier: "pro",
    isAtsSafe: true,
    category: "Professional",
    layout: "single-column",
    defaults: {
      primaryColor: "#0f172a",
      fontFamily: "space-grotesk",
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
      photoVariant: "rounded-square",
      contactVariant: "chips",
    },
    thumbnail: { scale: 0.35 },
  }),
  defineTemplate({
    id: "lisbon-coastal",
    name: "Lisbon Coastal",
    description: "Teal hero banner with right sidebar, rounded avatar, and skill proficiency dots.",
    preview: "/templates/lisbon-coastal.png",
    accessTier: "master",
    isAtsSafe: true,
    category: "Modern",
    layout: "two-column",
    sidebarPosition: "right",
    sidebarSections: ["skills", "languages", "education", "certifications", "interests"],
    defaults: {
      primaryColor: "#0d9488",
      fontFamily: "lexend",
      fontSize: 11,
      lineHeight: 1.6,
      margins: 52,
    },
    design: {
      headerVariant: "banner",
      headerAlignment: "left",
      contactLayout: "split",
      headerBand: false,
      headingVariant: "eyebrow",
      headingCase: "title",
      entryVariant: "accented",
      skillVariant: "dots",
      density: "relaxed",
      pageBorder: false,
      subtleFill: true,
      sectionDividers: "none",
      photoVariant: "circle",
      contactVariant: "chips",
      sidebarVariant: "tint",
    },
    thumbnail: { scale: 0.4 },
  }),
  defineTemplate({
    id: "madrid-vibrant",
    name: "Madrid Vibrant",
    description: "Warm terracotta accents with left timeline connector lines for marketing and sales.",
    preview: "/templates/madrid-vibrant.png",
    accessTier: "free",
    isAtsSafe: true,
    category: "Classic",
    layout: "single-column",
    defaults: {
      primaryColor: "#c2410c",
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
      entryVariant: "timeline",
      skillVariant: "compact",
      density: "comfortable",
      pageBorder: false,
      subtleFill: false,
      sectionDividers: "thin",
      photoVariant: "circle",
      contactVariant: "chips",
    },
    thumbnail: { scale: 0.38 },
  }),
  defineTemplate({
    id: "seattle-fog",
    name: "Seattle Fog",
    description: "Sleek slate-gray minimal layout with clean rule lines and crisp typography.",
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
      photoVariant: "soft-square",
      contactVariant: "text",
    },
    thumbnail: { scale: 0.4 },
  }),
  defineTemplate({
    id: "dublin-edge",
    name: "Dublin Edge",
    description: "Electric blue hero banner with left sidebar panel and boxed technical entries.",
    preview: "/templates/dublin-edge.png",
    accessTier: "pro",
    isAtsSafe: true,
    category: "Modern",
    layout: "two-column",
    sidebarPosition: "left",
    sidebarSections: ["skills", "languages", "certifications", "education", "interests"],
    defaults: {
      primaryColor: "#1d4ed8",
      fontFamily: "roboto",
      fontSize: 10,
      lineHeight: 1.4,
      margins: 40,
    },
    design: {
      headerVariant: "banner",
      headerAlignment: "left",
      contactLayout: "split",
      headerBand: true,
      headingVariant: "rule",
      headingCase: "uppercase",
      entryVariant: "boxed",
      skillVariant: "compact",
      density: "comfortable",
      pageBorder: false,
      subtleFill: true,
      sectionDividers: "none",
      photoVariant: "rounded-square",
      contactVariant: "chips",
      sidebarVariant: "tint",
    },
    thumbnail: { scale: 0.36 },
  }),
  defineTemplate({
    id: "oslo-skyline",
    name: "Oslo Skyline",
    description: "Nordic two-column layout with right sidebar panel and outfit sans typography.",
    preview: "/templates/oslo-skyline.png",
    accessTier: "free",
    isAtsSafe: true,
    category: "Modern",
    layout: "two-column",
    sidebarPosition: "right",
    sidebarSections: ["skills", "languages", "education", "certifications", "interests"],
    defaults: {
      primaryColor: "#0f172a",
      fontFamily: "outfit",
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
      photoVariant: "circle",
      contactVariant: "chips",
      sidebarVariant: "panel",
    },
    thumbnail: { scale: 0.38 },
  }),
  defineTemplate({
    id: "munich-precision",
    name: "Munich Precision",
    description: "Corporate dark blue hero header with strict single-column executive structure.",
    preview: "/templates/munich-precision.png",
    accessTier: "free",
    isAtsSafe: true,
    category: "Professional",
    layout: "single-column",
    defaults: {
      primaryColor: "#1e293b",
      fontFamily: "calibri",
      fontSize: 11,
      lineHeight: 1.4,
      margins: 44,
    },
    design: {
      headerVariant: "banner",
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
      photoVariant: "rounded-square",
      contactVariant: "chips",
    },
    thumbnail: { scale: 0.38 },
  }),
  defineTemplate({
    id: "toronto-tower",
    name: "Toronto Tower",
    description: "Deep violet hero banner with boxed entry cards and visual skill rating dots.",
    preview: "/templates/toronto-tower.png",
    accessTier: "pro",
    isAtsSafe: true,
    category: "Professional",
    layout: "single-column",
    defaults: {
      primaryColor: "#6d28d9",
      fontFamily: "montserrat",
      fontSize: 11,
      lineHeight: 1.5,
      margins: 48,
    },
    design: {
      headerVariant: "banner",
      headerAlignment: "center",
      contactLayout: "split",
      headerBand: true,
      headingVariant: "serif",
      headingCase: "uppercase",
      entryVariant: "boxed",
      skillVariant: "dots",
      density: "comfortable",
      pageBorder: false,
      subtleFill: true,
      sectionDividers: "bold",
      photoVariant: "framed",
      contactVariant: "chips",
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
  const previewPhotoByCategory: Record<TemplateConfig["category"], string> = {
    Professional: "/paul-drury-avatar.png",
    Modern: "/sarah-chen-avatar.png",
    Classic: "/marcus-thorne-avatar.png",
  };

  return {
    id: `preview-${template.id}`,
    name: "Template Preview",
    templateId: template.id,
    sectionOrder: [
      "personal",
      "summary",
      "experience",
      "projects",
      "education",
      "skills",
      "certifications",
      "languages",
    ],
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
        photoUrl: previewPhotoByCategory[template.category],
      },
      summary:
        "<p>Strategically minded Senior Product Analyst with over 6 years of experience in optimizing digital workflows and building high-performance product teams. Proven track record in leveraging quantitative insights to drive operational efficiency and revenue growth. Committed to creating ATS-optimized, visually compelling professional identities that resonate with recruiters in competitive corporate environments.</p>",
      experience: [
        {
          id: "exp-1",
          title: "Senior Product Analyst",
          company: "Northbridge Labs",
          period: "2022 - Present",
          description:
            "<ul><li>Improved reporting workflows and reduced manual review time by 38% through automated data pipeline integration.</li><li>Partnered with cross-functional design and engineering teams to ship high-trust candidate vetting tooling used by 500+ daily active users.</li><li>Created comprehensive KPI dashboards utilized by C-suite leadership to guide weekly release decisions and resource allocation.</li><li>Mentored junior analysts on SQL optimization and A/B testing methodologies, leading to a 15% increase in team experiment velocity.</li></ul>",
        },
        {
          id: "exp-2",
          title: "Product Operations Analyst",
          company: "Horizon Studio",
          period: "2020 - 2022",
          description:
            "<ul><li>Mapped complex user journeys, documented release dependencies, and streamlined launch checklists across 4 distinct product squads.</li><li>Established stringent quality-control steps that cut post-release rework by 27% across recurring workflow updates.</li><li>Conducted monthly competitor benchmarking reports, identifying 3 key product gaps that resulted in new feature prioritization.</li><li>Facilitated stakeholder feedback sessions, translating technical debt concerns into actionable sprint tasks.</li></ul>",
        },
        {
          id: "exp-3",
          title: "Data Analyst",
          company: "Vertex Financial",
          period: "2018 - 2020",
          description:
            "<ul><li>Analyzed large-scale customer datasets to identify behavioral patterns that informed acquisition strategy.</li><li>Automated monthly financial reporting for the treasury department, saving roughly 10 hours of manual labor per week.</li><li>Collaborated on the migration of legacy data architecture to cloud-based solutions, improving query performance by 45%.</li></ul>",
        },
      ],
      projects: [
        {
          id: "proj-1",
          name: "Resume Workflow Refresh",
          url: "jordanmorgan.dev/projects/resume-refresh",
          description:
            "<p>Redesigned a cross-platform resume experience focused on pixel-perfect print quality, ATS parsing, and optimal mobile usability for executive roles.</p>",
        },
        {
          id: "proj-2",
          name: "Template Intelligence System",
          url: "jordanmorgan.dev/projects/ai-templates",
          description:
            "<p>Built a template-aware preview engine that highlights layout differences, typography choices, and output quality at a glance using React and Tailwind CSS.</p>",
        },
      ],
      education: [
        {
          id: "edu-1",
          degree: "BSc Business Information Systems",
          institution: "University of Manchester",
          period: "2014 - 2018",
        },
      ],
      skills: [
        "Product Analytics",
        "Resume Strategy",
        "Stakeholder Management",
        "ATS Optimization",
        "Content Systems",
        "Workflow Design",
        "SQL & Python",
        "Tableau / Looker",
        "Agile Methodology",
        "Editorial Quality",
      ],
      certifications: [
        {
          id: "cert-1",
          name: "Professional Scrum Product Owner",
          date: "2024",
        },
        {
          id: "cert-2",
          name: "Google Analytics Certification",
          date: "2023",
        },
        {
          id: "cert-3",
          name: "Advanced SQL for Data Science",
          date: "2022",
        },
      ],
      languages: [
        { language: "English", proficiency: "Native" },
        { language: "French", proficiency: "Professional Working" },
        { language: "Spanish", proficiency: "Conversational" },
      ],
    },
  };
}
