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
  ArrowUp,
  ArrowDown,
  ChevronRight,
  ClipboardList,
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

// --- Types & Helpers ---
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
type ActionCard = { title: string; description: string; href: string; cta: string; icon: LucideIcon; variant?: "primary" | "secondary" }

const scoreTone = (score: number) => (score >= 85 ? "text-emerald-500" : score >= 70 ? "text-sky-500" : score >= 55 ? "text-amber-500" : "text-rose-500")
const scoreBg = (score: number) => (score >= 85 ? "bg-emerald-500/10" : score >= 70 ? "bg-sky-500/10" : score >= 55 ? "bg-amber-500/10" : "bg-rose-500/10")

const formatDate = (value?: { toDate?: () => Date } | Date | null) => {
  const date = value instanceof Date ? value : value?.toDate?.()
  return date ? date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "Just now"
}
const formatTime = (value?: { toDate?: () => Date }) => (value?.toDate ? value.toDate().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Recently")

// --- Modern Components ---

function CircularGauge({ value, size = 120, strokeWidth = 10, className }: { value: number; size?: number; strokeWidth?: number; className?: string }) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (value / 100) * circumference
  const colorClass = scoreTone(value)

  return (
    <div className={cn("relative flex items-center justify-center", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="currentColor" strokeWidth={strokeWidth} fill="transparent" className="text-muted/20" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          style={{ strokeDashoffset: offset, transition: "stroke-dashoffset 1s ease-out" }}
          strokeLinecap="round"
          className={colorClass}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className={cn("text-3xl font-black tracking-tighter", colorClass)}>{value}%</span>
      </div>
    </div>
  )
}

function BentoCard({ children, className, glow = false }: { children: React.ReactNode; className?: string; glow?: boolean }) {
  return (
    <div className={cn(
      "relative overflow-hidden group rounded-[2.5rem] border border-white/80 bg-white/70 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-xl transition-all duration-500 hover:shadow-[0_24px_60px_-15px_rgba(0,0,0,0.1)]",
      glow && "border-primary/20 shadow-[0_0_20px_-5px_rgba(124,58,237,0.2)] hover:border-primary/30",
      className
    )}>
      <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-white/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      {children}
    </div>
  )
}

function MetricCard({ label, value, icon: Icon, color, href, trend }: { label: string; value: string; icon: LucideIcon; color: string; href: string; trend?: { value: string; up: boolean } }) {
  return (
    <Link href={href} className="block group">
      <BentoCard className="h-full p-6">
        <div className="flex items-center justify-between">
          <div className={cn("flex h-10 w-10 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-black/5 transition-transform group-hover:scale-110", color)}>
            <Icon className="h-5 w-5" />
          </div>
          {trend && (
            <div className={cn("flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.62rem] font-bold tracking-tight", trend.up ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600")}>
              {trend.up ? <ArrowUp className="h-2.5 w-2.5" /> : <ArrowDown className="h-2.5 w-2.5" />}
              {trend.value}
            </div>
          )}
        </div>
        <p className="mt-6 text-[0.68rem] font-bold uppercase tracking-[0.2em] text-muted-foreground/80">{label}</p>
        <div className="mt-1 flex items-end justify-between">
          <p className={cn("text-3xl font-black tracking-tighter", color)}>{value}</p>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted/30 opacity-0 transition-all group-hover:translate-x-1 group-hover:opacity-100">
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
      </BentoCard>
    </Link>
  )
}

function ActivityTimeline({ activities }: { activities: DashboardJob[] }) {
  if (!activities.length) {
    return <div className="rounded-[1.4rem] border border-dashed border-border/80 bg-muted/20 p-5 text-sm text-muted-foreground">Activity will appear here as soon as you save jobs or update your tracker.</div>
  }

  return (
    <div className="relative space-y-6 pl-4 before:absolute before:left-[1.2rem] before:top-2 before:h-[calc(100%-16px)] before:w-px before:bg-gradient-to-b before:from-primary/20 before:via-border before:to-transparent">
      {activities.map((activity, idx) => {
        const status = (activity.status || "saved") as JobTrackingStatus
        return (
          <div key={activity.id} className="relative flex gap-6">
            <div className={cn(
              "z-10 mt-1 h-2.5 w-2.5 shrink-0 rounded-full border-2 border-white shadow-[0_0_0_4px_rgba(0,0,0,0.03)]",
              status === "applied" ? "bg-blue-500" : status === "started" ? "bg-sky-400" : "bg-muted-foreground/40"
            )} />
            <div className="min-w-0">
              <p className="text-sm font-bold leading-tight text-primary">
                {status === "started" ? `Started apply flow for ${activity.company}` : status === "applied" ? `Applied to ${activity.company}` : `Updated ${activity.company} to ${JOB_STATUS_CONFIG[status].label}`}
              </p>
              <p className="mt-1 text-[0.68rem] font-medium uppercase tracking-[0.1em] text-muted-foreground/70">{formatTime(activity.updatedAt)}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// --- Main Page ---

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
    ? { title: "Create your master CV", description: "Everything downstream improves once your core resume is in the workspace.", href: "/onboarding", cta: "Start onboarding", icon: FileText, variant: "primary" }
    : !latestReport
    ? { title: "Run your first ATS benchmark", description: "Get a clear score, missing keywords, and concrete fixes before you apply.", href: "/ats", cta: "Open ATS Optimizer", icon: Target, variant: "primary" }
    : startedCount > 0
    ? { title: "Confirm started applications", description: `${startedCount} role${startedCount === 1 ? "" : "s"} still need to be confirmed as fully applied.`, href: "/tracker", cta: "Review tracker", icon: CheckCircle2, variant: "primary" }
    : latestScore < 80
    ? { title: "Raise your ATS score", description: "Your materials are close, but the latest benchmark says they can be sharper.", href: "/editor", cta: "Refine resume", icon: Zap, variant: "primary" }
    : { title: "Increase application momentum", description: "Your materials are strong. The next leverage move is discovering more roles.", href: "/jobs", cta: "Find jobs", icon: Search, variant: "primary" }

  const actionCards: ActionCard[] = [
    { title: latestResume ? "Update your CV" : "Build your first draft", description: latestResume ? "Switch templates, improve copy, and keep your strongest version current." : "Create a polished base version you can tailor role by role.", href: latestResume ? "/editor" : "/onboarding", cta: latestResume ? "Open builder" : "Build resume", icon: FileText },
    { title: activePipelineCount > 0 ? "Work the active pipeline" : "Discover fresh roles", description: activePipelineCount > 0 ? "Review statuses, confirm external applies, and keep momentum visible." : "Search curated opportunities and start tracked external apply flows.", href: activePipelineCount > 0 ? "/tracker" : "/jobs", cta: activePipelineCount > 0 ? "Open tracker" : "Browse jobs", icon: activePipelineCount > 0 ? Layers3 : Briefcase },
  ]

  const statCards = [
    { label: "Readiness", value: `${readinessScore}%`, icon: Gauge, color: scoreTone(readinessScore), href: "/dashboard", trend: { value: "+12%", up: true } },
    { label: "Active Pipeline", value: `${activePipelineCount}`, icon: Layers3, color: "text-sky-500", href: "/tracker", trend: { value: "Stable", up: true } },
    { label: "Latest Match", value: latestReport ? `${latestScore}%` : "--", icon: Target, color: latestReport ? scoreTone(latestScore) : "text-muted-foreground", href: "/ats" },
    { label: "Offers", value: `${offerCount}`, icon: Rocket, color: "text-emerald-500", href: "/tracker" },
  ]

  const pipelineStages: Array<{ status: JobTrackingStatus; count: number }> = [
    { status: "saved", count: savedCount },
    { status: "started", count: startedCount },
    { status: "applied", count: appliedCount },
    { status: "interviewing", count: interviewingCount },
    { status: "offer", count: offerCount },
    { status: "rejected", count: jobs.filter((job) => job.status === "rejected").length },
  ]

  const filteredJobs = (recentJobs || []).filter((job) => pipelineFilter === "all" || job.status === pipelineFilter)

  if (isProfileLoading || isResumesLoading || isReportsLoading || isJobsLoading) {
    return <div className="flex h-[80vh] items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary/20" /></div>
  }

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
        readinessScore={readinessScore}
        primaryAction={primaryAction}
        actionCards={actionCards}
        statCards={statCards}
        checklist={checklist}
        filteredJobs={filteredJobs}
        pipelineStages={pipelineStages}
        keywordCoverage={keywordCoverage}
        recentJobs={recentJobs || []}
      />
    )
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 pb-24 pt-8 md:px-8">
      {/* --- Elevated Hero --- */}
      <section className="relative overflow-hidden rounded-[3rem] border border-white/80 bg-white/70 shadow-[0_32px_80px_-40px_rgba(15,23,42,0.3)] backdrop-blur-2xl">
        <div className="absolute inset-0 -z-10 bg-dot-grid opacity-40" />
        <div className="absolute -right-20 -top-20 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 h-96 w-96 rounded-full bg-secondary/5 blur-3xl" />
        
        <div className="flex flex-col gap-8 p-8 md:p-12 xl:flex-row xl:items-center xl:justify-between">
          <div className="space-y-6 xl:flex-1">
            <div className="eyebrow-chip border-glow-primary bg-primary/5 text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              Overview
            </div>
            <div className="space-y-4">
              <h1 className="text-4xl font-black leading-tight tracking-tight text-primary lg:text-5xl">
                Your search <span className="logo-gradient">command center</span>.
              </h1>
              <p className="max-w-2xl text-lg leading-relaxed text-muted-foreground">
                {profile?.targetRoles 
                  ? `Optimizing for ${profile.targetRoles}${profile?.industry ? ` in ${profile.industry}` : ""}. Your workspace is tuned for speed and score.`
                  : "Your career command center is live. Start by loading your master CV to unlock ATS intelligence and job tracking."}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {profile?.targetRoles && <Badge variant="secondary" className="rounded-full bg-primary/5 px-4 py-1.5 text-[0.7rem] font-bold uppercase tracking-widest text-primary border-none">{profile.targetRoles}</Badge>}
              <Badge variant="outline" className="rounded-full border-border/80 bg-white/50 backdrop-blur-sm px-4 py-1.5 text-[0.7rem] font-bold uppercase tracking-widest text-muted-foreground">{(profile?.plan || "free").toUpperCase()} WORKSPACE</Badge>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3 xl:shrink-0">
             <Button variant="outline" asChild className="h-14 rounded-2xl border-none bg-white text-base font-bold shadow-sm hover:bg-muted/50 transition-colors px-6">
              <Link href="/onboarding/upload"><Upload className="mr-2 h-5 w-5" />Upload CV</Link>
            </Button>
            <Button asChild className="h-14 rounded-2xl bg-primary text-base font-bold shadow-xl shadow-primary/20 hover:shadow-primary/30 active:scale-95 transition-all px-6">
              <Link href="/jobs"><Search className="mr-2 h-5 w-5" />Find Jobs</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* --- Bento Grid Metric Row --- */}
      <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
        {statCards.map((stat) => (
          <MetricCard key={stat.label} {...stat} />
        ))}
      </div>

      {/* --- Main Workspace Grid --- */}
      <div className="grid gap-6 lg:grid-cols-12">
        
        {/* LEFT COLUMN: Main Focus Groups */}
        <div className="space-y-6 lg:col-span-8">
          
          {/* Bento Group: Action & Intelligence */}
          <BentoCard className="p-8">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between border-b border-border/10 pb-6 mb-8">
              <div className="space-y-1">
                <CardTitle className="text-2xl font-black text-primary">Next Actions</CardTitle>
                <CardDescription className="text-sm font-medium">Your current feed and recommended steps.</CardDescription>
              </div>
              <div className="flex gap-1.5 rounded-2xl bg-muted/30 p-1">
                {(["command", "pipeline", "ats"] as InsightView[]).map((view) => (
                  <Button
                    key={view}
                    size="sm"
                    variant={insightView === view ? "secondary" : "ghost"}
                    className={cn(
                      "rounded-xl px-4 font-black capitalize transition-all",
                      insightView === view ? "bg-white text-primary shadow-sm hover:bg-white" : "text-muted-foreground/80 hover:bg-muted/50 hover:text-primary"
                    )}
                    onClick={() => setInsightView(view)}
                  >
                    {view}
                  </Button>
                ))}
              </div>
            </div>

            <div className="min-h-[280px]">
              {insightView === "command" ? (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                  <div className="relative overflow-hidden rounded-3xl border border-primary/10 bg-gradient-to-br from-primary/[0.03] to-secondary/[0.03] p-6 lg:p-8 shadow-sm">
                    <div className="absolute right-0 top-0 h-40 w-40 bg-primary/5 blur-3xl" />
                    <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-[0.68rem] font-bold uppercase tracking-widest text-primary/70">
                          <primaryAction.icon className="h-4 w-4" />
                          Recommended next step
                        </div>
                        <h2 className="text-2xl font-black tracking-tight text-primary lg:text-3xl">{primaryAction.title}</h2>
                        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground/90 font-medium">{primaryAction.description}</p>
                      </div>
                      <Button asChild className="h-12 rounded-xl bg-primary px-6 font-black tracking-tight hover:shadow-lg hover:shadow-primary/20">
                        <Link href={primaryAction.href}>{primaryAction.cta}<ArrowRight className="ml-2 h-4 w-4" /></Link>
                      </Button>
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    {actionCards.map((action) => (
                      <Link key={action.title} href={action.href} className="group flex items-start gap-4 rounded-3xl border border-border/40 bg-muted/10 p-5 transition-all hover:bg-white hover:border-primary/20 hover:shadow-md">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-primary shadow-sm ring-1 ring-black/5 transition-transform group-hover:scale-110">
                          <action.icon className="h-6 w-6" />
                        </div>
                        <div className="space-y-1">
                          <p className="font-black text-primary tracking-tight">{action.title}</p>
                          <p className="text-xs font-medium leading-relaxed text-muted-foreground">{action.description}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              ) : insightView === "pipeline" ? (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 animate-in fade-in slide-in-from-bottom-2 duration-500">
                  {pipelineStages.map((stage) => (
                    <Link key={stage.status} href="/tracker" className="group rounded-3xl border border-border/40 bg-[#FAFBFD] p-6 transition-all hover:border-primary/20 hover:bg-white hover:shadow-lg">
                      <Badge variant="outline" className={cn("rounded-full px-3 py-1 text-[0.62rem] font-black uppercase tracking-[0.15em] border-none", JOB_STATUS_CONFIG[stage.status].chipClassName)}>
                        {JOB_STATUS_CONFIG[stage.status].label}
                      </Badge>
                      <div className="mt-4 flex items-end justify-between">
                        <p className="text-4xl font-black tracking-tighter text-primary">{stage.count}</p>
                        <ArrowUpRight className="h-5 w-5 text-muted-foreground/30 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1 group-hover:text-primary/40" />
                      </div>
                    </Link>
                  ))}
                </div>
              ) : latestReport ? (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="rounded-3xl border border-border/40 bg-gradient-to-r from-emerald-500/5 to-sky-500/5 p-6">
                      <p className="text-[0.62rem] font-bold uppercase tracking-widest text-emerald-600/70">Latest Match Score</p>
                      <div className="mt-4 flex items-end gap-3">
                        <p className={cn("text-5xl font-black tracking-tighter", scoreTone(latestScore))}>{latestScore}%</p>
                        <span className="pb-1.5 text-sm font-black text-muted-foreground/60 uppercase">Benchmark</span>
                      </div>
                      <div className="mt-6 space-y-2.5">
                        <div className="flex items-center justify-between text-[0.64rem] font-bold uppercase tracking-widest text-muted-foreground">
                          <span>Keyword coverage</span>
                          <span>{keywordCoverage}%</span>
                        </div>
                        <Progress value={keywordCoverage} className="h-2.5 bg-white/40" />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <p className="text-[0.68rem] font-black uppercase tracking-widest text-primary/70">Quick insights</p>
                      <div className="space-y-3">
                        {(latestReport.quickWins?.length ? latestReport.quickWins.slice(0, 3) : ["Optimization scan available."]).map((win) => (
                          <div key={win} className="flex items-start gap-4 rounded-2xl bg-muted/20 p-4 border border-border/50">
                            <Lightbulb className="h-4 w-4 shrink-0 text-amber-500 mt-0.5" />
                            <p className="text-xs font-medium leading-relaxed text-muted-foreground">{win}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex h-56 flex-col items-center justify-center text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-muted/20 text-muted-foreground/50 mb-6">
                    <Target className="h-8 w-8" />
                  </div>
                  <h3 className="text-lg font-black text-primary">No ATS intelligence yet</h3>
                  <p className="mt-2 text-sm font-medium text-muted-foreground max-w-sm">Benchmark your resume against a job role to see feedback here.</p>
                  <Button asChild className="mt-6 rounded-xl font-bold"><Link href="/ats">Run Benchmark</Link></Button>
                </div>
              )}
            </div>
          </BentoCard>

          {/* Application Board */}
          <BentoCard className="p-8">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between mb-8">
              <div className="space-y-1">
                <CardTitle className="text-2xl font-black text-primary">Live tracker</CardTitle>
                <CardDescription className="text-sm font-medium">Manage tracked roles and current interview pipeline.</CardDescription>
              </div>
              <div className="flex flex-wrap gap-1.5 rounded-2xl bg-muted/30 p-1">
                {(["all", "started", "applied", "interviewing", "offer"] as const).map((filter) => (
                  <Button
                    key={filter}
                    size="sm"
                    variant={pipelineFilter === filter ? "secondary" : "ghost"}
                    className={cn(
                      "rounded-xl px-3 font-black capitalize transition-all",
                      pipelineFilter === filter ? "bg-white text-primary shadow-sm hover:bg-white" : "text-muted-foreground/80 hover:bg-muted/30 hover:text-primary"
                    )}
                    onClick={() => setPipelineFilter(filter)}
                  >
                    {filter === "all" ? "All" : JOB_STATUS_CONFIG[filter].label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              {filteredJobs.length ? filteredJobs.map((job) => {
                const status = (job.status || "saved") as JobTrackingStatus;
                const source = job.source ? getSafeJobSource(job.source) : null;
                return (
                  <div key={job.id} className="group relative flex flex-col gap-4 overflow-hidden rounded-[2rem] border border-border/50 bg-[#FAFBFD] p-6 transition-all hover:bg-white hover:border-primary/20 hover:shadow-lg md:flex-row md:items-center md:justify-between">
                    <div className="absolute left-0 top-0 h-full w-1.5 transition-colors group-hover:bg-primary/20" />
                    <div className="min-w-0 flex-1 space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className={cn("rounded-full px-3 py-1 text-[0.6rem] font-black uppercase tracking-[0.14em] border-none shadow-sm", JOB_STATUS_CONFIG[status].chipClassName)}>
                          {JOB_STATUS_CONFIG[status].label}
                        </Badge>
                        {source && <Badge variant="outline" className={cn("rounded-full px-3 py-1 text-[0.6rem] font-bold uppercase tracking-[0.12em] border-none bg-muted/40", JOB_SOURCE_CONFIG[source].badgeClassName)}>{JOB_SOURCE_CONFIG[source].shortLabel}</Badge>}
                      </div>
                      <div>
                        <p className="truncate text-xl font-black tracking-tight text-primary">{job.role}</p>
                        <p className="text-sm font-bold text-muted-foreground/80">{job.company}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-[0.7rem] font-bold uppercase tracking-widest text-muted-foreground/60">
                        <span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />{job.location || "Location N/A"}</span>
                        <span className="inline-flex items-center gap-1.5"><History className="h-3.5 w-3.5" />{formatTime(job.updatedAt)}</span>
                      </div>
                    </div>
                    <div className="flex gap-2.5">
                      <Button variant="ghost" size="sm" asChild className="rounded-xl font-black text-primary hover:bg-primary/5"><Link href="/tracker">View in tracker</Link></Button>
                      {job.sourceUrl && (
                        <Button variant="outline" size="sm" asChild className="rounded-xl bg-white border border-border text-primary font-black shadow-sm hover:bg-muted/20">
                          <a href={job.sourceUrl} target="_blank" rel="noreferrer">Role Source <ArrowUpRight className="ml-1.5 h-3.5 w-3.5 opacity-70" /></a>
                        </Button>
                      )}
                    </div>
                  </div>
                )
              }) : (
                <div className="flex flex-col items-center justify-center rounded-[2rem] border-2 border-dashed border-border/50 bg-muted/5 p-12 text-center">
                  <div className="h-14 w-14 rounded-3xl bg-muted/20 flex items-center justify-center text-muted-foreground/40 mb-4">
                    <Layers3 className="h-7 w-7" />
                  </div>
                  <h3 className="text-lg font-black text-primary">No active tracking</h3>
                  <p className="text-sm font-medium text-muted-foreground mt-2 max-w-sm">Use the jobs workspace to discover roles and start your pipeline tracking.</p>
                  <Button asChild className="mt-8 rounded-xl font-bold shadow-lg shadow-primary/10"><Link href="/jobs">Discover Jobs</Link></Button>
                </div>
              )}
            </div>
          </BentoCard>
        </div>

        {/* RIGHT COLUMN: Sidebar Stats & Health */}
        <div className="space-y-6 lg:col-span-4">
          
          {/* Readiness Bento Card */}
          <BentoCard glow className="p-8">
            <div className="space-y-2">
              <CardTitle className="flex items-center gap-2.5 text-xl font-black text-primary">
                <Gauge className="h-5 w-5 text-accent" />
                Momentum
              </CardTitle>
              <CardDescription className="text-sm font-medium">Daily search hygiene and readiness score.</CardDescription>
            </div>
            
            <div className="mt-10 flex flex-col items-center justify-center space-y-6">
              <CircularGauge value={readinessScore} />
              <div className="text-center">
                <p className="text-[0.68rem] font-black uppercase tracking-[0.2em] text-muted-foreground/70 mb-1">Ready to Apply</p>
                <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/5 text-emerald-600">
                  <TrendingUp className="h-3.5 w-3.5" />
                  <span className="text-[0.64rem] font-black uppercase tracking-wider italic">+12.5% this week</span>
                </div>
              </div>
            </div>

            <div className="mt-10 space-y-3">
              {checklist.map((item) => (
                <Link key={item.label} href={item.href} className="flex items-center justify-between rounded-2xl border border-border/40 bg-muted/10 px-4 py-3 transition-all hover:bg-white hover:border-primary/20 hover:shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className={cn("flex h-8 w-8 items-center justify-center rounded-full shadow-sm ring-2 ring-white", item.done ? "bg-emerald-50 text-emerald-600" : "bg-muted text-muted-foreground/50")}>
                      {item.done ? <CheckCircle2 className="h-4 w-4" /> : <Clock3 className="h-4 w-4" />}
                    </div>
                    <span className={cn("text-xs font-bold tracking-tight", item.done ? "text-primary" : "text-muted-foreground")}>{item.label}</span>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/30" />
                </Link>
              ))}
            </div>
          </BentoCard>

          {/* Quick Assets */}
          <BentoCard className="p-8">
            <div className="space-y-6">
              <div className="space-y-1">
                <CardTitle className="flex items-center gap-2.5 text-xl font-black text-primary">
                  <ClipboardList className="h-5 w-5 text-secondary" />
                  Materials
                </CardTitle>
                <CardDescription className="text-sm font-medium">Latest workspace assets.</CardDescription>
              </div>

              <div className="grid gap-4">
                <div className="rounded-3xl border border-border/50 bg-[#FAFBFD] p-5 hover:bg-white transition-colors">
                  <p className="text-[0.6rem] font-bold uppercase tracking-widest text-muted-foreground/80 mb-3">CV Draft</p>
                  {latestResume ? (
                    <div className="space-y-3">
                      <p className="text-lg font-black tracking-tight text-primary leading-none">{latestResume.name}</p>
                      <Badge variant="secondary" className="rounded-full bg-secondary/5 text-secondary border-none px-3 text-[0.62rem] font-bold uppercase tracking-wider">{getTemplateConfig(latestResume.templateId).name}</Badge>
                    </div>
                  ) : <p className="text-sm font-bold text-muted-foreground/40 italic">No resume loaded</p>}
                </div>
                
                <div className="rounded-3xl border border-border/50 bg-[#FAFBFD] p-5 hover:bg-white transition-colors">
                  <p className="text-[0.6rem] font-bold uppercase tracking-widest text-muted-foreground/80 mb-3">ATS Score</p>
                  {latestReport ? (
                    <div className="flex items-end gap-3">
                      <p className={cn("text-3xl font-black tracking-tighter", scoreTone(latestScore))}>{latestScore}%</p>
                      <span className="pb-1 text-[0.6rem] font-black uppercase text-muted-foreground/60 tracking-widest leading-none">Best Match</span>
                    </div>
                  ) : <p className="text-sm font-bold text-muted-foreground/40 italic">No score available</p>}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" asChild className="rounded-xl font-bold h-10 border-border/60 hover:bg-muted/50"><Link href="/editor">Builder</Link></Button>
                <Button variant="outline" asChild className="rounded-xl font-bold h-10 border-border/60 hover:bg-muted/50"><Link href="/ats">ATS Center</Link></Button>
              </div>
            </div>
          </BentoCard>

          {/* Usage Stats (Glass) */}
          <BentoCard className="p-8">
            <div className="space-y-6">
              <div className="space-y-1">
                <CardTitle className="flex items-center gap-2.5 text-xl font-black text-primary">
                  <Zap className="h-5 w-5 text-accent" />
                  Workspace
                </CardTitle>
                <CardDescription className="text-sm font-medium">Capacity and activity.</CardDescription>
              </div>

              <div className="space-y-5">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[0.6rem] font-bold uppercase tracking-[0.2em] text-muted-foreground/60">
                    <span>AI Intensity</span>
                    <span className="text-primary">{profile?.usage?.aiGenerations || 0} / {PLAN_LIMITS[(profile?.plan as PlanType) || "free"].aiGenerations}</span>
                  </div>
                  <Progress value={((profile?.usage?.aiGenerations || 0) / PLAN_LIMITS[(profile?.plan as PlanType) || "free"].aiGenerations) * 100} className="h-1.5 bg-primary/10" />
                </div>
                
                <ActivityTimeline activities={(recentJobs || []).slice(0, 4)} />
              </div>
            </div>
          </BentoCard>

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
  readinessScore,
  primaryAction,
  actionCards,
  statCards,
  checklist,
  filteredJobs,
  pipelineStages,
  keywordCoverage,
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
  readinessScore: number
  primaryAction: ActionCard
  actionCards: ActionCard[]
  statCards: Array<{ label: string; value: string; icon: LucideIcon; color: string; href: string }>
  checklist: Array<{ label: string; done: boolean; href: string }>
  filteredJobs: DashboardJob[]
  pipelineStages: Array<{ status: JobTrackingStatus; count: number }>
  keywordCoverage: number
  recentJobs: DashboardJob[]
}) {
  return (
    <div className="space-y-4 px-4 pb-24 pt-4">
      {/* Mobile Hero */}
      <section className="overflow-hidden rounded-[2rem] border border-white/80 bg-white/70 p-6 shadow-xl backdrop-blur-xl">
        <div className="eyebrow-chip text-[0.6rem] py-1 border-glow-primary bg-primary/5 text-primary">
          <Sparkles className="h-3 w-3" />
          Dashboard
        </div>
        <h1 className="mt-4 text-[1.8rem] font-black leading-none tracking-tighter text-primary">
          Your search <span className="logo-gradient">center</span>.
        </h1>
        <p className="mt-3 text-sm font-medium leading-relaxed text-muted-foreground">
          {profile?.targetRoles ? `Optimizing for ${profile.targetRoles}.` : "Your command center is ready."}
        </p>
        <div className="mt-6 space-y-3">
          <Button asChild className="h-12 w-full rounded-2xl bg-primary font-black shadow-lg shadow-primary/20">
            <Link href={primaryAction.href}>{primaryAction.cta}<ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
          <Button asChild className="h-12 w-full rounded-2xl bg-white border-2 border-primary/10 text-primary font-black shadow-sm group">
            <Link href="/onboarding/upload">
              <Upload className="mr-2 h-4 w-4 text-accent transition-transform group-hover:scale-110" />
              Upload CV
            </Link>
          </Button>
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" asChild className="h-11 rounded-2xl font-bold bg-white/50"><Link href="/editor">Builder</Link></Button>
            <Button variant="outline" asChild className="h-11 rounded-2xl font-bold bg-white/50"><Link href="/jobs">Jobs</Link></Button>
          </div>
        </div>
      </section>

      {/* Basic Stats */}
      <div className="grid grid-cols-2 gap-3">
        {statCards.map((stat) => (
          <Link key={stat.label} href={stat.href}>
            <BentoCard className="p-4 rounded-[1.5rem]">
               <stat.icon className={cn("h-5 w-5", stat.color)} />
               <p className="mt-4 text-[0.55rem] font-black uppercase tracking-widest text-muted-foreground">{stat.label}</p>
               <p className={cn("mt-1 text-2xl font-black tracking-tight", stat.color)}>{stat.value}</p>
            </BentoCard>
          </Link>
        ))}
      </div>

      {/* Focus Board (Mobile) */}
      <BentoCard className="p-5 rounded-[2rem]">
        <div className="flex items-center justify-between gap-4 mb-4">
          <p className="text-lg font-black text-primary">Focus board</p>
          <div className="flex gap-1 rounded-xl bg-muted/40 p-1">
            {(["command", "pipeline", "ats"] as InsightView[]).map((v) => (
              <button key={v} onClick={() => setInsightView(v)} className={cn("rounded-lg px-2 py-1 text-[0.6rem] font-black uppercase tracking-wider transition-all", insightView === v ? "bg-white text-primary shadow-sm" : "text-muted-foreground/60")}>{v}</button>
            ))}
          </div>
        </div>

        <div className="min-h-[160px]">
          {insightView === "command" ? (
            <div className="space-y-4">
              <div className="rounded-2xl bg-primary/5 p-4 border border-primary/10">
                <p className="text-[0.6rem] font-black uppercase tracking-widest text-primary/70 mb-2">Next Best move</p>
                <p className="font-black text-primary leading-tight text-lg">{primaryAction.title}</p>
                <Button asChild className="mt-4 h-9 w-full rounded-xl bg-primary text-xs font-black shadow-md"><Link href={primaryAction.href}>{primaryAction.cta}</Link></Button>
              </div>
            </div>
          ) : insightView === "pipeline" ? (
             <div className="grid grid-cols-2 gap-3">
              {pipelineStages.slice(0, 4).map((s) => (
                <Link key={s.status} href="/tracker" className="rounded-2xl border border-border/40 bg-muted/5 p-4">
                  <span className={cn("text-[0.55rem] font-black uppercase tracking-widest", scoreTone(s.count > 0 ? 100 : 0))}>{JOB_STATUS_CONFIG[s.status].label}</span>
                  <p className="mt-1 text-2xl font-black text-primary">{s.count}</p>
                </Link>
              ))}
            </div>
          ) : latestReport ? (
            <div className="rounded-2xl bg-emerald-500/5 p-4 border border-emerald-500/10 text-center">
              <p className="text-[0.6rem] font-black uppercase tracking-widest text-emerald-600/70 mb-2">ATS Score</p>
              <p className={cn("text-4xl font-black tracking-tighter", scoreTone(latestScore))}>{latestScore}%</p>
              <Button asChild variant="ghost" className="mt-4 h-9 font-black text-emerald-600 hover:bg-emerald-500/10"><Link href="/ats">Open Optimizer</Link></Button>
            </div>
          ) : <p className="text-center py-8 text-sm text-muted-foreground font-medium italic">No scan intelligence yet.</p>}
        </div>
      </BentoCard>

      {/* Application List (Mobile) */}
      <BentoCard className="p-5 rounded-[2rem]">
         <p className="text-lg font-black text-primary mb-4">Live roles</p>
         <div className="space-y-4">
            {recentJobs.length ? recentJobs.slice(0, 3).map((job) => (
              <div key={job.id} className="rounded-2xl border border-border/40 bg-[#FAFBFD] p-4">
                <div className="flex items-center justify-between mb-2">
                   <Badge variant="outline" className={cn("rounded-full px-2 py-0.5 text-[0.55rem] font-black uppercase border-none", JOB_STATUS_CONFIG[job.status || "saved"].chipClassName)}>{JOB_STATUS_CONFIG[job.status || "saved"].label}</Badge>
                   <span className="text-[0.6rem] font-bold text-muted-foreground/50">{formatTime(job.updatedAt)}</span>
                </div>
                <p className="text-base font-black tracking-tight text-primary leading-tight">{job.role}</p>
                <p className="text-xs font-bold text-muted-foreground/70">{job.company}</p>
              </div>
            )) : <p className="text-sm text-center py-4 text-muted-foreground italic">No jobs tracked yet.</p>}
            <Button variant="secondary" asChild className="w-full h-10 rounded-xl bg-primary/5 text-primary text-xs font-black uppercase tracking-widest border-none hover:bg-primary/10 shadow-none"><Link href="/tracker">Open Full Tracker</Link></Button>
         </div>
      </BentoCard>

      {/* Momentum (Mobile) */}
      <BentoCard className="p-5 rounded-[2rem]">
        <div className="flex items-center justify-between gap-4 mb-6">
           <p className="text-lg font-black text-primary">Momentum</p>
           <span className="text-2xl font-black text-primary tracking-tighter">{readinessScore}%</span>
        </div>
        <div className="space-y-3">
          {checklist.map((item) => (
            <div key={item.label} className="flex items-center justify-between rounded-xl bg-muted/20 px-4 py-3">
               <div className="flex items-center gap-3">
                  <div className={cn("h-6 w-6 rounded-full flex items-center justify-center", item.done ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground/30")}>
                    {item.done ? <CheckCircle2 className="h-3 w-3" /> : <Clock3 className="h-3 w-3" />}
                  </div>
                  <span className="text-xs font-bold text-primary tracking-tight">{item.label}</span>
               </div>
            </div>
          ))}
        </div>
      </BentoCard>
    </div>
  )
}
