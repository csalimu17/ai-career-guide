"use client"

import { useFirestore, useDoc, useUser } from "@/firebase"
import { doc } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { ShieldX, User, AlertTriangle, Loader2 } from "lucide-react"

export function ImpersonationBanner() {
  const { user: authUser, impersonatedUid } = useUser()
  const db = useFirestore()

  const { data: user, isLoading } = useDoc(
    impersonatedUid ? doc(db, "users", impersonatedUid) : null
  )

  if (!impersonatedUid || !authUser) return null

  const exitImpersonation = () => {
    const origin = sessionStorage.getItem("admin_impersonation_origin") || "/admin/users"
    sessionStorage.removeItem("admin_impersonation_uid")
    sessionStorage.removeItem("admin_impersonation_origin")
    window.location.assign(origin)
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-orange-600 text-white px-4 py-2.5 shadow-2xl flex items-center justify-between">
      <div className="flex items-center gap-6 overflow-hidden">
        <div className="flex bg-orange-700/50 rounded-lg px-3 py-1 items-center gap-2 border border-orange-400/20 shrink-0">
           <AlertTriangle className="h-4 w-4 text-orange-200 animate-pulse" />
           <span className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-100">Impersonation Active</span>
        </div>
        
        <div className="flex items-center gap-3 truncate min-w-0">
           <div className="h-8 w-8 rounded-full bg-orange-500/50 flex items-center justify-center border border-orange-400/30 shrink-0">
              <User className="h-4 w-4 text-white" />
           </div>
           {isLoading ? (
             <Loader2 className="h-4 w-4 animate-spin opacity-50" />
           ) : (
             <div className="flex flex-col min-w-0">
                <p className="text-xs font-black truncate uppercase tracking-tight">Viewing as: {user?.displayName || user?.email || 'Unknown User'}</p>
                <p className="text-[10px] font-medium text-orange-200/80 truncate italic">Governance Session ID: {impersonatedUid.slice(0, 12)}...</p>
             </div>
           )}
        </div>
      </div>

      <Button 
        variant="ghost" 
        className="h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white font-black text-[10px] uppercase tracking-widest px-6 gap-2 border border-white/20"
        onClick={exitImpersonation}
      >
        <ShieldX className="h-4 w-4" /> Exit Session
      </Button>
    </div>
  )
}
