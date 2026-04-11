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

function waitForAnimationFrame() {
  return new Promise((resolve) => window.requestAnimationFrame(() => resolve(null)))
}

async function reportQualitySignal(payload: Record<string, unknown>) {
  try {
    await fetch("/api/quality/report", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      keepalive: true,
    })
  } catch (error) {
    console.warn("Failed to report print quality signal:", error)
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
  const { uid, isUserLoading } = useUser()
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

    const surface = resumeSurfaceRef.current
    if (!surface) return null

    const printableHeightPx = ((297 - 24) * 96) / 25.4
    const surfaceRect = surface.getBoundingClientRect()
    const surfaceHeight = Math.max(surface.scrollHeight, surfaceRect.height)
    const blocks = Array.from(
      surface.querySelectorAll<HTMLElement>(".resume-header, .resume-section-heading, .resume-entry, .resume-manual-break")
    )

    let manualBreaks = 0
    let crossingBlocks = 0
    let headingRisks = 0
    const oversizedBlockThreshold = printableHeightPx * 0.62

    for (const block of blocks) {
      if (block.classList.contains("resume-manual-break")) {
        manualBreaks += 1
        continue
      }

      const rect = block.getBoundingClientRect()
      const top = rect.top - surfaceRect.top
      const bottom = rect.bottom - surfaceRect.top
      if (rect.height <= 0 || bottom <= 0) continue

      const startPage = Math.floor(top / printableHeightPx)
      const endPage = Math.floor(Math.max(top, bottom - 1) / printableHeightPx)
      if (endPage > startPage && rect.height >= oversizedBlockThreshold) {
        crossingBlocks += 1
      }

      if (block.classList.contains("resume-section-heading")) {
        const distanceToPageBottom = (startPage + 1) * printableHeightPx - top
        if (distanceToPageBottom < 56) {
          headingRisks += 1
        }
      }
    }

    return {
      status: crossingBlocks > 0 || headingRisks > 0 ? "warning" : "healthy",
      pageCount: Math.max(1, Math.ceil(surfaceHeight / printableHeightPx)),
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

        void reportQualitySignal({
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
          void reportQualitySignal({
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
        void reportQualitySignal({
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
    [isPrinting, resume, shouldAutoPrint, uid]
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

      setIsPrintReady(true)
      const layoutInspection = inspectPrintLayout()

      void reportQualitySignal({
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
          void reportQualitySignal({
            category: "print",
            eventType: "print_layout_risk_detected",
            status: "warning",
            summary: "The print layout inspection detected blocks that may break awkwardly across PDF pages.",
            userId: uid || undefined,
            resumeId: resume.id,
            metadata: layoutInspection,
          })
        } else {
          void reportQualitySignal({
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
  }, [handlePrint, hasTriggeredAutoPrint, inspectPrintLayout, resume, shouldAutoPrint, uid])

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
            <Link href="/editor">Back to editor</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("relative min-h-screen text-primary", pageTone)}>
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
                  <Link href="/editor">
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

      <main className="mx-auto w-full max-w-5xl px-3 py-4 md:px-6 md:py-8">
        <div ref={resumeSurfaceRef} className="mx-auto w-full max-w-[210mm]">
          <ResumeTemplate data={resume} isPrint={true} className="resume-paper-shadow" />
        </div>
      </main>
    </div>
  )
}
