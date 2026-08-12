"use client"

import type { CSSProperties, ReactNode } from "react"
import Image from "next/image"

import { RichTextRenderer } from "@/components/editor/rich-text-renderer"
import { DEFAULT_SECTION_ORDER, getTemplateConfig, type ResumeSectionId, type TemplateConfig, type TemplateEntryVariant } from "@/lib/templates-config"
import { coerceResumeFontKey, getResumeFontStack } from "@/lib/resume-fonts"
import { cn } from "@/lib/utils"

type ResumeRenderMode = "screen" | "mobile" | "print" | "thumbnail"
type ResumeTemplateFamily = TemplateConfig["category"]

interface ResumeTemplateProps {
  data: any
  isPrint?: boolean
  noPadding?: boolean
  mode?: ResumeRenderMode
  className?: string
}

const SECTION_LABELS: Record<Exclude<ResumeSectionId, "page-break">, string> = {
  summary: "Summary",
  experience: "Experience",
  projects: "Projects",
  education: "Education",
  skills: "Skills",
  certifications: "Certifications",
  languages: "Languages",
  interests: "Hobbies & Interests",
}

function extractPrimaryBaseColor(color: string) {
  const match = color.match(/#(?:[0-9a-fA-F]{3}){1,2}/)
  return match?.[0] ?? "#1f3a5f"
}

function hexToRgba(hex: string, alpha: number) {
  const normalized = hex.replace("#", "")
  const expanded =
    normalized.length === 3
      ? normalized
          .split("")
          .map((character) => character + character)
          .join("")
      : normalized

  const value = Number.parseInt(expanded, 16)
  const r = (value >> 16) & 255
  const g = (value >> 8) & 255
  const b = value & 255
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

function pxToMm(px: number) {
  return px * 0.264583
}

function normalizeSectionOrder(sectionOrder?: string[] | null): ResumeSectionId[] {
  const allowed = new Set<ResumeSectionId>([...DEFAULT_SECTION_ORDER, "page-break"])
  const normalized = (sectionOrder ?? DEFAULT_SECTION_ORDER).filter((sectionId): sectionId is ResumeSectionId =>
    allowed.has(sectionId as ResumeSectionId)
  )

  if (!normalized.length) {
    return DEFAULT_SECTION_ORDER
  }

  return normalized
}

function getDensityMetrics(template: TemplateConfig, mode: ResumeRenderMode) {
  const map = {
    compact: {
      headerGap: 12,
      sectionGap: 14,
      entryGap: 8,
      headingGap: 5,
    },
    comfortable: {
      headerGap: 18,
      sectionGap: 20,
      entryGap: 12,
      headingGap: 8,
    },
    relaxed: {
      headerGap: 24,
      sectionGap: 26,
      entryGap: 16,
      headingGap: 11,
    },
  }[template.design.density]

  if (mode === "mobile") {
    return {
      headerGap: Math.max(12, Math.round(map.headerGap * 0.8)),
      sectionGap: Math.max(14, Math.round(map.sectionGap * 0.8)),
      entryGap: Math.max(8, Math.round(map.entryGap * 0.85)),
      headingGap: Math.max(5, Math.round(map.headingGap * 0.8)),
    }
  }

  if (mode === "thumbnail") {
    return {
      headerGap: Math.max(10, Math.round(map.headerGap * 0.7)),
      sectionGap: Math.max(12, Math.round(map.sectionGap * 0.7)),
      entryGap: Math.max(6, Math.round(map.entryGap * 0.7)),
      headingGap: Math.max(4, Math.round(map.headingGap * 0.7)),
    }
  }

  if (mode === "print") {
    return {
      headerGap: Math.max(8, Math.round(map.headerGap * 0.85)),
      sectionGap: Math.max(10, Math.round(map.sectionGap * 0.85)),
      entryGap: Math.max(6, Math.round(map.entryGap * 0.85)),
      headingGap: Math.max(4, Math.round(map.headingGap * 0.85)),
    }
  }

  return map
}

function getContactItems(content: any) {
  return [
    content?.personal?.location,
    content?.personal?.email,
    content?.personal?.phone,
    content?.personal?.linkedin,
    content?.personal?.website,
  ].filter(Boolean)
}

function getEntryShellClassName(variant: TemplateEntryVariant, mode: ResumeRenderMode) {
  switch (variant) {
    case "accented":
      return "border-l-[3px] pl-3.5"
    case "timeline":
      return "relative pl-5 border-l-2 ml-1"
    case "boxed":
      return `${mode === "print" ? "" : "rounded-[0.65rem]"} border p-3.5 shadow-sm`
    case "outlined":
      return `${mode === "print" ? "" : "rounded-[0.55rem]"} border px-4 py-3`
    default:
      return ""
  }
}

function getEntryShellStyle(variant: TemplateEntryVariant, accent: string, mode: ResumeRenderMode, subtleFill?: boolean) {
  if (variant === "accented") {
    return {
      borderLeftColor: accent,
      backgroundImage: mode === "print"
        ? "none"
        : `linear-gradient(90deg, ${hexToRgba(accent, 0.03)}, transparent 85%)`,
    }
  }

  if (variant === "timeline") {
    return {
      borderLeftColor: hexToRgba(accent, 0.45),
    }
  }

  if (variant === "boxed") {
    return {
      borderColor: hexToRgba(accent, 0.15),
      backgroundColor: subtleFill ? hexToRgba(accent, 0.035) : "#f8fafc",
      boxShadow: mode === "print"
        ? "none"
        : `0 4px 14px -4px ${hexToRgba(accent, 0.06)}`,
    }
  }

  if (variant === "outlined") {
    return {
      borderColor: hexToRgba(accent, 0.12),
      backgroundColor: subtleFill ? hexToRgba(accent, 0.025) : "#ffffff",
      boxShadow: mode === "print"
        ? "none"
        : `0 4px 12px -3px ${hexToRgba(accent, 0.04)}, 0 0 0 1px ${hexToRgba(accent, 0.02)}`,
    }
  }

  return undefined
}

function getTemplateFamilyTone(category: ResumeTemplateFamily, mode: ResumeRenderMode) {
  const isPrint = mode === "print"
  switch (category) {
    case "Professional":
      return {
        headerSurfaceClass: isPrint
          ? ""
          : mode === "thumbnail"
            ? "shadow-[0_16px_34px_-28px_rgba(15,23,42,0.28)]"
            : "shadow-[0_18px_42px_-30px_rgba(15,23,42,0.22)]",
        headerSurfaceStyle: undefined as CSSProperties | undefined,
        sectionLabelClass: "uppercase tracking-[0.2em]",
        sectionDividerClass: "h-[1.5px] opacity-90",
      }
    case "Modern":
      return {
        headerSurfaceClass: cn(
          "rounded-[1.45rem] border px-6 py-5",
          !isPrint && "shadow-[0_18px_40px_-32px_rgba(37,99,235,0.16)]"
        ),
        headerSurfaceStyle: {
          backgroundImage: isPrint
            ? "none"
            : "linear-gradient(135deg, rgba(37,99,235,0.04), rgba(14,165,233,0.03) 58%, rgba(255,255,255,0.92))",
        } as CSSProperties,
        sectionLabelClass: "uppercase tracking-[0.18em]",
        sectionDividerClass: "h-px",
      }
    case "Classic":
    default:
      return {
        headerSurfaceClass: isPrint
          ? ""
          : mode === "thumbnail"
            ? "shadow-[0_12px_26px_-24px_rgba(180,83,9,0.18)]"
            : "shadow-[0_16px_34px_-28px_rgba(180,83,9,0.16)]",
        headerSurfaceStyle: {
          backgroundImage: isPrint
            ? "none"
            : "linear-gradient(180deg, rgba(255,255,255,0.98), rgba(255,248,239,0.95))",
        } as CSSProperties,
        sectionLabelClass: "uppercase tracking-[0.26em]",
        sectionDividerClass: "h-px [opacity:0.85]",
      }
  }
}

function ResumeSectionHeading({
  title,
  template,
  accent,
  mode,
  familyTone,
  isSidebar,
}: {
  title: string
  template: TemplateConfig
  accent: string
  mode: ResumeRenderMode
  familyTone: ReturnType<typeof getTemplateFamilyTone>
  isSidebar?: boolean
}) {
  const isUppercase = template.design.headingCase === "uppercase"
  const label = isUppercase ? title.toUpperCase() : title
  const isRule = template.design.headingVariant === "rule"
  const isSerif = template.design.headingVariant === "serif"
  const headingSize = isSerif
    ? mode === "mobile" ? "text-[0.94em]" : "text-[0.98em]"
    : isRule ? "text-[0.88em]" : "text-[0.84em]"

  return (
    <div className="resume-section-heading flex items-center gap-2.5" style={{ breakAfter: "avoid", pageBreakAfter: "avoid" }}>
      {/* Accent bar indicator for rule-style headings */}
      {isRule && !isSidebar && (
        <span
          className="shrink-0 self-stretch rounded-full"
          style={{
            width: "3px",
            minHeight: "1em",
            backgroundColor: accent,
            opacity: 0.75,
          }}
        />
      )}
      <div
        className={cn(
          "shrink-0 font-bold",
          familyTone.sectionLabelClass,
          headingSize,
          isSidebar && "text-[0.8em]",
          isUppercase ? "uppercase" : "tracking-[0.06em]",
          isSerif && "font-semibold"
        )}
        style={{
          color: accent,
          letterSpacing: isSerif ? "0.12em" : isRule ? "0.18em" : undefined,
        }}
      >
        {template.design.headingVariant === "eyebrow" ? (
          <span
            className="inline-flex items-center rounded-full border px-3 py-1"
            style={{
              borderColor: hexToRgba(accent, 0.22),
              backgroundColor: hexToRgba(accent, 0.08),
            }}
          >
            {label}
          </span>
        ) : (
          label
        )}
      </div>
      {template.design.headingVariant !== "eyebrow" &&
 (template.design.headingVariant === "rule" || template.design.sectionDividers !== "none") && (
        <div
          className={cn(
            "flex-1",
            familyTone.sectionDividerClass,
            template.design.sectionDividers === "bold" ? "h-[2px]" : "h-px",
            isSerif ? "opacity-60" : "opacity-90",
            isSidebar && "opacity-30"
          )}
          style={{
            backgroundColor: isSerif ? hexToRgba(accent, 0.24) : hexToRgba(accent, 0.28),
            height: template.design.sectionDividers === "bold" ? "2px" : undefined,
          }}
        />
      )}
    </div>
  )
}

function ResumeHeaderPhoto({
  photoUrl,
  name,
  accent,
  mode,
  variant,
}: {
  photoUrl: string
  name?: string
  accent: string
  mode: ResumeRenderMode
  variant: TemplateConfig["design"]["photoVariant"]
}) {
  const size = mode === "mobile" ? 72 : mode === "thumbnail" ? 48 : 88
  const frameClassName =
    variant === "circle"
      ? "rounded-full"
      : variant === "rounded-square"
        ? "rounded-[1rem]"
        : variant === "framed"
          ? "rounded-[0.95rem]"
          : "rounded-[1.35rem]"
  const inset = variant === "framed" ? 4 : 0

  return (
    <div
      className={cn("shrink-0 overflow-hidden border bg-white", frameClassName)}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        padding: inset ? `${inset}px` : undefined,
        borderColor: variant === "framed" ? hexToRgba(accent, 0.35) : hexToRgba(accent, 0.2),
        backgroundColor: variant === "framed" ? hexToRgba(accent, 0.05) : "#ffffff",
        boxShadow:
          variant === "framed"
            ? `0 16px 30px -22px ${hexToRgba(accent, 0.55)}`
            : `0 12px 24px -18px ${hexToRgba(accent, 0.5)}`,
      }}
    >
      <Image
        src={photoUrl}
        alt={name ? `${name} profile photo` : "Profile photo"}
        width={size}
        height={size}
        sizes={`${size}px`}
        unoptimized
        className={cn("h-full w-full object-cover", frameClassName)}
      />
    </div>
  )
}

