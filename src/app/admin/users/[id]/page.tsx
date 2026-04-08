"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import {
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore"
import { useParams } from "next/navigation"
import { useAdminAuth } from "@/hooks/use-admin-auth"
import { useFirestore, useDoc, useMemoFirebase, useCollection } from "@/firebase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Clock, FileText, Fingerprint, History as HistoryIcon, Loader2, Mail, MessageSquare, Plus, ShieldCheck, Target, UserCheck, UserPlus, UserX, Zap } from "lucide-react"
import { logAdminAction } from "@/lib/admin/audit-logger"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

type SupportNote = {
  id?: string
  body?: string
  authorEmail?: string
  createdAt?: string
}

export default function UserDetailPage() {
  const params = useParams<{ id?: string | string[] }>()
  const db = useFirestore()
  const { toast } = useToast()
  const { adminRecord } = useAdminAuth()
  const userId = useMemo(() => {
    const value = params?.id
    if (Array.isArray(value)) return value[0] ?? null
    return typeof value === "string" && value.trim() ? value : null
  }, [params])

  const userRef = useMemoFirebase(() => (!userId ? null : doc(db, "users", userId)), [db, userId])
  const { data: profile, isLoading } = useDoc(userRef)
  const adminDocRef = useMemoFirebase(() => (!userId ? null : doc(db, "adminUsers", userId)), [db, userId])
  const { data: targetAdmin } = useDoc(adminDocRef)
  const logsQuery = useMemoFirebase(
    () => (!userId ? null : query(collection(db, "adminAuditLogs"), where("targetId", "==", userId), orderBy("createdAt", "desc"), limit(50))),
    [db, userId]
  )
  const { data: logs, isLoading: isLogsLoading } = useCollection(logsQuery)
  const resumesQuery = useMemoFirebase(
    () => (!userId ? null : query(collection(db, "users", userId, "resumes"), orderBy("updatedAt", "desc"), limit(200))),
    [db, userId]
  )
  const { data: resumes } = useCollection(resumesQuery)

  const [supportNoteDraft, setSupportNoteDraft] = useState("")
  const [isSavingSupportNote, setIsSavingSupportNote] = useState(false)
  const supportNotes = [...((profile?.adminNotes as SupportNote[]) || [])].sort((a, b) => new Date(String(b?.createdAt || 0)).getTime() - new Date(String(a?.createdAt || 0)).getTime())
  const startShadowSession = () => {
    if (!userId) return
    sessionStorage.setItem("admin_impersonation_uid", userId)
    sessionStorage.setItem("admin_impersonation_origin", `/admin/users/${userId}`)
    window.location.assign("/dashboard")
  }

  const handleAdminToggle = async (active: boolean) => {
    if (!adminRecord || !profile || !adminDocRef || !userId) return
    try {
      if (active) {
        await setDoc(adminDocRef, { uid: userId, email: profile.email, isActive: true, roleIds: ["admin"], createdAt: serverTimestamp() }, { merge: true })
      } else {
        await deleteDoc(adminDocRef)
      }
      await logAdminAction(db, {
        actorUid: adminRecord.uid,
        actorEmail: adminRecord.email,
        action: active ? "grant_admin" : "revoke_admin",
        targetType: "user",
        targetId: userId,
        reason: "Administrative manual override",
      })
      toast({ title: "Success", description: active ? "Admin rights granted." : "Admin rights revoked." })
    } catch {
      toast({ variant: "destructive", title: "Failed", description: "Security violation or network error." })
    }
  }

  const handleRoleToggle = async (roleId: string) => {
    if (!targetAdmin || !adminRecord || !adminDocRef || !userId) return
    const currentRoles = targetAdmin.roleIds || []
    const newRoles = currentRoles.includes(roleId) ? currentRoles.filter((role: string) => role !== roleId) : [...currentRoles, roleId]
    try {
      await updateDoc(adminDocRef, { roleIds: newRoles, updatedAt: serverTimestamp() })
      await logAdminAction(db, {
        actorUid: adminRecord.uid,
        actorEmail: adminRecord.email,
        action: "update_admin_roles",
        targetType: "admin_user",
        targetId: userId,
        newValue: { roleIds: newRoles },
        reason: `Role ${currentRoles.includes(roleId) ? "removed" : "granted"}: ${roleId}`,
      })
      toast({ title: "Roles Updated" })
    } catch {
      toast({ variant: "destructive", title: "Update Failed" })
    }
  }

  const handleAction = async (action: string, update: Record<string, unknown>) => {
    if (!adminRecord || !userRef || !userId) return
    try {
      await updateDoc(userRef, { ...update, updatedAt: serverTimestamp() })
      await logAdminAction(db, {
        actorUid: adminRecord.uid,
        actorEmail: adminRecord.email,
        action,
        targetType: "user",
        targetId: userId,
        newValue: update,
        reason: "Administrative action from user detail page",
      })
      toast({ title: "Action Successful", description: `User ${userId} has been updated.` })
    } catch {
      toast({ variant: "destructive", title: "Action Failed", description: "Failed to update user record." })
    }
  }

  const handleAddSupportNote = async () => {
    if (!adminRecord || !supportNoteDraft.trim() || !userRef || !userId) return
    setIsSavingSupportNote(true)
    const notePayload = {
      id: `${Date.now()}`,
      body: supportNoteDraft.trim(),
      authorEmail: adminRecord.email,
      createdAt: new Date().toISOString(),
    }
    try {
      await updateDoc(userRef, { adminNotes: arrayUnion(notePayload), updatedAt: serverTimestamp() })
      await logAdminAction(db, {
        actorUid: adminRecord.uid,
        actorEmail: adminRecord.email,
        action: "add_support_note",
        targetType: "user",
        targetId: userId,
        newValue: notePayload,
        reason: "Internal support note added from user detail page",
      })
      setSupportNoteDraft("")
      toast({ title: "Support Note Added", description: "The note is now available to the governance team." })
    } catch {
      toast({ variant: "destructive", title: "Save Failed", description: "The support note could not be saved." })
    } finally {
      setIsSavingSupportNote(false)
    }
  }

  if (!userId) {
    return (
      <div className="py-24 text-center">
        <h2 className="text-2xl font-black uppercase text-slate-900">Invalid User Route</h2>
        <p className="mt-2 text-slate-500">The selected user link is missing a valid account identifier.</p>
        <Button asChild className="mt-8 h-12 rounded-xl px-10 font-bold" variant="outline">
          <Link href="/admin/users">Back to User Management</Link>
        </Button>
      </div>
    )
  }

  if (isLoading) {
    return <div className="flex h-96 items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>
  }

  if (!profile) {
    return (
      <div className="py-24 text-center">
        <h2 className="text-2xl font-black uppercase text-slate-900">User Not Found</h2>
        <p className="mt-2 text-slate-500">The requested user ID does not exist in our system.</p>
        <Button asChild className="mt-8 h-12 rounded-xl px-10 font-bold" variant="outline"><Link href="/admin/users">Back to User Management</Link></Button>
      </div>
    )
  }

  return (
    <div className="space-y-5 md:space-y-8">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" asChild className="h-10 w-10 rounded-xl hover:bg-slate-100"><Link href="/admin/users"><ArrowLeft className="h-5 w-5" /></Link></Button>
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-black uppercase tracking-tight text-slate-900 sm:text-3xl">{profile.firstName ? `${profile.firstName} ${profile.lastName}` : "User Profile"}</h1>
              {profile.suspended && <Badge variant="destructive" className="h-5 rounded-md px-2 py-0 text-[10px] font-black uppercase tracking-widest">Suspended</Badge>}
            </div>
            <p className="mt-0.5 break-all text-sm font-medium uppercase tracking-wider text-slate-500">{userId}</p>
          </div>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button variant="outline" className="h-11 rounded-xl border-2 text-[10px] font-bold uppercase tracking-widest" onClick={startShadowSession}>
            <UserCheck className="mr-2 h-4 w-4" /> Impersonate User
          </Button>
          <Button variant={profile.suspended ? "outline" : "destructive"} className="h-11 rounded-xl px-6 text-xs font-bold uppercase shadow-lg shadow-red-500/10" onClick={() => handleAction(profile.suspended ? "reactivate_user" : "suspend_user", { suspended: !profile.suspended })}>
            {profile.suspended ? <UserPlus className="mr-2 h-4 w-4" /> : <UserX className="mr-2 h-4 w-4" />}
            {profile.suspended ? "Reactivate Account" : "Suspend Account"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3 lg:gap-8">
        <div className="space-y-6">
            <Card className="overflow-hidden rounded-[1.5rem] border-none shadow-sm sm:rounded-3xl">
            <CardContent className="space-y-5 px-4 py-4 sm:px-6 sm:py-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16 rounded-2xl bg-slate-100 ring-1 ring-black/5">
                  <AvatarImage src={typeof profile.photoURL === "string" && profile.photoURL.trim() ? profile.photoURL : undefined} />
                  <AvatarFallback className="rounded-2xl bg-slate-100 text-2xl font-black text-slate-400">
                    {profile.email?.[0]?.toUpperCase() || profile.firstName?.[0]?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate text-base font-black text-slate-900">{profile.email}</p>
                  <p className="mt-1 text-[11px] font-semibold uppercase tracking-widest text-slate-400">{profile.plan || "free"} plan</p>
                </div>
              </div>
              <div className="grid gap-3 text-sm">
                <div className="flex items-center gap-2 text-slate-600"><Mail className="h-4 w-4 text-slate-400" /> {profile.email}</div>
                <div className="flex items-center gap-2 text-slate-600"><Clock className="h-4 w-4 text-slate-400" /> {profile.createdAt?.toDate ? profile.createdAt.toDate().toLocaleDateString() : "N/A"}</div>
                <div className="flex items-center gap-2 text-slate-600"><Zap className={`h-4 w-4 ${profile.plan === "free" ? "text-slate-400" : "text-primary"}`} /> {profile.plan || "Free"} tier</div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400"><FileText className="h-3 w-3 text-blue-500" /> Resumes</div>
                  <p className="mt-2 text-2xl font-black text-slate-900">{resumes?.length || 0}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400"><Target className="h-3 w-3 text-green-500" /> ATS Scans</div>
                  <p className="mt-2 text-2xl font-black text-slate-900">{profile.usage?.atsChecks || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Tabs defaultValue="management" className="w-full">
            <TabsList className="no-scrollbar flex h-auto w-full justify-start gap-2 overflow-x-auto rounded-2xl bg-white p-1 shadow-sm">
              <TabsTrigger value="management" className="rounded-xl px-4 py-2.5 text-[9px] font-bold uppercase tracking-[0.16em] data-[state=active]:bg-primary data-[state=active]:text-white sm:px-5 sm:py-3 sm:text-[10px] sm:tracking-widest">Plan Management</TabsTrigger>
              <TabsTrigger value="admin" className="rounded-xl px-4 py-2.5 text-[9px] font-bold uppercase tracking-[0.16em] data-[state=active]:bg-primary data-[state=active]:text-white sm:px-5 sm:py-3 sm:text-[10px] sm:tracking-widest">Administrative Access</TabsTrigger>
              <TabsTrigger value="activity" className="rounded-xl px-4 py-2.5 text-[9px] font-bold uppercase tracking-[0.16em] data-[state=active]:bg-primary data-[state=active]:text-white sm:px-5 sm:py-3 sm:text-[10px] sm:tracking-widest">Activity Log</TabsTrigger>
              <TabsTrigger value="notes" className="rounded-xl px-4 py-2.5 text-[9px] font-bold uppercase tracking-[0.16em] data-[state=active]:bg-primary data-[state=active]:text-white sm:px-5 sm:py-3 sm:text-[10px] sm:tracking-widest">Support Notes</TabsTrigger>
            </TabsList>

            <TabsContent value="management" className="mt-6">
              <Card className="rounded-[1.5rem] border-none shadow-sm sm:rounded-3xl">
                <CardHeader>
                  <CardTitle className="text-sm font-black uppercase tracking-widest">Manual Plan Override</CardTitle>
                  <CardDescription className="text-xs font-medium">Grant or revoke tiers without leaving this screen.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    {["free", "pro", "master"].map((plan) => (
                      <Button key={plan} variant="outline" className={cn("h-14 rounded-2xl border-2 text-[10px] font-black uppercase tracking-widest", profile.plan === plan ? "border-primary bg-primary/5 text-primary" : "border-slate-100")} onClick={() => handleAction("manual_plan_assignment", { plan })}>
                        {plan}
                      </Button>
                    ))}
                  </div>
                  <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <p className="text-sm font-bold text-slate-900">Premium Feature Access</p>
                    <p className="mt-1 text-xs text-slate-500">ATS tools, advanced AI writing, and premium templates all follow the user&apos;s plan. Use the quick upgrade path below when you need to unblock a real support case.</p>
                    <Button
                      variant="outline"
                      className="mt-4 h-10 rounded-xl border-2 text-[10px] font-black uppercase"
                      onClick={() => handleAction("manual_plan_assignment", { plan: profile.plan === "master" ? "master" : "pro" })}
                      disabled={profile.plan === "pro" || profile.plan === "master"}
                    >
                      {profile.plan === "free" ? "Move To Pro Tier" : "Already Unlocked"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="admin" className="mt-6">
              <Card className="rounded-[1.5rem] border-none shadow-sm sm:rounded-3xl">
                <CardHeader>
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <CardTitle className="text-sm font-black uppercase tracking-widest">Governance Status</CardTitle>
                      <CardDescription className="text-xs font-medium">Control whether this user can access the Governance Hub.</CardDescription>
                    </div>
                    <div className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-2">
                      <Label htmlFor="admin-toggle" className="text-[10px] font-black uppercase text-slate-500">Admin Active</Label>
                      <Switch id="admin-toggle" checked={!!targetAdmin && targetAdmin.isActive} onCheckedChange={handleAdminToggle} />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {targetAdmin ? (
                    <>
                      <div className="flex items-center gap-3 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-blue-900">
                        <ShieldCheck className="h-5 w-5" />
                        <div>
                          <p className="text-sm font-bold">Administrator record found</p>
                          <p className="text-[11px] font-medium uppercase tracking-widest text-blue-700">Document ID matches UID: {userId}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {["super-admin", "admin", "support-manager", "content-manager"].map((role) => (
                          <Button key={role} variant="outline" className={cn("h-12 justify-start rounded-xl border-2 px-4 text-[10px] font-bold uppercase tracking-widest", targetAdmin.roleIds?.includes(role) ? "border-primary bg-primary/5 text-primary" : "border-slate-100")} onClick={() => handleRoleToggle(role)}>
                            {targetAdmin.roleIds?.includes(role) ? <UserCheck className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
                            {role.replace("-", " ")}
                          </Button>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center">
                      <Fingerprint className="mx-auto h-8 w-8 text-slate-300" />
                      <p className="mt-4 text-sm font-bold text-slate-900">No Admin Permissions Found</p>
                      <p className="mt-2 text-xs text-slate-500">Toggle the switch above to grant initial governance access.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="activity" className="mt-6">
              <Card className="rounded-[1.5rem] border-none shadow-sm sm:rounded-3xl">
                <CardHeader>
                  <CardTitle className="text-sm font-black uppercase tracking-widest">Administrative Timeline</CardTitle>
                  <CardDescription className="text-xs font-medium">Every manual change to this user record is captured here.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isLogsLoading ? (
                    <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-slate-300" /></div>
                  ) : logs?.length ? (
                    logs.map((log: any) => (
                      <div key={log.id} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <Badge variant="secondary" className="w-fit rounded-full bg-slate-900 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-white">{String(log.action || "").replace(/_/g, " ")}</Badge>
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{log.createdAt?.toDate ? log.createdAt.toDate().toLocaleString() : "Recent activity"}</span>
                        </div>
                        <p className="mt-3 text-sm font-bold text-slate-900">{log.reason || "Modified via Administrative Console"}</p>
                        <p className="mt-2 text-[11px] font-medium text-slate-500">Actor: <span className="font-bold text-slate-700">{log.actorEmail}</span></p>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center">
                      <HistoryIcon className="mx-auto h-8 w-8 text-slate-300" />
                      <p className="mt-4 text-sm font-bold text-slate-900">No Activity Records</p>
                      <p className="mt-2 text-xs text-slate-500">All future administrative actions on this account will appear here.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notes" className="mt-6">
              <Card className="rounded-[1.5rem] border-none shadow-sm sm:rounded-3xl">
                <CardHeader>
                  <CardTitle className="text-sm font-black uppercase tracking-widest">Support Notes</CardTitle>
                  <CardDescription className="text-xs font-medium">Internal-only team communication regarding this user.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="rounded-3xl border border-slate-100 bg-slate-50/70 p-4">
                    <Label htmlFor="support-note" className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Add Internal Note</Label>
                    <Textarea id="support-note" value={supportNoteDraft} onChange={(event) => setSupportNoteDraft(event.target.value)} placeholder="Capture billing context, governance decisions, escalation notes, or next actions for the team." className="mt-3 min-h-[120px] rounded-2xl border-slate-100 bg-white text-sm" />
                    <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-xs font-medium text-slate-500">These notes stay attached to the user record for future follow-up.</p>
                      <Button variant="outline" size="sm" className="h-10 rounded-xl border-2 px-4 text-[10px] font-black uppercase" onClick={handleAddSupportNote} disabled={!supportNoteDraft.trim() || isSavingSupportNote}>
                        {isSavingSupportNote ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <Plus className="mr-2 h-3 w-3" />}
                        Add Note
                      </Button>
                    </div>
                  </div>

                  {supportNotes.length ? (
                    <div className="space-y-4">
                      {supportNotes.map((note) => (
                        <div key={note.id || note.createdAt} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                          <p className="text-sm font-medium leading-relaxed text-slate-700">{note.body || "Untitled internal note"}</p>
                          <div className="mt-3 flex flex-col gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 sm:flex-row sm:items-center sm:justify-between">
                            <span>{note.authorEmail || "Admin Team"}</span>
                            <span>{note.createdAt ? new Date(note.createdAt).toLocaleString() : "Recently added"}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center">
                      <MessageSquare className="mx-auto h-8 w-8 text-slate-300" />
                      <p className="mt-4 text-sm font-bold text-slate-900">No support notes yet</p>
                      <p className="mt-2 text-xs text-slate-500">Record internal decisions, support history, or follow-up actions so the next admin has full context.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
