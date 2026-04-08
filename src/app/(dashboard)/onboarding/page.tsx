"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
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

export default function OnboardingPage() {
  const router = useRouter()
  const { user } = useUser()
  const db = useFirestore()

  const [step, setStep] = useState<Step>(1)
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

  const handleNext = () => setStep((current) => Math.min(current + 1, totalSteps) as Step)
  const handleBack = () => setStep((current) => Math.max(current - 1, 1) as Step)

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

      // Ensure state is updated before navigation
      setTimeout(() => {
        router.push(method === "upload" ? "/onboarding/upload" : "/editor")
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
    <div className="mobile-app-page md:mx-auto md:max-w-3xl md:px-6 md:py-12">
      <div className="mb-6 space-y-3 text-center md:mb-12 md:space-y-4">
        <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/20 md:mb-4 md:h-12 md:w-12">
          <Sparkles className="h-6 w-6 text-white" />
        </div>
        <h1 className="text-[1.7rem] font-black tracking-tight text-primary sm:text-3xl">Personalizing Your Journey</h1>
        <p className="text-sm text-muted-foreground md:text-base">
          Step {step} of {totalSteps} - {Math.round((step / totalSteps) * 100)}% Complete
        </p>
        <Progress value={(step / totalSteps) * 100} className="mt-4 h-2 border-none bg-muted md:mt-6" />
      </div>

      <Card className="animate-in slide-in-from-bottom-4 overflow-hidden rounded-[1.9rem] border-none bg-white shadow-2xl duration-500 fade-in md:rounded-[2.5rem]">
        {step === 1 && (
          <div className="space-y-6 p-5 text-center sm:p-10">
            <div className="space-y-3 md:space-y-4">
              <h2 className="text-[1.8rem] font-black leading-tight text-primary sm:text-4xl">Welcome to the future of your career.</h2>
              <p className="mx-auto max-w-md text-sm text-muted-foreground sm:text-lg">
                We&apos;ll calibrate our AI to your specific background and goals in about 60 seconds.
              </p>
            </div>
            <div className="flex flex-col items-center gap-3">
              <Button size="lg" className="group h-12 w-full rounded-2xl px-6 text-sm font-bold shadow-xl shadow-primary/10 sm:h-14 sm:w-auto sm:px-12 sm:text-lg" onClick={handleNext}>
                Let&apos;s Start <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
              <button
                className="py-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground transition-colors hover:text-primary"
                onClick={() => setStep(6)}
              >
                Already have a CV? Jump to upload
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 p-5 sm:space-y-8 sm:p-10">
            <div className="space-y-2 text-center">
              <h2 className="text-2xl font-bold text-primary">What&apos;s your primary goal?</h2>
              <p className="text-sm text-muted-foreground">We&apos;ll adapt our advice based on your priority.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
              {GOALS.map((goal) => (
                <button
                  key={goal.id}
                  onClick={() => handleGoalSelect(goal.id)}
                  className="group flex flex-col items-start rounded-[1.35rem] border-2 border-transparent bg-[#F9FAFB] p-4 text-left transition-all hover:border-primary/50 hover:bg-primary/5 sm:rounded-[2rem] sm:p-6"
                >
                  <goal.icon className="mb-4 h-8 w-8 text-primary transition-transform group-hover:scale-110" />
                  <span className="mb-1 font-bold text-primary">{goal.label}</span>
                  <span className="text-xs leading-relaxed text-muted-foreground">{goal.description}</span>
                </button>
              ))}
            </div>
            <div className="flex justify-center pt-4">
              <Button variant="ghost" onClick={handleBack} className="text-muted-foreground">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5 p-5 sm:space-y-8 sm:p-10">
            <div className="space-y-2 text-center">
              <h2 className="text-xl font-bold text-primary sm:text-2xl">Select your experience level</h2>
              <p className="text-xs text-muted-foreground sm:text-sm">This helps us choose the right template architecture.</p>
            </div>
            <div className="space-y-2 sm:space-y-3">
              {["Student / Recent Grad", "Entry Level (0-2 years)", "Mid-Level (3-7 years)", "Senior / Executive (8+ years)", "Freelancer / Contractor"].map((level) => (
                <button
                  key={level}
                  onClick={() => {
                    setFormData((prev) => ({ ...prev, experienceLevel: level }))
                    handleNext()
                  }}
                  className="group flex w-full items-center justify-between rounded-xl border-2 border-transparent bg-[#F9FAFB] p-4 text-left text-sm font-bold text-primary transition-all hover:border-secondary hover:bg-secondary/5 sm:rounded-2xl sm:p-5 sm:text-base"
                >
                  {level}
                  <ArrowRight className="h-4 w-4 opacity-0 transition-opacity sm:group-hover:opacity-100" />
                </button>
              ))}
            </div>
            <Button variant="ghost" onClick={handleBack} className="h-10 text-muted-foreground sm:h-11">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-5 p-5 sm:space-y-8 sm:p-10">
            <div className="space-y-2 text-center">
              <h2 className="text-xl font-bold text-primary sm:text-2xl">Industry & Target Role</h2>
              <p className="text-xs text-muted-foreground sm:text-sm">The more specific you are, the better the AI performs.</p>
            </div>
            <div className="space-y-4 sm:space-y-6">
              <div className="space-y-2">
                <Label className="ml-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground sm:text-xs">Current or Target Industry</Label>
                <Input
                  placeholder="e.g. Fintech, Healthcare, Creative Arts"
                  className="h-12 rounded-xl border-none bg-[#F9FAFB] focus-visible:ring-primary sm:h-14 sm:rounded-2xl"
                  value={formData.industry}
                  onChange={(e) => setFormData((prev) => ({ ...prev, industry: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label className="ml-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground sm:text-xs">Ideal Role(s)</Label>
                <Input
                  placeholder="e.g. Senior Frontend Engineer, Product Lead"
                  className="h-12 rounded-xl border-none bg-[#F9FAFB] focus-visible:ring-primary sm:h-14 sm:rounded-2xl"
                  value={formData.targetRoles}
                  onChange={(e) => setFormData((prev) => ({ ...prev, targetRoles: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex gap-3 sm:gap-4">
              <Button variant="ghost" onClick={handleBack} className="h-12 flex-1 rounded-xl sm:h-14 sm:rounded-2xl">Back</Button>
              <Button className="h-12 flex-[2] rounded-xl font-bold shadow-lg sm:h-14 sm:rounded-2xl" onClick={handleNext} disabled={!formData.industry || !formData.targetRoles}>Continue</Button>
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-5 p-5 sm:space-y-8 sm:p-10">
            <div className="space-y-2 text-center">
              <h2 className="text-xl font-bold text-primary sm:text-2xl">Quick Snapshot</h2>
              <p className="text-xs text-muted-foreground sm:text-sm">Help us understand your current career standing.</p>
            </div>
            <div className="space-y-4 sm:space-y-6">
              <div className="space-y-2">
                <Label className="ml-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground sm:text-xs">Years of Experience</Label>
                <Select onValueChange={(value) => setFormData((prev) => ({ ...prev, yearsOfExperience: value }))}>
                  <SelectTrigger className="h-12 rounded-xl border-none bg-[#F9FAFB] sm:h-14 sm:rounded-2xl">
                    <SelectValue placeholder="Select range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Less than 1 year</SelectItem>
                    <SelectItem value="1-3">1 - 3 years</SelectItem>
                    <SelectItem value="4-7">4 - 7 years</SelectItem>
                    <SelectItem value="8-12">8 - 12 years</SelectItem>
                    <SelectItem value="13+">13+ years</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="ml-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground sm:text-xs">Current Employment Status</Label>
                <Select onValueChange={(value) => setFormData((prev) => ({ ...prev, employmentStatus: value }))}>
                  <SelectTrigger className="h-12 rounded-xl border-none bg-[#F9FAFB] sm:h-14 sm:rounded-2xl">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="employed">Employed (Open to offers)</SelectItem>
                    <SelectItem value="searching">Actively searching</SelectItem>
                    <SelectItem value="student">Full-time student</SelectItem>
                    <SelectItem value="freelance">Freelance / Contractor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-3 sm:gap-4">
              <Button variant="ghost" onClick={handleBack} className="h-12 flex-1 rounded-xl sm:h-14 sm:rounded-2xl">Back</Button>
              <Button className="h-12 flex-[2] rounded-xl font-bold shadow-lg sm:h-14 sm:rounded-2xl" onClick={handleNext} disabled={!formData.yearsOfExperience || !formData.employmentStatus}>Continue</Button>
            </div>
          </div>
        )}

        {step === 6 && (
          <div className="space-y-5 p-5 sm:space-y-8 sm:p-10">
            <div className="space-y-2 text-center">
              <h2 className="text-xl font-bold text-primary sm:text-2xl">How would you like to begin?</h2>
              <p className="text-xs text-muted-foreground sm:text-sm">Either way, our AI will be by your side.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 sm:gap-6">
              <button
                onClick={() => handleComplete("upload")}
                disabled={isSaving}
                className="group flex flex-col items-center justify-center rounded-[1.35rem] border-2 border-dashed border-muted-foreground/20 bg-[#F9FAFB] p-5 transition-all hover:border-primary hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-60 sm:rounded-[2.5rem] sm:p-10"
              >
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-md transition-transform group-hover:scale-110">
                  <Upload className="h-8 w-8 text-primary" />
                </div>
                <span className="font-bold text-primary">Upload Existing CV</span>
                <span className="mt-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">PDF or DOCX</span>
              </button>
              <button
                onClick={() => handleComplete("scratch")}
                disabled={isSaving}
                className="group flex flex-col items-center justify-center rounded-[1.35rem] border-2 border-transparent bg-primary p-5 text-white shadow-xl shadow-primary/20 transition-all hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60 sm:rounded-[2.5rem] sm:p-10"
              >
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-white/10 transition-transform group-hover:scale-110">
                  {isSaving ? <Loader2 className="h-8 w-8 animate-spin text-white" /> : <Sparkles className="h-8 w-8 text-white" />}
                </div>
                <span className="font-bold">Start From Scratch</span>
                <span className="mt-2 text-[10px] font-black uppercase tracking-widest opacity-60">AI-Guided Builder</span>
              </button>
            </div>
            <Button variant="ghost" onClick={handleBack} className="w-full rounded-xl text-muted-foreground sm:rounded-2xl">Wait, I missed something</Button>
          </div>
        )}
      </Card>
    </div>
  )
}