function ResumeTemplateHeader({
  content,
  template,
  accent,
  mode,
  familyTone,
  spacing,
}: {
  content: any
  template: TemplateConfig
  accent: string
  mode: ResumeRenderMode
  familyTone: ReturnType<typeof getTemplateFamilyTone>
  spacing: ReturnType<typeof getDensityMetrics>
}) {
  const contactItems = getContactItems(content)
  const isBanner = template.design.headerVariant === "banner"
  const isMonogram = template.design.headerVariant === "monogram"
  const splitLayout = template.design.contactLayout === "split" && mode !== "mobile" && !isMonogram
  const chipContact = (template.design.contactVariant === "chips" || isBanner) && !splitLayout
  const photoUrl =
    typeof content?.personal?.photoUrl === "string" && content.personal.photoUrl.trim().length > 0
      ? content.personal.photoUrl
      : null

  const initials = content?.personal?.name
    ? content.personal.name
        .split(" ")
        .map((part: string) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "JM"

  const headerClassName = cn(
    "resume-header relative flex w-full gap-6",
    familyTone.headerSurfaceClass,
    (template.design.headerAlignment === "center" || isMonogram) && !splitLayout ? "flex-col items-center text-center" : "flex-col",
    splitLayout && "flex-row items-start justify-between",
    template.design.headerVariant === "classic" && "border-b pb-6",
    template.design.headerVariant === "minimal" && "border-b pb-6",
    template.design.headerVariant === "modern" && cn("rounded-[1.4rem] border px-6", mode === "print" ? "py-3" : "py-5"),
    template.design.headerVariant === "executive" && cn("rounded-[1.4rem] border px-6", mode === "print" ? "py-3" : "py-5"),
    template.design.headerVariant === "banner" && cn("rounded-[1.4rem] px-6 text-white", mode === "print" ? "py-4" : "py-6"),
    template.design.headerVariant === "monogram" && cn("rounded-[1.4rem] border px-6 py-6"),
    template.design.headerVariant === "elegant" && cn("rounded-[1.6rem] border px-6", mode === "print" ? "py-4" : "py-6")
  )

  const headerStyle: CSSProperties = {
    gap: `${spacing.headerGap}px`,
    ...(familyTone.headerSurfaceStyle ?? {}),
    borderColor: isBanner
      ? "transparent"
      : template.design.headerVariant === "classic" || template.design.headerVariant === "minimal"
        ? hexToRgba(accent, 0.24)
        : hexToRgba(accent, 0.18),
    borderBottomWidth:
      template.design.headerVariant === "classic" || template.design.headerVariant === "minimal" ? "1px" : undefined,
    borderTopWidth: template.design.headerVariant === "elegant" ? "1px" : undefined,
    backgroundColor: isBanner
      ? accent
      : template.design.headerVariant === "modern" || template.design.headerVariant === "executive"
        ? hexToRgba(accent, template.design.subtleFill ? 0.05 : 0.03)
        : template.design.headerVariant === "elegant" || template.design.headerVariant === "monogram"
          ? hexToRgba(accent, 0.035)
          : undefined,
  }

  const nameClassName = cn(
    "font-black tracking-tight",
    isBanner ? "text-white" : "text-slate-900",
    mode === "print"
      ? "text-[1.85em]"
      : mode === "mobile"
        ? "text-[2.05em]"
        : "text-[2.45em]",
    mode === "thumbnail" && "text-[2.0em]",
    template.design.headerVariant === "minimal" && "font-semibold",
    template.design.headerVariant === "executive" && mode !== "print" && "text-[2.6em]"
  )

  const contactClassName = cn(
    "flex font-medium",
    isBanner ? "text-white/90" : "text-slate-600",
    mode === "print" ? "text-[0.76em]" : "text-[0.84em]",
    splitLayout
      ? "max-w-[250px] flex-col gap-1.5 text-right"
      : chipContact
        ? "flex-wrap items-center gap-2 text-[0.78em]"
        : (template.design.contactLayout === "stacked" && mode !== "print") || mode === "mobile"
        ? "flex-col gap-1.5"
        : "flex-wrap items-center gap-x-2 gap-y-0.5",
    (template.design.headerAlignment === "center" || isMonogram) && !splitLayout && "items-center justify-center text-center"
  )

  const headerIntroClassName = cn(
    "flex min-w-0 gap-4",
    (template.design.headerAlignment === "center" || isMonogram) && !splitLayout ? "flex-col items-center text-center" : "items-start"
  )

  return (
    <header 
      className={headerClassName} 
      style={{ 
        ...headerStyle, 
        breakAfter: "avoid",
        pageBreakAfter: "avoid",
        breakInside: "avoid",
        pageBreakInside: "avoid",
        width: "100%",
        maxWidth: "100%",
        overflow: "hidden"
      }}
    >
      {template.design.headerBand && !isBanner && (
        <div
          className="absolute inset-x-0 top-0 h-1 rounded-t-[1.4rem]"
          style={{
            backgroundColor: accent,
          }}
        />
      )}

      {isMonogram && (
        <div 
          className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border-2 font-serif text-lg font-black tracking-widest"
          style={{
            borderColor: accent,
            backgroundColor: hexToRgba(accent, 0.08),
            color: accent,
          }}
        >
          {initials}
        </div>
      )}

      <div className={cn("min-w-0", splitLayout && "flex-1")}>
        <div className={headerIntroClassName}>
          {photoUrl && !isMonogram ? (
            <ResumeHeaderPhoto
              photoUrl={photoUrl}
              name={content?.personal?.name}
              accent={accent}
              mode={mode}
              variant={template.design.photoVariant}
            />
          ) : null}

          <div className={cn("min-w-0", mode === "print" ? "space-y-1.5" : "space-y-3")}>
            <div className={cn((template.design.headerAlignment === "center" || isMonogram) && !splitLayout && "text-center")}>
              {mode === "thumbnail" ? (
                <div className={nameClassName} style={{ color: isBanner ? "#ffffff" : accent }}>
                  {content?.personal?.name || "Your Name"}
                </div>
              ) : (
                <h1 className={nameClassName} style={{ color: isBanner ? "#ffffff" : accent }}>
                  {content?.personal?.name || "Your Name"}
                </h1>
              )}
              {content?.personal?.title ? (
                <p
                  className={cn(
                    "font-medium tracking-[0.12em] uppercase",
                    mode === "print" ? "mt-0.5 text-[0.84em]" : "mt-1.5 text-[0.9em]",
                    mode === "mobile" && "text-[0.88em]",
                    mode === "thumbnail" && "text-[0.82em]"
                  )}
                  style={{ color: isBanner ? "rgba(255,255,255,0.85)" : hexToRgba(accent, 0.6) }}
                >
                  {content.personal.title}
                </p>
              ) : null}
            </div>

            {!splitLayout && contactItems.length > 0 && (
              <div className={contactClassName}>
                {contactItems.map((item: string, index: number) => (
                  <div key={`${item}-${index}`} className="flex items-center gap-2">
                    {!chipContact && (template.design.contactLayout === "inline" || mode === "print") && index > 0 && mode !== "mobile" && (
                      <span className="h-1 w-1 rounded-full" style={{ backgroundColor: isBanner ? "rgba(255,255,255,0.5)" : hexToRgba(accent, 0.35) }} />
                    )}
                    <span
                      className={cn(
                        item.includes("@") && "break-all",
                        item === content?.personal?.phone && "whitespace-nowrap",
                        chipContact && "rounded-full border px-2.5 py-1 text-[0.95em]"
                      )}
                      style={
                        chipContact
                          ? {
                              borderColor: isBanner ? "rgba(255,255,255,0.3)" : hexToRgba(accent, 0.18),
                              backgroundColor: isBanner ? "rgba(255,255,255,0.18)" : hexToRgba(accent, 0.06),
                              color: isBanner ? "#ffffff" : accent,
                            }
                          : undefined
                      }
                    >
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {splitLayout && contactItems.length > 0 && (
        <div
          className="rounded-[1rem] border px-4 py-3 text-[0.82em] font-medium text-slate-600"
          style={{
            borderColor: hexToRgba(accent, 0.18),
            backgroundColor: hexToRgba(accent, 0.045),
          }}
        >
          <div className="space-y-1.5">
            {contactItems.map((item: string, index: number) => (
              <div key={`${item}-${index}`} className={cn("break-all", item === content?.personal?.phone && "whitespace-nowrap")}>
                {item}
              </div>
            ))}
          </div>
        </div>
      )}
    </header>
  )
}

function ResumeSection({
  title,
  template,
  accent,
  mode,
  familyTone,
  children,
  isSidebar,
  spacing,
}: {
  title: string
  template: TemplateConfig
  accent: string
  mode: ResumeRenderMode
  familyTone: ReturnType<typeof getTemplateFamilyTone>
  children: ReactNode
  isSidebar?: boolean
  spacing: ReturnType<typeof getDensityMetrics>
}) {
  return (
    <section className="resume-section block w-full max-w-full">
      <div style={{ marginBottom: `${spacing.headingGap}px`, breakAfter: "avoid", pageBreakAfter: "avoid" }}>
        <ResumeSectionHeading title={title} template={template} accent={accent} mode={mode} familyTone={familyTone} isSidebar={isSidebar} />
      </div>
      <div className={cn("block w-full max-w-full", mode !== "print" && "overflow-hidden")}>
        {children}
      </div>
    </section>
  )
}

function Description({
  value,
  mode,
  className,
}: {
  value: string
  mode: ResumeRenderMode
  className?: string
}) {
  if (!value) return null

  return (
    <RichTextRenderer
      value={value}
      compact={mode === "print" || mode === "thumbnail"}
      className={cn(
        "text-[0.94em] text-slate-700",
        mode === "print" ? "leading-[1.42]" : "leading-relaxed",
        "[&_p:not(:last-child)]:mb-[0.65em] [&_ul:not(:last-child)]:mb-[0.65em] [&_ol:not(:last-child)]:mb-[0.65em]",
        "[&_p]:[break-inside:avoid] [&_p]:[page-break-inside:avoid] [&_li]:[break-inside:avoid] [&_li]:[page-break-inside:avoid]",
        mode === "mobile" && "text-[0.98em] leading-relaxed",
        mode === "thumbnail" && "text-[0.9em] leading-[1.45] [&_p:not(:last-child)]:mb-1 [&_ul:not(:last-child)]:mb-1 [&_ol:not(:last-child)]:mb-1",
        className
      )}
    />
  )
}

export function ResumeTemplate({
  data,
  isPrint = false,
  noPadding = false,
  mode = "screen",
  className,
}: ResumeTemplateProps) {
  if (!data) return null

  const renderMode: ResumeRenderMode = isPrint ? "print" : mode
  const template = getTemplateConfig(data?.templateId)
  const styles = data?.styles ?? {}
  const accent = extractPrimaryBaseColor(styles.primaryColor || template.defaults.primaryColor)
  const activeFontKey = coerceResumeFontKey(styles.fontFamily, template.defaults.fontFamily)
  const fontStack = getResumeFontStack(activeFontKey)
  const spacing = getDensityMetrics(template, renderMode)
  const familyTone = getTemplateFamilyTone(template.category, renderMode)
  const sectionOrder = normalizeSectionOrder(data?.sectionOrder)
  const content = data?.content ?? {}

  const baseFontSize = Number(styles.fontSize ?? template.defaults.fontSize)
  const baseLineHeight = Number(styles.lineHeight ?? template.defaults.lineHeight)
  const baseMargins = Number(styles.margins ?? template.defaults.margins)
  const screenPadding = 48
  const mobilePadding = Math.max(28, Math.round(baseMargins * 0.8))
  const thumbnailPadding = Math.max(24, Math.round(baseMargins * 0.6))
  const printPadding = Math.max(8, Math.min(14, pxToMm(baseMargins) * 0.88))
  const rootStyle: CSSProperties & { WebkitPrintColorAdjust?: "exact"; printColorAdjust?: "exact" } = {
    backgroundColor: "#ffffff",
    color: "#0f172a",
    width: noPadding ? "100%" : (renderMode === "mobile" ? "100%" : (isPrint ? "210mm" : "100%")),
    maxWidth: (renderMode === "print" && !noPadding) ? "210mm" : "100%",
    minHeight: (isPrint && !noPadding) ? "297mm" : "auto",
    height: "auto",
    padding: "0",
    fontFamily: fontStack,
    fontSize: `${renderMode === "mobile" ? Math.max(10.5, baseFontSize - 0.3) : renderMode === "thumbnail" ? Math.max(9.25, baseFontSize - 0.8) : renderMode === "print" ? Math.max(9.5, baseFontSize - 0.5) : baseFontSize}pt`,
    lineHeight: renderMode === "mobile" ? Math.max(1.55, baseLineHeight) : renderMode === "thumbnail" ? Math.max(1.42, baseLineHeight - 0.05) : renderMode === "print" ? Math.max(1.32, baseLineHeight - 0.18) : baseLineHeight,
    border: template.design.pageBorder ? `1px solid ${hexToRgba(accent, 0.16)}` : undefined,
    borderRadius: renderMode === "mobile" ? "28px" : renderMode === "print" ? "0" : "8px",
    boxSizing: "border-box",
    overflow: renderMode === "screen" ? "hidden" : "visible",
    position: (isPrint || renderMode === "print") ? "static" : "relative",
    WebkitPrintColorAdjust: "exact",
    printColorAdjust: "exact",
  }

  const activeEntryVariant = (styles.entryVariant || template.design.entryVariant) as TemplateEntryVariant
  const entryShellClassName = getEntryShellClassName(activeEntryVariant, renderMode)
  const entryShellStyle = getEntryShellStyle(activeEntryVariant, accent, renderMode, template.design.subtleFill)

  const renderExperience = (isSidebar?: boolean) => {
    const items = (content?.experience || []).filter((e: any) => e.title || e.company || e.description)
    if (!items.length) return null

    return (
      <ResumeSection title={SECTION_LABELS.experience} template={template} accent={accent} mode={renderMode} familyTone={familyTone} spacing={spacing}>
        <div className="block">
          {items.map((experience: any, idx: number) => (
            <article
              key={experience.id || `experience-${idx}`}
              className={cn(
                "resume-entry block",
                entryShellClassName,
                idx < items.length - 1 && "mb-[var(--entry-gap)]",
                activeEntryVariant === "standard" && idx > 0 && "border-t border-slate-100 pt-[var(--entry-gap)]"
              )}
              style={{
                ...entryShellStyle,
                "--entry-gap": `${spacing.entryGap}px`,
                breakInside: "auto",
                pageBreakInside: "auto",
                WebkitBoxDecorationBreak: "clone",
                boxDecorationBreak: "clone",
              } as any}
            >
              {activeEntryVariant === "timeline" && (
                <span
                  className="absolute -left-[5px] top-1.5 h-2 w-2 rounded-full border border-white"
                  style={{ backgroundColor: accent }}
                />
              )}
              <div
                className={cn(
                  "resume-entry-header flex gap-1",
                  !isSidebar && (renderMode === "print" ? "flex-row items-baseline justify-between" : "flex-col sm:flex-row sm:items-baseline sm:justify-between"),
                  isSidebar && "flex-col"
                )}
                style={{ breakAfter: "avoid", pageBreakAfter: "avoid" }}
              >
                <div>
                  <h4 className="text-[1.05em] font-bold leading-tight" style={{ color: accent }}>{experience.title}</h4>
                  <p className="text-[0.9em] font-medium text-slate-600 mt-0.5">{experience.company}</p>
                </div>
                {experience.period && (
                  <span
                    className={cn("shrink-0 text-[0.76em] font-semibold whitespace-nowrap", isSidebar && "text-[0.7em]")}
                    style={{ color: hexToRgba(accent, 0.72), letterSpacing: "0.03em" }}
                  >
                    {experience.period}
                  </span>
                )}
              </div>
              <Description value={experience.description} mode={renderMode} className="mt-1.5" />
            </article>
          ))}
        </div>
      </ResumeSection>
    )
  }

  const renderProjects = (isSidebar?: boolean) => {
    const items = (content?.projects || []).filter((p: any) => p.name || p.description)
    if (!items.length) return null

    return (
      <ResumeSection title={SECTION_LABELS.projects} template={template} accent={accent} mode={renderMode} familyTone={familyTone} spacing={spacing}>
        <div className="block">
          {items.map((project: any, idx: number) => (
            <article
              key={project.id || `project-${idx}`}
              className={cn(
                "resume-entry block",
                entryShellClassName,
                idx < items.length - 1 && "mb-[var(--entry-gap)]",
                activeEntryVariant === "standard" && idx > 0 && "border-t border-slate-100 pt-[var(--entry-gap)]"
              )}
              style={{
                ...entryShellStyle,
                "--entry-gap": `${spacing.entryGap}px`,
                breakInside: "auto",
                pageBreakInside: "auto",
                WebkitBoxDecorationBreak: "clone",
                boxDecorationBreak: "clone",
              } as any}
            >
              {activeEntryVariant === "timeline" && (
                <span
                  className="absolute -left-[5px] top-1.5 h-2 w-2 rounded-full border border-white"
                  style={{ backgroundColor: accent }}
                />
              )}
              <div
                className={cn(
                  "resume-entry-header flex gap-1",
                  !isSidebar && (renderMode === "print" ? "flex-row items-baseline justify-between" : "flex-col sm:flex-row sm:items-baseline sm:justify-between"),
                  isSidebar && "flex-col"
                )}
                style={{ breakAfter: "avoid", pageBreakAfter: "avoid" }}
              >
                <div>
                  <h4 className="text-[1.02em] font-bold leading-tight" style={{ color: accent }}>{project.name}</h4>
                  {project.url ? (
                    <span className="text-[0.82em] font-medium text-slate-500 break-all">{project.url}</span>
                  ) : null}
                </div>
                {project.period ? (
                  <span
                    className={cn("shrink-0 text-[0.76em] font-semibold whitespace-nowrap", isSidebar && "text-[0.7em]")}
                    style={{ color: hexToRgba(accent, 0.72), letterSpacing: "0.03em" }}
                  >
                    {project.period}
                  </span>
                ) : null}
              </div>
              <Description value={project.description} mode={renderMode} className="mt-1.5" />
            </article>
          ))}
        </div>
      </ResumeSection>
    )
  }

  const renderEducation = (isSidebar?: boolean) => {
    const items = (content?.education || []).filter((e: any) => e.degree || e.school || e.institution)
    if (!items.length) return null

    return (
      <ResumeSection title={SECTION_LABELS.education} template={template} accent={accent} mode={renderMode} familyTone={familyTone} isSidebar={isSidebar} spacing={spacing}>
        <div className="block">
          {items.map((education: any, idx: number) => (
            <article
              key={education.id || `education-${idx}`}
              className={cn(
                "resume-entry block",
                entryShellClassName,
                idx < items.length - 1 && "mb-[var(--entry-gap)]",
                activeEntryVariant === "standard" && idx > 0 && "border-t border-slate-100 pt-[var(--entry-gap)]"
              )}
              style={{
                ...entryShellStyle,
                "--entry-gap": `${spacing.entryGap}px`,
                breakInside: "auto",
                pageBreakInside: "auto",
                WebkitBoxDecorationBreak: "clone",
                boxDecorationBreak: "clone",
              } as any}
            >
              {activeEntryVariant === "timeline" && (
                <span
                  className="absolute -left-[5px] top-1.5 h-2 w-2 rounded-full border border-white"
                  style={{ backgroundColor: accent }}
                />
              )}
              <div
                className={cn(
                  "resume-entry-header flex gap-1",
                  !isSidebar && (renderMode === "print" ? "flex-row items-baseline justify-between" : "flex-col sm:flex-row sm:items-baseline sm:justify-between"),
                  isSidebar && "flex-col"
                )}
                style={{ breakAfter: "avoid", pageBreakAfter: "avoid" }}
              >
                <div>
                  <h4 className="text-[1.05em] font-bold leading-tight" style={{ color: accent }}>{education.degree}</h4>
                  <p className="text-[0.9em] font-medium text-slate-600 mt-0.5">{education.school || education.institution}</p>
                </div>
                {education.period && (
                  <span
                    className={cn("shrink-0 text-[0.76em] font-semibold whitespace-nowrap", isSidebar && "text-[0.7em]")}
                    style={{ color: hexToRgba(accent, 0.72), letterSpacing: "0.03em" }}
                  >
                    {education.period}
                  </span>
                )}
              </div>
              <Description value={education.description} mode={renderMode} className="mt-1.5" />
            </article>
          ))}
        </div>
      </ResumeSection>
    )
  }

  const renderSkills = (isSidebar?: boolean) => {
    const items = (content?.skills || []).filter((s: string) => s && s.trim().length > 0)
    if (!items.length) return null

    const variant = template.design.skillVariant || (template.layout === "two-column" ? "stacked" : "compact")

    if (variant === "inline") {
      return (
        <ResumeSection title={SECTION_LABELS.skills} template={template} accent={accent} mode={renderMode} familyTone={familyTone} isSidebar={isSidebar} spacing={spacing}>
          <p className="text-[0.92em] leading-relaxed text-slate-700">
            {items.join(" · ")}
          </p>
        </ResumeSection>
      )
    }

    if (variant === "dots") {
      return (
        <ResumeSection title={SECTION_LABELS.skills} template={template} accent={accent} mode={renderMode} familyTone={familyTone} isSidebar={isSidebar} spacing={spacing}>
          <div className={cn("grid gap-x-4 gap-y-2 text-[0.88em]", isSidebar ? "grid-cols-1" : "grid-cols-2")}>
            {items.map((skill: string, index: number) => {
              const filledDots = (index % 3) + 3
              return (
                <div key={`${skill}-${index}`} className="flex items-center justify-between gap-2">
                  <span className="font-medium text-slate-800 truncate">{skill}</span>
                  <div className="flex gap-1 shrink-0">
                    {[1, 2, 3, 4, 5].map((dot) => (
                      <span
                        key={dot}
                        className="h-1.5 w-1.5 rounded-full"
                        style={{
                          backgroundColor: dot <= filledDots ? accent : hexToRgba(accent, 0.2),
                        }}
                      />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </ResumeSection>
      )
    }

    if (variant === "compact") {
      return (
        <ResumeSection title={SECTION_LABELS.skills} template={template} accent={accent} mode={renderMode} familyTone={familyTone} isSidebar={isSidebar} spacing={spacing}>
          <div className="flex flex-wrap gap-1.5">
            {items.map((skill: string, index: number) => (
              <span
                key={`${skill}-${index}`}
                className="inline-flex items-center rounded-full text-[0.8em] font-medium leading-none"
                style={{
                  padding: renderMode === "print" ? "3px 9px" : "4px 11px",
                  color: accent,
                  backgroundColor: hexToRgba(accent, 0.07),
                  border: `1px solid ${hexToRgba(accent, 0.2)}`,
                  whiteSpace: "nowrap",
                }}
              >
                {skill}
              </span>
            ))}
          </div>
        </ResumeSection>
      )
    }

    return (
      <ResumeSection title={SECTION_LABELS.skills} template={template} accent={accent} mode={renderMode} familyTone={familyTone} isSidebar={isSidebar} spacing={spacing}>
        <div className="block text-[0.92em] text-slate-700">
          {items.map((skill: string, index: number) => (
            <div key={`${skill}-${index}`} className="flex items-center gap-2 mb-1.5 last:mb-0">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: hexToRgba(accent, 0.45) }} />
              <span>{skill}</span>
            </div>
          ))}
        </div>
      </ResumeSection>
    )
  }

  const renderCertifications = (isSidebar?: boolean) => {
    const items = (content?.certifications || []).filter((c: any) => c.name || c.date)
    if (!items.length) return null

    return (
      <ResumeSection title={SECTION_LABELS.certifications} template={template} accent={accent} mode={renderMode} familyTone={familyTone} isSidebar={isSidebar} spacing={spacing}>
        <div className="block">
          {items.map((certification: any, idx: number) => (
            <article
              key={certification.id || `certification-${idx}`}
              className={cn(
                "resume-entry block",
                idx < items.length - 1 && "mb-[var(--entry-gap)]",
                entryShellClassName
              )}
              style={{ ...entryShellStyle, "--entry-gap": `${Math.round(spacing.entryGap * 0.7)}px`, breakInside: "avoid" } as any}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <h4 className="text-[0.98em] font-bold leading-tight" style={{ color: accent }}>{certification.name}</h4>
                  {certification.issuer ? (
                    <p className="text-[0.84em] font-medium text-slate-500 mt-0.5">{certification.issuer}</p>
                  ) : null}
                </div>
                {certification.date ? (
                  <span
                    className="shrink-0 text-[0.75em] font-semibold whitespace-nowrap"
                    style={{ color: hexToRgba(accent, 0.72), letterSpacing: "0.03em" }}
                  >
                    {certification.date}
                  </span>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      </ResumeSection>
    )
  }

  const renderLanguages = (isSidebar?: boolean) => {
    const items = (content?.languages || []).filter((l: any) => l.language || l.name)
    if (!items.length) return null

    return (
      <ResumeSection title={SECTION_LABELS.languages} template={template} accent={accent} mode={renderMode} familyTone={familyTone} isSidebar={isSidebar} spacing={spacing}>
        <div className="block">
          {items.map((language: any, index: number) => (
            <div key={`${language.language || language.name}-${index}`} className="flex items-center justify-between gap-3 mb-1.5 last:mb-0">
              <span className="text-[0.94em] font-semibold text-slate-800">{language.language || language.name}</span>
              {(language.proficiency || language.level) && (
                <span
                  className="shrink-0 text-[0.78em] font-medium rounded-full px-2 py-0.5"
                  style={{
                    color: accent,
                    backgroundColor: hexToRgba(accent, 0.07),
                    border: `1px solid ${hexToRgba(accent, 0.18)}`,
                  }}
                >
                  {language.proficiency || language.level}
                </span>
              )}
            </div>
          ))}
        </div>
      </ResumeSection>
    )
  }

  const renderInterests = (isSidebar?: boolean) => {
    const variant = content?.interestsVariant || "list"
    
    if (variant === "text") {
      if (!content?.interestsContent) return null
      return (
        <ResumeSection title={SECTION_LABELS.interests} template={template} accent={accent} mode={renderMode} familyTone={familyTone} isSidebar={isSidebar} spacing={spacing}>
          <Description value={content.interestsContent} mode={renderMode} />
        </ResumeSection>
      )
    }

    const items = (content?.interests || []).filter((i: string) => i && i.trim().length > 0)
    if (!items.length) return null

    return (
      <ResumeSection title={SECTION_LABELS.interests} template={template} accent={accent} mode={renderMode} familyTone={familyTone} isSidebar={isSidebar} spacing={spacing}>
        <div className={cn(
          "flex flex-wrap gap-x-4 gap-y-2 text-[0.94em] leading-relaxed text-slate-700",
          isSidebar && "block"
        )}>
          {items.map((interest: string, index: number) => (
            <div key={`${interest}-${index}`} className={cn("flex items-center gap-2", isSidebar && "mb-1 last:mb-0")}>
              <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: hexToRgba(accent, 0.45) }} />
              <span>{interest}</span>
            </div>
          ))}
        </div>
      </ResumeSection>
    )
  }

  const renderSummary = () => {
    if (!content?.summary) return null
    const summaryText = typeof content.summary === 'string' ? content.summary : (content.summary.summary || JSON.stringify(content.summary));

    return (
      <ResumeSection title={SECTION_LABELS.summary} template={template} accent={accent} mode={renderMode} familyTone={familyTone} spacing={spacing}>
        <Description value={summaryText} mode={renderMode} />
      </ResumeSection>
    )
  }

  const sectionRenderers: Record<ResumeSectionId, (isSidebar?: boolean) => ReactNode> = {
    summary: () => renderSummary(),
    experience: (isSidebar) => renderExperience(isSidebar),
    projects: (isSidebar) => renderProjects(isSidebar),
    education: (isSidebar) => renderEducation(isSidebar),
    skills: (isSidebar) => renderSkills(isSidebar),
    certifications: (isSidebar) => renderCertifications(isSidebar),
    languages: (isSidebar) => renderLanguages(isSidebar),
    interests: (isSidebar) => renderInterests(isSidebar),
    "page-break": () => (
      <div
        className={cn(
          "resume-manual-break w-full",
          renderMode === "print" ? "h-0" : "flex items-center gap-3 py-2 text-[0.66rem] font-semibold uppercase tracking-[0.22em] text-slate-400"
        )}
        style={{
          breakBefore: renderMode === "print" ? "page" : undefined,
          pageBreakBefore: renderMode === "print" ? "always" : undefined,
        }}
      >
        {renderMode !== "print" && (
          <>
            <div className="h-px flex-1 bg-slate-200" />
            <span>Page Break</span>
            <div className="h-px flex-1 bg-slate-200" />
          </>
        )}
      </div>
    ),
  }

  const sidebarSections = new Set(template.sidebarSections ?? ["skills", "languages", "certifications", "education"])
  const isTwoColumn = template.layout === "two-column" && renderMode !== "mobile"
  const sidebarVariant = template.design.sidebarVariant ?? "plain"
  const sidebarUsesPanel = sidebarVariant !== "plain"
  const sidebarStyle: CSSProperties =
    sidebarVariant === "tint"
      ? {
          backgroundImage: `linear-gradient(180deg, ${hexToRgba(accent, 0.11)}, ${hexToRgba(accent, 0.045)})`,
          border: `1px solid ${hexToRgba(accent, 0.16)}`,
          boxShadow: renderMode === "print" ? "none" : `0 16px 32px -28px ${hexToRgba(accent, 0.28)}`,
        }
      : sidebarUsesPanel
        ? {
            backgroundColor: hexToRgba(accent, template.design.subtleFill ? 0.055 : 0.032),
            border: `1px solid ${hexToRgba(accent, 0.1)}`,
            boxShadow: renderMode === "print" ? "none" : `0 12px 28px -26px ${hexToRgba(accent, 0.22)}`,
          }
        : {
            backgroundColor: template.design.subtleFill ? hexToRgba(accent, 0.04) : "transparent",
            border: template.design.subtleFill ? `1px solid ${hexToRgba(accent, 0.1)}` : "none",
          }

  return (
    <div
      className={cn("resume-preview-sheet resume-document relative", className)}
      data-resume-mode={renderMode}
      data-template-id={template.id}
      style={rootStyle}
    >
      {/* Visual Page Break Indicators for Screen */}
      {renderMode === "screen" && !isPrint && (
        <div 
          className="absolute inset-x-0 top-0 bottom-0 pointer-events-none z-50" 
          aria-hidden="true"
        >
          {[1, 2, 3, 4, 5, 6, 7, 8].map(page => (
            <div 
              key={page}
              className="absolute w-full flex flex-col items-center justify-center h-[40px]"
              style={{ top: `calc(${page} * (297mm + 40px) - 40px)` }}
            >
               <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md border-y border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.5)]" />
               <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" />
               <div className="absolute bottom-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-orange-500/20 to-transparent" />
               <div className="relative flex items-center gap-4 text-[10px] font-black tracking-[0.3em] text-white/50 uppercase pr-2">
                 <div className="h-[1px] w-8 bg-gradient-to-r from-transparent to-white/10" />
                 Page {page} <span className="opacity-20 text-indigo-400 mx-1">/</span> {page + 1}
                 <div className="h-[1px] w-8 bg-gradient-to-l from-transparent to-white/10" />
               </div>
            </div>
          ))}
        </div>
      )}

      <div 
        className="block w-full max-w-full" 
        style={{
          position: (isPrint || renderMode === "print") ? "static" : "relative",
          zIndex: 0,
          padding: 
            noPadding ? "0" : 
            renderMode === "print" ? `${printPadding}mm` : 
            renderMode === "mobile" ? `${mobilePadding}px` : 
            renderMode === "thumbnail" ? `${thumbnailPadding}px` :
            `${screenPadding}px`,
          maskImage: renderMode === "screen" ? 
            "repeating-linear-gradient(to bottom, transparent 0, transparent 24px, black 24px, black calc(297mm - 24px), transparent calc(297mm - 24px), transparent calc(297mm + 40px))" : undefined,
          WebkitMaskImage: renderMode === "screen" ? 
            "repeating-linear-gradient(to bottom, transparent 0, transparent 24px, black 24px, black calc(297mm - 24px), transparent calc(297mm - 24px), transparent calc(297mm + 40px))" : undefined,
        }}
      >
        <ResumeTemplateHeader
          content={content}
          template={template}
          accent={accent}
          mode={renderMode}
          familyTone={familyTone}
          spacing={spacing}
        />

        {isTwoColumn ? (
          <div
            className="block w-full"
            style={{
              display: "block",
              clear: "both",
              marginTop: `${spacing.sectionGap}px`,
            }}
          >
            <div
              className={cn("block", sidebarUsesPanel && "rounded-[1rem] p-5")}
              style={{
                width: "68.8mm",
                float: template.sidebarPosition === "right" ? "right" : "left",
                marginLeft: template.sidebarPosition === "right" ? "8.5mm" : "0",
                marginRight: template.sidebarPosition === "left" ? "8.5mm" : "0",
                display: "block",
                boxSizing: "border-box",
                breakInside: "avoid",
                pageBreakInside: "avoid",
                ...sidebarStyle,
              }}
            >
              {sectionOrder
                .filter((id) => sidebarSections.has(id))
                .map((sectionId, index) => {
                  const renderedSection = sectionRenderers[sectionId]?.(true)
                  if (!renderedSection) return null
                  return (
                    <div
                      key={`${sectionId}-${index}`}
                      className="block"
                      style={{ marginBottom: `${Math.round(spacing.sectionGap * 0.7)}px` }}
                    >
                      {renderedSection}
                    </div>
                  )
                })}
            </div>
            <div
              className="block"
              style={{
                display: "block",
                marginLeft: template.sidebarPosition === "right" ? 0 : "77.3mm",
                marginRight: template.sidebarPosition === "right" ? "77.3mm" : 0,
              }}
            >
              {sectionOrder
                .filter((id) => !sidebarSections.has(id))
                .map((sectionId, index) => {
                  const renderedSection = sectionRenderers[sectionId]?.(false)
                  if (!renderedSection) return null
                  return (
                    <div
                      key={`${sectionId}-${index}`}
                      className="block"
                      style={{ marginBottom: `${spacing.sectionGap}px` }}
                    >
                      {renderedSection}
                      {template.design.sectionDividers === "thin" && (
                        <div className="h-px w-full bg-slate-100" />
                      )}
                      {template.design.sectionDividers === "bold" && (
                        <div className="h-0.5 w-full" style={{ backgroundColor: hexToRgba(accent, 0.1) }} />
                      )}
                    </div>
                  )
                })}
            </div>
            <div style={{ clear: "both", display: "block" }} />
          </div>
        ) : (
          <main
            className="block w-full"
            style={{ marginTop: `${spacing.sectionGap}px` }}
          >
            {sectionOrder.map((sectionId, index) => {
              const renderedSection = sectionRenderers[sectionId]?.(false)
              if (!renderedSection) return null
              return (
                <div
                  key={`${sectionId}-${index}`}
                  className="block"
                  style={{ marginBottom: `${spacing.sectionGap}px` }}
                >
                  {renderedSection}
                  {template.design.sectionDividers === "thin" && (
                    <div className="h-px w-full bg-slate-100" />
                  )}
                  {template.design.sectionDividers === "bold" && (
                    <div className="h-0.5 w-full" style={{ backgroundColor: hexToRgba(accent, 0.1) }} />
                  )}
                </div>
              )
            })}
          </main>
        )}
      </div>
    </div>
  )
}
