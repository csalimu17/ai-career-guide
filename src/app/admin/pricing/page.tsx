"use client"

import { useState } from "react"
import Link from "next/link"
import { query, collection, orderBy } from "firebase/firestore"
import { AlertCircle, Loader2, Lock, Settings, Settings2, ShieldCheck, Zap } from "lucide-react"

import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { PLAN_CONFIGS } from "@/lib/plans"
import { seedPlanConfigs } from "@/lib/admin/content-service"
import { useAdminAuth } from "@/hooks/use-admin-auth"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

function formatPlanPrice(price: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: price === 0 ? 0 : 2,
    maximumFractionDigits: price === 0 ? 0 : 2,
  }).format(price)
}

export default function PricingGovernancePage() {
  const db = useFirestore()
  const { adminRecord } = useAdminAuth()
  const { toast } = useToast()
  const [isSeeding, setIsSeeding] = useState(false)

  const plansQuery = useMemoFirebase(() => query(collection(db, "planConfigs"), orderBy("displayName", "asc")), [db])
  const { data: plans, isLoading } = useCollection(plansQuery)

  const handleSeedPlans = async () => {
    if (!adminRecord) return
    setIsSeeding(true)
    try {
      await seedPlanConfigs(db, PLAN_CONFIGS, adminRecord.uid)
      toast({
        title: "Plan defaults seeded",
        description: "Pricing and entitlement defaults now mirror the live billing catalog.",
      })
    } catch (error) {
      console.error("Seeding failed:", error)
      toast({
        variant: "destructive",
        title: "Seeding failed",
        description: "We couldn't write the billing defaults to Firestore. Please try again.",
      })
    } finally {
      setIsSeeding(false)
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tight text-slate-900">Plan Governance</h1>
          <p className="mt-1 text-sm font-medium text-slate-500">Configure entitlements, pricing display, and feature access.</p>
        </div>
        <div className="flex gap-3">
          <Button asChild variant="outline" className="h-11 rounded-xl border-2 text-xs font-bold uppercase">
            <Link href="/admin/settings">
              <Settings className="mr-2 h-4 w-4" /> Billing Settings
            </Link>
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      ) : plans?.length === 0 ? (
        <Card className="border-2 border-dashed border-slate-200 bg-slate-50">
          <CardContent className="space-y-4 py-20 text-center">
            <AlertCircle className="mx-auto h-10 w-10 text-slate-300" />
            <p className="text-sm font-bold uppercase tracking-widest text-slate-500">No plan configurations found in Firestore.</p>
            <Button
              onClick={handleSeedPlans}
              disabled={isSeeding}
              className="h-11 rounded-xl px-8 text-[10px] font-black uppercase tracking-widest"
            >
              {isSeeding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Seed Plans from Billing Defaults
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {plans?.map((plan) => (
            <Card key={plan.id} className="group overflow-hidden rounded-3xl border-none shadow-sm">
              <div className={`h-2 ${plan.planId === "master" ? "bg-indigo-600" : plan.planId === "pro" ? "bg-primary" : "bg-slate-200"}`} />
              <CardHeader className="pb-4">
                <div className="mb-2 flex items-center justify-between">
                  <Badge variant="outline" className="rounded-md border-slate-200 px-2 py-0.5 text-[9px] font-black italic uppercase tracking-widest text-slate-500">
                    SYSTEM ID: {plan.planId}
                  </Badge>
                  {plan.recommended ? (
                    <Badge className="rounded-md border-none bg-orange-500 text-[9px] font-black uppercase tracking-widest text-white">
                      Recommended
                    </Badge>
                  ) : null}
                </div>
                <CardTitle className="text-2xl font-black uppercase tracking-tight text-slate-900">{plan.displayName}</CardTitle>
                <CardDescription className="text-xs font-bold text-slate-500">
                  {formatPlanPrice(Number(plan.monthlyPriceDisplay || 0))}/mo - {plan.isVisible ? "Visible" : "Hidden"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Entitlements</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-[9px] font-black uppercase tracking-tighter text-slate-500">Resumes</p>
                      <p className="text-sm font-black text-slate-900">{plan.limits?.maxResumes}</p>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-[9px] font-black uppercase tracking-tighter text-slate-500">AI Credits</p>
                      <p className="text-sm font-black text-slate-900">{plan.limits?.aiGenerations}</p>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-[9px] font-black uppercase tracking-tighter text-slate-500">ATS Scans</p>
                      <p className="text-sm font-black text-slate-900">{plan.limits?.atsChecks}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Feature Access</p>
                  <div className="space-y-1.5">
                    {Object.entries(plan.access || {}).map(([key, val]) => (
                      <div key={key} className="flex items-center justify-between text-[10px] font-bold">
                        <span className="capitalize text-slate-500">{key.replace(/([A-Z])/g, " $1")}</span>
                        {val ? (
                          <ShieldCheck className="h-3 w-3 text-green-500" />
                        ) : (
                          <Lock className="h-3 w-3 text-slate-300" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {plan.stripePriceId ? (
                    <Badge variant="outline" className="rounded-full border-primary/10 bg-primary/5 px-3 py-1 text-[9px] font-black uppercase tracking-[0.18em] text-primary">
                      <Zap className="mr-1 h-3 w-3" /> Stripe linked
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="rounded-full border-slate-200 px-3 py-1 text-[9px] font-black uppercase tracking-[0.18em] text-slate-500">
                      Free tier
                    </Badge>
                  )}
                </div>

                <Button asChild className="mt-4 h-11 w-full rounded-2xl text-[10px] font-black uppercase tracking-widest">
                  <Link href={`/admin/pricing/${plan.planId}`}>
                    <Settings2 className="mr-2 h-4 w-4" /> Modify Configuration
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card className="rounded-3xl border-none bg-orange-50/50 shadow-sm">
        <CardContent className="flex items-start gap-4 p-6">
          <AlertCircle className="mt-1 h-6 w-6 shrink-0 text-orange-600" />
          <div className="space-y-1">
            <h4 className="text-xs font-black uppercase tracking-tight text-orange-900">Financial Governance Protocol</h4>
            <p className="text-xs font-medium leading-relaxed text-orange-800">
              Changes made here affect real-time entitlements and display pricing. Stripe remains the billing source of truth, so keep the public display aligned with the live Stripe products.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
