"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { collection, doc, limit, orderBy, query } from "firebase/firestore"
import {
  ArrowRight,
  ArrowUpRight,
  Briefcase,
  CheckCircle2,
  Clock3,
  ExternalLink,
  FileText,
  Gauge,
  History,
  Layers3,
  Lightbulb,
  Loader2,
  MapPin,
  Rocket,
  Search,
  Sparkles,
  Target,
  TrendingUp,
  Upload,
  Zap,
  type LucideIcon,
} from "lucide-react"

import { useCollection, useDoc, useFirestore, useMemoFirebase, useUser } from "@/firebase"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"
import { getSafeJobSource, JOB_SOURCE_CONFIG, JOB_STATUS_CONFIG, type JobTrackingStatus } from "@/lib/jobs/model"
import { getTemplateConfig } from "@/lib/templates-config"
import { PLAN_LIMITS, type PlanType } from "@/lib/product-rules"

type ResumeRecord = { id: string; name: string; templateId?: string; updatedAt?: { toDate?: () => Date } }
type AtsReportRecord = {
  id: string
  headline?: string
  matchSummary?: string
  totalScore?: number
  atsScore?: number
  score?: number
  keywordCoverage?: number
  missingKeywords?: string[]
  quickWins?: string[]
  recommendations?: Array<{ title: string; description: string; priority: "high" | "medium" | "low" }>
  createdAt?: { toDate?: () => Date } | Date | null
}
type DashboardJob = {
  id: string
  company: string
  role: string
  location?: string
  source?: string
  sourceUrl?: string
  status?: JobTrackingStatus
  resumeName?: string
  updatedAt?: { toDate?: () => Date }
}
type InsightView = "command" | "pipeline" | "ats"
type ActionCard = { title: string; description: string; href: string; cta: string; icon: LucideIcon }

