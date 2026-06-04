"use client"

import * as React from "react"
import {
  ShieldAlert,
  Users,
  CreditCard,
  FileCode,
  Layers,
  BarChart3,
  History,
  Settings,
  ArrowLeft,
  ChevronRight,
  Home,
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
} from "@/components/ui/sidebar"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { BrandWordmark } from "@/components/brand/brand-wordmark"

const adminItems = [
  { title: "Command Center", url: "/admin", icon: Home },
  { title: "User Management", url: "/admin/users", icon: Users },
  { title: "Subscriptions", url: "/admin/subscriptions", icon: CreditCard },
  { title: "Pricing & Plans", url: "/admin/pricing", icon: BarChart3 },
  { title: "Content CMS", url: "/admin/content", icon: FileCode },
  { title: "Ingestion Health", url: "/admin/ingestion", icon: ShieldAlert },
  { title: "Templates", url: "/admin/templates", icon: Layers },
  { title: "Audit Logs", url: "/admin/audit-logs", icon: History },
  { title: "System Settings", url: "/admin/settings", icon: Settings },
]

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <Sidebar collapsible="icon" className="border-r-0 bg-slate-950 text-slate-100 shadow-[0_24px_60px_-36px_rgba(15,23,42,0.65)] max-md:[--sidebar-width:18.5rem]">
      <SidebarHeader className="flex h-20 flex-row items-center justify-start gap-3 border-b border-white/10 bg-slate-950 px-4 sm:h-24 sm:px-6">
        <div className="flex flex-col min-w-0">
          <Link href="/" className="group/logo flex items-center gap-2">
            <BrandWordmark className="text-[1rem] sm:text-xl" />
          </Link>
          <div className="flex items-center gap-2 mt-1">
             <div className="h-1.5 w-1.5 rounded-full bg-secondary animate-pulse" />
             <span className="text-[0.6rem] text-slate-400 font-semibold uppercase tracking-[0.18em] sm:text-[0.68rem] sm:tracking-[0.22em]">Governance console</span>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent className="bg-slate-950 px-2 py-4 sm:px-3 sm:py-6">
        <SidebarGroup>
          <SidebarGroupLabel className="mb-3 px-3 text-[0.6rem] font-semibold uppercase tracking-[0.18em] text-slate-500 sm:mb-4 sm:text-[0.68rem] sm:tracking-[0.22em]">Internal operations</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={pathname === item.url} 
                    tooltip={item.title}
                    className={`mb-1 h-10 rounded-xl px-2.5 transition-all duration-200 sm:h-11 sm:px-3 ${
                      pathname === item.url 
                      ? "bg-white/10 text-white shadow-md active:scale-95" 
                      : "text-slate-400 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <Link href={item.url}>
                      <item.icon className={pathname === item.url ? "text-white" : "text-slate-500"} />
                      <span className="font-semibold text-[10px] uppercase tracking-[0.14em] sm:text-xs sm:tracking-[0.18em]">{item.title}</span>
                      {pathname === item.url && <ChevronRight className="ml-auto h-3 w-3 opacity-50" />}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-white/10 bg-slate-950 p-3 sm:p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="h-10 rounded-xl text-slate-300 hover:bg-white/5 hover:text-white sm:h-11">
              <Link href="/dashboard">
                <ArrowLeft className="h-4 w-4" />
                <span className="font-semibold text-[10px] uppercase tracking-[0.14em] sm:text-xs sm:tracking-[0.18em]">Exit to app</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
