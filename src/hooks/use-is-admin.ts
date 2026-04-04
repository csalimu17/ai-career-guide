import { useEffect } from "react"
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase"
import { doc } from "firebase/firestore"

export function useIsAdmin() {
  const { user, isUserLoading, impersonatedUid, clearImpersonation } = useUser()
  const db = useFirestore()

  const adminDocRef = useMemoFirebase(() => {
    if (!db || !user) return null
    return doc(db, 'adminUsers', user.uid)
  }, [db, user])

  const { data: adminRecord, isLoading: isAdminLoading, error } = useDoc(adminDocRef, { suppressGlobalError: true })

  const isAdmin = adminRecord?.isActive === true

  useEffect(() => {
    if (!isAdminLoading && !isAdmin && impersonatedUid) {
      console.warn("Unauthorized impersonation attempt detected. Clearing stale session.")
      clearImpersonation()
    }
  }, [isAdmin, isAdminLoading, impersonatedUid, clearImpersonation])

  return {
    isAdmin,
    isLoading: isUserLoading || isAdminLoading,
    adminRecord,
    error
  }
}
