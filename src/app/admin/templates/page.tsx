"use client"

import Link from "next/link"
import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { TemplateThumbnail } from "@/components/editor/template-thumbnail"
import { TEMPLATES, getTemplateTierLabel } from "@/lib/templates-config"
import { useToast } from "@/hooks/use-toast"
import { CheckCircle2, Copy, Eye, Plus, Search, Settings, Sparkles, Zap } from "lucide-react"

export default function TemplatesGovernancePage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [filter, setFilter] = useState<"all" | "free" | "pro" | "master">("all")
  const { toast } = useToast()

  const filteredTemplates = TEMPLATES.filter((template) => {
    const matchesSearch =
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.layout.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter =
      filter === "all" ||
      (filter === "free" && template.accessTier === "free") ||
      (filter === "pro" && template.accessTier === "pro") ||
      (filter === "master" && template.accessTier === "master")
    return matchesSearch && matchesFilter
  })

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tight text-slate-900">Template Registry</h1>
          <p className="mt-1 text-sm font-medium text-slate-500">Review the live template catalog, preview real covers, and jump straight into editing or pricing controls.</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1 sm:min-w-[280px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search templates..." className="h-11 w-full rounded-xl border-none pl-10 shadow-sm" />
          </div>
          <Button asChild className="h-11 rounded-xl px-6 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20">
            <Link href="/editor">
              <Plus className="mr-2 h-4 w-4" /> Open Template Studio
            </Link>
          </Button>
        </div>
      </div>

      <div className="no-scrollbar flex items-center gap-2 overflow-x-auto pb-2">
        {[
          { value: "all", label: `All Templates (${TEMPLATES.length})` },
          { value: "free", label: `Free (${TEMPLATES.filter((template) => template.accessTier === "free").length})` },
          { value: "pro", label: `Pro (${TEMPLATES.filter((template) => template.accessTier === "pro").length})` },
          { value: "master", label: `Master (${TEMPLATES.filter((template) => template.accessTier === "master").length})` },
        ].map((item) => (
          <Button
            key={item.value}
            variant={filter === item.value ? "default" : "outline"}
            onClick={() => setFilter(item.value as "all" | "free" | "pro" | "master")}
            className="h-9 rounded-full px-6 text-[10px] font-bold uppercase tracking-widest"
          >
            {item.label}
          </Button>
        ))}
      </div>

      {filteredTemplates.length === 0 ? (
        <Card className="rounded-[2rem] border border-dashed border-slate-200 bg-white/80 shadow-sm">
          <CardContent className="py-16 text-center">
            <p className="text-sm font-bold text-slate-900">No templates match this filter</p>
            <p className="mt-2 text-xs font-medium text-slate-500">Try a broader search or open the editor to review the complete live gallery.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredTemplates.map((template) => (
            <Card key={template.id} className="group flex flex-col overflow-hidden rounded-[2rem] border-none bg-white shadow-sm transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl">
              <div className="relative aspect-[3/4] overflow-hidden bg-slate-100">
                <TemplateThumbnail template={template} className="transition-transform duration-700 group-hover:scale-[1.03]" />

                <div className="absolute right-4 top-4 z-20 flex flex-col gap-2">
                  {template.accessTier !== "free" && (
                    <Badge className="border-none bg-amber-400/90 px-2 py-1 text-[8px] font-black uppercase tracking-[0.2em] text-amber-950 shadow-lg">
                      {template.accessTier === "master" ? (
                        <Sparkles className="mr-1 h-3 w-3 fill-amber-950" />
                      ) : (
                        <Zap className="mr-1 h-3 w-3 fill-amber-950" />
                      )}
                      {getTemplateTierLabel(template.accessTier)}
                    </Badge>
                  )}
                  {template.isAtsSafe && (
                    <Badge className="border-none bg-emerald-500/90 px-2 py-1 text-[8px] font-black uppercase tracking-[0.2em] text-white shadow-lg">
                      <CheckCircle2 className="mr-1 h-3 w-3" /> ATS Optimized
                    </Badge>
                  )}
                </div>
              </div>

              <CardContent className="flex flex-1 flex-col p-6">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-tight text-slate-900">{template.name}</h3>
                  <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">{template.category} / {template.layout} / {getTemplateTierLabel(template.accessTier)}</p>
                  <p className="mt-3 line-clamp-2 text-xs font-medium leading-relaxed text-slate-500">{template.description}</p>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-2">
                  <Button asChild variant="outline" className="h-10 rounded-xl border-2 text-[10px] font-black uppercase tracking-widest">
                    <Link href={`/editor?template=${template.id}`}>
                      <Eye className="mr-2 h-4 w-4" /> Preview
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="h-10 rounded-xl border-2 text-[10px] font-black uppercase tracking-widest">
                    <Link href="/admin/pricing">
                      <Settings className="mr-2 h-4 w-4" /> Access
                    </Link>
                  </Button>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2">
                  <Button
                    variant="ghost"
                    className="h-10 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-100"
                    onClick={async () => {
                      await navigator.clipboard.writeText(template.id)
                      toast({ title: "Template ID Copied", description: `${template.id} is now on your clipboard.` })
                    }}
                  >
                    <Copy className="mr-2 h-4 w-4" /> Copy ID
                  </Button>
                  <Button asChild variant="ghost" className="h-10 rounded-xl text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary/5">
                    <Link href={`/editor?template=${template.id}`}>
                      <Sparkles className="mr-2 h-4 w-4" /> Edit
                    </Link>
                  </Button>
                </div>

                <div className="mt-auto flex items-center justify-between border-t border-slate-50 pt-5">
                  <span className="inline-flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.14em] text-primary/70">
                    <Sparkles className="h-3 w-3" /> AI Enhanced
                  </span>
                  <Badge variant="outline" className="border-slate-100 text-[9px] font-bold uppercase tracking-widest text-slate-300">
                    ID: {template.id}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
