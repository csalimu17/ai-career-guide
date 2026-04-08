"use client"

import type { LucideIcon } from "lucide-react"
import {
  ClipboardList,
  ClipboardType,
  FileText,
  LayoutDashboard,
  MessageSquare,
  Search,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Target,
  Zap,
} from "lucide-react"

export type MobileNavItem = {
  title: string
  href: string
  icon: LucideIcon
  shortLabel: string
}

export const MOBILE_PRIMARY_NAV_ITEMS: MobileNavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    shortLabel: "Home",
  },
  {
    title: "CV Editor",
    href: "/editor",
    icon: FileText,
    shortLabel: "Editor",
  },
  {
    title: "Jobs",
    href: "/jobs",
    icon: Search,
    shortLabel: "Jobs",
  },
  {
    title: "Job Tracker",
    href: "/tracker",
    icon: ClipboardList,
    shortLabel: "Tracker",
  },
  {
    title: "ATS Optimizer",
    href: "/ats",
    icon: Target,
    shortLabel: "ATS",
  },
]

export const MOBILE_SECONDARY_NAV_ITEMS: MobileNavItem[] = [
  {
    title: "My CVs",
    href: "/resumes",
    icon: ClipboardList,
    shortLabel: "CVs",
  },
  {
    title: "Cover Letters",
    href: "/cover-letters",
    icon: ClipboardType,
    shortLabel: "Letters",
  },
  {
    title: "AI Assistant",
    href: "/chat",
    icon: MessageSquare,
    shortLabel: "Assistant",
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
    shortLabel: "Settings",
  },
]

export const MOBILE_ADMIN_NAV_ITEMS: MobileNavItem[] = [
  {
    title: "Governance Hub",
    href: "/admin",
    icon: ShieldCheck,
    shortLabel: "Admin",
  },
  {
    title: "Ingestion Health",
    href: "/admin/ingestion",
    icon: ShieldAlert,
    shortLabel: "Health",
  },
  {
    title: "AI Diagnostics",
    href: "/admin/diagnostics",
    icon: Zap,
    shortLabel: "Diagnostics",
  },
]

export function getMobileSectionLabel(pathname: string) {
  if (pathname.startsWith("/admin/ingestion")) return "Ingestion Health"
  if (pathname.startsWith("/admin/diagnostics")) return "AI Diagnostics"
  if (pathname.startsWith("/admin")) return "Governance Hub"
  if (pathname.startsWith("/resumes")) return "My CVs"
  if (pathname.startsWith("/editor")) return "Resume Studio"
  if (pathname.startsWith("/jobs")) return "Jobs Discovery"
  if (pathname.startsWith("/tracker")) return "Job Tracker"
  if (pathname.startsWith("/ats")) return "ATS Optimizer"
  if (pathname.startsWith("/cover-letters")) return "Cover Letters"
  if (pathname.startsWith("/chat")) return "AI Assistant"
  if (pathname.startsWith("/settings")) return "Settings"
  if (pathname.startsWith("/onboarding")) return "Guided Setup"
  if (pathname.startsWith("/dashboard")) return "Dashboard"
  return "Workspace"
}

export function isMobileNavActive(pathname: string, href: string) {
  if (href === "/dashboard") {
    return pathname === "/dashboard"
  }

  return pathname === href || pathname.startsWith(`${href}/`)
}
