"use client"

import * as React from "react"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { 
  Plus, 
  MessageSquare, 
  Video, 
  Settings2, 
  History, 
  Sparkles,
  Zap,
  Globe,
  Briefcase,
  ChevronRight,
  Play,
  CheckCircle2,
  Trophy,
  Target,
  BrainCircuit,
  ArrowRight,
  User,
  X,
  Mic,
  MicOff,
  Volume2,
  VolumeX
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, limit, orderBy, doc } from "firebase/firestore"
import Link from "next/link"
import { useDoc } from "@/firebase"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Loader2 } from "lucide-react"
import { 
  generateInterviewQuestionsAction, 
  analyzeInterviewResponseAction 
} from "@/app/actions/interview-actions"
import { useToast } from "@/hooks/use-toast"

export default function InterviewPrepPage() {
  const { user, uid } = useUser()
  const db = useFirestore()
  const { toast } = useToast()
  const [selectedTab, setSelectedTab] = React.useState<"overview" | "history">("overview")
  
  // Simulator State
  const [isSimulating, setIsSimulating] = React.useState(false)
  const [simStep, setSimStep] = React.useState<"config" | "session" | "feedback">("config")
  const [selectedModule, setSelectedModule] = React.useState<string | null>(null)
  const [questions, setQuestions] = React.useState<any[]>([])
  const [currentQuestionIdx, setCurrentQuestionIdx] = React.useState(0)
  const [userAnswer, setUserAnswer] = React.useState("")
  const [isGenerating, setIsGenerating] = React.useState(false)
  const [feedback, setFeedback] = React.useState<any>(null)
  const [loadingStep, setLoadingStep] = React.useState(0)

  // Multimodal Voice State
  const [isVoiceEnabled, setIsVoiceEnabled] = React.useState(false)
  const [isListening, setIsListening] = React.useState(false)
  const recognitionRef = React.useRef<any>(null)

  // Cycle loading messages when generating
  React.useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isGenerating) {
      interval = setInterval(() => {
        setLoadingStep(prev => (prev + 1) % 3)
      }, 2500)
    } else {
      setLoadingStep(0)
    }
    return () => clearInterval(interval)
  }, [isGenerating])

  // Speech Recognition Initialization
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition()
        recognitionRef.current.continuous = true
        recognitionRef.current.interimResults = false // Better for step-by-step interview
        
        recognitionRef.current.onresult = (event: any) => {
          const transcript = event.results[event.results.length - 1][0].transcript
          setUserAnswer(prev => prev + (prev ? " " : "") + transcript)
        }

        recognitionRef.current.onend = () => {
          setIsListening(false)
        }

        recognitionRef.current.onerror = (event: any) => {
          console.error("Speech Recognition Error:", event.error)
          setIsListening(false)
        }
      }
    }
  }, [])

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop()
    } else {
      try {
        recognitionRef.current?.start()
        setIsListening(true)
      } catch (e) {
        console.warn("Recognition already started or error:", e)
      }
    }
  }

  const speak = React.useCallback((text: string) => {
    if (!isVoiceEnabled || typeof window === "undefined") return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 0.95
    utterance.pitch = 1
    // Find a nice professional voice if available
    const voices = window.speechSynthesis.getVoices()
    const preferredVoice = voices.find(v => v.name.includes("Google UK English Male") || v.name.includes("Daniel"))
    if (preferredVoice) utterance.voice = preferredVoice
    
    window.speechSynthesis.speak(utterance)
  }, [isVoiceEnabled])

  // Speak question when it changes
  React.useEffect(() => {
    if (simStep === "session" && questions.length > 0 && !isGenerating) {
      speak(questions[currentQuestionIdx].question)
    }
  }, [currentQuestionIdx, simStep, isGenerating, questions, speak])

  const userDocRef = useMemoFirebase(() => {
    if (!db || !uid) return null;
    return doc(db, "users", uid);
  }, [db, uid]);

  const { data: profile, isLoading: isProfileLoading } = useDoc(userDocRef);

  const startSimulation = async (module: string) => {
    setSelectedModule(module)
    setIsSimulating(true)
    setSimStep("session")
    setIsGenerating(true)
    
    try {
      const typeMap: Record<string, "technical" | "behavioral" | "mixed"> = {
        "Technical": "technical",
        "Behavioral": "behavioral",
        "Full Mock": "mixed",
        "Target Role": "mixed"
      }

      const result = await generateInterviewQuestionsAction({
        jobTitle: profile?.targetRole || "Software Professional",
        jobDescription: "", // Could be pulled from active resume
        interviewType: typeMap[module] || "mixed",
        count: 3
      });

      if (result.success && result.data) {
        setQuestions(result.data.questions)
      } else {
        throw new Error(result.error)
      }
    } catch (e: any) {
      toast({
        title: "Simulation Error",
        description: e.message || "Could not generate questions. Please try again.",
        variant: "destructive"
      })
      setIsSimulating(false)
    } finally {
      setIsGenerating(false)
    }
  }

  const submitAnswer = async () => {
    if (!userAnswer.trim()) return
    setIsGenerating(true)
    
    try {
      const result = await analyzeInterviewResponseAction({
        question: questions[currentQuestionIdx].question,
        answer: userAnswer
      });

      if (result.success && result.data) {
        setFeedback(result.data)
        setSimStep("feedback")
      } else {
        throw new Error(result.error)
      }
    } catch (e: any) {
       toast({
        title: "Analysis Failure",
        description: "Dan is having trouble analyzing that answer. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const nextQuestion = () => {
    if (currentQuestionIdx < questions.length - 1) {
      setCurrentQuestionIdx(prev => prev + 1)
      setUserAnswer("")
      setSimStep("session")
      setFeedback(null)
    } else {
      setIsSimulating(false)
      setSimStep("config")
      setQuestions([])
      setCurrentQuestionIdx(0)
    }
  }

  const normalizedPlan = (profile?.plan || "").toLowerCase().replace(/\s+/g, '')
  const isPro = normalizedPlan === 'pro' || normalizedPlan === 'master'
  const isMaster = normalizedPlan === 'master'

  if (isProfileLoading) {
     return (
        <div className="flex min-h-[80vh] items-center justify-center">
            <Sparkles className="h-10 w-10 animate-pulse text-indigo-600" />
        </div>
     )
  }

  if (!isMaster && !isPro) {
    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center p-6 text-center">
        <div className="relative mb-8">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute -inset-4 rounded-full bg-gradient-to-tr from-indigo-500/20 via-purple-500/20 to-pink-500/20 blur-xl"
          />
          <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl bg-white shadow-2xl ring-1 ring-indigo-50">
            <Zap className="h-10 w-10 text-indigo-600" />
          </div>
        </div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight sm:text-4xl">Premium Feature</h1>
        <p className="mt-4 max-w-md text-lg font-medium text-slate-500 leading-relaxed">
          The AI Interview Simulator is available exclusively for Master and Pro members. Get unlimited simulations and real-time AI coaching today.
        </p>
        <div className="mt-10 flex flex-col gap-4 sm:flex-row">
          <Button asChild size="lg" className="h-14 rounded-2xl bg-indigo-600 px-8 text-base font-black uppercase tracking-widest shadow-xl shadow-indigo-600/20 hover:bg-indigo-700">
            <Link href="/settings">Upgrade to Master</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="h-14 rounded-2xl px-8 text-base font-black uppercase tracking-widest text-slate-600">
            <Link href="/dashboard">Return to Dashboard</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8 pb-20 p-6 sm:p-10">
      {/* Header Section */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-slate-900 px-8 py-12 text-white shadow-2xl xl:px-16 xl:py-20">
        <div className="absolute right-0 top-0 h-full w-1/2 opacity-20">
          <div className="absolute inset-0 bg-gradient-to-l from-indigo-600 via-transparent to-transparent" />
          <div className="h-full w-full bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.1)_1px,transparent_0)] bg-[length:24px_24px]" />
        </div>
        
        <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl space-y-6">

            <h1 className="text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
              Win the Job Before the <span className="text-indigo-400">First Handshake.</span>
            </h1>
            <p className="text-lg font-medium text-slate-400 leading-relaxed max-w-xl">
              Meet your new AI interview coach. Train with hyper-realistic scenarios 
              tailored to your target company and career level.
            </p>
            <div className="flex flex-wrap gap-4 pt-2">
              <Button 
                size="lg" 
                onClick={() => startSimulation("Target Role")}
                className="h-14 rounded-2xl bg-white px-8 text-base font-black uppercase tracking-widest text-indigo-900 shadow-xl hover:bg-slate-50"
              >
                <Play className="mr-2 h-5 w-5 fill-indigo-900" /> Start Mission
              </Button>
              <Button size="lg" variant="outline" className="h-14 rounded-2xl border-white/20 bg-white/5 px-8 text-base font-black uppercase tracking-widest text-white backdrop-blur-md hover:bg-white/10">
                <History className="mr-2 h-5 w-5" /> Past Runs
              </Button>
            </div>
          </div>

          <div className="hidden lg:block">
            <div className="relative">
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                className="absolute -inset-20 bg-indigo-600/30 blur-[100px]"
              />
              <Card className="relative w-[340px] overflow-hidden rounded-3xl border-none bg-white/5 p-6 backdrop-blur-xl ring-1 ring-white/20 shadow-2xl">
                <div className="mb-6 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-2xl bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/40">
                      <BrainCircuit className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black uppercase tracking-wider text-orange-500">Guardian AI</h4>
                      <div className="flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Analyser</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/10">
                    <p className="text-xs font-bold text-slate-300">"I'll analyze your body language, tone, and technical precision in real-time."</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-emerald-500/10 p-3 ring-1 ring-emerald-500/20 text-center">
                      <div className="text-xl font-black text-emerald-400">98%</div>
                      <div className="text-[8px] font-bold uppercase tracking-widest text-slate-500">Clarity Score</div>
                    </div>
                    <div className="rounded-xl bg-orange-500/10 p-3 ring-1 ring-orange-500/20 text-center">
                      <div className="text-xl font-black text-orange-400">Low</div>
                      <div className="text-[8px] font-bold uppercase tracking-widest text-slate-500">Stress Risk</div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Areas */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Step 1: Scenario Configuration */}
        <div className="lg:col-span-2 space-y-8">
           <div className="flex items-center justify-between">
             <h2 className="text-xl font-black text-slate-900 uppercase tracking-widest">Training Modules</h2>
             <Badge className="bg-slate-100 text-slate-500 border-none font-bold">3 MODULES ACTIVE</Badge>
           </div>

           <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
             <Card 
               onClick={() => startSimulation("Technical")}
               className="group cursor-pointer overflow-hidden rounded-[2rem] border-none bg-white shadow-sm ring-1 ring-slate-100 transition-all hover:shadow-xl hover:shadow-indigo-500/5"
             >
               <CardHeader className="p-8 pb-4">
                 <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-[1.25rem] bg-indigo-50 text-indigo-600 transition-colors group-hover:bg-indigo-600 group-hover:text-white">
                   <Target className="h-7 w-7" />
                 </div>
                 <CardTitle className="text-xl font-black tracking-tight text-slate-900 group-hover:text-indigo-600 transition-colors">Technical Deep-Dive</CardTitle>
                 <CardDescription className="text-sm font-medium leading-relaxed">System design, algorithm drills, and role-specific technical scrutiny.</CardDescription>
               </CardHeader>
               <CardContent className="p-8 pt-4">
                 <Button variant="ghost" className="h-10 rounded-xl px-0 font-black uppercase text-xs tracking-widest text-slate-400 group-hover:text-indigo-600">
                   Configure Session <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                 </Button>
               </CardContent>
             </Card>

             <Card 
               onClick={() => startSimulation("Behavioral")}
               className="group cursor-pointer overflow-hidden rounded-[2rem] border-none bg-white shadow-sm ring-1 ring-slate-100 transition-all hover:shadow-xl hover:shadow-indigo-500/5"
             >
               <CardHeader className="p-8 pb-4">
                 <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-[1.25rem] bg-purple-50 text-purple-600 transition-colors group-hover:bg-purple-600 group-hover:text-white">
                   <User className="h-7 w-7" />
                 </div>
                 <CardTitle className="text-xl font-black tracking-tight text-slate-900 group-hover:text-purple-600 transition-colors">Behavioral Excellence</CardTitle>
                 <CardDescription className="text-sm font-medium leading-relaxed">Master the STAR method with AI feedback on situational storytelling.</CardDescription>
               </CardHeader>
               <CardContent className="p-8 pt-4">
                 <Button variant="ghost" className="h-10 rounded-xl px-0 font-black uppercase text-xs tracking-widest text-slate-400 group-hover:text-purple-600">
                   Configure Session <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                 </Button>
               </CardContent>
             </Card>

             <Card 
               onClick={() => startSimulation("Full Mock")}
               className="group cursor-pointer overflow-hidden rounded-[2rem] border-none bg-white shadow-sm ring-1 ring-slate-100 transition-all hover:shadow-xl hover:shadow-indigo-500/5 md:col-span-2"
             >
               <div className="flex flex-col md:flex-row">
                 <CardHeader className="flex-1 p-8">
                   <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-[1.25rem] bg-emerald-50 text-emerald-600 transition-colors group-hover:bg-emerald-600 group-hover:text-white">
                     <Globe className="h-7 w-7" />
                   </div>
                   <CardTitle className="text-xl font-black tracking-tight text-slate-900 group-hover:text-emerald-600 transition-colors">Full Mock Battle</CardTitle>
                   <CardDescription className="text-sm font-medium leading-relaxed max-w-md">30-minute high-pressure simulation covering everything from introduction to compensation negotiation.</CardDescription>
                 </CardHeader>
                 <CardContent className="flex items-center justify-end p-8">
                   <Button className="h-12 rounded-xl bg-slate-900 font-black uppercase text-xs tracking-widest text-white shadow-lg group-hover:bg-emerald-600">
                     Enter Simulator
                   </Button>
                 </CardContent>
               </div>
             </Card>
           </div>
        </div>

        {/* Sidebar: Status & Stats */}
        <div className="space-y-8">
           <Card className="overflow-hidden rounded-[2rem] border-none bg-slate-900 text-white shadow-2xl">
              <CardHeader className="border-b border-white/10 p-8">
                 <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-yellow-500" />
                    Overall Progression
                 </CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                 <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-black uppercase tracking-widest text-slate-400">
                       <span>Readiness score</span>
                       <span className="text-white">74%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-800">
                       <motion.div 
                         initial={{ width: 0 }}
                         animate={{ width: "74%" }}
                         transition={{ duration: 1, ease: "easeOut" }}
                         className="h-full rounded-full bg-indigo-500" 
                       />
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center">
                       <div className="text-2xl font-black">12</div>
                       <div className="text-[8px] font-bold uppercase tracking-widest text-slate-500">Draft Questions</div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center">
                       <div className="text-2xl font-black">4</div>
                       <div className="text-[8px] font-bold uppercase tracking-widest text-slate-500">Mock Runs</div>
                    </div>
                 </div>

                 <div className="pt-4">
                    <Button variant="outline" className="w-full h-11 rounded-xl border-white/20 bg-white/5 font-black uppercase text-[10px] tracking-widest hover:bg-white/10">
                       Download Readiness Report
                    </Button>
                 </div>
              </CardContent>
           </Card>

           <Card className="rounded-[2rem] border-none bg-white shadow-sm ring-1 ring-slate-100">
              <CardHeader className="p-8 pb-4">
                 <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2 text-slate-900">
                    <History className="h-4 w-4 text-indigo-600" />
                    Recent Activity
                 </CardTitle>
              </CardHeader>
              <CardContent className="p-8 pt-4 space-y-4">
                 {[1, 2].map((i) => (
                   <div key={i} className="flex items-center gap-4 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-100">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-slate-100">
                         <Briefcase className="h-4 w-4 text-slate-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                         <p className="truncate text-xs font-black text-slate-900 uppercase tracking-tight">Software Engineer</p>
                         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Google • 2 days ago</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-300" />
                   </div>
                 ))}
                 <Button variant="ghost" className="w-full h-10 font-black uppercase text-[10px] tracking-widest text-indigo-600 hover:bg-indigo-50">
                    View Full History
                 </Button>
              </CardContent>
           </Card>
        </div>
      </div>

      {/* Simulator Dialog */}
      <Dialog open={isSimulating} onOpenChange={setIsSimulating}>
        <DialogContent className="max-w-2xl rounded-[2rem] p-0 overflow-hidden border-none shadow-2xl">
           <div className="bg-slate-900 p-8 text-white relative">
              <DialogClose className="absolute top-6 right-6 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-all z-[110] flex items-center justify-center outline-none ring-0">
                 <X className="h-5 w-5 text-white" />
              </DialogClose>
              <DialogHeader>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                       <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-500 shadow-lg shadow-indigo-500/40">
                          <Play className="h-5 w-5 fill-white" />
                       </div>
                       <Badge className="bg-white/10 text-white border-none font-black text-[9px] tracking-widest">SESSION ACTIVE</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                       <Button 
                         variant="ghost" 
                         size="icon"
                         onClick={() => setIsVoiceEnabled(!isVoiceEnabled)}
                         className={cn("h-10 w-10 rounded-xl transition-all", isVoiceEnabled ? "bg-indigo-500 text-white" : "bg-white/10 text-slate-400")}
                       >
                         {isVoiceEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                       </Button>
                    </div>
                  </div>
                  <DialogTitle className="text-3xl font-black uppercase tracking-tight">
                     {selectedModule} Simulation
                  </DialogTitle>
                  <DialogDescription className="text-slate-400 font-medium">
                     Question {currentQuestionIdx + 1} of {questions.length}
                  </DialogDescription>
               </DialogHeader>
           </div>

           <div className="p-8 space-y-6 bg-white min-h-[400px]">
              {isGenerating ? (
                <div className="flex flex-col items-center justify-center h-[400px] gap-8">
                   <div className="relative flex items-center justify-center">
                      <motion.div 
                        animate={{ rotate: 360 }}
                        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                        className="h-28 w-28 rounded-full border-2 border-indigo-500/20 border-t-indigo-600 shadow-2xl shadow-indigo-500/20" 
                      />
                      <div className="absolute flex items-center justify-center">
                        <motion.div
                          initial={{ scale: 0.8 }}
                          animate={{ scale: [1, 1.15, 1] }}
                          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                        >
                          <div className="relative h-56 w-56">
                            <Image 
                              src="/logo-mascot.png" 
                              alt="AI Strategist" 
                              fill
                              className="object-contain" 
                              priority
                            />
                          </div>
                        </motion.div>
                      </div>
                      
                      {/* Floating Particles */}
                      {[0, 1, 2, 3].map((i) => (
                        <motion.div
                          key={i}
                          animate={{ 
                            y: [0, -20, 0],
                            x: [0, i % 2 === 0 ? 10 : -10, 0],
                            opacity: [0, 1, 0]
                          }}
                          transition={{ 
                            duration: 2, 
                            repeat: Infinity, 
                            delay: i * 0.5,
                            ease: "easeInOut"
                          }}
                          className="absolute h-1 w-1 rounded-full bg-indigo-400"
                        />
                      ))}
                   </div>

                   <div className="text-center space-y-3">
                      <motion.div
                        key={currentQuestionIdx} // Simple trick to animate text changes
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col items-center gap-1"
                      >
                         <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">
                           {simStep === "session" ? "Generating Simulation" : "Analyzing Response"}
                         </h3>
                         <div className="flex items-center gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                               {simStep === "session" 
                                 ? ["Mapping career trajectory...", "Optimizing industry scenarios...", "Calibrating stress levels..."][loadingStep] 
                                 : ["Deconstructing STAR structure...", "Measuring semantic impact...", "Synthesizing feedback..."][loadingStep]
                               }
                            </p>
                         </div>
                      </motion.div>
                   </div>
                </div>
              ) : simStep === "session" ? (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                   <div className="rounded-2xl bg-slate-50 p-6 ring-1 ring-slate-100">
                      <h4 className="text-lg font-bold text-slate-900 leading-tight">
                         {questions[currentQuestionIdx]?.question}
                      </h4>
                      <div className="mt-4 flex items-center gap-4">
                         <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                            <Target className="h-3 w-3" /> {questions[currentQuestionIdx]?.type}
                         </div>
                         <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-indigo-500">
                            <Sparkles className="h-3 w-3" /> {questions[currentQuestionIdx]?.tips}
                         </div>
                      </div>
                   </div>

                   <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Your Response</label>
                        <Button
                          onClick={toggleListening}
                          variant="outline"
                          size="sm"
                          className={cn(
                            "h-8 rounded-full border-none px-3 text-[9px] font-black uppercase tracking-widest transition-all",
                            isListening ? "bg-rose-500 text-white animate-pulse" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                          )}
                        >
                          {isListening ? (
                            <>
                              <MicOff className="mr-1.5 h-3 w-3" /> Stop Recording
                            </>
                          ) : (
                            <>
                              <Mic className="mr-1.5 h-3 w-3" /> Answer with Voice
                            </>
                          )}
                        </Button>
                      </div>
                      <Textarea 
                        placeholder={isListening ? "Listening to your answer..." : "Type your answer here... (Focus on results and context)"}
                        value={userAnswer}
                        onChange={(e) => setUserAnswer(e.target.value)}
                        className={cn(
                          "min-h-[180px] rounded-2xl border-slate-100 bg-slate-50 font-medium text-sm focus:ring-indigo-500 transition-all",
                          isListening && "ring-2 ring-rose-500/20 bg-rose-50/10"
                        )}
                      />
                   </div>
                </motion.div>
              ) : (
                <motion.div 
                   initial={{ opacity: 0, scale: 0.95 }}
                   animate={{ opacity: 1, scale: 1 }}
                   className="space-y-6"
                >
                   <div className="flex items-center justify-between gap-4">
                      <div className="flex-1 rounded-2xl bg-indigo-600 p-6 text-white shadow-lg shadow-indigo-600/20">
                         <div className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">AI Analysis Score</div>
                         <div className="mt-1 text-5xl font-black tracking-tighter">{feedback?.score}%</div>
                      </div>
                      <div className="flex-1 space-y-2">
                         <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Performance Feedback</div>
                         <p className="text-[13px] font-medium leading-relaxed text-slate-600">{feedback?.feedback}</p>
                      </div>
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-3">
                         <h5 className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Key Strengths</h5>
                         {feedback?.strengths.map((s: string) => (
                           <div key={s} className="flex items-center gap-2 text-[11px] font-bold text-slate-600">
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> {s}
                           </div>
                         ))}
                      </div>
                      <div className="space-y-3">
                         <h5 className="text-[10px] font-black uppercase tracking-widest text-orange-600">Top Improvements</h5>
                         {feedback?.improvements.map((i: string) => (
                           <div key={i} className="flex items-center gap-2 text-[11px] font-bold text-slate-600">
                              <Plus className="h-3.5 w-3.5 rotate-45 text-orange-500" /> {i}
                           </div>
                         ))}
                      </div>
                   </div>

                   <div className="rounded-2xl bg-slate-900 p-6 text-white overflow-y-auto max-h-[150px]">
                      <h5 className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-2">Model Answer (AI Suggested)</h5>
                      <p className="text-[11px] font-medium leading-relaxed text-slate-300 italic">"{feedback?.suggestedAnswer}"</p>
                   </div>
                </motion.div>
              )}
           </div>

           <DialogFooter className="p-8 bg-slate-50 border-t border-slate-100 sm:justify-between">
              <Button variant="ghost" onClick={() => setIsSimulating(false)} className="rounded-xl font-black uppercase text-[10px] tracking-widest text-slate-500">
                 Abort Mission
              </Button>
              {simStep === "session" ? (
                <Button 
                   onClick={submitAnswer} 
                   disabled={!userAnswer.trim() || isGenerating}
                   className="h-12 px-8 rounded-xl bg-slate-900 font-black uppercase text-xs tracking-widest text-white shadow-xl hover:bg-indigo-600 disabled:opacity-50"
                >
                   {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit for Analysis"}
                </Button>
              ) : (
                <Button 
                   onClick={nextQuestion}
                   className="h-12 px-8 rounded-xl bg-indigo-600 font-black uppercase text-xs tracking-widest text-white shadow-xl shadow-indigo-600/20"
                >
                   {currentQuestionIdx < questions.length - 1 ? "Next Question" : "Finish Simulation"}
                </Button>
              )}
           </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
