"use client"

import Link from "next/link"
import { collection, limit, orderBy, query } from "firebase/firestore"
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  AlertCircle,
  Clock,
  CreditCard,
  Loader2,
  Settings2,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react"
import { BILLING_PLANS } from "@/lib/plans"

const currencyFormatter = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
})

const PLAN_PRICES = Object.fromEntries(
  BILLING_PLANS.map((plan) => [plan.id, Number.parseFloat(plan.price.replace(/[^\d.]/g, "")) || 0])
)

function formatAction(action?: string) {
  if (!action) return "Unknown Event"
  return action
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

export default function AdminDashboardPage() {
  const db = useFirestore()

  const usersQuery = useMemoFirebase(() => query(collection(db, "users")), [db])
  const { data: users, isLoading: loadingUsers } = useCollection(usersQuery)
  const premiumUsers = users?.filter((user) => user.plan === "pro" || user.plan === "master")

  const logsQuery = useMemoFirebase(
    () => query(collection(db, "adminAuditLogs"), orderBy("createdAt", "desc"), limit(10)),
    [db]
  )
  const { data: recentLogs, isLoading: loadingLogs } = useCollection(logsQuery)

  const aiCreditsUsed =
    users?.reduce(
      (acc, user) => acc + (user.usage?.aiGenerations || 0) + (user.usage?.atsChecks || 0),
      0
    ) || 0

  const mrr =
    premiumUsers?.reduce((acc, user) => acc + (PLAN_PRICES[user.plan] || 0), 0) || 0

  const criticalAlerts = [
    ...(users?.filter((user) => user.suspended).length
      ? [{
          tone: "warning" as const,
          label: "Account Review",
          message: `${users.filter((user) => user.suspended).length} suspended accounts need governance review.`,
        }]
      : []),
    ...(!recentLogs?.length
      ? [{
          tone: "info" as const,
          label: "Audit Gap",
          message: "No recent admin events detected. Review governance activity or logging coverage.",
        }]
      : []),
    ...(!premiumUsers?.length
      ? [{
          tone: "warning" as const,
          label: "Revenue Watch",
          message: "No premium subscribers are currently active. Verify pricing, checkout, and webhook health.",
        }]
      : []),
  ]

  const fallbackAlert = {
    tone: "ok" as const,
    label: "Status OK",
    message: "No urgent governance issues detected. Review diagnostics and audit logs for deeper checks.",
  }

  const stats = [
    {
      title: "Total Users",
      value: loadingUsers ? "..." : users?.length.toLocaleString() || "0",
      caption: "Live user records",
      icon: Users,
      color: "text-blue-600",
      href: "/admin/users",
    },
    {
      title: "Active Subs",
      value: loadingUsers ? "..." : premiumUsers?.length.toLocaleString() || "0",
      caption: "Paid-plan access records",
      icon: CreditCard,
      color: "text-green-600",
      href: "/admin/subscriptions",
    },
    {
      title: "AI Credits Used",
      value: loadingUsers ? "..." : aiCreditsUsed.toLocaleString(),
      caption: "Total usage tracked",
      icon: Zap,
      color: "text-yellow-600",
      href: "/admin/audit-logs",
    },
    {
      title: "Estimated MRR",
      value: loadingUsers ? "..." : currencyFormatter.format(mrr),
      caption: "Calculated from current plan assignments",
      icon: TrendingUp,
      color: "text-primary",
      href: "/admin/pricing",
    },
  ]

  return (
    <div className="space-y-5 md:space-y-8">
      <div className="space-y-4">
        <div>
        <h1 className="text-2xl font-black tracking-tight text-slate-900 uppercase sm:text-3xl">Command Center</h1>
        <div className="mt-1 flex items-center gap-2">
          <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500 sm:text-xs sm:tracking-widest">Live governance snapshot from Firestore and audit activity</p>
        </div>
        </div>
        <div>
          <Link
            href="/admin/diagnostics"
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-primary/15 bg-primary/5 px-4 py-3 text-[10px] font-black uppercase tracking-[0.18em] text-primary transition-colors hover:bg-primary/10 sm:w-auto sm:justify-start sm:text-xs"
          >
            <Settings2 className="h-4 w-4" />
            Run Diagnostics & Auto Repair
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link key={stat.title} href={stat.href}>
            <Card className="group cursor-pointer overflow-hidden border-none shadow-sm transition-all hover:shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 px-4 pb-2 pt-4 sm:px-6 sm:pt-6">
                <CardTitle className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-500 sm:text-[10px] sm:tracking-widest">
                  {stat.title}
                </CardTitle>
                <div className={`rounded-lg bg-slate-50 p-2 transition-colors group-hover:bg-slate-100 ${stat.color}`}>
                  <stat.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-4 pt-0 sm:px-6 sm:pb-6">
                <div className="text-xl font-black tracking-tight text-slate-900 sm:text-2xl">{stat.value}</div>
                <p className="mt-1 text-[9px] font-medium uppercase tracking-[0.14em] text-slate-400 sm:text-[10px] sm:tracking-widest">{stat.caption}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-3 md:gap-6">
        <Card className="border-none shadow-sm md:col-span-2">
          <CardHeader className="border-b border-slate-50 px-4 py-4 sm:px-6">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-black uppercase tracking-widest">Recent Platform Events</CardTitle>
              <Clock className="h-4 w-4 text-slate-400" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-50">
              {loadingLogs ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-6 w-6 animate-spin text-slate-300" />
                </div>
              ) : recentLogs?.length === 0 ? (
                <div className="p-8 text-center text-xs font-bold uppercase tracking-widest text-slate-400">
                  No recent platform events detected.
                </div>
              ) : recentLogs?.map((log) => {
                const normalizedAction = String(log.action || "").toLowerCase()
                const createdAt = log.createdAt?.toDate ? log.createdAt.toDate() : null
                const iconTone =
                  normalizedAction.includes("delete") ? "bg-red-50 text-red-600" :
                  normalizedAction.includes("create") || normalizedAction.includes("grant") ? "bg-green-50 text-green-600" :
                  "bg-blue-50 text-blue-600"

                return (
                  <div key={log.id} className="flex flex-col gap-3 p-4 transition-colors hover:bg-slate-50/50 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${iconTone}`}>
                        <Zap className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-900">{formatAction(log.action)}</p>
                        <p className="break-all text-[10px] font-medium text-slate-500 sm:break-normal">
                          {log.targetType || "system"}: {log.targetId || "n/a"}
                        </p>
                      </div>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        {createdAt ? createdAt.toLocaleTimeString() : "RECENT"}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="border-none bg-slate-900 text-white shadow-sm">
          <CardHeader className="px-4 py-4 sm:px-6">
            <CardTitle className="flex items-center gap-2 text-sm font-black uppercase tracking-widest">
              <AlertCircle className="h-4 w-4 text-yellow-500" />
              Critical Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 px-4 pb-4 sm:space-y-4 sm:px-6 sm:pb-6">
            {(criticalAlerts.length ? criticalAlerts : [fallbackAlert]).map((alert) => (
              <div
                key={`${alert.label}-${alert.message}`}
                className={`rounded-xl p-4 ${
                  alert.tone === "ok"
                    ? "border border-green-500/20 bg-green-500/10"
                    : alert.tone === "info"
                    ? "border border-blue-500/20 bg-blue-500/10"
                    : "border border-slate-700 bg-slate-800"
                }`}
              >
                <p className={`mb-1 text-[10px] font-black uppercase tracking-widest ${
                  alert.tone === "ok" ? "text-green-500" : alert.tone === "info" ? "text-blue-300" : "text-yellow-500"
                }`}>
                  {alert.label}
                </p>
                <p className="text-[11px] font-bold leading-relaxed text-slate-300 sm:text-xs">{alert.message}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
