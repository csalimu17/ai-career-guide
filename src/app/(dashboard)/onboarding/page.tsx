"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { doc, serverTimestamp, setDoc } from "firebase/firestore"
import { useUser, useFirestore } from "@/firebase"
import { supabaseDb } from "@/lib/supabase/db"
import { toast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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

type Step = 1 | 2

const GOALS = [
  { id: "fast", label: "Get a job fast", icon: Rocket, description: "Optimize for speed and keyword matching." },
  { id: "switch", label: "Switch career", icon: Zap, description: "Highlight transferable skills & potential." },
  { id: "improve", label: "Improve my CV", icon: Trophy, description: "Refresh design & content quality." },
  { id: "scratch", label: "Build from scratch", icon: FileText, description: "Create a solid foundation with AI." },
]

const EXPERIENCE_LEVELS = [
  "Student / Recent Grad",
  "Entry Level (0-2 yrs)",
  "Mid-Level (3-7 yrs)",
  "Senior / Executive (8+ yrs)",
  "Freelance / Contractor",
]

const variants = {
  initial: (direction: number) => ({
    x: direction > 0 ? 30 : -30,
    opacity: 0,
  }),
  animate: {
    x: 0,
    opacity: 1,
    transition: {
      duration: 0.3,
      ease: [0.23, 1, 0.32, 1] as const,
    },
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -30 : 30,
    opacity: 0,
    transition: {
      duration: 0.2,
    },
  }),
}

