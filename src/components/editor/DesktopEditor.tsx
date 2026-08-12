"use client"

import { useState } from "react"
import Link from "next/link"
import { toast } from "@/hooks/use-toast"
import { AgentRole, CAREER_AGENTS } from "@/services/CareerAgents"
import { AnimatePresence, motion, Reorder } from "framer-motion"
import { 
  User, 
  Briefcase, 
  GraduationCap, 
  Wrench, 
  Globe, 
  Target, 
  Award,
  Sparkles,
  Undo,
  Redo,
  Eye,
  FileText,
  LayoutTemplate,
  Paintbrush2,
  FileDown,
  Loader2,
  Share2,
  Trash2,
  Plus,
  PanelsTopLeft,
  SlidersHorizontal,
  SpellCheck2,
  Cpu,
  SendHorizontal,
  LogIn,
  LogOut,
  Headset,
  ChevronUp,
  ChevronDown,
  X,
  Quote,
  Star,
  Layout,
  Heart,
  Wand2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getTemplateConfig, getTemplateTierLabel } from "@/lib/templates-config"
import { TitleInput } from "@/components/ui/title-input"
import { ResumeTemplate } from "./resume-template"
import { EditorDesignStudio } from "./editor-design-studio"
import { RichTextField } from "./rich-text-field"
import { BrandWordmark } from "@/components/brand/brand-wordmark"
import { ResumeAssistant } from "./ResumeAssistant"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { PrintPreviewContainer } from "./print-preview-container"
import { cn } from "@/lib/utils"
import { plainTextToRichTextHtml } from "@/lib/rich-text"
import { ProofreaderPanel } from "./ProofreaderPanel"
import { PhotoUpload } from "./PhotoUpload"
import { AtsScorePopover } from "./AtsScorePopover"
import { EditorCommandPalette } from "./EditorCommandPalette"
import { Command, CheckCircle2, Check } from "lucide-react"
import { useEffect } from "react"

interface DesktopEditorProps {
  editor: any 
}

