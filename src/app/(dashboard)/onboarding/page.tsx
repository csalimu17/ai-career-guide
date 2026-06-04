"use client"

import Image from "next/image"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence, Variants } from "framer-motion"
import { doc, serverTimestamp, setDoc } from "firebase/firestore"
import { useUser, useFirestore } from "@/firebase"
import { toast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { OnboardingGuide } from "@/components/onboarding/onboarding-guide"
import {
  ArrowLeft,
  ArrowRight,
  FileText,
  Loader2,
  Rocket,
  Sparkles,
  Trophy,
  Upload,
  Zap,
} from "lucide-react"

type Step = 1 | 2 | 3 | 4 | 5 | 6

const GOALS = [
  { id: "fast", label: "Get a job fast", icon: Rocket, description: "Optimize for speed and keyword matching." },
  { id: "switch", label: "Switch career", icon: Zap, description: "Highlight transferable skills and potential." },
  { id: "improve", label: "Improve my CV", icon: Trophy, description: "Refresh design and content quality." },
  { id: "scratch", label: "Create from scratch", icon: FileText, description: "Build a solid foundation with AI." },
]

const GUIDE_MESSAGES: Record<Step, string> = {
  1: "Welcome! I'm your AI Career Guide. Let's get your professional profile calibrated in just 60 seconds.",
  2: "What are we aiming for today? This helps me prioritize the right advice for your CV.",
  3: "Your experience level changes the 'architecture' of your resume. Let's nail the foundation.",
  4: "Tell me about your target industry. The more specific we are, the better my AI models perform.",
  5: "Quick snapshot! This helps us understand your current career standing and availability.",
  6: "We're all set! How would you like to build your first CV? I'll be here to help either way.",
}

const variants: Variants = {
  initial: (direction: number) => ({
    x: direction > 0 ? 50 : -50,
    opacity: 0,
  }),
  animate: {
    x: 0,
    opacity: 1,
    transition: {
      duration: 0.4,
      ease: [0.23, 1, 0.32, 1] as const,
    },
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -50 : 50,
    opacity: 0,
    transition: {
      duration: 0.3,
    },
  }),
}

