export type ResumeFontCategory = "Serif Classics" | "Sans Essentials" | "Office Standards" | "Modern Premium"

export type ResumeFontKey =
  | "serif"
  | "georgia"
  | "times-new-roman"
  | "cambria"
  | "garamond"
  | "baskerville"
  | "palatino"
  | "merriweather"
  | "playfair"
  | "sans"
  | "arial"
  | "helvetica"
  | "segoe-ui"
  | "calibri"
  | "verdana"
  | "tahoma"
  | "trebuchet"
  | "gill-sans"
  | "inter"
  | "roboto"
  | "montserrat"
  | "manrope"
  | "space-grotesk"

export interface ResumeFontOption {
  value: ResumeFontKey
  label: string
  category: ResumeFontCategory
  stack: string
}

export const RESUME_FONT_OPTIONS: ResumeFontOption[] = [
  {
    value: "serif",
    label: "Standard Serif",
    category: "Serif Classics",
    stack: 'Georgia, "Times New Roman", Times, serif',
  },
  {
    value: "georgia",
    label: "Georgia",
    category: "Serif Classics",
    stack: 'Georgia, "Times New Roman", Times, serif',
  },
  {
    value: "times-new-roman",
    label: "Times New Roman",
    category: "Serif Classics",
    stack: '"Times New Roman", Times, serif',
  },
  {
    value: "cambria",
    label: "Cambria",
    category: "Serif Classics",
    stack: 'Cambria, Georgia, "Times New Roman", serif',
  },
  {
    value: "garamond",
    label: "Garamond",
    category: "Serif Classics",
    stack: 'Garamond, Baskerville, "Times New Roman", serif',
  },
  {
    value: "baskerville",
    label: "Baskerville",
    category: "Serif Classics",
    stack: 'Baskerville, "Baskerville Old Face", Garamond, "Times New Roman", serif',
  },
  {
    value: "palatino",
    label: "Palatino",
    category: "Serif Classics",
    stack: '"Palatino Linotype", Palatino, "Book Antiqua", Georgia, serif',
  },
  {
    value: "merriweather",
    label: "Merriweather",
    category: "Modern Premium",
    stack: 'var(--font-merriweather), Georgia, "Times New Roman", serif',
  },
  {
    value: "playfair",
    label: "Playfair Display",
    category: "Modern Premium",
    stack: 'var(--font-playfair-display), Georgia, "Times New Roman", serif',
  },
  {
    value: "sans",
    label: "Standard Sans",
    category: "Sans Essentials",
    stack: 'Arial, Helvetica, sans-serif',
  },
  {
    value: "arial",
    label: "Arial",
    category: "Sans Essentials",
    stack: 'Arial, Helvetica, sans-serif',
  },
  {
    value: "helvetica",
    label: "Helvetica Neue",
    category: "Sans Essentials",
    stack: '"Helvetica Neue", Helvetica, Arial, sans-serif',
  },
  {
    value: "segoe-ui",
    label: "Segoe UI",
    category: "Office Standards",
    stack: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
  },
  {
    value: "calibri",
    label: "Calibri",
    category: "Office Standards",
    stack: 'Calibri, "Segoe UI", Arial, sans-serif',
  },
  {
    value: "verdana",
    label: "Verdana",
    category: "Office Standards",
    stack: 'Verdana, Geneva, sans-serif',
  },
  {
    value: "tahoma",
    label: "Tahoma",
    category: "Office Standards",
    stack: 'Tahoma, "Segoe UI", sans-serif',
  },
  {
    value: "trebuchet",
    label: "Trebuchet MS",
    category: "Office Standards",
    stack: '"Trebuchet MS", "Lucida Sans Unicode", "Lucida Grande", Arial, sans-serif',
  },
  {
    value: "gill-sans",
    label: "Gill Sans",
    category: "Office Standards",
    stack: '"Gill Sans", "Gill Sans MT", Calibri, sans-serif',
  },
  {
    value: "inter",
    label: "Inter",
    category: "Modern Premium",
    stack: 'var(--font-inter), "Segoe UI", Arial, sans-serif',
  },
  {
    value: "roboto",
    label: "Roboto",
    category: "Modern Premium",
    stack: 'var(--font-roboto), "Segoe UI", Arial, sans-serif',
  },
  {
    value: "montserrat",
    label: "Montserrat",
    category: "Modern Premium",
    stack: 'var(--font-montserrat), "Avenir Next", "Segoe UI", sans-serif',
  },
  {
    value: "manrope",
    label: "Manrope",
    category: "Modern Premium",
    stack: 'var(--font-manrope), "Segoe UI", Arial, sans-serif',
  },
  {
    value: "space-grotesk",
    label: "Space Grotesk",
    category: "Modern Premium",
    stack: 'var(--font-space-grotesk), "Segoe UI", Arial, sans-serif',
  },
]

export const RESUME_FONT_GROUPS = RESUME_FONT_OPTIONS.reduce<Record<ResumeFontCategory, ResumeFontOption[]>>(
  (groups, option) => {
    groups[option.category].push(option)
    return groups
  },
  {
    "Serif Classics": [],
    "Sans Essentials": [],
    "Office Standards": [],
    "Modern Premium": [],
  }
)

const RESUME_FONT_LOOKUP = new Map(RESUME_FONT_OPTIONS.map((option) => [option.value, option]))

export const ATS_SAFE_RESUME_FONT_KEYS: ResumeFontKey[] = [
  "serif",
  "georgia",
  "times-new-roman",
  "cambria",
  "garamond",
  "palatino",
  "sans",
  "arial",
  "helvetica",
  "segoe-ui",
  "calibri",
  "verdana",
  "tahoma",
  "trebuchet",
]

const ATS_SAFE_FONT_SET = new Set<ResumeFontKey>(ATS_SAFE_RESUME_FONT_KEYS)

export const ATS_SAFE_RESUME_FONT_GROUPS = RESUME_FONT_OPTIONS.filter((option) =>
  ATS_SAFE_FONT_SET.has(option.value)
).reduce<Record<ResumeFontCategory, ResumeFontOption[]>>(
  (groups, option) => {
    groups[option.category].push(option)
    return groups
  },
  {
    "Serif Classics": [],
    "Sans Essentials": [],
    "Office Standards": [],
    "Modern Premium": [],
  }
)

export function getResumeFontStack(fontKey?: string | null) {
  return RESUME_FONT_LOOKUP.get((fontKey as ResumeFontKey) || "serif")?.stack ?? RESUME_FONT_LOOKUP.get("serif")!.stack
}

export function isAtsSafeResumeFont(fontKey?: string | null): fontKey is ResumeFontKey {
  return ATS_SAFE_FONT_SET.has((fontKey as ResumeFontKey) || "serif")
}

export function coerceResumeFontKey(
  fontKey: string | null | undefined,
  fallback: ResumeFontKey = "calibri"
): ResumeFontKey {
  return isAtsSafeResumeFont(fontKey) ? (fontKey as ResumeFontKey) : fallback
}
