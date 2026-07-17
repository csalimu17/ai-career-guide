"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { useParams, useSearchParams } from "next/navigation"
import { doc } from "firebase/firestore"
import { ArrowLeft, Loader2, Printer, ShieldCheck } from "lucide-react"

import { ResumeTemplate } from "@/components/editor/resume-template"
import { Button } from "@/components/ui/button"
import { useDoc, useFirestore, useMemoFirebase, useUser } from "@/firebase"
import { getTemplateConfig } from "@/lib/templates-config"
import { cn } from "@/lib/utils"

const PAGE_W = 794 // 210mm at 96 DPI
const PAGE_H = 1123 // 297mm at 96 DPI
const MARGIN_PX = 48 // ~12.7mm or 0.5 inches
const CONTENT_W = PAGE_W - MARGIN_PX * 2 // 698
const CONTENT_H = PAGE_H - MARGIN_PX * 2 // 1027
const PREVIEW_GUTTER_PX = 32 // matches px-4 (16px each side) on the print-pages container

function waitForAnimationFrame() {
  return new Promise((resolve) => window.requestAnimationFrame(() => resolve(null)))
}

/**
 * Fire a quality-engineer signal to the server, attaching a Firebase ID
 * token so the (now-authenticated) /api/quality/report endpoint accepts it.
 * Pass `user` as the first arg from the component scope.
 *
 * `keepalive: true` is kept so the request survives the brief
 * print-then-navigate window without being torn down.
 */
async function reportQualitySignal(
  user: { getIdToken: (forceRefresh?: boolean) => Promise<string> } | null | undefined,
  payload: Record<string, unknown>
) {
  if (!user) return; // Not signed in — endpoint will 401; just skip.
  try {
    const idToken = await user.getIdToken();
    await fetch("/api/quality/report", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify(payload),
      keepalive: true,
    });
  } catch (error) {
    console.warn("Failed to report print quality signal:", error);
  }
}

type PrintLayoutInspection = {
  status: "healthy" | "warning"
  pageCount: number
  manualBreaks: number
  crossingBlocks: number
  headingRisks: number
}

