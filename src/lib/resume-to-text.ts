import { richTextToPlainText } from "@/lib/rich-text"

function joinLines(lines: Array<string | null | undefined>) {
  return lines.filter(Boolean).join("\n").trim()
}

export function buildResumePlainText(resume: any) {
  const content = resume?.content || {}
  const personal = content.personal || {}

  const sections = [
    joinLines([
      personal.name ? `Name: ${personal.name}` : null,
      personal.email ? `Email: ${personal.email}` : null,
      personal.phone ? `Phone: ${personal.phone}` : null,
      personal.location ? `Location: ${personal.location}` : null,
      personal.linkedin ? `LinkedIn: ${personal.linkedin}` : null,
      personal.website ? `Website: ${personal.website}` : null,
    ]),
    richTextToPlainText(content.summary)
      ? `Professional Summary\n${richTextToPlainText(content.summary)}`
      : "",
    (content.experience || [])
      .map((item: any) =>
        joinLines([
          "Work Experience",
          [item.title, item.company].filter(Boolean).join(" - "),
          item.period || "",
          richTextToPlainText(item.description),
        ])
      )
      .filter(Boolean)
      .join("\n\n"),
    (content.education || [])
      .map((item: any) =>
        joinLines([
          "Education",
          [item.degree, item.institution].filter(Boolean).join(" - "),
          item.period || "",
        ])
      )
      .filter(Boolean)
      .join("\n\n"),
    (content.projects || [])
      .map((item: any) =>
        joinLines([
          "Projects",
          item.name || "",
          item.url || "",
          richTextToPlainText(item.description),
        ])
      )
      .filter(Boolean)
      .join("\n\n"),
    content.skills?.length ? `Skills\n${content.skills.join(", ")}` : "",
    content.languages?.length
      ? `Languages\n${content.languages
          .map((item: any) => [item.language || item.name, item.proficiency].filter(Boolean).join(" - "))
          .join("\n")}`
      : "",
    content.certifications?.length
      ? `Certifications\n${content.certifications
          .map((item: any) => [item.name, item.date].filter(Boolean).join(" - "))
          .join("\n")}`
      : "",
  ]

  return sections.filter(Boolean).join("\n\n").trim()
}
