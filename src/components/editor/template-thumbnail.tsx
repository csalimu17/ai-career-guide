"use client"

import { useCallback, useEffect, useRef, useState } from "react"

import { ResumeTemplate } from "@/components/editor/resume-template"
import { buildTemplatePreviewResume, type TemplateConfig } from "@/lib/templates-config"
import { cn } from "@/lib/utils"

const THUMBNAIL_PAGE_WIDTH = 760
const THUMBNAIL_PAGE_HEIGHT = 1120
const THUMBNAIL_INSET = 12

type TemplateThumbnailProps = {
  template: TemplateConfig
  className?: string
}

export function TemplateThumbnail({ template, className }: TemplateThumbnailProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const previewResume = buildTemplatePreviewResume(template.id)
  const [fitScale, setFitScale] = useState(template.thumbnail.scale)
  const scaledWidth = Math.max(THUMBNAIL_PAGE_WIDTH * fitScale, 160)
  const scaledHeight = Math.max(THUMBNAIL_PAGE_HEIGHT * fitScale, 220)

  const computeScale = useCallback(() => {
    const container = containerRef.current
    if (!container) return

    const availableWidth = Math.max(container.clientWidth - THUMBNAIL_INSET * 2, 160)
    const availableHeight = Math.max(container.clientHeight - THUMBNAIL_INSET * 2, 220)
    const nextScale = Math.min(
      availableWidth / THUMBNAIL_PAGE_WIDTH,
      availableHeight / THUMBNAIL_PAGE_HEIGHT,
      template.thumbnail.scale
    )

    setFitScale(Number.isFinite(nextScale) ? nextScale : template.thumbnail.scale)
  }, [template.thumbnail.scale])

  useEffect(() => {
    computeScale()

    const observer = new ResizeObserver(() => computeScale())
    if (containerRef.current) {
      observer.observe(containerRef.current)
    }

    return () => observer.disconnect()
  }, [computeScale])

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative h-full w-full overflow-hidden bg-slate-50",
        className
      )}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.08),transparent_40%),radial-gradient(circle_at_bottom_left,rgba(99,102,241,0.05),transparent_40%)]" />

      <div className="absolute inset-[12px] flex items-center justify-center overflow-hidden rounded-[1.15rem] border border-white bg-white shadow-[0_15px_35px_-20px_rgba(15,23,42,0.2)]">
        <div
          className="relative shrink-0 overflow-hidden"
          style={{
            width: `${scaledWidth}px`,
            height: `${scaledHeight}px`,
          }}
        >
          <div
            className="origin-top-left"
            style={{
              width: `${THUMBNAIL_PAGE_WIDTH}px`,
              height: `${THUMBNAIL_PAGE_HEIGHT}px`,
              transform: `scale(${fitScale})`,
              transformOrigin: "top left",
            }}
          >
            <ResumeTemplate data={previewResume} mode="thumbnail" className="shadow-none" />
          </div>
        </div>
      </div>
    </div>
  )
}
