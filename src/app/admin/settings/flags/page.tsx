"use client"

import { useState } from "react"
import { useFirestore, useCollection } from "@/firebase"
import { query, collection, orderBy, updateDoc, doc, serverTimestamp } from "firebase/firestore"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { 
  ShieldCheck, 
  Loader2,
  Flag,
  RotateCcw,
  ZapOff
} from "lucide-react"
import { logAdminAction } from "@/lib/admin/audit-logger"
import { useAdminAuth } from "@/hooks/use-admin-auth"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

export default function FeatureFlagsPage() {
  const db = useFirestore()
  const { toast } = useToast()
  const { adminRecord } = useAdminAuth()
  const [pendingFlagId, setPendingFlagId] = useState<string | null>(null)
  
  const flagsQuery = query(collection(db, "featureFlags"), orderBy("name", "asc"))
  const { data: flags, isLoading, error } = useCollection(flagsQuery)

  const handleToggle = async (flagId: string, currentStatus: boolean, flagName: string) => {
    if (!adminRecord || pendingFlagId === flagId) return
    
    setPendingFlagId(flagId)
    try {
      const flagRef = doc(db, "featureFlags", flagId)
      await updateDoc(flagRef, {
        isEnabled: !currentStatus,
        updatedBy: adminRecord.uid,
        updatedAt: serverTimestamp()
      })
      
      await logAdminAction(db, {
        actorUid: adminRecord.uid,
        actorEmail: adminRecord.email,
        action: "toggle_feature_flag",
        targetType: "feature_flag",
        targetId: flagId,
        newValue: { isEnabled: !currentStatus, flagName }
      })

      toast({ title: "Flag Updated", description: `${flagName} is now ${!currentStatus ? 'ENABLED' : 'DISABLED'}.` })
    } catch (error) {
       console.error("Feature flag update failed:", error)
       toast({ variant: "destructive", title: "Update Failed", description: `Failed to update ${flagName}.` })
    } finally {
      setPendingFlagId(null)
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Operational Guards</h1>
          <p className="text-slate-500 font-medium text-sm mt-1">Manage global feature availability and runtime circuit breakers.</p>
        </div>
        <div className="bg-red-50 border border-red-100 rounded-2xl px-4 py-2 flex items-center gap-3">
           <ZapOff className="h-4 w-4 text-red-600" />
           <span className="text-[10px] font-black text-red-900 uppercase tracking-widest">Flags Loaded: {isLoading ? "..." : flags?.length || 0}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {error ? (
          <Card className="col-span-full border-none bg-red-50 shadow-sm">
            <CardContent className="py-8 text-center space-y-3">
              <p className="text-sm font-black uppercase tracking-widest text-red-700">Feature flags unavailable</p>
              <p className="text-sm font-medium text-red-700/80">We couldn't load the current runtime toggle registry from Firestore.</p>
              <Button variant="outline" asChild className="rounded-xl border-red-200 font-bold text-red-700 hover:bg-red-100">
                <Link href="/admin/settings">Back to Governance</Link>
              </Button>
            </CardContent>
          </Card>
        ) : null}
        {isLoading ? (
          <div className="col-span-full flex h-64 items-center justify-center">
             <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        ) : flags?.length === 0 ? (
          <Card className="col-span-full border-dashed border-2 border-slate-200 bg-slate-50">
            <CardContent className="py-20 text-center space-y-4">
               <Flag className="h-10 w-10 text-slate-300 mx-auto" />
               <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">No active feature flags registered.</p>
            </CardContent>
          </Card>
        ) : flags?.map((flag) => (
          <Card key={flag.id} className={`border-none shadow-sm rounded-3xl overflow-hidden transition-all ${!flag.isEnabled ? 'opacity-75 bg-slate-50' : 'bg-white'}`}>
             <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                   <div className="flex items-center gap-4">
                      <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shadow-inner ${flag.isEnabled ? 'bg-primary/10 text-primary' : 'bg-slate-200 text-slate-400'}`}>
                         <Flag className="h-6 w-6" />
                      </div>
                      <div>
                         <div className="flex items-center gap-2">
                            <h3 className="text-sm font-black text-slate-900 tracking-tight uppercase">{flag.name}</h3>
                            <Badge variant={flag.isEnabled ? "secondary" : "outline"} className={`rounded-md text-[9px] font-black uppercase tracking-widest px-2 py-0.5 border-none ${
                               flag.isEnabled ? 'bg-green-50 text-green-600' : 'bg-slate-200 text-slate-400'
                            }`}>
                               {flag.isEnabled ? 'Active' : 'Halted'}
                            </Badge>
                         </div>
                         <p className="text-xs text-slate-500 font-medium mt-0.5">{flag.description}</p>
                      </div>
                   </div>
                   <Switch 
                     checked={flag.isEnabled} 
                     onCheckedChange={() => handleToggle(flag.id, flag.isEnabled, flag.name)}
                     className="data-[state=checked]:bg-primary"
                     disabled={pendingFlagId === flag.id}
                   />
                </div>
                
                <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
                   <div className="flex items-center gap-4">
                      <div>
                         <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Last Toggled</p>
                         <p className="text-[10px] font-bold text-slate-600 mt-1">{flag.updatedAt?.toDate()?.toLocaleString() || 'Never'}</p>
                      </div>
                      <div className="h-4 w-px bg-slate-100" />
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Actor: {flag.updatedBy?.slice(-6) || 'System'}</p>
                   </div>
                   <Button
                     variant="ghost"
                     className="h-8 rounded-lg p-0 text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-primary"
                     onClick={() => handleToggle(flag.id, flag.isEnabled, flag.name)}
                     disabled={pendingFlagId === flag.id}
                   >
                     {pendingFlagId === flag.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <RotateCcw className="h-3 w-3" />} Toggle
                   </Button>
                </div>
             </CardContent>
          </Card>
        ))}
      </div>

      {/* Safety Board */}
      <Card className="border-none bg-indigo-900 text-white shadow-xl rounded-3xl overflow-hidden">
        <CardContent className="p-8 flex items-center justify-between">
           <div className="flex items-start gap-6">
              <div className="h-14 w-14 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center shrink-0">
                 <ShieldCheck className="h-8 w-8 text-indigo-400" />
              </div>
              <div className="space-y-1">
                 <h4 className="text-lg font-black uppercase tracking-tighter">Governance Protection Protocol</h4>
                 <p className="text-sm font-medium text-indigo-200/80 leading-relaxed max-w-xl">
                    Flag changes write to Firestore immediately. Runtime behavior depends on where each flag is read, so validate critical flows after changing a production toggle.
                 </p>
              </div>
           </div>
           <Button variant="outline" asChild className="hidden h-12 rounded-xl border-indigo-600 px-6 text-[10px] font-bold uppercase tracking-widest text-indigo-400 hover:bg-white hover:text-indigo-900 md:flex">
              <Link href="/admin/audit-logs">View Deployment Logs</Link>
           </Button>
        </CardContent>
      </Card>
    </div>
  )
}
