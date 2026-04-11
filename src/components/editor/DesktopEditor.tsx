"use client"

import { useState } from "react"
import { AgentRole, CAREER_AGENTS } from "@/services/CareerAgents"
import { AnimatePresence, motion } from "framer-motion"
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
  Ellipsis,
  Trash2,
  Plus,
  PanelsTopLeft,
  SlidersHorizontal,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Cpu,
  SendHorizontal,
  Settings,
  ListPlus,
  Pencil,
  Check,
  Upload
} from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { getTemplateConfig, getTemplateTierLabel } from "@/lib/templates-config"
import { ResumeTemplate } from "./resume-template"
import { PrintPreviewContainer } from "./print-preview-container"
import { EditorDesignStudio } from "./editor-design-studio"
import { PhotoUpload } from "./PhotoUpload"
import { RichTextField } from "./rich-text-field"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { BrandWordmark } from "@/components/brand/brand-wordmark"

interface DesktopEditorProps {
  editor: any 
}

export function DesktopEditor({ editor }: DesktopEditorProps) {
  const { toast } = useToast()
  const [activeSection, setActiveSection] = useState<string>("personal")
  const [activeStudioTab, setActiveStudioTab] = useState<"preview" | "settings" | "templates">("preview")
  const [isEditingName, setIsEditingName] = useState(false)
  const [tempName, setTempName] = useState(editor.resume?.name || "")
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
    isSuggestingRoleBullets,
    runSuggestRoleBullets,
    isGeneratingSummarySuggestions,
    summarySuggestions,
    runSummarySuggestions,
    isSuggestingSkills,
    skillSuggestions,
    runSkillSuggestions,
    setSkillSuggestions,
    applyTemplate,
    updateStyle,
    resetTemplateStyles,
    profile,
    routingLogs,
    chatMessages,
    sendAdvisoryMessage,

    isUploading,
    isCropping,
    setIsCropping,
    cropImage,
    onCropComplete,
    processCrop,
    handlePhotoFileChange,
    handleDeletePhoto,
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

  if (!resume) return null
  const activeTemplate = getTemplateConfig(resume.templateId)

  const sections = [
    { id: "personal", icon: User, label: "Personal" },
    { id: "summary", icon: FileText, label: "Summary" },
    { id: "experience", icon: Briefcase, label: "Experience" },
    { id: "education", icon: GraduationCap, label: "Education" },
    { id: "skills", icon: Wrench, label: "Skills" },
    { id: "projects", icon: Target, label: "Projects" },
    { id: "certifications", icon: Award, label: "Certifications" },
    { id: "languages", icon: Globe, label: "Languages" },
  ]

  const studioNavigation = [
    { id: "preview" as const, icon: FileText, label: "Resume Builder" },
    { id: "settings" as const, icon: Settings, label: "Settings" },
    { id: "templates" as const, icon: LayoutTemplate, label: "Templates" }
  ]

  const toggleSection = (id: string) => {
    setActiveSection(activeSection === id ? "" : id)
  }

  return (
    <div className="relative min-h-screen bg-[#f4f5f8] px-4 py-4 lg:p-6 flex items-center justify-center font-sans text-slate-800">
      
      {/* Background Soft Blobs */}
      <div className="pointer-events-none absolute left-[-15%] top-[-10%] h-[60%] w-[40%] rounded-[100%] bg-purple-400/20 blur-[120px]" />
      <div className="pointer-events-none absolute left-[15%] top-[20%] h-[30%] w-[30%] rounded-[100%] bg-blue-400/15 blur-[100px]" />
      <div className="pointer-events-none absolute right-[-10%] bottom-[-10%] h-[50%] w-[40%] rounded-[100%] bg-orange-400/15 blur-[120px]" />

      {/* Main App Container */}
      <div className="relative mx-auto flex min-h-[calc(100vh-80px)] w-full max-w-[1700px] flex-col rounded-[1.5rem] border border-white bg-white shadow-[0_20px_50px_-12px_rgba(15,23,42,0.1)] backdrop-blur-3xl">
        
        {/* Top Navbar */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-100/60 bg-white/40 px-6">
          <div className="flex items-center gap-2 overflow-hidden">
            <BrandWordmark className="scale-[0.55] origin-left -mr-16 flex-shrink-0" />
            
            <div className="flex items-center gap-3 ml-4 max-w-[300px] xl:max-w-[450px]">
              <div className="h-4 w-[1px] bg-slate-200 mx-1 hidden sm:block" />
              
              {isEditingName ? (
                <div className="flex items-center gap-2">
                  <Input 
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleUpdate("name", tempName)
                        setIsEditingName(false)
                      }
                      if (e.key === "Escape") {
                        setTempName(resume.name)
                        setIsEditingName(false)
                      }
                    }}
                    autoFocus
                    className="h-8 py-0 px-2 text-[13px] font-bold text-slate-700 bg-white border-indigo-200 focus-visible:ring-indigo-100 min-w-[200px]"
                  />
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="h-8 w-8 text-indigo-500 hover:bg-indigo-50"
                    onClick={() => {
                      handleUpdate("name", tempName)
                      setIsEditingName(false)
                    }}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div 
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-slate-100/60 transition-all group cursor-pointer border border-transparent hover:border-slate-200/50 min-w-0"
                  onClick={() => {
                    setTempName(resume.name)
                    setIsEditingName(true)
                  }}
                >
                  <FileText className="h-4 w-4 text-slate-400 group-hover:text-indigo-500 transition-colors flex-shrink-0" />
                  <span className="text-[13px] font-bold text-slate-700 truncate">{resume.name}</span>
                  <Pencil className="h-3 w-3 text-slate-300 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0" />
                </div>
              )}
            </div>

            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 ml-2 rounded-lg border-indigo-200 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 hover:text-indigo-700 font-semibold shadow-sm">
                  <Eye className="mr-1.5 h-3.5 w-3.5" />
                  Preview
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-[1200px] w-[95vw] h-[92vh] p-0 overflow-hidden border-none bg-[#1e293b] rounded-[2.5rem] shadow-2xl [&>button]:!bg-white/10 [&>button]:!z-30 [&>button]:!top-6 [&>button]:!right-8 [&>button]:!opacity-100 [&>button]:hover:!bg-white/20 [&>button]:!text-white [&>button]:!border-white/20 [&>button]:backdrop-blur-md [&>button]:rounded-full [&>button]:p-2">
                <div className="sr-only">
                  <DialogTitle>Resume Preview</DialogTitle>
                  <DialogDescription>
                    Full-screen print-accurate preview with auto-scaling.
                  </DialogDescription>
                </div>
                
                <PrintPreviewContainer resume={resume} className="bg-transparent" />
              </DialogContent>
            </Dialog>

            <Button variant="outline" size="sm" asChild className="h-8 ml-2 rounded-lg border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-semibold shadow-sm">
              <Link href="/onboarding/upload">
                <Upload className="mr-1.5 h-3.5 w-3.5 text-accent" />
                Import CV
              </Link>
            </Button>

            <Button onClick={() => setIsChatOpen(true)} className="hidden xl:flex h-9 rounded-full bg-slate-900 border-slate-800 text-white gap-2 px-4 hover:bg-slate-800 shadow-lg ml-2">
              <Sparkles className="h-3.5 w-3.5" />
              Career Intelligence Advisor
            </Button>
          </div>

          <div className="flex items-center gap-4">
             <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" onClick={handleUndo} disabled={historyIndex <= 0} className="text-slate-400 hover:text-slate-700 h-8 text-[11px] font-semibold">
                   <Undo className="mr-1.5 h-3.5 w-3.5" /> Undo
                </Button>
                <Button variant="ghost" size="sm" onClick={handleRedo} disabled={historyIndex >= historyLength - 1} className="text-slate-400 hover:text-slate-700 h-8 text-[11px] font-semibold">
                   <Redo className="mr-1.5 h-3.5 w-3.5" /> Redo
                </Button>
             </div>
             
             <Button 
                onClick={handleDownloadPdf} 
                disabled={isExporting}
                className="h-8 rounded-lg bg-gradient-to-r from-indigo-500 via-blue-500 to-orange-400 px-4 text-xs font-bold text-white shadow-sm shadow-indigo-500/20 hover:opacity-95"
             >
                {isExporting ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <FileDown className="mr-1.5 h-3.5 w-3.5" />}
                Download PDF
             </Button>

             <Button 
                variant="outline" 
                size="sm" 
                className="h-8 rounded-lg border-slate-200 bg-white px-3 text-xs font-medium text-slate-600 shadow-sm hidden lg:flex"
                onClick={() => {
                  navigator.clipboard.writeText(`https://app.aicareerguide.com/r/${resume.id}`)
                  toast({
                    title: "Link copied to clipboard",
                    description: "Anyone with this link can view your resume.",
                  })
                }}
             >
               <Share2 className="mr-1.5 h-3.5 w-3.5 text-slate-400" /> Share
             </Button>
          </div>
        </header>

        {/* 3-Column Layout Workspace */}
        <div className="flex flex-1 min-h-0 bg-[linear-gradient(90deg,rgba(244,245,248,0.5)_0%,rgba(255,255,255,0.7)_100%)]">
          
          {/* Left Vertical Navigation */}
          <aside className="w-48 flex-shrink-0 flex flex-col items-center bg-[#f4f7fc]/50 border-r border-[#e8ecf4] py-6 relative">
            <div className="w-full px-4 space-y-1">
              {studioNavigation.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveStudioTab(item.id)}
                  className={cn(
                    "w-11 h-11 lg:w-36 lg:h-12 rounded-[1.2rem] flex items-center justify-center lg:justify-start lg:px-4 gap-3 transition-all duration-300 group",
                    activeStudioTab === item.id 
                       ? "bg-white text-indigo-600 shadow-md shadow-indigo-500/10 border border-indigo-50 ring-1 ring-indigo-50/50" 
                       : "text-slate-400 hover:text-slate-600 hover:bg-white/50"
                  )}
                >
                  <item.icon className={cn("h-4 w-4", activeStudioTab === item.id ? "text-indigo-500" : "text-slate-400 group-hover:text-slate-600")} />
                  <span className="hidden lg:inline text-[13px] font-bold tracking-tight">{item.label}</span>
                </button>
              ))}
            </div>

            {/* Floating Tool Rail */}
            <div className="mt-auto mb-2 flex flex-col gap-1.5 rounded-[1.2rem] bg-white border border-[#edf1f8] p-2 shadow-[0_8px_20px_-8px_rgba(15,23,42,0.06)] relative z-10 w-[52px]">
              {sections.map((section) => (
                 <button
                   key={section.id}
                   onClick={() => setActiveSection(section.id)}
                   className={cn(
                     "relative flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-300",
                     activeSection === section.id
                       ? "bg-gradient-to-br from-[#6d46d8] via-[#5a86f5] to-[#ff9d52] text-white shadow-sm"
                       : "text-[#94a3b8] hover:bg-slate-50 hover:text-slate-700"
                   )}
                   title={section.label}
                 >
                   <section.icon className={cn("h-[18px] w-[18px]", activeSection === section.id ? "drop-shadow-sm" : "")} />
                 </button>
              ))}
            </div>

            <div className="mt-auto w-full px-4 mb-2 flex items-center justify-between">
               <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-[10px] font-bold text-slate-600">
                 AS
               </div>
               <button className="text-slate-400 hover:text-slate-800 transition-colors">
                 <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
               </button>
            </div>
          </aside>

          {/* Form Editor Column */}
          <main className="w-[42%] min-w-[400px] max-w-[720px] flex-shrink-0 border-r border-[#e8ecf4] bg-[#fdfdfd] relative z-10 shadow-[20px_0_40px_-20px_rgba(15,23,42,0.02)]">
            <ScrollArea className="h-[calc(100vh-136px)] px-10 py-10">
               {activeStudioTab === "preview" ? (
                 <div className="max-w-full pb-24">
                   <h1 className="text-[22px] font-bold tracking-tight text-slate-800 mb-8 px-1">Edit Your Resume</h1>
                   
                   <div className="space-y-4">
                     {/* Contact Info Card */}
                     <Card className={cn("overflow-hidden rounded-2xl border transition-all duration-300 shadow-[0_4px_16px_-8px_rgba(15,23,42,0.05)]", activeSection === "personal" ? "border-slate-200" : "border-[#edf1f8] opacity-70")}>
                        <div className="flex items-center justify-between px-5 py-4 cursor-pointer bg-white" onClick={() => toggleSection('personal')}>
                           <h3 className="text-[14px] font-semibold text-slate-800">Contact Info</h3>
                           {activeSection === "personal" ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                        </div>
                        <AnimatePresence initial={false}>
                          {activeSection === 'personal' && (
                             <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                               <div className="p-5 pt-1 space-y-4 bg-white">
                                  <PhotoUpload
                                    photoUrl={resume.content.personal.photoUrl}
                                    onFileChange={handlePhotoFileChange}
                                    onDelete={handleDeletePhoto}
                                    isCropping={isCropping}
                                    setIsCropping={setIsCropping}
                                    cropImage={cropImage}
                                    onCropComplete={onCropComplete}
                                    onProcessCrop={processCrop}
                                    isUploading={isUploading}
                                  />
                                  <Input 
                                    value={resume.content.personal.name} 
                                    onChange={(e) => handleUpdate("content.personal.name", e.target.value)}
                                    className="h-[46px] bg-gradient-to-r from-indigo-50/60 to-purple-50/60 border-indigo-100/50 text-slate-800 font-medium rounded-xl shadow-inner shadow-white"
                                    placeholder="Full Name"
                                  />
                                  <Input 
                                    value={resume.content.personal.title} 
                                    onChange={(e) => handleUpdate("content.personal.title", e.target.value)}
                                    className="h-[46px] bg-[#f8f9fc] border-[#edf1f8] focus:border-indigo-200 focus-visible:ring-indigo-100 rounded-xl"
                                    placeholder="Job Title"
                                  />
                                  <Input 
                                    value={resume.content.personal.phone} 
                                    onChange={(e) => handleUpdate("content.personal.phone", e.target.value)}
                                    className="h-[46px] bg-[#f8f9fc] border-[#edf1f8] focus:border-indigo-200 focus-visible:ring-indigo-100 rounded-xl"
                                    placeholder="(123) 456-7890"
                                  />
                                  <Input 
                                    value={resume.content.personal.email} 
                                    onChange={(e) => handleUpdate("content.personal.email", e.target.value)}
                                    className="h-[46px] bg-[#f8f9fc] border-[#edf1f8] focus:border-indigo-200 focus-visible:ring-indigo-100 rounded-xl"
                                    placeholder="Email Address"
                                  />
                               </div>
                             </motion.div>
                          )}
                        </AnimatePresence>
                     </Card>

                     {/* Experience Card */}
                     <Card className={cn("overflow-hidden rounded-2xl border transition-all duration-300 shadow-[0_4px_16px_-8px_rgba(15,23,42,0.05)]", activeSection === "experience" ? "border-slate-200" : "border-[#edf1f8] opacity-70")}>
                        <div className="flex items-center justify-between px-5 py-4 cursor-pointer bg-white" onClick={() => toggleSection('experience')}>
                           <h3 className="text-[14px] font-semibold text-slate-800">Experience</h3>
                           {activeSection === "experience" ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                        </div>
                        <AnimatePresence initial={false}>
                          {activeSection === 'experience' && (
                             <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                               <div className="p-5 pt-1 space-y-4 bg-white">
                                  <Button 
                                    onClick={() => {
                                      const newExp = [...(resume.content.experience || []), { id: Date.now(), title: "", company: "", period: "", description: "" }]
                                      handleUpdate("content.experience", newExp)
                                    }}
                                    className="w-full h-11 rounded-xl bg-gradient-to-r from-indigo-500 via-[#8a68e8] to-[#ff8c6b] text-white font-semibold text-sm hover:opacity-95 shadow-md shadow-indigo-500/20"
                                  >
                                    <Plus className="h-4 w-4 mr-2 opacity-80" /> Add Work Experience
                                  </Button>
                                  
                                  <div className="space-y-4 mt-4">
                                    {resume.content.experience?.map((exp: any, idx: number) => (
                                      <div key={exp.id || idx} className="p-4 border rounded-xl border-[#edf1f8] bg-[#fcfdff] relative group">
                                         <div className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                            {idx > 0 && (
                                              <Button variant="ghost" size="icon" 
                                                 onClick={() => {
                                                   const next = [...resume.content.experience]
                                                   const temp = next[idx]
                                                   next[idx] = next[idx - 1]
                                                   next[idx - 1] = temp
                                                   handleUpdate("content.experience", next)
                                                 }}
                                                 className="h-7 w-7 text-slate-300 hover:text-slate-600 hover:bg-slate-100"
                                              >
                                                 <ChevronUp className="h-4 w-4" />
                                              </Button>
                                            )}
                                            {idx < resume.content.experience.length - 1 && (
                                              <Button variant="ghost" size="icon" 
                                                 onClick={() => {
                                                   const next = [...resume.content.experience]
                                                   const temp = next[idx]
                                                   next[idx] = next[idx + 1]
                                                   next[idx + 1] = temp
                                                   handleUpdate("content.experience", next)
                                                 }}
                                                 className="h-7 w-7 text-slate-300 hover:text-slate-600 hover:bg-slate-100"
                                              >
                                                 <ChevronDown className="h-4 w-4" />
                                              </Button>
                                            )}
                                            <Button variant="ghost" size="icon" 
                                               disabled={isEnhancing}
                                               onClick={() => runEnhanceContent("experience", idx)}
                                               className="h-7 w-7 text-indigo-400 hover:bg-slate-100"
                                               title="Enhance existing content"
                                            >
                                               <Sparkles className="h-3 w-3" />
                                            </Button>
                                            <Button variant="ghost" size="icon" 
                                               disabled={isSuggestingRoleBullets === idx || !exp.title}
                                               onClick={() => runSuggestRoleBullets(idx)}
                                               className="h-7 w-7 text-blue-400 hover:text-blue-500 hover:bg-slate-100"
                                               title="Suggest role bullets based on title"
                                            >
                                               {isSuggestingRoleBullets === idx ? <Loader2 className="h-3 w-3 animate-spin"/> : <ListPlus className="h-3 w-3" />}
                                            </Button>
                                            <Button variant="ghost" size="icon" 
                                               onClick={() => {
                                                 const next = resume.content.experience.filter((_: any, i: number) => i !== idx)
                                                 handleUpdate("content.experience", next)
                                               }}
                                               className="h-7 w-7 text-slate-300 hover:text-red-500 hover:bg-slate-100"
                                            >
                                               <Trash2 className="h-3 w-3" />
                                            </Button>
                                         </div>
                                         <Input 
                                            value={exp.company} 
                                            onChange={(e) => {
                                              const next = [...resume.content.experience]
                                              next[idx] = { ...next[idx], company: e.target.value }
                                              handleUpdate("content.experience", next)
                                            }}
                                            className="font-bold text-[14px] border-none bg-transparent h-8 pr-24 pl-1 mb-1 focus-visible:ring-0 placeholder:text-slate-300 outline-none"
                                            placeholder="Company Name"
                                         />
                                          <Input 
                                            value={exp.title} 
                                            onChange={(e) => {
                                              const next = [...resume.content.experience]
                                              next[idx] = { ...next[idx], title: e.target.value }
                                              handleUpdate("content.experience", next)
                                            }}
                                            className="text-[13px] border-none bg-transparent h-7 pr-24 pl-1 mb-2 text-slate-500 focus-visible:ring-0 placeholder:text-slate-300 outline-none"
                                            placeholder="Job Title"
                                         />
                                         <RichTextField
                                            value={exp.description}
                                            onChange={(val) => {
                                              const next = [...resume.content.experience]
                                              next[idx] = { ...next[idx], description: val }
                                              handleUpdate("content.experience", next)
                                            }}
                                            placeholder="List accomplishments..."
                                            minHeightClassName="min-h-[140px]"
                                         />
                                      </div>
                                    ))}
                                  </div>
                               </div>
                             </motion.div>
                          )}
                        </AnimatePresence>
                     </Card>

                     {/* Education Card */}
                     <Card className={cn("overflow-hidden rounded-2xl border transition-all duration-300 shadow-[0_4px_16px_-8px_rgba(15,23,42,0.05)]", activeSection === "education" ? "border-slate-200" : "border-[#edf1f8] opacity-70")}>
                        <div className="flex items-center justify-between px-5 py-4 cursor-pointer bg-white" onClick={() => toggleSection('education')}>
                           <h3 className="text-[14px] font-semibold text-slate-800">Education</h3>
                           {activeSection === "education" 
                              ? <Button size="sm" className="h-7 px-4 rounded-lg bg-gradient-to-r from-[#5a86f5] to-[#ff9d52] text-[11px] font-bold shadow-sm shadow-blue-500/20 text-white hover:opacity-95" onClick={(e) => e.stopPropagation()}>Update Section</Button>
                              : <ChevronDown className="h-4 w-4 text-slate-400" />
                           }
                        </div>
                        <AnimatePresence initial={false}>
                          {activeSection === 'education' && (
                             <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                               <div className="p-5 pt-1 space-y-4 bg-white">
                                 <Button 
                                    onClick={() => {
                                        const next = [...(resume.content.education || []), { id: Date.now(), institution: "", degree: "", period: "", description: "" }]
                                        handleUpdate("content.education", next)
                                    }}
                                    variant="outline"
                                    className="w-full h-11 rounded-xl text-slate-500 font-semibold text-sm hover:bg-slate-50 hover:text-slate-800 border-dashed border-[#dce2ee]"
                                  >
                                    <Plus className="h-4 w-4 mr-2" /> Add Education
                                  </Button>
                                  {resume.content.education?.map((edu: any, idx: number) => (
                                     <div key={edu.id || idx} className="p-4 border rounded-xl border-[#edf1f8] bg-[#fcfdff] relative group">
                                         <div className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                            {idx > 0 && (
                                              <Button variant="ghost" size="icon" 
                                                 onClick={() => {
                                                   const next = [...resume.content.education]
                                                   const temp = next[idx]
                                                   next[idx] = next[idx - 1]
                                                   next[idx - 1] = temp
                                                   handleUpdate("content.education", next)
                                                 }}
                                                 className="h-7 w-7 text-slate-300 hover:text-slate-600 hover:bg-slate-100"
                                              >
                                                 <ChevronUp className="h-4 w-4" />
                                              </Button>
                                            )}
                                            {idx < resume.content.education.length - 1 && (
                                              <Button variant="ghost" size="icon" 
                                                 onClick={() => {
                                                   const next = [...resume.content.education]
                                                   const temp = next[idx]
                                                   next[idx] = next[idx + 1]
                                                   next[idx + 1] = temp
                                                   handleUpdate("content.education", next)
                                                 }}
                                                 className="h-7 w-7 text-slate-300 hover:text-slate-600 hover:bg-slate-100"
                                              >
                                                 <ChevronDown className="h-4 w-4" />
                                              </Button>
                                            )}
                                            <Button variant="ghost" size="icon" 
                                               onClick={() => {
                                                 const next = resume.content.education.filter((_: any, i: number) => i !== idx)
                                                 handleUpdate("content.education", next)
                                               }}
                                               className="h-7 w-7 text-slate-300 hover:text-red-500 hover:bg-slate-100"
                                            >
                                               <Trash2 className="h-3 w-3" />
                                            </Button>
                                         </div>
                                         <Input 
                                            value={edu.institution} 
                                            onChange={(e) => {
                                              const next = [...resume.content.education]
                                              next[idx] = { ...next[idx], institution: e.target.value }
                                              handleUpdate("content.education", next)
                                            }}
                                            className="font-bold text-[14px] border-none bg-transparent h-8 px-1 mb-1 focus-visible:ring-0 placeholder:text-slate-300"
                                            placeholder="Institution Name"
                                         />
                                          <Input 
                                            value={edu.degree} 
                                            onChange={(e) => {
                                              const next = [...resume.content.education]
                                              next[idx] = { ...next[idx], degree: e.target.value }
                                              handleUpdate("content.education", next)
                                            }}
                                            className="text-[13px] border-none bg-transparent h-7 px-1 text-slate-500 focus-visible:ring-0 placeholder:text-slate-300"
                                            placeholder="Degree"
                                         />
                                     </div>
                                  ))}
                               </div>
                             </motion.div>
                          )}
                        </AnimatePresence>
                     </Card>

                     {/* Skills Card */}
                     <Card className={cn("overflow-hidden rounded-2xl border transition-all duration-300 shadow-[0_4px_16px_-8px_rgba(15,23,42,0.05)]", activeSection === "skills" ? "border-slate-200" : "border-[#edf1f8] opacity-70")}>
                        <div className="flex items-center justify-between px-5 py-4 cursor-pointer bg-white" onClick={() => toggleSection('skills')}>
                           <h3 className="text-[14px] font-semibold text-slate-800">Skills</h3>
                           {activeSection === "skills" ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                        </div>
                        <AnimatePresence initial={false}>
                          {activeSection === 'skills' && (
                             <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                               <div className="p-5 pt-1 space-y-4 bg-white">
                                  <Input 
                                    placeholder="Type a skill and press Enter"
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") {
                                        const val = e.currentTarget.value.trim()
                                        if (val && !resume.content.skills.includes(val)) {
                                          handleUpdate("content.skills", [...resume.content.skills, val])
                                          e.currentTarget.value = ""
                                        }
                                      }
                                    }}
                                    className="h-[46px] rounded-xl bg-[#f8f9fc] border-[#edf1f8] text-sm focus-visible:ring-indigo-100"
                                  />
                                  <div className="flex flex-wrap gap-2 pt-2">
                                    {resume.content.skills?.map((skill: string, i: number) => (
                                      <Badge key={i} variant="secondary" className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 font-semibold text-[11px] text-slate-600 gap-1.5 group">
                                         {skill}
                                         <Trash2 
                                            className="h-3 w-3 text-slate-300 hover:text-slate-500 cursor-pointer" 
                                            onClick={() => handleUpdate("content.skills", resume.content.skills.filter((_: any, idx: number) => idx !== i))}
                                         />
                                      </Badge>
                                    ))}
                                  </div>

                                  <Button 
                                    variant="outline" 
                                    onClick={runSkillSuggestions}
                                    className="w-full gap-2 rounded-xl mt-4 font-semibold text-indigo-600 border-indigo-100/60 bg-indigo-50/30 hover:bg-indigo-50 hover:border-indigo-200 transition-colors h-11"
                                  >
                                    {isSuggestingSkills ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                                    Ai Suggestions
                                  </Button>

                                  {skillSuggestions.length > 0 && (
                                    <div className="pt-4 space-y-3">
                                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Suggested for you</p>
                                      <div className="flex flex-wrap gap-2">
                                        {skillSuggestions.map((skill: string, idx: number) => (
                                          <Badge 
                                            key={idx} 
                                            variant="outline" 
                                            className="px-3 py-1.5 rounded-lg border-indigo-100 bg-white text-indigo-600 hover:bg-indigo-50 cursor-pointer font-bold text-[10px] shadow-sm transition-all hover:scale-105 active:scale-95"
                                            onClick={() => {
                                              if (!resume.content.skills.includes(skill)) {
                                                handleUpdate("content.skills", [...resume.content.skills, skill])
                                              }
                                              setSkillSuggestions((prev: string[]) => prev.filter((s: string) => s !== skill))
                                            }}
                                          >
                                            <Plus className="h-2.5 w-2.5 mr-1 text-indigo-400" />
                                            {skill}
                                          </Badge>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                               </div>
                             </motion.div>
                          )}
                        </AnimatePresence>
                     </Card>

                      {/* Projects Card */}
                      <Card className={cn("overflow-hidden rounded-2xl border transition-all duration-300 shadow-[0_4px_16px_-8px_rgba(15,23,42,0.05)]", activeSection === "projects" ? "border-slate-200" : "border-[#edf1f8] opacity-70")}>
                         <div className="flex items-center justify-between px-5 py-4 cursor-pointer bg-white" onClick={() => toggleSection('projects')}>
                            <h3 className="text-[14px] font-semibold text-slate-800">Projects</h3>
                            {activeSection === "projects" ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                         </div>
                         <AnimatePresence initial={false}>
                           {activeSection === 'projects' && (
                              <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                                <div className="p-5 pt-1 space-y-4 bg-white">
                                   <Button 
                                     onClick={() => {
                                       const next = [...(resume.content.projects || []), { id: Date.now(), title: "", link: "", period: "", description: "" }]
                                       handleUpdate("content.projects", next)
                                     }}
                                     className="w-full h-11 rounded-xl bg-gradient-to-r from-indigo-500 via-[#8a68e8] to-[#ff8c6b] text-white font-semibold text-sm hover:opacity-95 shadow-md shadow-indigo-500/20"
                                   >
                                     <Plus className="h-4 w-4 mr-2 opacity-80" /> Add Project
                                   </Button>
                                   
                                   <div className="space-y-4 mt-4">
                                     {resume.content.projects?.map((proj: any, idx: number) => (
                                       <div key={proj.id || idx} className="p-4 border rounded-xl border-[#edf1f8] bg-[#fcfdff] relative group">
                                          <div className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                             <Button variant="ghost" size="icon" 
                                                disabled={isEnhancing}
                                                onClick={() => runEnhanceContent("projects", idx)}
                                                className="h-7 w-7 text-indigo-400 hover:bg-slate-100"
                                                title="Enhance existing content"
                                             >
                                                <Sparkles className="h-3 w-3" />
                                             </Button>
                                             <Button variant="ghost" size="icon" 
                                                onClick={() => {
                                                  const next = resume.content.projects.filter((_: any, i: number) => i !== idx)
                                                  handleUpdate("content.projects", next)
                                                }}
                                                className="h-7 w-7 text-slate-300 hover:text-red-500 hover:bg-slate-100"
                                             >
                                                <Trash2 className="h-3 w-3" />
                                             </Button>
                                          </div>
                                          <Input 
                                             value={proj.title} 
                                             onChange={(e) => {
                                               const next = [...resume.content.projects]
                                               next[idx] = { ...next[idx], title: e.target.value }
                                               handleUpdate("content.projects", next)
                                             }}
                                             className="font-bold text-[14px] border-none bg-transparent h-8 px-1 mb-1 focus-visible:ring-0 placeholder:text-slate-300 outline-none"
                                             placeholder="Project Title"
                                          />
                                           <Input 
                                             value={proj.link} 
                                             onChange={(e) => {
                                               const next = [...resume.content.projects]
                                               next[idx] = { ...next[idx], link: e.target.value }
                                               handleUpdate("content.projects", next)
                                             }}
                                             className="text-[13px] border-none bg-transparent h-7 px-1 mb-2 text-slate-500 focus-visible:ring-0 placeholder:text-slate-300 outline-none"
                                             placeholder="Project Link (Optional)"
                                          />
                                          <RichTextField
                                             value={proj.description}
                                             onChange={(val) => {
                                               const next = [...resume.content.projects]
                                               next[idx] = { ...next[idx], description: val }
                                               handleUpdate("content.projects", next)
                                             }}
                                             placeholder="Describe what you built..."
                                             minHeightClassName="min-h-[100px]"
                                          />
                                       </div>
                                     ))}
                                   </div>
                                </div>
                              </motion.div>
                           )}
                         </AnimatePresence>
                      </Card>

                      {/* Certifications Card */}
                      <Card className={cn("overflow-hidden rounded-2xl border transition-all duration-300 shadow-[0_4px_16px_-8px_rgba(15,23,42,0.05)]", activeSection === "certifications" ? "border-slate-200" : "border-[#edf1f8] opacity-70")}>
                         <div className="flex items-center justify-between px-5 py-4 cursor-pointer bg-white" onClick={() => toggleSection('certifications')}>
                            <h3 className="text-[14px] font-semibold text-slate-800">Certifications</h3>
                            {activeSection === "certifications" ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                         </div>
                         <AnimatePresence initial={false}>
                           {activeSection === 'certifications' && (
                              <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                                <div className="p-5 pt-1 space-y-4 bg-white">
                                   <Button 
                                     onClick={() => {
                                       const next = [...(resume.content.certifications || []), { id: Date.now(), name: "", issuer: "", date: "" }]
                                       handleUpdate("content.certifications", next)
                                     }}
                                     variant="outline"
                                     className="w-full h-11 rounded-xl text-slate-500 font-semibold text-sm hover:bg-slate-50 hover:text-slate-800 border-dashed border-[#dce2ee]"
                                   >
                                     <Plus className="h-4 w-4 mr-2" /> Add Certification
                                   </Button>
                                   <div className="space-y-3 mt-4">
                                     {resume.content.certifications?.map((cert: any, idx: number) => (
                                        <div key={cert.id || idx} className="p-4 border rounded-xl border-[#edf1f8] bg-[#fcfdff] relative group">
                                           <button 
                                             onClick={() => {
                                               const next = resume.content.certifications.filter((_: any, i: number) => i !== idx)
                                               handleUpdate("content.certifications", next)
                                             }}
                                             className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-all shadow-sm bg-white p-1 rounded-md border border-slate-100"
                                           >
                                             <Trash2 className="h-3 w-3" />
                                           </button>
                                           <Input 
                                              value={cert.name} 
                                              onChange={(e) => {
                                                const next = [...resume.content.certifications]
                                                next[idx] = { ...next[idx], name: e.target.value }
                                                handleUpdate("content.certifications", next)
                                              }}
                                              className="font-bold text-[13px] border-none bg-transparent h-7 px-1 focus-visible:ring-0 placeholder:text-slate-300 outline-none"
                                              placeholder="Certification Name"
                                           />
                                           <Input 
                                              value={cert.issuer} 
                                              onChange={(e) => {
                                                const next = [...resume.content.certifications]
                                                next[idx] = { ...next[idx], issuer: e.target.value }
                                                handleUpdate("content.certifications", next)
                                              }}
                                              className="text-[12px] border-none bg-transparent h-6 px-1 text-slate-500 focus-visible:ring-0 placeholder:text-slate-300 outline-none"
                                              placeholder="Issuer (e.g., Google, Amazon)"
                                           />
                                        </div>
                                     ))}
                                   </div>
                                </div>
                              </motion.div>
                           )}
                         </AnimatePresence>
                      </Card>

                      {/* Languages Card */}
                      <Card className={cn("overflow-hidden rounded-2xl border transition-all duration-300 shadow-[0_4px_16px_-8px_rgba(15,23,42,0.05)]", activeSection === "languages" ? "border-slate-200" : "border-[#edf1f8] opacity-70")}>
                         <div className="flex items-center justify-between px-5 py-4 cursor-pointer bg-white" onClick={() => toggleSection('languages')}>
                            <h3 className="text-[14px] font-semibold text-slate-800">Languages</h3>
                            {activeSection === "languages" ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                         </div>
                         <AnimatePresence initial={false}>
                           {activeSection === 'languages' && (
                              <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                                <div className="p-5 pt-1 space-y-4 bg-white">
                                   <Button 
                                     onClick={() => {
                                       const next = [...(resume.content.languages || []), { name: "", level: "" }]
                                       handleUpdate("content.languages", next)
                                     }}
                                     variant="outline"
                                     className="w-full h-11 rounded-xl text-slate-500 font-semibold text-sm hover:bg-slate-50 hover:text-slate-800 border-dashed border-[#dce2ee]"
                                   >
                                     <Plus className="h-4 w-4 mr-2" /> Add Language
                                   </Button>
                                   <div className="grid grid-cols-2 gap-3 pb-2 mt-4">
                                     {resume.content.languages?.map((lang: any, idx: number) => (
                                        <div key={idx} className="p-3 border rounded-xl border-[#edf1f8] bg-[#fcfdff] relative group flex flex-col gap-1">
                                           <button 
                                             onClick={() => {
                                               const next = resume.content.languages.filter((_: any, i: number) => i !== idx)
                                               handleUpdate("content.languages", next)
                                             }}
                                             className="absolute -right-1 -top-1 opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-all shadow-sm bg-white p-1 rounded-full border border-slate-100"
                                           >
                                             <Trash2 className="h-2.5 w-2.5" />
                                           </button>
                                           <Input 
                                              value={lang.name} 
                                              onChange={(e) => {
                                                const next = [...resume.content.languages]
                                                next[idx] = { ...next[idx], name: e.target.value }
                                                handleUpdate("content.languages", next)
                                              }}
                                              className="font-bold text-[12px] border-none bg-transparent h-6 px-1 focus-visible:ring-0 placeholder:text-slate-300 outline-none"
                                              placeholder="Language"
                                           />
                                           <Input 
                                              value={lang.level} 
                                              onChange={(e) => {
                                                const next = [...resume.content.languages]
                                                next[idx] = { ...next[idx], level: e.target.value }
                                                handleUpdate("content.languages", next)
                                              }}
                                              className="text-[11px] border-none bg-transparent h-5 px-1 text-slate-400 focus-visible:ring-0 placeholder:text-slate-300 outline-none"
                                              placeholder="Level (e.g., Native)"
                                           />
                                        </div>
                                     ))}
                                   </div>
                                </div>
                              </motion.div>
                           )}
                         </AnimatePresence>
                      </Card>

                      {/* Summary Card */}
                     <Card className={cn("overflow-hidden rounded-2xl border transition-all duration-300 shadow-[0_4px_16px_-8px_rgba(15,23,42,0.05)]", activeSection === "summary" ? "border-slate-200" : "border-[#edf1f8] opacity-70")}>
                        <div className="flex items-center justify-between px-5 py-4 cursor-pointer bg-white" onClick={() => toggleSection('summary')}>
                           <h3 className="text-[14px] font-semibold text-slate-800">Summary</h3>
                           {activeSection === "summary" ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                        </div>
                        <AnimatePresence initial={false}>
                          {activeSection === 'summary' && (
                             <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                               <div className="p-5 pt-1 space-y-4 bg-white">
                                  <div className="rounded-xl border border-[#edf1f8] bg-[#f8f9fc]/50 overflow-hidden">
                                     <RichTextField
                                       value={resume.content.summary}
                                       onChange={(val) => handleUpdate("content.summary", val)}
                                       placeholder="Provide a brief summary of your tech lead experience..."
                                       minHeightClassName="min-h-[160px]"
                                     />
                                  </div>
                                  <Button 
                                    variant="outline" 
                                    onClick={runSummarySuggestions}
                                    className="w-full gap-2 rounded-xl mt-2 font-semibold text-indigo-600 border-indigo-100/60 bg-indigo-50/30 hover:bg-indigo-50 hover:border-indigo-200 transition-colors h-11"
                                  >
                                    {isGeneratingSummarySuggestions ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                                    Ai Suggestions
                                  </Button>
                               </div>
                             </motion.div>
                          )}
                        </AnimatePresence>
                     </Card>

                   </div>
                 </div>
               ) : activeStudioTab === "templates" ? (
                 <div className="p-4">
                   <EditorDesignStudio resume={resume} plan={profile?.plan} sections={["templates"]} onSelectTemplate={applyTemplate} onUpdateStyle={updateStyle} onResetStyles={resetTemplateStyles} />
                 </div>
               ) : (
                 <div className="p-4">
                   <EditorDesignStudio resume={resume} plan={profile?.plan} sections={["styles"]} onSelectTemplate={applyTemplate} onUpdateStyle={updateStyle} onResetStyles={resetTemplateStyles} />
                 </div>
               )}
            </ScrollArea>
          </main>

          {/* Right Live Preview Column — full-page auto-scaled preview */}
          <aside className="flex-1 min-w-0 flex flex-col relative bg-[#23303f] overflow-hidden">
            {/* Inline preview header */}
            <div className="flex items-center justify-between px-5 py-2.5 border-b border-white/5 bg-black/20 backdrop-blur-sm shrink-0 z-10">
              <div className="flex items-center gap-2">
                <Eye className="h-3.5 w-3.5 text-slate-400" />
                <span className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Live Preview</span>
              </div>
              <Badge variant="outline" className="rounded-full bg-white/5 border-white/10 text-slate-400 font-semibold py-1 px-3 text-[9px] uppercase tracking-wider">
                Auto-scaled
              </Badge>
            </div>

            {/* PrintPreviewContainer fills the rest — it auto-fits the A4 page */}
            <div className="absolute inset-0" style={{ top: '2.5rem' }}>
              <PrintPreviewContainer resume={resume} className="h-full" defaultFitMode="page" compact={true} />
            </div>
          </aside>

        </div>
      </div>

       {/* Activity Sidebar overlay handling... porting exactly what was there before */}
       <AnimatePresence>
        {isSidebarOpen && (
          <motion.aside
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-6 top-24 bottom-10 z-50 w-80 rounded-[2rem] border border-white bg-white/80 p-6 shadow-2xl backdrop-blur-3xl"
          >
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Intelligence Audit</h2>
                <div className="flex items-center gap-1.5 mt-1">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-none">Real-time routing</p>
                </div>
              </div>
              <button onClick={() => setIsSidebarOpen(false)} className="text-slate-400 hover:bg-slate-100 rounded-full h-8 w-8 flex items-center justify-center">
                <Plus className="h-4 w-4 rotate-45" />
              </button>
            </div>
            
            <ScrollArea className="h-[calc(100%-80px)] pr-4 -mr-4">
              <div className="space-y-4">
                {routingLogs.length === 0 ? (
                  <div className="py-24 text-center">
                    <div className="h-16 w-16 rounded-[2rem] bg-slate-50 flex items-center justify-center mx-auto mb-6 border border-slate-100/50 rotate-12 transition-transform hover:rotate-0 duration-500 shadow-sm">
                      <Cpu className="h-7 w-7 text-slate-200" />
                    </div>
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] leading-relaxed">
                      System monitoring idle
                      <span className="block text-[8px] font-bold mt-3 opacity-60 text-slate-400">Trigger AI to observe routing</span>
                    </p>
                  </div>
                ) : (
                  [...routingLogs].reverse().map((log: any, i: number) => {
                    const agent = CAREER_AGENTS[log.role as AgentRole];
                    return (
                      <motion.div 
                        key={i}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="group p-5 rounded-[2.2rem] border border-white/80 bg-white/40 backdrop-blur-md shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-500"
                      >
                         <div className="flex items-center justify-between mb-3.5">
                           <div className="flex items-center gap-3">
                             <div className="h-9 w-9 rounded-[1rem] bg-white flex items-center justify-center border border-slate-100 text-base shadow-sm group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                               {agent.icon}
                             </div>
                             <div>
                               <span className="text-[10px] font-black uppercase tracking-wider text-slate-800 block">{agent.name}</span>
                               <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Active Agent</span>
                             </div>
                           </div>
                         </div>
                         <div className="pl-12">
                           <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                             <span className="font-bold text-slate-900 opacity-60 uppercase text-[8px] tracking-widest block mb-1">Decision Logic</span> 
                             {log.reason}
                           </p>
                         </div>
                      </motion.div>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* AI Advisor Chat */}
      <AnimatePresence>
        {isChatOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed right-6 bottom-24 z-50 w-96 rounded-[2.5rem] border border-white bg-white/90 p-6 shadow-[0_30px_80px_-20px_rgba(15,23,42,0.3)] backdrop-blur-3xl overflow-hidden"
          >
             <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                   <div className="h-10 w-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                      <Sparkles className="h-5 w-5" />
                   </div>
                   <div>
                      <h3 className="text-xs font-black uppercase tracking-widest text-slate-900">Career Intelligence Advisor</h3>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-0.5">Gemini 2.5 Intelligence</p>
                   </div>
                </div>
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-slate-100" onClick={() => setIsChatOpen(false)}>
                   <Plus className="h-4 w-4 rotate-45 text-slate-400" />
                </Button>
             </div>

             <ScrollArea className="h-96 pr-4 -mr-4 mb-4">
                <div className="space-y-6">
                   {chatMessages.map((msg: any, i: number) => (
                      <div key={i} className={cn("flex flex-col", msg.role === "user" ? "items-end" : "items-start")}>
                         <div className={cn(
                            "max-w-[85%] px-5 py-4 rounded-[1.5rem] text-[13px] font-medium leading-relaxed shadow-sm transition-all",
                            msg.role === "user" 
                               ? "bg-slate-800 text-white rounded-tr-none" 
                               : "bg-white border border-slate-100 text-slate-700 rounded-tl-none"
                         )}>
                            {msg.agent && msg.role === "assistant" && (
                               <div className="flex items-center gap-2 mb-2">
                                  <span className="text-base">{CAREER_AGENTS[msg.agent as AgentRole].icon}</span>
                                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{CAREER_AGENTS[msg.agent as AgentRole].name}</span>
                               </div>
                            )}
                            {msg.text}
                         </div>
                      </div>
                   ))}
                   {isTyping && (
                      <div className="flex items-center gap-3 animate-pulse">
                         <div className="h-8 w-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center">
                            <Loader2 className="h-3 w-3 animate-spin text-slate-400" />
                         </div>
                         <div className="text-[10px] font-black uppercase tracking-widest text-slate-300">Thinking...</div>
                      </div>
                   )}
                </div>
             </ScrollArea>

             <div className="relative mt-2">
                <Input 
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleChatSend()}
                  placeholder="Ask about your career intelligence..."
                  className="h-12 pl-5 pr-12 rounded-[1.2rem] bg-slate-50 border-slate-100 focus-visible:ring-indigo-100 transition-all font-medium text-sm placeholder:text-slate-400"
                />
                <Button 
                   size="icon"
                   onClick={handleChatSend}
                   disabled={!chatInput.trim() || isTyping}
                   className="absolute right-1 top-1 h-10 w-10 rounded-full shadow-sm bg-indigo-500 hover:bg-indigo-600 transition-all hover:scale-105 active:scale-95 text-white"
                >
                   <SendHorizontal className="h-4 w-4" />
                </Button>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  )
}