export function DesktopEditor({ editor }: DesktopEditorProps) {
  const [activeSection, setActiveSection] = useState<string>("personal")
  const [activeStudioTab, setActiveStudioTab] = useState<"preview" | "templates" | "theme" | "proofreader">("preview")
  const [showAssistant, setShowAssistant] = useState(false)
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        setIsCommandPaletteOpen((prev) => !prev)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  const isSectionComplete = (sectionId: string) => {
    const c = editor?.resume?.content || {}
    switch (sectionId) {
      case "personal":
        return Boolean(c.personal?.name && (c.personal?.email || c.personal?.phone))
      case "summary":
        return Boolean(c.summary && typeof c.summary === "string" && c.summary.trim().length > 20)
      case "experience":
        return Boolean(Array.isArray(c.experience) && c.experience.length > 0)
      case "volunteer":
        return Boolean(Array.isArray(c.volunteer) && c.volunteer.length > 0)
      case "education":
        return Boolean(Array.isArray(c.education) && c.education.length > 0)
      case "skills":
        return Boolean(Array.isArray(c.skills) && c.skills.length > 0)
      case "projects":
        return Boolean(Array.isArray(c.projects) && c.projects.length > 0)
      case "certifications":
        return Boolean(Array.isArray(c.certifications) && c.certifications.length > 0)
      case "languages":
        return Boolean(Array.isArray(c.languages) && c.languages.length > 0)
      case "interests":
        return Boolean(
          (Array.isArray(c.interests) && c.interests.length > 0) ||
            (c.interestsContent && c.interestsContent.length > 10)
        )
      default:
        return false
    }
  }

  const { 
    resume, 
    handleUpdate, 
    handleUndo, 
    handleRedo, 
    historyIndex, 
    historyLength,
    isExporting,
    handleDownloadPdf,
    saveStatus,
    runEnhanceContent,
    isEnhancing,
    isGeneratingSummarySuggestions,
    summarySuggestions,
    runSummarySuggestions,
    applyTemplate,
    updateStyle,
    resetTemplateStyles,
    profile,
    routingLogs,
    chatMessages,
    sendAdvisoryMessage,

    isSuggestingRoleBullets,
    runSuggestRoleBullets,
    roleBulletSuggestions,
    applyRoleBulletSuggestions,
    dismissRoleBulletSuggestions,
    isSuggestingSkills,
    skillSuggestions,
    runSkillSuggestions,
    setSkillSuggestions,
    isSuggestingInterests,
    interestSuggestions,
    runInterestSuggestions,
    setInterestSuggestions,

    isUploading,
    isCropping,
    setIsCropping,
    cropImage,
    onCropComplete,
    processCrop,
    handlePhotoFileChange,
    handleDeletePhoto,

    isCheckingGrammarGlobal,
    globalGrammarIssues,
    hasScannedGrammar,
    runGlobalGrammarCheck,
    applyGlobalGrammarFix,
    dismissGlobalGrammarIssue,
  } = editor

  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [chatInput, setChatInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)

  const handleChatSend = async () => {
    if (!chatInput.trim() || isTyping) return
    const text = chatInput.trim()
    setChatInput("")
    setIsTyping(true)
    try {
      await sendAdvisoryMessage(text)
    } finally {
      setIsTyping(false)
    }
  }

   const moveExperience = (index: number, direction: 'up' | 'down') => {
     const newExp = [...(resume.content.experience || [])]
     const targetIndex = direction === 'up' ? index - 1 : index + 1
     if (targetIndex < 0 || targetIndex >= newExp.length) return
     
     const temp = newExp[index]
     newExp[index] = newExp[targetIndex]
     newExp[targetIndex] = temp
     handleUpdate("content.experience", newExp)
   }

   const moveVolunteer = (index: number, direction: 'up' | 'down') => {
     const newVol = [...(resume.content.volunteer || [])]
     const targetIndex = direction === 'up' ? index - 1 : index + 1
     if (targetIndex < 0 || targetIndex >= newVol.length) return
     
     const temp = newVol[index]
     newVol[index] = newVol[targetIndex]
     newVol[targetIndex] = temp
     handleUpdate("content.volunteer", newVol)
   }

  if (!resume) return null
  const activeTemplate = getTemplateConfig(resume.templateId)

   const sections = [
     { id: "personal", icon: User, label: "Personal" },
     { id: "summary", icon: Sparkles, label: "Summary" },
     { id: "experience", icon: Briefcase, label: "Experience" },
     { id: "volunteer", icon: Heart, label: "Volunteer" },
     { id: "education", icon: GraduationCap, label: "Education" },
     { id: "skills", icon: Wrench, label: "Skills" },
     { id: "projects", icon: Target, label: "Projects" },
     { id: "certifications", icon: Award, label: "Certifications" },
     { id: "languages", icon: Globe, label: "Languages" },
     { id: "interests", icon: Heart, label: "Hobbies" },
   ]

  const studioNavigation = [
    { id: "preview" as const, icon: FileText, label: "Resume Builder", hint: "Edit and preview" },
    { id: "templates" as const, icon: PanelsTopLeft, label: "Templates", hint: "Switch layouts" },
    { id: "theme" as const, icon: SlidersHorizontal, label: "Theme", hint: "Tune styles" },
    { id: "proofreader" as const, icon: SpellCheck2, label: "Proofread", hint: "Check spelling" },
  ]

  const activeStudioItem = studioNavigation.find((item) => item.id === activeStudioTab) ?? studioNavigation[0]

  return (
    <div className="relative min-h-[calc(100vh-64px)] overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(103,58,183,0.2),transparent_25%),radial-gradient(circle_at_bottom_right,rgba(33,150,243,0.15),transparent_25%),linear-gradient(180deg,#fcfdff_0%,#f8faff_100%)]">
      <div className="relative flex h-[calc(100vh-64px)] w-full flex-col overflow-hidden bg-transparent">
        <div className="flex h-16 items-center justify-between border-b border-slate-200/60 bg-white/72 px-6 backdrop-blur-xl shrink-0">
          <div className="flex items-center gap-6">
            <BrandWordmark />
            <div className="h-6 w-px bg-slate-200" />
            <div className="hidden items-center gap-3 lg:flex">
              <div className="flex items-center gap-2 rounded-full border border-slate-200/60 bg-white/50 px-3 py-1 text-[11px] font-medium text-slate-500">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Sync Active
              </div>
              <AtsScorePopover
                resume={resume}
                onNavigateToSection={(sectionId) => {
                  setActiveSection(sectionId)
                  setActiveStudioTab("preview")
                }}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
             <Button
                variant="outline"
                size="sm"
                onClick={() => setIsCommandPaletteOpen(true)}
                className="h-8 rounded-lg px-2.5 text-[11px] font-medium text-slate-700 bg-slate-50 border-slate-200 hover:bg-slate-100 hover:text-slate-900 gap-1.5 shadow-none hidden sm:flex items-center"
                title="Quick Commands (Ctrl+K)"
             >
                <Command className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span className="font-mono text-[9px] bg-white text-slate-500 px-1 py-0.5 rounded border border-slate-200">Ctrl+K</span>
             </Button>

             <Button
                variant="outline"
                size="sm"
                onClick={() => {
                   setActiveStudioTab("proofreader")
                   setShowAssistant(false)
                }}
                className={cn(
                   "h-8 rounded-lg px-3 text-[11px] font-semibold border gap-1.5 shadow-none transition-all",
                   activeStudioTab === "proofreader"
                      ? "bg-slate-900 text-white border-slate-900"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:text-slate-900"
                )}
             >
                <SpellCheck2 className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                <span>Check Spelling</span>
             </Button>

             <Button 
                variant="ghost"
                size="sm"
                onClick={() => setShowAssistant(!showAssistant)}
                className={cn(
                  "h-8 rounded-lg px-3 text-[11px] font-semibold gap-1.5 transition-all shadow-none",
                  showAssistant 
                    ? "bg-slate-900 text-white" 
                    : "bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200/60"
                )}
              >
                <Wand2 className={cn("h-3.5 w-3.5 text-indigo-600 shrink-0", showAssistant && "animate-pulse")} />
                <span>{showAssistant ? "Return to Preview" : "AI Assistant"}</span>
                {!showAssistant && (
                  <span className="ml-0.5 rounded bg-indigo-200/60 text-indigo-800 px-1 py-0 text-[8px] font-bold uppercase">
                    NEW
                  </span>
                )}
              </Button>

            <div className="h-4 w-px bg-slate-200 mx-0.5 hidden lg:block" />

            <Button
              variant="ghost"
              size="sm"
              onClick={handleDownloadPdf}
              disabled={isExporting}
              className="h-8 rounded-lg px-3 bg-slate-900 text-white hover:bg-slate-800 font-semibold text-[11px] gap-1.5 transition-all shadow-sm"
            >
              {isExporting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
              ) : (
                <FileDown className="h-3.5 w-3.5 text-indigo-200 shrink-0" />
              )}
              <span className="hidden sm:inline">Export PDF</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => toast({ title: "Pushed to ATS", description: "Candidate data has been sent to Bullhorn via Merge.dev." })}
              className="h-8 rounded-lg px-3 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/80 font-semibold text-[11px] gap-1.5 transition-all shadow-none"
            >
              <SendHorizontal className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
              <span className="hidden sm:inline">Push to ATS</span>
            </Button>

            <div className="h-4 w-px bg-slate-200 mx-0.5 hidden lg:block" />

            <div className="hidden items-center gap-1 lg:flex">
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleUndo} 
                disabled={historyIndex <= 0} 
                className="h-8 w-8 p-0 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 flex items-center justify-center disabled:opacity-40 shadow-none"
                title="Undo (Ctrl+Z)"
              >
                <Undo className="h-3.5 w-3.5" />
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleRedo} 
                disabled={historyIndex >= historyLength - 1} 
                className="h-8 w-8 p-0 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 flex items-center justify-center disabled:opacity-40 shadow-none"
                title="Redo (Ctrl+Y)"
              >
                <Redo className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-[4.75rem_13.5rem_minmax(0,1fr)_minmax(480px,1.05fr)]">
      {/* 1st Column: Side Navigation */}
      <aside className="z-10 flex flex-col items-center gap-4 border-r border-slate-200/60 bg-white/45 px-3 py-5 backdrop-blur-xl shrink-0">
        <Link 
          href="/dashboard"
          className="flex flex-col items-center gap-1 group"
          title="Exit to Dashboard"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-[1.2rem] bg-slate-100 text-slate-500 shadow-sm transition-all hover:bg-slate-200 hover:text-slate-900 active:scale-95 duration-300">
            <LogIn className="h-4 w-4" />
          </div>
          <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 group-hover:text-slate-600 transition-colors">Exit</span>
        </Link>

        <div className="flex flex-col items-center gap-2 rounded-[1.6rem] border border-white/80 bg-white/78 px-2 py-3 shadow-[0_24px_44px_-36px_rgba(15,23,42,0.35)]">
          {studioNavigation.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveStudioTab(item.id)}
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-[0.95rem] transition-all",
                activeStudioTab === item.id
                  ? "bg-[linear-gradient(135deg,rgba(103,58,183,0.14),rgba(33,150,243,0.16),rgba(255,152,0,0.18))] text-primary shadow-[0_18px_30px_-22px_rgba(79,70,229,0.45)]"
                  : "text-slate-400 hover:bg-slate-50 hover:text-slate-700"
              )}
              title={item.label}
            >
              <item.icon className="h-4.5 w-4.5" />
            </button>
          ))}
        </div>
      </aside>

      {/* 2nd Column: Section Navigation */}
      <aside className="flex flex-col border-r border-slate-200/60 bg-white/60 px-5 py-6 shrink-0 backdrop-blur-sm">
        <div className="mb-6">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Section workspace</p>
          <div className="mt-2 flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            <p className="text-[0.92rem] font-black tracking-tight text-slate-950">CV Builder</p>
          </div>
        </div>
        <div className="space-y-1">
          {activeStudioTab === "preview" ? (
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => setActiveSection("personal")}
                className={cn(
                  "flex w-full items-center gap-3 rounded-[0.95rem] px-3 py-2.5 text-left transition-all group mb-1",
                  activeSection === "personal"
                    ? "bg-primary/5 text-primary border border-primary/10"
                    : "text-slate-500 hover:bg-slate-50 border border-transparent"
                )}
              >
                <div className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-lg transition-colors",
                  activeSection === "personal" ? "bg-primary text-white shadow-lg shadow-primary/20" : "bg-slate-100 text-slate-400 group-hover:bg-slate-200"
                )}>
                  <User className="h-3.5 w-3.5" />
                </div>
                <span className="text-[0.8rem] font-bold tracking-tight flex-1">Personal</span>
                {isSectionComplete("personal") && (
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                )}
              </button>
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3 ml-2 mt-3">Resume Sections</p>
              <Reorder.Group 
                axis="y" 
                values={resume.sectionOrder || []} 
                onReorder={(newOrder) => handleUpdate("sectionOrder", newOrder)}
                className="space-y-1"
              >
                {(resume.sectionOrder || []).map((sectionId: string) => {
                  const section = sections.find(s => s.id === sectionId)
                  if (!section) return null
                  const complete = isSectionComplete(sectionId)
                  
                  return (
                    <Reorder.Item 
                      key={sectionId} 
                      value={sectionId}
                      className="relative"
                    >
                      <button
                        onClick={() => setActiveSection(sectionId)}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-[0.95rem] px-3 py-2.5 text-left transition-all group relative",
                          activeSection === sectionId
                            ? "bg-primary/5 text-primary border border-primary/10"
                            : "text-slate-500 hover:bg-slate-50 border border-transparent"
                        )}
                      >
                        <div className={cn(
                          "flex h-7 w-7 items-center justify-center rounded-lg transition-colors",
                          activeSection === sectionId ? "bg-primary text-white shadow-lg shadow-primary/20" : "bg-slate-100 text-slate-400 group-hover:bg-slate-200"
                        )}>
                          <section.icon className="h-3.5 w-3.5" />
                        </div>
                        <span className="text-[0.8rem] font-bold tracking-tight flex-1">{section.label}</span>
                        {complete && (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mr-1" />
                        )}
                        <div className="opacity-0 group-hover:opacity-40 transition-opacity cursor-grab active:cursor-grabbing">
                           <Layout className="h-3 w-3 rotate-90" />
                        </div>
                      </button>
                    </Reorder.Item>
                  )
                })}
              </Reorder.Group>
            </div>
          ) : (
             <div className="space-y-1">
               <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3 ml-2">Studio Modes</p>
               {studioNavigation.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveStudioTab(item.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-[0.95rem] px-3 py-2.5 text-left transition-all group",
                    activeStudioTab === item.id
                      ? "bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-900/10"
                      : "text-slate-500 hover:bg-slate-50 border border-transparent"
                  )}
                >
                   <div className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-lg transition-colors",
                    activeStudioTab === item.id ? "bg-white/20 text-white" : "bg-slate-100 text-slate-400"
                  )}>
                    <item.icon className="h-3.5 w-3.5" />
                  </div>
                  <span className="text-[0.8rem] font-bold tracking-tight">{item.label}</span>
                </button>
              ))}
                 </div>
               )}
        </div>
      </aside>

      {/* 3rd Column: Editor Content */}
      <main className="min-w-0 flex-[1.65] overflow-hidden">
        <div className="flex h-full flex-col">
          <ScrollArea className="flex-1">
            <div className="px-6 py-6">
              {activeSection === "personal" && (
                <div className="space-y-8">
                  <div className="space-y-1">
                    <h3 className="text-lg font-black text-slate-900">Profile Details</h3>
                    <p className="text-sm text-slate-500 font-medium">Your name and contact info appear at the top of your CV.</p>
                  </div>
                  <div className="space-y-5">
                    <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                      <PhotoUpload
                        photoUrl={resume.content.personal?.photoUrl || resume.content.personal?.photo || ""}
                        onFileChange={handlePhotoFileChange}
                        onDelete={handleDeletePhoto}
                        isCropping={isCropping}
                        setIsCropping={setIsCropping}
                        cropImage={cropImage}
                        onCropComplete={onCropComplete}
                        onProcessCrop={processCrop}
                        isUploading={isUploading}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-1">Full Name</label>
                      <TitleInput
                        value={resume.content.personal?.name || ""}
                        onChange={(e) => handleUpdate("content.personal.name", e.target.value)}
                        placeholder="e.g. Charles Salimu"
                        className="h-12 rounded-xl border-none bg-slate-50/50 font-bold text-slate-900"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-1">Professional Title</label>
                      <TitleInput
                        value={resume.content.personal?.title || ""}
                        onChange={(e) => handleUpdate("content.personal.title", e.target.value)}
                        placeholder="e.g. Senior Product Designer"
                        className="h-12 rounded-xl border-none bg-slate-50/50 font-bold text-slate-900"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-1">Email</label>
                        <Input
                          value={resume.content.personal?.email || ""}
                          onChange={(e) => handleUpdate("content.personal.email", e.target.value)}
                          placeholder="you@example.com"
                          type="email"
                          className="h-11 rounded-xl border-none bg-slate-50/50 text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-1">Phone</label>
                        <Input
                          value={resume.content.personal?.phone || ""}
                          onChange={(e) => handleUpdate("content.personal.phone", e.target.value)}
                          placeholder="+44 7700 000000"
                          type="tel"
                          className="h-11 rounded-xl border-none bg-slate-50/50 text-sm"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-1">Location</label>
                      <Input
                        value={resume.content.personal?.location || ""}
                        onChange={(e) => handleUpdate("content.personal.location", e.target.value)}
                        placeholder="e.g. London, UK"
                        className="h-11 rounded-xl border-none bg-slate-50/50 text-sm"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-1">LinkedIn</label>
                        <Input
                          value={resume.content.personal?.linkedin || ""}
                          onChange={(e) => handleUpdate("content.personal.linkedin", e.target.value)}
                          placeholder="linkedin.com/in/yourname"
                          className="h-11 rounded-xl border-none bg-slate-50/50 text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-1">Website</label>
                        <Input
                          value={resume.content.personal?.website || ""}
                          onChange={(e) => handleUpdate("content.personal.website", e.target.value)}
                          placeholder="yourwebsite.com"
                          className="h-11 rounded-xl border-none bg-slate-50/50 text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === "volunteer" && (
                 <div className="space-y-8">
                   <div className="flex items-center justify-between">
                     <p className="text-sm text-slate-500 font-semibold opacity-70">List your volunteer experience and impact.</p>
                     <Button 
                       onClick={() => {
                           const newVol = [{ 
                               id: Date.now(), 
                               role: "", 
                               organization: "", 
                               period: "", 
                               description: "" 
                           }, ...(resume.content.volunteer || [])]
                           handleUpdate("content.volunteer", newVol)
                       }}
                       className="gap-2 rounded-xl shadow-lg shadow-primary/15"
                     >
                       <Plus className="h-4 w-4" /> Add Volunteer
                     </Button>
                   </div>
                   
                   <div className="space-y-6">
                     {resume.content.volunteer?.map((vol: any, idx: number) => (
                       <Card key={vol.id || idx} className="border border-slate-100 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden rounded-2xl">
                         {/* Card Toolbar */}
                         <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/60 px-4 py-2">
                           <div className="flex items-center gap-1">
                             <button
                               disabled={idx === 0}
                               onClick={() => moveVolunteer(idx, 'up')}
                               className="h-7 w-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-white disabled:opacity-30 transition-all"
                             >
                               <ChevronUp className="h-4 w-4" />
                             </button>
                             <button
                               disabled={idx === (resume.content.volunteer?.length || 0) - 1}
                               onClick={() => moveVolunteer(idx, 'down')}
                               className="h-7 w-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-white disabled:opacity-30 transition-all"
                             >
                               <ChevronDown className="h-4 w-4" />
                             </button>
                           </div>
                           
                           <div className="flex items-center gap-2">
                             <button
                               onClick={() => {
                                 const newVol = resume.content.volunteer.filter((_: any, i: number) => i !== idx)
                                 handleUpdate("content.volunteer", newVol)
                               }}
                               className="h-7 w-7 rounded-lg flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all"
                             >
                               <Trash2 className="h-3.5 w-3.5" />
                             </button>
                           </div>
                         </div>
                         <div className="p-6 space-y-4">
                           <div className="grid grid-cols-2 gap-4">
                             <TitleInput
                               value={vol.role}
                               onChange={(e) => {
                                 const next = [...resume.content.volunteer]
                                 next[idx] = { ...next[idx], role: e.target.value }
                                 handleUpdate("content.volunteer", next)
                               }}
                               placeholder="Role Title"
                               className="font-black border-none bg-slate-50/50 h-11 px-4 text-slate-900 rounded-xl"
                             />
                             <Input
                               value={vol.period}
                               onChange={(e) => {
                                 const next = [...resume.content.volunteer]
                                 next[idx] = { ...next[idx], period: e.target.value }
                                 handleUpdate("content.volunteer", next)
                               }}
                               placeholder="e.g., 2020 - Present"
                               className="border-none bg-slate-50/50 h-11 px-4 text-slate-500 text-sm font-bold rounded-xl"
                             />
                           </div>
                           <TitleInput
                             value={vol.organization}
                             onChange={(e) => {
                               const next = [...resume.content.volunteer]
                               next[idx] = { ...next[idx], organization: e.target.value }
                               handleUpdate("content.volunteer", next)
                             }}
                             placeholder="Organization Name"
                             className="border-none bg-slate-50/50 h-11 px-4 text-primary font-black rounded-xl"
                           />
                           <RichTextField
                             value={vol.description}
                             onChange={(val) => {
                               const next = [...resume.content.volunteer]
                               next[idx] = { ...next[idx], description: val }
                               handleUpdate("content.volunteer", next)
                             }}
                             placeholder="Key accomplishments and responsibilities..."
                           />
                         </div>
                       </Card>
                     ))}
                   </div>
                 </div>
               )}

              {activeSection === "summary" && (
                <div className="space-y-8">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-slate-500 font-semibold opacity-70">Elevate your professional narrative.</p>
                    
                    <Popover onOpenChange={(open) => {
                      if (open && summarySuggestions.length === 0) {
                        runSummarySuggestions("professional");
                      }
                    }}>
                      <PopoverTrigger asChild>
                        <Button 
                          onClick={() => runSummarySuggestions()}
                          disabled={isGeneratingSummarySuggestions}
                          className="gap-2 rounded-xl bg-orange-500 text-white hover:bg-orange-600 shadow-lg shadow-orange-500/20 px-6 py-5 border-none transition-all duration-300 active:scale-95"
                        >
                          {isGeneratingSummarySuggestions ? (
                            <div className="h-4 w-4 border-2 border-white/30 border-t-white animate-spin rounded-full" />
                          ) : (
                            <Wand2 className="h-4 w-4" />
                          )}
                          <span className="text-[11px] font-black uppercase tracking-widest">AI Summary Suggestions</span>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent align="end" className="w-[450px] p-0 rounded-3xl border-slate-200/60 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] overflow-hidden">
                        <div className="bg-slate-50/50 p-5 border-b border-slate-100 flex items-center justify-between">
                          <div>
                            <h4 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-2">
                              <div className="h-2 w-2 rounded-full bg-orange-500" />
                              Summary Variants
                            </h4>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Select the best narrative for your profile</p>
                          </div>
                        </div>
                        
                        <div className="max-h-[500px] overflow-y-auto p-3 space-y-3 scrollbar-thin scrollbar-thumb-slate-200">
                          {isGeneratingSummarySuggestions ? (
                            <div className="p-12 text-center space-y-4">
                              <div className="relative w-12 h-12 mx-auto">
                                <div className="absolute inset-0 rounded-full border-2 border-orange-500/20" />
                                <div className="absolute inset-0 rounded-full border-2 border-orange-500 border-t-transparent animate-spin" />
                              </div>
                              <p className="text-xs font-black text-slate-400 uppercase tracking-widest animate-pulse">Analyzing career path...</p>
                            </div>
                          ) : summarySuggestions.length > 0 ? (
                            summarySuggestions.map((suggestion: any, idx: number) => {
                              const text = typeof suggestion === 'string' ? suggestion : suggestion.summary;
                              const style = typeof suggestion === 'object' ? suggestion.style : null;

                              return (
                                <div 
                                  key={idx} 
                                  className="group relative p-4 rounded-2xl bg-white border border-slate-100 hover:border-orange-200 hover:shadow-md transition-all duration-300 cursor-pointer"
                                  onClick={() => {
                                    handleUpdate("content.summary", plainTextToRichTextHtml(text));
                                    toast({
                                      title: "Summary Updated",
                                      description: "The AI summary has been applied to your resume."
                                    });
                                  }}
                                >
                                  <div className="absolute top-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {style && (
                                      <div className="px-2 py-0.5 rounded-full bg-slate-100 text-[8px] font-black text-slate-500 uppercase tracking-wider border border-slate-200">
                                        {style}
                                      </div>
                                    )}
                                    <div className="px-2 py-1 rounded-full bg-orange-500 text-[9px] font-black text-white uppercase tracking-wider">Apply</div>
                                  </div>
                                  <div className="text-xs text-slate-600 leading-relaxed pr-8 line-clamp-6">
                                    {text}
                                  </div>
                                </div>
                              );
                            })
                          ) : (
                            <div className="p-10 text-center text-slate-400 text-xs font-medium">
                              Click the wand to generate summary options.
                            </div>
                          )}
                        </div>
                        
                        <div className="p-4 bg-orange-500/5 border-t border-orange-100 flex items-center justify-between">
                           <div className="flex gap-2">
                             {['professional', 'impact', 'short'].map((s: string) => (
                               <Button 
                                 key={s}
                                 variant="ghost" 
                                 size="sm" 
                                 className="h-7 text-[9px] font-black uppercase tracking-widest text-orange-600 hover:bg-orange-500/10 rounded-lg px-3"
                                 onClick={() => runSummarySuggestions(s as any)}
                               >
                                 {s}
                               </Button>
                             ))}
                           </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                  <RichTextField
                    value={resume.content.summary}
                    onChange={(val) => handleUpdate("content.summary", val)}
                    placeholder="Senior Software Engineer with 8+ years of experience building scalable systems..."
                  />
                </div>
              )}

              {activeSection === "experience" && (
                <div className="space-y-8">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-slate-500 font-semibold opacity-70">List your professional journey and impact.</p>
                    <Button 
                       onClick={() => {
                           const newExp = [{ 
                               id: Date.now(), 
                               title: "", 
                               company: "", 
                               period: "", 
                               description: "" 
                           }, ...(resume.content.experience || [])]
                           handleUpdate("content.experience", newExp)
                       }}
                       className="gap-2 rounded-xl shadow-lg shadow-primary/15"
                     >
                       <Plus className="h-4 w-4" /> Add Experience
                     </Button>
                  </div>
                  
                  <div className="space-y-6">
                    {resume.content.experience?.map((exp: any, idx: number) => (
                      <Card key={exp.id || idx} className="border border-slate-100 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden rounded-2xl">
                        {/* Card Toolbar */}
                        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/60 px-4 py-2">
                          <div className="flex items-center gap-1">
                            <button
                              disabled={idx === 0}
                              onClick={() => moveExperience(idx, 'up')}
                              className="h-7 w-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-white disabled:opacity-30 transition-all"
                            >
                              <ChevronUp className="h-4 w-4" />
                            </button>
                            <button
                              disabled={idx === (resume.content.experience?.length || 0) - 1}
                              onClick={() => moveExperience(idx, 'down')}
                              className="h-7 w-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-white disabled:opacity-30 transition-all"
                            >
                              <ChevronDown className="h-4 w-4" />
                            </button>
                          </div>

                          <div className="flex items-center gap-2">
                            <Popover 
                              open={roleBulletSuggestions?.index === idx} 
                              onOpenChange={(open) => !open && dismissRoleBulletSuggestions()}
                            >
                              <PopoverTrigger asChild>
                                <button 
                                  disabled={isSuggestingRoleBullets === idx}
                                  onClick={() => {
                                    if (!exp.title) {
                                      toast({ variant: "destructive", title: "Add a job title first", description: "The AI needs your role title to generate relevant bullet points." })
                                      return
                                    }
                                    runSuggestRoleBullets(idx)
                                  }}
                                  className="flex items-center gap-1.5 h-7 px-3 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-[10px] font-black uppercase tracking-wider transition-all shadow-sm shadow-orange-500/30 disabled:opacity-60"
                                >
                                  {isSuggestingRoleBullets === idx ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <Wand2 className="h-3 w-3" />
                                  )}
                                  {isSuggestingRoleBullets === idx ? 'Researching...' : 'AI Bullet Suggestions'}
                                </button>
                              </PopoverTrigger>
                              <PopoverContent className="w-[500px] p-0 rounded-2xl border border-orange-100 shadow-2xl shadow-orange-500/10 overflow-hidden" align="end">
                                {roleBulletSuggestions && (
                                  <RoleBulletSelector
                                    title={roleBulletSuggestions.title || exp.title}
                                    company={exp.company}
                                    bullets={roleBulletSuggestions.bullets}
                                    onApply={(selectedBullets) => applyRoleBulletSuggestions(selectedBullets)}
                                    onDismiss={dismissRoleBulletSuggestions}
                                  />
                                )}
                              </PopoverContent>
                            </Popover>

                            <button
                              onClick={() => {
                                const newExp = resume.content.experience.filter((_: any, i: number) => i !== idx)
                                handleUpdate("content.experience", newExp)
                              }}
                              className="h-7 w-7 rounded-lg flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                        <div className="p-6 space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <TitleInput
                              value={exp.title}
                              onChange={(e) => {
                                const next = [...resume.content.experience]
                                next[idx] = { ...next[idx], title: e.target.value }
                                handleUpdate("content.experience", next)
                              }}
                              placeholder="Role Title"
                              className="font-black border-none bg-slate-50/50 h-11 px-4 text-slate-900 rounded-xl"
                            />
                            <Input
                              value={exp.period}
                              onChange={(e) => {
                                const next = [...resume.content.experience]
                                next[idx] = { ...next[idx], period: e.target.value }
                                handleUpdate("content.experience", next)
                              }}
                              placeholder="e.g., 2020 - Present"
                              className="border-none bg-slate-50/50 h-11 px-4 text-slate-500 text-sm font-bold rounded-xl"
                            />
                          </div>
                          <TitleInput
                            value={exp.company}
                            onChange={(e) => {
                              const next = [...resume.content.experience]
                              next[idx] = { ...next[idx], company: e.target.value }
                              handleUpdate("content.experience", next)
                            }}
                            placeholder="Company Name"
                            className="border-none bg-slate-50/50 h-11 px-4 text-primary font-black rounded-xl"
                          />
                          <RichTextField
                            value={exp.description}
                            onChange={(val) => {
                              const next = [...resume.content.experience]
                              next[idx] = { ...next[idx], description: val }
                              handleUpdate("content.experience", next)
                            }}
                            placeholder="Key accomplishments and responsibilities..."
                          />
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {activeSection === "education" && (
                <div className="space-y-8">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-slate-500 font-semibold opacity-70">List your academic achievements.</p>
                    <Button 
                      onClick={() => {
                        const next = [...(resume.content.education || []), { degree: "", school: "", date: "" }]
                        handleUpdate("content.education", next)
                      }}
                      className="gap-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 shadow-sm"
                      size="sm"
                    >
                      <Plus className="h-4 w-4" /> Add Education
                    </Button>
                  </div>
                  <div className="space-y-6">
                    {resume.content.education?.map((edu: any, idx: number) => (
                      <Card key={idx} className="group overflow-hidden border-slate-200/60 shadow-sm hover:shadow-md transition-all duration-300 rounded-[2rem]">
                        <div className="bg-slate-50/50 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 font-bold text-xs">
                              {idx + 1}
                            </div>
                            <span className="text-xs font-black uppercase tracking-widest text-slate-900">{edu.degree || "New Education Entry"}</span>
                          </div>
                          <button
                            onClick={() => {
                              const next = resume.content.education.filter((_: any, i: number) => i !== idx)
                              handleUpdate("content.education", next)
                            }}
                            className="h-7 w-7 rounded-lg flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <div className="p-6">
                           <div className="grid grid-cols-3 gap-4">
                             <div className="col-span-1">
                               <TitleInput
                                 value={edu.degree}
                                 onChange={(e) => {
                                   const next = [...resume.content.education]
                                   next[idx] = { ...next[idx], degree: e.target.value }
                                   handleUpdate("content.education", next)
                                 }}
                                 placeholder="Degree / Certificate"
                                 className="font-black border-none bg-slate-50/50 h-11 px-4 text-slate-900 rounded-xl w-full"
                               />
                             </div>
                             <div className="col-span-1">
                               <TitleInput
                                 value={edu.school}
                                 onChange={(e) => {
                                   const next = [...resume.content.education]
                                   next[idx] = { ...next[idx], school: e.target.value }
                                   handleUpdate("content.education", next)
                                 }}
                                 placeholder="School / University"
                                 className="border-none bg-slate-50/50 h-11 px-4 text-primary font-black rounded-xl w-full"
                               />
                             </div>
                             <div className="col-span-1">
                               <Input 
                                 value={edu.date} 
                                 onChange={(e) => {
                                   const next = [...resume.content.education]
                                   next[idx] = { ...next[idx], date: e.target.value }
                                   handleUpdate("content.education", next)
                                 }}
                                 placeholder="Date Range"
                                 className="border-none bg-slate-50/50 h-11 px-4 text-slate-400 font-medium text-xs rounded-xl w-full"
                               />
                             </div>
                           </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {activeSection === "skills" && (
                <div className="space-y-8">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <h3 className="text-lg font-black text-slate-900">Core Competencies</h3>
                      <p className="text-sm text-slate-500 font-semibold opacity-70">Boost your ATS score with role-specific skills.</p>
                    </div>
                    
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button 
                          onClick={() => runSkillSuggestions()}
                          disabled={isSuggestingSkills}
                          className="gap-2 rounded-xl bg-orange-500 text-white hover:bg-orange-600 shadow-lg shadow-orange-500/20 px-6 py-5 border-none"
                        >
                          {isSuggestingSkills ? (
                            <div className="h-4 w-4 border-2 border-white/30 border-t-white animate-spin rounded-full" />
                          ) : (
                            <Wand2 className="h-4 w-4" />
                          )}
                          <span className="text-[11px] font-black uppercase tracking-widest">AI Suggest Skills</span>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[450px] p-6 rounded-3xl border border-orange-100 shadow-2xl shadow-orange-500/10" align="end">
                         <div className="space-y-6">
                            <div className="flex items-center gap-3">
                               <div className="h-10 w-10 rounded-2xl bg-orange-100 flex items-center justify-center">
                                  <Wrench className="h-5 w-5 text-orange-600" />
                               </div>
                               <div>
                                  <h4 className="text-sm font-black text-slate-900">Recommended Skills</h4>
                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Based on current market trends</p>
                               </div>
                            </div>
                            
                            <div className="max-h-[300px] overflow-y-auto pr-2 flex flex-wrap gap-2">
                               {skillSuggestions?.map((skill: string, i: number) => (
                                 <Badge 
                                   key={i} 
                                   variant="outline"
                                   onClick={() => {
                                      const current = resume.content.skills || []
                                      if (!current.includes(skill)) {
                                         handleUpdate("content.skills", [...current, skill])
                                      }
                                   }}
                                   className="px-3 py-1.5 rounded-full bg-slate-50 hover:bg-orange-50 hover:border-orange-300 hover:text-orange-600 cursor-pointer transition-all border-slate-200 text-slate-600 font-bold text-xs"
                                 >
                                    <Plus className="h-3 w-3 mr-1 opacity-50" /> {skill}
                                 </Badge>
                               ))}
                            </div>
                         </div>
                      </PopoverContent>
                    </Popover>
                  </div>

                  <Card className="p-8 border-slate-200/60 shadow-sm rounded-[2.5rem] bg-slate-50/30">
                     <div className="flex flex-wrap gap-3">
                        {resume.content.skills?.map((skill: string, idx: number) => (
                          <Badge 
                            key={idx}
                            className="bg-white hover:bg-white text-slate-900 border-slate-200 px-4 py-2 rounded-xl flex items-center gap-2 group shadow-sm transition-all hover:shadow-md hover:scale-[1.02]"
                          >
                             <span className="font-black text-xs">{skill}</span>
                             <button
                               onClick={() => {
                                 const next = resume.content.skills.filter((_: any, i: number) => i !== idx)
                                 handleUpdate("content.skills", next)
                               }}
                               className="h-5 w-5 rounded-lg flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                             >
                               <X className="h-3 w-3" />
                             </button>
                          </Badge>
                        ))}
                        <div className="flex-1 min-w-[150px]">
                           <Input 
                             onKeyDown={(e) => {
                               if (e.key === "Enter") {
                                 const val = e.currentTarget.value.trim()
                                 if (val) {
                                   const current = resume.content.skills || []
                                   handleUpdate("content.skills", [...current, val])
                                   e.currentTarget.value = ""
                                 }
                               }
                             }}
                             placeholder="Type and press Enter to add..."
                             className="border-none bg-white/80 h-10 px-4 text-xs font-bold rounded-xl shadow-inner focus-visible:ring-orange-500/20"
                           />
                        </div>
                     </div>
                  </Card>
                </div>
              )}

              {activeSection === "projects" && (
                <div className="space-y-8">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-slate-500 font-semibold opacity-70">Showcase your best engineering and research projects.</p>
                    <Button 
                      onClick={() => {
                        const next = [...(resume.content.projects || []), { title: "", link: "", description: "" }]
                        handleUpdate("content.projects", next)
                      }}
                      className="gap-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 shadow-sm"
                      size="sm"
                    >
                      <Plus className="h-4 w-4" /> Add Project
                    </Button>
                  </div>
                  <div className="space-y-6">
                    {resume.content.projects?.map((proj: any, idx: number) => (
                      <Card key={idx} className="group overflow-hidden border-slate-200/60 shadow-sm hover:shadow-md transition-all duration-300 rounded-[2rem]">
                        <div className="bg-slate-50/50 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 font-bold text-xs">
                              {idx + 1}
                            </div>
                            <span className="text-xs font-black uppercase tracking-widest text-slate-900">{proj.name || "New Project"}</span>
                          </div>
                          <button
                            onClick={() => {
                              const next = resume.content.projects.filter((_: any, i: number) => i !== idx)
                              handleUpdate("content.projects", next)
                            }}
                            className="h-7 w-7 rounded-lg flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <div className="p-6 space-y-4">
                           <div className="grid grid-cols-2 gap-4">
                             <TitleInput
                               value={proj.name}
                               onChange={(e) => {
                                 const next = [...resume.content.projects]
                                 next[idx] = { ...next[idx], name: e.target.value }
                                 handleUpdate("content.projects", next)
                               }}
                               placeholder="Project Title"
                               className="font-black border-none bg-slate-50/50 h-11 px-4 text-slate-900 rounded-xl"
                             />
                             <Input
                               value={proj.url}
                               onChange={(e) => {
                                 const next = [...resume.content.projects]
                                 next[idx] = { ...next[idx], url: e.target.value }
                                 handleUpdate("content.projects", next)
                               }}
                               placeholder="e.g. github.com/username/project"
                               className="border-none bg-slate-50/50 h-11 px-4 text-primary font-black rounded-xl"
                             />
                           </div>
                           <RichTextField
                             value={proj.description}
                             onChange={(val) => {
                               const next = [...resume.content.projects]
                               next[idx] = { ...next[idx], description: val }
                               handleUpdate("content.projects", next)
                             }}
                             placeholder="Describe the impact, tech stack, and your contributions..."
                           />
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {activeSection === "certifications" && (
                <div className="space-y-8">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-slate-500 font-semibold opacity-70">List your professional certifications and awards.</p>
                    <Button 
                      onClick={() => {
                        const next = [...(resume.content.certifications || []), { name: "", issuer: "", date: "" }]
                        handleUpdate("content.certifications", next)
                      }}
                      className="gap-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 shadow-sm"
                      size="sm"
                    >
                      <Plus className="h-4 w-4" /> Add Certification
                    </Button>
                  </div>
                  <div className="space-y-4">
                    {resume.content.certifications?.map((cert: any, idx: number) => (
                       <Card key={idx} className="group border-slate-200/60 shadow-sm hover:shadow-md transition-all rounded-2xl overflow-hidden">
                         <div className="flex items-center gap-4 p-4">
                           <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0">
                             <Award className="h-5 w-5 text-slate-300" />
                           </div>
                           <div className="flex-1 grid grid-cols-3 gap-4">
                             <TitleInput
                               value={cert.name}
                               onChange={(e) => {
                                 const next = [...resume.content.certifications]
                                 next[idx] = { ...next[idx], name: e.target.value }
                                 handleUpdate("content.certifications", next)
                               }}
                               placeholder="Certification Name"
                               className="h-9 border-none bg-transparent p-0 text-slate-900 font-black focus-visible:ring-0"
                             />
                             <TitleInput
                               value={cert.issuer}
                               onChange={(e) => {
                                 const next = [...resume.content.certifications]
                                 next[idx] = { ...next[idx], issuer: e.target.value }
                                 handleUpdate("content.certifications", next)
                               }}
                               placeholder="Issuing Organization"
                               className="h-9 border-none bg-transparent p-0 text-primary font-bold focus-visible:ring-0"
                             />
                             <Input 
                               value={cert.date} 
                               onChange={(e) => {
                                 const next = [...resume.content.certifications]
                                 next[idx] = { ...next[idx], date: e.target.value }
                                 handleUpdate("content.certifications", next)
                               }}
                               placeholder="Date Received"
                               className="h-9 border-none bg-transparent p-0 text-slate-400 text-xs font-bold focus-visible:ring-0"
                             />
                           </div>
                           <button
                            onClick={() => {
                              const next = resume.content.certifications.filter((_: any, i: number) => i !== idx)
                              handleUpdate("content.certifications", next)
                            }}
                            className="h-8 w-8 rounded-full flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                         </div>
                       </Card>
                    ))}
                  </div>
                </div>
              )}

              {activeSection === "languages" && (
                <div className="space-y-8">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-slate-500 font-semibold opacity-70">Add your linguistic proficiencies.</p>
                    <Button 
                      onClick={() => {
                        const next = [...(resume.content.languages || []), { name: "", level: "" }]
                        handleUpdate("content.languages", next)
                      }}
                      className="gap-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 shadow-sm"
                      size="sm"
                    >
                      <Plus className="h-4 w-4" /> Add Language
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {resume.content.languages?.map((lang: any, idx: number) => (
                       <Card key={idx} className="group border-slate-200/60 shadow-sm hover:shadow-md transition-all rounded-2xl overflow-hidden p-4">
                         <div className="flex items-center gap-4">
                           <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0">
                             <Globe className="h-4 w-4 text-slate-300" />
                           </div>
                           <div className="flex-1 space-y-2">
                              <Input 
                                value={lang.name} 
                                onChange={(e) => {
                                  const next = [...resume.content.languages]
                                  next[idx] = { ...next[idx], name: e.target.value }
                                  handleUpdate("content.languages", next)
                                }}
                                placeholder="Language"
                                className="h-8 border-none bg-transparent p-0 text-slate-900 font-black focus-visible:ring-0"
                              />
                              <Input 
                                value={lang.level} 
                                onChange={(e) => {
                                  const next = [...resume.content.languages]
                                  next[idx] = { ...next[idx], level: e.target.value }
                                  handleUpdate("content.languages", next)
                                }}
                                placeholder="Proficiency Level"
                                className="h-6 border-none bg-transparent p-0 text-slate-400 text-[10px] font-black uppercase tracking-widest focus-visible:ring-0"
                              />
                           </div>
                           <button
                             onClick={() => {
                               const next = resume.content.languages.filter((_: any, i: number) => i !== idx)
                               handleUpdate("content.languages", next)
                             }}
                             className="h-8 w-8 rounded-full flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                           >
                             <Trash2 className="h-4 w-4" />
                           </button>
                         </div>
                       </Card>
                    ))}
                  </div>
                </div>
              )}
              {activeSection === "interests" && (
                <div className="space-y-8">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <h3 className="text-lg font-black text-slate-900">Hobbies & Interests</h3>
                      <p className="text-sm text-slate-500 font-semibold opacity-70 italic">Show the person behind the professional.</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Popover onOpenChange={(open) => {
                        if (open && interestSuggestions.length === 0) {
                          runInterestSuggestions();
                        }
                      }}>
                        <PopoverTrigger asChild>
                          <Button 
                            onClick={() => runInterestSuggestions()}
                            disabled={isSuggestingInterests}
                            className="gap-2 rounded-xl bg-orange-500 text-white hover:bg-orange-600 shadow-lg shadow-orange-500/20 px-4 h-9 border-none transition-all duration-300 active:scale-95"
                            size="sm"
                          >
                            {isSuggestingInterests ? (
                              <div className="h-4 w-4 border-2 border-white/30 border-t-white animate-spin rounded-full" />
                            ) : (
                              <Wand2 className="h-4 w-4" />
                            )}
                            <span className="text-[10px] font-black uppercase tracking-widest">AI Hobbies Suggestions</span>
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent align="end" className="w-[400px] p-0 rounded-3xl border-slate-200/60 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] overflow-hidden">
                          <div className="bg-slate-950 p-6 text-white pb-8">
                             <div className="flex items-center gap-3 mb-2">
                               <div className="h-8 w-8 rounded-xl bg-orange-500 flex items-center justify-center">
                                 <Wand2 className="h-4 w-4 text-white" />
                               </div>
                               <h4 className="text-lg font-black tracking-tight">Character Builder</h4>
                             </div>
                             <p className="text-slate-400 text-xs font-medium leading-relaxed">Personalized hobbies that demonstrate leadership, logic, or creative character based on your profile.</p>
                          </div>
                          <div className="p-4 bg-white">
                            {isSuggestingInterests ? (
                              <div className="py-12 flex flex-col items-center gap-4">
                                <div className="h-8 w-8 border-4 border-orange-500/20 border-t-orange-500 animate-spin rounded-full" />
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Analyzing Profile...</p>
                              </div>
                            ) : (
                              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                {interestSuggestions.map((interest: string, idx: number) => (
                                  <button
                                    key={idx}
                                    onClick={() => {
                                      const variant = resume.content.interestsVariant || "list"
                                      if (variant === "list") {
                                        const current = resume.content.interests || [];
                                        if (!current.includes(interest)) {
                                          handleUpdate("content.interests", [...current, interest]);
                                        }
                                      } else {
                                        const current = resume.content.interestsContent || ""
                                        const divider = current.length > 0 ? "\n" : ""
                                        handleUpdate("content.interestsContent", current + divider + interest)
                                      }
                                      setInterestSuggestions(interestSuggestions.filter((_: any, i: number) => i !== idx));
                                    }}
                                    className="w-full flex items-center justify-between p-3 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-orange-200 hover:shadow-sm transition-all text-left group"
                                  >
                                    <span className="text-xs font-bold text-slate-700">{interest}</span>
                                    <Plus className="h-3.5 w-3.5 text-slate-300 group-hover:text-orange-500 transition-colors" />
                                  </button>
                                ))}
                                {interestSuggestions.length === 0 && (
                                  <div className="py-8 text-center text-slate-400 text-xs font-medium">
                                    No more suggestions available.
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Hiring Manager Intelligence</span>
                            <Button variant="ghost" size="sm" onClick={() => runInterestSuggestions()} className="h-8 text-[10px] font-black uppercase text-orange-500 hover:text-orange-600 hover:bg-orange-50">
                              Regenerate
                            </Button>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  <Tabs 
                    defaultValue="list" 
                    value={resume.content.interestsVariant || "list"}
                    onValueChange={(v) => handleUpdate("content.interestsVariant", v)}
                    className="w-full"
                  >
                    <TabsList className="bg-slate-100/50 p-1 rounded-2xl w-full grid grid-cols-2 mb-8 h-12">
                      <TabsTrigger value="list" className="rounded-xl font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm">
                        Bullet Points
                      </TabsTrigger>
                      <TabsTrigger value="text" className="rounded-xl font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm">
                        Text Box
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="list" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <div className="flex justify-end">
                        <Button 
                          onClick={() => {
                            const next = [...(resume.content.interests || []), ""]
                            handleUpdate("content.interests", next)
                          }}
                          className="gap-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 shadow-sm px-4 h-9"
                          size="sm"
                        >
                          <Plus className="h-4 w-4" /> Add Hobby
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        {(resume.content.interests || []).map((interest: string, idx: number) => (
                          <Card key={idx} className="p-4 border-slate-200/60 shadow-sm rounded-2xl bg-white group hover:border-orange-200 transition-colors">
                            <div className="flex gap-4 items-center">
                              <Input 
                                value={interest}
                                onChange={(e) => {
                                  const next = [...resume.content.interests]
                                  next[idx] = e.target.value
                                  handleUpdate("content.interests", next)
                                }}
                                placeholder="e.g. Strategy Gaming"
                                className="flex-1 font-bold text-sm bg-transparent border-none p-0 focus-visible:ring-0 shadow-none text-slate-700"
                              />
                              <button
                                onClick={() => {
                                  const next = resume.content.interests.filter((_: any, i: number) => i !== idx)
                                  handleUpdate("content.interests", next)
                                }}
                                className="h-8 w-8 rounded-xl flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </TabsContent>

                    <TabsContent value="text" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                       <Card className="p-1 rounded-[2.5rem] border-slate-200/60 shadow-sm bg-white overflow-hidden">
                          <RichTextField
                            value={resume.content.interestsContent || ""}
                            onChange={(v) => handleUpdate("content.interestsContent", v)}
                            placeholder="Type your hobbies and interests here as a paragraph..."
                            className="min-h-[250px]"
                            editorClassName="prose prose-sm max-w-none focus:outline-none p-8 font-medium text-slate-600 leading-relaxed"
                          />
                       </Card>
                    </TabsContent>
                  </Tabs>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </main>

      <aside className="min-w-0 flex-[1.05] overflow-hidden bg-slate-50/45 px-6 py-6 backdrop-blur-sm">
        <Tabs value={activeStudioTab} onValueChange={(value) => setActiveStudioTab(value as "preview" | "templates" | "theme" | "proofreader")} className="flex h-full flex-col overflow-hidden rounded-[2.25rem] border border-white/80 bg-white/50 shadow-[0_45px_100px_-50px_rgba(15,23,42,0.25)] backdrop-blur-2xl">
          <TabsContent value="preview" className="mt-0 min-h-0 flex-1 overflow-hidden data-[state=inactive]:hidden">
            <AnimatePresence mode="wait">
              {showAssistant ? (
                <motion.div
                  key="assistant"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.02 }}
                  className="h-full bg-slate-50/50 p-6"
                >
                   <ScrollArea className="h-full rounded-[1.5rem] border border-white bg-white p-6 shadow-sm">
                      <ResumeAssistant resume={resume} />
                   </ScrollArea>
                </motion.div>
              ) : (
                <motion.div
                  key="preview"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-full"
                >
                  <PrintPreviewContainer 
                    resume={resume} 
                    className="h-full" 
                    defaultFitMode="page"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </TabsContent>

          <TabsContent value="templates" className="mt-0 min-h-0 flex-1 overflow-hidden data-[state=inactive]:hidden">
            <ScrollArea className="h-full bg-slate-50/30">
              <div className="p-8">
                <EditorDesignStudio
                  resume={resume}
                  plan={profile?.plan}
                  sections={["templates"]}
                  onSelectTemplate={applyTemplate}
                  onUpdateStyle={updateStyle}
                  onResetStyles={resetTemplateStyles}
                />
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="theme" className="mt-0 min-h-0 flex-1 overflow-hidden data-[state=inactive]:hidden">
            <ScrollArea className="h-full bg-slate-50/30">
              <div className="p-8">
                <EditorDesignStudio
                  resume={resume}
                  plan={profile?.plan}
                  sections={["styles"]}
                  onSelectTemplate={applyTemplate}
                  onUpdateStyle={updateStyle}
                  onResetStyles={resetTemplateStyles}
                />
              </div>
            </ScrollArea>
          </TabsContent>
          <TabsContent value="proofreader" className="mt-0 min-h-0 flex-1 overflow-hidden data-[state=inactive]:hidden h-full">
            <ProofreaderPanel
              resume={resume}
              isCheckingGrammarGlobal={isCheckingGrammarGlobal}
              globalGrammarIssues={globalGrammarIssues}
              hasScannedGrammar={hasScannedGrammar}
              runGlobalGrammarCheck={runGlobalGrammarCheck}
              applyGlobalGrammarFix={applyGlobalGrammarFix}
              dismissGlobalGrammarIssue={dismissGlobalGrammarIssue}
              onNavigateToSection={(sectionId) => {
                setActiveSection(sectionId)
                setActiveStudioTab("preview")
              }}
            />
          </TabsContent>
        </Tabs>
      </aside>
    </div>
  </div>

  <EditorCommandPalette
    isOpen={isCommandPaletteOpen}
    onClose={() => setIsCommandPaletteOpen(false)}
    onSelectSection={(sectionId) => setActiveSection(sectionId)}
    onSelectStudioTab={(tab) => setActiveStudioTab(tab)}
    onExportPdf={handleDownloadPdf}
  />
</div>
  )
}

function RoleBulletSelector({ 
  title, 
  company, 
  bullets, 
  onApply, 
  onDismiss 
}: { 
  title: string
  company?: string
  bullets: string[]
  onApply: (selectedBullets: string[]) => void
  onDismiss: () => void
}) {
  const [selected, setSelected] = useState<number[]>(() => bullets.map((_, i) => i))

  const toggleBullet = (index: number) => {
    setSelected((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    )
  }

  const toggleAll = () => {
    if (selected.length === bullets.length) {
      setSelected([])
    } else {
      setSelected(bullets.map((_, i) => i))
    }
  }

  const handleApply = () => {
    const chosen = bullets.filter((_, i) => selected.includes(i))
    onApply(chosen)
  }

  return (
    <div>
      <div className="bg-gradient-to-br from-orange-50 to-amber-50 px-5 py-3.5 border-b border-orange-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-xl bg-orange-500 flex items-center justify-center shadow-md">
            <Wand2 className="h-4 w-4 text-white" />
          </div>
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">AI Role Achievements</h3>
            <p className="text-[10px] font-medium text-slate-500 mt-0.5">Select bullet point(s) to add to {title}{company ? ` at ${company}` : ''}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={toggleAll}
          className="text-[10px] font-bold text-orange-600 hover:text-orange-700 bg-orange-100/70 hover:bg-orange-100 px-2.5 py-1 rounded-lg transition-all"
        >
          {selected.length === bullets.length ? "Deselect All" : "Select All"}
        </button>
      </div>

      <div className="p-4 bg-white space-y-3">
        <div className="max-h-[340px] overflow-y-auto pr-1 space-y-2">
          {bullets.map((bullet: string, i: number) => {
            const isChecked = selected.includes(i)
            return (
              <div
                key={i}
                onClick={() => toggleBullet(i)}
                className={cn(
                  "flex items-start gap-3 p-3 rounded-xl border transition-all duration-200 cursor-pointer select-none group/item",
                  isChecked
                    ? "bg-orange-50/40 border-orange-200 shadow-2xs"
                    : "bg-slate-50/50 border-slate-100 hover:border-slate-200 opacity-60"
                )}
              >
                <div
                  className={cn(
                    "mt-0.5 h-4 w-4 rounded border flex items-center justify-center shrink-0 transition-colors",
                    isChecked
                      ? "bg-orange-500 border-orange-500 text-white"
                      : "bg-white border-slate-300 group-hover/item:border-slate-400"
                  )}
                >
                  {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                </div>
                <p className={cn("text-[11px] font-medium leading-relaxed transition-colors", isChecked ? "text-slate-800 font-semibold" : "text-slate-500")}>
                  {bullet}
                </p>
              </div>
            )
          })}
        </div>

        <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
          <Button
            onClick={handleApply}
            disabled={selected.length === 0}
            className="flex-1 h-9 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-[10px] font-black uppercase tracking-wider shadow-md disabled:opacity-50"
          >
            Add Selected ({selected.length})
          </Button>
          <Button
            variant="ghost"
            onClick={onDismiss}
            className="h-9 rounded-xl text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-slate-600"
          >
            Dismiss
          </Button>
        </div>
      </div>
    </div>
  )
}
