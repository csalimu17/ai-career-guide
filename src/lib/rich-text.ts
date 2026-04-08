const RICH_TEXT_TAG_PATTERN = /<\/?(?:p|div|ul|ol|li|br|strong|em|u|b|i|span)\b/i

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

function decodeHtml(value: string) {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&amp;/gi, "&")
}

function formatInlineText(value: string) {
  return escapeHtml(value)
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/__([^_]+)__/g, "<u>$1</u>")
    .replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, "$1<em>$2</em>")
}

function normalizeLineEndings(value: string) {
  return value.replace(/\r\n/g, "\n")
}

function stripInlineHtml(value: string) {
  return decodeHtml(
    value
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/?(strong|em|u)>/gi, "")
      .replace(/<\/?[^>]+>/g, "")
  )
}

function wrapPlainTextAsParagraphs(value: string) {
  const normalized = normalizeLineEndings(value).trim()
  if (!normalized) return ""

  return normalized
    .split(/\n{2,}/)
    .map((block) => {
      const lines = block.split("\n").map((line) => line.trimEnd())
      const contentLines = lines.filter((line) => line.trim())

      if (!contentLines.length) {
        return ""
      }

      const isOrderedList = contentLines.every((line) => /^\d+[.)]\s+/.test(line))
      if (isOrderedList) {
        return `<ol>${contentLines
          .map((line) => `<li>${formatInlineText(line.replace(/^\d+[.)]\s+/, ""))}</li>`)
          .join("")}</ol>`
      }

      const isBulletList = contentLines.every((line) => /^[-*•]\s+/.test(line))
      if (isBulletList) {
        return `<ul>${contentLines
          .map((line) => `<li>${formatInlineText(line.replace(/^[-*•]\s+/, ""))}</li>`)
          .join("")}</ul>`
      }

      return `<p>${lines
        .map((line) => (line.trim() ? formatInlineText(line) : "<br />"))
        .join("<br />")}</p>`
    })
    .filter(Boolean)
    .join("")
}

export function sanitizeRichTextHtml(value: string) {
  if (!value) return ""

  let html = normalizeLineEndings(value).replace(/&nbsp;/gi, " ")
  html = html.replace(/<!--[\s\S]*?-->/g, "")
  html = html.replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, "")
  html = html.replace(/<(\/?)div\b[^>]*>/gi, "<$1p>")
  html = html.replace(/<(\/?)b\b[^>]*>/gi, "<$1strong>")
  html = html.replace(/<(\/?)i\b[^>]*>/gi, "<$1em>")
  html = html.replace(/<span\b[^>]*>/gi, "")
  html = html.replace(/<\/span>/gi, "")
  html = html.replace(/<(p|ul|ol|li|strong|em|u)\b[^>]*>/gi, (_, tag: string) => `<${tag.toLowerCase()}>`)
  html = html.replace(/<\/(p|ul|ol|li|strong|em|u)\b[^>]*>/gi, (_, tag: string) => `</${tag.toLowerCase()}>`)
  html = html.replace(/<br\b[^>]*\/?>/gi, "<br />")
  html = html.replace(/<(?!\/?(?:p|br|ul|ol|li|strong|em|u)\b)[^>]+>/gi, "")
  html = html.replace(/^\s+|\s+$/g, "")

  if (!html) {
    return ""
  }

  const stripped = stripInlineHtml(html).trim()
  if (!stripped) {
    return ""
  }

  if (!RICH_TEXT_TAG_PATTERN.test(html)) {
    return wrapPlainTextAsParagraphs(stripped)
  }

  return html
}

export function normalizeRichTextValue(value: string | null | undefined) {
  const safeValue = value ?? ""
  if (!safeValue.trim()) return ""

  if (!RICH_TEXT_TAG_PATTERN.test(safeValue)) {
    return wrapPlainTextAsParagraphs(safeValue)
  }

  return sanitizeRichTextHtml(safeValue)
}

export function richTextToPlainText(value: string | null | undefined) {
  const normalized = normalizeRichTextValue(value)
  if (!normalized) return ""

  let plain = normalized
  plain = plain.replace(/<ol>([\s\S]*?)<\/ol>/gi, (_, inner: string) => {
    let index = 0
    const items = inner.replace(/<li>([\s\S]*?)<\/li>/gi, (_match: string, item: string) => `${++index}. ${stripInlineHtml(item)}\n`)
    return `${items.trimEnd()}\n\n`
  })
  plain = plain.replace(/<ul>([\s\S]*?)<\/ul>/gi, (_, inner: string) => {
    const items = inner.replace(/<li>([\s\S]*?)<\/li>/gi, (_match: string, item: string) => `- ${stripInlineHtml(item)}\n`)
    return `${items.trimEnd()}\n\n`
  })
  plain = plain.replace(/<p>([\s\S]*?)<\/p>/gi, (_match: string, item: string) => `${stripInlineHtml(item)}\n\n`)
  plain = stripInlineHtml(plain)
  plain = plain.replace(/\n{3,}/g, "\n\n").trim()
  return plain
}

export function isRichTextEmpty(value: string | null | undefined) {
  return !richTextToPlainText(value).trim()
}

export function plainTextToRichTextHtml(value: string | null | undefined) {
  return wrapPlainTextAsParagraphs(value ?? "")
}
