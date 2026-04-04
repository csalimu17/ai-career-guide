
"use client"

import * as React from "react"
import {
  LayoutDashboard,
  FileText,
  Search,
  Target,
  ClipboardList,
  MessageSquare,
  Settings,
  Sparkles,
  Zap,
  ClipboardType,
  LogOut,
  User,
  ShieldAlert,
  ShieldX
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth, useUser } from "@/firebase"
import { useIsAdmin } from "@/hooks/use-is-admin"
import { initiateSignOut } from "@/firebase/non-blocking-login"
import { BrandWordmark } from "@/components/brand/brand-wordmark"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const items = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "My CVs",
    url: "/resumes",
    icon: ClipboardList,
  },
  {
    title: "CV Editor",
    url: "/editor",
    icon: FileText,
  },
  {
    title: "Jobs",
    url: "/jobs",
    icon: Search,
  },
  {
    title: "ATS Optimizer",
    url: "/ats",
    icon: Target,
  },
  {
    title: "Cover Letters",
    url: "/cover-letters",
    icon: ClipboardType,
  },
  {
    title: "Job Tracker",
    url: "/tracker",
    icon: ClipboardList,
  },
  {
    title: "AI Assistant",
    url: "/chat",
    icon: MessageSquare,
  },
]

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  profile?: any
  impersonatedUid?: string | null
}

