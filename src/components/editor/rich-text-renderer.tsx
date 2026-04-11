"use client"

import { cn } from "@/lib/utils"
import { isRichTextEmpty, normalizeRichTextValue } from "@/lib/rich-text"

interface RichTextRendererProps {
  value: string
  className?: string
  compact?: boolean
}

export function RichTextRenderer({ value, className, compact = false }: RichTextRendererProps) {
  const html = normalizeRichTextValue(value)

  if (!html || isRichTextEmpty(html)) {
    return null
  }

  return (
    <div
      className={cn(
        "rich-text-renderer text-[0.9em] text-slate-700",
        "[&_p]:mb-3 [&_p:last-child]:mb-0 [&_p]:leading-relaxed [&_p]:[break-inside:avoid]",
        "[&_ul]:mb-3 [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5",
        "[&_ol]:mb-3 [&_ol]:list-decimal [&_ol]:space-y-1.5 [&_ol]:pl-5",
        "[&_li]:leading-relaxed [&_li]:[break-inside:avoid] [&_strong]:font-bold [&_em]:italic [&_u]:underline [&_u]:underline-offset-[0.18em] [&_u]:[text-decoration-thickness:1px] [&_u]:[text-decoration-skip-ink:auto]",
        compact && "[&_p]:mb-1.5 [&_ul]:mb-1.5 [&_ol]:mb-1.5 [&_ul]:space-y-1 [&_ol]:space-y-1",
        className
      )}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
