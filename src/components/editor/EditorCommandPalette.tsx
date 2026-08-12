"use client"

import React, { useEffect, useState } from "react"
import { Search, User, Briefcase, GraduationCap, Wrench, Globe, Target, Award, Sparkles, Heart, FileText, PanelsTopLeft, SlidersHorizontal, SpellCheck2, FileDown, Command } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

interface EditorCommandPaletteProps {
  isOpen: boolean
  onClose: () => void
  onSelectSection: (sectionId: string) => void
  onSelectStudioTab: (tab: "preview" | "templates" | "theme" | "proofreader") => void
  onExportPdf: () => void
}

export function EditorCommandPalette({
  isOpen,
  onClose,
  onSelectSection,
  onSelectStudioTab,
  onExportPdf,
}: EditorCommandPaletteProps) {
  const [query, setQuery] = useState("")

  useEffect(() => {
    if (!isOpen) setQuery("")
  }, [isOpen])

  const sectionItems = [
    { id: "personal", label: "Personal Details", icon: User, type: "section" },
    { id: "summary", label: "Professional Summary", icon: Sparkles, type: "section" },
    { id: "experience", label: "Work Experience", icon: Briefcase, type: "section" },
    { id: "volunteer", label: "Volunteer Work", icon: Heart, type: "section" },
    { id: "education", label: "Education & Degrees", icon: GraduationCap, type: "section" },
    { id: "skills", label: "Skills & Expertise", icon: Wrench, type: "section" },
    { id: "projects", label: "Projects & Portfolio", icon: Target, type: "section" },
    { id: "certifications", label: "Certifications", icon: Award, type: "section" },
    { id: "languages", label: "Languages", icon: Globe, type: "section" },
    { id: "interests", label: "Hobbies & Interests", icon: Heart, type: "section" },
  ]

  const studioItems = [
    { id: "preview", label: "Resume Builder Preview", icon: FileText, type: "tab" },
    { id: "templates", label: "Browse Templates", icon: PanelsTopLeft, type: "tab" },
    { id: "theme", label: "Theme & Style Studio", icon: SlidersHorizontal, type: "tab" },
    { id: "proofreader", label: "Proofread & Grammar Check", icon: SpellCheck2, type: "tab" },
  ]

  const actionItems = [
    { id: "export_pdf", label: "Export PDF Document", icon: FileDown, type: "action" },
  ]

  const allItems = [...sectionItems, ...studioItems, ...actionItems]

  const filteredItems = allItems.filter(item => 
    item.label.toLowerCase().includes(query.toLowerCase())
  )

  const handleSelect = (item: typeof allItems[0]) => {
    onClose()
    if (item.type === "section") {
      onSelectStudioTab("preview")
      onSelectSection(item.id)
    } else if (item.type === "tab") {
      onSelectStudioTab(item.id as any)
    } else if (item.id === "export_pdf") {
      onExportPdf()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl p-0 overflow-hidden rounded-3xl border-slate-200 shadow-2xl bg-white">
        <DialogHeader className="p-4 pb-2 border-b border-slate-100 flex flex-row items-center gap-3">
          <Search className="h-5 w-5 text-slate-400 shrink-0 ml-2" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or search section..."
            className="border-none shadow-none focus-visible:ring-0 text-base font-medium h-10 px-0"
            autoFocus
          />
          <Badge className="bg-slate-100 text-slate-500 hover:bg-slate-100 border-none rounded-lg px-2 py-1 text-[10px] font-black uppercase">
            ESC to exit
          </Badge>
        </DialogHeader>

        <div className="max-h-80 overflow-y-auto p-3 space-y-1">
          {filteredItems.length === 0 ? (
            <div className="py-8 text-center text-sm font-medium text-slate-400">
              No matching commands or sections found.
            </div>
          ) : (
            filteredItems.map((item) => {
              const Icon = item.icon
              return (
                <button
                  key={`${item.type}-${item.id}`}
                  onClick={() => handleSelect(item)}
                  className="w-full flex items-center justify-between p-3 rounded-2xl text-left hover:bg-slate-50 transition-colors group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                      <Icon className="h-4.5 w-4.5" />
                    </div>
                    <span className="text-sm font-bold text-slate-800 group-hover:text-slate-900">
                      {item.label}
                    </span>
                  </div>
                  <Badge className="bg-slate-100/80 text-slate-400 group-hover:bg-slate-200 group-hover:text-slate-600 border-none rounded-md text-[9px] font-bold uppercase">
                    {item.type}
                  </Badge>
                </button>
              )
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
