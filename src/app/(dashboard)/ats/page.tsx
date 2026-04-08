"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { addDoc, collection, doc, increment, limit, orderBy, query, serverTimestamp, setDoc, updateDoc } from "firebase/firestore"
import { AlertTriangle, ArrowRight, FileSearch, FileText, History, Loader2, Search, Sparkles, Target, Zap } from "lucide-react"
import { atsOptimizationScoring } from "@/ai/flows/ats-optimization-scoring-flow"

import { useCollection, useDoc, useFirestore, useMemoFirebase, useUser } from "@/firebase"
import type { AtsOptimizationScoringOutput } from "@/ai/flows/ats-optimization-scoring-flow"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/hooks/use-toast"
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
      const result = await atsOptimizationScoring({ cvContent, jobDescription })
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
      <section className="section-shell space-y-3 px-4 py-4 sm:space-y-4 sm:px-5 sm:py-6 md:px-8">
        <div className="eyebrow-chip"><Target className="h-3.5 w-3.5" /> ATS Optimizer</div>
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="min-w-0 space-y-3 xl:flex-1">
            <h1 className="text-[1.65rem] font-black leading-[0.98] tracking-[-0.05em] text-primary sm:text-[2rem] lg:text-5xl">Make ATS feedback clearer, more specific, and easier to act on.</h1>
            <p className="max-w-3xl text-[0.92rem] leading-relaxed text-muted-foreground sm:text-base md:text-lg">Load a saved resume or paste one manually, compare it against a real role, and get matched keywords, missing language, section-level feedback, and practical next steps.</p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="rounded-full px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.2em]">{plan.toUpperCase()} plan</Badge>
              <Badge variant="outline" className="rounded-full border-secondary/20 bg-secondary/5 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-secondary">{remainingChecks} scans remaining</Badge>
              <Badge variant="outline" className="rounded-full border-accent/20 bg-accent/5 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-accent">{reports?.length || 0} saved reports</Badge>
            </div>
          </div>
          <div className="grid w-full gap-2 sm:grid-cols-2 xl:flex xl:w-auto xl:shrink-0">
            <Button variant="outline" className="tap-bounce h-11 rounded-2xl font-bold md:h-12" onClick={() => latestResume && loadResumeIntoWorkspace(latestResume)} disabled={!latestResume}><FileText className="mr-2 h-4 w-4" />{latestResume ? "Use latest" : "No resume"}</Button>
            <Button className="tap-bounce h-11 rounded-2xl font-bold md:h-12" asChild><Link href={builderHref}>Open builder<ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
          </div>
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[1.08fr_0.92fr] xl:gap-6">
        <Card className="border-none bg-white">
          <CardHeader className="space-y-2 p-4 md:p-7">
            <CardTitle className="flex items-center gap-3 text-lg font-black md:text-2xl"><div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-secondary/10 text-secondary md:h-11 md:w-11"><FileSearch className="h-5 w-5" /></div>Scan workspace</CardTitle>
            <CardDescription>Pick a saved resume or paste your own text, then add the exact job description you want to match.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-4 pt-0 md:space-y-6 md:p-7 md:pt-0">
            <div className="grid gap-3 sm:grid-cols-2">
              {resumes?.length ? resumes.map((resume) => (
                <button key={resume.id} type="button" onClick={() => loadResumeIntoWorkspace(resume)} className={cn("tap-bounce rounded-[1.1rem] border bg-[#FAFBFD] p-3 text-left transition-all hover:border-primary/20 hover:bg-white hover:shadow-md md:rounded-[1.3rem] md:p-4", selectedResumeId === resume.id && "border-primary/20 bg-primary/5 shadow-sm")}>
                  <p className="truncate text-sm font-black text-primary">{resume.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{formatDate(resume.updatedAt)}</p>
                </button>
              )) : <div className="rounded-[1.3rem] border border-dashed border-border/80 bg-muted/20 p-4 text-sm text-muted-foreground sm:col-span-2">No saved resumes yet.</div>}
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="space-y-2">
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground">Resume content</p>
                <Textarea value={cvContent} onChange={(event) => setCvContent(event.target.value)} placeholder="Paste the full CV or resume text here..." className="min-h-[220px] rounded-[1.25rem] border-border/80 bg-[#FCFCFE] px-4 py-3 text-sm leading-relaxed shadow-sm md:min-h-[320px] md:rounded-[1.4rem] md:py-4" />
              </div>
              <div className="space-y-2">
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground">Job description</p>
                <Textarea value={jobDescription} onChange={(event) => setJobDescription(event.target.value)} placeholder="Paste the target job description here..." className="min-h-[220px] rounded-[1.25rem] border-border/80 bg-[#FCFCFE] px-4 py-3 text-sm leading-relaxed shadow-sm md:min-h-[320px] md:rounded-[1.4rem] md:py-4" />
              </div>
            </div>

            <div className="flex flex-col gap-3 rounded-[1.25rem] border border-border/70 bg-muted/25 p-4 sm:flex-row sm:items-center sm:justify-between md:rounded-[1.4rem]">
              <div className="space-y-1">
                <p className="text-sm font-black text-primary">What this scan improves</p>
                <p className="text-[0.8rem] text-muted-foreground">Clearer keyword coverage, section diagnosis, and next-step guidance.</p>
              </div>
              <Button className={cn("tap-bounce h-11 rounded-2xl font-bold md:h-12", isRunning && "animate-pulse-subtle")} onClick={runScan} disabled={isRunning}>{isRunning ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}{visibleReport ? "Run fresh scan" : "Run scan"}</Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none bg-white">
          <CardHeader className="space-y-2 p-4 md:p-7">
            <CardTitle className="flex items-center gap-3 text-lg font-black md:text-2xl"><div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-accent/10 text-accent md:h-11 md:w-11"><Sparkles className="h-5 w-5" /></div>{visibleReport ? "ATS diagnosis" : "What you'll see here"}</CardTitle>
            <CardDescription>{visibleReport ? "Your latest ATS diagnosis stays visible here so you can keep iterating without losing context." : "Run a scan to see a sharper verdict, keyword gaps, strengths, and a ranked action list."}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-4 pt-0 md:space-y-5 md:p-7 md:pt-0">
            {visibleReport ? <>
              <div className="rounded-[1.35rem] bg-[#F8FAFF] p-4 md:rounded-[1.6rem] md:p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-2">
                    <p className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-accent">Verdict</p>
                    <h2 className="text-xl font-black tracking-tight text-primary md:text-2xl">{visibleReport.headline || "ATS review complete"}</h2>
                    <p className="text-sm leading-relaxed text-muted-foreground">{visibleReport.matchSummary}</p>
                  </div>
                  <div className="rounded-[1.2rem] border bg-white px-4 py-3 text-center shadow-sm md:rounded-[1.4rem] md:px-5 md:py-4">
                    <p className="text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Match</p>
                    <p className={cn("mt-1 text-[2rem] font-black tracking-tight md:text-4xl", scoreTone(visibleReport.atsScore))}>{Math.round(visibleReport.atsScore || 0)}%</p>
                  </div>
                </div>
                <div className="mt-4 grid gap-2 sm:grid-cols-3 md:gap-3">
                  <div className="rounded-[1.1rem] border bg-white px-4 py-3 shadow-sm"><p className="text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Keyword coverage</p><p className="mt-1 text-xl font-black text-primary">{Math.round(visibleReport.keywordCoverage || 0)}%</p></div>
                  <div className="rounded-[1.1rem] border bg-white px-4 py-3 shadow-sm"><p className="text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Missing keywords</p><p className="mt-1 text-xl font-black text-primary">{visibleReport.missingKeywords?.length || 0}</p></div>
                  <div className="rounded-[1.1rem] border bg-white px-4 py-3 shadow-sm"><p className="text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Saved</p><p className="mt-1 text-xl font-black text-primary">{formatDate(visibleReport.createdAt)}</p></div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {categoryLabels.map(({ key, label }) => <div key={key} className="rounded-[1.3rem] border border-border/70 bg-[#FAFBFD] p-4"><div className="flex items-center justify-between gap-2"><p className="text-sm font-bold text-primary">{label}</p><span className={cn("text-sm font-black", scoreTone(visibleReport.categories?.[key]))}>{Math.round(visibleReport.categories?.[key] || 0)}%</span></div><Progress value={Math.round(visibleReport.categories?.[key] || 0)} className="mt-3 h-2 bg-muted/60" /></div>)}
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-[1.4rem] border border-border/70 bg-[#FAFBFD] p-4"><p className="flex items-center gap-2 text-sm font-black text-primary"><Zap className="h-4 w-4 text-accent" />Fastest improvements</p><div className="mt-3 space-y-3">{visibleReport.quickWins?.length ? visibleReport.quickWins.map((item) => <div key={item} className="flex items-start gap-2 text-sm text-muted-foreground"><span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary/40" /><span>{item}</span></div>) : <p className="text-sm text-muted-foreground">Quick wins will appear here after a scan.</p>}</div></div>
                <div className="rounded-[1.4rem] border border-border/70 bg-[#FAFBFD] p-4"><p className="flex items-center gap-2 text-sm font-black text-primary"><AlertTriangle className="h-4 w-4 text-amber-600" />ATS warnings</p><div className="mt-3 space-y-3">{visibleReport.warnings?.length ? visibleReport.warnings.map((item) => <div key={item} className="flex items-start gap-2 text-sm text-muted-foreground"><span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary/40" /><span>{item}</span></div>) : <p className="text-sm text-muted-foreground">No ATS-format warnings were flagged in this report.</p>}</div></div>
              </div>
            </> : <div className="rounded-[1.5rem] border border-dashed border-border/80 bg-muted/20 p-6 text-sm text-muted-foreground">Run your first ATS scan to see a stronger verdict, keyword coverage, strengths, warnings, and section-by-section improvement advice.</div>}
          </CardContent>
        </Card>
      </div>

      {visibleReport && <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr] xl:gap-6">
        <Card className="border-none bg-white">
          <CardHeader className="space-y-2 p-4 md:p-7"><CardTitle className="text-lg font-black md:text-2xl">Keywords and strengths</CardTitle><CardDescription>Use these to decide what to preserve and what to add before you apply.</CardDescription></CardHeader>
          <CardContent className="space-y-4 p-4 pt-0 md:space-y-5 md:p-7 md:pt-0">
            <div><p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground">Matched keywords</p><div className="mt-3 flex flex-wrap gap-2">{visibleReport.matchedKeywords?.length ? visibleReport.matchedKeywords.map((keyword) => <Badge key={keyword} variant="outline" className="rounded-full border-emerald-200 bg-emerald-500/10 px-3 py-1 text-[0.7rem] font-semibold text-emerald-700">{keyword}</Badge>) : <p className="text-sm text-muted-foreground">Matched keywords will appear here after a scan.</p>}</div></div>
            <div><p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground">Missing keywords</p><div className="mt-3 flex flex-wrap gap-2">{visibleReport.missingKeywords?.length ? visibleReport.missingKeywords.map((keyword) => <Badge key={keyword} variant="outline" className="rounded-full border-amber-200 bg-amber-500/10 px-3 py-1 text-[0.7rem] font-semibold text-amber-700">{keyword}</Badge>) : <p className="text-sm text-muted-foreground">No missing keywords were flagged.</p>}</div></div>
            <div><p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground">What is already helping</p><div className="mt-3 space-y-3">{visibleReport.strengths?.length ? visibleReport.strengths.map((item) => <div key={item} className="flex items-start gap-2 text-sm text-muted-foreground"><span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary/40" /><span>{item}</span></div>) : <p className="text-sm text-muted-foreground">Strengths will appear here after a scan.</p>}</div></div>
          </CardContent>
        </Card>

        <Card className="border-none bg-white">
          <CardHeader className="space-y-2 p-4 md:p-7"><CardTitle className="text-lg font-black md:text-2xl">Section feedback</CardTitle><CardDescription>Fix the weakest sections first for the fastest ATS lift.</CardDescription></CardHeader>
          <CardContent className="space-y-3 p-4 pt-0 md:p-7 md:pt-0">
            {visibleReport.sectionFeedback?.length ? visibleReport.sectionFeedback.map((section) => <div key={section.section} className="rounded-[1.3rem] border border-border/70 bg-[#FAFBFD] p-4"><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-sm font-black text-primary">{section.section}</p><Badge variant="outline" className={cn("rounded-full px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.2em]", section.status === "strong" ? "border-emerald-200 bg-emerald-500/10 text-emerald-700" : section.status === "needs-work" ? "border-amber-200 bg-amber-500/10 text-amber-700" : "border-rose-200 bg-rose-500/10 text-rose-700")}>{section.status.replace("-", " ")}</Badge></div><p className="mt-2 text-sm text-muted-foreground">{section.summary}</p><div className="mt-3 space-y-2">{section.fixes?.map((fix) => <div key={fix} className="flex items-start gap-2 text-sm text-muted-foreground"><span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary/40" /><span>{fix}</span></div>)}</div></div>) : <p className="text-sm text-muted-foreground">Section feedback will appear here after a scan.</p>}
          </CardContent>
        </Card>
      </div>}

      {visibleReport?.recommendations?.length ? <Card className="border-none bg-white">
        <CardHeader className="space-y-2 p-4 md:p-7"><CardTitle className="text-lg font-black md:text-2xl">Priority recommendations</CardTitle><CardDescription>A cleaner checklist for what to change next, in order.</CardDescription></CardHeader>
        <CardContent className="space-y-3 p-4 pt-0 md:p-7 md:pt-0">
          {visibleReport.recommendations.map((item) => <div key={`${item.priority}-${item.title}`} className="rounded-[1.3rem] border border-border/70 bg-[#FAFBFD] p-4"><div className="flex flex-wrap items-center gap-2"><p className="text-sm font-black text-primary">{item.title}</p><Badge variant="outline" className={cn("rounded-full px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.2em]", item.priority === "high" ? "border-rose-200 bg-rose-500/10 text-rose-700" : item.priority === "medium" ? "border-amber-200 bg-amber-500/10 text-amber-700" : "border-sky-200 bg-sky-500/10 text-sky-700")}>{item.priority}</Badge></div><p className="mt-2 text-sm text-muted-foreground">{item.description}</p></div>)}
        </CardContent>
      </Card> : null}

      <Card className="border-none bg-white">
        <CardHeader className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between md:p-7">
          <div className="space-y-1"><CardTitle className="flex items-center gap-3 text-lg font-black md:text-2xl"><History className="h-5 w-5 text-primary" />Recent ATS reports</CardTitle><CardDescription>Reload a saved role analysis and keep working from where you left off.</CardDescription></div>
          <Button variant="outline" className="rounded-2xl font-bold" asChild><Link href={builderHref}>Improve in builder<ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
        </CardHeader>
        <CardContent className="space-y-3 p-4 pt-0 md:p-7 md:pt-0">
          {reports?.length ? reports.map((report) => <button key={report.id} type="button" onClick={() => loadReport(report)} className={cn("w-full rounded-[1.3rem] border bg-[#FAFBFD] p-4 text-left transition-all hover:border-primary/20 hover:bg-white hover:shadow-md", activeReport?.id === report.id && "border-primary/20 bg-primary/5 shadow-sm")}><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div className="min-w-0"><p className="truncate text-sm font-black text-primary">{report.headline || "ATS report"}</p><p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{report.matchSummary || "Saved ATS analysis ready to reopen."}</p></div><div className="shrink-0 text-right"><p className={cn("text-2xl font-black", scoreTone(report.atsScore || report.totalScore || report.score))}>{Math.round(report.atsScore || report.totalScore || report.score || 0)}%</p><p className="mt-1 text-xs uppercase tracking-[0.18em] text-muted-foreground">{formatDate(report.createdAt)}</p></div></div></button>) : <div className="rounded-[1.4rem] border border-dashed border-border/80 bg-muted/20 p-5 text-sm text-muted-foreground">No ATS reports saved yet. Run a scan above and your recent analyses will appear here.</div>}
        </CardContent>
      </Card>
    </div>
  )
}
