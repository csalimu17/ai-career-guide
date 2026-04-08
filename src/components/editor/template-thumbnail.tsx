"use client"

import { ResumeTemplate } from "@/components/editor/resume-template"
import { buildTemplatePreviewResume, type TemplateConfig } from "@/lib/templates-config"
import { cn } from "@/lib/utils"

type TemplateThumbnailProps = {
  template: TemplateConfig
  className?: string
}

export function TemplateThumbnail({ template, className }: TemplateThumbnailProps) {
  const previewResume = buildTemplatePreviewResume(template.id)
  const width = 760
  const scale = template.thumbnail.scale
  const scaledHeight = 1120 * scale

  return (
    <div
      className={cn(
        "relative h-full w-full overflow-hidden bg-[linear-gradient(135deg,rgba(103,58,183,0.10),rgba(33,150,243,0.08)_55%,rgba(255,152,0,0.10))]",
        className
      )}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(103,58,183,0.16),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(33,150,243,0.14),transparent_32%),linear-gradient(180deg,rgba(255,255,255,0.45),rgba(255,255,255,0.08))]" />

      <div className="absolute inset-[10px] overflow-hidden rounded-[1.1rem] border border-white/90 bg-white shadow-[0_22px_48px_-30px_rgba(15,23,42,0.35)]">
        <div className="flex justify-center pt-2">
          <div
            className="shrink-0 origin-top"
            style={{
              width: `${width}px`,
              minWidth: `${width}px`,
              transform: `scale(${scale})`,
              transformOrigin: "top center",
            }}
          >
            <ResumeTemplate data={previewResume} mode="thumbnail" className="shadow-none" />
          </div>
        </div>
      </div>
    </div>
  )
}
