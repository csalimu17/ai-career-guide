"use client"

import { useCallback, useEffect, useRef, useState } from "react"

import { ResumeTemplate } from "@/components/editor/resume-template"
import { buildTemplatePreviewResume, type TemplateConfig } from "@/lib/templates-config"
import { cn } from "@/lib/utils"

const THUMBNAIL_PAGE_WIDTH = 760
const THUMBNAIL_PAGE_HEIGHT = 1120
const THUMBNAIL_INSET = 12

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

type TemplateThumbnailProps = {
  template: TemplateConfig
  className?: string
  highFidelity?: boolean
}

export function TemplateThumbnail({ template, className, highFidelity = false }: TemplateThumbnailProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [fitScale, setFitScale] = useState(template.thumbnail.scale)
  const [isIntersecting, setIsIntersecting] = useState(false)
  const accent = template.defaults.primaryColor
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

  useEffect(() => {
    if (!highFidelity) return

    const element = containerRef.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsIntersecting(true)
          observer.unobserve(element)
        }
      },
      { rootMargin: "200px" }
    )
    observer.observe(element)

    return () => {
      observer.disconnect()
    }
  }, [highFidelity])

  // Pure CSS-only lightweight mockup layout (instant rendering, zero duplicate text content)
  if (!highFidelity) {
    return (
      <div
        ref={containerRef}
        aria-hidden="true"
        role="presentation"
        className={cn(
          "relative h-full w-full overflow-hidden bg-slate-50 flex items-center justify-center p-4 sm:p-5",
          className
        )}
      >
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at top right, ${hexToRgba(accent, 0.12)}, transparent 45%), radial-gradient(circle at bottom left, ${hexToRgba(accent, 0.08)}, transparent 45%), linear-gradient(180deg, rgba(255,255,255,0.98), ${hexToRgba(accent, 0.02)})`,
          }}
        />

        <div
          className="relative w-full aspect-[3/4] rounded-2xl border bg-white shadow-sm flex flex-col p-4 space-y-3 overflow-hidden select-none"
          style={{ borderColor: hexToRgba(accent, 0.1) }}
        >
          {template.layout === "two-column" ? (
            // TWO COLUMN LAYOUT MOCKUP
            <div className="flex h-full gap-3">
              {/* Sidebar */}
              <div className="w-[30%] border-r border-slate-100 pr-2 space-y-3 flex flex-col justify-start">
                <div className="h-7 w-7 rounded-full bg-slate-100 shrink-0" style={{ border: `1px solid ${hexToRgba(accent, 0.2)}` }} />
                <div className="space-y-1.5 pt-1">
                  <div className="h-1 w-full bg-slate-100 rounded" />
                  <div className="h-1 w-5/6 bg-slate-100 rounded" />
                  <div className="h-1 w-4/5 bg-slate-100 rounded" />
                </div>
                <div className="space-y-2 pt-2">
                  <div className="h-1.5 w-2/3 rounded" style={{ backgroundColor: hexToRgba(accent, 0.6) }} />
                  <div className="flex flex-wrap gap-1">
                    <div className="h-2 w-6 bg-slate-100 rounded" />
                    <div className="h-2 w-8 bg-slate-100 rounded" />
                  </div>
                </div>
              </div>
              {/* Main Content Area */}
              <div className="flex-1 space-y-4 pl-1">
                <div className="space-y-1.5">
                  <div className="h-2.5 w-3/4 rounded" style={{ backgroundColor: accent }} />
                  <div className="h-1.5 w-1/2 bg-slate-200 rounded" />
                </div>
                <div className="space-y-1.5 pt-1">
                  <div className="h-1.5 w-1/3 rounded" style={{ backgroundColor: hexToRgba(accent, 0.5) }} />
                  <div className="space-y-1">
                    <div className="h-1 w-full bg-slate-100 rounded" />
                    <div className="h-1 w-5/6 bg-slate-100 rounded" />
                  </div>
                </div>
                <div className="space-y-2 pt-1">
                  <div className="h-1.5 w-1/3 rounded" style={{ backgroundColor: hexToRgba(accent, 0.5) }} />
                  <div className="space-y-1.5">
                    <div className="flex justify-between">
                      <div className="h-1.5 w-1/2 bg-slate-200 rounded" />
                      <div className="h-1 w-1/4 bg-slate-100 rounded" />
                    </div>
                    <div className="h-1 w-full bg-slate-100 rounded" />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // SINGLE COLUMN LAYOUT MOCKUP
            <div className="flex flex-col h-full space-y-4">
              <div className="flex flex-col items-center space-y-1.5 pb-2 border-b border-slate-100">
                <div className="h-3 w-1/2 rounded" style={{ backgroundColor: accent }} />
                <div className="h-1.5 w-1/3 bg-slate-200 rounded" />
                <div className="flex gap-2">
                  <div className="h-1 w-12 bg-slate-100 rounded" />
                  <div className="h-1 w-16 bg-slate-100 rounded" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-1.5 w-1/4 rounded" style={{ backgroundColor: hexToRgba(accent, 0.6) }} />
                <div className="space-y-1">
                  <div className="h-1 w-full bg-slate-100 rounded" />
                  <div className="h-1 w-5/6 bg-slate-100 rounded" />
                </div>
              </div>
              <div className="space-y-3">
                <div className="h-1.5 w-1/4 rounded" style={{ backgroundColor: hexToRgba(accent, 0.6) }} />
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <div className="h-1.5 w-1/3 bg-slate-200 rounded" />
                    <div className="h-1 w-16 bg-slate-100 rounded" />
                  </div>
                  <div className="space-y-1">
                    <div className="h-1 w-full bg-slate-100 rounded" />
                    <div className="h-1 w-4/5 bg-slate-100 rounded" />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Build full preview CV only if highFidelity is explicitly requested
  const previewResume = buildTemplatePreviewResume(template.id)

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      role="presentation"
      className={cn(
        "relative h-full w-full overflow-hidden bg-slate-50",
        className
      )}
    >
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `radial-gradient(circle at top right, ${hexToRgba(accent, 0.16)}, transparent 42%), radial-gradient(circle at bottom left, ${hexToRgba(accent, 0.1)}, transparent 45%), linear-gradient(180deg, rgba(255,255,255,0.98), ${hexToRgba(accent, 0.035)})`,
        }}
      />

      <div
        className="absolute inset-[12px] flex items-center justify-center overflow-hidden rounded-[1.15rem] border bg-white shadow-[0_15px_35px_-20px_rgba(15,23,42,0.2)]"
        style={{ borderColor: hexToRgba(accent, 0.08) }}
      >
        <div
          className="relative shrink-0 overflow-hidden"
          style={{
            width: `${scaledWidth}px`,
            height: `${scaledHeight}px`,
          }}
        >
          {isIntersecting ? (
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
          ) : (
            <div className="flex h-full w-full flex-col justify-between p-6 bg-white animate-pulse">
              <div className="space-y-4">
                <div className="h-6 w-1/3 bg-slate-200 rounded" />
                <div className="h-4 w-1/2 bg-slate-100 rounded" />
                <div className="space-y-2 pt-8">
                  <div className="h-4 w-full bg-slate-200 rounded" />
                  <div className="h-4 w-5/6 bg-slate-100 rounded" />
                  <div className="h-4 w-4/5 bg-slate-100 rounded" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
