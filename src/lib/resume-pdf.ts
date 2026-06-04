import { richTextToPlainText } from "@/lib/rich-text"

const SECTION_LABELS: Record<string, string> = {
  summary: "Summary",
  experience: "Experience",
  projects: "Projects",
  education: "Education",
  skills: "Skills",
  certifications: "Certifications",
  languages: "Languages",
}

function sanitizePdfFileName(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function extractAccentColor(value?: string) {
  const match = value?.match(/#(?:[0-9a-fA-F]{3}){1,2}/)
  return match?.[0] ?? "#243047"
}

function hexToRgb(hex: string) {
  const normalized = hex.replace("#", "")
  const expanded =
    normalized.length === 3
      ? normalized
          .split("")
          .map((character) => `${character}${character}`)
          .join("")
      : normalized

  const numericValue = Number.parseInt(expanded, 16)
  return {
    r: (numericValue >> 16) & 255,
    g: (numericValue >> 8) & 255,
    b: numericValue & 255,
  }
}

function toLines(value: string | null | undefined) {
  return richTextToPlainText(value)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
}

function joinContactLine(personal: any) {
  return [personal?.location, personal?.email, personal?.phone, personal?.linkedin, personal?.website]
    .filter(Boolean)
    .join("  •  ")
}

export async function downloadResumePdf(resume: any) {
  const { jsPDF } = await import("jspdf")
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "pt",
    format: "a4",
    compress: true,
  })

  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const marginX = 40
  const topMargin = 42
  const bottomMargin = 42
  const contentWidth = pageWidth - marginX * 2
  const accent = extractAccentColor(resume?.styles?.primaryColor)
  const accentRgb = hexToRgb(accent)
  const textRgb = { r: 59, g: 72, b: 92 }
  const mutedRgb = { r: 104, g: 116, b: 138 }
  let cursorY = topMargin

  const addPage = () => {
    pdf.addPage()
    cursorY = topMargin
  }

  const wouldOverflow = (height: number) => cursorY + height > pageHeight - bottomMargin

  const ensureSpace = (height: number) => {
    if (wouldOverflow(height)) {
      addPage()
      return true
    }
    return false
  }

  const setColor = (rgb: { r: number; g: number; b: number }) => {
    pdf.setTextColor(rgb.r, rgb.g, rgb.b)
  }

  const writeTextBlock = (
    text: string,
    options?: {
      fontSize?: number
      fontStyle?: "normal" | "bold"
      color?: { r: number; g: number; b: number }
      spacingAfter?: number
      indent?: number
    }
  ) => {
    if (!text.trim()) return

    const fontSize = options?.fontSize ?? 11
    const lineHeight = fontSize * 1.45
    const indent = options?.indent ?? 0
    const maxWidth = Math.max(80, contentWidth - indent)

    pdf.setFont("times", options?.fontStyle ?? "normal")
    pdf.setFontSize(fontSize)
    setColor(options?.color ?? textRgb)

    const lines = pdf.splitTextToSize(text, maxWidth)
    ensureSpace(lines.length * lineHeight)
    pdf.text(lines, marginX + indent, cursorY)
    cursorY += lines.length * lineHeight + (options?.spacingAfter ?? 6)
  }

  const writeBulletedLines = (lines: string[]) => {
    for (const rawLine of lines) {
      const normalized = rawLine.replace(/^[-•*]\s*/, "").trim()
      if (!normalized) continue

      pdf.setFont("times", "normal")
      pdf.setFontSize(11)
      setColor(textRgb)
      const bulletX = marginX + 6
      const textX = marginX + 18
      const wrapped = pdf.splitTextToSize(normalized, contentWidth - 18)
      const lineHeight = 16

      ensureSpace(wrapped.length * lineHeight + 4)
      pdf.text("•", bulletX, cursorY)
      pdf.text(wrapped, textX, cursorY)
      cursorY += wrapped.length * lineHeight + 4
    }
  }

  const writeRichText = (value: string | null | undefined) => {
    const lines = toLines(value)
    if (!lines.length) return

    const bulletLines = lines.filter((line) => /^[-•*]\s+/.test(line))
    const paragraphLines = lines.filter((line) => !/^[-•*]\s+/.test(line))

    if (paragraphLines.length) {
      writeTextBlock(paragraphLines.join(" "), { fontSize: 11.5, spacingAfter: bulletLines.length ? 8 : 14 })
    }

    if (bulletLines.length) {
      writeBulletedLines(bulletLines)
      cursorY += 8
    }
  }

  const writeSectionHeading = (title: string) => {
    ensureSpace(34)
    pdf.setFont("times", "bold")
    pdf.setFontSize(10.5)
    setColor(accentRgb)
    pdf.text(title.toUpperCase(), marginX, cursorY)
    pdf.setDrawColor(accentRgb.r, accentRgb.g, accentRgb.b)
    pdf.setLineWidth(1)
    pdf.line(marginX + 118, cursorY - 4, pageWidth - marginX, cursorY - 4)
    cursorY += 26
  }

  const personal = resume?.content?.personal ?? {}
  const contactLine = joinContactLine(personal)
  const sectionOrder = Array.isArray(resume?.sectionOrder) && resume.sectionOrder.length ? resume.sectionOrder : Object.keys(SECTION_LABELS)

  pdf.setFont("helvetica", "bold")
  pdf.setFontSize(33)
  setColor(accentRgb)
  const nameLines = pdf.splitTextToSize(personal?.name || resume?.name || "Your Name", contentWidth)
  pdf.text(nameLines, marginX, cursorY)
  cursorY += nameLines.length * 35 + 8

  if (contactLine) {
    pdf.setFont("times", "normal")
    pdf.setFontSize(11.5)
    setColor(mutedRgb)
    const contactLines = pdf.splitTextToSize(contactLine, contentWidth)
    pdf.text(contactLines, marginX, cursorY)
    cursorY += contactLines.length * 16 + 12
  }

  pdf.setDrawColor(210, 216, 226)
  pdf.setLineWidth(0.8)
  pdf.line(marginX, cursorY, pageWidth - marginX, cursorY)
  cursorY += 22

  for (const sectionId of sectionOrder) {
    if (sectionId === "page-break") {
      if (cursorY > topMargin + 20) {
        addPage()
      }
      continue
    }

    const sectionTitle = SECTION_LABELS[sectionId]
    if (!sectionTitle) continue

    if (sectionId === "summary" && resume?.content?.summary) {
      writeSectionHeading(sectionTitle)
      writeRichText(resume.content.summary)
      continue
    }

    if (sectionId === "experience" && Array.isArray(resume?.content?.experience) && resume.content.experience.length) {
      writeSectionHeading(sectionTitle)

      resume.content.experience.forEach((experience: any, index: number) => {
        const descriptionLines = toLines(experience?.description)
        const estimatedHeight = 54 + Math.max(1, descriptionLines.length) * 16
        if (index > 0 && wouldOverflow(estimatedHeight)) {
          addPage()
          writeSectionHeading(sectionTitle)
        }

        pdf.setFont("helvetica", "bold")
        pdf.setFontSize(13)
        setColor(accentRgb)
        const titleLines = pdf.splitTextToSize(experience?.title || "Role", contentWidth - 150)
        pdf.text(titleLines, marginX, cursorY)

        if (experience?.period) {
          pdf.setFont("helvetica", "bold")
          pdf.setFontSize(9.5)
          setColor(mutedRgb)
          pdf.text(experience.period, pageWidth - marginX, cursorY, { align: "right" })
        }

        cursorY += titleLines.length * 16 + 2

        if (experience?.company) {
          pdf.setFont("times", "bold")
          pdf.setFontSize(10.5)
          setColor(mutedRgb)
          pdf.text(experience.company, marginX, cursorY)
          cursorY += 16
        }

        writeRichText(experience?.description)
        cursorY += 4
      })

      continue
    }

    if (sectionId === "projects" && Array.isArray(resume?.content?.projects) && resume.content.projects.length) {
      writeSectionHeading(sectionTitle)

      resume.content.projects.forEach((project: any, index: number) => {
        const descriptionLines = toLines(project?.description)
        const estimatedHeight = 40 + Math.max(1, descriptionLines.length) * 16
        if (index > 0 && wouldOverflow(estimatedHeight)) {
          addPage()
          writeSectionHeading(sectionTitle)
        }

        pdf.setFont("helvetica", "bold")
        pdf.setFontSize(12.5)
        setColor(accentRgb)
        pdf.text(project?.name || "Project", marginX, cursorY)
        cursorY += 16

        if (project?.url) {
          writeTextBlock(project.url, { fontSize: 10, color: mutedRgb, spacingAfter: 8 })
        }

        writeRichText(project?.description)
        cursorY += 4
      })

      continue
    }

    if (sectionId === "education" && Array.isArray(resume?.content?.education) && resume.content.education.length) {
      writeSectionHeading(sectionTitle)

      resume.content.education.forEach((education: any, index: number) => {
        if (index > 0 && wouldOverflow(48)) {
          addPage()
          writeSectionHeading(sectionTitle)
        }

        pdf.setFont("helvetica", "bold")
        pdf.setFontSize(12)
        setColor(accentRgb)
        pdf.text(education?.degree || "Education", marginX, cursorY)

        if (education?.period) {
          pdf.setFont("helvetica", "bold")
          pdf.setFontSize(9.5)
          setColor(mutedRgb)
          pdf.text(education.period, pageWidth - marginX, cursorY, { align: "right" })
        }

        cursorY += 16
        writeTextBlock(education?.institution || "", { fontSize: 10.5, color: mutedRgb, spacingAfter: 12 })
      })

      continue
    }

    if (sectionId === "skills" && Array.isArray(resume?.content?.skills) && resume.content.skills.length) {
      writeSectionHeading(sectionTitle)
      writeTextBlock(resume.content.skills.join(" • "), { fontSize: 11.5, spacingAfter: 14 })
      continue
    }

    if (sectionId === "certifications" && Array.isArray(resume?.content?.certifications) && resume.content.certifications.length) {
      writeSectionHeading(sectionTitle)

      resume.content.certifications.forEach((certification: any, index: number) => {
        if (index > 0 && wouldOverflow(32)) {
          addPage()
          writeSectionHeading(sectionTitle)
        }

        pdf.setFont("helvetica", "bold")
        pdf.setFontSize(11.5)
        setColor(accentRgb)
        pdf.text(certification?.name || "Certification", marginX, cursorY)

        if (certification?.date) {
          pdf.setFont("helvetica", "bold")
          pdf.setFontSize(9.5)
          setColor(mutedRgb)
          pdf.text(certification.date, pageWidth - marginX, cursorY, { align: "right" })
        }

        cursorY += 18
      })

      cursorY += 4
      continue
    }

    if (sectionId === "languages" && Array.isArray(resume?.content?.languages) && resume.content.languages.length) {
      writeSectionHeading(sectionTitle)

      const languageLines = resume.content.languages.map((language: any) => {
        const name = language?.language || language?.name || ""
        return language?.proficiency ? `${name} - ${language.proficiency}` : name
      })

      writeBulletedLines(languageLines.map((line: string) => `- ${line}`))
      cursorY += 8
    }
  }

  const fileName = sanitizePdfFileName(resume?.name || "resume") || "resume"
  pdf.save(`${fileName}.pdf`)
}
