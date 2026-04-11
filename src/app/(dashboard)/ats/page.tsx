"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { addDoc, collection, doc, increment, limit, orderBy, query, serverTimestamp, setDoc, updateDoc } from "firebase/firestore"
import { AlertTriangle, ArrowRight, FileSearch, FileText, History, Loader2, Search, Sparkles, Target, Zap } from "lucide-react"

import { useCollection, useDoc, useFirestore, useMemoFirebase, useUser } from "@/firebase"
import type { AtsOptimizationScoringOutput } from "@/ai/flows/ats-optimization-scoring-flow"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/hooks/use-toast"
import { fetchAuthedJson } from "@/lib/client/fetch-json"
import { getPlanLimits } from "@/lib/plans"
import { buildResumePlainText } from "@/lib/resume-to-text"
import { cn } from "@/lib/utils"

type AtsReportDoc = AtsOptimizationScoringOutput & {
  id: string
  score?: number
  source?: "ats-page" | "editor"
  resumeId?: string | null
  resumeName?: string | null
  cvContent?: string
  jobDescription?: string
  createdAt?: { toDate?: () => Date } | Date | null
}

const categoryLabels: Array<{ key: keyof AtsOptimizationScoringOutput["categories"]; label: string }> = [
  { key: "keywordMatch", label: "Keyword match" },
  { key: "completeness", label: "Completeness" },
  { key: "formatting", label: "Formatting" },
  { key: "impact", label: "Impact" },
  { key: "readability", label: "Readability" },
  { key: "contactInfo", label: "Contact info" },
]

const scoreTone = (score?: number) =>
  !score ? "text-muted-foreground" : score >= 85 ? "text-emerald-600" : score >= 70 ? "text-sky-600" : score >= 55 ? "text-amber-600" : "text-rose-600"

const heroActionButtonBase =
  "group h-14 rounded-[1.4rem] px-5 text-[0.92rem] font-black tracking-tight transition-all duration-300"
const atsCardSurfaceBase = "rounded-[1.85rem] border border-slate-100/80 bg-white shadow-[0_18px_44px_-32px_rgba(15,23,42,0.22)]"
const atsSectionCardBase = "rounded-[1.65rem] border border-slate-100 bg-[#FAFBFD]/70 p-6 transition-all duration-300 hover:-translate-y-0.5 hover:bg-white hover:shadow-md"

const formatDate = (value: AtsReportDoc["createdAt"]) => {
  const date = value instanceof Date ? value : value?.toDate?.()
  return date ? date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "Just now"
}

