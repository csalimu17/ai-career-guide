"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Send, Sparkles, User, Loader2, CheckCheck, CheckCircle2, Wand2, BarChart3, Trash2, Copy } from "lucide-react"
import { interactiveAiCareerAssistant } from "@/ai/flows/interactive-ai-career-assistant-flow"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { useUser } from "@/firebase"
import { MagicEditOverlay } from "@/components/chat/MagicEditOverlay"
import { AtsReportOverlay } from "@/components/chat/AtsReportOverlay"
import { updateResumeContentAction } from "@/app/actions/resume-actions" 
import { useToast } from "@/hooks/use-toast"

type Message = {
  role: 'assistant' | 'user'
  content: string
  toolResults?: any[]
}

export default function ChatPage() {
  const { uid } = useUser()
  const { toast } = useToast()
  const endRef = useRef<HTMLDivElement | null>(null)
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "Hi! I'm Dan, your AI Career Guide. How can I help you today? I can review your CV, suggest career paths, or help with interview preparation." }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [overlayData, setOverlayData] = useState<{
    isOpen: boolean;
    original: string;
    new: string;
    resumeId: string;
    action: string;
    section?: string;
    index?: number;
  }>({
    isOpen: false,
    original: '',
    new: '',
    resumeId: '',
    action: ''
  })
  const [atsReportData, setAtsReportData] = useState<{
    isOpen: boolean;
    report: any;
  }>({
    isOpen: false,
    report: null
  })
  
  const suggestions = [
    { label: "Check CV fit", prompt: "Can you analyze how well my current CV fits a Senior Product Designer role?" },
    { label: "Interview prep", prompt: "I have an interview for a Fintech company. Can we do a mock interview?" },
    { label: "Career roadmap", prompt: "What are the typical growth paths for a Frontend Engineer moving into Management?" },
    { label: "Skills gap", prompt: "What skills are most in-demand for Al roles right now?" }
  ]

  const handleSend = async (messageText?: string) => {
    const textToSend = (messageText || input).trim()
    if (!textToSend || isLoading) return

    setInput('')
    const newUserMessage: Message = { role: 'user', content: textToSend };
    const historyForBackend = [...messages]; // History excludes the message we are currently sending
    
    setMessages(prev => [...prev, newUserMessage])
    setIsLoading(true)

    try {
      const response = await interactiveAiCareerAssistant({ 
        message: textToSend,
        history: historyForBackend,
        uid: uid || undefined
      })
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: response.response,
        toolResults: response.toolResults
      }])
    } catch (error) {
      console.error(error)
      setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I encountered an error. Please try again." }])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
  }, [messages, isLoading])

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 pb-20 pt-4 md:px-8 md:pt-8">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 -z-10 h-[500px] w-[500px] bg-indigo-500/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 -z-10 h-[400px] w-[400px] bg-blue-500/5 blur-[100px] rounded-full pointer-events-none" />

      <section className="section-shell relative overflow-hidden p-6 md:p-12">
        <div className="relative space-y-4">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl space-y-4">
              <h1 className="headline-gradient-vivid max-w-6xl pb-2 text-[1.85rem] font-black leading-[1.12] tracking-tight sm:text-[2.5rem] lg:text-[3.2rem]">
                Consult with Dan, your AI Career Mentor.
              </h1>
              <p className="max-w-2xl text-base font-medium leading-relaxed text-slate-500 md:text-lg">
                Ask about your CV strategy, research target markets, or prepare for high-stakes interviews with grounded career intelligence.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Mobile: use dvh + drop the 560px floor so the chat fits inside the viewport.
          Desktop (md+): restore the original tall card. */}
      <Card className="surface-card relative flex h-[calc(100dvh-13.5rem)] min-h-[420px] flex-col overflow-hidden border-none shadow-2xl md:h-[740px] md:min-h-[560px]">
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(248,250,252,0.98)_0%,rgba(241,245,249,0.92)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.08),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(249,115,22,0.09),transparent_24%)]" />
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-orange-500 z-10" />

        <div className="relative z-10 flex items-center justify-between gap-3 border-b border-white/80 bg-white/80 px-4 py-3 backdrop-blur-xl md:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <Avatar className="h-10 w-10 rounded-full border border-white/70 shadow-sm md:h-11 md:w-11">
              <AvatarImage src="/dan-avatar-160.webp" className="object-cover" />
              <AvatarFallback className="bg-indigo-600 text-white">
                <Sparkles className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="text-sm font-black text-slate-900">Dan</p>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-600">Online now</p>
            </div>
          </div>
          <Badge variant="secondary" className="shrink-0 rounded-full border-none bg-emerald-50 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.15em] text-emerald-700 shadow-sm md:px-3 md:text-[10px] md:tracking-widest">
            <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
            Active
          </Badge>
        </div>

        <ScrollArea className="relative z-10 flex-1 px-3 py-4 md:px-5 md:py-5">
          <div className="space-y-3">
            {messages.map((message, i) => (
              <div key={i} className={cn("flex w-full animate-in fade-in slide-in-from-bottom-2 duration-500", message.role === 'user' ? 'justify-end' : 'justify-start')}>
                <div className={cn("flex max-w-[96%] items-end gap-2 md:max-w-[78%]", message.role === 'user' ? 'flex-row-reverse' : 'flex-row')}>
                  {message.role === "assistant" ? (
                    <Avatar className="h-9 w-9 shrink-0 self-end rounded-full border border-white/80 shadow-sm">
                        <AvatarImage src="/dan-avatar-160.webp" className="object-cover" />
                        <AvatarFallback className="bg-indigo-600 text-white">
                          <Sparkles className="h-4 w-4" />
                        </AvatarFallback>
                    </Avatar>
                  ) : (
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center self-end rounded-full bg-slate-900 text-white shadow-md">
                      <User className="h-4 w-4" />
                    </div>
                  )}

                  <div className={cn(
                    "relative px-3.5 py-3 text-[14px] font-medium leading-relaxed shadow-sm md:px-4 md:text-[15px]",
                    message.role === 'user' 
                      ? 'rounded-[1.4rem] rounded-br-md bg-[#d9fdd3] text-slate-900'
                      : 'rounded-[1.4rem] rounded-bl-md border border-slate-200/80 bg-white text-slate-700'
                  )}>
                    <span
                      className={cn(
                        "absolute bottom-0 h-4 w-4",
                        message.role === "user"
                          ? "right-[-6px] bg-[#d9fdd3] [clip-path:polygon(0_0,0_100%,100%_100%)]"
                          : "left-[-6px] bg-white [clip-path:polygon(100%_0,0_100%,100%_100%)]"
                      )}
                    />
                    <p className="whitespace-pre-wrap">{message.content}</p>
                    
                    {message.role === 'assistant' && message.toolResults?.some(tr => tr.toolName === 'enhanceResumeContent') && (
                      <div className="mt-4 border-t border-slate-100 pt-3">
                        <Button 
                          onClick={() => {
                            const result = message.toolResults?.find(tr => tr.toolName === 'enhanceResumeContent')
                            setOverlayData({
                              isOpen: true,
                              original: result.input.currentCvContent || '',
                              new: result.result.enhancedContent || '',
                              resumeId: result.input.resumeId,
                              action: result.input.action,
                              section: result.input.section,
                              index: result.input.index
                            })
                          }}
                          className="h-8 w-full rounded-full bg-indigo-50 text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:bg-indigo-100 border-none shadow-none"
                        >
                          <Wand2 className="mr-2 h-3.5 w-3.5" />
                          View Improvements
                        </Button>
                      </div>
                    )}

                    {message.role === 'assistant' && message.toolResults?.some(tr => tr.toolName === 'analyzeAtsMatch') && (
                      <div className="mt-4 border-t border-slate-100 pt-3">
                        <Button 
                          onClick={() => {
                            const result = message.toolResults?.find(tr => tr.toolName === 'analyzeAtsMatch')
                            setAtsReportData({
                              isOpen: true,
                              report: result.result
                            })
                          }}
                          className="h-8 w-full rounded-full bg-emerald-50 text-[10px] font-black uppercase tracking-widest text-emerald-600 hover:bg-emerald-100 border-none shadow-none"
                        >
                          <BarChart3 className="mr-2 h-3.5 w-3.5" />
                          View ATS Report
                        </Button>
                      </div>
                    )}

                    {message.role === 'assistant' && message.toolResults?.some(tr => tr.toolName === 'createNewResume') && (
                      <div className="mt-4 border-t border-slate-100 pt-3">
                        {(() => {
                          const tr = message.toolResults?.find(r => r.toolName === 'createNewResume');
                          const match = tr?.result?.match(/with ID:\s*([a-zA-Z0-9_-]+)/);
                          const resumeId = match ? match[1] : null;
                          return (
                            <div className="flex flex-col gap-2 rounded-2xl bg-violet-50/50 border border-violet-100/80 p-3">
                              <div className="flex items-center gap-2 text-violet-700">
                                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-violet-100">
                                  <Sparkles className="h-3.5 w-3.5" />
                                </span>
                                <span className="text-[10px] font-black uppercase tracking-widest">New CV Created</span>
                              </div>
                              <p className="text-xs font-bold text-slate-700">{tr?.input?.name || "My New CV"}</p>
                              {resumeId && (
                                <Button asChild className="h-8 w-full mt-1 rounded-xl bg-violet-600 text-[10px] font-black uppercase tracking-widest text-white hover:bg-violet-700 shadow-md border-none">
                                  <Link href={`/cv-editor?id=${resumeId}&returnTo=${encodeURIComponent("/chat")}`}>
                                    Open CV Editor
                                  </Link>
                                </Button>
                              )}
                            </div>
                          )
                        })()}
                      </div>
                    )}

                    {message.role === 'assistant' && message.toolResults?.some(tr => tr.toolName === 'editResumeSection') && (
                      <div className="mt-4 border-t border-slate-100 pt-3 space-y-2">
                        {(() => {
                          const trs = message.toolResults?.filter(r => r.toolName === 'editResumeSection') || [];
                          return trs.map((tr, idx) => {
                            const resumeId = tr?.input?.resumeId;
                            const section = tr?.input?.section;
                            const action = tr?.input?.action;
                            
                            const sectionTitles: Record<string, string> = {
                              personal: "Personal Details",
                              summary: "Professional Summary",
                              experience: "Work Experience",
                              education: "Education History",
                              skills: "Skills List",
                              languages: "Languages",
                              projects: "Projects List",
                              certifications: "Certifications",
                              interests: "Interests"
                            };
                            const sectionTitle = sectionTitles[section] || section;
                            
                            let actionTitle = "Updated";
                            if (action === 'add_item') actionTitle = "Added Item to";
                            else if (action === 'delete_item') actionTitle = "Removed Item from";
                            else if (action === 'update_item') actionTitle = "Updated Item in";
                            else if (action === 'set') actionTitle = "Updated";

                            return (
                              <div key={idx} className="flex flex-col gap-2 rounded-2xl bg-indigo-50/50 border border-indigo-100/80 p-3">
                                <div className="flex items-center gap-2 text-indigo-700">
                                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-100">
                                    <Wand2 className="h-3.5 w-3.5" />
                                  </span>
                                  <span className="text-[10px] font-black uppercase tracking-widest">{actionTitle} {sectionTitle}</span>
                                </div>
                                {tr?.result?.includes("Error") ? (
                                  <p className="text-[11px] font-bold text-rose-600">{tr.result}</p>
                                ) : (
                                  <p className="text-[11px] font-bold text-slate-500">Successfully updated CV database records.</p>
                                )}
                                {resumeId && !tr?.result?.includes("Error") && (
                                  <Button asChild className="h-8 w-full mt-1 rounded-xl bg-indigo-600 text-[10px] font-black uppercase tracking-widest text-white hover:bg-indigo-700 shadow-md border-none">
                                    <Link href={`/cv-editor?id=${resumeId}&returnTo=${encodeURIComponent("/chat")}`}>
                                      Open CV Editor
                                    </Link>
                                  </Button>
                                )}
                              </div>
                            )
                          });
                        })()}
                      </div>
                    )}

                    {message.role === 'assistant' && message.toolResults?.some(tr => tr.toolName === 'deleteResume') && (
                      <div className="mt-4 border-t border-slate-100 pt-3">
                        {(() => {
                          const tr = message.toolResults?.find(r => r.toolName === 'deleteResume');
                          return (
                            <div className="flex flex-col gap-2 rounded-2xl bg-rose-50/50 border border-rose-100/80 p-3">
                              <div className="flex items-center gap-2 text-rose-700">
                                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-rose-100">
                                  <Trash2 className="h-3.5 w-3.5 text-rose-600" />
                                </span>
                                <span className="text-[10px] font-black uppercase tracking-widest">CV Deleted</span>
                              </div>
                              <p className="text-[11px] font-bold text-slate-500">Resume ID: {tr?.input?.resumeId}</p>
                              <p className="text-[10px] font-black uppercase tracking-widest text-rose-600/80">Removed from account</p>
                            </div>
                          )
                        })()}
                      </div>
                    )}

                    {message.role === 'assistant' && message.toolResults?.some(tr => tr.toolName === 'duplicateResume') && (
                      <div className="mt-4 border-t border-slate-100 pt-3">
                        {(() => {
                          const tr = message.toolResults?.find(r => r.toolName === 'duplicateResume');
                          const match = tr?.result?.match(/New ID:\s*([a-zA-Z0-9_-]+)/);
                          const resumeId = match ? match[1] : null;
                          return (
                            <div className="flex flex-col gap-2 rounded-2xl bg-fuchsia-50/50 border border-fuchsia-100/80 p-3">
                              <div className="flex items-center gap-2 text-fuchsia-700">
                                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-fuchsia-100">
                                  <Copy className="h-3.5 w-3.5 text-fuchsia-600" />
                                </span>
                                <span className="text-[10px] font-black uppercase tracking-widest">CV Duplicated</span>
                              </div>
                              <p className="text-xs font-bold text-slate-700">{tr?.input?.newName || "Duplicated Resume"}</p>
                              {resumeId && (
                                <Button asChild className="h-8 w-full mt-1 rounded-xl bg-fuchsia-600 text-[10px] font-black uppercase tracking-widest text-white hover:bg-fuchsia-700 shadow-md border-none">
                                  <Link href={`/cv-editor?id=${resumeId}&returnTo=${encodeURIComponent("/chat")}`}>
                                    Open CV Editor
                                  </Link>
                                </Button>
                              )}
                            </div>
                          )
                        })()}
                      </div>
                    )}

                    {message.role === 'assistant' && message.toolResults?.some(tr => tr.toolName === 'saveJobToTracker' || tr.toolName === 'addJobApplication') && (
                      <div className="mt-4 border-t border-slate-100 pt-3">
                        {(() => {
                          const tr = message.toolResults?.find(r => r.toolName === 'saveJobToTracker' || r.toolName === 'addJobApplication');
                          const role = tr?.input?.role || tr?.input?.listing?.role || "Job Opportunity";
                          const company = tr?.input?.company || tr?.input?.listing?.company || "Company";
                          return (
                            <div className="flex flex-col gap-2 rounded-2xl bg-emerald-50/50 border border-emerald-100/80 p-3">
                              <div className="flex items-center gap-2 text-emerald-700">
                                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100">
                                  <CheckCheck className="h-3.5 w-3.5 text-emerald-600" />
                                </span>
                                <span className="text-[10px] font-black uppercase tracking-widest">Job Saved to Tracker</span>
                              </div>
                              <p className="text-xs font-bold text-slate-700">{role} at {company}</p>
                              <Button asChild className="h-8 w-full mt-1 rounded-xl bg-emerald-600 text-[10px] font-black uppercase tracking-widest text-white hover:bg-emerald-700 shadow-md border-none">
                                <Link href="/tracker">
                                  Open Job Tracker
                                </Link>
                              </Button>
                            </div>
                          )
                        })()}
                      </div>
                    )}

                    {message.role === 'assistant' && message.toolResults?.some(tr => tr.toolName === 'updateJobApplicationStatus') && (
                      <div className="mt-4 border-t border-slate-100 pt-3">
                        {(() => {
                          const tr = message.toolResults?.find(r => r.toolName === 'updateJobApplicationStatus');
                          const newStatus = tr?.input?.newStatus;
                          return (
                            <div className="flex flex-col gap-2 rounded-2xl bg-sky-50/50 border border-sky-100/80 p-3">
                              <div className="flex items-center gap-2 text-sky-700">
                                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-sky-100">
                                  <CheckCheck className="h-3.5 w-3.5 text-sky-600" />
                                </span>
                                <span className="text-[10px] font-black uppercase tracking-widest">Tracker Status Updated</span>
                              </div>
                              <p className="text-xs font-bold text-slate-700">Status set to: <Badge className="bg-sky-100 text-sky-800 border-none font-bold uppercase tracking-wider text-[9px]">{newStatus}</Badge></p>
                              <Button asChild className="h-8 w-full mt-1 rounded-xl bg-sky-600 text-[10px] font-black uppercase tracking-widest text-white hover:bg-sky-700 shadow-md border-none">
                                <Link href="/tracker">
                                  Open Job Tracker
                                </Link>
                              </Button>
                            </div>
                          )
                        })()}
                      </div>
                    )}

                    <div className="mt-2 flex items-center justify-end gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                      <span>{message.role === "user" ? "You" : "Dan"}</span>
                      {message.role === "user" && <CheckCheck className="h-3.5 w-3.5 text-sky-500" />}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start animate-in fade-in duration-300">
                <div className="flex items-end gap-2">
                  <Avatar className="h-9 w-9 rounded-full border border-white/80 shadow-sm">
                    <AvatarImage src="/dan-avatar-160.webp" className="object-cover" />
                    <AvatarFallback className="bg-indigo-600 text-white">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="relative rounded-[1.4rem] rounded-bl-md border border-slate-200/80 bg-white px-4 py-3 shadow-sm">
                    <span className="absolute bottom-0 left-[-6px] h-4 w-4 bg-white [clip-path:polygon(100%_0,0_100%,100%_100%)]" />
                    <div className="flex gap-1.5">
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-300 delay-0" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-300 delay-150" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-300 delay-300" />
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>
        </ScrollArea>

        <div className="relative z-10 border-t border-white/80 bg-white/78 p-4 backdrop-blur-xl md:px-6 md:py-5">
            <div className="mx-auto max-w-4xl space-y-3 md:space-y-4">
              {!isLoading && messages.length < 5 && (
              <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1 md:flex-wrap md:justify-center">
                {suggestions.map((s) => (
                  <button
                    key={s.label}
                    onClick={() => handleSend(s.prompt)}
                    className="tap-bounce shrink-0 whitespace-nowrap rounded-full border border-slate-200 bg-white px-3.5 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-slate-600 shadow-sm transition-all hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 md:px-4 md:text-[11px] md:tracking-widest"
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            )}

            <form 
              onSubmit={(e) => { e.preventDefault(); handleSend(); }}
              className="group relative flex items-end gap-2.5 md:gap-3"
            >
              <div className="relative flex-1 rounded-[1.8rem] border border-slate-200 bg-white shadow-sm">
                <Input 
                  placeholder="Message Dan..." 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={isLoading}
                  className="h-12 rounded-[1.6rem] border-0 bg-transparent px-4 pr-20 text-[14px] font-medium text-slate-900 shadow-none transition-all focus-visible:ring-0 disabled:opacity-50 md:h-14 md:rounded-[1.8rem] md:px-5 md:pr-24 md:text-[15px]"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 md:right-4">
                   <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.14em] text-slate-300 md:text-[10px] md:tracking-widest">
                     <span className="hidden sm:inline">Enter</span>
                     <div className="flex h-5 w-5 items-center justify-center rounded border border-slate-200 bg-slate-50">↵</div>
                   </div>
                </div>
              </div>
              <Button 
                disabled={isLoading || !input.trim()}
                type="submit"
                className="tap-bounce h-12 w-12 rounded-full border-0 bg-emerald-500 text-white shadow-lg shadow-emerald-200 transition-all hover:bg-emerald-600 disabled:opacity-50 md:h-14 md:w-14"
              >
                <Send className="h-5 w-5" />
              </Button>
            </form>
            <p className="text-center text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
              Private chat style • Career guidance by Dan
            </p>
          </div>
        </div>
      </Card>

      <MagicEditOverlay 
        isOpen={overlayData.isOpen}
        onClose={() => setOverlayData(prev => ({ ...prev, isOpen: false }))}
        originalContent={overlayData.original}
        newContent={overlayData.new}
        toolAction={overlayData.action}
        onApply={async (content) => {
          if (!uid || !overlayData.resumeId || !overlayData.section) {
            toast({
              title: "Update failed",
              description: "Missing required metadata (resume ID or section).",
              variant: "destructive"
            });
            return;
          }
          try {
            const result = await updateResumeContentAction({
              resumeId: overlayData.resumeId,
              section: overlayData.section,
              content: content,
              index: overlayData.index,
              uid: uid
            })
            if (result.success) {
              toast({
                title: "Success",
                description: "Resume updated successfully!",
              })
            } else {
              throw new Error(result.error)
            }
          } catch (e: any) {
            toast({
              title: "Error",
              description: e.message || "Failed to update resume.",
              variant: "destructive"
            })
            throw e
          }
        }}
      />

      <AtsReportOverlay 
        isOpen={atsReportData.isOpen}
        onClose={() => setAtsReportData(prev => ({ ...prev, isOpen: false }))}
        report={atsReportData.report}
      />
    </div>
  )
}
