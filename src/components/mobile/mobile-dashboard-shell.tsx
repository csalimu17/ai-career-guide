"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { LogOut, Menu, ShieldCheck, Sparkles, Zap } from "lucide-react"

import { initiateSignOut } from "@/firebase/non-blocking-login"
import { useAuth } from "@/firebase"
import { BrandWordmark } from "@/components/brand/brand-wordmark"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Toaster } from "@/components/ui/toaster"
import {
  MOBILE_ADMIN_NAV_ITEMS,
  getMobileSectionLabel,
  isMobileNavActive,
  MOBILE_PRIMARY_NAV_ITEMS,
  MOBILE_SECONDARY_NAV_ITEMS,
} from "@/components/mobile/mobile-nav-config"
import { useIsAdmin } from "@/hooks/use-is-admin"
import { cn } from "@/lib/utils"

type MobileDashboardShellProps = {
  children: React.ReactNode
  profile?: any
  user: any
  impersonatedUid?: string | null
  onStopImpersonation?: () => void
}

export function MobileDashboardShell({
  children,
  profile,
  user,
  impersonatedUid,
  onStopImpersonation,
}: MobileDashboardShellProps) {
  const pathname = usePathname()
  const auth = useAuth()
  const { isAdmin } = useIsAdmin()
  const [menuOpen, setMenuOpen] = useState(false)

  const planLabel = useMemo(() => (profile?.plan || "free").toUpperCase(), [profile?.plan])
  const sectionLabel = getMobileSectionLabel(pathname)

  const profileName =
    profile?.firstName
      ? `${profile.firstName} ${profile.lastName || ""}`.trim()
      : user.displayName || user.email?.split("@")[0] || "Workspace User"

  const avatarSrc = impersonatedUid ? profile?.photoURL : user.photoURL

  const handleNavigate = () => {
    setMenuOpen(false)
  }

  const isEditor = pathname.startsWith('/editor')

  return (
    <div className="min-h-[100dvh] overflow-x-hidden bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(243,246,255,0.98))] print:min-h-0 print:bg-white md:hidden">
      {impersonatedUid ? (
        <div className="no-print sticky top-0 z-[110] flex items-center justify-between gap-3 bg-destructive px-4 py-2 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-destructive-foreground">
          <span className="truncate">Shadowing {impersonatedUid}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={onStopImpersonation}
            className="h-7 rounded-full border border-white/20 bg-white/10 px-3 text-[0.6rem] font-bold text-white hover:bg-white/20"
          >
            Exit
          </Button>
        </div>
      ) : null}

      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        {!isEditor && (
          <header className="no-print sticky top-0 z-[100] border-b border-white/80 bg-white/90 backdrop-blur-xl">
            <div className="px-3 pb-2.5 pt-[max(0.75rem,env(safe-area-inset-top))]">
              <div className="flex items-center justify-between gap-3">

                <SheetTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                  className="h-10 w-10 shrink-0 rounded-2xl border-white/80 bg-white/92 shadow-sm"
                  >
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Open navigation</span>
                  </Button>
                </SheetTrigger>
                <SheetContent
                  side="left"
                  className="flex h-[100dvh] w-[min(23.5rem,calc(100vw-0.35rem))] flex-col overflow-hidden rounded-r-[1.75rem] border-r border-border/70 bg-[linear-gradient(180deg,#ffffff,#f7f8ff)] p-0 z-[150]"
                >
                  <SheetHeader className="shrink-0 border-b border-border/70 px-3.5 pb-4 pr-16 pt-[max(1rem,env(safe-area-inset-top))] text-left">
                    <div className="flex items-center justify-between gap-3">
                      <BrandWordmark className="text-[1.3rem]" />
                      <Badge className="rounded-full border-primary/20 bg-primary/5 px-3 py-1 text-[0.58rem] font-black uppercase tracking-[0.18em] text-primary">
                        {planLabel}
                      </Badge>
                    </div>
                    <SheetTitle className="pt-3 text-left text-[1.45rem] font-black tracking-tight text-primary">
                      Career workspace
                    </SheetTitle>
                    <SheetDescription className="text-left text-[0.88rem] leading-6 text-muted-foreground">
                      Reach every key area in one tap with a mobile-first navigation surface.
                    </SheetDescription>
                  </SheetHeader>

                  <div className="flex min-h-0 flex-1 flex-col">
                    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pb-28 pt-4">
                      <div className="rounded-[1.35rem] border border-border/70 bg-white/92 p-3.5 shadow-sm">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-11 w-11 border border-white/70 shadow-sm">
                            <AvatarImage src={avatarSrc} />
                            <AvatarFallback className="bg-primary text-white font-bold">
                              {(profileName[0] || "U").toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="truncate text-[0.95rem] font-black tracking-tight text-primary">{profileName}</p>
                            <p className="text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                              {impersonatedUid ? "Shadowing session" : `${planLabel} workspace`}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-5 space-y-2">
                        <p className="px-2 text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                          Main pipeline
                        </p>
                        {MOBILE_PRIMARY_NAV_ITEMS.map((item) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={handleNavigate}
                            className={cn(
                              "flex items-center gap-3 rounded-[1.2rem] px-3.5 py-3 transition-all",
                              isMobileNavActive(pathname, item.href)
                                ? "bg-primary text-white shadow-lg shadow-primary/15"
                                : "bg-white/80 text-primary shadow-sm hover:bg-white"
                            )}
                          >
                            <item.icon className="h-5 w-5 shrink-0" />
                            <div className="min-w-0">
                              <p className="truncate text-[0.86rem] font-black tracking-tight">{item.title}</p>
                              <p className={cn("text-[0.6rem] font-semibold uppercase tracking-[0.18em]", isMobileNavActive(pathname, item.href) ? "text-white/70" : "text-muted-foreground")}>
                                {item.shortLabel}
                              </p>
                            </div>
                          </Link>
                        ))}
                      </div>

                      <div className="mt-5 space-y-2">
                        <p className="px-2 text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                          Tools and account
                        </p>
                        {MOBILE_SECONDARY_NAV_ITEMS.map((item) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={handleNavigate}
                            className={cn(
                              "flex items-center gap-3 rounded-[1.2rem] px-3.5 py-3 transition-all",
                              isMobileNavActive(pathname, item.href)
                                ? "bg-primary text-white shadow-lg shadow-primary/15"
                                : "bg-white/80 text-primary shadow-sm hover:bg-white"
                            )}
                          >
                            <item.icon className="h-5 w-5 shrink-0" />
                            <span className="truncate text-[0.86rem] font-black tracking-tight">{item.title}</span>
                          </Link>
                        ))}
                      </div>

                      {isAdmin ? (
                        <div className="mt-5 space-y-2">
                          <p className="px-2 text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                            Governance
                          </p>
                          {MOBILE_ADMIN_NAV_ITEMS.map((item) => (
                            <Link
                              key={item.href}
                              href={item.href}
                              onClick={handleNavigate}
                              className={cn(
                                "flex items-center gap-3 rounded-[1.2rem] px-3.5 py-3 transition-all",
                                isMobileNavActive(pathname, item.href)
                                  ? "bg-primary text-white shadow-lg shadow-primary/15"
                                  : "bg-white/80 text-primary shadow-sm hover:bg-white"
                              )}
                            >
                              <item.icon className="h-5 w-5 shrink-0" />
                              <div className="min-w-0">
                                <p className="truncate text-[0.86rem] font-black tracking-tight">{item.title}</p>
                                <p className={cn("text-[0.6rem] font-semibold uppercase tracking-[0.18em]", isMobileNavActive(pathname, item.href) ? "text-white/70" : "text-muted-foreground")}>
                                  {item.shortLabel}
                                </p>
                              </div>
                            </Link>
                          ))}
                        </div>
                      ) : null}

                      {!["pro", "master"].includes((profile?.plan || "").toLowerCase()) ? (
                        <Link
                          href="/settings"
                          onClick={handleNavigate}
                          className="mt-5 flex items-center gap-3 rounded-[1.35rem] bg-[linear-gradient(135deg,rgba(101,88,245,1),rgba(249,115,22,0.95))] px-4 py-3.5 text-white shadow-xl shadow-primary/20"
                        >
                          <Zap className="h-5 w-5 shrink-0" />
                          <div>
                            <p className="text-[0.86rem] font-black tracking-tight">Unlock Pro tools</p>
                            <p className="text-[0.6rem] font-semibold uppercase tracking-[0.18em] text-white/70">
                              More scans, premium templates, richer workflows
                            </p>
                          </div>
                        </Link>
                      ) : null}

                      <div className="h-6" />
                    </div>

                    <div className="shrink-0 border-t border-border/70 bg-white/88 px-3 pb-[calc(env(safe-area-inset-bottom)+0.9rem)] pt-3.5 backdrop-blur">
                      <div className="space-y-3">
                        <Link
                          href="/support"
                          onClick={handleNavigate}
                          className="flex items-center gap-3 rounded-[1.1rem] border border-border/70 bg-white/80 px-4 py-3 text-[0.86rem] font-bold text-primary shadow-sm"
                        >
                          <ShieldCheck className="h-4 w-4 shrink-0 text-secondary" />
                          Support and account help
                        </Link>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => {
                            setMenuOpen(false)
                            if (auth) {
                              initiateSignOut(auth)
                            }
                          }}
                          className="h-11 w-full justify-start rounded-[1.1rem] px-4 text-left font-bold text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                          disabled={!auth}
                        >
                          <LogOut className="mr-3 h-4 w-4" />
                          Log out
                        </Button>
                      </div>
                    </div>
                  </div>
                </SheetContent>


              <div className="min-w-0 flex-1">
                <div className="inline-flex items-center gap-2 rounded-full bg-primary/5 px-3 py-1 text-[0.58rem] font-semibold uppercase tracking-[0.22em] text-primary">
                  <Sparkles className="h-3.5 w-3.5" />
                  AI Career Guide
                </div>
                <p className="mt-1.5 truncate text-[1rem] font-black tracking-tight text-primary">{sectionLabel}</p>
              </div>

              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 shrink-0 rounded-full border border-white/80 bg-white shadow-sm transition-transform active:scale-95 overflow-hidden p-0"
                >
                  <Avatar className="h-full w-full">
                    <AvatarImage src={avatarSrc} />
                    <AvatarFallback className="bg-primary text-white font-bold">
                      {(profileName[0] || "U").toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </SheetTrigger>
            </div>
          </div>
        </header>
      )}
    </Sheet>

      <main className={cn(
        "mobile-app-page print:max-w-none print:px-0 print:pb-0 print:pt-0",
        isEditor && "pt-0"
      )}>
        {children}
      </main>

      {!isEditor && (
        <nav className="no-print fixed inset-x-0 bottom-0 z-[95] border-t border-white/70 bg-white/94 px-3 pb-[max(0.65rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-18px_40px_-28px_rgba(15,23,42,0.28)] backdrop-blur-xl">
          <div
            className="mx-auto grid max-w-[42rem] gap-2"
            style={{ gridTemplateColumns: `repeat(${MOBILE_PRIMARY_NAV_ITEMS.length}, minmax(0, 1fr))` }}
          >
            {MOBILE_PRIMARY_NAV_ITEMS.map((item) => {
              const active = isMobileNavActive(pathname, item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex min-h-[3.55rem] flex-col items-center justify-center gap-1 rounded-[1rem] px-1 text-center transition-all",
                    active ? "bg-primary text-white shadow-lg shadow-primary/15" : "text-muted-foreground hover:bg-muted/60 hover:text-primary"
                  )}
                >
                  <item.icon className="h-4.5 w-4.5" />
                  <span className="text-[0.54rem] font-bold uppercase tracking-[0.12em]">
                    {item.shortLabel}
                  </span>
                </Link>
              )
            })}
          </div>
        </nav>
      )}

      <Toaster />
    </div>
  )
}