export default function AtsOptimizerPage() {
  const { user, uid, isUserLoading } = useUser()
  const db = useFirestore()
  const [cvContent, setCvContent] = useState("")
  const [jobDescription, setJobDescription] = useState("")
  const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null)
  const [activeReport, setActiveReport] = useState<AtsReportDoc | null>(null)
  const [isRunning, setIsRunning] = useState(false)

  const userDocRef = useMemoFirebase(() => (!db || !uid ? null : doc(db, "users", uid)), [db, uid])
  const { data: profile, isLoading: isProfileLoading } = useDoc(userDocRef)

  const resumesQuery = useMemoFirebase(
    () => (!db || !uid ? null : query(collection(db, "users", uid, "resumes"), orderBy("updatedAt", "desc"), limit(6))),
    [db, uid]
  )
  const { data: resumes, isLoading: isResumesLoading } = useCollection(resumesQuery)

  const reportsQuery = useMemoFirebase(
    () => (!db || !uid ? null : query(collection(db, "users", uid, "atsReports"), orderBy("createdAt", "desc"), limit(8))),
    [db, uid]
  )
  const { data: reports, isLoading: isReportsLoading } = useCollection<AtsReportDoc>(reportsQuery)

  const latestResume = resumes?.[0] || null
  const selectedResume = useMemo(() => resumes?.find((resume) => resume.id === selectedResumeId) || null, [resumes, selectedResumeId])

  useEffect(() => {
    if (!selectedResumeId && latestResume?.id) setSelectedResumeId(latestResume.id)
  }, [latestResume?.id, selectedResumeId])

  useEffect(() => {
    if (!activeReport && reports?.length) setActiveReport(reports[0])
  }, [activeReport, reports])

  const plan = (profile?.plan as "free" | "pro" | "master") || "free"
  const limits = getPlanLimits(plan)
  const usedChecks = profile?.usage?.atsChecks || 0
  const remainingChecks = Math.max(limits.atsChecks - usedChecks, 0)
  const visibleReport = activeReport || reports?.[0] || null
  const builderHref = visibleReport?.resumeId
    ? `/editor?id=${visibleReport.resumeId}`
    : selectedResume?.id
      ? `/editor?id=${selectedResume.id}`
      : latestResume?.id
        ? `/editor?id=${latestResume.id}`
        : "/editor?new=true"

  const loadResumeIntoWorkspace = (resume: any) => {
    setSelectedResumeId(resume.id)
    setCvContent(buildResumePlainText(resume))
    toast({ title: "Resume loaded", description: `${resume.name} is ready in the ATS workspace.` })
  }

  const loadReport = (report: AtsReportDoc) => {
    setActiveReport(report)
    setJobDescription(report.jobDescription || "")
    if (report.cvContent) setCvContent(report.cvContent)
    if (report.resumeId) setSelectedResumeId(report.resumeId)
  }

  const checkLimit = () => {
    if (usedChecks < limits.atsChecks) return true
    toast({
      variant: "destructive",
      title: "ATS scan limit reached",
      description: "Upgrade your plan to keep running role-specific ATS checks.",
      action: <Button variant="outline" size="sm" asChild className="border-2 font-bold"><Link href="/settings">Upgrade</Link></Button>,
    })
    return false
  }

  const runScan = async () => {
    if (!user || !db) return
    if (!cvContent.trim()) return toast({ variant: "destructive", title: "Resume content needed", description: "Paste a CV or load a saved resume first." })
    if (!jobDescription.trim()) return toast({ variant: "destructive", title: "Job description needed", description: "Paste the target role description first." })
    if (!checkLimit()) return

    setIsRunning(true)
    try {
      const { result } = await fetchAuthedJson<{ result: AtsOptimizationScoringOutput }>(user, "/api/ats/scan", {
        method: "POST",
        body: JSON.stringify({ cvContent, jobDescription }),
      })
      const payload = {
        ...result,
        score: result.atsScore,
        source: "ats-page" as const,
        resumeId: selectedResume?.id || null,
        resumeName: selectedResume?.name || "Manual CV scan",
        cvContent,
        jobDescription,
        createdAt: serverTimestamp(),
      }
      const reportRef = await addDoc(collection(db, "users", user.uid, "atsReports"), payload)
      setActiveReport({ id: reportRef.id, ...result, score: result.atsScore, source: "ats-page", resumeId: selectedResume?.id || null, resumeName: selectedResume?.name || "Manual CV scan", cvContent, jobDescription, createdAt: new Date() })

      if (userDocRef) {
        try {
          await updateDoc(userDocRef, { "usage.atsChecks": increment(1), updatedAt: serverTimestamp() })
        } catch (usageError) {
          console.warn("ATS usage update failed, seeding fallback profile doc:", usageError)
          await setDoc(
            userDocRef,
            {
              id: user.uid,
              email: user.email || "",
              firstName: profile?.firstName || "",
              lastName: profile?.lastName || "",
              photoURL: user.photoURL || profile?.photoURL || "",
              verified: user.emailVerified || false,
              suspended: profile?.suspended || false,
              onboardingComplete: profile?.onboardingComplete || false,
              plan,
              usage: {
                aiGenerations: profile?.usage?.aiGenerations || 0,
                atsChecks: increment(1),
              },
              createdAt: profile?.createdAt || serverTimestamp(),
              updatedAt: serverTimestamp(),
            },
            { merge: true }
          )
        }
      }

      toast({ title: "ATS report ready", description: `${result.atsScore}% match with richer keyword and section feedback.` })
    } catch (error) {
      console.error("ATS scan failed:", error)
      toast({ variant: "destructive", title: "ATS scan failed", description: "We couldn't complete the ATS analysis. Please try again." })
    } finally {
      setIsRunning(false)
    }
  }

  if (isUserLoading || isProfileLoading || isResumesLoading || isReportsLoading) {
    return <div className="flex h-[80vh] items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary/30" /></div>
  }

  return (
    <div className="mobile-app-page md:mx-auto md:max-w-7xl md:space-y-8 md:px-8 md:pb-16 md:pt-8">
      <section className="section-shell relative overflow-hidden p-6 sm:p-8 md:p-10 mb-8 border-none">
        {/* Subtle background glow */}
        <div className="absolute -top-24 -right-24 h-96 w-96 bg-blue-500/10 blur-[100px] pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 h-96 w-96 bg-purple-500/10 blur-[100px] pointer-events-none" />

        <div className="relative z-10 space-y-4">
          <div className="flex flex-col gap-8 xl:flex-row xl:items-end xl:justify-between">
            <div className="min-w-0 space-y-4 xl:flex-1">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-[0.95] tracking-tighter headline-gradient-vivid max-w-4xl">
                Make ATS feedback clearer, more specific, and easier to act on.
              </h1>
              <p className="max-w-2xl text-base sm:text-lg md:text-xl font-medium leading-relaxed text-slate-500/90">
                Load a saved resume or paste one manually, compare it against a real role, and get matched keywords, missing language, and actionable next steps.
              </p>
              
              <div className="flex flex-wrap gap-2 pt-2">
                <div className="flex items-center gap-2 rounded-xl bg-white/80 border border-slate-100 px-4 py-2 shadow-sm">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Plan:</span>
                  <span className="text-[11px] font-black uppercase text-blue-600 tracking-wider bg-blue-50 px-2 py-0.5 rounded-md">{plan}</span>
                </div>
                <div className="flex items-center gap-2 rounded-xl bg-white/80 border border-slate-100 px-4 py-2 shadow-sm">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Allowance:</span>
                  <span className="text-[11px] font-black uppercase text-secondary tracking-wider bg-sky-50 px-2 py-0.5 rounded-md">{remainingChecks} Scans left</span>
                </div>
                <div className="flex items-center gap-2 rounded-xl bg-white/80 border border-slate-100 px-4 py-2 shadow-sm">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Reports:</span>
                  <span className="text-[11px] font-black uppercase text-amber-600 tracking-wider bg-amber-50 px-2 py-0.5 rounded-md">{reports?.length || 0} Saved</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 xl:shrink-0">
              <Button 
                variant="outline" 
                className={cn(
                  heroActionButtonBase,
                  "tap-bounce border-2 border-slate-100 bg-white px-8 text-slate-900 shadow-[0_18px_44px_-30px_rgba(15,23,42,0.3)] hover:-translate-y-0.5 hover:border-slate-200 hover:bg-white hover:shadow-[0_24px_56px_-34px_rgba(15,23,42,0.34)]"
                )} 
                onClick={() => latestResume && loadResumeIntoWorkspace(latestResume)} 
                disabled={!latestResume}
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 ring-1 ring-slate-200/80 transition-transform duration-300 group-hover:scale-110">
                  <FileText className="h-4.5 w-4.5" />
                </span>
                <span className="flex flex-col items-start leading-none">
                  <span>{latestResume ? "Use latest" : "No resume"}</span>
                  <span className="mt-1 text-[0.62rem] font-bold uppercase tracking-[0.16em] text-slate-400">
                    Load workspace CV
                  </span>
                </span>
              </Button>
              <Button 
                className={cn(
                  heroActionButtonBase,
                  "tap-bounce btn-premium border-none px-8 text-white shadow-xl shadow-blue-500/20 hover:-translate-y-0.5 hover:shadow-[0_26px_60px_-30px_rgba(37,99,235,0.35)]"
                )} 
                asChild
              >
                <Link href={builderHref}>
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/20 transition-transform duration-300 group-hover:scale-110">
                    <ArrowRight className="h-4.5 w-4.5" />
                  </span>
                  <span className="flex flex-col items-start leading-none">
                    <span>Open builder</span>
                    <span className="mt-1 text-[0.62rem] font-bold uppercase tracking-[0.16em] text-white/70">
                      Jump to editor
                    </span>
                  </span>
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[1.08fr_0.92fr] xl:gap-6">
        <Card className={atsCardSurfaceBase}>
          <CardHeader className="space-y-2 p-6 md:p-10 pb-4">
            <CardTitle className="flex items-center gap-4 text-xl font-black md:text-3xl tracking-tight">
              <div className="flex h-12 w-12 items-center justify-center rounded-[1.25rem] bg-indigo-50 text-indigo-600 shadow-sm border border-indigo-100/50">
                <FileSearch className="h-6 w-6" />
              </div>
              Scan workspace
            </CardTitle>
            <CardDescription className="text-slate-500 font-medium">Pick a saved resume or paste your own text, then add the exact job description you want to match.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 p-6 md:p-10 pt-0">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {resumes?.length ? resumes.map((resume) => (
                <button 
                  key={resume.id} 
                  type="button" 
                  onClick={() => loadResumeIntoWorkspace(resume)} 
                  className={cn(
                    "tap-bounce group relative rounded-[1.35rem] border p-4 text-left transition-all duration-300",
                    selectedResumeId === resume.id 
                      ? "border-indigo-500/30 bg-gradient-to-br from-indigo-50/80 to-white shadow-inner ring-1 ring-indigo-500/20" 
                      : "border-slate-100 bg-slate-50/50 hover:-translate-y-0.5 hover:bg-white hover:border-slate-200 hover:shadow-lg"
                  )}
                >
                  <p className="truncate text-[0.66rem] font-black uppercase tracking-[0.18em] text-slate-400 group-hover:text-indigo-400 transition-colors">Saved Resume</p>
                  <p className={cn("mt-1 truncate text-sm font-black", selectedResumeId === resume.id ? "text-indigo-700" : "text-slate-700")}>{resume.name}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <p className="text-[10px] font-bold text-slate-400">{formatDate(resume.updatedAt)}</p>
                    {selectedResumeId === resume.id && <div className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse" />}
                  </div>
                </button>
              )) : <div className="rounded-[1.3rem] border border-dashed border-slate-200 bg-slate-50/50 p-6 text-sm text-center font-medium text-slate-400 sm:col-span-2 lg:col-span-3 italic">No saved resumes found.</div>}
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Resume content</p>
                  {cvContent.length > 0 && <span className="text-[10px] font-bold text-slate-300">{cvContent.split(/\s+/).length} words</span>}
                </div>
                <Textarea 
                  value={cvContent} 
                  onChange={(event) => setCvContent(event.target.value)} 
                  placeholder="Paste your CV text here..." 
                  className="min-h-[260px] md:min-h-[380px] rounded-[1.5rem] border-slate-100 bg-[#FAFBFD] px-5 py-4 text-sm leading-relaxed shadow-sm focus:bg-white focus:ring-indigo-500/20 transition-all placeholder:text-slate-300" 
                />
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Job description</p>
                  {jobDescription.length > 0 && <span className="text-[10px] font-bold text-slate-300">{jobDescription.split(/\s+/).length} words</span>}
                </div>
                <Textarea 
                  value={jobDescription} 
                  onChange={(event) => setJobDescription(event.target.value)} 
                  placeholder="Paste the target job description here..." 
                  className="min-h-[260px] md:min-h-[380px] rounded-[1.5rem] border-slate-100 bg-[#FAFBFD] px-5 py-4 text-sm leading-relaxed shadow-sm focus:bg-white focus:ring-indigo-500/20 transition-all placeholder:text-slate-300" 
                />
              </div>
            </div>

            <div className="relative group overflow-hidden rounded-[1.75rem] border border-slate-100 bg-white p-6 md:p-8 shadow-sm">
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                <Search className="w-24 h-24 text-slate-900" />
              </div>
              <div className="relative z-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-2">
                  <p className="text-lg font-black tracking-tight text-slate-900">Configure Analysis Depth</p>
                  <p className="text-sm font-medium text-slate-500 max-w-md leading-relaxed">Runs a full diagnostic on role requirements, keyword density, and structural integrity.</p>
                </div>
                  <Button 
                    className={cn(
                      heroActionButtonBase,
                      "tap-bounce px-10 text-xs md:text-sm uppercase tracking-widest shadow-xl transition-all",
                      isRunning 
                        ? "bg-slate-100 text-slate-400" 
                        : "bg-slate-900 text-white hover:bg-slate-800 hover:-translate-y-0.5 shadow-slate-200"
                    )} 
                    onClick={runScan} 
                    disabled={isRunning}
                  >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/15">
                    {isRunning ? <Loader2 className="h-4.5 w-4.5 animate-spin" /> : <Search className="h-4.5 w-4.5" />}
                  </span>
                  <span className="flex flex-col items-start leading-none">
                    <span>{visibleReport ? "Refresh Diagnostic" : "Initialize Scan"}</span>
                    <span className="mt-1 text-[0.62rem] font-bold uppercase tracking-[0.16em] text-white/70">
                      ATS role check
                    </span>
                  </span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={atsCardSurfaceBase}>
          <CardHeader className="space-y-4 p-6 md:p-10 pb-0">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-4 text-xl font-black md:text-3xl tracking-tight">
                <div className="flex h-12 w-12 items-center justify-center rounded-[1.25rem] bg-amber-50 text-amber-600 shadow-sm border border-amber-100/50">
                  <Sparkles className="h-6 w-6" />
                </div>
                {visibleReport ? "ATS diagnosis" : "What you'll see here"}
              </CardTitle>
              {visibleReport && (
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <History className="w-3 h-3" />
                  {formatDate(visibleReport.createdAt)}
                </div>
              )}
            </div>
            <CardDescription className="text-slate-500 font-medium">
              {visibleReport ? "Your active report remains locked for comparison while you iterate." : "Run a scan to see a sharper verdict, keyword gaps, strengths, and a ranked action list."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8 p-6 md:p-10">
            {visibleReport ? <>
              {/* Verdict Hero Score */}
              <div className="relative overflow-hidden rounded-[2.5rem] bg-slate-900 p-8 md:p-12 text-white shadow-2xl">
                <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
                  <Target className="w-48 h-48 rotate-12" />
                </div>
                <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 md:gap-12 text-center md:text-left">
                  <div className="shrink-0 relative">
                    <div className="h-32 w-32 md:h-40 md:w-40 rounded-full border-4 border-white/20 flex items-center justify-center relative">
                      <div className="text-4xl md:text-5xl font-black">{Math.round(visibleReport.atsScore || 0)}%</div>
                      <div className="absolute -bottom-2 px-3 py-1 rounded-full bg-white text-slate-900 text-[10px] font-black uppercase tracking-widest shadow-lg">Match</div>
                    </div>
                    {/* Tiny decorative arcs */}
                    <svg className="absolute -inset-2 w-[calc(100%+16px)] h-[calc(100%+16px)] rotate-[-90deg]">
                       <circle cx="50%" cy="50%" r="48%" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray={`${visibleReport.atsScore}, 100`} pathLength="100" className="text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.5)]" />
                    </svg>
                  </div>
                  <div className="space-y-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400">Analysis Verdict</p>
                    <h2 className="text-2xl md:text-4xl font-black tracking-tighter leading-none">{visibleReport.headline || "ATS review complete"}</h2>
                    <p className="text-sm md:text-base text-slate-300 font-medium leading-relaxed max-w-xl">{visibleReport.matchSummary}</p>
                  </div>
                </div>
              </div>

              {/* Stats Bar */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400 mb-1">Keyword Coverage</p>
                  <div className="flex items-end gap-2">
                    <span className="text-3xl font-black text-slate-900">{Math.round(visibleReport.keywordCoverage || 0)}%</span>
                    <div className="mb-1.5 h-1.5 w-12 rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full bg-blue-500" style={{ width: `${visibleReport.keywordCoverage}%` }} />
                    </div>
                  </div>
                </div>
                <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400 mb-1">Gaps Identified</p>
                  <div className="text-3xl font-black text-slate-900">{visibleReport.missingKeywords?.length || 0}</div>
                </div>
                <div className="col-span-2 md:col-span-1 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400 mb-1">Formatting Check</p>
                  <p className="text-sm font-black text-indigo-600 uppercase tracking-widest">Optimized</p>
                </div>
              </div>

              {/* Category Breakdown */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Score Breakdown</p>
                </div>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {categoryLabels.map(({ key, label }) => (
                    <div key={key} className="group rounded-3xl border border-slate-100 bg-white p-5 transition-all hover:shadow-md hover:border-indigo-100/50">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-xs font-black text-slate-900 uppercase tracking-wider">{label}</p>
                        <span className={cn("text-sm font-black", scoreTone(visibleReport.categories?.[key]))}>
                          {Math.round(visibleReport.categories?.[key] || 0)}%
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-slate-50 overflow-hidden">
                        <div 
                          className={cn("h-full transition-all duration-1000", (visibleReport.categories?.[key] || 0) >= 80 ? "bg-emerald-500" : (visibleReport.categories?.[key] || 0) >= 60 ? "bg-blue-500" : "bg-amber-500")} 
                          style={{ width: `${visibleReport.categories?.[key] || 0}%` }} 
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Wins vs Warnings */}
              <div className="grid gap-6 md:grid-cols-2">
                <div className="rounded-[2rem] border border-blue-50 bg-blue-50/30 p-8 space-y-4">
                  <p className="flex items-center gap-3 text-sm font-black uppercase tracking-widest text-blue-700">
                    <Zap className="h-4 w-4 fill-current" />
                    Strategic Wins
                  </p>
                  <div className="space-y-4">
                    {visibleReport.quickWins?.length ? visibleReport.quickWins.map((item) => (
                      <div key={item} className="flex items-start gap-4">
                        <div className="mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600 text-[10px] font-bold">✓</div>
                        <p className="text-sm font-medium text-slate-600 leading-relaxed">{item}</p>
                      </div>
                    )) : <p className="text-sm text-slate-400 italic">No strategic wins identified yet.</p>}
                  </div>
                </div>
                <div className="rounded-[2rem] border border-amber-50 bg-amber-50/30 p-8 space-y-4">
                  <p className="flex items-center gap-3 text-sm font-black uppercase tracking-widest text-amber-700">
                    <AlertTriangle className="h-4 w-4 fill-current" />
                    Critical Warnings
                  </p>
                  <div className="space-y-4">
                    {visibleReport.warnings?.length ? visibleReport.warnings.map((item) => (
                      <div key={item} className="flex items-start gap-4">
                        <div className="mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600 text-[10px] font-bold">!</div>
                        <p className="text-sm font-medium text-slate-600 leading-relaxed">{item}</p>
                      </div>
                    )) : <p className="text-sm text-slate-400 italic">No formatting or compatibility warnings detected.</p>}
                  </div>
                </div>
              </div>
            </> : (
              <div className="rounded-[2.5rem] border-2 border-dashed border-slate-100 bg-slate-50/50 p-12 md:p-20 text-center space-y-4">
                <div className="mx-auto w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-sm text-slate-300">
                   <Target className="w-8 h-8" />
                </div>
                <div className="space-y-2 max-w-sm mx-auto">
                  <h3 className="text-lg font-black text-slate-900">Awaiting Search Initialisation</h3>
                  <p className="text-sm font-medium text-slate-400">Run your first ATS diagnostic to see keyword mapping, structural strengths, and ranked action feedback.</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {visibleReport && <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr] xl:gap-6 mt-8">
        <Card className={atsCardSurfaceBase}>
          <CardHeader className="space-y-2 p-6 md:p-10 pb-4">
            <CardTitle className="text-xl font-black md:text-3xl tracking-tight">Keywords and strengths</CardTitle>
            <CardDescription className="text-slate-500 font-medium">Use these to decide what to preserve and what to add before you apply.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8 p-6 md:p-10 pt-0">
            <div className="space-y-4">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Matched keywords</p>
              <div className="flex flex-wrap gap-2">
                {visibleReport.matchedKeywords?.length ? visibleReport.matchedKeywords.map((keyword) => (
                  <Badge key={keyword} variant="outline" className="rounded-xl border-emerald-100 bg-emerald-50 px-3 py-1.5 text-[11px] font-black text-emerald-700 shadow-sm">
                    {keyword}
                  </Badge>
                )) : <p className="text-sm text-slate-400 italic">No exact keyword matches found.</p>}
              </div>
            </div>
            <div className="space-y-4">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Missing keywords</p>
              <div className="flex flex-wrap gap-2">
                {visibleReport.missingKeywords?.length ? visibleReport.missingKeywords.map((keyword) => (
                  <Badge key={keyword} variant="outline" className="rounded-xl border-amber-100 bg-amber-50 px-3 py-1.5 text-[11px] font-black text-amber-700 shadow-sm">
                    {keyword}
                  </Badge>
                )) : <p className="text-sm text-slate-400 italic">No missing keywords flagged.</p>}
              </div>
            </div>
            <div className="space-y-4 pt-4 border-t border-slate-50">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Core Strengths</p>
              <div className="space-y-3">
                {visibleReport.strengths?.length ? visibleReport.strengths.map((item) => (
                  <div key={item} className="flex items-start gap-4">
                    <div className="mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-500 text-[10px] font-bold">★</div>
                    <p className="text-sm font-medium text-slate-600 leading-relaxed">{item}</p>
                  </div>
                )) : <p className="text-sm text-slate-400 italic">Strengths will appear here after a scan.</p>}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={atsCardSurfaceBase}>
          <CardHeader className="space-y-2 p-6 md:p-10 pb-4">
            <CardTitle className="text-xl font-black md:text-3xl tracking-tight">Section feedback</CardTitle>
            <CardDescription className="text-slate-500 font-medium">Fix the weakest sections first for the fastest ATS lift.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-6 md:p-10 pt-0">
            {visibleReport.sectionFeedback?.length ? visibleReport.sectionFeedback.map((section) => (
                <div key={section.section} className={atsSectionCardBase}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{section.section}</p>
                  <Badge 
                    variant="outline" 
                    className={cn(
                      "rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-widest border shadow-sm",
                      section.status === "strong" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : section.status === "needs-work" ? "border-amber-200 bg-amber-50 text-amber-700" : "border-rose-200 bg-rose-50 text-rose-700"
                    )}
                  >
                    {section.status.replace("-", " ")}
                  </Badge>
                </div>
                <p className="text-sm font-medium text-slate-500 leading-relaxed">{section.summary}</p>
                {section.fixes?.length ? (
                  <div className="space-y-2 pt-2">
                    {section.fixes.map((fix) => (
                      <div key={fix} className="flex items-start gap-3">
                        <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-slate-300" />
                        <p className="text-xs font-medium text-slate-600 leading-relaxed">{fix}</p>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            )) : <p className="text-sm text-slate-400 italic">Section analysis ready to generate.</p>}
          </CardContent>
        </Card>
      </div>}

      {visibleReport?.recommendations?.length ? <Card className={cn(atsCardSurfaceBase, "mt-8")}>
        <CardHeader className="space-y-2 p-6 md:p-10 pb-4">
          <CardTitle className="text-xl font-black md:text-3xl tracking-tight text-gradient from-slate-900 to-slate-600">Priority recommendations</CardTitle>
          <CardDescription className="text-slate-500 font-medium">A cleaner checklist for what to change next, in order.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 p-6 md:p-10 pt-0 sm:grid-cols-2">
          {visibleReport.recommendations.map((item) => (
            <div key={`${item.priority}-${item.title}`} className={cn(atsSectionCardBase, "flex flex-col justify-between")}>
              <div className="space-y-3">
                <div className="flex items-center gap-3 mb-1">
                  <Badge 
                    className={cn(
                      "rounded-full px-2.5 py-1 text-[8px] font-black uppercase tracking-widest",
                      item.priority === "high" ? "bg-rose-500 text-white" : item.priority === "medium" ? "bg-amber-500 text-white" : "bg-blue-500 text-white"
                    )}
                  >
                    {item.priority}
                  </Badge>
                  <p className="text-sm font-black text-slate-900 leading-tight">{item.title}</p>
                </div>
                <p className="text-xs font-medium text-slate-500 leading-relaxed">{item.description}</p>
                <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-[0.62rem] font-black uppercase tracking-[0.14em] text-slate-500 ring-1 ring-slate-100">
                  Prioritize next
                  <ArrowRight className="h-3.5 w-3.5" />
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card> : null}

      <Card className={cn(atsCardSurfaceBase, "mt-8")}>
        <CardHeader className="flex flex-col gap-6 p-6 md:flex-row md:items-center md:justify-between md:p-10">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-4 text-xl font-black md:text-3xl tracking-tight">
              <div className="flex h-12 w-12 items-center justify-center rounded-[1.25rem] bg-slate-50 text-slate-900 shadow-sm border border-slate-100/50">
                <History className="h-6 w-6" />
              </div>
              Recent ATS reports
            </CardTitle>
            <CardDescription className="text-slate-500 font-medium font-medium">Revisit past scans and track your improvement over time.</CardDescription>
          </div>
          <Button variant="outline" className={cn(heroActionButtonBase, "tap-bounce border-2 border-slate-100 bg-white px-6 text-slate-900 shadow-[0_18px_42px_-30px_rgba(15,23,42,0.28)] hover:-translate-y-0.5 hover:border-slate-200") } asChild>
            <Link href={builderHref}>
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600 ring-1 ring-slate-200/80">
                <ArrowRight className="h-4 w-4" />
              </span>
              <span className="flex flex-col items-start leading-none">
                <span>Improve in builder</span>
                <span className="mt-1 text-[0.62rem] font-bold uppercase tracking-[0.16em] text-slate-400">
                  Open the editor
                </span>
              </span>
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="space-y-4 p-6 md:p-10 pt-0">
          {reports?.length ? reports.map((report) => (
            <button 
              key={report.id} 
              type="button" 
              onClick={() => loadReport(report)} 
              className={cn(
                "w-full rounded-[2rem] border p-6 text-left transition-all duration-300",
                activeReport?.id === report.id 
                  ? "border-indigo-500/30 bg-gradient-to-br from-indigo-50/40 to-white shadow-inner" 
                  : "border-slate-50 bg-[#FAFBFD]/50 hover:-translate-y-0.5 hover:bg-white hover:border-slate-200 hover:shadow-md"
              )}
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 flex items-center gap-4">
                  <div className={cn("h-12 w-12 shrink-0 rounded-2xl flex items-center justify-center text-lg font-black", scoreTone(report.atsScore || report.totalScore || report.score))}>
                    {Math.round(report.atsScore || report.totalScore || report.score || 0)}%
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-slate-900 uppercase tracking-tight">{report.headline || "Unheaded Report"}</p>
                    <p className="mt-1 truncate text-xs font-bold text-slate-400 tracking-wider">
                      {formatDate(report.createdAt)} • {report.resumeName || "Manual Input"}
                    </p>
                  </div>
                </div>
                <div className="hidden sm:inline-flex shrink-0 items-center gap-2 rounded-full bg-white px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400 ring-1 ring-slate-100 transition-colors group-hover:text-indigo-500">
                  <span className="h-2 w-2 rounded-full bg-indigo-500/60" />
                  Reopen Report
                </div>
              </div>
            </button>
          )) : <div className="rounded-[2rem] border-2 border-dashed border-slate-100 bg-slate-50/50 p-10 text-sm italic text-center font-medium text-slate-400">No diagnostic history available.</div>}
        </CardContent>
      </Card>
    </div>
  )
}
