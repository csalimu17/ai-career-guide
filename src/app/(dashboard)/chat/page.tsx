"use client"

import { useState, useRef, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Send, Sparkles, User, Loader2, CheckCheck, CheckCircle2 } from "lucide-react"
import { interactiveAiCareerAssistant } from "@/ai/flows/interactive-ai-career-assistant-flow"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { useUser } from "@/firebase"

type Message = {
  role: 'assistant' | 'user'
  content: string
}

export default function ChatPage() {
  const { uid } = useUser()
  const endRef = useRef<HTMLDivElement | null>(null)
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "Hi! I'm Dan, your AI Career Guide. How can I help you today? I can review your CV, suggest career paths, or help with interview preparation." }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  
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
      setMessages(prev => [...prev, { role: 'assistant', content: response.response }])
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
              <h1 className="headline-gradient-vivid text-[2.5rem] font-black leading-[0.95] tracking-tight sm:text-[3.5rem] lg:text-5xl">
                Consult with Dan, your AI Career Mentor.
              </h1>
              <p className="max-w-2xl text-base font-medium leading-relaxed text-slate-500 md:text-lg">
                Ask about your CV strategy, research target markets, or prepare for high-stakes interviews with grounded career intelligence.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Card className="surface-card relative flex h-[740px] flex-col overflow-hidden border-none shadow-2xl">
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(248,250,252,0.98)_0%,rgba(241,245,249,0.92)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.08),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(249,115,22,0.09),transparent_24%)]" />
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-orange-500 z-10" />

        <div className="relative z-10 flex items-center justify-between border-b border-white/80 bg-white/80 px-4 py-3 backdrop-blur-xl md:px-6">
          <div className="flex items-center gap-3">
            <Avatar className="h-11 w-11 rounded-full border border-white/70 shadow-sm">
              <AvatarImage src="/dan-avatar.png" className="object-cover" />
              <AvatarFallback className="bg-indigo-600 text-white">
                <Sparkles className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-black text-slate-900">Dan</p>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-600">Online now</p>
            </div>
          </div>
          <Badge variant="secondary" className="rounded-full border-none bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-700 shadow-sm">
            <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
            Active
          </Badge>
        </div>

        <ScrollArea className="relative z-10 flex-1 px-3 py-5 md:px-5">
          <div className="space-y-3">
            {messages.map((message, i) => (
              <div key={i} className={cn("flex w-full animate-in fade-in slide-in-from-bottom-2 duration-500", message.role === 'user' ? 'justify-end' : 'justify-start')}>
                <div className={cn("flex max-w-[92%] items-end gap-2 md:max-w-[78%]", message.role === 'user' ? 'flex-row-reverse' : 'flex-row')}>
                  {message.role === "assistant" ? (
                    <Avatar className="h-9 w-9 shrink-0 self-end rounded-full border border-white/80 shadow-sm">
                        <AvatarImage src="/dan-avatar.png" className="object-cover" />
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
                    "relative px-4 py-3 text-[15px] font-medium leading-relaxed shadow-sm",
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
                    <AvatarImage src="/dan-avatar.png" className="object-cover" />
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
          <div className="mx-auto max-w-4xl space-y-4">
            {!isLoading && messages.length < 5 && (
              <div className="flex flex-wrap justify-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                {suggestions.map((s) => (
                  <button
                    key={s.label}
                    onClick={() => handleSend(s.prompt)}
                    className="tap-bounce whitespace-nowrap rounded-full border border-slate-200 bg-white px-4 py-2 text-[11px] font-black uppercase tracking-widest text-slate-600 shadow-sm transition-all hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            )}

            <form 
              onSubmit={(e) => { e.preventDefault(); handleSend(); }}
              className="group relative flex items-end gap-3"
            >
              <div className="relative flex-1 rounded-[1.8rem] border border-slate-200 bg-white shadow-sm">
                <Input 
                  placeholder="Message Dan..." 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={isLoading}
                  className="h-14 rounded-[1.8rem] border-0 bg-transparent px-5 pr-24 text-[15px] font-medium text-slate-900 shadow-none transition-all focus-visible:ring-0 disabled:opacity-50"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                   <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-300">
                     <span className="hidden sm:inline">Enter</span>
                     <div className="flex h-5 w-5 items-center justify-center rounded border border-slate-200 bg-slate-50">↵</div>
                   </div>
                </div>
              </div>
              <Button 
                disabled={isLoading || !input.trim()}
                type="submit"
                className="tap-bounce h-14 w-14 rounded-full border-0 bg-emerald-500 text-white shadow-lg shadow-emerald-200 transition-all hover:bg-emerald-600 disabled:opacity-50"
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
    </div>
  )
}