export default function ResumePrintPage() {
  const params = useParams<{ id: string }>()
  const searchParams = useSearchParams()
  const { user, uid, isUserLoading } = useUser()
  const db = useFirestore()
  const resumeId = useMemo(() => {
    if (typeof params?.id === "string") return params.id
    if (Array.isArray(params?.id)) return params.id[0] ?? ""
    return ""
  }, [params])
  const exportKey = searchParams.get("exportKey")
  const shouldAutoPrint = searchParams.get("autoprint") === "1"
  const [localResume, setLocalResume] = useState<any | null>(null)
  const [hasTriggeredAutoPrint, setHasTriggeredAutoPrint] = useState(false)
  const [isPrintReady, setIsPrintReady] = useState(false)
  const [isPrinting, setIsPrinting] = useState(false)
  const [printStatus, setPrintStatus] = useState<string | null>(null)
  const resumeSurfaceRef = useRef<HTMLDivElement | null>(null)
  const measureRef = useRef<HTMLDivElement | null>(null)
  const [pageCount, setPageCount] = useState(1)
  const [previewScale, setPreviewScale] = useState(1)

  // Scale the on-screen A4 preview down to fit narrow viewports (mobile).
  // The actual print/PDF output is unaffected: globals.css `@media print`
  // resets transform/dimensions back to true A4.
  useEffect(() => {
    if (typeof window === "undefined") return

    const computeScale = () => {
      const available = window.innerWidth - PREVIEW_GUTTER_PX
      setPreviewScale(Math.min(1, available / PAGE_W))
    }

    computeScale()
    window.addEventListener("resize", computeScale)
    window.addEventListener("orientationchange", computeScale)
    return () => {
      window.removeEventListener("resize", computeScale)
      window.removeEventListener("orientationchange", computeScale)
    }
  }, [])

  const resumeRef = useMemoFirebase(
    () => (localResume || !db || !uid || !resumeId ? null : doc(db, "users", uid, "resumes", resumeId)),
    [localResume, db, uid, resumeId]
  )
  const { data: storedResume, isLoading } = useDoc(resumeRef)
  const resume = localResume ?? storedResume
  const templateCategory = getTemplateConfig(resume?.templateId).category
  const templateName = getTemplateConfig(resume?.templateId).name
  const pageTone = {
    Professional: "bg-[#f4f7fa] before:absolute before:inset-0 before:content-[''] before:bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.06),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(15,23,42,0.06),transparent_40%)]",
    Modern: "bg-[#f1f7ff] before:absolute before:inset-0 before:content-[''] before:bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.08),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(14,165,233,0.06),transparent_40%)]",
    Classic: "bg-[#f8f2e8] before:absolute before:inset-0 before:content-[''] before:bg-[radial-gradient(circle_at_top_right,rgba(180,83,9,0.08),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(120,53,15,0.06),transparent_40%)]",
  }[templateCategory]

  useEffect(() => {
    if (typeof window === "undefined" || !exportKey) return

    try {
      const rawResume = window.sessionStorage.getItem(exportKey) ?? window.localStorage.getItem(exportKey)
      if (!rawResume) return

      const parsedResume = JSON.parse(rawResume)
      if (parsedResume && typeof parsedResume === "object") {
        setLocalResume(parsedResume)
      }
      window.sessionStorage.removeItem(exportKey)
      window.localStorage.removeItem(exportKey)
    } catch (error) {
      console.warn("Failed to restore mobile print payload:", error)
    }
  }, [exportKey])

  useEffect(() => {
    setIsPrintReady(false)
    setHasTriggeredAutoPrint(false)
    setPrintStatus(null)
  }, [resumeId, localResume, storedResume])

  const inspectPrintLayout = useCallback((): PrintLayoutInspection | null => {
    if (typeof window === "undefined") return null

    const surface = measureRef.current
    if (!surface) return null

    // For column-based layout, we measure horizontal overflow
    const scrollW = surface.scrollWidth
    const calculatedPageCount = Math.max(1, Math.ceil((scrollW + 40) / (CONTENT_W + 40)))
    
    // We can still look for crossing blocks vertically within the columns
    const surfaceRect = surface.getBoundingClientRect()
    const blocks = Array.from(
      surface.querySelectorAll<HTMLElement>(".resume-header, .resume-section-heading, .resume-entry, .resume-manual-break")
    )

    let manualBreaks = 0
    let crossingBlocks = 0
    let headingRisks = 0
    const oversizedBlockThreshold = CONTENT_H * 0.75

    for (const block of blocks) {
      if (block.classList.contains("resume-manual-break")) {
        manualBreaks += 1
        continue
      }

      const rect = block.getBoundingClientRect()
      if (rect.height <= 0) continue

      // Position relative to the top of the content flow
      // In CSS columns, elements are physically moved, so we use their left position to find the logical top
      // pageIndex = Math.round(rect.left / CONTENT_W)
      // logicalTop = (rect.top - surfaceRect.top) + (pageIndex * CONTENT_H)
      
      // Actually, since we use column-fill: auto with a fixed height, the vertical position 
      // in the scrollable container is what we want.
      const top = rect.top - surfaceRect.top
      const bottom = rect.bottom - surfaceRect.top

      const startPage = Math.floor(top / (CONTENT_H + 1))
      const endPage = Math.floor((bottom - 1) / (CONTENT_H + 1))

      if (startPage !== endPage) {
        // This block crosses a page break
        crossingBlocks += 1
      }

      if (block.classList.contains("resume-section-heading")) {
        // Heading risk: too close to the bottom of its page
        const distanceToBottom = (CONTENT_H + 1) - (bottom % (CONTENT_H + 1))
        if (distanceToBottom < 45) { // If less than ~12mm from bottom
          headingRisks += 1
        }
      }

      // Check for oversized blocks that simply won't fit on one page
      if (rect.height > oversizedBlockThreshold) {
        crossingBlocks += 1
      }
    }

    return {
      status: crossingBlocks > 0 || headingRisks > 0 ? "warning" : "healthy",
      pageCount: calculatedPageCount,
      manualBreaks,
      crossingBlocks,
      headingRisks,
    }
  }, [])

  const handlePrint = useCallback(
    async () => {
      if (typeof window === "undefined" || !resume || isPrinting) return

      setIsPrinting(true)
      setPrintStatus(null)
      let printMediaQuery: MediaQueryList | null = null
      let sawPrintLifecycle = false
      const markPrintLifecycle = () => {
        sawPrintLifecycle = true
      }
      const handleVisibilityChange = () => {
        if (document.visibilityState === "hidden") {
          sawPrintLifecycle = true
        }
      }
      const handlePrintMediaChange = (event: MediaQueryListEvent) => {
        if (event.matches) {
          sawPrintLifecycle = true
        }
      }

      try {
        if (document.fonts?.ready) {
          await document.fonts.ready
        }

        await waitForAnimationFrame()
        await waitForAnimationFrame()

        window.addEventListener("beforeprint", markPrintLifecycle)
        window.addEventListener("afterprint", markPrintLifecycle)
        document.addEventListener("visibilitychange", handleVisibilityChange)

        if (typeof window.matchMedia === "function") {
          printMediaQuery = window.matchMedia("print")
          if (typeof printMediaQuery.addEventListener === "function") {
            printMediaQuery.addEventListener("change", handlePrintMediaChange)
          }
        }

        window.focus()
        window.print()

        void reportQualitySignal(user, {
          category: "print",
          eventType: "resume_print_requested",
          status: "healthy",
          summary: "Print-ready resume opened through the browser print workflow.",
          userId: uid || undefined,
          resumeId: resume.id,
          metadata: {
            mode: "browser_print",
            autoPrint: shouldAutoPrint,
          },
        })

        await new Promise((resolve) => window.setTimeout(resolve, 1500))

        if (!sawPrintLifecycle) {
          void reportQualitySignal(user, {
            category: "print",
            eventType: "print_dialog_not_detected",
            status: "warning",
            summary: "The print dialog did not report a normal lifecycle signal.",
            userId: uid || undefined,
            resumeId: resume.id,
            metadata: {
              mode: "browser_print",
            },
          })
          setPrintStatus("Your browser did not open the print dialog automatically. Use the browser print action and choose Save as PDF.")
        }
      } catch (error) {
        console.error("Mobile print failed:", error)
        void reportQualitySignal(user, {
          category: "print",
          eventType: "resume_print_failed",
          status: "critical",
          summary: "Print-ready resume flow failed before the dialog completed.",
          detail: error instanceof Error ? error.message : "Unknown print failure",
          userId: uid || undefined,
          resumeId: resume.id,
        })
        setPrintStatus("We couldn't generate your PDF right now. Please try again.")
      } finally {
        window.removeEventListener("beforeprint", markPrintLifecycle)
        window.removeEventListener("afterprint", markPrintLifecycle)
        document.removeEventListener("visibilitychange", handleVisibilityChange)
        if (printMediaQuery && typeof printMediaQuery.removeEventListener === "function") {
          printMediaQuery.removeEventListener("change", handlePrintMediaChange)
        }
        setIsPrinting(false)
      }
    },
    [isPrinting, resume, shouldAutoPrint, uid, user]
  )

  useEffect(() => {
    if (typeof window === "undefined" || !resume) return

    let cancelled = false

    const preparePrintSurface = async () => {
      if (document.fonts?.ready) {
        await document.fonts.ready
      }

      await waitForAnimationFrame()
      await waitForAnimationFrame()

      if (cancelled) return

      if (measureRef.current) {
        const scrollW = measureRef.current.scrollWidth
        const pages = Math.max(1, Math.ceil(scrollW / CONTENT_W))
        setPageCount(pages)
        await waitForAnimationFrame()
        await waitForAnimationFrame()
      }

      if (cancelled) return

      setIsPrintReady(true)
      const layoutInspection = inspectPrintLayout()

      void reportQualitySignal(user, {
        category: "print",
        eventType: "print_surface_ready",
        status: "healthy",
        summary: "Print surface finished preparing and is ready for Save as PDF.",
        userId: uid || undefined,
        resumeId: resume.id,
        metadata: {
          autoPrint: shouldAutoPrint,
        },
      })

      if (layoutInspection) {
        if (layoutInspection.status === "warning") {
          setPrintStatus("Page-break guard found a section that may split awkwardly. Review the preview before saving as PDF.")
          void reportQualitySignal(user, {
            category: "print",
            eventType: "print_layout_risk_detected",
            status: "warning",
            summary: "The print layout inspection detected blocks that may break awkwardly across PDF pages.",
            userId: uid || undefined,
            resumeId: resume.id,
            metadata: layoutInspection,
          })
        } else {
          void reportQualitySignal(user, {
            category: "print",
            eventType: "print_layout_verified",
            status: "healthy",
            summary: "The print layout passed page-break inspection before Save as PDF.",
            userId: uid || undefined,
            resumeId: resume.id,
            metadata: layoutInspection,
          })
        }
      }

      if (!shouldAutoPrint || hasTriggeredAutoPrint) return

      setHasTriggeredAutoPrint(true)
      window.setTimeout(() => {
        if (!cancelled) {
          void handlePrint()
        }
      }, 220)
    }

    preparePrintSurface()

    return () => {
      cancelled = true
    }
  }, [handlePrint, hasTriggeredAutoPrint, inspectPrintLayout, resume, shouldAutoPrint, uid, user])

  useEffect(() => {
    if (typeof window === "undefined") return

    const handleAfterPrint = () => {
      if (window.opener && !window.opener.closed) {
        window.close()
      }
    }

    window.addEventListener("afterprint", handleAfterPrint)
    return () => {
      window.removeEventListener("afterprint", handleAfterPrint)
    }
  }, [])

  if (!localResume && (isUserLoading || (isLoading && !resume))) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f4f7fa] px-6 text-primary">
        <div className="flex items-center gap-3 rounded-2xl border border-white/80 bg-white/92 px-5 py-4 shadow-lg">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm font-semibold">Preparing your print-ready resume...</span>
        </div>
      </div>
    )
  }

  if (!resume && !uid) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f4f7fa] px-6">
        <div className="w-full max-w-md rounded-[2rem] border border-white/80 bg-white p-8 text-center shadow-xl">
          <h1 className="text-2xl font-black tracking-tight text-primary">Sign in to print your resume</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Your mobile print page needs an active session before it can load your saved resume.
          </p>
          <Button asChild className="mt-6 rounded-2xl px-5 font-bold">
            <Link href="/login">Go to login</Link>
          </Button>
        </div>
      </div>
    )
  }

  if (!resume) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f4f7fa] px-6">
        <div className="w-full max-w-md rounded-[2rem] border border-white/80 bg-white p-8 text-center shadow-xl">
          <h1 className="text-2xl font-black tracking-tight text-primary">Resume not available</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            We could not load the resume for this print session. Return to the editor and try again.
          </p>
          <Button asChild className="mt-6 rounded-2xl px-5 font-bold">
            <Link href="/cv-editor">Back to editor</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("relative min-h-screen text-primary resume-print-page", pageTone)}>
      <header className="no-print sticky top-0 z-20 border-b border-white/80 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto w-full max-w-5xl px-4 py-3 md:px-6">
          <div className="rounded-[1.4rem] border border-white/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(244,247,250,0.94))] px-4 py-4 shadow-[0_18px_48px_-34px_rgba(15,23,42,0.28)] md:px-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center rounded-full border border-primary/10 bg-primary/5 px-3 py-1 text-[0.62rem] font-black uppercase tracking-[0.22em] text-primary">
                    {templateCategory} preview
                  </span>
                  <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-[0.62rem] font-bold uppercase tracking-[0.18em] text-slate-500">
                    {templateName}
                  </span>
                </div>
                <h1 className="truncate text-[1.15rem] font-black tracking-tight text-primary md:text-[1.35rem]">{resume.name || "Resume"}</h1>
                <p className="text-[0.72rem] leading-relaxed text-muted-foreground">
                  Review the page breaks below, then save or print when the layout looks right.
                </p>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                <Button variant="outline" asChild className="h-11 rounded-full border-2 border-slate-200 bg-white px-4 font-bold shadow-sm hover:-translate-y-0.5 hover:border-slate-300">
                  <Link href="/cv-editor">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Link>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="hidden h-11 rounded-full border-2 border-slate-200 bg-white px-4 font-bold shadow-sm hover:-translate-y-0.5 hover:border-slate-300 md:flex"
                  onClick={() => void handlePrint()}
                  disabled={!isPrintReady || isPrinting}
                >
                  {isPrinting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Printer className="mr-2 h-4 w-4" />}
                  {isPrinting ? "Preparing..." : "Print"}
                </Button>
                <Button
                  type="button"
                  className="h-11 rounded-full bg-gradient-to-r from-slate-950 via-slate-800 to-indigo-700 px-5 font-bold text-white shadow-[0_18px_34px_-22px_rgba(15,23,42,0.55)] hover:-translate-y-0.5 hover:from-slate-900 hover:to-indigo-800"
                  onClick={() => void handlePrint()}
                  disabled={!isPrintReady || isPrinting}
                >
                  {isPrinting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin text-white" />
                  ) : (
                    <Printer className="mr-2 h-4 w-4 text-white" />
                  )}
                  {isPrinting ? "Preparing..." : "Save as PDF"}
                </Button>
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-2 border-t border-slate-100 pt-4">
              <p className="text-[0.62rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                Use your browser&apos;s print dialog and choose Save as PDF for the cleanest page breaks.
              </p>
              {printStatus ? (
                <p className="flex items-center gap-2 text-xs font-bold text-emerald-600">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  {printStatus}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </header>

      {/* Hidden measuring div — same column layout as preview, used to count pages */}
      <div
        ref={measureRef}
        aria-hidden="true"
        className="no-print absolute opacity-0 pointer-events-none"
        style={{
          left: -9999,
          top: 0,
          width: CONTENT_W,
          height: CONTENT_H,
          columnWidth: CONTENT_W,
          columnGap: 40,
          columnFill: "auto" as const,
          overflow: "hidden",
          boxSizing: "border-box" as const,
        }}
      >
        <ResumeTemplate data={resume} isPrint={true} noPadding={true} />
      </div>

      {/* Print pages — each page is an explicit A4 div, same column-slice technique as the editor preview */}
      <main className="resume-print-main">
        <div className="print-pages flex flex-col items-center gap-8 py-8 px-4">
          {Array.from({ length: pageCount }).map((_, i) => (
            <div
              key={i}
              className="print-sheet-scaler shrink-0"
              style={{
                width: PAGE_W * previewScale,
                height: PAGE_H * previewScale,
              }}
            >
              <div
                className="print-sheet bg-white"
                style={{
                  width: PAGE_W,
                  height: PAGE_H,
                  overflow: "hidden",
                  padding: MARGIN_PX,
                  boxSizing: "border-box" as const,
                  boxShadow: "0 20px 60px -12px rgba(0,0,0,0.25), 0 4px 16px -4px rgba(0,0,0,0.15)",
                  borderRadius: 2,
                  transform: previewScale < 1 ? `scale(${previewScale})` : undefined,
                  transformOrigin: "top left",
                }}
              >
                <div style={{ width: "100%", height: "100%", overflow: "hidden" }}>
                  <div
                    style={{
                      width: "100%",
                      height: CONTENT_H,
                      columnWidth: CONTENT_W,
                      columnGap: 40,
                      columnFill: "auto" as const,
                      transform: `translateX(-${i * (CONTENT_W + 40)}px)`,
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
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
