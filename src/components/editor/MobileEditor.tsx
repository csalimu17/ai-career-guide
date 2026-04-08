"use client"

import { useState } from "react"
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
  ListPlus
} from "lucide-react"
import Link from "next/link"
import { AgentRole, CAREER_AGENTS } from "@/services/CareerAgents"
import { AnimatePresence, motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { getTemplateConfig } from "@/lib/templates-config"
import { EditorDesignStudio } from "./editor-design-studio"
import { ResumeTemplate } from "./resume-template"
import { RichTextField } from "./rich-text-field"
import { cn } from "@/lib/utils"

interface MobileEditorProps {
  editor: any
}

export function MobileEditor({ editor }: MobileEditorProps) {
  const [mobileView, setMobileView] = useState<"edit" | "preview">("edit")
  const [activeTab, setActiveTab] = useState<"content" | "ai" | "design">("content")
  const [activeSection, setActiveSection] = useState<string>("personal")
  
  const { 
    resume, 
    handleUpdate, 
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
    setChatMessages,
    sendAdvisoryMessage,
  } = editor

  const [chatInput, setChatInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)

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
    { id: "personal", icon: User, label: "Header" },
    { id: "summary", icon: Sparkles, label: "Summary" },
    { id: "experience", icon: Briefcase, label: "Experience" },
    { id: "education", icon: GraduationCap, label: "Education" },
    { id: "skills", icon: Wrench, label: "Skills" },
    { id: "projects", icon: Target, label: "Projects" },
    { id: "certifications", icon: Award, label: "Certifications" },
    { id: "languages", icon: Globe, label: "Languages" },
  ]

  const BottomTabs = () => (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-2xl border-t border-slate-100 flex items-center justify-around px-4 pb-[max(1.2rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
      {[
        { id: "content", icon: Layout, label: "Content" },
        { id: "ai", icon: Cpu, label: "AI Advisor" },
        { id: "design", icon: Palette, label: "Design" },
      ].map((tab) => (
        <button
          key={tab.id}
          onClick={() => {
            setActiveTab(tab.id as any)
            setMobileView("edit")
          }}
          className={cn(
            "flex flex-col items-center gap-1 min-w-[64px] transition-all duration-300",
            activeTab === tab.id ? "text-primary scale-110" : "text-slate-400"
          )}
        >
          <div className={cn(
            "p-2 rounded-2xl transition-colors",
            activeTab === tab.id ? "bg-primary/10" : ""
          )}>
            <tab.icon className="h-5 w-5" />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest">{tab.label}</span>
        </button>
      ))}
      
      {/* Floating Preview Toggle for Mobile */}
      <button 
        onClick={() => setMobileView(mobileView === "edit" ? "preview" : "edit")}
        className="absolute -top-16 right-6 h-14 w-14 bg-slate-900 text-white rounded-full shadow-2xl flex items-center justify-center border-4 border-white active:scale-95 transition-transform duration-200"
      >
        {mobileView === "edit" ? <Eye className="h-6 w-6" /> : <Pencil className="h-6 w-6" />}
      </button>
    </nav>
  )

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pb-32">
      {/* Dynamic Mobile Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b px-5 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="p-2 -ml-2 text-slate-400">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="min-w-0">
             <h1 className="text-sm font-black truncate text-slate-900 tracking-tight">{resume.name}</h1>
             <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
               {saveStatus === "saving" ? "Syncing..." : `${activeTemplate.name} active`}
             </p>
          </div>
        </div>
        <Button 
          size="sm" 
          onClick={handleDownloadPdf} 
          disabled={isExporting}
          className="rounded-xl h-9 px-4 bg-primary text-white font-bold gap-2 text-xs shadow-lg shadow-primary/15"
        >
          {isExporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileDown className="h-3.5 w-3.5" />}
          PDF
        </Button>
      </header>

      {mobileView === "edit" ? (
        <main className="flex-1 p-5 space-y-6">
          {activeTab === "content" && (
            <div className="space-y-6">
               <div className="flex gap-2 overflow-x-auto no-scrollbar py-2 -mx-5 px-5">
                  {sections.map((section) => (
                    <button 
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={cn(
                        "whitespace-nowrap h-9 px-4 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all shadow-sm",
                        activeSection === section.id 
                          ? "bg-slate-900 text-white" 
                          : "bg-white text-slate-400 border border-slate-200"
                      )}
                    >
                      {section.label}
                    </button>
                  ))}
               </div>

               {/* Section Specific Forms */}
               <div className="animate-in fade-in duration-300">
                 {activeSection === "personal" && (
                   <div className="space-y-5">
                     <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Full Identity</label>
                       <Input 
                        value={resume.content.personal.name} 
                        onChange={(e) => handleUpdate("content.personal.name", e.target.value)}
                        placeholder="Your Name"
                        className="h-14 rounded-2xl bg-white border-slate-100 shadow-sm text-lg font-bold"
                       />
                     </div>
                     <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Professional Title</label>
                       <Input 
                        value={resume.content.personal.title} 
                        onChange={(e) => handleUpdate("content.personal.title", e.target.value)}
                        placeholder="e.g. Senior Architect"
                        className="h-12 rounded-2xl bg-white border-slate-100"
                       />
                     </div>
                     <div className="grid grid-cols-1 gap-4">
                        <Input 
                          value={resume.content.personal.email} 
                          onChange={(e) => handleUpdate("content.personal.email", e.target.value)}
                          placeholder="Email"
                          className="h-12 rounded-2xl bg-white border-slate-100"
                        />
                        <Input 
                          value={resume.content.personal.phone} 
                          onChange={(e) => handleUpdate("content.personal.phone", e.target.value)}
                          placeholder="Phone"
                          className="h-12 rounded-2xl bg-white border-slate-100"
                        />
                     </div>
                     <div className="space-y-2">
                       <Input 
                        value={resume.content.personal.location} 
                        onChange={(e) => handleUpdate("content.personal.location", e.target.value)}
                        placeholder="Location (City, State)"
                        className="h-12 rounded-2xl bg-white border-slate-100"
                       />
                     </div>
                   </div>
                 )}

                 {activeSection === "summary" && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between px-1">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Professional Story</label>
                        <div className="flex items-center gap-1">
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                disabled={isGeneratingSummarySuggestions}
                                onClick={runSummarySuggestions}
                                className="h-8 text-primary font-bold text-[10px] gap-1.5 uppercase hover:bg-primary/5"
                              >
                                {isGeneratingSummarySuggestions ? <Loader2 className="h-3 w-3 animate-spin" /> : <Target className="h-3 w-3" />}
                                Options
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[300px] p-4 bg-white/95 backdrop-blur-xl border-slate-200 shadow-2xl rounded-2xl" align="end">
                              <div className="space-y-4">
                                <div className="flex items-center justify-between border-b pb-2">
                                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">AI Variants</h3>
                                </div>
                                {summarySuggestions.length > 0 ? (
                                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                                    {summarySuggestions.map((suggestion: string, i: number) => (
                                      <button
                                        key={i}
                                        onClick={() => handleUpdate("content.summary", suggestion)}
                                        className="w-full text-left p-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all group"
                                      >
                                        <p className="text-xs text-slate-600 line-clamp-4">{suggestion}</p>
                                        <div className="mt-2 text-[8px] font-bold uppercase text-primary">Tap to apply</div>
                                      </button>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="py-4 text-center">
                                    <Sparkles className="h-6 w-6 mx-auto text-slate-200 mb-2" />
                                    <p className="text-[8px] font-bold uppercase tracking-widest text-slate-300">No suggestions yet</p>
                                  </div>
                                )}
                              </div>
                            </PopoverContent>
                          </Popover>

                          <Button 
                            variant="ghost" 
                            size="sm" 
                            disabled={isEnhancing}
                            onClick={() => runEnhanceContent("summary")}
                            className="h-8 text-primary font-bold text-[10px] gap-1.5 uppercase hover:bg-primary/5"
                          >
                            {isEnhancing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                            Enhance
                          </Button>
                        </div>
                      </div>
                      <RichTextField
                        value={resume.content.summary}
                        onChange={(val) => handleUpdate("content.summary", val)}
                        placeholder="Write your value story..."
                        minHeightClassName="min-h-[250px]"
                      />
                    </div>
                  )}

                 {activeSection === "experience" && (
                    <div className="space-y-4">
                       <div className="flex items-center justify-between">
                          <p className="text-[10px] font-black tracking-[0.15em] uppercase text-slate-400">Career History</p>
                          <Button 
                            variant="secondary" 
                            size="sm" 
                            className="rounded-xl h-9 w-9 p-0"
                            onClick={() => {
                                const newExp = [...(resume.content.experience || []), { id: Date.now(), title: "", company: "", period: "", description: "" }]
                                handleUpdate("content.experience", newExp)
                            }}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                       </div>
                       {resume.content.experience?.map((exp: any, idx: number) => (
                         <Card key={exp.id || idx} className="p-5 border-none shadow-sm space-y-4 relative overflow-hidden bg-white">
                            <div className="absolute top-2 right-2 flex items-center gap-1 bg-white/80 backdrop-blur-sm rounded-lg p-1">
                               {idx > 0 && (
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-8 w-8 text-slate-300 hover:text-slate-600"
                                    onClick={() => {
                                      const next = [...resume.content.experience]
                                      const temp = next[idx]
                                      next[idx] = next[idx - 1]
                                      next[idx - 1] = temp
                                      handleUpdate("content.experience", next)
                                    }}
                                  >
                                    <ChevronUp className="h-4 w-4" />
                                  </Button>
                               )}
                               {idx < resume.content.experience.length - 1 && (
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-8 w-8 text-slate-300 hover:text-slate-600"
                                    onClick={() => {
                                      const next = [...resume.content.experience]
                                      const temp = next[idx]
                                      next[idx] = next[idx + 1]
                                      next[idx + 1] = temp
                                      handleUpdate("content.experience", next)
                                    }}
                                  >
                                    <ChevronDown className="h-4 w-4" />
                                  </Button>
                               )}
                               <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  disabled={isEnhancing}
                                  onClick={() => runEnhanceContent("experience", idx)}
                                  className="h-8 w-8 text-primary/40 hover:text-primary transition-colors"
                                  title="Enhance existing content"
                                >
                                  <Sparkles className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  disabled={isSuggestingRoleBullets === idx || !exp.title}
                                  onClick={() => runSuggestRoleBullets(idx)}
                                  className="h-8 w-8 text-blue-400 hover:text-blue-500 transition-colors"
                                  title="Suggest bullet points based on Role Title"
                                >
                                  {isSuggestingRoleBullets === idx ? <Loader2 className="h-3 w-3 animate-spin" /> : <ListPlus className="h-3.5 w-3.5" />}
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8 text-slate-200"
                                  onClick={() => {
                                     const next = resume.content.experience.filter((_: any, i: number) => i !== idx)
                                     handleUpdate("content.experience", next)
                                  }}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                            <Input 
                              value={exp.title} 
                              onChange={(e) => {
                                const next = [...resume.content.experience]
                                next[idx] = { ...next[idx], title: e.target.value }
                                handleUpdate("content.experience", next)
                              }}
                              placeholder="Job Title"
                              className="font-bold border-none bg-slate-50 h-11 px-3 text-sm"
                            />
                            <RichTextField
                              value={exp.description}
                              onChange={(val) => {
                                const next = [...resume.content.experience]
                                next[idx] = { ...next[idx], description: val }
                                handleUpdate("content.experience", next)
                              }}
                              placeholder="Impact and results..."
                            />
                         </Card>
                       ))}
                    </div>
                 )}

                 {activeSection === "education" && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                         <p className="text-[10px] font-black tracking-[0.15em] uppercase text-slate-400">Education Details</p>
                         <Button 
                           variant="secondary" 
                           size="sm" 
                           className="rounded-xl h-9 w-9 p-0"
                           onClick={() => {
                               const next = [...(resume.content.education || []), { id: Date.now(), institution: "", degree: "", period: "", description: "" }]
                               handleUpdate("content.education", next)
                           }}
                         >
                           <Plus className="h-4 w-4" />
                         </Button>
                      </div>
                      {resume.content.education?.map((edu: any, idx: number) => (
                        <Card key={edu.id || idx} className="p-5 border-none shadow-sm space-y-4 relative overflow-hidden bg-white">
                           <div className="absolute top-2 right-2 flex items-center gap-1 bg-white/80 backdrop-blur-sm rounded-lg p-1">
                              {idx > 0 && (
                                 <Button 
                                   variant="ghost" 
                                   size="icon" 
                                   className="h-8 w-8 text-slate-300 hover:text-slate-600"
                                   onClick={() => {
                                     const next = [...resume.content.education]
                                     const temp = next[idx]
                                     next[idx] = next[idx - 1]
                                     next[idx - 1] = temp
                                     handleUpdate("content.education", next)
                                   }}
                                 >
                                   <ChevronUp className="h-4 w-4" />
                                 </Button>
                              )}
                              {idx < resume.content.education.length - 1 && (
                                 <Button 
                                   variant="ghost" 
                                   size="icon" 
                                   className="h-8 w-8 text-slate-300 hover:text-slate-600"
                                   onClick={() => {
                                     const next = [...resume.content.education]
                                     const temp = next[idx]
                                     next[idx] = next[idx + 1]
                                     next[idx + 1] = temp
                                     handleUpdate("content.education", next)
                                   }}
                                 >
                                   <ChevronDown className="h-4 w-4" />
                                 </Button>
                              )}
                              <Button 
                                 variant="ghost" 
                                 size="icon" 
                                 className="h-8 w-8 text-slate-200"
                                 onClick={() => {
                                    const next = resume.content.education.filter((_: any, i: number) => i !== idx)
                                    handleUpdate("content.education", next)
                                 }}
                               >
                                 <Trash2 className="h-3.5 w-3.5" />
                               </Button>
                           </div>
                           <Input 
                             value={edu.institution} 
                             onChange={(e) => {
                               const next = [...resume.content.education]
                               next[idx] = { ...next[idx], institution: e.target.value }
                               handleUpdate("content.education", next)
                             }}
                             placeholder="Institution Name"
                             className="font-bold border-none bg-slate-50 h-11 px-3 text-sm"
                           />
                           <Input 
                             value={edu.degree} 
                             onChange={(e) => {
                               const next = [...resume.content.education]
                               next[idx] = { ...next[idx], degree: e.target.value }
                               handleUpdate("content.education", next)
                             }}
                             placeholder="Degree"
                             className="border-none bg-slate-50 h-10 px-3 text-xs"
                           />
                        </Card>
                      ))}
                    </div>
                  )}

                  {activeSection === "skills" && (
                    <div className="space-y-4">
                      <p className="text-[10px] font-black tracking-[0.15em] uppercase text-slate-400">Technical Arsenal</p>
                      <Input 
                        placeholder="Add a skill..."
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            const val = e.currentTarget.value.trim()
                            if (val && !resume.content.skills.includes(val)) {
                              handleUpdate("content.skills", [...resume.content.skills, val])
                              e.currentTarget.value = ""
                            }
                          }
                        }}
                        className="h-14 rounded-2xl bg-white border-slate-100 shadow-sm"
                      />
                      <div className="flex flex-wrap gap-2">
                        {resume.content.skills?.map((skill: string, i: number) => (
                          <Badge key={i} variant="secondary" className="px-3 py-1.5 rounded-full bg-white border border-slate-100 font-bold text-[10px] gap-2">
                            {skill}
                            <Trash2 className="h-3 w-3 text-slate-300" onClick={() => {
                               const next = resume.content.skills.filter((_: any, idx: number) => idx !== i)
                               handleUpdate("content.skills", next)
                            }} />
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeSection === "projects" && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                         <p className="text-[10px] font-black tracking-[0.15em] uppercase text-slate-400">Creative Projects</p>
                         <Button variant="secondary" size="sm" className="rounded-xl h-9 w-9 p-0"
                           onClick={() => handleUpdate("content.projects", [...(resume.content.projects || []), { id: Date.now(), name: "", url: "", description: "" }])}>
                           <Plus className="h-4 w-4" />
                         </Button>
                      </div>
                      {resume.content.projects?.map((proj: any, idx: number) => (
                        <Card key={idx} className="p-4 border-none shadow-sm space-y-3 bg-white">
                           <Input 
                             value={proj.name} 
                             onChange={(e) => {
                               const next = [...resume.content.projects]
                               next[idx] = { ...next[idx], name: e.target.value }
                               handleUpdate("content.projects", next)
                             }}
                             placeholder="Project Name"
                             className="font-bold border-none bg-slate-50 h-10 px-3 text-xs"
                           />
                           <RichTextField
                             value={proj.description}
                             onChange={(val) => {
                               const next = [...resume.content.projects]
                               next[idx] = { ...next[idx], description: val }
                               handleUpdate("content.projects", next)
                             }}
                             placeholder="What did you build?"
                           />
                        </Card>
                      ))}
                    </div>
                  )}

                  {activeSection === "certifications" && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                         <p className="text-[10px] font-black tracking-[0.15em] uppercase text-slate-400">Accreditations</p>
                         <Button variant="secondary" size="sm" className="rounded-xl h-9 w-9 p-0"
                           onClick={() => handleUpdate("content.certifications", [...(resume.content.certifications || []), { name: "", date: "" }])}>
                           <Plus className="h-4 w-4" />
                         </Button>
                      </div>
                      <div className="space-y-2">
                        {resume.content.certifications?.map((cert: any, i: number) => (
                          <div key={i} className="flex gap-2 bg-white p-2 rounded-xl shadow-sm border border-slate-50">
                             <Input 
                              value={cert.name}
                              onChange={(e) => {
                                const next = [...resume.content.certifications]
                                next[i] = { ...cert, name: e.target.value }
                                handleUpdate("content.certifications", next)
                              }}
                              className="flex-1 border-none bg-slate-50 h-10 text-[10px] font-bold"
                            />
                            <Button variant="ghost" size="icon" onClick={() => {
                               const next = resume.content.certifications.filter((_: any, idx: number) => idx !== i)
                               handleUpdate("content.certifications", next)
                            }}>
                               <Trash2 className="h-3.5 w-3.5 text-slate-300" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeSection === "languages" && (
                    <div className="space-y-4">
                      <p className="text-[10px] font-black tracking-[0.15em] uppercase text-slate-400">Languages</p>
                      <div className="grid grid-cols-2 gap-3">
                         {resume.content.languages?.map((lang: any, i: number) => (
                           <div key={i} className="bg-white p-3 rounded-xl shadow-sm border border-slate-50 relative">
                              <Input 
                                value={lang.name}
                                onChange={(e) => {
                                  const next = [...resume.content.languages]
                                  next[i] = { ...lang, name: e.target.value }
                                  handleUpdate("content.languages", next)
                                }}
                                className="border-none bg-slate-50 h-9 p-2 text-[10px] font-bold mb-2"
                              />
                              <Input 
                                value={lang.proficiency}
                                onChange={(e) => {
                                  const next = [...resume.content.languages]
                                  next[i] = { ...lang, proficiency: e.target.value }
                                  handleUpdate("content.languages", next)
                                }}
                                className="border-none bg-slate-50 h-8 p-2 text-[9px]"
                                placeholder="Native"
                              />
                              <Button variant="ghost" size="icon" className="absolute -top-1 -right-1 h-6 w-6" onClick={() => {
                                 const next = resume.content.languages.filter((_: any, idx: number) => idx !== i)
                                 handleUpdate("content.languages", next)
                              }}>
                                 <Trash2 className="h-3 w-3 text-slate-200" />
                              </Button>
                           </div>
                         ))}
                         <Button 
                           variant="outline" 
                           onClick={() => handleUpdate("content.languages", [...(resume.content.languages || []), { name: "", proficiency: "" }])}
                           className="h-20 border-dashed border-2 rounded-xl text-slate-300 flex flex-col gap-1"
                         >
                           <Plus className="h-4 w-4" />
                           <span className="text-[8px] font-black uppercase">Add Language</span>
                         </Button>
                      </div>
                    </div>
                  )}
               </div>
            </div>
          )}
          
          {activeTab === "ai" && (
            <div className="flex flex-col h-[calc(100vh-250px)] animate-in fade-in slide-in-from-bottom-4 duration-500">
               {/* Chat Header/Agent Status */}
               <div className="flex items-center justify-between px-1 mb-6">
                 <div>
                   <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-900">Career Advisor</h2>
                   <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">Powered by Gemini 2.5</p>
                 </div>
                 {isTyping && (
                   <Badge variant="outline" className="rounded-full bg-primary/5 text-primary border-primary/10 text-[9px] font-bold py-1 px-3 animate-pulse">
                     Routing...
                   </Badge>
                 )}
               </div>

               {/* Messages List */}
               <div className="flex-1 overflow-y-auto space-y-6 pb-4 no-scrollbar">
                 {chatMessages.map((msg: any, i: number) => (
                   <div key={i} className={cn("flex flex-col", msg.role === "user" ? "items-end" : "items-start")}>
                     <div className={cn(
                       "max-w-[85%] px-5 py-4 rounded-[1.8rem] text-sm shadow-sm",
                       msg.role === "user" 
                         ? "bg-slate-900 text-white rounded-tr-none" 
                         : "bg-white border border-slate-100 text-slate-700 rounded-tl-none"
                     )}>
                       {msg.agent && msg.role === "assistant" && (
                         <div className="flex items-center gap-2 mb-2">
                            <span className="text-base">{CAREER_AGENTS[msg.agent as AgentRole].icon}</span>
                            <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">{CAREER_AGENTS[msg.agent as AgentRole].name}</span>
                         </div>
                       )}
                       <p className="leading-relaxed font-medium">{msg.text}</p>
                     </div>
                     {msg.reason && (
                       <div className="mt-2 px-4 flex items-center gap-1.5 opacity-40">
                         <div className="h-1 w-1 rounded-full bg-slate-400" />
                         <p className="text-[8px] font-bold uppercase tracking-widest text-slate-500">Picked for: {msg.reason}</p>
                       </div>
                     )}
                   </div>
                 ))}
                 {isTyping && (
                    <div className="flex items-start">
                       <div className="bg-white border border-slate-100 px-5 py-4 rounded-[1.8rem] rounded-tl-none shadow-sm flex items-center gap-2">
                          <Loader2 className="h-3 w-3 animate-spin text-primary" />
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Thinking...</span>
                       </div>
                    </div>
                 )}
               </div>

               {/* Input Area */}
               <div className="mt-4 relative">
                 <Input 
                   value={chatInput}
                   onChange={(e) => setChatInput(e.target.value)}
                   onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                   placeholder="Ask about your summary, ATS, etc..."
                   className="h-16 pl-6 pr-14 rounded-[2rem] bg-white border-slate-100 shadow-xl shadow-slate-200/50"
                 />
                 <Button 
                   onClick={handleSendMessage}
                   disabled={isTyping || !chatInput.trim()}
                   className="absolute right-2 top-2 h-12 w-12 rounded-full bg-primary text-white shadow-lg active:scale-95 transition-transform"
                 >
                   <SendHorizontal className="h-5 w-5" />
                 </Button>
               </div>
            </div>
          )}
          
          {activeTab === "design" && (
            <div className="space-y-4">
              <div className="rounded-[1.8rem] border border-white/80 bg-[linear-gradient(135deg,rgba(103,58,183,0.10),rgba(33,150,243,0.08)_56%,rgba(255,152,0,0.10))] px-5 py-5 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.38)]">
                <p className="text-[0.68rem] font-black uppercase tracking-[0.2em] text-primary">Design studio</p>
                <h2 className="mt-2 text-xl font-black tracking-tight text-slate-950">{activeTemplate.name}</h2>
                <p className="mt-2 text-sm text-slate-600">
                  Switch templates and tune typography, spacing, and brand accent without leaving your phone.
                </p>
              </div>

              <EditorDesignStudio
                compact
                resume={resume}
                plan={profile?.plan}
                onSelectTemplate={applyTemplate}
                onUpdateStyle={updateStyle}
                onResetStyles={resetTemplateStyles}
              />
            </div>
          )}
        </main>
      ) : (
        /* Mobile Preview Mode (Full Screen) */
        <main className="flex-1 bg-slate-900 min-h-[calc(100vh-140px)] flex flex-col items-center justify-center p-4 overflow-hidden">
           <div className="w-full h-full max-h-[80vh] origin-center transition-transform duration-500 scale-[0.85] flex items-center justify-center">
              <div className="bg-white shadow-[0_40px_80px_rgba(0,0,0,0.6)] rounded-[2px] w-full max-w-[340px] aspect-[1/1.41] overflow-hidden">
                <ResumeTemplate data={resume} isPrint={false} />
              </div>
           </div>
           <div className="mt-8 text-white/40 text-[10px] font-bold uppercase tracking-[0.3em] flex items-center gap-2">
              <div className="h-1 w-8 bg-white/20 rounded-full" />
              {activeTemplate.name}
              <div className="h-1 w-8 bg-white/20 rounded-full" />
           </div>
        </main>
      )}

      <BottomTabs />
    </div>
  )
}
