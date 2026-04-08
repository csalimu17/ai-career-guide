"use client"

import type { CSSProperties, ReactNode } from "react"

import { RichTextRenderer } from "@/components/editor/rich-text-renderer"
import { DEFAULT_SECTION_ORDER, getTemplateConfig, type ResumeSectionId, type TemplateConfig } from "@/lib/templates-config"
import { coerceResumeFontKey, getResumeFontStack } from "@/lib/resume-fonts"
import { cn } from "@/lib/utils"

type ResumeRenderMode = "screen" | "mobile" | "print" | "thumbnail"

interface ResumeTemplateProps {
  data: any
  isPrint?: boolean
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
      headerGap: 22,
      sectionGap: 22,
      entryGap: 14,
      headingGap: 10,
    },
    comfortable: {
      headerGap: 28,
      sectionGap: 28,
      entryGap: 16,
      headingGap: 12,
    },
    relaxed: {
      headerGap: 34,
      sectionGap: 32,
      entryGap: 18,
      headingGap: 14,
    },
  }[template.design.density]

  if (mode === "mobile") {
    return {
      headerGap: Math.max(18, map.headerGap - 8),
      sectionGap: Math.max(20, map.sectionGap - 8),
      entryGap: Math.max(12, map.entryGap - 4),
      headingGap: Math.max(10, map.headingGap - 2),
    }
  }

  if (mode === "thumbnail") {
    return {
      headerGap: map.headerGap - 4,
      sectionGap: map.sectionGap - 6,
      entryGap: map.entryGap - 2,
      headingGap: map.headingGap - 2,
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

function getEntryShellClassName(template: TemplateConfig) {
  switch (template.design.entryVariant) {
    case "accented":
      return "border-l-[3px] pl-4"
    case "outlined":
      return "rounded-[1rem] border px-4 py-3"
    default:
      return ""
  }
}

function getEntryShellStyle(template: TemplateConfig, accent: string) {
  if (template.design.entryVariant === "accented") {
    return {
      borderLeftColor: accent,
    }
  }

  if (template.design.entryVariant === "outlined") {
    return {
      borderColor: hexToRgba(accent, 0.18),
      backgroundColor: template.design.subtleFill ? hexToRgba(accent, 0.04) : "#ffffff",
    }
  }

  return undefined
}

function ResumeSectionHeading({
  title,
  template,
  accent,
  mode,
}: {
  title: string
  template: TemplateConfig
  accent: string
  mode: ResumeRenderMode
}) {
  const isUppercase = template.design.headingCase === "uppercase"
  const label = isUppercase ? title.toUpperCase() : title
  const headingSize =
    template.design.headingVariant === "serif"
      ? mode === "mobile"
        ? "text-[0.92em]"
        : "text-[0.96em]"
      : "text-[0.82em]"

  return (
    <div className="resume-section-heading flex items-center gap-3">
      <div
        className={cn(
          "shrink-0 font-bold tracking-[0.22em] text-slate-900",
          headingSize,
          isUppercase ? "uppercase" : "tracking-[0.08em]",
          template.design.headingVariant === "serif" && "font-semibold tracking-[0.18em]"
        )}
        style={{
          color: accent,
          letterSpacing: template.design.headingVariant === "serif" ? "0.12em" : undefined,
        }}
      >
        {template.design.headingVariant === "eyebrow" ? (
          <span
            className="inline-flex items-center rounded-full border px-3 py-1"
            style={{
              borderColor: hexToRgba(accent, 0.2),
              backgroundColor: hexToRgba(accent, 0.08),
            }}
          >
            {label}
          </span>
        ) : (
          label
        )}
      </div>
      <div
        className={cn(
          "flex-1",
          template.design.sectionDividers === "bold" ? "h-[2px]" : "h-px",
          template.design.headingVariant === "serif" ? "opacity-80" : "opacity-100"
        )}
        style={{
          backgroundColor:
            template.design.headingVariant === "serif" ? hexToRgba(accent, 0.28) : hexToRgba(accent, 0.22),
          height: template.design.sectionDividers === "bold" ? "2px" : undefined,
        }}
      />
    </div>
  )
}

function ResumeTemplateHeader({
  content,
  template,
  accent,
  mode,
  spacing,
}: {
  content: any
  template: TemplateConfig
  accent: string
  mode: ResumeRenderMode
  spacing: ReturnType<typeof getDensityMetrics>
}) {
  const contactItems = getContactItems(content)
  const splitLayout = template.design.contactLayout === "split" && mode !== "mobile"

  const headerClassName = cn(
    "resume-header relative flex w-full gap-6",
    template.design.headerAlignment === "center" && !splitLayout ? "flex-col items-center text-center" : "flex-col",
    splitLayout && "flex-row items-start justify-between",
    template.design.headerVariant === "classic" && "border-b pb-6",
    template.design.headerVariant === "minimal" && "border-b pb-6",
    template.design.headerVariant === "modern" && "rounded-[1.4rem] border px-6 py-5",
    template.design.headerVariant === "executive" && "rounded-[1.4rem] border px-6 py-5",
    template.design.headerVariant === "elegant" && "rounded-[1.6rem] border px-6 py-6"
  )

  const headerStyle: CSSProperties = {
    gap: `${spacing.headerGap}px`,
    borderColor:
      template.design.headerVariant === "classic" || template.design.headerVariant === "minimal"
        ? hexToRgba(accent, 0.24)
        : hexToRgba(accent, 0.18),
    borderBottomWidth:
      template.design.headerVariant === "classic" || template.design.headerVariant === "minimal" ? "1px" : undefined,
    borderTopWidth: template.design.headerVariant === "elegant" ? "1px" : undefined,
    backgroundColor:
      template.design.headerVariant === "modern" || template.design.headerVariant === "executive"
        ? hexToRgba(accent, template.design.subtleFill ? 0.05 : 0.03)
        : template.design.headerVariant === "elegant"
          ? hexToRgba(accent, 0.035)
          : undefined,
  }

  const nameClassName = cn(
    "font-black tracking-tight text-slate-900",
    mode === "mobile" ? "text-[2.05em]" : "text-[2.45em]",
    template.design.headerVariant === "minimal" && "font-semibold",
    template.design.headerVariant === "executive" && "text-[2.6em]"
  )

  const contactClassName = cn(
    "flex text-[0.84em] font-medium text-slate-600",
    splitLayout
      ? "max-w-[250px] flex-col gap-1.5 text-right"
      : template.design.contactLayout === "stacked" || mode === "mobile"
        ? "flex-col gap-1.5"
        : "flex-wrap items-center gap-x-3 gap-y-1",
    template.design.headerAlignment === "center" && !splitLayout && "items-center justify-center text-center"
  )

  return (
    <header className={headerClassName} style={headerStyle}>
      {template.design.headerBand && (
        <div
          className="absolute inset-x-0 top-0 h-1 rounded-t-[1.4rem]"
          style={{
            backgroundColor: accent,
          }}
        />
      )}

      <div className={cn("min-w-0 space-y-3", splitLayout && "flex-1")}>
        <div className={cn(template.design.headerAlignment === "center" && !splitLayout && "text-center")}>
          <h1 className={nameClassName} style={{ color: accent }}>
            {content?.personal?.name || "Your Name"}
          </h1>
          {content?.personal?.title ? (
            <p
              className={cn(
                "mt-2 text-[0.95em] font-semibold uppercase tracking-[0.18em] text-slate-500",
                mode === "mobile" && "text-[0.92em]"
              )}
            >
              {content.personal.title}
            </p>
          ) : null}
        </div>

        {!splitLayout && contactItems.length > 0 && (
          <div className={contactClassName}>
            {contactItems.map((item: string, index: number) => (
              <div key={`${item}-${index}`} className="flex items-center gap-2">
                {template.design.contactLayout === "inline" && index > 0 && mode !== "mobile" && (
                  <span className="h-1 w-1 rounded-full bg-slate-300" />
                )}
                <span className={cn(item.includes("@") && "break-all", item === content?.personal?.phone && "whitespace-nowrap")}>
                  {item}
                </span>
              </div>
            ))}
          </div>
        )}
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
  children,
}: {
  title: string
  template: TemplateConfig
  accent: string
  mode: ResumeRenderMode
  children: ReactNode
}) {
  return (
    <section className="resume-section space-y-3">
      <ResumeSectionHeading title={title} template={template} accent={accent} mode={mode} />
      {children}
    </section>
  )
}

function Description({
  value,
  mode,
}: {
  value: string
  mode: ResumeRenderMode
}) {
  if (!value) return null

  return (
    <RichTextRenderer
      value={value}
      compact={mode === "print" || mode === "thumbnail"}
      className={cn(
        "text-[0.94em] leading-relaxed text-slate-700",
        "[&_p]:mb-2 [&_ul]:mb-2 [&_ol]:mb-2",
        mode === "mobile" && "text-[0.98em]"
      )}
    />
  )
}

export function ResumeTemplate({
  data,
  isPrint = false,
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
  const sectionOrder = normalizeSectionOrder(data?.sectionOrder)
  const content = data?.content ?? {}

  const baseFontSize = Number(styles.fontSize ?? template.defaults.fontSize)
  const baseLineHeight = Number(styles.lineHeight ?? template.defaults.lineHeight)
  const baseMargins = Number(styles.margins ?? template.defaults.margins)
  const screenPadding = renderMode === "thumbnail" ? Math.max(28, baseMargins - 10) : baseMargins
  const mobilePadding = Math.min(28, Math.max(18, Math.round(baseMargins * 0.58)))
  const printPadding = Math.max(8, Math.min(14, pxToMm(baseMargins) * 0.88))

  const rootStyle: CSSProperties & { WebkitPrintColorAdjust?: "exact"; printColorAdjust?: "exact" } = {
    backgroundColor: "#ffffff",
    color: "#0f172a",
    width: renderMode === "print" ? "210mm" : "100%",
    minHeight: renderMode === "mobile" ? undefined : "297mm",
    padding:
      renderMode === "print"
        ? `${printPadding}mm`
        : renderMode === "mobile"
          ? `${mobilePadding}px`
          : `${screenPadding}px`,
    fontFamily: fontStack,
    fontSize: `${renderMode === "mobile" ? Math.max(10.5, baseFontSize - 0.3) : baseFontSize}pt`,
    lineHeight: renderMode === "mobile" ? Math.max(1.55, baseLineHeight) : baseLineHeight,
    border: template.design.pageBorder ? `1px solid ${hexToRgba(accent, 0.16)}` : undefined,
    borderRadius: renderMode === "mobile" ? "28px" : renderMode === "print" ? "0" : "8px",
    boxSizing: "border-box",
    WebkitPrintColorAdjust: "exact",
    printColorAdjust: "exact",
  }

  const sectionGapStyle: CSSProperties = {
    gap: `${spacing.sectionGap}px`,
  }

  const entryShellClassName = getEntryShellClassName(template)
  const entryShellStyle = getEntryShellStyle(template, accent)

  const renderExperience = () => {
    if (!content?.experience?.length) return null

    return (
      <ResumeSection title={SECTION_LABELS.experience} template={template} accent={accent} mode={renderMode}>
        <div className="space-y-4">
          {content.experience.map((experience: any) => (
            <article
              key={experience.id}
              className={cn("resume-entry space-y-1.5", entryShellClassName)}
              style={entryShellStyle}
            >
              <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
                <div>
                  <h4 className="text-[1.06em] font-bold text-slate-900">{experience.title}</h4>
                  <p className="text-[0.92em] font-semibold text-slate-600">{experience.company}</p>
                </div>
                {experience.period && (
                  <span className="text-[0.82em] font-semibold uppercase tracking-[0.14em] text-slate-500">
                    {experience.period}
                  </span>
                )}
              </div>
              <Description value={experience.description} mode={renderMode} />
            </article>
          ))}
        </div>
      </ResumeSection>
    )
  }

  const renderProjects = () => {
    if (!content?.projects?.length) return null

    return (
      <ResumeSection title={SECTION_LABELS.projects} template={template} accent={accent} mode={renderMode}>
        <div className="space-y-4">
          {content.projects.map((project: any) => (
            <article
              key={project.id}
              className={cn("resume-entry space-y-1.5", entryShellClassName)}
              style={entryShellStyle}
            >
              <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
                <h4 className="text-[1em] font-bold text-slate-900">{project.name}</h4>
                {project.url ? (
                  <span className="text-[0.82em] font-medium text-slate-500">{project.url}</span>
                ) : null}
              </div>
              <Description value={project.description} mode={renderMode} />
            </article>
          ))}
        </div>
      </ResumeSection>
    )
  }

  const renderEducation = () => {
    if (!content?.education?.length) return null

    return (
      <ResumeSection title={SECTION_LABELS.education} template={template} accent={accent} mode={renderMode}>
        <div className="space-y-4">
          {content.education.map((education: any) => (
            <article
              key={education.id}
              className={cn("resume-entry flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between", entryShellClassName)}
              style={entryShellStyle}
            >
              <div>
                <h4 className="text-[1em] font-bold text-slate-900">{education.degree}</h4>
                <p className="text-[0.92em] text-slate-600">{education.institution}</p>
              </div>
              {education.period && (
                <span className="text-[0.82em] font-semibold uppercase tracking-[0.14em] text-slate-500">
                  {education.period}
                </span>
              )}
            </article>
          ))}
        </div>
      </ResumeSection>
    )
  }

  const renderSkills = () => {
    if (!content?.skills?.length) return null

    if (template.design.skillVariant === "inline") {
      return (
        <ResumeSection title={SECTION_LABELS.skills} template={template} accent={accent} mode={renderMode}>
          <p className="text-[0.95em] leading-relaxed text-slate-700">{content.skills.join(" | ")}</p>
        </ResumeSection>
      )
    }

    if (template.design.skillVariant === "compact") {
      return (
        <ResumeSection title={SECTION_LABELS.skills} template={template} accent={accent} mode={renderMode}>
          <div className="flex flex-wrap gap-x-3 gap-y-2 text-[0.9em] text-slate-700">
            {content.skills.map((skill: string, index: number) => (
              <span key={`${skill}-${index}`} className="font-medium">
                {skill}
              </span>
            ))}
          </div>
        </ResumeSection>
      )
    }

    return (
      <ResumeSection title={SECTION_LABELS.skills} template={template} accent={accent} mode={renderMode}>
        <ul className="space-y-1.5 pl-5 text-[0.94em] leading-relaxed text-slate-700">
          {content.skills.map((skill: string, index: number) => (
            <li key={`${skill}-${index}`}>{skill}</li>
          ))}
        </ul>
      </ResumeSection>
    )
  }

  const renderCertifications = () => {
    if (!content?.certifications?.length) return null

    return (
      <ResumeSection title={SECTION_LABELS.certifications} template={template} accent={accent} mode={renderMode}>
        <div className="space-y-3">
          {content.certifications.map((certification: any) => (
            <article
              key={certification.id}
              className={cn("resume-entry flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between", entryShellClassName)}
              style={entryShellStyle}
            >
              <h4 className="text-[0.98em] font-bold text-slate-900">{certification.name}</h4>
              {certification.date ? (
                <span className="text-[0.82em] font-semibold uppercase tracking-[0.14em] text-slate-500">
                  {certification.date}
                </span>
              ) : null}
            </article>
          ))}
        </div>
      </ResumeSection>
    )
  }

  const renderLanguages = () => {
    if (!content?.languages?.length) return null

    return (
      <ResumeSection title={SECTION_LABELS.languages} template={template} accent={accent} mode={renderMode}>
        <div className="space-y-2 text-[0.94em] text-slate-700">
          {content.languages.map((language: any, index: number) => (
            <p key={`${language.language || language.name}-${index}`}>
              <span className="font-bold text-slate-900">{language.language || language.name}</span>
              <span className="text-slate-500"> - {language.proficiency}</span>
            </p>
          ))}
        </div>
      </ResumeSection>
    )
  }

  const renderSummary = () => {
    if (!content?.summary) return null

    return (
      <ResumeSection title={SECTION_LABELS.summary} template={template} accent={accent} mode={renderMode}>
        <Description value={content.summary} mode={renderMode} />
      </ResumeSection>
    )
  }

  const sectionRenderers: Record<ResumeSectionId, () => ReactNode> = {
    summary: renderSummary,
    experience: renderExperience,
    projects: renderProjects,
    education: renderEducation,
    skills: renderSkills,
    certifications: renderCertifications,
    languages: renderLanguages,
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

  return (
    <div
      className={cn("resume-preview-sheet resume-document relative", className)}
      data-resume-mode={renderMode}
      data-template-id={template.id}
      style={rootStyle}
    >
      <div className="flex flex-col" style={sectionGapStyle}>
        <ResumeTemplateHeader
          content={content}
          template={template}
          accent={accent}
          mode={renderMode}
          spacing={spacing}
        />

        {isTwoColumn ? (
          <div
            className={cn(
              "grid w-full gap-8",
              template.sidebarPosition === "right" ? "grid-cols-[1fr_260px]" : "grid-cols-[260px_1fr]"
            )}
          >
            <div className={cn("flex flex-col", template.sidebarPosition === "right" ? "order-1" : "order-2")} style={sectionGapStyle}>
              {sectionOrder
                .filter((id) => !sidebarSections.has(id))
                .map((sectionId, index) => {
                  const renderedSection = sectionRenderers[sectionId]?.()
                  if (!renderedSection) return null
                  return (
                    <div key={`${sectionId}-${index}`} className="contents">
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
            <div
              className={cn(
                "flex flex-col gap-6 rounded-[1rem] p-5",
                template.sidebarPosition === "right" ? "order-2" : "order-1"
              )}
              style={{
                backgroundColor: template.design.subtleFill ? hexToRgba(accent, 0.04) : "transparent",
                border: template.design.subtleFill ? `1px solid ${hexToRgba(accent, 0.1)}` : "none",
              }}
            >
              {sectionOrder
                .filter((id) => sidebarSections.has(id))
                .map((sectionId, index) => {
                  const renderedSection = sectionRenderers[sectionId]?.()
                  if (!renderedSection) return null
                  return (
                    <div key={`${sectionId}-${index}`} className="contents">
                      {renderedSection}
                    </div>
                  )
                })}
            </div>
          </div>
        ) : (
          <main className="flex flex-col" style={sectionGapStyle}>
            {sectionOrder.map((sectionId, index) => {
              const renderedSection = sectionRenderers[sectionId]?.()
              if (!renderedSection) return null

              return (
                <div key={`${sectionId}-${index}`} className="contents">
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
