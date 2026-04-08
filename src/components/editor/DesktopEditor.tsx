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
  ListPlus
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { getTemplateConfig, getTemplateTierLabel } from "@/lib/templates-config"
import { ResumeTemplate } from "./resume-template"
import { EditorDesignStudio } from "./editor-design-studio"
import { RichTextField } from "./rich-text-field"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

interface DesktopEditorProps {
  editor: any 
}

export function DesktopEditor({ editor }: DesktopEditorProps) {
  const { toast } = useToast()
  const [activeSection, setActiveSection] = useState<string>("personal")
  const [activeStudioTab, setActiveStudioTab] = useState<"preview" | "settings" | "templates">("preview")
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
    applyTemplate,
    updateStyle,
    resetTemplateStyles,
    profile,
    routingLogs,
    chatMessages,
    sendAdvisoryMessage,
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
    <div className="relative min-h-[calc(100vh-64px)] overflow-hidden bg-[#f4f5f8] px-4 py-4 lg:p-6 flex items-center justify-center font-sans text-slate-800">
      
      {/* Background Soft Blobs */}
      <div className="pointer-events-none absolute left-[-15%] top-[-10%] h-[60%] w-[40%] rounded-[100%] bg-purple-400/20 blur-[120px]" />
      <div className="pointer-events-none absolute left-[15%] top-[20%] h-[30%] w-[30%] rounded-[100%] bg-blue-400/15 blur-[100px]" />
      <div className="pointer-events-none absolute right-[-10%] bottom-[-10%] h-[50%] w-[40%] rounded-[100%] bg-orange-400/15 blur-[120px]" />

      {/* Main App Container */}
      <div className="relative mx-auto flex h-[calc(100vh-80px)] w-full max-w-[1700px] flex-col overflow-hidden rounded-[1.5rem] border border-white bg-white shadow-[0_20px_50px_-12px_rgba(15,23,42,0.1)] backdrop-blur-3xl">
        
        {/* Top Navbar */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-100/60 bg-white/40 px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-indigo-500 to-purple-500 text-[10px] font-black text-white shadow-sm">
              Ai
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 ml-2 rounded-lg border-indigo-200 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 hover:text-indigo-700 font-semibold shadow-sm">
                  <Eye className="mr-1.5 h-3.5 w-3.5" />
                  Preview
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-[850px] max-h-[95vh] overflow-y-auto p-8 rounded-[2rem] bg-[#f4f5f8] flex justify-center [&>button]:!bg-white [&>button]:!opacity-100 [&>button]:hover:!opacity-80 [&>button]:shadow-sm">
                <div className="w-[210mm] min-h-[297mm] transform origin-top shadow-2xl rounded-lg bg-white overflow-hidden ring-1 ring-slate-100/50">
                  <ResumeTemplate data={resume} isPrint={false} />
                </div>
              </DialogContent>
            </Dialog>
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
        <div className="flex min-h-0 flex-1 bg-[linear-gradient(90deg,rgba(244,245,248,0.5)_0%,rgba(255,255,255,0.7)_100%)]">
          
          {/* Left Vertical Navigation */}
          <aside className="w-56 flex-shrink-0 flex flex-col items-center bg-[#f4f7fc]/50 border-r border-[#e8ecf4] py-6 relative">
            <div className="w-full px-4 space-y-1">
              {studioNavigation.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveStudioTab(item.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl px-4 py-3 text-[13px] font-semibold transition-all duration-200",
                    activeStudioTab === item.id 
                     ? "bg-white text-slate-800 shadow-[0_4px_12px_-4px_rgba(15,23,42,0.08)]" 
                     : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </button>
              ))}
            </div>

            {/* Floating Tool Rail */}
            <div className="mt-8 flex flex-col gap-1.5 rounded-[1.2rem] bg-white border border-[#edf1f8] p-2 shadow-[0_8px_20px_-8px_rgba(15,23,42,0.06)] relative z-10 w-[52px]">
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
          <main className="flex-1 min-w-0 max-w-[600px] border-r border-[#e8ecf4] bg-[#fdfdfd] relative z-10 shadow-[20px_0_40px_-20px_rgba(15,23,42,0.02)]">
            <ScrollArea className="h-full px-10 py-10">
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
                                            className="font-bold text-[14px] border-none bg-transparent h-8 px-1 mb-1 focus-visible:ring-0 placeholder:text-slate-300 outline-none"
                                            placeholder="Company Name"
                                         />
                                          <Input 
                                            value={exp.title} 
                                            onChange={(e) => {
                                              const next = [...resume.content.experience]
                                              next[idx] = { ...next[idx], title: e.target.value }
                                              handleUpdate("content.experience", next)
                                            }}
                                            className="text-[13px] border-none bg-transparent h-7 px-1 mb-2 text-slate-500 focus-visible:ring-0 placeholder:text-slate-300 outline-none"
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

          {/* Right Live Preview Column */}
          <aside className="flex-1 bg-[#f0f3f8] flex flex-col relative">
            <div className="flex items-center justify-between px-8 py-6 sticky top-0 z-10 bg-gradient-to-b from-[#f0f3f8] to-transparent">
              <h2 className="text-[16px] font-bold text-slate-800">Live Preview</h2>
              <div className="flex items-center gap-2">
                 <Badge variant="outline" className="rounded-full bg-white border-slate-200 text-slate-500 font-semibold py-1 px-3 text-[10px] uppercase tracking-wider shadow-sm">
                   <Eye className="mr-1.5 h-3 w-3" /> Live Preview
                 </Badge>
              </div>
            </div>
            
            <ScrollArea className="flex-1 px-8 pb-10 flex">
              <div className="mx-auto w-[210mm] min-h-[297mm] transform origin-top hover:shadow-2xl transition-all duration-500 rounded-lg bg-white shadow-[0_25px_50px_-12px_rgba(50,50,93,0.15)] ring-1 ring-slate-100/50 mb-10 overflow-hidden">
                <ResumeTemplate data={resume} />
              </div>
            </ScrollArea>
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
                      <h3 className="text-xs font-black uppercase tracking-widest text-slate-900">AI Advisor</h3>
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
                  placeholder="Ask about your brand, ATS, or ROI..."
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
