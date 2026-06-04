"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { doc, serverTimestamp, updateDoc } from "firebase/firestore"
import { AlertCircle, ArrowLeft, FileText, History, Loader2, Save, ShieldCheck, Target, Zap } from "lucide-react"

import { useFirestore, useDoc, useMemoFirebase } from "@/firebase"
import { logAdminAction } from "@/lib/admin/audit-logger"
import { useAdminAuth } from "@/hooks/use-admin-auth"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"

export default function PlanEditorPage() {
  const params = useParams()
  const planId = Array.isArray(params.planId) ? params.planId[0] : params.planId
  const db = useFirestore()
  const router = useRouter()
  const { toast } = useToast()
  const { adminRecord } = useAdminAuth()

  const planRef = useMemoFirebase(() => {
    if (!db || !planId) return null
    return doc(db, "planConfigs", planId)
  }, [db, planId])
  const { data: plan, isLoading } = useDoc(planRef)

  const [formData, setFormData] = useState<any>(null)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (plan) {
      setFormData(plan)
    }
  }, [plan])

  const parseNumberInput = (value: string, fallback = 0) => {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : fallback
  }

  const handleSave = async () => {
    if (!adminRecord || !formData || !planRef || !planId) return
    setIsSaving(true)
    try {
      const { id, ...saveData } = formData
      await updateDoc(planRef, {
        ...saveData,
        updatedBy: adminRecord.uid,
        updatedAt: serverTimestamp(),
      })

      await logAdminAction(db, {
        actorUid: adminRecord.uid,
        actorEmail: adminRecord.email,
        action: "update_plan_config",
        targetType: "plan_config",
        targetId: planId,
        oldValue: plan,
        newValue: saveData,
      })

      toast({ title: "Configuration Updated", description: "Plan entitlements have been refreshed." })
      router.push("/admin/pricing")
    } catch (error) {
      console.error("Plan update failed:", error)
      toast({ variant: "destructive", title: "Update Failed", description: "Failed to save plan configuration." })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    )
  }

  if (!plan) {
    return (
      <Card className="rounded-3xl border-none shadow-sm">
        <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
          <AlertCircle className="h-10 w-10 text-muted-foreground" />
          <div className="space-y-1">
            <p className="text-xl font-black text-primary">Plan configuration not found</p>
            <p className="text-sm text-muted-foreground">
              This plan has not been seeded into Firestore yet, or the record was removed.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild className="rounded-xl font-bold">
              <Link href="/admin/pricing">Back to plan governance</Link>
            </Button>
            <Button asChild variant="outline" className="rounded-xl font-bold">
              <Link href="/admin/settings">Open admin settings</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild className="h-10 w-10 rounded-xl hover:bg-slate-100">
            <Link href="/admin/pricing">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-black uppercase tracking-tight text-slate-900">
                {plan.displayName} Config
              </h1>
              <Badge variant="outline" className="rounded-md border-slate-200 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-slate-500 italic">
                {planId}
              </Badge>
            </div>
            <p className="mt-0.5 text-sm font-medium uppercase tracking-wider text-slate-500">
              Configure entitlements, live billing display, and public visibility.
            </p>
          </div>
        </div>
        <Button className="h-11 rounded-xl px-8 text-xs font-bold uppercase shadow-lg shadow-primary/20" onClick={handleSave} disabled={isSaving || !formData}>
          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Save Plan Config
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="overflow-hidden rounded-3xl border-none shadow-sm">
            <CardHeader className="border-b border-slate-50">
              <CardTitle className="text-sm font-black uppercase tracking-widest text-primary">Monthly Entitlements</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-8 p-8 md:grid-cols-2">
              <div className="space-y-4">
                <div className="grid gap-1.5">
                  <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
                    <FileText className="h-3 w-3" /> Resume Limit
                  </label>
                  <Input
                    type="number"
                    value={formData?.limits?.maxResumes || 0}
                    onChange={(e) => setFormData({ ...formData, limits: { ...formData.limits, maxResumes: parseNumberInput(e.target.value) } })}
                    className="h-12 rounded-xl border-slate-100 font-bold"
                  />
                </div>
                <div className="grid gap-1.5">
                  <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
                    <Target className="h-3 w-3" /> ATS Checks / mo
                  </label>
                  <Input
                    type="number"
                    value={formData?.limits?.atsChecks || 0}
                    onChange={(e) => setFormData({ ...formData, limits: { ...formData.limits, atsChecks: parseNumberInput(e.target.value) } })}
                    className="h-12 rounded-xl border-slate-100 font-bold"
                  />
                </div>
              </div>
              <div className="space-y-4">
                <div className="grid gap-1.5">
                  <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
                    <Zap className="h-3 w-3" /> AI Generations / mo
                  </label>
                  <Input
                    type="number"
                    value={formData?.limits?.aiGenerations || 0}
                    onChange={(e) => setFormData({ ...formData, limits: { ...formData.limits, aiGenerations: parseNumberInput(e.target.value) } })}
                    className="h-12 rounded-xl border-slate-100 font-bold"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden rounded-3xl border-none shadow-sm">
            <CardHeader className="border-b border-slate-50">
              <CardTitle className="text-sm font-black uppercase tracking-widest text-primary">Feature Visibility & Access</CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <div className="grid grid-cols-1 gap-x-12 gap-y-6 md:grid-cols-2">
                {Object.entries(formData?.access || {}).map(([key, val]) => (
                  <div key={key} className="group flex items-center justify-between">
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold capitalize leading-tight text-slate-900">{key.replace(/([A-Z])/g, " $1")}</p>
                      <p className="text-[10px] font-medium uppercase tracking-tighter text-slate-400">Controlled at platform level</p>
                    </div>
                    <Switch
                      checked={Boolean(val)}
                      onCheckedChange={(checked) => setFormData({ ...formData, access: { ...formData.access, [key]: checked } })}
                      className="data-[state=checked]:bg-primary"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6 lg:col-span-1">
          <Card className="rounded-3xl border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm font-black uppercase tracking-widest">Public Display</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Monthly Display Price (GBP)</label>
                <Input
                  type="number"
                  value={formData?.monthlyPriceDisplay || 0}
                  onChange={(e) => setFormData({ ...formData, monthlyPriceDisplay: parseNumberInput(e.target.value) })}
                  className="h-11 rounded-xl border-slate-100 font-bold"
                />
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Stripe Price ID</p>
                <p className="mt-2 break-all text-xs font-bold text-slate-700">
                  {formData?.stripePriceId || "No Stripe price required for this plan."}
                </p>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-4">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="h-4 w-4 text-green-600" />
                  <span className="text-xs font-bold text-slate-700">Display Recommended</span>
                </div>
                <Switch
                  checked={formData?.recommended || false}
                  onCheckedChange={(checked) => setFormData({ ...formData, recommended: checked })}
                />
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-4">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-4 w-4 text-blue-600" />
                  <span className="text-xs font-bold text-slate-700">Visibility on Landing</span>
                </div>
                <Switch
                  checked={formData?.isVisible || false}
                  onCheckedChange={(checked) => setFormData({ ...formData, isVisible: checked })}
                />
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4 rounded-3xl bg-slate-100 p-6">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Security Warning</h4>
            <p className="text-xs font-bold leading-relaxed text-slate-600">
              Updating entitlements takes effect immediately for all users on this plan. Plan downgrades may trigger user-facing errors if they exceed new limits.
            </p>
            <Button asChild variant="ghost" className="h-11 w-full rounded-xl text-[10px] font-bold uppercase tracking-widest text-slate-500">
              <Link href="/admin/audit-logs">
                <History className="mr-2 h-4 w-4" /> Audit Logs
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
