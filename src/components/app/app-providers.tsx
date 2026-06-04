"use client"

import React from "react"
import { FirebaseClientProvider } from "@/firebase/client-provider"
import { ImpersonationBanner } from "@/components/admin/impersonation-banner"
import { Toaster } from "@/components/ui/toaster"

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <FirebaseClientProvider>
      <ImpersonationBanner />
      {children}
      <Toaster />
    </FirebaseClientProvider>
  )
}