const scoreTone = (score: number) => (score >= 85 ? "text-emerald-600" : score >= 70 ? "text-sky-600" : score >= 55 ? "text-amber-600" : "text-rose-600")
const formatDate = (value?: { toDate?: () => Date } | Date | null) => {
  const date = value instanceof Date ? value : value?.toDate?.()
  return date ? date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "Just now"
}
const formatTime = (value?: { toDate?: () => Date }) => (value?.toDate ? value.toDate().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Recently")

export default function DashboardPage() {
  const { uid } = useUser()
  const db = useFirestore()
  const isMobile = useIsMobile()
  const [insightView, setInsightView] = useState<InsightView>("command")
  const [pipelineFilter, setPipelineFilter] = useState<"all" | JobTrackingStatus>("all")

  const userDocRef = useMemoFirebase(() => (!db || !uid ? null : doc(db, "users", uid)), [db, uid])
  const { data: profile, isLoading: isProfileLoading } = useDoc(userDocRef)

  const resumesQuery = useMemoFirebase(() => (!db || !uid ? null : query(collection(db, "users", uid, "resumes"), orderBy("updatedAt", "desc"), limit(3))), [db, uid])
  const { data: resumes, isLoading: isResumesLoading } = useCollection<ResumeRecord>(resumesQuery)

  const atsReportsQuery = useMemoFirebase(() => (!db || !uid ? null : query(collection(db, "users", uid, "atsReports"), orderBy("createdAt", "desc"), limit(4))), [db, uid])
  const { data: atsReports, isLoading: isReportsLoading } = useCollection<AtsReportRecord>(atsReportsQuery)

  const recentJobsQuery = useMemoFirebase(() => (!db || !uid ? null : query(collection(db, "users", uid, "jobApplications"), orderBy("updatedAt", "desc"), limit(6))), [db, uid])
  const { data: recentJobs, isLoading: isJobsLoading } = useCollection<DashboardJob>(recentJobsQuery)

  const allJobsQuery = useMemoFirebase(() => (!db || !uid ? null : collection(db, "users", uid, "jobApplications")), [db, uid])
  const { data: allJobs } = useCollection<DashboardJob>(allJobsQuery)

  if (isProfileLoading || isResumesLoading || isReportsLoading || isJobsLoading) {
    return <div className="flex h-[80vh] items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary/20" /></div>
  }

  const latestResume = resumes?.[0] || null
  const latestReport = atsReports?.[0] || null
  const jobs = allJobs || []
  const latestScore = Math.round(latestReport?.atsScore || latestReport?.totalScore || latestReport?.score || 0)
  const keywordCoverage = Math.round(latestReport?.keywordCoverage || 0)
  const savedCount = jobs.filter((job) => job.status === "saved").length
  const startedCount = jobs.filter((job) => job.status === "started").length
  const appliedCount = jobs.filter((job) => job.status === "applied").length
  const interviewingCount = jobs.filter((job) => job.status === "interviewing").length
  const offerCount = jobs.filter((job) => job.status === "offer").length
  const activePipelineCount = jobs.filter((job) => ["started", "applied", "interviewing", "offer"].includes(job.status || "")).length
  const readinessScore = Math.max(0, Math.min(100, Math.round((latestResume ? 28 : 0) + (latestReport ? latestScore * 0.42 : 0) + (activePipelineCount > 0 ? 18 : savedCount > 0 ? 10 : 0) + (startedCount === 0 ? 12 : 4))))

  const checklist = [
    { label: "Resume in workspace", done: Boolean(latestResume), href: latestResume ? "/editor" : "/onboarding" },
    { label: "Recent ATS benchmark", done: Boolean(latestReport), href: "/ats" },
    { label: "Active pipeline running", done: activePipelineCount > 0, href: activePipelineCount > 0 ? "/tracker" : "/jobs" },
    { label: "Started applies cleared", done: startedCount === 0, href: "/tracker" },
  ]

  const primaryAction: ActionCard = !latestResume
    ? { title: "Create your master CV", description: "Everything downstream improves once your core resume is in the workspace.", href: "/onboarding", cta: "Start onboarding", icon: FileText }
    : !latestReport
    ? { title: "Run your first ATS benchmark", description: "Get a clear score, missing keywords, and concrete fixes before you apply.", href: "/ats", cta: "Open ATS Optimizer", icon: Target }
    : startedCount > 0
    ? { title: "Confirm started applications", description: `${startedCount} role${startedCount === 1 ? "" : "s"} still need to be confirmed as fully applied.`, href: "/tracker", cta: "Review tracker", icon: CheckCircle2 }
    : latestScore < 80
    ? { title: "Raise your ATS score", description: "Your materials are close, but the latest benchmark says they can be sharper.", href: "/editor", cta: "Refine resume", icon: Zap }
    : { title: "Increase application momentum", description: "Your materials are strong. The next leverage move is discovering more roles.", href: "/jobs", cta: "Find jobs", icon: Search }

  const actionCards: ActionCard[] = [
    primaryAction,
    { title: latestResume ? "Update your CV" : "Build your first draft", description: latestResume ? "Switch templates, improve copy, and keep your strongest version current." : "Create a polished base version you can tailor role by role.", href: latestResume ? "/editor" : "/onboarding", cta: latestResume ? "Open builder" : "Build resume", icon: FileText },
    { title: activePipelineCount > 0 ? "Work the active pipeline" : "Discover fresh roles", description: activePipelineCount > 0 ? "Review statuses, confirm external applies, and keep momentum visible." : "Search curated opportunities and start tracked external apply flows.", href: activePipelineCount > 0 ? "/tracker" : "/jobs", cta: activePipelineCount > 0 ? "Open tracker" : "Browse jobs", icon: activePipelineCount > 0 ? Layers3 : Briefcase },
  ]

  const statCards = [
    { label: "Readiness", value: `${readinessScore}%`, icon: Gauge, color: scoreTone(readinessScore), href: primaryAction.href },
    { label: "Active Pipeline", value: `${activePipelineCount}`, icon: Layers3, color: "text-sky-600", href: "/tracker" },
    { label: "Latest ATS Score", value: latestReport ? `${latestScore}%` : "--", icon: Target, color: latestReport ? scoreTone(latestScore) : "text-muted-foreground", href: "/ats" },
    { label: "Offers", value: `${offerCount}`, icon: Rocket, color: "text-emerald-600", href: "/tracker" },
  ]

  const filteredJobs = (recentJobs || []).filter((job) => pipelineFilter === "all" || job.status === pipelineFilter)
  const pipelineStages: Array<{ status: JobTrackingStatus; count: number }> = [
    { status: "saved", count: savedCount },
    { status: "started", count: startedCount },
    { status: "applied", count: appliedCount },
    { status: "interviewing", count: interviewingCount },
    { status: "offer", count: offerCount },
    { status: "rejected", count: jobs.filter((job) => job.status === "rejected").length },
  ]

  if (isMobile) {
    return (
      <MobileDashboardExperience
        profile={profile}
        insightView={insightView}
        setInsightView={setInsightView}
        pipelineFilter={pipelineFilter}
        setPipelineFilter={setPipelineFilter}
        latestResume={latestResume}
        latestReport={latestReport}
        latestScore={latestScore}
        keywordCoverage={keywordCoverage}
        readinessScore={readinessScore}
        primaryAction={primaryAction}
        actionCards={actionCards}
        statCards={statCards}
        checklist={checklist}
        filteredJobs={filteredJobs}
        pipelineStages={pipelineStages}
        recentJobs={recentJobs || []}
      />
    )
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 pb-24 pt-4 md:space-y-8 md:px-8 md:pt-8">
      <section className="section-shell overflow-hidden px-5 py-6 md:px-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="min-w-0 space-y-4 xl:flex-1">
            <div className="eyebrow-chip"><Sparkles className="h-3.5 w-3.5" />Career command center</div>
            <div className="space-y-3">
              <h1 className="text-[2rem] font-black leading-[0.95] tracking-[-0.05em] text-primary sm:text-4xl lg:text-5xl">Keep your search visible, focused, and moving every day.</h1>
              <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-base md:text-lg">{profile?.targetRoles ? `Tracking progress for ${profile.targetRoles}${profile?.industry ? ` in ${profile.industry}` : ""}, with ATS insight, pipeline momentum, and CV quality all in one place.` : "Your dashboard now works like a premium job-search operating system, not just a passive summary."}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {profile?.targetRoles ? <Badge variant="secondary" className="rounded-full bg-white px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-primary shadow-sm">{profile.targetRoles}</Badge> : null}
              {profile?.industry ? <Badge variant="outline" className="rounded-full border-border/80 bg-white/80 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em]">{profile.industry}</Badge> : null}
              <Badge variant="outline" className="rounded-full border-secondary/20 bg-secondary/5 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-secondary">{(profile?.plan || "free").toUpperCase()} plan</Badge>
            </div>
          </div>
          <div className="grid w-full gap-3 sm:grid-cols-3 xl:flex xl:w-auto xl:shrink-0">
            <Button variant="outline" asChild className="h-12 rounded-2xl font-bold"><Link href="/onboarding/upload"><Upload className="mr-2 h-4 w-4" />Upload CV</Link></Button>
            <Button variant="outline" asChild className="h-12 rounded-2xl font-bold"><Link href="/editor"><FileText className="mr-2 h-4 w-4" />Open builder</Link></Button>
            <Button asChild className="h-12 rounded-2xl font-bold shadow-lg shadow-primary/15"><Link href="/jobs"><Search className="mr-2 h-4 w-4" />Find jobs</Link></Button>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-4">
        {statCards.map((stat) => <Link key={stat.label} href={stat.href}><Card className="h-full rounded-[1.6rem] border-none bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl md:p-6"><div className="flex items-center justify-between"><stat.icon className={cn("h-5 w-5", stat.color)} /><ArrowUpRight className="h-4 w-4 text-muted-foreground/30" /></div><p className="mt-4 text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">{stat.label}</p><p className={cn("mt-1 text-3xl font-black tracking-tight", stat.color)}>{stat.value}</p></Card></Link>)}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.22fr_0.78fr]">
        <div className="space-y-6">
          <Card className="overflow-hidden rounded-[2rem] border-none bg-white shadow-sm">
            <CardHeader className="flex flex-col gap-4 p-6 pb-4 md:flex-row md:items-center md:justify-between">
              <div className="space-y-1"><CardTitle className="text-2xl font-black text-primary">Focus board</CardTitle><CardDescription>Switch between next-step guidance, pipeline health, and ATS intelligence.</CardDescription></div>
              <div className="flex flex-wrap gap-2">{(["command", "pipeline", "ats"] as InsightView[]).map((view) => <Button key={view} type="button" size="sm" variant={insightView === view ? "default" : "outline"} className="rounded-xl font-bold capitalize" onClick={() => setInsightView(view)}>{view}</Button>)}</div>
            </CardHeader>
            <CardContent className="space-y-5 p-6 pt-2">
              {insightView === "command" ? <>
                <div className="rounded-[1.6rem] border border-primary/10 bg-primary/5 p-5"><div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between"><div className="space-y-2"><div className="flex items-center gap-2 text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-primary/70"><primaryAction.icon className="h-4 w-4" />Best next move</div><h2 className="text-2xl font-black tracking-tight text-primary">{primaryAction.title}</h2><p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">{primaryAction.description}</p></div><Button asChild className="rounded-xl font-bold"><Link href={primaryAction.href}>{primaryAction.cta}<ArrowRight className="ml-2 h-4 w-4" /></Link></Button></div></div>
                <div className="grid gap-4 md:grid-cols-3">{actionCards.map((action) => <div key={action.title} className="rounded-[1.4rem] border border-border/70 bg-muted/20 p-4"><div className="flex h-11 w-11 items-center justify-center rounded-2xl border bg-white text-primary shadow-sm"><action.icon className="h-5 w-5" /></div><p className="mt-4 text-base font-black tracking-tight text-primary">{action.title}</p><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{action.description}</p><Button variant="ghost" asChild className="mt-3 h-auto rounded-xl px-0 font-bold text-primary hover:bg-transparent"><Link href={action.href}>{action.cta}<ArrowRight className="ml-2 h-4 w-4" /></Link></Button></div>)}</div>
              </> : insightView === "pipeline" ? <>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{pipelineStages.map((stage) => <Link key={stage.status} href="/tracker"><div className="rounded-[1.4rem] border border-border/70 bg-[#FAFBFD] p-4 transition-all hover:border-primary/15 hover:bg-white hover:shadow-md"><Badge variant="outline" className={cn("rounded-full px-3 py-1 text-[0.65rem] font-black uppercase tracking-[0.18em]", JOB_STATUS_CONFIG[stage.status].chipClassName)}>{JOB_STATUS_CONFIG[stage.status].label}</Badge><p className="mt-4 text-3xl font-black tracking-tight text-primary">{stage.count}</p></div></Link>)}</div>
                <div className="rounded-[1.4rem] border border-border/70 bg-muted/20 p-5"><p className="text-sm font-black text-primary">{startedCount > 0 ? "Started applications need confirmation" : activePipelineCount > 0 ? "Your pipeline is moving" : "You have room to build momentum"}</p><p className="mt-2 text-sm text-muted-foreground">{startedCount > 0 ? "Clear pending external applies first so your tracker and reporting stay reliable." : activePipelineCount > 0 ? "Keep statuses fresh and keep feeding the top of the funnel with new roles." : "Start with the jobs workspace to seed your search and make the dashboard more actionable."}</p></div>
              </> : latestReport ? <>
                <div className="grid gap-4 md:grid-cols-2"><div className="rounded-[1.5rem] border border-border/70 bg-[#F8FAFF] p-5"><p className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-accent">Latest ATS snapshot</p><div className="mt-3 flex items-end gap-3"><p className={cn("text-5xl font-black tracking-tight", scoreTone(latestScore))}>{latestScore}%</p><p className="pb-2 text-sm font-semibold text-muted-foreground">score</p></div><div className="mt-4 space-y-2"><div className="flex items-center justify-between text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground"><span>Keyword coverage</span><span>{keywordCoverage}%</span></div><Progress value={keywordCoverage} className="h-2 bg-secondary/10" /></div><p className="mt-4 text-sm leading-relaxed text-muted-foreground">{latestReport.matchSummary || "Latest ATS analysis available."}</p></div><div className="rounded-[1.5rem] border border-border/70 bg-white p-5"><p className="text-sm font-black text-primary">Quick wins</p><div className="mt-4 space-y-3">{(latestReport.quickWins?.length ? latestReport.quickWins.slice(0, 3) : ["Run a role-specific ATS scan after your next edit to surface fresh priorities."]).map((item) => <div key={item} className="flex items-start gap-3 rounded-[1rem] bg-muted/20 p-3"><Lightbulb className="mt-0.5 h-4 w-4 text-accent" /><p className="text-sm leading-relaxed text-muted-foreground">{item}</p></div>)}</div></div></div>
                <div className="rounded-[1.4rem] border border-border/70 bg-muted/20 p-5"><p className="text-sm font-black text-primary">Missing keywords</p><div className="mt-4 flex flex-wrap gap-2">{(latestReport.missingKeywords?.length ? latestReport.missingKeywords.slice(0, 6) : ["No urgent keyword gaps surfaced"]).map((keyword) => <Badge key={keyword} variant="outline" className="rounded-full px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em]">{keyword}</Badge>)}</div></div>
              </> : <div className="rounded-[1.5rem] border border-dashed border-border/80 bg-muted/20 p-8 text-center"><p className="text-lg font-black text-primary">Run your first ATS benchmark</p><p className="mt-2 text-sm text-muted-foreground">Once you scan a resume against a role, this space will turn into a live ATS intelligence panel.</p><Button asChild className="mt-5 rounded-xl font-bold"><Link href="/ats">Open ATS Optimizer</Link></Button></div>}
            </CardContent>
          </Card>

          <Card className="overflow-hidden rounded-[2rem] border-none bg-white shadow-sm">
            <CardHeader className="flex flex-col gap-4 p-6 pb-4 md:flex-row md:items-center md:justify-between"><div className="space-y-1"><CardTitle className="text-2xl font-black text-primary">Application board</CardTitle><CardDescription>Filter your recent tracked roles by stage without leaving the dashboard.</CardDescription></div><div className="flex flex-wrap gap-2">{(["all", "started", "applied", "interviewing", "offer"] as const).map((filter) => <Button key={filter} type="button" size="sm" variant={pipelineFilter === filter ? "default" : "outline"} className="rounded-xl font-bold capitalize" onClick={() => setPipelineFilter(filter)}>{filter === "all" ? "All" : JOB_STATUS_CONFIG[filter].label}</Button>)}</div></CardHeader>
            <CardContent className="space-y-4 p-6 pt-2">
              {filteredJobs.length ? filteredJobs.map((job) => { const status = (job.status || "saved") as JobTrackingStatus; const source = job.source ? getSafeJobSource(job.source) : null; return <div key={job.id} className="flex flex-col gap-4 rounded-[1.5rem] border border-border/70 bg-[#FAFBFD] p-4 transition-all hover:border-primary/15 hover:bg-white hover:shadow-md md:flex-row md:items-center md:justify-between"><div className="min-w-0 space-y-2"><div className="flex flex-wrap items-center gap-2"><Badge variant="outline" className={cn("rounded-full px-3 py-1 text-[0.65rem] font-black uppercase tracking-[0.18em]", JOB_STATUS_CONFIG[status].chipClassName)}>{JOB_STATUS_CONFIG[status].label}</Badge>{source ? <Badge variant="outline" className={cn("rounded-full px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.18em]", JOB_SOURCE_CONFIG[source].badgeClassName)}>{JOB_SOURCE_CONFIG[source].shortLabel}</Badge> : null}{job.resumeName ? <Badge variant="outline" className="rounded-full px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.18em]">CV: {job.resumeName}</Badge> : null}</div><p className="truncate text-lg font-black tracking-tight text-primary">{job.role}</p><p className="text-sm font-semibold text-muted-foreground">{job.company}</p><div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground"><span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4" />{job.location || "Location not specified"}</span><span className="inline-flex items-center gap-1"><History className="h-4 w-4" />Updated {formatTime(job.updatedAt)}</span></div></div><div className="flex flex-wrap gap-2"><Button variant="outline" asChild className="rounded-xl font-bold"><Link href="/tracker">Open tracker</Link></Button>{job.sourceUrl ? <Button asChild className="rounded-xl font-bold"><a href={job.sourceUrl} target="_blank" rel="noreferrer">Open source<ExternalLink className="ml-2 h-4 w-4" /></a></Button> : null}</div></div> }) : <div className="rounded-[1.5rem] border border-dashed border-border/80 bg-muted/20 p-8 text-center"><p className="text-lg font-black text-primary">{pipelineFilter === "all" ? "No applications tracked yet" : `No ${JOB_STATUS_CONFIG[pipelineFilter].label.toLowerCase()} roles right now`}</p><p className="mt-2 text-sm text-muted-foreground">Use the jobs workspace to start external apply flows, or add a role manually in the tracker.</p><div className="mt-5 flex flex-wrap justify-center gap-3"><Button asChild className="rounded-xl font-bold"><Link href="/jobs">Discover jobs</Link></Button><Button variant="outline" asChild className="rounded-xl font-bold"><Link href="/tracker">Open tracker</Link></Button></div></div>}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="overflow-hidden rounded-[2rem] border-none bg-white shadow-sm">
            <CardHeader className="space-y-2 p-6 pb-4"><CardTitle className="flex items-center gap-3 text-2xl font-black text-primary"><Gauge className="h-6 w-6 text-accent" />Momentum</CardTitle><CardDescription>A quick read on how launch-ready your search system is today.</CardDescription></CardHeader>
            <CardContent className="space-y-5 p-6 pt-0">
              <div className="rounded-[1.5rem] border border-primary/10 bg-primary/5 p-5"><div className="flex items-end justify-between gap-4"><div><p className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-primary/70">Search readiness</p><p className={cn("mt-2 text-5xl font-black tracking-tight", scoreTone(readinessScore))}>{readinessScore}%</p></div><TrendingUp className="h-10 w-10 text-primary/25" /></div><div className="mt-4 space-y-2"><div className="flex items-center justify-between text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground"><span>Overall momentum</span><span>{readinessScore}%</span></div><Progress value={readinessScore} className="h-2 bg-white/70" /></div></div>
              <div className="space-y-3">{checklist.map((item) => <Link key={item.label} href={item.href} className="flex items-center justify-between rounded-[1rem] border border-border/70 bg-muted/20 px-4 py-3 transition-all hover:border-primary/15 hover:bg-white"><div className="flex items-center gap-3"><div className={cn("flex h-8 w-8 items-center justify-center rounded-full", item.done ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700")}>{item.done ? <CheckCircle2 className="h-4 w-4" /> : <Clock3 className="h-4 w-4" />}</div><span className="text-sm font-semibold text-primary">{item.label}</span></div><ArrowRight className="h-4 w-4 text-muted-foreground/40" /></Link>)}</div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden rounded-[2rem] border-none bg-white shadow-sm">
            <CardHeader className="space-y-2 p-6 pb-4"><CardTitle className="flex items-center gap-3 text-2xl font-black text-primary"><FileText className="h-6 w-6 text-secondary" />Materials snapshot</CardTitle><CardDescription>Your latest CV and ATS evidence stay visible here.</CardDescription></CardHeader>
            <CardContent className="space-y-4 p-6 pt-0">
              <div className="rounded-[1.4rem] border border-border/70 bg-[#FAFBFD] p-4">{latestResume ? <><p className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Latest resume</p><p className="mt-3 text-lg font-black tracking-tight text-primary">{latestResume.name}</p><div className="mt-2 flex flex-wrap gap-2"><Badge variant="secondary" className="rounded-full px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.18em]">{getTemplateConfig(latestResume.templateId).name}</Badge><Badge variant="outline" className="rounded-full px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.18em]">Updated {formatDate(latestResume.updatedAt)}</Badge></div></> : <><p className="text-lg font-black text-primary">No resume loaded yet</p><p className="mt-2 text-sm text-muted-foreground">Upload or build your master CV to unlock the rest of the workspace.</p></>}</div>
              <div className="rounded-[1.4rem] border border-border/70 bg-[#FAFBFD] p-4">{latestReport ? <><p className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Latest ATS result</p><div className="mt-3 flex items-end gap-3"><p className={cn("text-4xl font-black tracking-tight", scoreTone(latestScore))}>{latestScore}%</p><p className="pb-1 text-sm font-semibold text-muted-foreground">match</p></div><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{latestReport.matchSummary || "Latest ATS analysis available."}</p></> : <><p className="text-lg font-black text-primary">No ATS scan yet</p><p className="mt-2 text-sm text-muted-foreground">Run one benchmark to unlock keyword coverage and quick wins.</p></>}</div>
              <div className="grid gap-3 sm:grid-cols-2"><Button variant="outline" asChild className="rounded-2xl font-bold"><Link href={latestResume ? "/editor" : "/onboarding"}>{latestResume ? "Open builder" : "Start resume"}</Link></Button><Button asChild className="rounded-2xl font-bold"><Link href="/ats">Open ATS</Link></Button></div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden rounded-[2rem] border-none bg-white shadow-sm">
            <CardHeader className="space-y-2 p-6 pb-4"><CardTitle className="flex items-center gap-3 text-2xl font-black text-primary"><Zap className="h-6 w-6 text-accent" />Usage and activity</CardTitle><CardDescription>Capacity and recent movement across your search.</CardDescription></CardHeader>
            <CardContent className="space-y-5 p-6 pt-0">
              <div className="rounded-[1.4rem] border border-border/70 bg-muted/20 p-4"><div className="flex items-center justify-between text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground"><span>AI generations</span><span>{profile?.usage?.aiGenerations || 0} / {PLAN_LIMITS[(profile?.plan as PlanType) || "free"].aiGenerations}</span></div><Progress value={((profile?.usage?.aiGenerations || 0) / PLAN_LIMITS[(profile?.plan as PlanType) || "free"].aiGenerations) * 100} className="mt-3 h-2 bg-secondary/10" /></div>
              <div className="rounded-[1.4rem] border border-border/70 bg-muted/20 p-4"><div className="flex items-center justify-between text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground"><span>ATS scans</span><span>{profile?.usage?.atsChecks || 0} / {PLAN_LIMITS[(profile?.plan as PlanType) || "free"].atsChecks}</span></div><Progress value={((profile?.usage?.atsChecks || 0) / PLAN_LIMITS[(profile?.plan as PlanType) || "free"].atsChecks) * 100} className="mt-3 h-2 bg-secondary/10" /></div>
              <div className="space-y-4">{(recentJobs || []).length ? (recentJobs || []).slice(0, 4).map((activity) => { const status = (activity.status || "saved") as JobTrackingStatus; return <div key={activity.id} className="flex items-start gap-4"><div className={cn("mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl", status === "applied" ? "bg-blue-50 text-blue-600" : status === "started" ? "bg-sky-50 text-sky-600" : "bg-muted text-muted-foreground")}>{status === "applied" ? <ArrowUpRight className="h-4 w-4" /> : status === "started" ? <ExternalLink className="h-4 w-4" /> : <Clock3 className="h-4 w-4" />}</div><div><p className="text-sm font-bold leading-tight text-primary">{status === "started" ? `Started apply flow for ${activity.company}` : status === "applied" ? `Applied to ${activity.company}` : `Updated ${activity.company} to ${JOB_STATUS_CONFIG[status].label}`}</p><p className="mt-1 text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">{formatTime(activity.updatedAt)}</p></div></div> }) : <div className="rounded-[1.4rem] border border-dashed border-border/80 bg-muted/20 p-5 text-sm text-muted-foreground">Activity will appear here as soon as you save jobs, start external applies, or update statuses.</div>}</div>
              {profile?.plan !== "master" ? <Button asChild className="w-full rounded-2xl font-bold"><Link href="/settings">Upgrade for more capacity</Link></Button> : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function MobileDashboardExperience({
  profile,
  insightView,
  setInsightView,
  pipelineFilter,
  setPipelineFilter,
  latestResume,
  latestReport,
  latestScore,
  keywordCoverage,
  readinessScore,
  primaryAction,
  actionCards,
  statCards,
  checklist,
  filteredJobs,
  pipelineStages,
  recentJobs,
}: {
  profile: any
  insightView: InsightView
  setInsightView: (value: InsightView) => void
  pipelineFilter: "all" | JobTrackingStatus
  setPipelineFilter: (value: "all" | JobTrackingStatus) => void
  latestResume: ResumeRecord | null
  latestReport: AtsReportRecord | null
  latestScore: number
  keywordCoverage: number
  readinessScore: number
  primaryAction: ActionCard
  actionCards: ActionCard[]
  statCards: Array<{ label: string; value: string; icon: LucideIcon; color: string; href: string }>
  checklist: Array<{ label: string; done: boolean; href: string }>
  filteredJobs: DashboardJob[]
  pipelineStages: Array<{ status: JobTrackingStatus; count: number }>
  recentJobs: DashboardJob[]
}) {
  return (
    <div className="space-y-4 pb-1">
      <section className="overflow-hidden rounded-[1.6rem] border border-white/80 bg-[linear-gradient(160deg,rgba(255,255,255,0.98),rgba(242,246,255,0.96))] px-4 py-4 shadow-[0_30px_60px_-42px_rgba(15,23,42,0.38)]">
        <div className="eyebrow-chip">
          <Sparkles className="h-3.5 w-3.5" />
          Career command center
        </div>
        <h1 className="mt-3 text-[1.7rem] font-black leading-[0.94] tracking-[-0.05em] text-primary">
          Run your search like a premium mobile workspace.
        </h1>
        <p className="mt-2.5 text-[0.92rem] leading-relaxed text-muted-foreground">
          {profile?.targetRoles
            ? `Tracking ${profile.targetRoles}${profile?.industry ? ` in ${profile.industry}` : ""}, with resumes, ATS feedback, and pipeline movement tuned for phone-first use.`
            : "See your next move, key metrics, and active applications without fighting dense desktop-style layouts."}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {profile?.targetRoles ? (
            <Badge variant="secondary" className="rounded-full bg-white px-3 py-1 text-[0.64rem] font-bold uppercase tracking-[0.18em] text-primary shadow-sm">
              {profile.targetRoles}
            </Badge>
          ) : null}
          <Badge variant="outline" className="rounded-full border-secondary/20 bg-secondary/5 px-3 py-1 text-[0.64rem] font-bold uppercase tracking-[0.18em] text-secondary">
            {(profile?.plan || "free").toUpperCase()} plan
          </Badge>
        </div>
        <div className="mt-4 grid gap-2.5">
          <Button asChild className="h-11 rounded-2xl font-bold shadow-lg shadow-primary/15">
            <Link href={primaryAction.href}>
              {primaryAction.cta}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" asChild className="h-10 rounded-2xl font-bold">
              <Link href="/onboarding/upload">
                <Upload className="mr-2 h-4 w-4" />
                {latestResume ? "New CV" : "Upload CV"}
              </Link>
            </Button>
            <Button variant="outline" asChild className="h-10 rounded-2xl font-bold">
              <Link href="/editor">
                <FileText className="mr-2 h-4 w-4" />
                Builder
              </Link>
            </Button>
          </div>
          <Button variant="outline" asChild className="h-10 rounded-2xl font-bold">
            <Link href="/jobs">
              <Search className="mr-2 h-4 w-4" />
              Jobs
            </Link>
          </Button>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-2.5">
        {statCards.map((stat) => (
          <Link key={stat.label} href={stat.href}>
            <Card className="h-full rounded-[1.25rem] border-none bg-white p-3.5 shadow-sm">
              <div className="flex items-center justify-between">
                <stat.icon className={cn("h-5 w-5", stat.color)} />
                <ArrowUpRight className="h-4 w-4 text-muted-foreground/30" />
              </div>
              <p className="mt-3 text-[0.6rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                {stat.label}
              </p>
              <p className={cn("mt-1 text-[1.5rem] font-black tracking-tight", stat.color)}>{stat.value}</p>
            </Card>
          </Link>
        ))}
      </section>

      <Card className="overflow-hidden rounded-[1.5rem] border-none bg-white shadow-sm">
        <CardHeader className="space-y-3 p-4 pb-2">
          <div>
            <CardTitle className="text-lg font-black text-primary">Focus board</CardTitle>
            <CardDescription>Your next moves, pipeline health, and ATS signal in one mobile view.</CardDescription>
          </div>
            <div className="grid grid-cols-3 gap-1.5 rounded-[1rem] bg-muted/40 p-1">
            {(["command", "pipeline", "ats"] as InsightView[]).map((view) => (
              <button
                key={view}
                type="button"
                onClick={() => setInsightView(view)}
                className={cn(
                  "rounded-[0.85rem] px-2 py-2 text-[0.62rem] font-bold uppercase tracking-[0.16em] transition-all",
                  insightView === view ? "bg-white text-primary shadow-sm" : "text-muted-foreground"
                )}
              >
                {view}
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="space-y-4 p-4 pt-3">
          {insightView === "command" ? (
            <>
              <div className="rounded-[1.25rem] border border-primary/10 bg-primary/5 p-4">
                <div className="flex items-center gap-2 text-[0.64rem] font-semibold uppercase tracking-[0.18em] text-primary/70">
                  <primaryAction.icon className="h-4 w-4" />
                  Best next move
                </div>
                <h2 className="mt-3 text-lg font-black tracking-tight text-primary">{primaryAction.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{primaryAction.description}</p>
                <Button asChild className="mt-4 h-10 rounded-2xl font-bold">
                  <Link href={primaryAction.href}>
                    {primaryAction.cta}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
              <div className="space-y-3">
                {actionCards.slice(0, 2).map((action) => (
                  <Link
                    key={action.title}
                    href={action.href}
                    className="flex items-start gap-3 rounded-[1.15rem] border border-border/70 bg-[#fafbfd] p-3.5 transition-all hover:bg-white"
                  >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-primary shadow-sm">
                      <action.icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-black tracking-tight text-primary">{action.title}</p>
                      <p className="mt-1 text-[0.82rem] leading-relaxed text-muted-foreground">{action.description}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          ) : insightView === "pipeline" ? (
            <>
               <div className="grid grid-cols-2 gap-2.5">
                {pipelineStages.map((stage) => (
                  <Link key={stage.status} href="/tracker" className="rounded-[1.1rem] border border-border/70 bg-[#fafbfd] p-3.5">
                    <Badge
                      variant="outline"
                      className={cn("rounded-full px-3 py-1 text-[0.6rem] font-black uppercase tracking-[0.18em]", JOB_STATUS_CONFIG[stage.status].chipClassName)}
                    >
                      {JOB_STATUS_CONFIG[stage.status].label}
                    </Badge>
                    <p className="mt-2 text-[1.6rem] font-black tracking-tight text-primary">{stage.count}</p>
                  </Link>
                ))}
              </div>
              <div className="flex gap-2 overflow-x-auto no-scrollbar">
                {(["all", "started", "applied", "interviewing", "offer"] as const).map((filter) => (
                  <Button
                    key={filter}
                    type="button"
                    size="sm"
                    variant={pipelineFilter === filter ? "default" : "outline"}
                     className="h-8 shrink-0 rounded-full px-3 text-[0.74rem] font-bold capitalize"
                    onClick={() => setPipelineFilter(filter)}
                  >
                    {filter === "all" ? "All" : JOB_STATUS_CONFIG[filter].label}
                  </Button>
                ))}
              </div>
              <div className="space-y-3">
                {filteredJobs.length ? (
                  filteredJobs.slice(0, 4).map((job) => {
                    const status = (job.status || "saved") as JobTrackingStatus
                    const source = job.source ? getSafeJobSource(job.source) : null
                    return (
                       <div key={job.id} className="rounded-[1.2rem] border border-border/70 bg-[#fafbfd] p-3.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge
                            variant="outline"
                            className={cn("rounded-full px-3 py-1 text-[0.6rem] font-black uppercase tracking-[0.18em]", JOB_STATUS_CONFIG[status].chipClassName)}
                          >
                            {JOB_STATUS_CONFIG[status].label}
                          </Badge>
                          {source ? (
                            <Badge variant="outline" className={cn("rounded-full px-3 py-1 text-[0.6rem] font-semibold uppercase tracking-[0.18em]", JOB_SOURCE_CONFIG[source].badgeClassName)}>
                              {JOB_SOURCE_CONFIG[source].shortLabel}
                            </Badge>
                          ) : null}
                        </div>
                         <p className="mt-2.5 text-[0.98rem] font-black tracking-tight text-primary">{job.role}</p>
                        <p className="mt-1 text-sm font-semibold text-muted-foreground">{job.company}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" />
                            {job.location || "Remote"}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <History className="h-3.5 w-3.5" />
                            {formatTime(job.updatedAt)}
                          </span>
                        </div>
                         <Button variant="outline" asChild className="mt-3 h-9 rounded-xl font-bold">
                          <Link href="/tracker">Open tracker</Link>
                        </Button>
                      </div>
                    )
                  })
                ) : (
                  <div className="rounded-[1.4rem] border border-dashed border-border/80 bg-muted/20 p-5 text-sm text-muted-foreground">
                    No roles in this stage right now. Open the tracker to seed or update your pipeline.
                  </div>
                )}
              </div>
            </>
          ) : latestReport ? (
            <>
               <div className="rounded-[1.25rem] border border-border/70 bg-[#f8faff] p-4">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="text-[0.64rem] font-semibold uppercase tracking-[0.18em] text-accent">Latest ATS snapshot</p>
                     <p className={cn("mt-2 text-[2rem] font-black tracking-tight", scoreTone(latestScore))}>{latestScore}%</p>
                  </div>
                   <div className="rounded-[0.95rem] border bg-white px-3.5 py-2.5 text-right shadow-sm">
                    <p className="text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Keyword coverage</p>
                    <p className="mt-1 text-xl font-black text-primary">{keywordCoverage}%</p>
                  </div>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {latestReport.matchSummary || "Latest ATS analysis available."}
                </p>
              </div>
              <div className="space-y-3">
                {(latestReport.quickWins?.length ? latestReport.quickWins.slice(0, 3) : ["Run a fresh ATS scan after your next resume edit."]).map((item) => (
                  <div key={item} className="flex items-start gap-3 rounded-[1.2rem] border border-border/70 bg-[#fafbfd] p-4">
                    <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                    <p className="text-sm leading-relaxed text-muted-foreground">{item}</p>
                  </div>
                ))}
              </div>
               <Button asChild className="h-10 rounded-2xl font-bold">
                <Link href="/ats">Open ATS Optimizer</Link>
              </Button>
            </>
          ) : (
            <div className="rounded-[1.5rem] border border-dashed border-border/80 bg-muted/20 p-5 text-center">
              <p className="text-lg font-black text-primary">Run your first ATS benchmark</p>
              <p className="mt-2 text-sm text-muted-foreground">Once you scan a resume, this board becomes a live ATS intelligence panel.</p>
              <Button asChild className="mt-4 h-11 rounded-2xl font-bold">
                <Link href="/ats">Open ATS Optimizer</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-[1.5rem] border-none bg-white shadow-sm">
        <CardHeader className="space-y-2 p-4 pb-0">
          <CardTitle className="text-lg font-black text-primary">Momentum</CardTitle>
          <CardDescription>Your readiness, materials, and recent activity in one scroll.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 p-4">
            <div className="rounded-[1.2rem] border border-primary/10 bg-primary/5 p-4">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-primary/70">Search readiness</p>
                <p className={cn("mt-2 text-[2rem] font-black tracking-tight", scoreTone(readinessScore))}>{readinessScore}%</p>
              </div>
              <TrendingUp className="h-9 w-9 text-primary/20" />
            </div>
            <Progress value={readinessScore} className="mt-4 h-2 bg-white/70" />
          </div>

          <div className="space-y-3">
            {checklist.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="flex items-center justify-between rounded-[1rem] border border-border/70 bg-muted/20 px-3.5 py-3"
              >
                <div className="flex items-center gap-3">
                  <div className={cn("flex h-9 w-9 items-center justify-center rounded-full", item.done ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700")}>
                    {item.done ? <CheckCircle2 className="h-4 w-4" /> : <Clock3 className="h-4 w-4" />}
                  </div>
                  <span className="text-sm font-semibold text-primary">{item.label}</span>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground/40" />
              </Link>
            ))}
          </div>

          <div className="grid gap-3">
             <div className="rounded-[1.15rem] border border-border/70 bg-[#fafbfd] p-3.5">
              {latestResume ? (
                <>
                  <p className="text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Latest resume</p>
                  <p className="mt-2 text-lg font-black tracking-tight text-primary">{latestResume.name}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge variant="secondary" className="rounded-full px-3 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.16em]">
                      {getTemplateConfig(latestResume.templateId).name}
                    </Badge>
                    <Badge variant="outline" className="rounded-full px-3 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.16em]">
                      {formatDate(latestResume.updatedAt)}
                    </Badge>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-lg font-black text-primary">No resume loaded yet</p>
                  <p className="mt-2 text-sm text-muted-foreground">Upload or build your master CV to unlock the rest of the workspace.</p>
                </>
              )}
            </div>
             <div className="rounded-[1.15rem] border border-border/70 bg-[#fafbfd] p-3.5">
              {latestReport ? (
                <>
                  <p className="text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Latest ATS result</p>
                  <div className="mt-2 flex items-end gap-3">
                    <p className={cn("text-3xl font-black tracking-tight", scoreTone(latestScore))}>{latestScore}%</p>
                    <p className="pb-1 text-sm font-semibold text-muted-foreground">match</p>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {latestReport.matchSummary || "Latest ATS analysis available."}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-lg font-black text-primary">No ATS scan yet</p>
                  <p className="mt-2 text-sm text-muted-foreground">Run one benchmark to unlock keyword coverage and quick wins.</p>
                </>
              )}
            </div>
          </div>

           <div className="rounded-[1.15rem] border border-border/70 bg-muted/20 p-3.5">
            <p className="text-sm font-black text-primary">Recent activity</p>
            <div className="mt-4 space-y-4">
              {recentJobs.length ? (
                recentJobs.slice(0, 3).map((activity) => {
                  const status = (activity.status || "saved") as JobTrackingStatus
                  return (
                    <div key={activity.id} className="flex items-start gap-3">
                      <div className={cn("mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl", status === "applied" ? "bg-blue-50 text-blue-600" : status === "started" ? "bg-sky-50 text-sky-600" : "bg-white text-muted-foreground")}>
                        {status === "applied" ? <ArrowUpRight className="h-4 w-4" /> : status === "started" ? <ExternalLink className="h-4 w-4" /> : <Clock3 className="h-4 w-4" />}
                      </div>
                      <div>
                        <p className="text-sm font-bold leading-tight text-primary">
                          {status === "started"
                            ? `Started apply flow for ${activity.company}`
                            : status === "applied"
                              ? `Applied to ${activity.company}`
                              : `Updated ${activity.company} to ${JOB_STATUS_CONFIG[status].label}`}
                        </p>
                        <p className="mt-1 text-[0.64rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                          {formatTime(activity.updatedAt)}
                        </p>
                      </div>
                    </div>
                  )
                })
              ) : (
                <p className="text-sm text-muted-foreground">Activity appears here as soon as you start saving roles and updating your tracker.</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
