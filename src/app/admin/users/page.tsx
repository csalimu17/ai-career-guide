"use client"

import { useState } from "react"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { query, collection, orderBy, limit, where } from "firebase/firestore"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  Search, 
  Filter, 
  MoreHorizontal, 
  ExternalLink, 
  ShieldAlert,
  UserCheck,
  UserX,
  Loader2,
  CheckCircle2,
  RefreshCw,
  XCircle
} from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { useAdminAuth } from "@/hooks/use-admin-auth"
import { useUser } from "@/firebase"
import { doc, updateDoc, serverTimestamp } from "firebase/firestore"
import { logAdminAction } from "@/lib/admin/audit-logger"

function toCsvValue(value: unknown) {
  const text = String(value ?? "")
  return `"${text.replace(/"/g, '""')}"`
}

export default function UserManagementPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [planFilter, setPlanFilter] = useState<string | null>(null)
  const [isSyncingUsers, setIsSyncingUsers] = useState(false)
  const db = useFirestore()
  const { toast } = useToast()
  const { adminRecord } = useAdminAuth()
  const { user } = useUser()

  // Real-time query for users
  const usersQuery = useMemoFirebase(() => query(
    collection(db, "users"),
    orderBy("createdAt", "desc"),
    limit(50)
  ), [db])
  
  const { data: users, isLoading } = useCollection(usersQuery)

  const filteredUsers = users?.filter(user => {
    const matchesSearch = !searchTerm || 
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesPlan = !planFilter || user.plan === planFilter
    
    return matchesSearch && matchesPlan
  })

  const startShadowSession = (targetUserId: string) => {
    sessionStorage.setItem("admin_impersonation_uid", targetUserId)
    sessionStorage.setItem("admin_impersonation_origin", "/admin/users")
    window.location.assign("/dashboard")
  }

  const handleExportCsv = () => {
    if (!filteredUsers?.length) return

    const header = ["Email", "First Name", "Last Name", "Plan", "Verified", "Suspended", "Created At"]
    const rows = filteredUsers.map((user) => [
      user.email,
      user.firstName,
      user.lastName,
      user.plan || "free",
      user.verified ? "yes" : "no",
      user.suspended ? "yes" : "no",
      user.createdAt?.toDate ? user.createdAt.toDate().toISOString() : "",
    ])

    const csv = [header, ...rows]
      .map((row) => row.map((cell) => toCsvValue(cell)).join(","))
      .join("\n")

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = "users-export.csv"
    anchor.click()
    URL.revokeObjectURL(url)
    toast({
      title: "CSV exported",
      description: `${filteredUsers.length} governance user records were prepared for download.`,
    })
  }

  const handleUserAction = async (userId: string, action: 'suspend' | 'unsuspend' | 'verify' | 'unverify' | 'reset' | 'set-free' | 'set-pro' | 'set-master', userEmail: string) => {
    if (!adminRecord) return;
    const userRef = doc(db, "users", userId);
    
    const logParams = {
      actorUid: adminRecord.uid,
      actorEmail: adminRecord.email || 'unknown',
      targetType: "USER",
      targetId: userId,
      reason: "Admin manual action"
    };

    try {
      switch (action) {
        case 'suspend':
          await updateDoc(userRef, { suspended: true, updatedAt: serverTimestamp() });
          toast({ title: "Account Suspended", description: `User ${userEmail} has been restricted.` });
          await logAdminAction(db, { ...logParams, action: "USER_SUSPENDED" });
          break;
        case 'unsuspend':
          await updateDoc(userRef, { suspended: false, updatedAt: serverTimestamp() });
          toast({ title: "Account Restored", description: `User ${userEmail} has been unsuspended.` });
          await logAdminAction(db, { ...logParams, action: "USER_UNSUSPENDED" });
          break;
        case 'verify':
          await updateDoc(userRef, { verified: true, updatedAt: serverTimestamp() });
          toast({ title: "User Verified", description: `${userEmail} marked as trusted.` });
          await logAdminAction(db, { ...logParams, action: "USER_VERIFIED" });
          break;
        case 'unverify':
          await updateDoc(userRef, { verified: false, updatedAt: serverTimestamp() });
          toast({ title: "Verification Removed", description: `Trust status revoked for ${userEmail}.` });
          await logAdminAction(db, { ...logParams, action: "USER_UNVERIFIED" });
          break;
        case 'set-free':
          await updateDoc(userRef, { plan: 'free', updatedAt: serverTimestamp() });
          toast({ title: "Downgraded to Free", description: `${userEmail} is now on the basic tier.` });
          await logAdminAction(db, { ...logParams, action: "PLAN_UPDATED", newValue: { plan: 'free' } });
          break;
        case 'set-pro':
          await updateDoc(userRef, { plan: 'pro', updatedAt: serverTimestamp() });
          toast({ title: "Upgraded to Pro", description: `${userEmail} is now a Premium member.` });
          await logAdminAction(db, { ...logParams, action: "PLAN_UPDATED", newValue: { plan: 'pro' } });
          break;
        case 'set-master':
          await updateDoc(userRef, { plan: 'master', updatedAt: serverTimestamp() });
          toast({ title: "Upgraded to Master", description: `${userEmail} now has full Master access.` });
          await logAdminAction(db, { ...logParams, action: "PLAN_UPDATED", newValue: { plan: 'master' } });
          break;
        case 'reset':
          await updateDoc(userRef, {
            securityReviewRequestedAt: serverTimestamp(),
            securityReviewRequestedBy: adminRecord.uid,
            updatedAt: serverTimestamp(),
          });
          await logAdminAction(db, { ...logParams, action: "SECURITY_REVIEW_REQUESTED" });
          toast({ 
            title: "Security Review Requested", 
            description: `A governance review flag was added for ${userEmail}.`,
            variant: "default" 
          });
          break;
      }
    } catch (error) {
      console.error("Action failed:", error);
      toast({ title: "Command Failed", description: "Authorization error or network failure.", variant: "destructive" });
    }
  }

  const handleSyncUsers = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in again before syncing governance records.",
        variant: "destructive",
      })
      return
    }

    setIsSyncingUsers(true)

    try {
      const idToken = await user.getIdToken()
      const response = await fetch("/api/admin/users/sync", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      })

      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload?.error || "Unable to sync governance records.")
      }

      toast({
        title: "Governance sync complete",
        description: `Checked ${payload.inspectedCount} auth users, created ${payload.createdCount} new records, and refreshed ${payload.updatedCount} existing profiles.`,
      })
    } catch (error) {
      console.error("User sync failed:", error)
      toast({
        title: "Sync failed",
        description: error instanceof Error ? error.message : "Unable to sync governance records right now.",
        variant: "destructive",
      })
    } finally {
      setIsSyncingUsers(false)
    }
  }

  return (
    <div className="space-y-5 md:space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase sm:text-3xl">User Management</h1>
          <p className="text-slate-500 font-medium text-sm mt-1">Monitor, support, and govern your global user base.</p>
        </div>
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
           <Button
             variant="outline"
             className="h-11 rounded-xl border-slate-200 shadow-sm sm:w-auto"
             onClick={handleSyncUsers}
             disabled={isSyncingUsers}
           >
             {isSyncingUsers ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
             Sync New Users
           </Button>
           <Button
             variant="outline"
             className="h-11 rounded-xl border-slate-200 shadow-sm sm:w-auto"
             onClick={handleExportCsv}
             disabled={!filteredUsers?.length}
           >
             <ExternalLink className="h-4 w-4 mr-2" />
             Export CSV
           </Button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col gap-3 rounded-[1.4rem] border-none bg-white p-3 shadow-sm md:flex-row md:items-center md:gap-4 md:p-4">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input 
            placeholder="Search by name or email..." 
            className="pl-10 h-11 bg-slate-50 border-none rounded-xl focus-visible:ring-primary/20"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex w-full items-center gap-3 md:w-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-11 w-full justify-center rounded-xl bg-slate-50 px-6 font-bold text-slate-600 hover:bg-slate-100 md:w-auto">
                <Filter className="h-4 w-4 mr-2" />
                {planFilter ? `Plan: ${planFilter.toUpperCase()}` : "All Plans"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 rounded-xl p-2 shadow-xl border-none ring-1 ring-black/5">
              <DropdownMenuItem className="rounded-lg font-bold uppercase text-[10px] tracking-widest py-2" onClick={() => setPlanFilter(null)}>All Plans</DropdownMenuItem>
              <DropdownMenuItem className="rounded-lg font-bold uppercase text-[10px] tracking-widest py-2" onClick={() => setPlanFilter("free")}>Free</DropdownMenuItem>
              <DropdownMenuItem className="rounded-lg font-bold uppercase text-[10px] tracking-widest py-2" onClick={() => setPlanFilter("pro")}>Pro</DropdownMenuItem>
              <DropdownMenuItem className="rounded-lg font-bold uppercase text-[10px] tracking-widest py-2" onClick={() => setPlanFilter("master")}>Master</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* User Table */}
      <div className="space-y-3 md:hidden">
        {isLoading ? (
          <div className="rounded-[1.4rem] bg-white px-5 py-14 text-center shadow-sm">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
            <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Synchronizing Records</p>
          </div>
        ) : filteredUsers?.length === 0 ? (
          <div className="rounded-[1.4rem] bg-white px-5 py-14 text-center shadow-sm">
            <p className="text-sm font-bold text-slate-900">No users found</p>
            <p className="mt-2 text-xs font-medium text-slate-500">Adjust the search or plan filter to widen the result set.</p>
          </div>
        ) : filteredUsers?.map((user) => (
          <div key={user.id} className="rounded-[1.35rem] bg-white p-4 shadow-sm ring-1 ring-black/5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <Avatar className="h-11 w-11 border-2 border-white shadow-sm ring-1 ring-slate-100">
                  <AvatarImage src={user.photoURL} />
                  <AvatarFallback className="bg-slate-100 text-xs font-bold text-slate-400">{user.email?.[0].toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate text-sm font-black text-slate-900">{user.firstName ? `${user.firstName} ${user.lastName}` : "Unnamed User"}</p>
                  <p className="truncate text-[11px] font-medium text-slate-500">{user.email}</p>
                </div>
              </div>
              <Badge variant="outline" className={`border-none px-2 py-1 text-[9px] font-black uppercase tracking-widest ${
                user.plan === 'master' ? 'bg-indigo-600 text-white' :
                user.plan === 'pro' ? 'bg-primary text-white' :
                'bg-slate-100 text-slate-600'
              }`}>
                {user.plan || 'free'}
              </Badge>
            </div>

            <div className="mt-4 flex items-center justify-between text-[11px] font-medium text-slate-500">
              <span>{user.verified ? "Verified" : "Unverified"}</span>
              <span>{user.suspended ? "Suspended" : "Active"}</span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <Button asChild variant="outline" className="h-9 rounded-xl border-2 px-2 text-[9px] font-black uppercase tracking-[0.16em]">
                <Link href={`/admin/users/${user.id}`}>View Details</Link>
              </Button>
              <Button
                variant="outline"
                className="h-9 rounded-xl border-2 px-2 text-[9px] font-black uppercase tracking-[0.16em]"
                onClick={() => startShadowSession(user.id)}
              >
                Shadow User
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="hidden overflow-hidden rounded-2xl border-none bg-white shadow-sm md:block">
        <Table>
          <TableHeader className="bg-slate-50/50">
            <TableRow className="hover:bg-transparent border-slate-100">
              <TableHead className="text-[10px] font-black uppercase tracking-widest py-5 pl-6">User Identity</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest py-5">Subscription</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest py-5">Status</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest py-5 text-right pr-6">Management</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="h-64 text-center">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Synchronizing Records</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredUsers?.length === 0 ? (
               <TableRow>
                <TableCell colSpan={4} className="h-64 text-center">
                   <p className="text-sm font-bold text-slate-400 capitalize">No user found matching your criteria.</p>
                </TableCell>
              </TableRow>
            ) : filteredUsers?.map((user) => (
              <TableRow key={user.id} className="hover:bg-slate-50/50 transition-colors border-slate-50">
                <TableCell className="pl-6 py-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-10 w-10 border-2 border-white shadow-sm ring-1 ring-slate-100">
                      <AvatarImage src={user.photoURL} />
                      <AvatarFallback className="bg-slate-100 text-slate-400 text-xs font-bold">{user.email?.[0].toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-sm font-black text-slate-900 tracking-tight leading-none">
                          {user.firstName ? `${user.firstName} ${user.lastName}` : "Unnamed User"}
                        </span>
                        {user.verified && (
                          <CheckCircle2 className="h-3 w-3 text-blue-500" fill="currentColor" />
                        )}
                      </div>
                      <span className="text-[11px] text-slate-500 font-medium lowercase italic leading-none">{user.email}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <Badge variant="outline" className={`w-fit rounded-lg font-black uppercase text-[9px] tracking-widest px-2 py-0.5 border-none shadow-sm ${
                      user.plan === 'master' ? 'bg-indigo-600 text-white' : 
                      user.plan === 'pro' ? 'bg-primary text-white' : 
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {user.plan || 'free'}
                    </Badge>
                    <span className="text-[10px] text-slate-400 font-medium mt-1 uppercase tracking-tighter">
                      Customer Since {user.createdAt?.toDate ? user.createdAt.toDate().toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                   {user.suspended ? (
                     <Badge variant="destructive" className="rounded-lg font-black uppercase text-[9px] tracking-widest px-2 py-0.5 shadow-sm shadow-red-500/10">
                       Suspended
                     </Badge>
                   ) : (
                     <div className="flex items-center gap-1.5 text-green-600 font-bold uppercase text-[10px] tracking-widest">
                       <UserCheck className="h-3 w-3" />
                       Active
                     </div>
                   )}
                </TableCell>
                <TableCell className="text-right pr-6">
                  <div className="flex items-center justify-end gap-2">
                    <Button variant="ghost" size="sm" asChild className="h-9 font-bold text-xs uppercase text-slate-400 hover:text-primary hover:bg-primary/5 rounded-xl">
                      <Link href={`/admin/users/${user.id}`}>View Details</Link>
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-slate-100"><MoreHorizontal className="h-4 w-4 text-slate-400" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56 p-2 rounded-2xl border-none shadow-2xl ring-1 ring-black/5">
                        <DropdownMenuItem 
                          className="rounded-xl font-bold uppercase text-[10px] tracking-widest flex items-center gap-2 py-2.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 cursor-pointer"
                          onClick={() => startShadowSession(user.id)}
                        >
                          <Search className="h-4 w-4" /> Shadow This User
                        </DropdownMenuItem>
                        
                        <div className="h-px bg-slate-50 my-1" />
                        <p className="px-3 py-1 text-[8px] font-black uppercase text-slate-400 tracking-tighter">Grant Access</p>
                        <DropdownMenuItem 
                          className="rounded-xl font-bold uppercase text-[10px] tracking-widest flex items-center gap-2 py-2.5 text-primary hover:bg-primary/5 cursor-pointer disabled:opacity-50"
                          disabled={user.plan === 'pro'}
                          onClick={() => handleUserAction(user.id, 'set-pro', user.email)}
                        >
                          <CheckCircle2 className="h-4 w-4" /> Grant Pro (Premium)
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="rounded-xl font-bold uppercase text-[10px] tracking-widest flex items-center gap-2 py-2.5 text-indigo-600 hover:bg-indigo-50 cursor-pointer disabled:opacity-50"
                          disabled={user.plan === 'master'}
                          onClick={() => handleUserAction(user.id, 'set-master', user.email)}
                        >
                          <CheckCircle2 className="h-4 w-4" /> Grant Master Access
                        </DropdownMenuItem>
                        {user.plan !== 'free' && (
                          <DropdownMenuItem 
                            className="rounded-xl font-bold uppercase text-[10px] tracking-widest flex items-center gap-2 py-2.5 text-slate-500 hover:bg-slate-50 cursor-pointer"
                            onClick={() => handleUserAction(user.id, 'set-free', user.email)}
                          >
                            <XCircle className="h-4 w-4" /> Downgrade to Free
                          </DropdownMenuItem>
                        )}
                        <div className="h-px bg-slate-50 my-1" />
                        <DropdownMenuItem 
                          className="rounded-xl font-bold uppercase text-[10px] tracking-widest flex items-center gap-2 py-2.5"
                          onClick={() => handleUserAction(user.id, user.verified ? 'unverify' : 'verify', user.email)}
                        >
                          {user.verified ? (
                            <>
                              <XCircle className="h-4 w-4 text-slate-400" /> Remove Verification
                            </>
                          ) : (
                            <>
                              <UserCheck className="h-4 w-4 text-slate-400" /> Mark as Verified
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="rounded-xl font-bold uppercase text-[10px] tracking-widest flex items-center gap-2 py-2.5 text-red-600 focus:text-red-600 focus:bg-red-50"
                          onClick={() => handleUserAction(user.id, user.suspended ? 'unsuspend' : 'suspend', user.email)}
                        >
                          {user.suspended ? (
                            <>
                              <UserCheck className="h-4 w-4" /> Unsuspend Account
                            </>
                          ) : (
                            <>
                              <UserX className="h-4 w-4" /> Suspend Account
                            </>
                          )}
                        </DropdownMenuItem>
                        <div className="h-px bg-slate-50 my-1" />
                        <DropdownMenuItem 
                          className="rounded-xl font-bold uppercase text-[10px] tracking-widest flex items-center gap-2 py-2.5 text-slate-400"
                          onClick={() => handleUserAction(user.id, 'reset', user.email)}
                        >
                          <ShieldAlert className="h-4 w-4" /> Request Security Review
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
