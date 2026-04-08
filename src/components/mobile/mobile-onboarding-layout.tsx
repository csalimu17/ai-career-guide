"use client"

import { HistoryButtons } from "@/components/navigation/history-buttons"
import { Toaster } from "@/components/ui/toaster"

type MobileOnboardingLayoutProps = {
  children: React.ReactNode
  impersonatedUid?: string | null
  onStopImpersonation?: () => void
}

export function MobileOnboardingLayout({
  children,
  impersonatedUid,
  onStopImpersonation,
}: MobileOnboardingLayoutProps) {
  return (
    <div className="min-h-[100dvh] overflow-x-hidden bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(243,246,255,0.98))] md:hidden">
      {impersonatedUid ? (
        <div className="sticky top-0 z-[110] flex items-center justify-between gap-3 bg-destructive px-4 py-2 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-destructive-foreground">
          <span className="truncate">Shadowing {impersonatedUid}</span>
          <button
            type="button"
            onClick={onStopImpersonation}
            className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[0.6rem] font-bold text-white"
          >
            Exit
          </button>
        </div>
      ) : null}

      <header className="sticky top-0 z-[100] border-b border-white/80 bg-white/90 backdrop-blur-xl">
        <div className="flex items-center justify-between gap-3 px-4 pb-2.5 pt-[max(0.75rem,env(safe-area-inset-top))]">
          <HistoryButtons fallbackHref="/dashboard" buttonClassName="h-10 w-10 rounded-2xl bg-white shadow-sm" />
          <div className="min-w-0 text-right">
            <p className="text-[0.58rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              Guided setup
            </p>
            <p className="truncate text-[0.98rem] font-black tracking-tight text-primary">Profile calibration</p>
          </div>
        </div>
      </header>

      <main className="mobile-app-page pb-[calc(env(safe-area-inset-bottom)+2rem)]">
        {children}
      </main>
      <Toaster />
    </div>
  )
}