export function AppSidebar({ profile, impersonatedUid, ...props }: AppSidebarProps) {
  const pathname = usePathname()
  const auth = useAuth()
  const { isAdmin } = useIsAdmin()
  const { setOpenMobile } = useSidebar()

  const navigationItems = [...items];
  if (isAdmin) {
    navigationItems.push({
      title: "Governance Hub",
      url: "/admin",
      icon: Settings,
    });
    navigationItems.push({
      title: "Ingestion Health",
      url: "/admin/ingestion",
      icon: ShieldAlert,
    });
    navigationItems.push({
      title: "AI Diagnostics",
      url: "/admin/diagnostics",
      icon: Zap,
    });
  }

  const { clearImpersonation } = useUser()
  const isPro = profile?.plan === 'pro' || profile?.plan === 'master'
  const stopImpersonation = () => {
    const origin = sessionStorage.getItem("admin_impersonation_origin") || "/admin"
    clearImpersonation()
    sessionStorage.removeItem("admin_impersonation_origin")
    window.location.assign(origin)
  }

  return (
    <Sidebar collapsible="icon" className="border-r-0 shadow-[0_24px_60px_-36px_rgba(15,23,42,0.55)]">
      <SidebarHeader className="flex h-20 flex-row items-center justify-start border-b border-white/10 px-5 md:px-6">
        <div className="flex flex-col min-w-0 group-data-[collapsible=icon]:hidden overflow-hidden">
          <BrandWordmark className="text-xl md:text-2xl" />
        </div>
      </SidebarHeader>
      <SidebarContent className="px-3 py-4">
        <SidebarGroup>
          <SidebarGroupLabel className="mb-2 px-3 text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-sidebar-foreground/50">Main pipeline</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={pathname === item.url} 
                    tooltip={item.title}
                    onClick={() => setOpenMobile(false)}
                    className={`h-12 rounded-2xl px-3 transition-all duration-200 md:h-11 md:rounded-xl \${
                      pathname === item.url 
                      ? "bg-white/10 text-white shadow-sm ring-1 ring-white/10" 
                      : "hover:bg-white/5"
                    }`}
                  >
                    <Link href={item.url} className="flex items-center gap-3">
                      <div className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-xl transition-all duration-300",
                        pathname === item.url ? "bg-white text-primary shadow-sm" : "bg-white/5 text-white/40 group-hover:bg-white/10 group-hover:text-white/70"
                      )}>
                        <item.icon className="h-4 w-4" />
                      </div>
                      <span className={cn(
                        "font-bold text-sm tracking-tight transition-colors duration-200",
                        pathname === item.url ? "text-white" : "text-sidebar-foreground/60 group-hover:text-sidebar-foreground"
                      )}>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="space-y-2 border-t border-white/10 p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
        <SidebarMenu>
          {impersonatedUid && (
            <div className="group-data-[collapsible=icon]:hidden mb-4 rounded-[1.35rem] border border-amber-300/20 bg-amber-500/10 p-4 text-white/90">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-amber-200" />
                <span className="text-[0.68rem] font-black uppercase tracking-[0.2em] text-amber-100">Shadowing active</span>
              </div>
              <p className="mt-3 text-[0.8rem] font-medium leading-relaxed text-white/75">
                You are viewing a user workspace with admin shadowing enabled.
              </p>
              <Button
                type="button"
                variant="secondary"
                className="mt-4 h-9 w-full rounded-xl border-0 bg-white text-[0.7rem] font-black uppercase tracking-widest text-primary hover:bg-white/90"
                onClick={stopImpersonation}
              >
                <ShieldX className="mr-2 h-4 w-4" />
                Return to Governance
              </Button>
            </div>
          )}
          {!isPro && (
            <div className="group-data-[collapsible=icon]:hidden mb-6 px-2">
              <div className="relative overflow-hidden rounded-[1.6rem] bg-gradient-to-br from-indigo-600 via-violet-600 to-indigo-700 p-5 text-white shadow-2xl shadow-indigo-500/30 ring-1 ring-white/10 transition-transform active:scale-[0.98]">
                <div className="relative z-10">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm shadow-inner ring-1 ring-white/20">
                      <Sparkles className="h-4 w-4 fill-white" />
                    </div>
                    <span className="text-[0.65rem] font-black uppercase tracking-[0.2em] text-white/80">Premium</span>
                  </div>
                  <p className="mt-4 text-[0.85rem] font-bold leading-tight tracking-tight">Unlock AI-tailored CVs & unlimited job tracking.</p>
                  <Button
                    asChild
                    variant="secondary"
                    size="sm"
                    className="mt-4 h-9 w-full rounded-xl border-0 bg-gradient-to-r from-orange-500 via-orange-400 to-amber-300 font-black text-[0.7rem] uppercase tracking-widest text-white shadow-[0_16px_32px_-18px_rgba(251,146,60,0.9)] hover:from-orange-400 hover:via-orange-300 hover:to-amber-200 hover:text-white active:scale-[0.98]"
                  >
                    <Link href="/settings">Upgrade Now</Link>
                  </Button>
                </div>
                <div className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-white/10 blur-2xl" />
                <div className="absolute -bottom-8 -left-8 h-20 w-20 rounded-full bg-indigo-400/20 blur-xl" />
              </div>
            </div>
          )}
          <SidebarMenuItem>
              <SidebarMenuButton 
                asChild 
                isActive={pathname === "/settings"}
                className={`h-12 rounded-2xl px-3 md:h-11 md:rounded-xl \${pathname === "/settings" ? "bg-white/10 font-bold text-white" : "text-sidebar-foreground/80 hover:bg-white/5"}`}
                onClick={() => setOpenMobile(false)}
              >
                <Link href="/settings">
                  <Settings className={pathname === "/settings" ? "text-white" : ""} />
                <span>Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <div className="flex flex-wrap gap-x-4 gap-y-1 px-3 py-2 opacity-60 transition-opacity hover:opacity-100">
              <Link href="/support" className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-sidebar-foreground/70 transition-colors hover:text-white">Support</Link>
              <Link href="/terms" className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-sidebar-foreground/70 transition-colors hover:text-white">Terms</Link>
              <Link href="/privacy" className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-sidebar-foreground/70 transition-colors hover:text-white">Privacy</Link>
            </div>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton 
              onClick={() => auth && initiateSignOut(auth)}
              className="h-12 rounded-2xl px-3 text-rose-200 hover:bg-rose-500/12 hover:text-white md:h-11 md:rounded-xl"
              disabled={!auth}
            >
              <LogOut />
              <span>Log Out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
