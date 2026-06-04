"use client"

import Link from "next/link"
import { collection, orderBy, query } from "firebase/firestore"
import { Edit3, Eye, FileText, Globe, HelpCircle, Layout, Loader2, MessageSquare, type LucideIcon } from "lucide-react"

import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

type ContentRegistryItem = {
  id: string
  name: string
  description: string
  icon: LucideIcon
  previewHref: string | null
}

const CONTENT_PAGE_REGISTRY: ContentRegistryItem[] = [
  {
    id: "landing",
    name: "Main Landing Page",
    description: "Hero messaging, primary calls to action, and homepage positioning.",
    icon: Layout,
    previewHref: "/",
  },
  {
    id: "pricing",
    name: "Pricing Page",
    description: "Plan positioning, upgrade messaging, and commercial copy.",
    icon: MessageSquare,
    previewHref: "/pricing",
  },
  {
    id: "support",
    name: "Support Page",
    description: "Help entry points, contact copy, and operational support guidance.",
    icon: HelpCircle,
    previewHref: "/support",
  },
  {
    id: "privacy",
    name: "Privacy Policy",
    description: "Privacy disclosures and trust messaging presented to end users.",
    icon: FileText,
    previewHref: "/privacy",
  },
  {
    id: "terms",
    name: "Terms of Service",
    description: "Public legal terms and usage conditions.",
    icon: FileText,
    previewHref: "/terms",
  },
]

const registryById = new Map(CONTENT_PAGE_REGISTRY.map((item) => [item.id, item]))

function formatStatus(status?: string) {
  if (status === "published") {
    return {
      label: "published",
      className: "bg-green-50 text-green-600",
    }
  }

  if (status === "draft") {
    return {
      label: "draft",
      className: "bg-orange-50 text-orange-600",
    }
  }

  return {
    label: "unconfigured",
    className: "bg-slate-100 text-slate-500",
  }
}

function formatLabelFromId(id: string) {
  return id
    .split(/[-_]/g)
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1))
    .join(" ")
}

export default function ContentCMSPage() {
  const db = useFirestore()
  const contentQuery = useMemoFirebase(() => query(collection(db, "contentPages"), orderBy("updatedAt", "desc")), [db])
  const { data: pages, isLoading } = useCollection(contentQuery)

  const livePages = pages || []
  const livePageMap = new Map(livePages.map((page) => [page.id, page]))

  const registeredItems = CONTENT_PAGE_REGISTRY.map((item) => {
    const page = livePageMap.get(item.id)
    return {
      ...item,
      status: page?.status,
      lastUpdate: page?.updatedAt?.toDate ? page.updatedAt.toDate().toLocaleString() : null,
    }
  })

  const customItems = livePages
    .filter((page) => !registryById.has(page.id))
    .map((page) => ({
      id: page.id,
      name: page.name || formatLabelFromId(page.id),
      description: "Custom Firestore-backed content document.",
      icon: FileText,
      previewHref: null,
      status: page.status,
      lastUpdate: page.updatedAt?.toDate ? page.updatedAt.toDate().toLocaleString() : null,
    }))

  const items = [...registeredItems, ...customItems]

  return (
    <div className="space-y-5 md:space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight text-slate-900 sm:text-3xl">Content CMS</h1>
          <p className="mt-1 text-sm font-medium text-slate-500">Manage public-facing marketing and documentation.</p>
        </div>
        <Button asChild className="h-11 w-full rounded-xl px-6 font-bold shadow-lg shadow-primary/20 sm:w-auto">
          <Link href="/">
            <Globe className="mr-2 h-4 w-4" /> View Live Site
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {isLoading ? (
          <div className="flex h-32 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : items.map((section) => {
          const Icon = section.icon
          const statusMeta = formatStatus(section.status)
          return (
            <Card key={section.id} className="group overflow-hidden rounded-[1.4rem] border-none shadow-sm transition-shadow hover:shadow-md sm:rounded-3xl">
              <CardContent className="p-0">
                <div className="flex flex-col md:flex-row md:items-center">
                  <div className="flex flex-1 items-center gap-3 p-4 sm:gap-4 sm:p-6">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-50 text-slate-400 shadow-inner transition-colors group-hover:bg-primary group-hover:text-white sm:h-12 sm:w-12">
                      <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-black uppercase tracking-tight text-slate-900 sm:text-lg">{section.name}</h3>
                        <Badge variant="outline" className={`rounded-md border-none px-2 py-0.5 text-[9px] font-black uppercase tracking-widest ${statusMeta.className}`}>
                          {statusMeta.label}
                        </Badge>
                      </div>
                      <p className="mt-0.5 text-[13px] font-medium text-slate-500 sm:text-sm">{section.description}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 border-t border-slate-50 p-4 sm:p-6 md:border-l md:border-t-0">
                    <div className="mr-2 hidden text-right lg:block sm:mr-4">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Last Modified</p>
                      <p className="text-xs font-bold text-slate-600">{section.lastUpdate || "Not published yet"}</p>
                    </div>
                    <Button variant="ghost" size="icon" asChild className="h-11 w-11 rounded-xl hover:bg-slate-100">
                      <Link href={section.previewHref || `/admin/content/${section.id}`}>
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button asChild className="h-11 flex-1 gap-2 rounded-xl px-4 text-[10px] font-bold uppercase tracking-[0.16em] sm:flex-none sm:px-6 sm:text-xs sm:tracking-wider">
                      <Link href={`/admin/content/${section.id}`}>
                        <Edit3 className="h-4 w-4" />
                        {section.status ? "Edit Content" : "Configure Content"}
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