export default function OnboardingPage() {
  const router = useRouter()
  const { user } = useUser()
  const db = useFirestore()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [step, setStep] = useState<Step>(1)
  const [direction, setDirection] = useState(0)

  const [formData, setFormData] = useState({
    careerGoal: "fast",
    experienceLevel: "Mid-Level (3-7 yrs)",
    industry: "",
    targetRoles: "",
    yearsOfExperience: "4-7",
    employmentStatus: "searching",
  })

  const handleNext = () => {
    setDirection(1)
    setStep(2)
  }

  const handleBack = () => {
    setDirection(-1)
    setStep(1)
  }

  // Non-blocking user profile save + instant navigation
  const handleComplete = (method: "upload" | "scratch") => {
    if (user) {
      try {
        if (db) {
          const userRef = doc(db, "users", user.uid)
          setDoc(
            userRef,
            {
              ...formData,
              onboardingComplete: true,
              updatedAt: serverTimestamp(),
            },
            { merge: true }
          ).catch((err) => console.warn("Background onboarding save skipped/failed:", err))
        }
      } catch {}

      supabaseDb.updateProfile(user.uid, {
        ...formData,
        onboarding_complete: true,
      }).catch((err) => console.warn("Supabase onboarding profile update skipped/failed:", err))
    }

    const targetUrl = method === "upload" ? "/onboarding/upload" : "/cv-editor"
    router.push(targetUrl)
  }

  return (
    <div className="relative min-h-[calc(100vh-5rem)] w-full px-4 py-6 md:px-8 md:py-10 flex flex-col items-center justify-center">
      <div className="w-full max-w-2xl space-y-6">
        {/* Header & Progress Indicator */}
        <div className="space-y-3 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/10 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            <span>AI Setup Assistant</span>
            <span className="text-muted-foreground">• Step {step} of 2</span>
          </div>

          <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
            {step === 1 ? "Calibrate Your Career Workspace" : "Choose How to Start"}
          </h1>
          <p className="text-xs text-muted-foreground sm:text-sm max-w-md mx-auto">
            {step === 1
              ? "Tell us a bit about your target role so our AI can personalize your CV recommendations."
              : "Upload an existing CV for instant smart parsing, or build fresh with AI."}
          </p>

          {/* Compact Progress Bar */}
          <div className="mx-auto max-w-xs pt-1">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <motion.div
                className="h-full bg-gradient-to-r from-primary to-accent"
                initial={{ width: "50%" }}
                animate={{ width: step === 1 ? "50%" : "100%" }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
        </div>

        {/* Card Container */}
        <Card className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white/90 shadow-lg backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/90">
          <CardContent className="p-5 sm:p-6">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={step}
                custom={direction}
                variants={variants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="space-y-5"
              >
                {step === 1 && (
                  <div className="space-y-5">
                    {/* Goal Selection */}
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Primary Goal
                      </Label>
                      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                        {GOALS.map((goal) => {
                          const Icon = goal.icon
                          const isSelected = formData.careerGoal === goal.id
                          return (
                            <button
                              key={goal.id}
                              type="button"
                              onClick={() => setFormData((prev) => ({ ...prev, careerGoal: goal.id }))}
                              className={`group relative flex flex-col items-center rounded-xl border p-3 text-center transition-all cursor-pointer ${
                                isSelected
                                  ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary/30"
                                  : "border-slate-200 bg-slate-50/50 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950/40"
                              }`}
                            >
                              <div
                                className={`mb-1.5 flex h-8 w-8 items-center justify-center rounded-lg ${
                                  isSelected ? "bg-primary text-white" : "bg-white text-slate-600 shadow-xs dark:bg-slate-800 dark:text-slate-300"
                                }`}
                              >
                                <Icon className="h-4 w-4" />
                              </div>
                              <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                                {goal.label}
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {/* Inputs Grid */}
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label htmlFor="targetRoles" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          Target Role / Job Title
                        </Label>
                        <Input
                          id="targetRoles"
                          placeholder="e.g. Product Manager, Software Engineer"
                          className="h-9 rounded-lg text-xs"
                          value={formData.targetRoles}
                          onChange={(e) => setFormData((prev) => ({ ...prev, targetRoles: e.target.value }))}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="industry" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          Target Industry
                        </Label>
                        <Input
                          id="industry"
                          placeholder="e.g. Technology, Finance, Healthcare"
                          className="h-9 rounded-lg text-xs"
                          value={formData.industry}
                          onChange={(e) => setFormData((prev) => ({ ...prev, industry: e.target.value }))}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          Seniority Level
                        </Label>
                        <Select
                          value={formData.experienceLevel}
                          onValueChange={(val) => setFormData((prev) => ({ ...prev, experienceLevel: val }))}
                        >
                          <SelectTrigger className="h-9 rounded-lg text-xs">
                            <SelectValue placeholder="Select level" />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl">
                            {EXPERIENCE_LEVELS.map((level) => (
                              <SelectItem key={level} value={level} className="text-xs">
                                {level}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          Job Search Status
                        </Label>
                        <Select
                          value={formData.employmentStatus}
                          onValueChange={(val) => setFormData((prev) => ({ ...prev, employmentStatus: val }))}
                        >
                          <SelectTrigger className="h-9 rounded-lg text-xs">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl">
                            <SelectItem value="searching" className="text-xs">Actively searching</SelectItem>
                            <SelectItem value="employed" className="text-xs">Employed (Open to offers)</SelectItem>
                            <SelectItem value="student" className="text-xs">Student / Graduate</SelectItem>
                            <SelectItem value="freelance" className="text-xs">Freelancer / Contract</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-9 text-xs text-muted-foreground hover:text-slate-900"
                        onClick={() => handleComplete("upload")}
                      >
                        Skip setup
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        className="h-9 rounded-lg px-5 text-xs font-bold shadow-sm"
                        onClick={handleNext}
                      >
                        Continue <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-5">
                    <div className="grid gap-3 sm:grid-cols-2">
                      {/* Option A: Upload CV */}
                      <button
                        type="button"
                        onClick={() => handleComplete("upload")}
                        className="group relative flex flex-col items-center rounded-xl border border-slate-200 bg-slate-50/50 p-5 text-center transition-all hover:border-primary hover:bg-primary/5 hover:shadow-md dark:border-slate-800 dark:bg-slate-950/40 cursor-pointer"
                      >
                        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary transition-transform group-hover:scale-105">
                          <Upload className="h-5 w-5" />
                        </div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                          Import Existing CV
                        </h3>
                        <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                          Upload PDF or DOCX. AI will extract your skills, experience, and contact info automatically.
                        </p>
                        <Badge variant="secondary" className="mt-3 text-[10px] font-semibold">
                          Recommended
                        </Badge>
                      </button>

                      {/* Option B: Build from Scratch */}
                      <button
                        type="button"
                        onClick={() => handleComplete("scratch")}
                        className="group relative flex flex-col items-center rounded-xl border border-slate-200 bg-white p-5 text-center transition-all hover:border-primary hover:bg-primary/5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 cursor-pointer"
                      >
                        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent transition-transform group-hover:scale-105">
                          <Sparkles className="h-5 w-5" />
                        </div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                          Create from Scratch
                        </h3>
                        <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                          Start with a clean professional template and let AI assist you step-by-step.
                        </p>
                        <Badge variant="outline" className="mt-3 text-[10px] font-semibold">
                          Blank Canvas
                        </Badge>
                      </button>
                    </div>

                    {/* Back Button */}
                    <div className="flex items-center justify-between pt-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-9 text-xs text-muted-foreground"
                        onClick={handleBack}
                      >
                        <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Back to Profile
                      </Button>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
