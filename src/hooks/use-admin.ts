"use client"

import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase"
import { doc } from "firebase/firestore"

export function useAdmin() {
  const { user, isUserLoading } = useUser()
  const db = useFirestore()

  const userDocRef = useMemoFirebase(() => {
    if (!db || !user) return null
    return doc(db, 'users', user.uid)
  }, [db, user])

  const { data: profile, isLoading: isProfileLoading } = useDoc(userDocRef)

  const isAdmin = profile?.role === 'admin'
  const isLoading = isUserLoading || isProfileLoading

  return {
    isAdmin,
    isLoading,
    profile,
    user
  }
}
