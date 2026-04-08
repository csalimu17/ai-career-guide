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
        "relative h-full w-full overflow-hidden bg-slate-50",
        className
      )}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.08),transparent_40%),radial-gradient(circle_at_bottom_left,rgba(99,102,241,0.05),transparent_40%)]" />

      <div className="absolute inset-[12px] overflow-hidden rounded-xl border border-white bg-white shadow-[0_15px_35px_-20px_rgba(15,23,42,0.2)]">
        <div className="flex justify-center">
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
