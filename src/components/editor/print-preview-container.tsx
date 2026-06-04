"use client"

import React, { useCallback, useEffect, useRef, useState } from "react"
import { ResumeTemplate } from "./resume-template"
import { cn } from "@/lib/utils"
import { Maximize2, Minimize2, ZoomIn, ZoomOut, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getTemplateConfig } from "@/lib/templates-config"

interface PrintPreviewContainerProps {
  resume: any
  className?: string
  /** "width" | "page" | null — overrides the default initial fit mode */
  defaultFitMode?: "width" | "page" | null
  /** When true, hides the toolbar (for embedded sidebar usage) */
  compact?: boolean
}

const A4_WIDTH_MM = 210
const A4_HEIGHT_MM = 297
const MM_TO_PX = 3.7795275591 // 96 DPI

const PAGE_W = Math.round(A4_WIDTH_MM * MM_TO_PX)  // ~794 px
const PAGE_H = Math.round(A4_HEIGHT_MM * MM_TO_PX) // ~1123 px
const PAGE_GAP = 32  // gap between pages in px (unscaled)
const A4_MARGIN_PX = 48 // ~12.7mm or 0.5 inch margins

export function PrintPreviewContainer({ resume, className, defaultFitMode = "page", compact = false }: PrintPreviewContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const [scale, setScale]       = useState(1)
  const [pageCount, setPageCount] = useState(1)
  // fitMode: "width" = fit width, "page" = fit single page, null = manual
  const [fitMode, setFitMode]   = useState<"width" | "page" | null>(defaultFitMode)
  const templateCategory = getTemplateConfig(resume?.templateId).category
  const chromeTone = {
    Professional: "bg-[#2b3545] before:absolute before:inset-0 before:content-[''] before:bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.08),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(15,23,42,0.12),transparent_40%)]",
    Modern: "bg-[#edf4ff] before:absolute before:inset-0 before:content-[''] before:bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.10),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(14,165,233,0.08),transparent_40%)]",
    Classic: "bg-[#f6efe4] before:absolute before:inset-0 before:content-[''] before:bg-[radial-gradient(circle_at_top_right,rgba(180,83,9,0.10),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(120,53,15,0.08),transparent_40%)]",
  }[templateCategory]

  // Recalculate page count whenever resume changes
  // We use CSS Columns to determine the logical number of pages
  const contentW = PAGE_W - (A4_MARGIN_PX * 2)
  const contentH = PAGE_H - (A4_MARGIN_PX * 2)

  useEffect(() => {
    if (!contentRef.current) return
    const scrollW = contentRef.current.scrollWidth
    // In column layout, page count is determined by how many columns wide the content is
    const pages = Math.max(1, Math.ceil(scrollW / contentW))
    setPageCount(pages)
  }, [resume, contentW])

  const computeScale = useCallback(() => {
    if (!containerRef.current) return
    const padding = compact ? 32 : 64
    const availW = containerRef.current.clientWidth  - padding  // 16px or 32px padding each side
    const availH = containerRef.current.clientHeight - padding

    if (fitMode === "width") {
      setScale(Math.min(availW / PAGE_W, 2))
    } else if (fitMode === "page") {
      // Fit a whole A4 page inside the viewport bounds.
      // On narrow mobile screens we must clamp to width as well as height,
      // otherwise the page can still overflow horizontally and look cropped.
      setScale(Math.min(availW / PAGE_W, availH / PAGE_H, 2))
    }
  }, [compact, fitMode])

  // Re-run auto-fit on mount, resize, or mode change
  useEffect(() => {
    computeScale()
    const observer = new ResizeObserver(computeScale)
    if (containerRef.current) observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [computeScale])

  // ── The trick: after CSS scale the element still occupies its original
  //    layout rect. We compensate by setting an explicit wrapper height so
  //    the scroll area grows/shrinks correctly.
  const scaledPageH   = PAGE_H * scale
  const scaledGap     = PAGE_GAP * scale
  const padding = compact ? 32 : 64
  const totalScaledH  = pageCount * scaledPageH + (pageCount - 1) * scaledGap + padding

  return (
    <div className={cn("flex flex-col w-full h-full overflow-hidden", className)}>
      {/* ── Toolbar (hidden in compact mode) ── */}
      {!compact && (
      <div className="flex items-center justify-between px-4 md:px-6 py-3 pr-20 border-b border-slate-200 bg-white/60 backdrop-blur-sm shrink-0">

        {/* Left: page count + zoom controls */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100/80 border border-slate-200 text-slate-600">
            <FileText className="h-3.5 w-3.5" />
            <span className="text-[10px] font-black uppercase tracking-wider">
              {pageCount} {pageCount === 1 ? "Page" : "Pages"}
            </span>
          </div>

          <div className="flex items-center gap-0.5 bg-slate-100/60 rounded-full px-1 py-1 border border-slate-200">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-full hover:bg-white hover:shadow-sm transition-all"
              title="Zoom out"
              onClick={() => {
                setFitMode(null)
                setScale(s => Math.max(0.25, +(s - 0.1).toFixed(2)))
              }}
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </Button>
            <button
              className="min-w-[46px] text-center text-[11px] font-bold text-slate-700 hover:text-indigo-600 transition-colors px-1 cursor-default select-none"
              onClick={() => { setFitMode("width"); }}
              title="Click to fit width"
            >
              {Math.round(scale * 100)}%
            </button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-full hover:bg-white hover:shadow-sm transition-all"
              title="Zoom in"
              onClick={() => {
                setFitMode(null)
                setScale(s => Math.min(2.5, +(s + 0.1).toFixed(2)))
              }}
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Right: Fit mode buttons */}
        <div className="flex items-center gap-1">
          <Button
            variant={fitMode === "width" ? "secondary" : "ghost"}
            size="sm"
            className={cn(
              "rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-wider h-8 px-2 md:px-3 transition-all",
              fitMode === "width" && "bg-slate-800 text-white hover:bg-slate-700"
            )}
            onClick={() => setFitMode("width")}
          >
            <Maximize2 className="mr-1 h-3 w-3 md:h-3.5 md:w-3.5" />
            Fit Width
          </Button>
          <Button
            variant={fitMode === "page" ? "secondary" : "ghost"}
            size="sm"
            className={cn(
              "rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-wider h-8 px-2 md:px-3 transition-all",
              fitMode === "page" && "bg-slate-800 text-white hover:bg-slate-700"
            )}
            onClick={() => setFitMode("page")}
          >
            <Minimize2 className="mr-1 h-3 w-3 md:h-3.5 md:w-3.5" />
            Fit Page
          </Button>
        </div>
      </div>
      )}

      {/* ── Preview Area ── */}
      <div
        ref={containerRef}
        className={cn("relative flex-1 overflow-auto", chromeTone)}
        style={{ scrollbarColor: "#475569 #1e293b", scrollbarWidth: "thin" }}
      >
        {/* Centering wrapper - sets the correct scrollable height */}
        <div
          className="relative flex justify-center"
          style={{ 
            minHeight: totalScaledH, 
            paddingTop: compact ? 16 : 32, 
            paddingBottom: compact ? 16 : 32,
            paddingLeft: compact ? 16 : 32,
            paddingRight: compact ? 16 : 32,
          }}
        >
          {/* Scale wrapper - origin top-center */}
          <div
            className="flex flex-col items-center transition-transform duration-200 ease-out origin-top"
            style={{
              transform: `scale(${scale})`,
              gap: PAGE_GAP,
              // Compensate layout: collapse the excess height added by scale
              marginBottom: -(PAGE_H * (1 - scale) * pageCount + PAGE_GAP * (1 - scale) * (pageCount - 1)),
            }}
          >
            {/* Logical Fragmentation Stage (Hidden) */}
            {/* Uses columns to determine where pages should naturally break */}
            <div
              ref={contentRef}
              className="absolute left-0 top-0 opacity-0 pointer-events-none"
              style={{ 
                width: contentW,
                height: contentH,
                columnWidth: `${contentW}px`,
                columnGap: 0,
                columnFill: "auto",
                overflow: "hidden"
              }}
              aria-hidden="true"
            >
              <ResumeTemplate data={resume} isPrint={true} noPadding={true} />
            </div>

            {/* Visible A4 pages */}
            {Array.from({ length: pageCount }).map((_, i) => (
              <div
                key={i}
                className="relative bg-white ring-1 ring-black/20 overflow-hidden group shrink-0"
                style={{
                  width:  PAGE_W,
                  height: PAGE_H,
                  boxShadow: "0 20px 60px -12px rgba(0,0,0,0.6), 0 4px 16px -4px rgba(0,0,0,0.4)",
                  borderRadius: 2,
                }}
              >
                {/* Page Viewport with logically fragmented content */}
                <div 
                  className="relative w-full h-full"
                  style={{ 
                    padding: `${A4_MARGIN_PX}px`,
                  }}
                >
                  <div className="relative w-full h-full overflow-hidden">
                    {/* 
                      Display current page's column. 
                      TranslateX(-i * width) reveals the i-th column segment.
                    */}
                    <div
                      className="absolute inset-y-0 left-0"
                      style={{ 
                        width: "100%",
                        height: contentH,
                        columnWidth: `${contentW}px`,
                        columnGap: 0,
                        columnFill: "auto",
                        transform: `translateX(-${i * contentW}px)` 
                      }}
                    >
                      <ResumeTemplate
                        data={resume}
                        isPrint={true}
                        noPadding={true}
                        className="!border-none !shadow-none !rounded-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Print margin guides (shown on hover) - aligned with A4_MARGIN_PX */}
                <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  {/* Top margin */}
                  <div className="absolute top-[48px] inset-x-[48px] border-t border-dashed border-indigo-300/40" />
                  {/* Bottom margin */}
                  <div className="absolute bottom-[48px] inset-x-[48px] border-b border-dashed border-indigo-300/40" />
                  {/* Left margin */}
                  <div className="absolute left-[48px] inset-y-[48px] border-l border-dashed border-indigo-300/40" />
                  {/* Right margin */}
                  <div className="absolute right-[48px] inset-y-[48px] border-r border-dashed border-indigo-300/40" />
                </div>

                {/* Page number badge */}
                <div className="absolute bottom-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                  <div className="bg-black/10 backdrop-blur-md px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest text-slate-600 border border-black/5">
                    {i + 1} / {pageCount}
                  </div>
                </div>

                {/* Page break indicator (bottom of page, except last) */}
                {i < pageCount - 1 && (
                  <div className="absolute bottom-0 inset-x-0 h-[3px] bg-gradient-to-r from-transparent via-slate-300/60 to-transparent pointer-events-none" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
