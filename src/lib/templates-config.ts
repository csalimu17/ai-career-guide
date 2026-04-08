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
  layout: "single-column";
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
  defineTemplate({
    id: "classic-ats",
    name: "Classic ATS",
    description: "Straightforward reverse-chronological structure with crisp rules, office-safe typography, and recruiter-first hierarchy.",
    preview: "",
    accessTier: "free",
    isAtsSafe: true,
    category: "Classic",
    layout: "single-column",
    legacyIds: ["classic", "legal-standard", "academic", "clean-chronology", "ivy-formal"],
    defaults: {
      primaryColor: "#1f3a5f",
      fontFamily: "calibri",
      fontSize: 11,
      lineHeight: 1.5,
      margins: 42,
    },
    design: {
      headerVariant: "classic",
      headerAlignment: "left",
      contactLayout: "inline",
      headingVariant: "rule",
      headingCase: "uppercase",
      entryVariant: "standard",
      skillVariant: "stacked",
      density: "comfortable",
      pageBorder: false,
      headerBand: false,
      subtleFill: false,
    },
    thumbnail: {
      scale: 0.38,
    },
  }),
  defineTemplate({
    id: "modern-ats",
    name: "Modern ATS",
    description: "A polished single-column modern resume with sharper hierarchy, clean spacing, and strong ATS readability.",
    preview: "",
    accessTier: "free",
    isAtsSafe: true,
    category: "Modern",
    layout: "single-column",
    legacyIds: ["modern", "simple-bold", "startup", "startup-v2", "metro-slate", "tech-visionary"],
    defaults: {
      primaryColor: "#0f766e",
      fontFamily: "helvetica",
      fontSize: 11,
      lineHeight: 1.48,
      margins: 40,
    },
    design: {
      headerVariant: "modern",
      headerAlignment: "left",
      contactLayout: "inline",
      headingVariant: "eyebrow",
      headingCase: "uppercase",
      entryVariant: "accented",
      skillVariant: "compact",
      density: "comfortable",
      pageBorder: false,
      headerBand: true,
      subtleFill: true,
    },
    thumbnail: {
      scale: 0.38,
    },
  }),
  defineTemplate({
    id: "minimal-professional",
    name: "Minimal Professional",
    description: "Refined serif-led professionalism with understated rules, clean spacing, and dependable print output.",
    preview: "",
    accessTier: "free",
    isAtsSafe: true,
    category: "Professional",
    layout: "single-column",
    legacyIds: ["minimal", "strategic-ledger", "blueprint", "atlas-frame"],
    defaults: {
      primaryColor: "#374151",
      fontFamily: "cambria",
      fontSize: 11.5,
      lineHeight: 1.52,
      margins: 46,
    },
    design: {
      headerVariant: "minimal",
      headerAlignment: "center",
      contactLayout: "stacked",
      headingVariant: "serif",
      headingCase: "title",
      entryVariant: "standard",
      skillVariant: "inline",
      density: "relaxed",
      pageBorder: true,
      headerBand: false,
      subtleFill: false,
    },
    thumbnail: {
      scale: 0.38,
    },
  }),
  defineTemplate({
    id: "compact-slate",
    name: "Compact Slate",
    description: "Tighter spacing, confident sans-serif hierarchy, and strong recruiter readability for one-page applications.",
    preview: "",
    accessTier: "free",
    isAtsSafe: true,
    category: "Modern",
    layout: "single-column",
    defaults: {
      primaryColor: "#475569",
      fontFamily: "segoe-ui",
      fontSize: 10.5,
      lineHeight: 1.45,
      margins: 38,
    },
    design: {
      headerVariant: "modern",
      headerAlignment: "left",
      contactLayout: "inline",
      headingVariant: "rule",
      headingCase: "uppercase",
      entryVariant: "standard",
      skillVariant: "compact",
      density: "compact",
      pageBorder: false,
      headerBand: true,
      subtleFill: false,
    },
    thumbnail: {
      scale: 0.39,
    },
  }),
  defineTemplate({
    id: "serif-balance",
    name: "Serif Balance",
    description: "Calm classic formatting with balanced spacing and elevated serif detail that still stays ATS-safe.",
    preview: "",
    accessTier: "free",
    isAtsSafe: true,
    category: "Classic",
    layout: "single-column",
    defaults: {
      primaryColor: "#5b4636",
      fontFamily: "palatino",
      fontSize: 11.25,
      lineHeight: 1.54,
      margins: 44,
    },
    design: {
      headerVariant: "minimal",
      headerAlignment: "center",
      contactLayout: "stacked",
      headingVariant: "serif",
      headingCase: "title",
      entryVariant: "standard",
      skillVariant: "inline",
      density: "comfortable",
      pageBorder: false,
      headerBand: false,
      subtleFill: false,
    },
    thumbnail: {
      scale: 0.38,
    },
  }),
  defineTemplate({
    id: "executive-clean",
    name: "Executive Clean",
    description: "Board-ready structure with split contact handling, strong hierarchy, and conservative print-safe styling.",
    preview: "",
    accessTier: "pro",
    isAtsSafe: true,
    category: "Professional",
    layout: "single-column",
    legacyIds: ["corporate-elite", "boardroom", "summit-executive", "global-leader"],
    defaults: {
      primaryColor: "#1d3557",
      fontFamily: "garamond",
      fontSize: 11.5,
      lineHeight: 1.55,
      margins: 48,
    },
    design: {
      headerVariant: "executive",
      headerAlignment: "left",
      contactLayout: "split",
      headingVariant: "rule",
      headingCase: "uppercase",
      entryVariant: "outlined",
      skillVariant: "stacked",
      density: "relaxed",
      pageBorder: true,
      headerBand: false,
      subtleFill: true,
    },
    thumbnail: {
      scale: 0.37,
    },
  }),
  defineTemplate({
    id: "elegant-professional",
    name: "Elegant Professional",
    description: "A premium but ATS-safe resume with classic typography, gentle framing, and calm recruiter-friendly rhythm.",
    preview: "",
    accessTier: "pro",
    isAtsSafe: true,
    category: "Professional",
    layout: "single-column",
    legacyIds: [
      "neo-classic",
      "elegant",
      "master-resume",
      "signature",
      "skyline-glow",
      "pulse-minimal",
      "creative",
      "portfolio-column",
      "atelier-portfolio",
      "horizon-flow",
    ],
    defaults: {
      primaryColor: "#6b4f3b",
      fontFamily: "georgia",
      fontSize: 11.5,
      lineHeight: 1.55,
      margins: 46,
    },
    design: {
      headerVariant: "elegant",
      headerAlignment: "center",
      contactLayout: "inline",
      headingVariant: "serif",
      headingCase: "uppercase",
      entryVariant: "outlined",
      skillVariant: "inline",
      density: "relaxed",
      pageBorder: true,
      headerBand: false,
      subtleFill: true,
    },
    thumbnail: {
      scale: 0.37,
    },
  }),
  defineTemplate({
    id: "urban-signal",
    name: "Urban Signal",
    description: "Sharper ATS styling with accent rails, compact skill rows, and a confident contemporary rhythm.",
    preview: "",
    accessTier: "pro",
    isAtsSafe: true,
    category: "Modern",
    layout: "single-column",
    defaults: {
      primaryColor: "#14532d",
      fontFamily: "arial",
      fontSize: 10.75,
      lineHeight: 1.46,
      margins: 40,
    },
    design: {
      headerVariant: "modern",
      headerAlignment: "left",
      contactLayout: "inline",
      headingVariant: "eyebrow",
      headingCase: "uppercase",
      entryVariant: "accented",
      skillVariant: "compact",
      density: "compact",
      pageBorder: false,
      headerBand: true,
      subtleFill: true,
    },
    thumbnail: {
      scale: 0.39,
    },
  }),
  defineTemplate({
    id: "formal-outline",
    name: "Formal Outline",
    description: "More traditional structure with gentle framing and stronger entry containers for polished senior-role applications.",
    preview: "",
    accessTier: "pro",
    isAtsSafe: true,
    category: "Classic",
    layout: "single-column",
    defaults: {
      primaryColor: "#334155",
      fontFamily: "times-new-roman",
      fontSize: 11.25,
      lineHeight: 1.54,
      margins: 46,
    },
    design: {
      headerVariant: "classic",
      headerAlignment: "left",
      contactLayout: "inline",
      headingVariant: "rule",
      headingCase: "uppercase",
      entryVariant: "outlined",
      skillVariant: "stacked",
      density: "comfortable",
      pageBorder: true,
      headerBand: false,
      subtleFill: true,
    },
    thumbnail: {
      scale: 0.37,
    },
  }),
  defineTemplate({
    id: "slate-focus",
    name: "Slate Focus",
    description: "Lean professional layout with quiet styling, compact spacing, and fast ATS parsing for modern applications.",
    preview: "",
    accessTier: "pro",
    isAtsSafe: true,
    category: "Professional",
    layout: "single-column",
    defaults: {
      primaryColor: "#155e75",
      fontFamily: "verdana",
      fontSize: 10.5,
      lineHeight: 1.45,
      margins: 40,
    },
    design: {
      headerVariant: "minimal",
      headerAlignment: "left",
      contactLayout: "inline",
      headingVariant: "rule",
      headingCase: "uppercase",
      entryVariant: "standard",
      skillVariant: "compact",
      density: "compact",
      pageBorder: false,
      headerBand: false,
      subtleFill: false,
    },
    thumbnail: {
      scale: 0.39,
    },
  }),
  defineTemplate({
    id: "boardroom-signature",
    name: "Boardroom Signature",
    description: "Master-tier executive presentation with confident spacing, split contact block, and premium print-safe framing.",
    preview: "",
    accessTier: "master",
    isAtsSafe: true,
    category: "Professional",
    layout: "single-column",
    defaults: {
      primaryColor: "#1e3a8a",
      fontFamily: "garamond",
      fontSize: 11.75,
      lineHeight: 1.58,
      margins: 50,
    },
    design: {
      headerVariant: "executive",
      headerAlignment: "left",
      contactLayout: "split",
      headingVariant: "rule",
      headingCase: "uppercase",
      entryVariant: "outlined",
      skillVariant: "stacked",
      density: "relaxed",
      pageBorder: true,
      headerBand: false,
      subtleFill: true,
    },
    thumbnail: {
      scale: 0.36,
    },
  }),
  defineTemplate({
    id: "capital-serif",
    name: "Capital Serif",
    description: "Elegant centered masthead with classic serif detail and recruiter-friendly structure for distinguished applications.",
    preview: "",
    accessTier: "master",
    isAtsSafe: true,
    category: "Classic",
    layout: "single-column",
    defaults: {
      primaryColor: "#7c2d12",
      fontFamily: "georgia",
      fontSize: 11.5,
      lineHeight: 1.56,
      margins: 48,
    },
    design: {
      headerVariant: "elegant",
      headerAlignment: "center",
      contactLayout: "inline",
      headingVariant: "serif",
      headingCase: "title",
      entryVariant: "outlined",
      skillVariant: "inline",
      density: "relaxed",
      pageBorder: true,
      headerBand: false,
      subtleFill: true,
    },
    thumbnail: {
      scale: 0.36,
    },
  }),
  defineTemplate({
    id: "precision-ledger",
    name: "Precision Ledger",
    description: "High-density ATS resume with disciplined spacing and fast-scanning hierarchy for technical and analytical roles.",
    preview: "",
    accessTier: "master",
    isAtsSafe: true,
    category: "Modern",
    layout: "single-column",
    defaults: {
      primaryColor: "#0f766e",
      fontFamily: "tahoma",
      fontSize: 10.5,
      lineHeight: 1.43,
      margins: 38,
    },
    design: {
      headerVariant: "classic",
      headerAlignment: "left",
      contactLayout: "inline",
      headingVariant: "rule",
      headingCase: "uppercase",
      entryVariant: "standard",
      skillVariant: "compact",
      density: "compact",
      pageBorder: true,
      headerBand: false,
      subtleFill: false,
    },
    thumbnail: {
      scale: 0.39,
    },
  }),
  defineTemplate({
    id: "nordic-minimal",
    name: "Nordic Minimal",
    description: "Quiet minimal styling with centered hierarchy and generous breathing room for premium modern applications.",
    preview: "",
    accessTier: "master",
    isAtsSafe: true,
    category: "Professional",
    layout: "single-column",
    defaults: {
      primaryColor: "#374151",
      fontFamily: "cambria",
      fontSize: 11.25,
      lineHeight: 1.56,
      margins: 48,
    },
    design: {
      headerVariant: "minimal",
      headerAlignment: "center",
      contactLayout: "stacked",
      headingVariant: "serif",
      headingCase: "uppercase",
      entryVariant: "standard",
      skillVariant: "inline",
      density: "relaxed",
      pageBorder: false,
      headerBand: false,
      subtleFill: false,
    },
    thumbnail: {
      scale: 0.37,
    },
  }),
  defineTemplate({
    id: "summit-strategy",
    name: "Summit Strategy",
    description: "Premium consulting-style hierarchy with strong split header logic and compact ATS-safe content blocks.",
    preview: "",
    accessTier: "master",
    isAtsSafe: true,
    category: "Professional",
    layout: "single-column",
    defaults: {
      primaryColor: "#1d4ed8",
      fontFamily: "calibri",
      fontSize: 11,
      lineHeight: 1.5,
      margins: 44,
    },
    design: {
      headerVariant: "executive",
      headerAlignment: "left",
      contactLayout: "split",
      headingVariant: "eyebrow",
      headingCase: "uppercase",
      entryVariant: "accented",
      skillVariant: "compact",
      density: "comfortable",
      pageBorder: false,
      headerBand: false,
      subtleFill: true,
    },
    thumbnail: {
      scale: 0.37,
    },
  }),
  defineTemplate({
    id: "atlas-modern",
    name: "Atlas Modern",
    description: "Centered modern header, calm visual framing, and softer outlines for a polished premium presentation.",
    preview: "",
    accessTier: "master",
    isAtsSafe: true,
    category: "Modern",
    layout: "single-column",
    defaults: {
      primaryColor: "#0f172a",
      fontFamily: "helvetica",
      fontSize: 11,
      lineHeight: 1.5,
      margins: 46,
    },
    design: {
      headerVariant: "modern",
      headerAlignment: "center",
      contactLayout: "stacked",
      headingVariant: "eyebrow",
      headingCase: "uppercase",
      entryVariant: "outlined",
      skillVariant: "compact",
      density: "comfortable",
      pageBorder: true,
      headerBand: true,
      subtleFill: true,
    },
    thumbnail: {
      scale: 0.37,
    },
  }),
  defineTemplate({
    id: "regent-outline",
    name: "Regent Outline",
    description: "A framed premium layout with crisp section rules and stronger entry outlines for senior professional profiles.",
    preview: "",
    accessTier: "master",
    isAtsSafe: true,
    category: "Professional",
    layout: "single-column",
    defaults: {
      primaryColor: "#6b7280",
      fontFamily: "palatino",
      fontSize: 11.25,
      lineHeight: 1.54,
      margins: 48,
    },
    design: {
      headerVariant: "elegant",
      headerAlignment: "left",
      contactLayout: "inline",
      headingVariant: "rule",
      headingCase: "uppercase",
      entryVariant: "outlined",
      skillVariant: "stacked",
      density: "comfortable",
      pageBorder: true,
      headerBand: false,
      subtleFill: false,
    },
    thumbnail: {
      scale: 0.36,
    },
  }),
  defineTemplate({
    id: "monarch-classic",
    name: "Monarch Classic",
    description: "Traditional centered hierarchy with formal serif detail and conservative spacing for high-trust applications.",
    preview: "",
    accessTier: "master",
    isAtsSafe: true,
    category: "Classic",
    layout: "single-column",
    defaults: {
      primaryColor: "#4b5563",
      fontFamily: "times-new-roman",
      fontSize: 11.5,
      lineHeight: 1.57,
      margins: 50,
    },
    design: {
      headerVariant: "classic",
      headerAlignment: "center",
      contactLayout: "stacked",
      headingVariant: "serif",
      headingCase: "title",
      entryVariant: "standard",
      skillVariant: "inline",
      density: "relaxed",
      pageBorder: true,
      headerBand: false,
      subtleFill: false,
    },
    thumbnail: {
      scale: 0.36,
    },
  }),
  defineTemplate({
    id: "horizon-brief",
    name: "Horizon Brief",
    description: "Modern premium brief with lighter framing, quick-scanning accents, and a recruiter-friendly compact footprint.",
    preview: "",
    accessTier: "master",
    isAtsSafe: true,
    category: "Modern",
    layout: "single-column",
    defaults: {
      primaryColor: "#5b21b6",
      fontFamily: "arial",
      fontSize: 10.75,
      lineHeight: 1.46,
      margins: 40,
    },
    design: {
      headerVariant: "minimal",
      headerAlignment: "left",
      contactLayout: "inline",
      headingVariant: "eyebrow",
      headingCase: "uppercase",
      entryVariant: "accented",
      skillVariant: "compact",
      density: "comfortable",
      pageBorder: false,
      headerBand: false,
      subtleFill: true,
    },
    thumbnail: {
      scale: 0.38,
    },
  }),
  defineTemplate({
    id: "studio-premier",
    name: "Studio Premier",
    description: "High-polish premium layout combining split contact structure, subtle fill, and print-safe executive rhythm.",
    preview: "",
    accessTier: "master",
    isAtsSafe: true,
    category: "Professional",
    layout: "single-column",
    defaults: {
      primaryColor: "#b45309",
      fontFamily: "segoe-ui",
      fontSize: 11,
      lineHeight: 1.5,
      margins: 46,
    },
    design: {
      headerVariant: "modern",
      headerAlignment: "left",
      contactLayout: "split",
      headingVariant: "rule",
      headingCase: "uppercase",
      entryVariant: "outlined",
      skillVariant: "compact",
      density: "comfortable",
      pageBorder: false,
      headerBand: true,
      subtleFill: true,
    },
    thumbnail: {
      scale: 0.37,
    },
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
