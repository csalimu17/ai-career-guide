"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Search,
  ShieldAlert,
  Sparkles,
  Zap,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

type SignalTone = "healthy" | "warning" | "critical"

type QualitySnapshot = {
  generatedAt: string
  overallStatus: SignalTone
  checks: Array<{
    id: string
    title: string
    status: SignalTone
    summary: string
    metrics: Array<{ label: string; value: string }>
    autoFixes: string[]
  }>
  recentSignals: Array<{
    id: string
    category: string
    eventType: string
    status: SignalTone
    summary: string
    createdAt: string | null
  }>
}

const toneBadgeClass: Record<SignalTone, string> = {
  healthy: "border-emerald-100 bg-emerald-50 text-emerald-700",
  warning: "border-amber-100 bg-amber-50 text-amber-700",
  critical: "border-rose-100 bg-rose-50 text-rose-700",
}

function metricToPercent(value: string) {
  if (value.includes("%")) {
    return Math.max(0, Math.min(100, Number.parseInt(value, 10) || 0))
  }

  const numeric = Number.parseInt(value, 10)
  if (!Number.isFinite(numeric)) return 0
  return Math.max(8, Math.min(100, numeric))
}

export default function IngestionHealthPage() {
  const [snapshot, setSnapshot] = useState<QualitySnapshot | null>(null)
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading")
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [search, setSearch] = useState("")
  const [activeTone, setActiveTone] = useState<"all" | SignalTone>("all")

  const loadSnapshot = useCallback(async (showRefresh = false) => {
    if (showRefresh) {
      setIsRefreshing(true)
    } else if (!snapshot) {
      setStatus("loading")
    }

    try {
      const response = await fetch("/api/diagnostics/quality-engineer", { cache: "no-store" })
      const payload = await response.json()

      if (payload?.ok && payload.snapshot) {
        setSnapshot(payload.snapshot as QualitySnapshot)
        setStatus("ready")
      } else {
        setStatus("error")
      }
    } catch (error) {
      console.error("Failed to load ingestion health snapshot:", error)
      setStatus("error")
    } finally {
      setIsRefreshing(false)
    }
  }, [snapshot])

  useEffect(() => {
    void loadSnapshot()

    const interval = window.setInterval(() => {
      void loadSnapshot(true)
    }, 45000)

    return () => window.clearInterval(interval)
  }, [loadSnapshot])

  const filteredSignals = useMemo(() => {
    const normalized = search.trim().toLowerCase()

    return (snapshot?.recentSignals || []).filter((signal) => {
      const matchesTone = activeTone === "all" || signal.status === activeTone
      const matchesSearch =
        !normalized ||
        signal.summary.toLowerCase().includes(normalized) ||
        signal.category.toLowerCase().includes(normalized) ||
        signal.eventType.toLowerCase().includes(normalized)

      return matchesTone && matchesSearch
    })
  }, [activeTone, search, snapshot])

  const extractionCheck = snapshot?.checks.find((check) => check.id === "extraction")
  const uploadCheck = snapshot?.checks.find((check) => check.id === "upload")
  const editorCheck = snapshot?.checks.find((check) => check.id === "editor")
  const printCheck = snapshot?.checks.find((check) => check.id === "print")

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 rounded-full border border-secondary/20 bg-secondary/5 px-3 py-1 text-[0.65rem] font-bold uppercase tracking-[0.2em] text-secondary">
            <ShieldAlert className="h-3.5 w-3.5" /> Security & Quality
          </div>
          <h1 className="text-3xl font-black tracking-tight text-primary sm:text-4xl">Ingestion Health</h1>
          <p className="max-w-2xl text-muted-foreground">
            Live monitoring for CV upload, extraction recovery, editor export stability, and print quality across the app.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="rounded-xl border-2 font-bold" onClick={() => void loadSnapshot(true)}>
            <RefreshCw className={cn("mr-2 h-4 w-4", isRefreshing && "animate-spin")} />
            Sync metrics
          </Button>
        </div>
      </header>

      {status === "loading" ? (
        <Card className="border-none bg-white shadow-sm ring-1 ring-black/[0.03]">
          <CardContent className="flex items-center gap-3 p-6 text-sm font-medium text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading ingestion monitor data...
          </CardContent>
        </Card>
      ) : null}

      {status === "error" ? (
        <Card className="border-none bg-white shadow-sm ring-1 ring-black/[0.03]">
          <CardContent className="flex flex-col gap-4 p-6">
            <div className="flex items-start gap-3 text-rose-700">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
              <div>
                <p className="text-sm font-black uppercase tracking-[0.16em]">Monitor unavailable</p>
                <p className="mt-1 text-sm font-medium text-rose-700/80">
                  The ingestion dashboard could not load the latest runtime diagnostics. The app safeguards still run, but the admin view needs attention.
                </p>
              </div>
            </div>
            <div>
              <Button className="rounded-xl font-bold" onClick={() => void loadSnapshot(true)}>
                Retry monitor
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {snapshot ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[
              {
                title: "Overall status",
                value: snapshot.overallStatus.toUpperCase(),
                description: snapshot.generatedAt ? `Updated ${new Date(snapshot.generatedAt).toLocaleString()}` : "Waiting for timestamp",
                tone: snapshot.overallStatus,
                icon: Sparkles,
              },
              {
                title: "Upload intake",
                value: uploadCheck?.status.toUpperCase() || "UNKNOWN",
                description: uploadCheck?.summary || "Upload diagnostics unavailable.",
                tone: uploadCheck?.status || "warning",
                icon: Zap,
              },
              {
                title: "Extraction pipeline",
                value: extractionCheck?.status.toUpperCase() || "UNKNOWN",
                description: extractionCheck?.summary || "Extraction diagnostics unavailable.",
                tone: extractionCheck?.status || "warning",
                icon: CheckCircle2,
              },
              {
                title: "Editor & print",
                value: editorCheck?.status === "healthy" && printCheck?.status === "healthy" ? "HEALTHY" : "ATTENTION",
                description: printCheck?.summary || editorCheck?.summary || "Editor diagnostics unavailable.",
                tone:
                  editorCheck?.status === "critical" || printCheck?.status === "critical"
                    ? "critical"
                    : editorCheck?.status === "warning" || printCheck?.status === "warning"
                    ? "warning"
                    : "healthy",
                icon: ShieldAlert,
              },
            ].map((item) => (
              <Card key={item.title} className="border-none bg-white shadow-sm ring-1 ring-black/[0.03]">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between gap-3">
                    <CardDescription className="text-[0.6rem] font-bold uppercase tracking-[0.18em]">{item.title}</CardDescription>
                    <div className={cn("flex h-10 w-10 items-center justify-center rounded-2xl", item.tone === "healthy" ? "bg-emerald-50 text-emerald-600" : item.tone === "warning" ? "bg-amber-50 text-amber-600" : "bg-rose-50 text-rose-600")}>
                      <item.icon className="h-4 w-4" />
                    </div>
                  </div>
                  <CardTitle className="text-2xl font-black text-primary">{item.value}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed text-muted-foreground">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
            <Card className="border-none bg-white shadow-sm ring-1 ring-black/[0.03]">
              <CardHeader className="space-y-4 p-6">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="space-y-1.5">
                    <CardTitle className="text-xl font-black tracking-tight">Recent Ingestion Signals</CardTitle>
                    <CardDescription>Real extraction events from the live runtime monitor, not mock data.</CardDescription>
                  </div>
                  <div className="relative w-full md:max-w-[260px]">
                    <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Search signals..."
                      className="rounded-xl border-border/70 pl-9"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {(["all", "healthy", "warning", "critical"] as const).map((tone) => (
                    <Button
                      key={tone}
                      type="button"
                      variant={activeTone === tone ? "default" : "outline"}
                      className="rounded-full text-xs font-bold uppercase tracking-[0.16em]"
                      onClick={() => setActiveTone(tone)}
                    >
                      {tone}
                    </Button>
                  ))}
                </div>
              </CardHeader>

              <CardContent className="space-y-3 p-6 pt-0">
                {filteredSignals.length ? (
                  filteredSignals.map((signal) => (
                    <div key={signal.id} className="rounded-2xl border border-border/70 bg-slate-50/60 p-4">
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="outline" className={toneBadgeClass[signal.status]}>
                              {signal.status.toUpperCase()}
                            </Badge>
                            <span className="text-[0.65rem] font-black uppercase tracking-[0.18em] text-muted-foreground">
                              {signal.category} / {signal.eventType}
                            </span>
                          </div>
                          <p className="text-sm font-medium leading-relaxed text-primary">{signal.summary}</p>
                        </div>
                        <span className="text-xs font-medium text-muted-foreground">
                          {signal.createdAt ? new Date(signal.createdAt).toLocaleString() : "Pending timestamp"}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-border/80 bg-slate-50/50 p-8 text-center">
                    <p className="text-sm font-semibold text-muted-foreground">
                      No signals matched this filter yet. Recent uploads, extraction fallbacks, and editor exports will appear here automatically.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="space-y-6">
              {(snapshot.checks || []).map((check) => (
                <Card key={check.id} className="border-none bg-white shadow-sm ring-1 ring-black/[0.03]">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <CardTitle className="text-lg font-black">{check.title}</CardTitle>
                        <CardDescription>{check.summary}</CardDescription>
                      </div>
                      <Badge variant="outline" className={toneBadgeClass[check.status]}>
                        {check.status.toUpperCase()}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="space-y-3">
                      {check.metrics.map((metric) => (
                        <div key={`${check.id}-${metric.label}`} className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold uppercase tracking-[0.16em] text-muted-foreground">{metric.label}</span>
                            <span className="font-black text-primary">{metric.value}</span>
                          </div>
                          <Progress value={metricToPercent(metric.value)} className="h-1.5 bg-muted/50" />
                        </div>
                      ))}
                    </div>

                    <div className="space-y-2">
                      <p className="text-[0.65rem] font-black uppercase tracking-[0.18em] text-muted-foreground">Safeguards in place</p>
                      {check.autoFixes.map((fix) => (
                        <div key={`${check.id}-${fix}`} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                          <span>{fix}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </>
      ) : null}
    </div>
  )
}
