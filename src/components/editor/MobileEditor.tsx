"use client"

import { useEffect, useMemo, useState } from "react"
import { 
  User, 
  Briefcase, 
  GraduationCap, 
  Wrench, 
  Globe, 
  Target, 
  Award,
  Sparkles,
  Layout,
  Palette,
  FileDown,
  Loader2,
  Trash2,
  Plus,
  Eye,
  Pencil,
  ArrowLeft,
  Cpu,
  SendHorizontal,
  ChevronUp,
  ChevronDown,
  ListPlus,
  Check,
  FileText,
  Upload,
  ShieldCheck,
  RefreshCcw,
  AlertCircle,
  CheckCircle2,
  Trophy,
  Paintbrush2,
  Heart,
  SpellCheck2
} from "lucide-react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { AgentRole, CAREER_AGENTS } from "@/services/CareerAgents"
import { AnimatePresence, motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { getTemplateConfig } from "@/lib/templates-config"
import { getRolePlaybook } from "@/lib/career-role-playbooks"
import { EditorDesignStudio } from "./editor-design-studio"
import { PrintPreviewContainer } from "./print-preview-container"
import { PhotoUpload } from "./PhotoUpload"
import { RichTextField } from "./rich-text-field"
import { plainTextToRichTextHtml } from "@/lib/rich-text"
import { ProofreaderPanel } from "./ProofreaderPanel"
import { TitleInput } from "@/components/ui/title-input"

import { cn } from "@/lib/utils"
interface MobileEditorProps {
  editor: any
}

export function MobileEditor({ editor }: MobileEditorProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [mobileView, setMobileView] = useState<"edit" | "preview">("edit")
  const [activeTab, setActiveTab] = useState<"content" | "ai" | "design">("content")
  const [activeSection, setActiveSection] = useState<string>("target")
  const [isEditingName, setIsEditingName] = useState(false)
  const [summaryStyle, setSummaryStyle] = useState('professional')
  const [tempName, setTempName] = useState(editor.resume?.name || "")
  const [showAiBulletHint, setShowAiBulletHint] = useState(true)
  
  const { 
    resume, 
    handleUpdate, 
    isExporting, 
    handleDownloadPdf, 
    saveStatus,
    isEnhancing,
    isSuggestingRoleBullets,
    runSuggestRoleBullets,
    roleBulletSuggestions,
    applyRoleBulletSuggestions,
    dismissRoleBulletSuggestions,
    isGeneratingSummarySuggestions,
    summarySuggestions,
    setSummarySuggestions,
    runSummarySuggestions,
    isSuggestingSkills,
    skillSuggestions,
    runSkillSuggestions,
    setSkillSuggestions,
    isSuggestingInterests,
    interestSuggestions,
    runInterestSuggestions,
    setInterestSuggestions,
    jobDescription,
    setJobDescription,
    atsResult,
    runAtsCheck,
    applyTemplate,
    updateStyle,
    resetTemplateStyles,
    profile,
    routingLogs,
    chatMessages,
    setChatMessages,
    sendAdvisoryMessage,

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

  const [chatInput, setChatInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const interestsVariant = resume?.content?.interestsVariant || "list"

  const reorderItems = <T,>(items: T[] | undefined, fromIndex: number, toIndex: number) => {
    if (!items || toIndex < 0 || toIndex >= items.length || fromIndex === toIndex) {
      return items || []
    }

    const next = [...items]
    const [movedItem] = next.splice(fromIndex, 1)
    next.splice(toIndex, 0, movedItem)
    return next
  }
  
  const currentExperienceTitle =
    roleBulletSuggestions?.title || resume?.content?.experience?.[0]?.title || resume?.content?.personal?.title || ""
  const experiencePlaybook = getRolePlaybook(currentExperienceTitle, jobDescription)
  const explicitReturnTo = searchParams.get("returnTo")
  
  const sectionChipClass =
    "inline-flex h-8 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-slate-100 bg-white px-2.5 text-[8.5px] font-black uppercase tracking-[0.1em] shadow-sm transition-all sm:h-9 sm:px-3 sm:text-[10px]"

  const fallbackReturnPath = useMemo(() => {
    if (
      explicitReturnTo &&
      explicitReturnTo.startsWith("/") &&
      !explicitReturnTo.startsWith("/cv-editor") &&
      !explicitReturnTo.startsWith("/editor")
    ) {
      return explicitReturnTo
    }

    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("acg_editor_return_to")
      if (
        stored &&
        stored.startsWith("/") &&
        !stored.startsWith("/cv-editor") &&
        !stored.startsWith("/editor")
      ) {
        return stored
      }
    }

    return "/resumes"
  }, [explicitReturnTo])

  useEffect(() => {
    if (typeof window === "undefined") return

    if (
      explicitReturnTo &&
      explicitReturnTo.startsWith("/") &&
      !explicitReturnTo.startsWith("/cv-editor") &&
      !explicitReturnTo.startsWith("/editor")
    ) {
      sessionStorage.setItem("acg_editor_return_to", explicitReturnTo)
      return
    }

    if (!document.referrer) return

    try {
      const referrerUrl = new URL(document.referrer)
      const referrerPath = `${referrerUrl.pathname}${referrerUrl.search}`

      if (
        referrerUrl.origin === window.location.origin &&
        !referrerPath.startsWith("/cv-editor") &&
        !referrerPath.startsWith("/editor")
      ) {
        sessionStorage.setItem("acg_editor_return_to", referrerPath)
      }
    } catch {
      // Ignore invalid referrer values.
    }
  }, [explicitReturnTo])
  
  const handleBack = () => {
    if (mobileView === "preview") {
      setMobileView("edit")
      return
    }
    if (activeTab !== "content") {
      setActiveTab("content")
      setActiveSection("target")
      return
    }

    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back()
      return
    }

    router.push(fallbackReturnPath)
  }

  const handleSendMessage = async () => {
    if (!chatInput.trim() || isTyping) return
    const userMessage = chatInput.trim()
    setChatInput("")
    setIsTyping(true)
    try {
      await sendAdvisoryMessage(userMessage)
    } catch (error) {
      console.error("Failed to send advisory message:", error)
    } finally {
      setIsTyping(false)
    }
  }

  if (!resume) return null
  const activeTemplate = getTemplateConfig(resume.templateId)

  const sections = [
     { id: "target", icon: ShieldCheck, label: "Goal" },
     { id: "personal", icon: User, label: "Header" },
     { id: "summary", icon: Sparkles, label: "Summary" },
     { id: "experience", icon: Briefcase, label: "Experience" },
     { id: "volunteer", icon: Heart, label: "Volunteer" },
     { id: "education", icon: GraduationCap, label: "Education" },
     { id: "skills", icon: Wrench, label: "Skills" },
     { id: "projects", icon: Target, label: "Projects" },
     { id: "certifications", icon: Award, label: "Certifications" },
     { id: "languages", icon: Globe, label: "Languages" },
     { id: "interests", icon: Heart, label: "Hobbies" },
     { id: "proofreader", icon: SpellCheck2, label: "Proofread" },
   ]

  const mobileTabs = [
    { id: "content" as const, label: "Content", icon: FileText },
    { id: "ai" as const, label: "Advisor", icon: Sparkles },
    { id: "design" as const, label: "Design", icon: Paintbrush2 },
  ]

  const BottomTabs = () => (
    <div className="pointer-events-none fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-t from-white via-white/95 to-transparent px-3 pb-[calc(env(safe-area-inset-bottom)+0.9rem)] pt-4 sm:px-4">
      <div className="pointer-events-auto mx-auto grid max-w-md grid-cols-3 gap-2">
        {mobileTabs.map((tab) => {
          const isActive = activeTab === tab.id
          const Icon = tab.icon

          return (
            <Button
              key={tab.id}
              type="button"
              variant="ghost"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "h-10 min-w-0 rounded-xl border px-2 text-[8.5px] font-black uppercase tracking-[0.1em] shadow-lg transition-all sm:h-11 sm:px-3 sm:text-[10px]",
                isActive
                  ? "border-slate-900 bg-slate-900 text-white shadow-slate-900/25"
                  : "border-slate-200/80 bg-white/98 text-slate-700 shadow-slate-300/40 hover:bg-white hover:text-slate-900"
              )}
            >
              <Icon
                className={cn(
                  "mr-1 h-3.5 w-3.5 shrink-0",
                  isActive ? "text-sky-300" : "text-slate-500"
                )}
              />
              <span className={cn("truncate", isActive ? "text-white" : "text-slate-700")}>
                {tab.label}
              </span>
            </Button>
          )
        })}
      </div>
    </div>
  )

  return (
    // Use 100dvh (dynamic viewport height) so the iOS Safari URL bar doesn't
    // steal ~75px and cut off the bottom tabs. `h-screen` (=100vh) ignores
    // browser chrome on mobile.
    <div className="flex h-[100dvh] max-h-[100dvh] flex-col overflow-hidden bg-white">
      {/* Header */}
      <header className="fixed top-0 z-40 flex h-14 w-full items-center justify-between border-b border-slate-100 bg-white/95 px-2.5 backdrop-blur-md sm:h-16 sm:px-4">
         <div className="flex min-w-0 flex-1 items-center gap-1.5 pr-1.5">
            <button onClick={handleBack} aria-label="Back" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl p-2 transition-all hover:bg-slate-50">
               <ArrowLeft className="h-5 w-5 text-slate-400" />
            </button>
            <div className="min-w-0 flex flex-col">
               <span className="text-[8px] font-black uppercase leading-none tracking-[0.18em] text-slate-400 min-[370px]:text-[9px]">Smart Editor</span>
               <h1 className="mt-1 truncate text-[12px] font-black leading-none tracking-tight text-slate-900 min-[370px]:text-[13px] sm:text-sm">{resume.name}</h1>
            </div>
         </div>
         <div className="flex shrink-0 items-center gap-1.5">
            <Button
               size="sm"
               variant="outline"
               onClick={() => {
                  setActiveSection("proofreader")
                  setMobileView("edit")
               }}
               className={cn(
                  "flex h-10 items-center gap-1 rounded-xl border px-2 text-[9px] font-black uppercase tracking-[0.08em] shadow-sm min-[390px]:px-3 sm:h-11 sm:text-[10px]",
                  activeSection === "proofreader"
                     ? "border-slate-900 bg-slate-900 text-white"
                     : "border-slate-100 bg-white text-slate-700"
               )}
            >
               <SpellCheck2 className="h-3.5 w-3.5 text-orange-500" />
               <span className="hidden min-[390px]:inline">Proofread</span>
            </Button>

            <Button
               size="sm"
               variant="outline"
               onClick={() => setMobileView(mobileView === "edit" ? "preview" : "edit")}
               className="h-10 rounded-xl border-slate-100 px-2 text-[9px] font-black uppercase tracking-[0.08em] shadow-sm min-[340px]:px-3 sm:h-11 sm:text-[10px]"
            >
               {mobileView === "edit" ? <><Eye className="mr-1 min-[340px]:mr-1.5 h-3.5 w-3.5 text-indigo-500" /> <span className="hidden min-[340px]:inline">Preview</span></> : <><Pencil className="mr-1 min-[340px]:mr-1.5 h-3.5 w-3.5 text-primary" /> <span className="hidden min-[340px]:inline">Edit</span></>}
            </Button>
            <Button
               onClick={handleDownloadPdf}
               disabled={isExporting}
               aria-label="Save PDF"
               className="h-10 w-10 rounded-xl bg-slate-900 p-0 text-white shadow-lg sm:h-11 sm:w-11"
            >
               {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-5 w-5" />}
            </Button>
         </div>
      </header>

      {/* Main Area */}
      <div className="relative mt-14 flex-1 overflow-hidden sm:mt-16">
         <AnimatePresence mode="wait">
            {mobileView === "edit" ? (
               <motion.div 
                 key="edit-view"
                 initial={{ opacity: 0, x: -10 }}
                 animate={{ opacity: 1, x: 0 }}
                 exit={{ opacity: 0, x: -10 }}
                 className="h-full flex flex-col"
               >
                  {activeTab === "content" ? (
                     <div className="flex-1 flex flex-col overflow-hidden">
                        {/* Section Chips */}
                        <div className="no-scrollbar z-30 flex shrink-0 items-center gap-1.5 overflow-x-auto border-b border-slate-100 bg-slate-50/80 px-2.5 py-2 backdrop-blur sm:px-3">
                           {sections.map(section => (
                              <button
                                 key={section.id}
                                 onClick={() => setActiveSection(section.id)}
                                 className={cn(
                                    sectionChipClass,
                                    activeSection === section.id 
                                       ? "bg-slate-900 text-white border-slate-900 shadow-md" 
                                       : "text-slate-500 hover:bg-white hover:border-slate-200"
                                 )}
                              >
                                 <section.icon className="h-3.5 w-3.5 shrink-0" />
                                 <span>{section.label}</span>
                              </button>
                           ))}
                        </div>

                        {/* Form area */}
                        <ScrollArea className="flex-1 w-full px-3.5 pt-4 pb-[calc(env(safe-area-inset-bottom)+8rem)] sm:px-5 sm:pt-6 sm:pb-[calc(env(safe-area-inset-bottom)+8.5rem)]">
                           <div className="w-full max-w-full space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 overflow-hidden">
                              {activeSection === "target" && (
                                <div className="space-y-4">
                                  <div className="flex flex-col gap-2 px-1 min-[360px]:flex-row min-[360px]:items-center min-[360px]:justify-between">
                                    <div className="flex flex-col">
                                       <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 leading-none">Job Target</label>
                                       <span className="text-[9px] font-bold text-slate-300 mt-1 uppercase tracking-tight">Paste JD to scan match score</span>
                                    </div>
                                    {jobDescription && (
                                      <Button 
                                        variant="outline" 
                                        size="sm" 
                                        onClick={runAtsCheck} 
                                        disabled={isEnhancing}
                                        className="h-8 rounded-full border-primary/20 bg-primary/5 px-3 text-[10px] font-black uppercase tracking-wider text-primary min-[360px]:self-auto self-start"
                                      >
                                        {isEnhancing ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <ShieldCheck className="mr-2 h-3 w-3" />}
                                        Run Scan
                                      </Button>
                                    )}
                                  </div>
                                  <Textarea
                                    placeholder="Paste job description here..."
                                    value={jobDescription}
                                    onChange={(e) => setJobDescription(e.target.value)}
                                    className="min-h-[160px] rounded-2xl bg-white border-slate-100 shadow-sm text-sm p-4 leading-relaxed focus:border-primary/30 transition-all"
                                  />
                                  
                                  {atsResult && (
                                    <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 shadow-sm space-y-5 animate-in fade-in slide-in-from-top-4">
                                       <div className="flex items-center gap-4">
                                          <div className="h-14 w-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center font-black text-primary text-xl shadow-inner">
                                             {Math.round(atsResult.totalScore)}%
                                          </div>
                                          <div className="flex-1">
                                             <h4 className="text-xs font-black uppercase tracking-tight text-slate-800 leading-tight">{atsResult.headline}</h4>
                                             <p className="text-[10px] text-slate-500 mt-1 leading-relaxed line-clamp-2">{atsResult.matchSummary}</p>
                                          </div>
                                       </div>
                                       
                                       <div className="space-y-4">
                                         <div className="space-y-2">
                                           <div className="flex items-center gap-1.2 px-1">
                                             <AlertCircle className="h-3 w-3 text-amber-500 mr-2" />
                                             <span className="text-[9px] font-black uppercase tracking-wider text-amber-600">Keyword Gaps</span>
                                           </div>
                                           <div className="flex flex-wrap gap-1.5">
                                              {atsResult.missingKeywords.slice(0, 8).map((k: string) => (
                                                 <Badge key={k} variant="outline" className="bg-white text-[9px] font-bold text-amber-600 border-amber-100 px-2 py-0.5">{k}</Badge>
                                              ))}
                                              {atsResult.missingKeywords.length > 8 && <span className="text-[9px] font-bold text-slate-400">+{atsResult.missingKeywords.length - 8}</span>}
                                           </div>
                                         </div>

                                         <div className="space-y-2">
                                           <div className="flex items-center gap-1.2 px-1">
                                             <Trophy className="h-3 w-3 text-primary mr-2" />
                                             <span className="text-[9px] font-black uppercase tracking-wider text-slate-500">Fix Actions</span>
                                           </div>
                                           <div className="space-y-2">
                                             {atsResult.recommendations.slice(0, 2).map((rec: { title: string; description: string }, i: number) => (
                                               <div key={i} className="p-3 rounded-xl bg-white border border-slate-100 shadow-tiny">
                                                 <h5 className="text-[10px] font-black uppercase tracking-tight text-slate-800">{rec.title}</h5>
                                                 <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">{rec.description}</p>
                                               </div>
                                             ))}
                                           </div>
                                         </div>
                                       </div>
                                    </div>
                                  )}
                                  
                                  <div className="pt-4 border-t border-slate-50">
                                     <Card className="p-5 rounded-2xl bg-indigo-50 border-indigo-100 shadow-sm relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 p-8 bg-indigo-500/5 rounded-full -mr-4 -mt-4 group-hover:bg-indigo-500/10 transition-all" />
                                        <h3 className="text-[10px] font-black uppercase tracking-widest text-indigo-600 relative z-10">AI Optimization</h3>
                                        <p className="text-[11px] text-slate-600 mt-2 leading-relaxed font-medium relative z-10">Your resume content is automatically synced with the scanner for real-time improvements.</p>
                                     </Card>
                                  </div>
                                </div>
                              )}

                              {activeSection === "personal" && (
                                <div className="space-y-6">
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
                                  <div className="grid grid-cols-1 gap-5">
                                    <div className="space-y-2">
                                       <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-1">Full Name</label>
                                       <TitleInput
                                          value={resume.content.personal.name}
                                          onChange={(e) => handleUpdate("content.personal.name", e.target.value)}
                                          className="h-14 rounded-2xl border-slate-100 bg-white font-bold text-slate-900 shadow-sm"
                                       />
                                    </div>
                                    <div className="space-y-2">
                                       <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-1">Target Title</label>
                                       <TitleInput
                                          value={resume.content.personal.title}
                                          onChange={(e) => handleUpdate("content.personal.title", e.target.value)}
                                          className="h-14 rounded-2xl border-slate-100 bg-white font-bold text-slate-900 shadow-sm"
                                       />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                       <div className="space-y-2">
                                          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-1">Email</label>
                                          <Input 
                                             value={resume.content.personal.email} 
                                             onChange={(e) => handleUpdate("content.personal.email", e.target.value)}
                                             className="h-12 rounded-2xl border-slate-100 bg-white text-sm font-medium"
                                          />
                                       </div>
                                       <div className="space-y-2">
                                          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-1">Phone</label>
                                          <Input 
                                             value={resume.content.personal.phone} 
                                             onChange={(e) => handleUpdate("content.personal.phone", e.target.value)}
                                             className="h-12 rounded-2xl border-slate-100 bg-white text-sm font-medium"
                                          />
                                       </div>
                                    </div>
                                    <div className="space-y-2">
                                       <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-1">Location</label>
                                       <Input 
                                          value={resume.content.personal.location} 
                                          onChange={(e) => handleUpdate("content.personal.location", e.target.value)}
                                          className="h-12 rounded-2xl border-slate-100 bg-white text-sm font-medium"
                                       />
                                    </div>
                                    <div className="space-y-2">
                                       <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-1">Website / LinkedIn</label>
                                       <Input 
                                          value={resume.content.personal.website} 
                                          onChange={(e) => handleUpdate("content.personal.website", e.target.value)}
                                          className="h-12 rounded-2xl border-slate-100 bg-white text-sm font-medium"
                                       />
                                    </div>
                                  </div>
                                </div>
                              )}

                              {activeSection === "summary" && (
                                <div className="space-y-6 w-full overflow-hidden">
                                  <div className="flex flex-col gap-3 px-1 min-[360px]:flex-row min-[360px]:items-center min-[360px]:justify-between w-full">
                                    <div className="flex flex-col min-w-0 flex-1">
                                       <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 truncate">Professional Summary</label>
                                       <span className="text-[9px] font-bold text-slate-300 mt-1 uppercase tracking-tight truncate">Highlight your expertise</span>
                                    </div>
                                    <Button 
                                       size="sm"
                                       onClick={() => runSummarySuggestions(summaryStyle)}
                                       disabled={isGeneratingSummarySuggestions}
                                       className="h-9 self-start rounded-xl bg-primary px-4 text-[10px] font-black uppercase tracking-wider text-white min-[360px]:self-auto"
                                    >
                                       {isGeneratingSummarySuggestions ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <Sparkles className="h-3 w-3 mr-2" />}
                                       Generate AI
                                    </Button>
                                  </div>
                                  <RichTextField
                                    value={resume.content.summary}
                                    onChange={(val) => handleUpdate("content.summary", val)}
                                    placeholder="Write a compelling summary..."
                                    minHeightClassName="min-h-[220px]"
                                  />
                                  {summarySuggestions && summarySuggestions.length > 0 && (
                                    <div className="mt-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-500">
                                      <div className="flex items-center gap-2 mb-2">
                                        <div className="h-px flex-1 bg-slate-100" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Review Suggestions</span>
                                        <div className="h-px flex-1 bg-slate-100" />
                                      </div>
                                      {summarySuggestions.map((suggestion: any, idx: number) => {
                                        const text = typeof suggestion === 'string' ? suggestion : suggestion.summary;
                                        const style = typeof suggestion === 'object' ? suggestion.style : null;

                                        return (
                                          <div key={idx} className="group relative rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                                            {style && (
                                              <div className="mb-2 inline-block px-2 py-0.5 rounded-full bg-slate-50 text-[8px] font-black text-slate-400 uppercase tracking-wider border border-slate-100">
                                                {style}
                                              </div>
                                            )}
                                            <p className="text-[11px] leading-relaxed text-slate-600 mb-3 italic">
                                              "{text}"
                                            </p>
                                            <Button 
                                              size="sm"
                                              onClick={() => {
                                                handleUpdate("content.summary", plainTextToRichTextHtml(text))
                                                setSummarySuggestions([])
                                              }}
                                              className="w-full h-8 rounded-lg bg-orange-600 hover:bg-orange-700 text-[10px] font-bold uppercase tracking-wider transition-colors border-none text-white"
                                            >
                                              Apply this version
                                            </Button>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              )}

                              {activeSection === "experience" && (
                                <div className="space-y-6 w-full overflow-hidden">
                                   <div className="flex flex-col gap-3 px-1 min-[360px]:flex-row min-[360px]:items-center min-[360px]:justify-between w-full">
                                      <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 truncate flex-1 min-w-0">Professional Journey</h3>
                                      <Button 
                                         onClick={() => {
                                            const next = [{ id: Date.now(), company: "", title: "", period: "", description: "" }, ...(resume.content.experience || [])]
                                            handleUpdate("content.experience", next)
                                         }}
                                         className="h-9 self-start rounded-xl bg-slate-900 px-4 text-[10px] font-black uppercase tracking-wider text-white min-[360px]:self-auto"
                                      >
                                         <Plus className="h-3.5 w-3.5 mr-2" /> Add Experience
                                      </Button>
                                   </div>
                                   
                                   {/* Role Intelligence Playbook */}
                                   {experiencePlaybook && (
                                     <div className="rounded-3xl border border-orange-100 bg-orange-50/40 p-5 space-y-3">
                                       <div className="flex items-start justify-between gap-3">
                                         <div>
                                           <p className="text-[9px] font-black uppercase tracking-[0.2em] text-orange-500">Role intelligence</p>
                                           <h4 className="mt-1 text-sm font-bold text-slate-900 leading-tight">{experiencePlaybook.headline}</h4>
                                         </div>
                                         <Badge className="rounded-full bg-white px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-slate-500 border-slate-100 shadow-sm">
                                           {experiencePlaybook.family}
                                         </Badge>
                                       </div>
                                       <div className="flex flex-wrap gap-1.5">
                                         {experiencePlaybook.keywords.slice(0, 5).map((keyword) => (
                                           <span
                                             key={keyword}
                                             className="rounded-lg bg-white/80 px-2 py-1 text-[9px] font-bold text-orange-600 border border-orange-100"
                                           >
                                             {keyword}
                                           </span>
                                         ))}
                                       </div>
                                       <p className="text-[10px] leading-relaxed text-slate-500 italic">
                                         Ideal Bullet Pattern: {experiencePlaybook.bulletPatterns[0]}
                                       </p>
                                     </div>
                                   )}

                                   <div className="space-y-6">
                                      {resume.content.experience?.map((exp: any, idx: number) => (
                                         <div key={exp.id || idx} className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm space-y-4">
                                            <div className="flex items-start justify-between gap-3">
                                               <div className="flex-1 space-y-3 min-w-0">
                                                  <TitleInput
                                                     value={exp.title}
                                                     onChange={(e) => {
                                                        const next = [...resume.content.experience]
                                                        next[idx] = { ...next[idx], title: e.target.value }
                                                        handleUpdate("content.experience", next)
                                                     }}
                                                     placeholder="Job Title (e.g. Senior Developer)"
                                                     className="h-10 rounded-xl border-slate-50 font-bold text-sm"
                                                  />
                                                  <TitleInput
                                                     value={exp.company}
                                                     onChange={(e) => {
                                                        const next = [...resume.content.experience]
                                                        next[idx] = { ...next[idx], company: e.target.value }
                                                        handleUpdate("content.experience", next)
                                                     }}
                                                     placeholder="Company Name"
                                                     className="h-10 rounded-xl border-slate-50 font-medium text-xs text-slate-600"
                                                  />
                                                  <Input 
                                                     value={exp.period} 
                                                     onChange={(e) => {
                                                        const next = [...resume.content.experience]
                                                        next[idx] = { ...next[idx], period: e.target.value }
                                                        handleUpdate("content.experience", next)
                                                     }}
                                                     placeholder="Period (e.g. 2021 - Present)"
                                                     className="h-10 rounded-xl border-slate-50 font-medium text-[11px] text-slate-400"
                                                  />
                                               </div>
                                               <div className="flex flex-col gap-2">
                                                  <Button 
                                                     variant="ghost" 
                                                     size="icon" 
                                                     onClick={() => {
                                                        const next = resume.content.experience.filter((_: any, i: number) => i !== idx)
                                                        handleUpdate("content.experience", next)
                                                     }}
                                                     className="h-9 w-9 rounded-xl text-slate-300 hover:text-red-500 hover:bg-red-50"
                                                  >
                                                     <Trash2 className="h-4 w-4" />
                                                  </Button>
                                                  <Button 
                                                     variant="outline"
                                                     size="icon" 
                                                     type="button"
                                                     onClick={() => {
                                                        const next = reorderItems(resume.content.experience, idx, idx - 1)
                                                        handleUpdate("content.experience", next)
                                                     }}
                                                     disabled={idx === 0}
                                                     className="h-9 w-9 rounded-xl border-slate-100 bg-white text-slate-500 hover:bg-slate-50 shadow-sm disabled:opacity-40"
                                                  >
                                                     <ChevronUp className="h-4 w-4" />
                                                  </Button>
                                                  <Button
                                                     variant="outline"
                                                     size="icon"
                                                     type="button"
                                                     onClick={() => {
                                                        const next = reorderItems(resume.content.experience, idx, idx + 1)
                                                        handleUpdate("content.experience", next)
                                                     }}
                                                     disabled={idx === (resume.content.experience?.length || 0) - 1}
                                                     className="h-9 w-9 rounded-xl border-slate-100 bg-white text-slate-500 hover:bg-slate-50 shadow-sm disabled:opacity-40"
                                                  >
                                                     <ChevronDown className="h-4 w-4" />
                                                  </Button>
                                                  <Popover
                                                     open={idx === 0 && showAiBulletHint && !roleBulletSuggestions}
                                                     onOpenChange={setShowAiBulletHint}
                                                  >
                                                     <PopoverTrigger asChild>
                                                        <Button 
                                                           variant="outline" 
                                                           size="icon" 
                                                           onClick={() => {
                                                              setShowAiBulletHint(false)
                                                              runSuggestRoleBullets(idx)
                                                           }}
                                                           disabled={isSuggestingRoleBullets === idx || !exp.title}
                                                           className="h-9 w-9 rounded-xl border-orange-100 bg-orange-50/30 text-orange-500 hover:bg-orange-50 shadow-sm"
                                                        >
                                                           {isSuggestingRoleBullets === idx ? (
                                                             <Loader2 className="h-4 w-4 animate-spin" />
                                                           ) : (
                                                             <ListPlus className="h-4 w-4" />
                                                           )}
                                                        </Button>
                                                     </PopoverTrigger>
                                                     <PopoverContent
                                                        side="left"
                                                        align="center"
                                                        sideOffset={10}
                                                        className="w-40 rounded-2xl border-orange-100 bg-white/98 p-3 text-[10px] font-bold leading-relaxed text-slate-700 shadow-[0_18px_40px_-24px_rgba(15,23,42,0.35)]"
                                                     >
                                                        Try AI bullet suggestions for faster role-tailored bullets.
                                                     </PopoverContent>
                                                  </Popover>
                                               </div>
                                            </div>
                                            <RichTextField
                                               value={exp.description}
                                               onChange={(val) => {
                                                  const next = [...resume.content.experience]
                                                  next[idx] = { ...next[idx], description: val }
                                                  handleUpdate("content.experience", next)
                                               }}
                                               placeholder="Impact & responsibility..."
                                               minHeightClassName="min-h-[140px]"
                                            />
                                            {roleBulletSuggestions?.index === idx && (
                                              <MobileRoleBulletSelector
                                                roleBulletSuggestions={roleBulletSuggestions}
                                                onApply={(selectedBullets) => applyRoleBulletSuggestions(selectedBullets)}
                                                onDismiss={dismissRoleBulletSuggestions}
                                                onRegenerate={() => runSuggestRoleBullets(idx)}
                                              />
                                            )}
                                         </div>
                                      ))}
                                   </div>
                                </div>
                              )}

                              {activeSection === "education" && (
                                <div className="space-y-6">
                                   <div className="flex flex-col gap-2 px-1 min-[360px]:flex-row min-[360px]:items-center min-[360px]:justify-between">
                                      <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Academic Background</h3>
                                      <Button 
                                         onClick={() => {
                                            const next = [{ id: Date.now(), school: "", degree: "", period: "", location: "" }, ...(resume.content.education || [])]
                                            handleUpdate("content.education", next)
                                         }}
                                         className="h-9 self-start rounded-xl bg-slate-900 px-4 text-[10px] font-black uppercase tracking-wider text-white min-[360px]:self-auto"
                                      >
                                         <Plus className="h-3 w-3 mr-2" /> New Degree
                                      </Button>
                                   </div>
                                   <div className="space-y-6">
                                      {resume.content.education?.map((edu: any, idx: number) => (
                                         <div key={edu.id || idx} className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm space-y-4">
                                            <div className="flex items-start justify-between gap-3">
                                               <div className="flex-1 space-y-3 min-w-0">
                                                  <TitleInput
                                                     value={edu.degree}
                                                     onChange={(e) => {
                                                        const next = [...resume.content.education]
                                                        next[idx] = { ...next[idx], degree: e.target.value }
                                                        handleUpdate("content.education", next)
                                                     }}
                                                     placeholder="Degree (e.g. B.Sc. Computer Science)"
                                                     className="h-10 rounded-xl border-slate-50 font-bold text-sm"
                                                  />
                                                  <TitleInput
                                                     value={edu.school}
                                                     onChange={(e) => {
                                                        const next = [...resume.content.education]
                                                        next[idx] = { ...next[idx], school: e.target.value }
                                                        handleUpdate("content.education", next)
                                                     }}
                                                     placeholder="University/School"
                                                     className="h-10 rounded-xl border-slate-50 font-medium text-xs text-slate-600"
                                                  />
                                                  <Input 
                                                     value={edu.period} 
                                                     onChange={(e) => {
                                                        const next = [...resume.content.education]
                                                        next[idx] = { ...next[idx], period: e.target.value }
                                                        handleUpdate("content.education", next)
                                                     }}
                                                     placeholder="Timeline (e.g. 2017 - 2021)"
                                                     className="h-10 rounded-xl border-slate-50 font-medium text-[11px] text-slate-400"
                                                  />
                                               </div>
                                               <Button 
                                                  variant="ghost" 
                                                  size="icon" 
                                                  onClick={() => {
                                                     const next = resume.content.education.filter((_: any, i: number) => i !== idx)
                                                     handleUpdate("content.education", next)
                                                  }}
                                                  className="h-9 w-9 rounded-xl text-slate-300 hover:text-red-500 hover:bg-red-50"
                                               >
                                                  <Trash2 className="h-4 w-4" />
                                               </Button>
                                               <Button
                                                  variant="outline"
                                                  size="icon"
                                                  type="button"
                                                  onClick={() => {
                                                     const next = reorderItems(resume.content.education, idx, idx - 1)
                                                     handleUpdate("content.education", next)
                                                  }}
                                                  disabled={idx === 0}
                                                  className="h-9 w-9 rounded-xl border-slate-100 bg-white text-slate-500 hover:bg-slate-50 shadow-sm disabled:opacity-40"
                                               >
                                                  <ChevronUp className="h-4 w-4" />
                                               </Button>
                                               <Button
                                                  variant="outline"
                                                  size="icon"
                                                  type="button"
                                                  onClick={() => {
                                                     const next = reorderItems(resume.content.education, idx, idx + 1)
                                                     handleUpdate("content.education", next)
                                                  }}
                                                  disabled={idx === (resume.content.education?.length || 0) - 1}
                                                  className="h-9 w-9 rounded-xl border-slate-100 bg-white text-slate-500 hover:bg-slate-50 shadow-sm disabled:opacity-40"
                                               >
                                                  <ChevronDown className="h-4 w-4" />
                                               </Button>
                                            </div>
                                         </div>
                                      ))}
                                   </div>
                                </div>
                              )}

                              {activeSection === "skills" && (
                                <div className="space-y-6">
                                   <div className="flex flex-col gap-2 px-1">
                                      <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Core Expertise</h3>
                                      <p className="text-[11px] font-medium text-slate-700 leading-relaxed">Enter skills followed by [Enter] to build your tech stack.</p>
                                   </div>
                                   <div className="p-5 rounded-3xl border border-slate-100 bg-white shadow-sm space-y-5">
                                      <Input 
                                        placeholder="Add Skill (e.g. Python)"
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') {
                                            const val = e.currentTarget.value.trim()
                                            if (val && !resume.content.skills.includes(val)) {
                                              handleUpdate("content.skills", [...resume.content.skills, val])
                                              e.currentTarget.value = ""
                                            }
                                          }
                                        }}
                                        className="h-12 rounded-xl bg-slate-50 border-slate-100 font-bold text-sm"
                                      />
                                      <div className="flex flex-wrap gap-2">
                                         {resume.content.skills?.map((skill: string, i: number) => (
                                            <Badge key={i} variant="secondary" className="px-3 py-1.5 rounded-lg bg-slate-100 text-[10px] font-bold text-slate-600 gap-2 border-transparent">
                                               {skill}
                                               <button onClick={() => handleUpdate("content.skills", resume.content.skills.filter((_: any, idx: number) => idx !== i))}>
                                                  <Plus className="h-3 w-3 rotate-45 text-slate-400" />
                                               </button>
                                            </Badge>
                                         ))}
                                      </div>
                                      
                                      <Button 
                                        variant="outline" 
                                        onClick={runSkillSuggestions}
                                        disabled={isSuggestingSkills}
                                        className="w-full gap-2 rounded-xl h-11 border-primary/20 bg-primary/5 text-primary text-[10px] font-black uppercase tracking-widest"
                                      >
                                        {isSuggestingSkills ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                                        AI Suggestions
                                      </Button>

                                      {skillSuggestions.length > 0 && (
                                        <div className="pt-2 flex flex-wrap gap-2">
                                          {skillSuggestions.map((skill: string, idx: number) => (
                                            <Badge 
                                              key={idx} 
                                              variant="outline" 
                                              onClick={() => {
                                                if (!resume.content.skills.includes(skill)) {
                                                  handleUpdate("content.skills", [...resume.content.skills, skill])
                                                }
                                                setSkillSuggestions((prev: string[]) => prev.filter((s: string) => s !== skill))
                                              }}
                                              className="px-3 py-1.5 rounded-lg border-indigo-100 bg-indigo-50/30 text-indigo-600 font-bold text-[9px] cursor-pointer hover:bg-indigo-50"
                                            >
                                              <Plus className="h-2.5 w-2.5 mr-1" /> {skill}
                                            </Badge>
                                          ))}
                                        </div>
                                      )}
                                   </div>
                                </div>
                              )}

                              {activeSection === "projects" && (
                                <div className="space-y-6 w-full overflow-hidden">
                                   <div className="flex flex-col gap-3 px-1 min-[360px]:flex-row min-[360px]:items-center min-[360px]:justify-between w-full">
                                      <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 truncate flex-1 min-w-0">Personal Projects</h3>
                                      <Button 
                                         onClick={() => {
                                            const next = [{ id: Date.now(), name: "", url: "", period: "", description: "" }, ...(resume.content.projects || [])]
                                            handleUpdate("content.projects", next)
                                         }}
                                         className="h-9 self-start rounded-xl bg-slate-900 px-4 text-[10px] font-black uppercase tracking-wider text-white min-[360px]:self-auto"
                                      >
                                         <Plus className="h-4 w-4 mr-2" /> Add Project
                                      </Button>
                                   </div>
                                   <div className="space-y-6">
                                      {resume.content.projects?.map((proj: any, idx: number) => (
                                         <div key={proj.id || idx} className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm space-y-4">
                                            <div className="flex items-start justify-between gap-3">
                                               <div className="flex-1 space-y-3">
                                                  <TitleInput
                                                     value={proj.name}
                                                     onChange={(e) => {
                                                        const next = [...resume.content.projects]
                                                        next[idx] = { ...next[idx], name: e.target.value }
                                                        handleUpdate("content.projects", next)
                                                     }}
                                                     placeholder="Project Name"
                                                     className="h-10 rounded-xl border-slate-50 font-bold text-sm"
                                                  />
                                                  <Input 
                                                     value={proj.url} 
                                                     onChange={(e) => {
                                                        const next = [...resume.content.projects]
                                                        next[idx] = { ...next[idx], url: e.target.value }
                                                        handleUpdate("content.projects", next)
                                                     }}
                                                     placeholder="Project Link"
                                                     className="h-10 rounded-xl border-slate-50 font-medium text-xs text-slate-600"
                                                  />
                                               </div>
                                               <Button 
                                                  variant="ghost" 
                                                  size="icon" 
                                                  onClick={() => {
                                                     const next = resume.content.projects.filter((_: any, i: number) => i !== idx)
                                                     handleUpdate("content.projects", next)
                                                  }}
                                                  className="h-9 w-9 rounded-xl text-slate-300 hover:text-red-500 hover:bg-red-50"
                                               >
                                                  <Trash2 className="h-4 w-4" />
                                               </Button>
                                            </div>
                                            <RichTextField
                                               value={proj.description}
                                               onChange={(val) => {
                                                  const next = [...resume.content.projects]
                                                  next[idx] = { ...next[idx], description: val }
                                                  handleUpdate("content.projects", next)
                                               }}
                                               placeholder="Impact of this project..."
                                               minHeightClassName="min-h-[120px]"
                                            />
                                         </div>
                                      ))}
                                   </div>
                                </div>
                              )}

                              {activeSection === "certifications" && (
                                <div className="space-y-6">
                                   <div className="flex flex-col gap-2 px-1 min-[360px]:flex-row min-[360px]:items-center min-[360px]:justify-between">
                                      <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Accomplishments</h3>
                                      <Button 
                                         onClick={() => {
                                            const next = [{ id: Date.now(), name: "", issuer: "", date: "" }, ...(resume.content.certifications || [])]
                                            handleUpdate("content.certifications", next)
                                         }}
                                         className="h-9 self-start rounded-xl bg-slate-900 px-4 text-[10px] font-black uppercase tracking-wider text-white min-[360px]:self-auto"
                                      >
                                         <Plus className="h-4 w-4 mr-2" /> Add Certification
                                      </Button>
                                   </div>
                                   <div className="space-y-4">
                                      {resume.content.certifications?.map((cert: any, idx: number) => (
                                         <div key={cert.id || idx} className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm space-y-3">
                                            <div className="flex items-start justify-between gap-3">
                                               <div className="flex-1 space-y-3">
                                                  <TitleInput
                                                     value={cert.name}
                                                     onChange={(e) => {
                                                        const next = [...resume.content.certifications]
                                                        next[idx] = { ...next[idx], name: e.target.value }
                                                        handleUpdate("content.certifications", next)
                                                     }}
                                                     placeholder="Certification"
                                                     className="h-10 rounded-xl border-slate-50 font-bold text-sm"
                                                  />
                                                  <TitleInput
                                                     value={cert.issuer}
                                                     onChange={(e) => {
                                                        const next = [...resume.content.certifications]
                                                        next[idx] = { ...next[idx], issuer: e.target.value }
                                                        handleUpdate("content.certifications", next)
                                                     }}
                                                     placeholder="Issuer"
                                                     className="h-10 rounded-xl border-slate-50 text-xs"
                                                  />
                                               </div>
                                               <Button 
                                                  variant="ghost" 
                                                  size="icon" 
                                                  onClick={() => {
                                                     const next = resume.content.certifications.filter((_: any, i: number) => i !== idx)
                                                     handleUpdate("content.certifications", next)
                                                  }}
                                                  className="h-9 w-9 text-slate-300"
                                               >
                                                  <Trash2 className="h-4 w-4" />
                                               </Button>
                                            </div>
                                         </div>
                                      ))}
                                   </div>
                                </div>
                              )}

                               {activeSection === "languages" && (
                                <div className="space-y-6">
                                   <div className="flex flex-col gap-2 px-1 min-[360px]:flex-row min-[360px]:items-center min-[360px]:justify-between">
                                      <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Communication</h3>
                                      <Button 
                                         onClick={() => {
                                            const next = [{ name: "", level: "" }, ...(resume.content.languages || [])]
                                            handleUpdate("content.languages", next)
                                         }}
                                         className="h-9 self-start rounded-xl bg-slate-900 px-4 text-[10px] font-black uppercase tracking-wider text-white min-[360px]:self-auto"
                                      >
                                         <Plus className="h-3 w-3 mr-2" /> Add Language
                                      </Button>
                                   </div>
                                   <div className="grid grid-cols-1 gap-3">
                                      {resume.content.languages?.map((lang: any, idx: number) => (
                                         <div key={idx} className="rounded-2xl border border-slate-100 bg-white p-4 flex items-center gap-4 justify-between">
                                            <div className="flex-1 grid grid-cols-2 gap-3">
                                               <Input 
                                                  value={lang.name} 
                                                  onChange={(e) => {
                                                     const next = [...resume.content.languages]
                                                     next[idx] = { ...next[idx], name: e.target.value }
                                                     handleUpdate("content.languages", next)
                                                  }}
                                                  placeholder="Language"
                                                  className="h-9 border-none bg-transparent font-bold text-sm px-0 focus-visible:ring-0"
                                               />
                                               <Input 
                                                  value={lang.level} 
                                                  onChange={(e) => {
                                                     const next = [...resume.content.languages]
                                                     next[idx] = { ...next[idx], level: e.target.value }
                                                     handleUpdate("content.languages", next)
                                                  }}
                                                  placeholder="Level"
                                                  className="h-9 border-none bg-transparent text-[11px] text-slate-400 px-0 focus-visible:ring-0"
                                               />
                                            </div>
                                            <Button 
                                               variant="ghost" 
                                               size="icon" 
                                               onClick={() => {
                                                  const next = resume.content.languages.filter((_: any, i: number) => i !== idx)
                                                  handleUpdate("content.languages", next)
                                               }}
                                               className="h-8 w-8 text-slate-200"
                                            >
                                               <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                         </div>
                                      ))}
                                   </div>
                               </div>
                               )}

                               {activeSection === "interests" && (
                                <div className="space-y-6">
                                  <div className="flex flex-col gap-3 px-1 min-[380px]:flex-row min-[380px]:items-center min-[380px]:justify-between">
                                    <div className="min-w-0">
                                      <h3 className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Hobbies & Interests</h3>
                                      <p className="mt-1 text-[11px] font-semibold leading-relaxed text-slate-500">Match the desktop editor with list or paragraph formats.</p>
                                    </div>
                                    <Popover
                                      onOpenChange={(open) => {
                                        if (open && (interestSuggestions?.length || 0) === 0) {
                                          runInterestSuggestions?.()
                                        }
                                      }}
                                    >
                                      <PopoverTrigger asChild>
                                        <Button
                                          onClick={() => runInterestSuggestions?.()}
                                          disabled={isSuggestingInterests}
                                          className="h-9 self-start rounded-xl bg-orange-500 px-3 text-[9px] font-black uppercase tracking-[0.1em] text-white shadow-lg shadow-orange-500/15 hover:bg-orange-600 min-[380px]:self-auto"
                                          size="sm"
                                        >
                                          {isSuggestingInterests ? (
                                            <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                                          ) : (
                                            <Sparkles className="mr-2 h-3.5 w-3.5" />
                                          )}
                                          AI Ideas
                                        </Button>
                                      </PopoverTrigger>
                                      <PopoverContent align="end" className="w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border-slate-200 p-0 shadow-xl">
                                        <div className="bg-slate-950 p-4 text-white">
                                          <h4 className="text-sm font-black tracking-tight">Hobby Suggestions</h4>
                                          <p className="mt-1 text-[11px] leading-relaxed text-slate-300">Tap a suggestion to add it to the selected format.</p>
                                        </div>
                                        <div className="max-h-[18rem] space-y-2 overflow-y-auto bg-white p-3">
                                          {isSuggestingInterests ? (
                                            <div className="flex items-center justify-center gap-3 py-8 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                                              <Loader2 className="h-4 w-4 animate-spin text-orange-500" />
                                              Building ideas
                                            </div>
                                          ) : (interestSuggestions || []).length > 0 ? (
                                            interestSuggestions.map((interest: string, idx: number) => (
                                              <button
                                                key={`${interest}-${idx}`}
                                                type="button"
                                                onClick={() => {
                                                  if (interestsVariant === "list") {
                                                    const current = resume.content.interests || []
                                                    if (!current.includes(interest)) {
                                                      handleUpdate("content.interests", [...current, interest])
                                                    }
                                                  } else {
                                                    const current = resume.content.interestsContent || ""
                                                    const divider = current.length > 0 ? "\n" : ""
                                                    handleUpdate("content.interestsContent", current + divider + interest)
                                                  }
                                                  setInterestSuggestions?.((interestSuggestions || []).filter((_: any, i: number) => i !== idx))
                                                }}
                                                className="flex w-full items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-3 text-left transition-all hover:border-orange-200 hover:bg-white"
                                              >
                                                <span className="text-xs font-bold leading-relaxed text-slate-700">{interest}</span>
                                                <Plus className="h-3.5 w-3.5 shrink-0 text-orange-500" />
                                              </button>
                                            ))
                                          ) : (
                                            <div className="py-8 text-center text-xs font-semibold text-slate-400">
                                              No suggestions yet.
                                            </div>
                                          )}
                                        </div>
                                        <div className="border-t border-slate-100 bg-slate-50 p-3 text-right">
                                          <Button variant="ghost" size="sm" onClick={() => runInterestSuggestions?.()} className="h-8 text-[10px] font-black uppercase text-orange-600 hover:bg-orange-50">
                                            Regenerate
                                          </Button>
                                        </div>
                                      </PopoverContent>
                                    </Popover>
                                  </div>

                                  <div className="grid grid-cols-2 gap-2 rounded-2xl border border-slate-100 bg-slate-50 p-1">
                                    {[
                                      { value: "list", label: "Bullets" },
                                      { value: "text", label: "Text Box" },
                                    ].map((option) => (
                                      <button
                                        key={option.value}
                                        type="button"
                                        onClick={() => handleUpdate("content.interestsVariant", option.value)}
                                        className={cn(
                                          "h-10 rounded-xl text-[10px] font-black uppercase tracking-[0.14em] transition-all",
                                          interestsVariant === option.value
                                            ? "bg-white text-slate-900 shadow-sm"
                                            : "text-slate-500 hover:text-slate-900"
                                        )}
                                      >
                                        {option.label}
                                      </button>
                                    ))}
                                  </div>

                                  {interestsVariant === "list" ? (
                                    <div className="space-y-4">
                                      <div className="flex justify-end px-1">
                                        <Button
                                          onClick={() => {
                                            const next = [...(resume.content.interests || []), ""]
                                            handleUpdate("content.interests", next)
                                          }}
                                          className="h-9 rounded-xl bg-slate-900 px-4 text-[10px] font-black uppercase tracking-wider text-white"
                                          size="sm"
                                        >
                                          <Plus className="mr-2 h-3.5 w-3.5" />
                                          Add Hobby
                                        </Button>
                                      </div>
                                      <div className="grid grid-cols-1 gap-3">
                                        {(resume.content.interests || []).map((interest: string, idx: number) => (
                                          <div key={idx} className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-3 shadow-sm">
                                            <Input
                                              value={interest}
                                              onChange={(e) => {
                                                const next = [...(resume.content.interests || [])]
                                                next[idx] = e.target.value
                                                handleUpdate("content.interests", next)
                                              }}
                                              placeholder="e.g. Strategy gaming"
                                              className="h-9 border-none bg-transparent px-0 text-sm font-bold text-slate-700 shadow-none focus-visible:ring-0"
                                            />
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              onClick={() => {
                                                const next = (resume.content.interests || []).filter((_: any, i: number) => i !== idx)
                                                handleUpdate("content.interests", next)
                                              }}
                                              className="h-8 w-8 shrink-0 rounded-xl text-slate-300 hover:bg-red-50 hover:text-red-500"
                                            >
                                              <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  ) : (
                                    <RichTextField
                                      value={resume.content.interestsContent || ""}
                                      onChange={(val) => handleUpdate("content.interestsContent", val)}
                                      placeholder="Type your hobbies and interests here as a paragraph..."
                                      minHeightClassName="min-h-[180px]"
                                    />
                                  )}
                                </div>
                               )}

                               {activeSection === "proofreader" && (
                                 <div className="space-y-6">
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 px-1">Global Proofreader</h3>
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
                                       }}
                                    />
                                 </div>
                               )}
                            </div>
                         </ScrollArea>
                     </div>
                  ) : activeTab === "ai" ? (
                     <div className="flex-1 flex flex-col overflow-hidden bg-slate-50/30">
                        {/* AI Intelligence Dashboard for Mobile */}
                        <div className="flex-1 flex flex-col relative">
                           <div className="p-6 shrink-0">
                              <h2 className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Intelligence Matrix</h2>
                              <div className="flex items-center gap-2 mt-2">
                                 <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                 <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest leading-none">Global Network Active</p>
                              </div>
                           </div>

                           <ScrollArea className="flex-1 px-6">
                              <div className="space-y-4 pb-40">
                                 {routingLogs.length === 0 ? (
                                    <div className="py-20 text-center space-y-4">
                                       <div className="h-20 w-20 rounded-[2.5rem] bg-white border border-slate-100 shadow-xl flex items-center justify-center mx-auto mb-6 transform rotate-6 scale-95 opacity-50">
                                          <Cpu className="h-8 w-8 text-slate-300" />
                                       </div>
                                       <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] max-w-xs mx-auto">
                                          Your Career Intelligence agents are currently observing your inputs. 
                                          <span className="block mt-4 text-[9px] font-bold text-slate-400/60 lowercase italic">Trigger AI assistance to view logs...</span>
                                       </p>
                                    </div>
                                 ) : (
                                    [...routingLogs].reverse().map((log: any, i: number) => {
                                       const agent = CAREER_AGENTS[log.role as AgentRole];
                                       return (
                                          <div key={i} className="group p-5 rounded-[2rem] border border-white bg-white/60 shadow-sm leading-relaxed">
                                             <div className="flex items-center gap-4 mb-3">
                                                <div className="h-10 w-10 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-lg shadow-sm">
                                                   {agent.icon}
                                                </div>
                                                <div>
                                                   <span className="text-[10px] font-black uppercase tracking-widest text-slate-800 block">{agent.name}</span>
                                                   <span className="text-[9px] font-bold text-slate-400 tracking-[0.2em]">{log.model || "Career Engine"}</span>
                                                </div>
                                             </div>
                                             <div className="pl-14">
                                                <p className="text-[12px] text-slate-500 font-medium leading-relaxed">{log.reason}</p>
                                             </div>
                                          </div>
                                       )
                                    })
                                 )}
                              </div>
                           </ScrollArea>

                           {/* Sticky Chat Input for Mobile Intelligence */}
                           <div className="absolute bottom-[calc(env(safe-area-inset-bottom)+5.5rem)] left-0 right-0 z-50 px-4 sm:px-6">
                              <div className="relative group shadow-2xl shadow-indigo-500/10">
                                 <Input 
                                    placeholder="Ask your advisor..."
                                    value={chatInput}
                                    onChange={(e) => setChatInput(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                                    className="h-14 pl-6 pr-14 rounded-[1.8rem] bg-white border-white/50 text-sm font-medium shadow-2xl backdrop-blur-3xl ring-8 ring-indigo-500/5 focus-visible:ring-indigo-500/20"
                                 />
                                 <button 
                                    onClick={handleSendMessage}
                                    disabled={!chatInput.trim() || isTyping}
                                    className="absolute right-1.5 top-1.5 h-11 w-11 rounded-full bg-indigo-500 text-white flex items-center justify-center shadow-lg active:scale-90 transition-all disabled:opacity-50"
                                 >
                                    <SendHorizontal className="h-4 w-4" />
                                 </button>
                              </div>
                           </div>
                        </div>
                     </div>
                  ) : (
                     <div className="flex-1 flex flex-col overflow-hidden bg-slate-50/30 p-4">
                         <ScrollArea className="flex-1">
                            <EditorDesignStudio 
                              resume={resume} 
                              plan={profile?.plan} 
                              sections={["templates", "styles"]} 
                              onSelectTemplate={applyTemplate} 
                              onUpdateStyle={updateStyle} 
                              onResetStyles={resetTemplateStyles} 
                            />
                            <div className="h-40" />
                         </ScrollArea>
                     </div>
                  )}
               </motion.div>
            ) : (
               <motion.div 
                 key="preview-view"
                 initial={{ opacity: 0, scale: 0.98 }}
                 animate={{ opacity: 1, scale: 1 }}
                 exit={{ opacity: 0, scale: 0.98 }}
                 className="flex h-full w-full flex-col overflow-hidden bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.16),transparent_30%),linear-gradient(180deg,#eef2ff_0%,#e2e8f0_42%,#dbe4f0_100%)] p-3 sm:p-4"
               >
                  <div className="mb-3 flex shrink-0 items-center justify-between rounded-[1.6rem] border border-white/80 bg-white/75 px-4 py-3 shadow-[0_18px_50px_-28px_rgba(79,70,229,0.35)] backdrop-blur-xl">
                     <div className="min-w-0">
                        <p className="text-[9px] font-black uppercase tracking-[0.22em] text-slate-400">Mobile Preview</p>
                        <p className="truncate text-sm font-black tracking-tight text-slate-900">{resume.name}</p>
                     </div>
                     <div className="ml-3 rounded-full bg-slate-900 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.18em] text-white">
                        A4
                     </div>
                  </div>

                  <div className="relative flex-1 overflow-hidden rounded-[1.8rem] border border-white/75 bg-white/55 shadow-[0_30px_80px_-34px_rgba(15,23,42,0.28)] backdrop-blur-xl">
                     <div className="pointer-events-none absolute inset-x-6 top-0 z-10 h-16 bg-gradient-to-b from-white/55 to-transparent" />
                     <PrintPreviewContainer resume={resume} className="h-full" defaultFitMode="page" compact={true} />
                  </div>
               </motion.div>
            )}
         </AnimatePresence>

         {/* Bottom Tabs Shadow Overlay */}
         {mobileView === "edit" && <BottomTabs />}
      </div>
    </div>
  )
}
function MobileRoleBulletSelector({
  roleBulletSuggestions,
  onApply,
  onDismiss,
  onRegenerate,
}: {
  roleBulletSuggestions: { index: number; title: string; bullets: string[] }
  onApply: (selectedBullets: string[]) => void
  onDismiss: () => void
  onRegenerate: () => void
}) {
  const [selected, setSelected] = useState<number[]>(() => roleBulletSuggestions.bullets.map((_, i) => i))

  const toggleBullet = (index: number) => {
    setSelected((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    )
  }

  const toggleAll = () => {
    if (selected.length === roleBulletSuggestions.bullets.length) {
      setSelected([])
    } else {
      setSelected(roleBulletSuggestions.bullets.map((_, i) => i))
    }
  }

  const handleApply = () => {
    const chosen = roleBulletSuggestions.bullets.filter((_, i) => selected.includes(i))
    onApply(chosen)
  }

  return (
    <div className="rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-white p-4 shadow-sm space-y-4 animate-in fade-in slide-in-from-top-2 duration-500">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-orange-500 animate-pulse" />
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-orange-500">AI Role Draft</p>
          </div>
          <h4 className="truncate text-sm font-bold text-slate-900">
            {roleBulletSuggestions.title}
          </h4>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleAll}
            className="text-[10px] font-bold text-orange-600 bg-orange-100 px-2 py-1 rounded-lg"
          >
            {selected.length === roleBulletSuggestions.bullets.length ? "Deselect All" : "Select All"}
          </button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-xl text-slate-300 hover:text-red-500"
            onClick={onDismiss}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
        {roleBulletSuggestions.bullets.map((bullet: string, bulletIndex: number) => {
          const isChecked = selected.includes(bulletIndex)
          return (
            <div
              key={bulletIndex}
              onClick={() => toggleBullet(bulletIndex)}
              className={cn(
                "flex items-start gap-2.5 rounded-2xl border p-3 text-[11px] leading-relaxed transition-all cursor-pointer select-none",
                isChecked
                  ? "bg-white border-orange-200 text-slate-800 shadow-sm"
                  : "bg-white/50 border-transparent text-slate-400 opacity-60"
              )}
            >
              <div
                className={cn(
                  "mt-0.5 h-4 w-4 rounded border flex items-center justify-center shrink-0 transition-colors",
                  isChecked
                    ? "bg-orange-500 border-orange-500 text-white"
                    : "bg-white border-slate-300"
                )}
              >
                {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
              </div>
              <span>{bullet}</span>
            </div>
          )
        })}
      </div>

      <div className="flex flex-col gap-2 pt-1">
        <Button
          disabled={selected.length === 0}
          className="h-11 w-full rounded-2xl bg-slate-900 text-[10px] font-black uppercase tracking-widest text-white shadow-lg disabled:opacity-50"
          onClick={handleApply}
        >
          Add Selected ({selected.length})
        </Button>
        <Button
          variant="outline"
          className="h-10 w-full rounded-2xl border-slate-200 bg-white text-[10px] font-bold uppercase tracking-wider text-slate-600"
          onClick={onRegenerate}
        >
          Regenerate Draft
        </Button>
      </div>
    </div>
  )
}
