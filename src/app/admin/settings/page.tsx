"use client"

import { useState, useEffect, useMemo } from "react"
import { useFirestore } from "@/firebase"
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  Settings, 
  Flag, 
  Shield, 
  Bell, 
  Globe, 
  Database, 
  ChevronRight,
  Zap,
  Cpu,
  RefreshCw,
  Save,
  ShieldAlert,
  Loader2,
  Mail,
  Clock,
  HardDrive,
  HelpCircle
} from "lucide-react"
import Link from "next/link"
import { useAdminAuth } from "@/hooks/use-admin-auth"
import { useToast } from "@/hooks/use-toast"
import { logAdminAction } from "@/lib/admin/audit-logger"
import { siteConfig } from "@/lib/site"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

const DEFAULT_SYSTEM_SETTINGS = {
  maintenanceMode: false,
  maintenanceMessage: "System is currently undergoing scheduled maintenance. Please check back soon.",
  supportEmail: siteConfig.supportEmail,
  aiModel: "googleai/gemini-2.5-pro",
  globalRateLimit: 60,
}

function normalizeSupportEmail(email?: string) {
  if (!email || email === "support@aicareerguide.com") {
    return siteConfig.supportEmail
  }

  return email
}

export default function SettingsCenterPage() {
  const db = useFirestore()
  const { toast } = useToast()
  const { adminRecord } = useAdminAuth()
  
  const [settings, setSettings] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const settingsRef = useMemo(() => (db ? doc(db, "systemConfigs", "global") : null), [db])

  useEffect(() => {
    if (!settingsRef) return

    const fetchSettings = async () => {
      try {
        const snap = await getDoc(settingsRef)
        if (snap.exists()) {
          const nextSettings = { ...DEFAULT_SYSTEM_SETTINGS, ...snap.data() }
          setSettings({ ...nextSettings, supportEmail: normalizeSupportEmail(nextSettings.supportEmail) })
        } else {
          setSettings(DEFAULT_SYSTEM_SETTINGS)
        }
      } catch (error) {
        console.error("Failed to load system settings:", error)
        setSettings(DEFAULT_SYSTEM_SETTINGS)
        toast({ variant: "destructive", title: "Load Failed", description: "Failed to retrieve system configurations." })
      } finally {
        setIsLoading(false)
      }
    }
    fetchSettings()
  }, [settingsRef, toast])

  const handleSave = async () => {
    if (!adminRecord || !settings || !settingsRef) return
    setIsSaving(true)
    try {
      await setDoc(settingsRef, {
        ...settings,
        supportEmail: normalizeSupportEmail(settings.supportEmail),
        updatedBy: adminRecord.uid,
        updatedAt: serverTimestamp()
      })
      
      await logAdminAction(db, {
        actorUid: adminRecord.uid,
        actorEmail: adminRecord.email,
        action: "update_system_config",
        targetType: "system_config",
        targetId: "global",
        newValue: settings
      })

      toast({ title: "Configuration Synchronized", description: "Global system parameters have been updated." })
    } catch (error) {
       toast({ variant: "destructive", title: "Update Failed", description: "Failed to save system settings." })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) return (
     <div className="flex h-96 items-center justify-center">
       <Loader2 className="h-10 w-10 animate-spin text-primary" />
     </div>
  )

  const settingsGroups = [
    {
      title: "Operational Control",
      description: "Manage system availability and feature rollouts.",
      items: [
        { 
          id: "flags", 
          name: "Feature Flags", 
          desc: "Toggle beta features and AI capabilities.", 
          icon: Flag, 
          href: "/admin/settings/flags",
          status: "Operational"
        },
        { 
          id: "auth", 
          name: "Security & RBAC", 
          desc: "Manage authentication providers and admin roles.", 
          icon: Shield, 
          href: "/admin/settings/security",
          status: "Secure"
        },
      ]
    },
    {
      title: "System Infrastructure",
      description: "Core platform configurations and external service health.",
      items: [
        { 
          id: "ai", 
          name: "AI Models & APIs", 
          desc: "Configure Genkit endpoints and credit pricing.", 
          icon: Cpu, 
          href: "/admin/settings/ai",
          status: "Active"
        },
        { 
          id: "storage", 
          name: "Asset Storage", 
          desc: "Configure Firebase Storage buckets and CDN.", 
          icon: Database, 
          href: "/admin/settings/storage",
          status: "Normal"
        },
      ]
    }
  ]

  const configurationSnapshot = [
    {
      label: "Global config document",
      value: settingsRef ? "Loaded" : "Unavailable",
      className: settingsRef ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-red-500/20 text-red-300 border border-red-500/30",
    },
    {
      label: "Support channel",
      value: settings?.supportEmail ? normalizeSupportEmail(settings.supportEmail) : "Missing",
      className: settings?.supportEmail ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-orange-500/20 text-orange-300 border border-orange-500/30",
    },
    {
      label: "Maintenance mode",
      value: settings?.maintenanceMode ? "Enabled" : "Off",
      className: settings?.maintenanceMode ? "bg-orange-500/20 text-orange-300 border border-orange-500/30" : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
    },
  ]

  return (
    <div className="space-y-6 pb-16 md:space-y-8 md:pb-20">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase sm:text-3xl">System Governance</h1>
          <p className="text-slate-500 font-medium text-sm mt-1">Configure global platform behavior and operational parameters.</p>
        </div>
        <Button className="h-11 w-full rounded-xl px-6 font-bold uppercase text-[10px] shadow-lg shadow-primary/20 sm:w-auto sm:px-8 sm:text-xs" onClick={handleSave} disabled={isSaving}>
           {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
           Commit Changes
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3 lg:gap-8">
        <div className="space-y-5 lg:col-span-2 lg:space-y-8">
           {/* Maintenance Controls */}
           <Card className="overflow-hidden rounded-[1.5rem] border-none shadow-sm sm:rounded-3xl">
              <CardHeader className={`border-b ${settings?.maintenanceMode ? 'bg-red-50/50 border-red-100' : 'bg-slate-50/50 border-slate-100'}`}>
                 <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <CardTitle className={`text-sm font-black uppercase tracking-widest flex items-center gap-2 ${settings?.maintenanceMode ? 'text-red-600' : 'text-slate-900'}`}>
                       <ShieldAlert className="h-4 w-4" />
                       Emergency Maintenance
                    </CardTitle>
                    <Switch 
                      checked={settings?.maintenanceMode} 
                      onCheckedChange={(checked) => setSettings({...settings, maintenanceMode: checked})}
                      className="data-[state=checked]:bg-red-600"
                    />
                 </div>
              </CardHeader>
              <CardContent className="space-y-5 p-4 sm:p-8 sm:space-y-6">
                 <div className="grid gap-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Public Downtime Message</label>
                    <Textarea 
                      value={settings?.maintenanceMessage || ""} 
                      onChange={(e) => setSettings({...settings, maintenanceMessage: e.target.value})}
                      className="min-h-[100px] rounded-xl border-slate-100 font-medium text-sm focus-visible:ring-red-100"
                      disabled={!settings?.maintenanceMode}
                      placeholder="e.g. System is currently undergoing scheduled maintenance..."
                    />
                 </div>
              </CardContent>
           </Card>

           {/* Platform Constants */}
           <Card className="overflow-hidden rounded-[1.5rem] border-none shadow-sm sm:rounded-3xl">
              <CardHeader className="border-b border-slate-50">
                 <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2 text-primary">
                    <Settings className="h-4 w-4" />
                    Platform Constants
                 </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-5 p-4 sm:grid-cols-2 sm:gap-8 sm:p-8">
                 <div className="space-y-4">
                    <div className="grid gap-1.5">
                       <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                         <Mail className="h-3 w-3" /> Support Inbound Email
                       </label>
                       <Input 
                         value={settings?.supportEmail || ""}
                         onChange={(e) => setSettings({...settings, supportEmail: e.target.value})}
                         className="h-11 rounded-xl border-slate-100 font-bold text-sm"
                       />
                    </div>
                    <div className="grid gap-1.5">
                       <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                         <Globe className="h-3 w-3" /> System Region
                       </label>
                       <Input 
                         value="us-central1"
                         disabled
                         className="h-11 rounded-xl bg-slate-50 border-none font-bold text-sm text-slate-400"
                       />
                    </div>
                 </div>
                 <div className="space-y-4">
                    <div className="grid gap-1.5">
                       <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                         <Cpu className="h-3 w-3" /> Default AI Inference Model
                       </label>
                       <Input 
                         value={settings?.aiModel || ""}
                         onChange={(e) => setSettings({...settings, aiModel: e.target.value})}
                         className="h-11 rounded-xl border-slate-100 font-bold text-sm"
                       />
                    </div>
                    <div className="grid gap-1.5">
                       <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                         <Clock className="h-3 w-3" /> Global Rate Limit (Requests/Min)
                       </label>
                       <Input 
                         type="number"
                         value={settings?.globalRateLimit || 60}
                         onChange={(e) => setSettings({...settings, globalRateLimit: Number.parseInt(e.target.value || "0", 10) || 0})}
                         className="h-11 rounded-xl border-slate-100 font-bold text-sm"
                       />
                    </div>
                 </div>
              </CardContent>
           </Card>

           {/* Module Navigation */}
           <div className="space-y-5 pt-2 sm:space-y-6 sm:pt-4">
            {settingsGroups.map((group) => (
              <div key={group.title} className="space-y-4">
                <div className="flex flex-col">
                  <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{group.title}</h2>
                </div>
                
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4">
                  {group.items.map((item) => {
                    const CardComponent = (
                      <Card key={item.id} className="group cursor-pointer overflow-hidden border-none shadow-sm transition-shadow hover:shadow-md">
                         <CardContent className="p-0">
                            <div className="flex items-center gap-3 p-4 sm:gap-4 sm:p-5">
                              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-50 text-slate-400 shadow-inner transition-colors group-hover:bg-primary group-hover:text-white sm:h-12 sm:w-12">
                                <item.icon className="h-5 w-5 sm:h-6 sm:w-6" />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center justify-between gap-3">
                                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">{item.name}</h3>
                                </div>
                                <p className="text-[10px] text-slate-500 font-medium mt-1">{item.desc}</p>
                              </div>
                              <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-primary transition-colors translate-x-0 group-hover:translate-x-1" />
                            </div>
                         </CardContent>
                      </Card>
                    );

                    return (
                      <Link key={item.id} href={item.href}>
                        {CardComponent}
                      </Link>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-5 lg:col-span-1 lg:space-y-6">
           <Card className="overflow-hidden rounded-[1.5rem] border-none bg-slate-900 text-white shadow-sm sm:rounded-3xl">
              <CardHeader>
                 <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                    <HardDrive className="h-4 w-4 text-emerald-500" />
                    Configuration Snapshot
                 </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 px-4 pb-4 sm:space-y-4 sm:px-6 sm:pb-8">
                 {configurationSnapshot.map((item) => (
                   <div key={item.label} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-700 bg-slate-800 p-3 sm:p-4">
                      <span className="text-[11px] font-bold text-slate-300 sm:text-xs">{item.label}</span>
                      <Badge className={`${item.className} text-[9px] font-black px-2 uppercase tracking-widest`}>
                        {item.value}
                      </Badge>
                   </div>
                 ))}
                 <div className="space-y-2 rounded-2xl border border-slate-800 bg-slate-800/50 p-3 sm:p-4">
                    <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                       <HelpCircle className="h-3 w-3" />
                       Governance Context
                    </div>
                    <p className="text-[11px] font-bold text-slate-400 leading-relaxed">
                      This card reflects only configuration values loaded by this page. Use the diagnostics workspace for runtime connectivity checks.
                    </p>
                 </div>
              </CardContent>
           </Card>

           <Card className="relative overflow-hidden rounded-[1.5rem] border-none bg-indigo-900 text-white shadow-xl shadow-indigo-900/20 sm:rounded-3xl">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                 <RefreshCw className="h-32 w-32 rotate-12" />
              </div>
              <CardContent className="relative z-10 p-5 sm:p-8">
                 <h4 className="text-lg font-black uppercase tracking-tight">Diagnostics Workspace</h4>
                 <p className="text-indigo-200 text-xs font-bold uppercase tracking-widest mt-1">Run authenticated runtime checks and AI handshake tests from the dedicated diagnostics screen.</p>
                 <Button asChild variant="secondary" className="mt-5 h-12 w-full rounded-2xl bg-white px-6 text-[10px] font-black uppercase tracking-widest text-indigo-900 shadow-lg hover:bg-indigo-50 hover:text-indigo-950 [background-image:none] sm:mt-6 sm:h-14 sm:px-8">
                   <Link href="/admin/diagnostics">
                     <RefreshCw className="h-5 w-5 mr-2" />
                     Open Diagnostics
                   </Link>
                  </Button>
              </CardContent>
           </Card>
        </div>
      </div>
    </div>

  )
}
