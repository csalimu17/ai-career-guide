
"use client"

import * as React from "react"
import Image from "next/image"
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
  ShieldX,
  CreditCard,
  LifeBuoy
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

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
import { useIsMobile } from "@/hooks/use-mobile"

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
    url: "/cv-editor",
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

const secondaryItems = [
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
  },
  {
    title: "Technical Support",
    url: "/support",
    icon: LifeBuoy,
  },
]

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  profile?: any
  impersonatedUid?: string | null
}

const PremiumIcons = {
  Sparkle: () => (
    <div className="relative flex h-full w-full items-center justify-center">
      <motion.svg
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-full w-full"
        animate={{ 
          rotate: [0, 10, -10, 0],
        }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      >
        <defs>
          <linearGradient id="sparkle-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fff" stopOpacity="1" />
            <stop offset="100%" stopColor="#818cf8" stopOpacity="0.8" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <motion.path
          d="M12 2L14.5 9.5H22L16 14L18.5 21.5L12 17L5.5 21.5L8 14L2 9.5H9.5L12 2Z"
          fill="url(#sparkle-grad)"
          filter="url(#glow)"
          animate={{ scale: [1, 1.1, 1], opacity: [0.8, 1, 0.8] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.circle
          cx="12"
          cy="12"
          r="1"
          fill="white"
          animate={{ opacity: [0, 1, 0], scale: [0.5, 2, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.svg>
      <motion.div 
        animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 3, repeat: Infinity }}
        className="absolute h-full w-full rounded-full bg-white/20 blur-md" 
      />
    </div>
  ),
  Zap: () => (
    <motion.svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="h-full w-full"
    >
      <defs>
        <linearGradient id="zap-grad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#f59e0b" />
        </linearGradient>
      </defs>
      <motion.path
        d="M13 2L3 14H12L11 22L21 10H12L13 2Z"
        fill="url(#zap-grad)"
        animate={{ 
          filter: ["brightness(1) contrast(1)", "brightness(1.5) contrast(1.2)", "brightness(1) contrast(1)"],
        }}
        transition={{ duration: 0.2, repeat: Infinity, repeatType: "reverse", repeatDelay: 2 }}
      />
      <motion.path
        d="M13 2L3 14H12L11 22L21 10H12L13 2Z"
        stroke="#fff"
        strokeWidth="0.5"
        strokeOpacity="0.5"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
      />
    </motion.svg>
  )
}

export function AppSidebar({ profile, impersonatedUid, ...props }: AppSidebarProps) {
  const pathname = usePathname()
  const auth = useAuth()
  const { user } = useUser()
  const { isAdmin } = useIsAdmin()
  const { setOpenMobile } = useSidebar()
  const isMobile = useIsMobile()

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

  const [mousePos, setMousePos] = React.useState({ x: 0, y: 0 })
  const cardRef = React.useRef<HTMLDivElement>(null)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    })
  }

  return (
    <Sidebar collapsible="icon" className="border-r-0 shadow-[0_24px_60px_-36px_rgba(15,23,42,0.55)]">
      <SidebarHeader className="flex h-20 items-center justify-start border-b border-white/10 px-2">
        <Link 
          href="/dashboard" 
          className="flex items-center gap-2 transition-all hover:opacity-80 active:scale-95 overflow-hidden"
        >
          <BrandWordmark className="text-base" />
        </Link>
      </SidebarHeader>
      <SidebarContent className="px-3 py-4">
        <SidebarGroup className="px-3 pt-6">
          <SidebarGroupLabel className="px-4 pb-4 text-[0.72rem] font-black uppercase tracking-[0.3em] text-[#0F172A]/40 group-data-[collapsible=icon]:hidden">
            Main Pipeline
          </SidebarGroupLabel>
          <SidebarMenu className="gap-1.5">
            {navigationItems.map((item) => {
              const isActive = pathname === item.url || (item.url !== "/dashboard" && pathname.startsWith(item.url + "/"))
              
              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={isActive}
                    tooltip={item.title}
                    className={cn(
                      "relative h-12 rounded-[1.25rem] px-4 font-bold transition-all hover:bg-transparent",
                      isActive 
                        ? "bg-indigo-600/5 text-indigo-600 shadow-[inset_0_0_0_1px_rgba(79,70,229,0.15)]" 
                        : "text-[#0F172A]/85 hover:text-indigo-600"
                    )}
                    onClick={() => {
                      if (isMobile) {
                        setOpenMobile(false);
                      }
                    }}
                  >
                    <Link href={item.url} className="flex h-full w-full items-center gap-3.5">
                      <div className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-xl transition-all",
                        isActive 
                          ? "bg-white shadow-md ring-1 ring-indigo-600/10" 
                          : "bg-transparent group-hover/menu-item:bg-indigo-600/5"
                      )}>
                        <item.icon className={cn(
                          "h-4 w-4 shrink-0 transition-transform duration-300",
                          isActive ? "scale-110 text-indigo-600 stroke-[2.5]" : "text-[#1E293B]/60 group-hover/menu-item:scale-110 group-hover/menu-item:text-indigo-600"
                        )} />
                      </div>
                      <span className="text-[0.92rem] tracking-tight group-data-[collapsible=icon]:hidden" style={{ fontFamily: 'var(--font-plus-jakarta-sans)' }}>
                        {item.title}
                      </span>
                      
                      {isActive && (
                        <motion.div 
                          layoutId="active-indicator"
                          className="absolute left-0 h-6 w-1 rounded-r-full bg-indigo-600"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                        />
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            })}
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup className="px-3 pt-6">
          <SidebarGroupLabel className="px-4 pb-4 text-[0.72rem] font-black uppercase tracking-[0.3em] text-[#0F172A]/40 group-data-[collapsible=icon]:hidden">
            Tools & Account
          </SidebarGroupLabel>
          <SidebarMenu className="gap-1.5">
            {secondaryItems.map((item) => {
              const isActive = pathname === item.url || pathname.startsWith(item.url + "/")
              
              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={isActive}
                    tooltip={item.title}
                    className={cn(
                      "relative h-12 rounded-[1.25rem] px-4 font-bold transition-all hover:bg-transparent",
                      isActive 
                        ? "bg-indigo-600/5 text-indigo-600 shadow-[inset_0_0_0_1px_rgba(79,70,229,0.15)]" 
                        : "text-[#0F172A]/85 hover:text-indigo-600"
                    )}
                    onClick={() => {
                      if (isMobile) {
                        setOpenMobile(false);
                      }
                    }}
                  >
                    <Link href={item.url} className="flex h-full w-full items-center gap-3.5">
                      <div className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-xl transition-all",
                        isActive 
                          ? "bg-white shadow-md ring-1 ring-indigo-600/10" 
                          : "bg-transparent group-hover/menu-item:bg-indigo-600/5"
                      )}>
                        <item.icon className={cn(
                          "h-4 w-4 shrink-0 transition-transform duration-300",
                          isActive ? "scale-110 text-indigo-600 stroke-[2.5]" : "text-[#1E293B]/60 group-hover/menu-item:scale-110 group-hover/menu-item:text-indigo-600"
                        )} />
                      </div>
                      <span className="text-[0.92rem] tracking-tight group-data-[collapsible=icon]:hidden" style={{ fontFamily: 'var(--font-plus-jakarta-sans)' }}>
                        {item.title}
                      </span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            })}
            
            <SidebarMenuItem>
              <SidebarMenuButton 
                className="h-12 rounded-[1.25rem] px-4 font-bold text-rose-600 transition-all hover:bg-rose-50 hover:text-rose-700"
                onClick={() => {
                  if (auth) {
                    initiateSignOut(auth);
                  }
                }}
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-transparent group-hover/menu-item:bg-rose-100/50">
                  <LogOut className="h-4 w-4 shrink-0" />
                </div>
                <span className="text-[0.92rem] tracking-tight group-data-[collapsible=icon]:hidden">
                  Log out
                </span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
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
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="group-data-[collapsible=icon]:hidden mb-6 px-2"
            >
              <div 
                ref={cardRef}
                onMouseMove={handleMouseMove}
                className="group/premium relative overflow-hidden rounded-[1.8rem] bg-[#1E1B4B] p-px shadow-xl shadow-indigo-950/50 transition-all hover:shadow-indigo-950/70"
              >
                {/* Animated Liquid Border */}
                <div className="absolute inset-[-100%] z-0 animate-[spin_5s_linear_infinite] bg-[conic-gradient(from_0deg,transparent_0deg,transparent_150deg,#4f46e5_180deg,transparent_210deg,transparent_360deg)] opacity-40 group-hover/premium:opacity-100 transition-opacity duration-500" />
                
                <div className="relative z-30 flex flex-col gap-3 rounded-[1.75rem] bg-[#1E1B4B]/90 p-4 backdrop-blur-3xl">
                  {/* Noise Texture Overlay */}
                  <div className="absolute inset-0 z-20 pointer-events-none opacity-[0.08] mix-blend-overlay bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.7)_1px,transparent_0)] bg-[length:12px_12px]" />

                  {/* Mesh Gradient Background */}
                  <div className="absolute inset-0 bg-gradient-to-br from-[#4F46E5]/40 via-[#A855F7]/30 to-[#0EA5E9]/30 opacity-50" />
                  
                  {/* Interactive Radial Glow */}
                  <motion.div 
                    className="absolute inset-0 z-10 pointer-events-none"
                    style={{
                      background: `radial-gradient(400px circle at ${mousePos.x}px ${mousePos.y}px, rgba(255,255,255,0.06), transparent 40%)`,
                    }}
                  />

                  <div className="relative z-30 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="relative flex h-8 w-8 items-center justify-center rounded-2xl bg-white/10 shadow-lg ring-1 ring-white/20">
                        <PremiumIcons.Sparkle />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[0.68rem] font-black uppercase tracking-[0.25em] text-white/30">Member</span>
                        <span className="text-[0.68rem] font-black text-white tracking-widest" style={{ fontFamily: 'var(--font-plus-jakarta-sans)' }}>PREMIUM</span>
                      </div>
                    </div>
                    <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-white/10 shadow-inner ring-1 ring-white/10">
                      <PremiumIcons.Zap />
                    </div>
                  </div>

                  <p className="relative z-30 text-[0.82rem] font-bold leading-tight tracking-tight text-white/85" style={{ fontFamily: 'var(--font-plus-jakarta-sans)' }}>
                    Unlock AI-tailored CVs & unlimited job tracking.
                  </p>

                  <Button
                    asChild
                    variant="secondary"
                    size="sm"
                    className="group/btn relative z-30 mt-0.5 h-9 w-full overflow-hidden rounded-xl border-0 bg-white px-4 font-black text-[0.68rem] uppercase tracking-widest text-[#4F46E5] transition-all hover:bg-white hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] active:scale-[0.97]"
                  >
                    <Link href="/settings">
                      <span className="relative z-10 flex items-center justify-center gap-2">
                        Get Pro
                        <PremiumIcons.Zap />
                      </span>
                      {/* Button Shimmer */}
                      <motion.div 
                        initial={{ x: "-100%" }}
                        animate={{ x: "100%" }}
                        transition={{ repeat: Infinity, duration: 3, ease: "linear", repeatDelay: 2 }}
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-[#4F46E5]/10 to-transparent"
                      />
                    </Link>
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
