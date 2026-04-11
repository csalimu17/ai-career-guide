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

const desktopHeroButtonBase = "group h-14 rounded-[1.5rem] px-5 text-[0.95rem] font-black tracking-tight transition-all duration-300"
const desktopSegmentButtonBase = "h-10 rounded-[1.1rem] px-4 font-black capitalize tracking-tight transition-all duration-300"
const desktopActionButtonBase = "group h-11 rounded-[1.1rem] px-4 font-black tracking-tight transition-all duration-300"
const desktopUtilityButtonBase = "group h-10 rounded-[1.1rem] px-4 font-black tracking-tight transition-all duration-300"
const dashboardChipBase = "rounded-full border border-border/50 bg-white/80 px-3 py-1.5 text-[0.62rem] font-black uppercase tracking-[0.18em] shadow-[0_8px_20px_-16px_rgba(15,23,42,0.28)] transition-all"

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
    { title: latestResume ? "Update your CV" : "Build your first draft", description: latestResume ? "Switch templates, improve copy, and keep your strongest version current." : "Create a polished base version you can tailor role by role.", href: latestResume ? "/editor" : "/onboarding", cta: latestResume ? "Open builder" : "Build resume", icon: FileText, variant: "primary" },
    { title: activePipelineCount > 0 ? "Work the active pipeline" : "Discover fresh roles", description: activePipelineCount > 0 ? "Review statuses, confirm external applies, and keep momentum visible." : "Search curated opportunities and start tracked external apply flows.", href: activePipelineCount > 0 ? "/tracker" : "/jobs", cta: activePipelineCount > 0 ? "Open tracker" : "Browse jobs", icon: activePipelineCount > 0 ? Layers3 : Briefcase, variant: "secondary" },
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
        
        <div className="flex flex-col gap-7 p-8 md:p-12 xl:flex-row xl:items-center xl:justify-between">
          <div className="space-y-5 xl:flex-1">
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
              {profile?.targetRoles && <Badge variant="secondary" className={cn(dashboardChipBase, "border-primary/10 bg-primary/5 text-primary")}>{profile.targetRoles}</Badge>}
              <Badge variant="outline" className={cn(dashboardChipBase, "border-border/80 bg-white/50 backdrop-blur-sm text-muted-foreground")}>{(profile?.plan || "free").toUpperCase()} WORKSPACE</Badge>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3 xl:shrink-0">
            <Button
              variant="outline"
              asChild
              className={cn(
                desktopHeroButtonBase,
                "border border-slate-200/80 bg-white/92 text-primary shadow-[0_24px_50px_-32px_rgba(15,23,42,0.38)] hover:-translate-y-0.5 hover:border-primary/20 hover:bg-white hover:shadow-[0_32px_60px_-34px_rgba(15,23,42,0.42)]"
              )}
            >
              <Link href="/onboarding/upload">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/6 text-primary ring-1 ring-primary/10 transition-transform duration-300 group-hover:scale-110 group-hover:bg-primary/10">
                  <Upload className="h-4.5 w-4.5" />
                </span>
                <span>Upload CV</span>
              </Link>
            </Button>
            <Button
              asChild
              className={cn(
                desktopHeroButtonBase,
                "pl-5 pr-4 shadow-[0_30px_70px_-34px_rgba(124,58,237,0.58)] hover:-translate-y-0.5 hover:brightness-105 hover:shadow-[0_38px_80px_-36px_rgba(124,58,237,0.65)]"
              )}
            >
              <Link href="/jobs">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/14 text-white ring-1 ring-white/20 transition-transform duration-300 group-hover:scale-110">
                  <Search className="h-4.5 w-4.5" />
                </span>
                <span>Find Jobs</span>
                <ArrowRight className="ml-1 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
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
              <div className="flex gap-1.5 rounded-[1.35rem] border border-border/50 bg-white/85 p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
                {(["command", "pipeline", "ats"] as InsightView[]).map((view) => (
                  <Button
                    key={view}
                    size="sm"
                    variant={insightView === view ? "secondary" : "ghost"}
                    className={cn(
                      desktopSegmentButtonBase,
                      insightView === view
                      ? "brand-gradient-bg text-white shadow-[0_18px_44px_-28px_rgba(124,58,237,0.58)] hover:brightness-105"
                      : "bg-white/0 text-muted-foreground/80 hover:bg-white hover:text-primary hover:shadow-sm"
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
                      <Button
                        asChild
                        className={cn(
                          desktopActionButtonBase,
                          "mt-1 rounded-[1.15rem] pl-5 pr-4 shadow-[0_24px_60px_-32px_rgba(124,58,237,0.56)] hover:-translate-y-0.5 hover:shadow-[0_30px_70px_-32px_rgba(124,58,237,0.62)]"
                        )}
                      >
                        <Link href={primaryAction.href}>
                          <span>{primaryAction.cta}</span>
                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/14 ring-1 ring-white/20 transition-transform duration-300 group-hover:scale-110">
                            <ArrowRight className="h-4 w-4" />
                          </span>
                        </Link>
                      </Button>
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    {actionCards.map((action) => (
                      <Link
                        key={action.title}
                        href={action.href}
                        className="group flex min-h-[132px] flex-col justify-between rounded-3xl border border-border/40 bg-muted/10 p-5 transition-all hover:-translate-y-0.5 hover:border-primary/20 hover:bg-white hover:shadow-md"
                      >
                        <div className="flex items-start gap-4">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-primary shadow-sm ring-1 ring-black/5 transition-transform group-hover:scale-110">
                            <action.icon className="h-6 w-6" />
                          </div>
                          <div className="min-w-0 space-y-1">
                            <p className="font-black text-primary tracking-tight">{action.title}</p>
                            <p className="text-xs font-medium leading-relaxed text-muted-foreground">{action.description}</p>
                          </div>
                        </div>

                        <div className="mt-4 flex items-center justify-between">
                          <span className="text-[0.62rem] font-black uppercase tracking-[0.18em] text-primary/55">
                            {action.variant === "primary" ? "Recommended" : "Quick action"}
                          </span>
                          <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-[0.68rem] font-black uppercase tracking-[0.16em] text-primary shadow-sm ring-1 ring-black/5 transition-transform group-hover:translate-x-0.5">
                            {action.cta}
                            <ArrowRight className="h-3.5 w-3.5" />
                          </span>
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
                  <Button
                    asChild
                    className={cn(
                      desktopActionButtonBase,
                      "mt-6 rounded-[1.1rem] pl-5 pr-4 shadow-[0_22px_54px_-34px_rgba(124,58,237,0.5)] hover:-translate-y-0.5 hover:shadow-[0_28px_64px_-34px_rgba(124,58,237,0.56)]"
                    )}
                  >
                    <Link href="/ats">
                      <span>Run Benchmark</span>
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/14 ring-1 ring-white/20 transition-transform duration-300 group-hover:scale-110">
                        <ArrowRight className="h-4 w-4" />
                      </span>
                    </Link>
                  </Button>
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
              <div className="flex flex-wrap gap-1.5 rounded-[1.35rem] border border-border/50 bg-white/85 p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
                {(["all", "started", "applied", "interviewing", "offer"] as const).map((filter) => (
                  <Button
                    key={filter}
                    size="sm"
                    variant={pipelineFilter === filter ? "secondary" : "ghost"}
                    className={cn(
                      desktopSegmentButtonBase,
                      pipelineFilter === filter
                      ? "brand-gradient-bg text-white shadow-[0_18px_44px_-28px_rgba(124,58,237,0.58)] hover:brightness-105"
                      : "bg-white/0 text-muted-foreground/80 hover:bg-white hover:text-primary hover:shadow-sm"
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
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                        className={cn(
                          desktopUtilityButtonBase,
                          "bg-primary/[0.04] text-primary hover:-translate-y-0.5 hover:bg-primary/[0.08] hover:text-primary"
                        )}
                      >
                        <Link href="/tracker">
                          <span>View in tracker</span>
                          <ChevronRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                        </Link>
                      </Button>
                      {job.sourceUrl && (
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                          className={cn(
                            desktopUtilityButtonBase,
                            "border border-border/80 bg-white text-primary shadow-[0_18px_42px_-30px_rgba(15,23,42,0.32)] hover:-translate-y-0.5 hover:border-primary/20 hover:bg-white hover:shadow-[0_24px_52px_-30px_rgba(15,23,42,0.4)]"
                          )}
                        >
                          <a href={job.sourceUrl} target="_blank" rel="noreferrer">
                            <span>Role Source</span>
                            <ArrowUpRight className="h-4 w-4 opacity-70 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                          </a>
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
                  <Button
                    asChild
                    className={cn(
                      desktopActionButtonBase,
                      "mt-8 rounded-[1.1rem] pl-5 pr-4 shadow-[0_22px_54px_-34px_rgba(124,58,237,0.5)] hover:-translate-y-0.5 hover:shadow-[0_28px_64px_-34px_rgba(124,58,237,0.56)]"
                    )}
                  >
                    <Link href="/jobs">
                      <span>Discover Jobs</span>
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/14 ring-1 ring-white/20 transition-transform duration-300 group-hover:scale-110">
                        <ArrowRight className="h-4 w-4" />
                      </span>
                    </Link>
                  </Button>
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
                <Button
                  variant="outline"
                  asChild
                  className="group h-14 justify-start rounded-[1.2rem] border-border/70 bg-white/90 px-4 text-left shadow-[0_20px_48px_-32px_rgba(15,23,42,0.32)] transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/20 hover:bg-white hover:shadow-[0_28px_60px_-34px_rgba(15,23,42,0.38)]"
                >
                  <Link href="/editor">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/6 text-primary ring-1 ring-primary/10 transition-transform duration-300 group-hover:scale-110">
                      <FileText className="h-4.5 w-4.5" />
                    </span>
                    <span className="flex flex-col items-start leading-none">
                      <span className="text-sm font-black tracking-tight text-primary">Builder</span>
                      <span className="mt-1 text-[0.58rem] font-bold uppercase tracking-[0.18em] text-muted-foreground/70">Resume edits</span>
                    </span>
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  asChild
                  className="group h-14 justify-start rounded-[1.2rem] border-border/70 bg-white/90 px-4 text-left shadow-[0_20px_48px_-32px_rgba(15,23,42,0.32)] transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/20 hover:bg-white hover:shadow-[0_28px_60px_-34px_rgba(15,23,42,0.38)]"
                >
                  <Link href="/ats">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary/10 text-secondary ring-1 ring-secondary/15 transition-transform duration-300 group-hover:scale-110">
                      <Target className="h-4.5 w-4.5" />
                    </span>
                    <span className="flex flex-col items-start leading-none">
                      <span className="text-sm font-black tracking-tight text-primary">ATS Center</span>
                      <span className="mt-1 text-[0.58rem] font-bold uppercase tracking-[0.18em] text-muted-foreground/70">Benchmarking</span>
                    </span>
                  </Link>
                </Button>
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
        <h1 className="text-[1.8rem] font-black leading-none tracking-tighter text-primary">
          Your search <span className="logo-gradient">center</span>.
        </h1>
        <p className="mt-3 text-sm font-medium leading-relaxed text-muted-foreground">
          {profile?.targetRoles ? `Optimizing for ${profile.targetRoles}.` : "Your command center is ready."}
        </p>
        <div className="mt-6 space-y-3.5">
          <Button
            asChild
            className="h-auto w-full rounded-[1.7rem] border-0 bg-gradient-to-r from-violet-600 via-fuchsia-500 to-orange-400 px-0 py-0 text-white shadow-[0_18px_40px_-18px_rgba(124,58,237,0.55)] transition-transform duration-300 hover:scale-[1.01] hover:shadow-[0_24px_50px_-20px_rgba(124,58,237,0.65)]"
          >
            <Link href={primaryAction.href} className="flex min-h-[60px] w-full items-center justify-between gap-4 px-4 py-3 text-left">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/18 ring-1 ring-white/20 backdrop-blur-md">
                  <primaryAction.icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[0.95rem] font-black tracking-tight">{primaryAction.cta}</p>
                  <p className="truncate text-[0.68rem] font-bold uppercase tracking-[0.16em] text-white/72">
                    Score match and fix gaps
                  </p>
                </div>
              </div>
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/16 ring-1 ring-white/20">
                <ArrowRight className="h-4.5 w-4.5" />
              </div>
            </Link>
          </Button>

          <Button
            asChild
            variant="outline"
            className="group h-auto w-full rounded-[1.7rem] border border-primary/12 bg-white/88 px-0 py-0 text-primary shadow-[0_14px_32px_-24px_rgba(15,23,42,0.32)] transition-all duration-300 hover:border-primary/20 hover:bg-white"
          >
            <Link href="/onboarding/upload" className="flex min-h-[58px] w-full items-center justify-between gap-4 px-4 py-3 text-left">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/8 text-accent ring-1 ring-primary/10">
                  <Upload className="h-4.5 w-4.5 transition-transform duration-300 group-hover:scale-110" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[0.95rem] font-black tracking-tight text-primary">Upload CV</p>
                  <p className="truncate text-[0.68rem] font-bold uppercase tracking-[0.16em] text-muted-foreground/75">
                    Import PDF, DOCX, or image
                  </p>
                </div>
              </div>
              <ArrowUpRight className="h-4.5 w-4.5 shrink-0 text-primary/55" />
            </Link>
          </Button>

          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              asChild
              className="h-auto rounded-[1.45rem] border border-slate-200/80 bg-white/78 px-0 py-0 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/12 hover:bg-white"
            >
              <Link href="/editor" className="flex min-h-[56px] w-full items-center gap-3 px-4 py-3 text-left">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-primary">
                  <FileText className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[0.9rem] font-black tracking-tight text-slate-900">Builder</p>
                  <p className="truncate text-[0.62rem] font-bold uppercase tracking-[0.14em] text-slate-400">
                    Edit resume
                  </p>
                </div>
              </Link>
            </Button>
            <Button
              variant="outline"
              asChild
              className="h-auto rounded-[1.45rem] border border-slate-200/80 bg-white/78 px-0 py-0 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/12 hover:bg-white"
            >
              <Link href="/jobs" className="flex min-h-[56px] w-full items-center gap-3 px-4 py-3 text-left">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-primary">
                  <Search className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[0.9rem] font-black tracking-tight text-slate-900">Jobs</p>
                  <p className="truncate text-[0.62rem] font-bold uppercase tracking-[0.14em] text-slate-400">
                    Find matches
                  </p>
                </div>
              </Link>
            </Button>
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
          <div className="flex gap-1.5 rounded-2xl border border-border/50 bg-white/80 p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.88)]">
            {(["command", "pipeline", "ats"] as InsightView[]).map((v) => (
              <button
                key={v}
                onClick={() => setInsightView(v)}
                className={cn(
                  "min-h-[34px] rounded-xl px-3 py-2 text-[0.62rem] font-black uppercase tracking-[0.16em] transition-all duration-300 border",
                  insightView === v
                    ? "bg-white text-primary shadow-[0_8px_20px_-12px_rgba(15,23,42,0.3)] ring-1 ring-black/5 border-white"
                    : "text-muted-foreground/65 bg-transparent border-transparent hover:bg-white/70 hover:text-primary hover:border-border/40"
                )}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        <div className="min-h-[160px]">
          {insightView === "command" ? (
            <div className="space-y-4">
              <div className="rounded-2xl bg-primary/5 p-4 border border-primary/10">
                <p className="text-[0.6rem] font-black uppercase tracking-widest text-primary/70 mb-2">Next Best move</p>
                <p className="font-black text-primary leading-tight text-lg">{primaryAction.title}</p>
                <Button
                  asChild
                  className="mt-4 h-11 w-full rounded-2xl bg-primary px-0 text-[0.72rem] font-black uppercase tracking-[0.16em] shadow-[0_16px_30px_-18px_rgba(124,58,237,0.55)]"
                >
                  <Link href={primaryAction.href} className="flex w-full items-center justify-center gap-2 px-4">
                    <primaryAction.icon className="h-4 w-4" />
                    {primaryAction.cta}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          ) : insightView === "pipeline" ? (
             <div className="grid grid-cols-2 gap-3">
              {pipelineStages.slice(0, 4).map((s) => (
                <Link key={s.status} href="/tracker" className="rounded-[1.4rem] border border-border/40 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
                  <span className={cn("text-[0.55rem] font-black uppercase tracking-widest", scoreTone(s.count > 0 ? 100 : 0))}>{JOB_STATUS_CONFIG[s.status].label}</span>
                  <p className="mt-1 text-2xl font-black text-primary">{s.count}</p>
                </Link>
              ))}
            </div>
          ) : latestReport ? (
            <div className="rounded-[1.5rem] bg-emerald-500/5 p-4 border border-emerald-500/10 text-center shadow-[0_16px_34px_-28px_rgba(16,185,129,0.3)]">
              <p className="text-[0.6rem] font-black uppercase tracking-widest text-emerald-600/70 mb-2">ATS Score</p>
              <p className={cn("text-4xl font-black tracking-tighter", scoreTone(latestScore))}>{latestScore}%</p>
              <Button
                asChild
                variant="outline"
                className="mt-4 h-11 rounded-2xl border border-emerald-500/15 bg-white/80 px-0 text-[0.72rem] font-black uppercase tracking-[0.14em] text-emerald-700 shadow-[0_12px_24px_-18px_rgba(16,185,129,0.45)] hover:bg-emerald-500/10 hover:text-emerald-800"
              >
                <Link href="/ats" className="flex w-full items-center justify-center gap-2 px-4">
                  <Target className="h-4 w-4" />
                  Open Optimizer
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          ) : <p className="text-center py-8 text-sm text-muted-foreground font-medium italic">No scan intelligence yet.</p>}
        </div>
      </BentoCard>

      {/* Application List (Mobile) */}
      <BentoCard className="rounded-[2rem] p-5">
         <p className="text-lg font-black text-primary mb-4">Live roles</p>
         <div className="space-y-4">
            {recentJobs.length ? recentJobs.slice(0, 3).map((job) => (
              <div key={job.id} className="rounded-[1.4rem] border border-border/40 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
                <div className="flex items-center justify-between mb-2">
                   <Badge variant="outline" className={cn("rounded-full px-2 py-0.5 text-[0.55rem] font-black uppercase border-none", JOB_STATUS_CONFIG[job.status || "saved"].chipClassName)}>{JOB_STATUS_CONFIG[job.status || "saved"].label}</Badge>
                   <span className="text-[0.6rem] font-bold text-muted-foreground/50">{formatTime(job.updatedAt)}</span>
                </div>
                <p className="text-base font-black tracking-tight text-primary leading-tight">{job.role}</p>
                <p className="text-xs font-bold text-muted-foreground/70">{job.company}</p>
              </div>
            )) : <p className="text-sm text-center py-4 text-muted-foreground italic">No jobs tracked yet.</p>}
            <Button
              variant="secondary"
              asChild
              className="h-11 w-full rounded-2xl border border-primary/10 bg-gradient-to-r from-primary/10 via-primary/5 to-orange-400/10 px-0 text-[0.72rem] font-black uppercase tracking-[0.16em] text-primary shadow-none hover:from-primary/15 hover:to-orange-400/15"
            >
              <Link href="/tracker" className="flex w-full items-center justify-center gap-2 px-4">
                <ClipboardList className="h-4 w-4" />
                Open Full Tracker
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
         </div>
      </BentoCard>

      {/* Momentum (Mobile) */}
      <BentoCard className="rounded-[2rem] p-5">
        <div className="flex items-center justify-between gap-4 mb-6">
           <p className="text-lg font-black text-primary">Momentum</p>
           <span className="text-2xl font-black text-primary tracking-tighter">{readinessScore}%</span>
        </div>
        <div className="space-y-3">
          {checklist.map((item) => (
            <div key={item.label} className="flex items-center justify-between rounded-[1.15rem] border border-border/40 bg-white/80 px-4 py-3 shadow-sm">
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