export default function OnboardingPage() {
  const router = useRouter()
  const { user } = useUser()
  const db = useFirestore()

  const [step, setStep] = useState<Step>(1)
  const [direction, setDirection] = useState(0)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState({
    careerGoal: "",
    experienceLevel: "",
    industry: "",
    targetRoles: "",
    yearsOfExperience: "",
    employmentStatus: "",
    onboardingComplete: false,
  })

  const totalSteps = 6

  const handleNext = () => {
    setDirection(1)
    setStep((current) => Math.min(current + 1, totalSteps) as Step)
  }

  const handleBack = () => {
    setDirection(-1)
    setStep((current) => Math.max(current - 1, 1) as Step)
  }

  const handleGoalSelect = (goalId: string) => {
    setFormData((prev) => ({ ...prev, careerGoal: goalId }))
    handleNext()
  }

  const handleComplete = async (method: "upload" | "scratch") => {
    if (!user || !db) return

    setIsSaving(true)
    try {
      const userRef = doc(db, "users", user.uid)
      await setDoc(userRef, {
        ...formData,
        onboardingComplete: true,
        updatedAt: serverTimestamp(),
      }, { merge: true })

      toast({
        title: "Profile calibrated!",
        description: "Your professional workspace is ready.",
      })

      setTimeout(() => {
        router.push(method === "upload" ? "/onboarding/upload" : "/cv-editor")
      }, 500)
    } catch (error) {
      console.error("Onboarding completion failed:", error)
      toast({
        variant: "destructive",
        title: "Calibration failed",
        description: "We couldn't save your settings. Please try again.",
      })
      setIsSaving(false)
    }
  }

  return (
    <div className="relative min-h-[calc(100vh-80px)] w-full overflow-hidden px-4 py-8 md:px-0 md:py-16">

      <div className="relative mx-auto max-w-4xl">
        <div className="mb-10 space-y-10 text-center md:mb-16">
          
          <div className="relative space-y-4">
            <div className="flex flex-col items-center gap-2">
              <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-5xl">
                <span className="headline-gradient-vivid bg-clip-text text-transparent">Career Calibration</span>
              </h1>
            </div>

            <div className="mx-auto max-w-md px-4">
              <div className="relative h-2 w-full overflow-hidden rounded-full bg-slate-200/50 shadow-inner">
                {/* Progress Indicator with Glow */}
                <motion.div 
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary via-primary/80 to-secondary shadow-[0_0_15px_rgba(124,58,237,0.5)]"
                  initial={{ width: 0 }}
                  animate={{ width: `${(step / totalSteps) * 100}%` }}
                  transition={{ type: "spring", stiffness: 50, damping: 15 }}
                />
                <motion.div 
                  className="absolute inset-y-0 w-8 bg-white/30 blur-sm"
                  initial={{ left: 0 }}
                  animate={{ left: `${(step / totalSteps) * 100}%` }}
                  transition={{ type: "spring", stiffness: 50, damping: 15 }}
                />
              </div>
              <div className="mt-3 flex items-center justify-between px-1 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                <span>Initialization</span>
                <span>{Math.round((step / totalSteps) * 100)}% Synchronized</span>
              </div>
            </div>
          </div>
        </div>

        <Card className="relative overflow-hidden rounded-[2rem] border border-white/80 bg-white/70 shadow-[0_24px_50px_-12px_rgba(0,0,0,0.1)] backdrop-blur-xl md:rounded-[2.5rem]">
          {/* Subtle inner card border */}
          <div className="absolute inset-0 rounded-[2.5rem] md:rounded-[3.2rem] border border-white/40 pointer-events-none" />
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={variants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="w-full"
          >
            {step === 1 && (
              <div className="space-y-8 p-6 text-center sm:p-12">
                <div className="flex flex-col items-center">
                  <div className="mx-auto -mb-10 flex h-48 w-48 items-center justify-center overflow-hidden">
                    <Image
                      src="/logo-mascot.png"
                      alt="Guide Mascot"
                      width={192}
                      height={192}
                      className="h-full w-full object-cover transition-transform duration-700"
                    />
                  </div>
                  <h2 className="text-2xl font-black leading-tight text-primary sm:text-4xl">Ready to transform your career?</h2>
                  <p className="mx-auto max-w-md text-sm text-muted-foreground sm:text-lg">
                    I'll guide you through a quick setup to ensure my advice and CV optimizations are perfectly tailored to you.
                  </p>
                </div>
                <div className="flex flex-col items-center gap-4">
                  <Button size="lg" className="group h-14 w-full rounded-2xl px-12 text-lg font-bold shadow-xl shadow-primary/20 sm:w-auto" onClick={handleNext}>
                    Launch calibration <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </Button>
                  <button
                    className="group py-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground transition-colors hover:text-primary"
                    onClick={() => {
                      setDirection(1)
                      setStep(6)
                    }}
                  >
                    Skip to CV Upload <ArrowRight className="inline ml-1 h-3 w-3 opacity-0 group-hover:opacity-100 transition-all" />
                  </button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6 p-5 sm:space-y-8 sm:p-10">
                <div className="space-y-2 text-center">
                  <h2 className="text-2xl font-black text-primary sm:text-3xl">What&apos;s your primary goal?</h2>
                  <p className="text-sm text-muted-foreground">This helps me focus on what matters most for your journey.</p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  {GOALS.map((goal) => (
                    <button
                      key={goal.id}
                      onClick={() => handleGoalSelect(goal.id)}
                      className="group relative flex flex-col items-start rounded-[1.8rem] border-2 border-transparent bg-primary/[0.02] p-6 text-left transition-all hover:border-primary/50 hover:bg-primary/5"
                    >
                      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm transition-transform group-hover:scale-110">
                        <goal.icon className="h-6 w-6 text-primary" />
                      </div>
                      <span className="mb-1 text-lg font-black text-primary">{goal.label}</span>
                      <span className="text-xs leading-relaxed text-muted-foreground">{goal.description}</span>
                    </button>
                  ))}
                </div>
                <div className="flex justify-center pt-2">
                  <Button variant="ghost" onClick={handleBack} className="text-muted-foreground">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Go back
                  </Button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-5 p-5 sm:space-y-8 sm:p-10">
                <div className="space-y-2 text-center">
                  <h2 className="text-2xl font-black text-primary sm:text-3xl">Your level of experience</h2>
                  <p className="text-sm text-muted-foreground">I'll adjust the AI strategy based on your seniority.</p>
                </div>
                <div className="space-y-3">
                  {["Student / Recent Grad", "Entry Level (0-2 years)", "Mid-Level (3-7 years)", "Senior / Executive (8+ years)", "Freelancer / Contractor"].map((level) => (
                    <button
                      key={level}
                      onClick={() => {
                        setFormData((prev) => ({ ...prev, experienceLevel: level }))
                        handleNext()
                      }}
                      className="group flex w-full items-center justify-between rounded-2xl border-2 border-transparent bg-primary/[0.02] p-5 text-left text-base font-bold text-primary transition-all hover:border-primary/40 hover:bg-primary/5"
                    >
                      {level}
                      <div className="rounded-full bg-white p-1.5 shadow-sm opacity-0 transition-opacity group-hover:opacity-100">
                        <ArrowRight className="h-4 w-4" />
                      </div>
                    </button>
                  ))}
                </div>
                <Button variant="ghost" onClick={handleBack} className="h-11 text-muted-foreground">
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-5 p-5 sm:space-y-8 sm:p-10">
                <div className="space-y-2 text-center">
                  <h2 className="text-2xl font-black text-primary sm:text-3xl">Expertise & Ambition</h2>
                  <p className="text-sm text-muted-foreground">Narrowing down your field significantly improves results.</p>
                </div>
                <div className="space-y-6">
                  <div className="space-y-3">
                    <Label className="ml-1 text-[10px] font-black uppercase tracking-widest text-primary/50">Target Industry</Label>
                    <Input
                      placeholder="e.g. Fintech, Healthcare, AI"
                      className="h-14 rounded-2xl border-none bg-primary/[0.03] px-6 text-lg focus-visible:ring-2 focus-visible:ring-primary/20"
                      value={formData.industry}
                      onChange={(e) => setFormData((prev) => ({ ...prev, industry: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-3">
                    <Label className="ml-1 text-[10px] font-black uppercase tracking-widest text-primary/50">Target Roles</Label>
                    <Input
                      placeholder="e.g. Senior Frontend Engineer"
                      className="h-14 rounded-2xl border-none bg-primary/[0.03] px-6 text-lg focus-visible:ring-2 focus-visible:ring-primary/20"
                      value={formData.targetRoles}
                      onChange={(e) => setFormData((prev) => ({ ...prev, targetRoles: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="flex gap-4 pt-4">
                  <Button variant="ghost" onClick={handleBack} className="h-14 flex-1 rounded-2xl">Back</Button>
                  <Button 
                    className="h-14 flex-[2] rounded-2xl text-lg font-bold shadow-xl shadow-primary/20" 
                    onClick={handleNext} 
                    disabled={!formData.industry || !formData.targetRoles}
                  >
                    Looks good
                  </Button>
                </div>
              </div>
            )}

            {step === 5 && (
              <div className="space-y-5 p-5 sm:space-y-8 sm:p-10">
                <div className="space-y-2 text-center">
                  <h2 className="text-2xl font-black text-primary sm:text-3xl">Quick Snapshot</h2>
                  <p className="text-sm text-muted-foreground">Where do you currently stand in your professional journey?</p>
                </div>
                <div className="space-y-6">
                  <div className="space-y-3">
                    <Label className="ml-1 text-[10px] font-black uppercase tracking-widest text-primary/50">Total Career Tenure</Label>
                    <Select onValueChange={(value) => setFormData((prev) => ({ ...prev, yearsOfExperience: value }))}>
                      <SelectTrigger className="h-14 rounded-2xl border-none bg-primary/[0.03] px-6 text-lg">
                        <SelectValue placeholder="Select years" />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl border-none shadow-2xl">
                        <SelectItem value="0">Less than 1 year</SelectItem>
                        <SelectItem value="1-3">1 - 3 years</SelectItem>
                        <SelectItem value="4-7">4 - 7 years</SelectItem>
                        <SelectItem value="8-12">8 - 12 years</SelectItem>
                        <SelectItem value="13+">13+ years</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-3">
                    <Label className="ml-1 text-[10px] font-black uppercase tracking-widest text-primary/50">Current Status</Label>
                    <Select onValueChange={(value) => setFormData((prev) => ({ ...prev, employmentStatus: value }))}>
                      <SelectTrigger className="h-14 rounded-2xl border-none bg-primary/[0.03] px-6 text-lg">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl border-none shadow-2xl">
                        <SelectItem value="employed">Employed (Exploring)</SelectItem>
                        <SelectItem value="searching">Actively searching</SelectItem>
                        <SelectItem value="student">Student / Academy</SelectItem>
                        <SelectItem value="freelance">Freelance / Solo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex gap-4 pt-4">
                  <Button variant="ghost" onClick={handleBack} className="h-14 flex-1 rounded-2xl">Back</Button>
                  <Button 
                    className="h-14 flex-[2] rounded-2xl text-lg font-bold shadow-xl shadow-primary/20" 
                    onClick={handleNext} 
                    disabled={!formData.yearsOfExperience || !formData.employmentStatus}
                  >
                    Finish setup
                  </Button>
                </div>
              </div>
            )}

            {step === 6 && (
              <div className="space-y-6 p-6 sm:space-y-10 sm:p-12">
                <div className="space-y-2 text-center">
                  <h2 className="text-3xl font-black text-primary sm:text-4xl">All systems go!</h2>
                  <p className="text-sm text-muted-foreground sm:text-lg">Calibration complete. How should we start your career workspace?</p>
                </div>
                <div className="grid gap-6 sm:grid-cols-2">
                  <button
                    onClick={() => handleComplete("upload")}
                    disabled={isSaving}
                    className="group flex flex-col items-center justify-center rounded-[2.5rem] border-2 border-dashed border-primary/20 bg-primary/[0.02] p-8 transition-all hover:border-primary hover:bg-primary/5 disabled:opacity-50"
                  >
                    <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-white shadow-xl shadow-primary/5 transition-transform group-hover:scale-110">
                      <Upload className="h-10 w-10 text-primary" />
                    </div>
                    <span className="text-xl font-black text-primary">Import existing</span>
                    <p className="mt-2 text-xs font-bold text-muted-foreground/60 uppercase tracking-widest text-center">Upload CV to sync skills</p>
                  </button>
                  <button
                    onClick={() => handleComplete("scratch")}
                    disabled={isSaving}
                    className="group flex flex-col items-center justify-center rounded-[2.5rem] bg-primary p-8 text-white shadow-2xl shadow-primary/30 transition-all hover:translate-y-[-4px] hover:shadow-primary/40 disabled:opacity-50"
                  >
                    <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-white/10 transition-transform group-hover:scale-110">
                      {isSaving ? <Loader2 className="h-10 w-10 animate-spin" /> : <Sparkles className="h-10 w-10" />}
                    </div>
                    <span className="text-xl font-black">Build from zero</span>
                    <p className="mt-2 text-xs font-bold opacity-60 uppercase tracking-widest text-center">AI-assisted creation</p>
                  </button>
                </div>
                <div className="flex justify-center">
                   <Button variant="ghost" onClick={handleBack} className="text-muted-foreground">Wait, let me double check my answers</Button>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </Card>
      </div>
    </div>
  )
}
