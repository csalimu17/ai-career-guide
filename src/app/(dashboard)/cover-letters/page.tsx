"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { addDoc, collection, deleteDoc, doc, orderBy, query, serverTimestamp } from "firebase/firestore"
import {
  Briefcase,
  ClipboardType,
  Eye,
  FileText,
  Loader2,
  Mail,
  Search,
  Sparkles,
  Target,
  Trash2,
  UserRound,
  Zap,
} from "lucide-react"

import { generateCoverLetter } from "@/ai/flows/cover-letter-generator-flow"
import { useCollection, useDoc, useFirestore, useMemoFirebase, useUser } from "@/firebase"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/hooks/use-toast"
import { getPlanLimits } from "@/lib/plans"
import { buildResumePlainText } from "@/lib/resume-to-text"
import { plainTextToRichTextHtml, richTextToPlainText } from "@/lib/rich-text"
import { cn } from "@/lib/utils"

type CoverLetterRecord = {
  id: string
  company?: string
  role?: string
  hiringManager?: string
  resumeId?: string
  resumeName?: string
  jobDescription?: string
  content?: string
  emailVersion?: string
  subjectLine?: string
  keyThemes?: string[]
  customizationTips?: string[]
  tone?: "professional" | "enthusiastic" | "creative"
  length?: "concise" | "standard" | "detailed"
  createdAt?: { toDate?: () => Date }
  updatedAt?: { toDate?: () => Date }
}

const initialGenerationState = {
  resumeId: "",
  company: "",
  role: "",
  hiringManager: "",
  jobDescription: "",
  tone: "professional" as "professional" | "enthusiastic" | "creative",
  length: "standard" as "concise" | "standard" | "detailed",
  keyPoints: "",
  customInstructions: "",
}

export default function CoverLettersPage() {
  const { user, uid } = useUser()
  const db = useFirestore()

  const [isGenerating, setIsGenerating] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [genData, setGenData] = useState(initialGenerationState)

  const userDocRef = useMemoFirebase(() => {
    if (!db || !uid) return null
    return doc(db, "users", uid)
  }, [db, uid])
  const { data: profile } = useDoc(userDocRef)

  const resumesQuery = useMemoFirebase(() => {
    if (!db || !user) return null
    return query(collection(db, "users", user.uid, "resumes"), orderBy("updatedAt", "desc"))
  }, [db, user])
  const { data: resumes } = useCollection(resumesQuery)

  const lettersQuery = useMemoFirebase(() => {
    if (!db || !user) return null
    return query(collection(db, "users", user.uid, "coverLetters"), orderBy("createdAt", "desc"))
  }, [db, user])
  const { data: letters, isLoading } = useCollection<CoverLetterRecord>(lettersQuery)

  const latestResume = resumes?.[0]
  const plan = (profile?.plan as "free" | "pro" | "master") || "free"
  const planLimits = getPlanLimits(plan)
  const canGenerateCoverLetters = (planLimits.coverLetters ?? 0) > 0

  useEffect(() => {
    if (!genData.resumeId && latestResume?.id) {
      setGenData((current) => ({ ...current, resumeId: latestResume.id }))
    }
  }, [genData.resumeId, latestResume?.id])

  const filteredLetters = useMemo(() => {
    const sourceLetters = letters || []
    const queryText = searchTerm.trim().toLowerCase()

    if (!queryText) return sourceLetters

    return sourceLetters.filter((letter) => {
      const haystack = [
        letter.company,
        letter.role,
        letter.resumeName,
        letter.subjectLine,
        letter.tone,
        letter.length,
        richTextToPlainText(letter.content),
        letter.emailVersion,
        ...(letter.keyThemes || []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()

      return haystack.includes(queryText)
    })
  }, [letters, searchTerm])

  const handleCopyEmail = async (letter: CoverLetterRecord) => {
    const emailDraft = [letter.subjectLine ? `Subject: ${letter.subjectLine}` : null, letter.emailVersion || richTextToPlainText(letter.content)]
      .filter(Boolean)
      .join("\n\n")

    if (!emailDraft.trim()) {
      toast({
        variant: "destructive",
        title: "Nothing to copy",
        description: "This letter doesn't have an email draft yet.",
      })
      return
    }

    try {
      await navigator.clipboard.writeText(emailDraft)
      toast({
        title: "Email draft copied",
        description: "The short email version is ready to paste into your application.",
      })
    } catch (error) {
      console.error("Failed to copy email draft:", error)
      toast({
        variant: "destructive",
        title: "Copy failed",
        description: "We couldn't copy the email draft to your clipboard.",
      })
    }
  }

  const handleGenerate = async () => {
    if (!user || !db) return
    if (!canGenerateCoverLetters) {
      toast({
        variant: "destructive",
        title: "Cover letters are on paid plans",
        description: "Upgrade to Pro or Master to generate tailored cover letters.",
      })
      return
    }
    if (!genData.resumeId || !genData.jobDescription.trim()) {
      toast({
        variant: "destructive",
        title: "More detail needed",
        description: "Choose a resume and paste the job description before generating a letter.",
      })
      return
    }

    setIsGenerating(true)

    try {
      const selectedResume = resumes?.find((resume) => resume.id === genData.resumeId)
      const result = await generateCoverLetter({
        resumeContent: buildResumePlainText(selectedResume),
        jobDescription: genData.jobDescription,
        company: genData.company || undefined,
        role: genData.role || undefined,
        hiringManager: genData.hiringManager || undefined,
        tone: genData.tone,
        length: genData.length,
        keyPoints: genData.keyPoints || undefined,
        customInstructions: genData.customInstructions || undefined,
      })

      await addDoc(collection(db, "users", user.uid, "coverLetters"), {
        userId: user.uid,
        resumeId: genData.resumeId,
        resumeName: selectedResume?.name || "Selected resume",
        company: genData.company,
        role: genData.role,
        hiringManager: genData.hiringManager,
        jobDescription: genData.jobDescription,
        content: plainTextToRichTextHtml(result.content),
        emailVersion: result.emailVersion,
        subjectLine: result.subjectLine,
        keyThemes: result.keyThemes,
        customizationTips: result.customizationTips,
        tone: genData.tone,
        length: genData.length,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })

      toast({
        title: "Cover letter ready",
        description: "You now have a full letter, a short email version, and tailored editing notes saved in your collection.",
      })
      setIsDialogOpen(false)
      setGenData((current) => ({
        ...initialGenerationState,
        resumeId: current.resumeId || latestResume?.id || "",
      }))
    } catch (error) {
      console.error("Failed to generate cover letter:", error)
      toast({
        variant: "destructive",
        title: "Generation failed",
        description: "We couldn't draft the cover letter right now. Please try again in a moment.",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!user || !db) return
    try {
      await deleteDoc(doc(db, "users", user.uid, "coverLetters", id))
      toast({ title: "Letter removed", description: "The cover letter has been deleted." })
    } catch (error) {
      console.error("Failed to delete cover letter:", error)
      toast({ variant: "destructive", title: "Delete failed", description: "We couldn't delete that cover letter." })
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 pb-20 pt-4 md:px-8 md:pt-8">
      <section className="section-shell relative overflow-hidden p-6 md:p-12">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-emerald-500/10 blur-[80px] rounded-full pointer-events-none" />
        
        <div className="relative space-y-6">
          <div className="eyebrow-chip">
            <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
            Cover letter studio
          </div>
          
          <div className="flex flex-col gap-8 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-4xl space-y-4">
              <h1 className="headline-gradient-vivid text-[2.5rem] font-black leading-[1.05] tracking-[-0.05em] sm:text-5xl lg:text-6xl">
                Generate stronger letters, then keep refining them like assets.
              </h1>
              <p className="max-w-2xl text-sm leading-relaxed text-slate-500 sm:text-base md:text-lg font-medium">
                This flow creates a full cover letter, a shorter email version, and practical editing tips so you can move faster without sending something generic.
              </p>
              
              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-2 rounded-2xl border border-slate-100 bg-white px-4 py-2 shadow-sm transition-all hover:border-indigo-100 hover:shadow-md">
                  <div className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{plan} plan</span>
                </div>
                <div className="flex items-center gap-2 rounded-2xl border border-slate-100 bg-white px-4 py-2 shadow-sm transition-all hover:border-emerald-100 hover:shadow-md">
                  <span className="text-emerald-600 font-black text-xs">{resumes?.length || 0}</span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Resume sources</span>
                </div>
                <div className="flex items-center gap-2 rounded-2xl border border-slate-100 bg-white px-4 py-2 shadow-sm transition-all hover:border-amber-100 hover:shadow-md">
                  <span className="text-amber-600 font-black text-xs">{letters?.length || 0}</span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Saved letters</span>
                </div>
              </div>
            </div>

            <div className="flex w-full flex-col gap-4 sm:w-auto sm:flex-row xl:shrink-0">
              <div className="group relative min-w-[320px]">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-indigo-500" />
                <Input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search company, role, or tone..."
                  className="h-14 rounded-2xl border-2 border-slate-100 bg-white/50 pl-11 font-bold text-slate-900 shadow-sm transition-all focus:border-indigo-500/50 focus:bg-white focus:ring-0"
                />
              </div>

              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    className="tap-bounce h-14 rounded-2xl bg-slate-900 px-8 font-black text-white shadow-xl transition-all hover:bg-slate-800 hover:scale-[1.02] disabled:opacity-50"
                    disabled={!canGenerateCoverLetters || !resumes?.length}
                  >
                    <Sparkles className="mr-2 h-4 w-4 text-amber-400" />
                    {!canGenerateCoverLetters ? "Upgrade for letters" : !resumes?.length ? "Add resume first" : "New AI letter"}
                  </Button>
                </DialogTrigger>
              <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[800px] rounded-[2.5rem] border-none shadow-2xl p-0">
                <DialogHeader className="p-8 md:p-12 pb-0">
                  <DialogTitle className="flex items-center gap-4 text-2xl font-black md:text-3xl tracking-tight">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 shadow-sm border border-indigo-100">
                      <Sparkles className="h-6 w-6" />
                    </div>
                    Build a tailored application package
                  </DialogTitle>
                  <DialogDescription className="text-slate-500 font-medium text-base md:text-lg mt-2">
                    We&apos;ll use your resume and role details to create a high-converting letter and short email draft.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-10 p-8 md:p-12 pt-8">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-900 text-[10px] font-black text-white">01</div>
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                        Choose anchor resume
                      </label>
                    </div>
                    <Select value={genData.resumeId} onValueChange={(value) => setGenData((current) => ({ ...current, resumeId: value }))}>
                      <SelectTrigger className="h-14 rounded-2xl border-2 border-slate-100 bg-[#FAFBFD]/50 px-5 font-bold text-slate-900 focus:border-indigo-500/50 focus:bg-white focus:ring-0">
                        <SelectValue placeholder="Select which resume to pull evidence from..." />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl border-slate-100 shadow-xl">
                        {resumes?.map((resume) => (
                          <SelectItem key={resume.id} value={resume.id} className="rounded-xl font-bold py-3">
                            {resume.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-900 text-[10px] font-black text-white">02</div>
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Role & Organization</label>
                    </div>
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="space-y-2">
                        <Input
                          value={genData.company}
                          onChange={(event) => setGenData((current) => ({ ...current, company: event.target.value }))}
                          placeholder="Company (e.g. OpenAI)"
                          className="h-14 rounded-2xl border-2 border-slate-100 bg-[#FAFBFD]/50 px-5 font-bold text-slate-900 focus:border-indigo-500/50 focus:bg-white focus:ring-0"
                        />
                      </div>
                      <div className="space-y-2">
                        <Input
                          value={genData.role}
                          onChange={(event) => setGenData((current) => ({ ...current, role: event.target.value }))}
                          placeholder="Role (e.g. Lead Designer)"
                          className="h-14 rounded-2xl border-2 border-slate-100 bg-[#FAFBFD]/50 px-5 font-bold text-slate-900 focus:border-indigo-500/50 focus:bg-white focus:ring-0"
                        />
                      </div>
                      <div className="space-y-2">
                        <Input
                          value={genData.hiringManager}
                          onChange={(event) => setGenData((current) => ({ ...current, hiringManager: event.target.value }))}
                          placeholder="Hiring Manager (Optional)"
                          className="h-14 rounded-2xl border-2 border-slate-100 bg-[#FAFBFD]/50 px-5 font-bold text-slate-900 focus:border-indigo-500/50 focus:bg-white focus:ring-0"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-900 text-[10px] font-black text-white">03</div>
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                        Context & Target Requirements
                      </label>
                    </div>
                    <Textarea
                      value={genData.jobDescription}
                      onChange={(event) => setGenData((current) => ({ ...current, jobDescription: event.target.value }))}
                      placeholder="Paste the full job description here so the AI can tailor your letter to specific needs..."
                      className="min-h-[200px] rounded-[2rem] border-2 border-slate-100 bg-[#FAFBFD]/50 p-6 font-medium text-slate-900 shadow-inner focus:border-indigo-500/50 focus:bg-white focus:ring-0 resize-none leading-relaxed"
                    />
                  </div>

                  <div className="grid gap-8 md:grid-cols-2">
                    <div className="space-y-4">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Tone Preference</label>
                      <div className="grid grid-cols-3 gap-2">
                        {(["professional", "enthusiastic", "creative"] as const).map((tone) => (
                          <Button
                            key={tone}
                            type="button"
                            variant="outline"
                            className={cn(
                              "tap-bounce h-12 rounded-2xl border-2 font-black text-[9px] uppercase tracking-widest transition-all",
                              genData.tone === tone 
                                ? "border-indigo-500 bg-indigo-50 text-indigo-600" 
                                : "border-slate-100 bg-white text-slate-500 hover:border-slate-200"
                            )}
                            onClick={() => setGenData((current) => ({ ...current, tone }))}
                          >
                            {tone}
                          </Button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-4">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Draft Length</label>
                      <Select
                        value={genData.length}
                        onValueChange={(value: "concise" | "standard" | "detailed") =>
                          setGenData((current) => ({ ...current, length: value }))
                        }
                      >
                        <SelectTrigger className="h-12 rounded-2xl border-2 border-slate-100 bg-[#FAFBFD]/50 px-5 font-bold text-slate-900 focus:border-indigo-500/50 focus:bg-white focus:ring-0">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-slate-100 shadow-xl">
                          <SelectItem value="concise" className="rounded-xl font-bold py-3">Concise</SelectItem>
                          <SelectItem value="standard" className="rounded-xl font-bold py-3">Standard</SelectItem>
                          <SelectItem value="detailed" className="rounded-xl font-bold py-3">Detailed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="rounded-[2rem] border border-slate-100 bg-[#FAFBFD] p-8 space-y-4 shadow-inner overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-4">
                      <Zap className="h-12 w-12 text-indigo-500/5" />
                    </div>
                    <p className="text-sm font-black text-slate-900 uppercase tracking-tight">AI Package contents</p>
                    <div className="grid gap-4 sm:grid-cols-2">
                      {[
                        "Tailored primary cover letter",
                        "Short-form email version",
                        "High-impact subject lines",
                        "Personalization guidance"
                      ].map((item, idx) => (
                        <div key={idx} className="flex items-center gap-3">
                          <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          <p className="text-xs font-bold text-slate-500">{item}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <DialogFooter className="p-8 md:p-12 pt-0 flex gap-3 sm:justify-between items-center border-t border-slate-50">
                  <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-400 hover:bg-slate-50">
                    Never mind
                  </Button>
                  <Button
                    onClick={handleGenerate}
                    className="tap-bounce h-14 rounded-2xl bg-slate-900 px-10 font-black text-white shadow-xl transition-all hover:bg-slate-800 disabled:opacity-50"
                    disabled={isGenerating || !genData.resumeId || !genData.jobDescription.trim() || !canGenerateCoverLetters}
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating package...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4 text-amber-400" />
                        Draft Application
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    </section>

      {!canGenerateCoverLetters && (
        <Card className="surface-card border-none bg-white p-2">
          <CardContent className="flex flex-col gap-6 p-8 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <Zap className="h-6 w-6 text-amber-500" />
                <p className="text-xl font-black text-slate-900 tracking-tight">Level up your application game</p>
              </div>
              <p className="text-sm font-medium text-slate-500 max-w-2xl leading-relaxed">
                Unlock the full power of tailored cover letters, short-form email versions, and persistent application tracking by upgrading to a pro plan.
              </p>
            </div>
            <Button className="tap-bounce h-12 rounded-2xl bg-slate-900 px-8 font-black text-white transition-all hover:bg-slate-800" asChild>
              <Link href="/settings">View Upgrade Options</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {!resumes?.length && (
        <Card className="surface-card border-none bg-white p-2">
          <CardContent className="flex flex-col gap-6 p-8 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <Target className="h-6 w-6 text-rose-500" />
                <p className="text-xl font-black text-slate-900 tracking-tight">Your studio needs a foundation</p>
              </div>
              <p className="text-sm font-medium text-slate-500 max-w-2xl leading-relaxed">
                We need at least one resume to act as the source of truth for your experience. Upload your CV or build one in the platform to begin generating letters.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button variant="outline" className="tap-bounce h-12 rounded-2xl border-2 border-slate-100 font-black text-xs uppercase tracking-widest text-slate-900" asChild>
                <Link href="/onboarding/upload">Upload Existing CV</Link>
              </Button>
              <Button className="tap-bounce h-12 rounded-2xl bg-indigo-600 px-8 font-black text-white hover:bg-indigo-700" asChild>
                <Link href="/editor">Build New Resume</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-slate-300" />
        </div>
      ) : filteredLetters.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredLetters.map((letter) => {
            const previewText = richTextToPlainText(letter.content).slice(0, 240)
            return (
              <Card key={letter.id} className="surface-card group flex h-full flex-col overflow-hidden border-none transition-all duration-300 hover:-translate-y-2">
                <CardHeader className="space-y-4 p-8 pb-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-[1.25rem] bg-slate-50 text-slate-900 shadow-sm border border-slate-100/50 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                      <FileText className="h-6 w-6" />
                    </div>
                    <div className="flex flex-wrap justify-end gap-2">
                      {letter.tone && (
                        <Badge variant="secondary" className="rounded-xl border-indigo-100 bg-indigo-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-indigo-700 shadow-sm">
                          {letter.tone}
                        </Badge>
                      )}
                      {letter.length && (
                        <Badge variant="outline" className="rounded-xl border-slate-200 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-widest text-slate-500 shadow-sm">
                          {letter.length}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <CardTitle className="line-clamp-2 text-xl font-black tracking-tight text-slate-900 md:text-2xl leading-tight">
                      {letter.role || "Untitled Role"}
                    </CardTitle>
                    <div className="flex items-center gap-2 text-sm font-black text-indigo-600 uppercase tracking-tight">
                      <Briefcase className="h-4 w-4" />
                      {letter.company || "Awaiting detail"}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="flex-1 space-y-6 p-8 pt-0">
                  <div className="relative">
                    <p className="line-clamp-5 text-sm font-medium leading-[1.6] text-slate-500">
                      {previewText || "Open this draft to edit the letter body, email version, and personalization notes."}
                    </p>
                    <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-white to-transparent pointer-events-none" />
                  </div>

                  {letter.keyThemes?.length ? (
                    <div className="flex flex-wrap gap-1.5">
                      {letter.keyThemes.slice(0, 3).map((theme) => (
                        <Badge
                          key={theme}
                          variant="outline"
                          className="rounded-lg border-emerald-50 bg-emerald-50/50 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-emerald-700"
                        >
                          {theme}
                        </Badge>
                      ))}
                    </div>
                  ) : null}

                  <div className="space-y-3 rounded-3xl border border-slate-100 bg-[#FAFBFD]/80 p-5 shadow-inner">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      <div className="h-5 w-5 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-slate-900">
                        <UserRound className="h-3 w-3" />
                      </div>
                      Letter source
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-sm font-black text-slate-900">{letter.resumeName || "Master Resume"}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        Refreshed {letter.updatedAt?.toDate ? letter.updatedAt.toDate().toLocaleDateString() : letter.createdAt?.toDate ? letter.createdAt.toDate().toLocaleDateString() : "recently"}
                      </p>
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="grid grid-cols-[1fr_auto_auto] gap-3 p-8 pt-0">
                  <Button variant="outline" size="lg" className="tap-bounce h-12 rounded-2xl border-2 border-slate-100 bg-white font-black text-xs uppercase tracking-widest text-slate-900 transition-all hover:border-indigo-500 hover:text-indigo-600" asChild>
                    <Link href={`/cover-letters/${letter.id}`}>
                      <Eye className="mr-2 h-4 w-4" />
                      View & customize
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="tap-bounce h-12 w-12 rounded-2xl bg-slate-50 text-slate-600 transition-all hover:bg-slate-900 hover:text-white"
                    onClick={() => handleCopyEmail(letter)}
                    title="Copy short draft"
                  >
                    <Mail className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="tap-bounce h-12 w-12 rounded-2xl bg-rose-50 text-rose-500 transition-all hover:bg-rose-500 hover:text-white"
                    onClick={() => handleDelete(letter.id)}
                    title="Discard letter"
                  >
                    <Trash2 className="h-5 w-5" />
                  </Button>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center space-y-8 rounded-[3rem] border-4 border-dashed border-slate-50 px-6 py-24 text-center">
          <div className="relative">
            <div className="absolute inset-0 bg-indigo-500/10 blur-3xl rounded-full" />
            <div className="relative flex h-28 w-28 items-center justify-center rounded-[2.5rem] bg-indigo-50 text-indigo-600 shadow-inner border border-indigo-100/50">
              <ClipboardType className="h-12 w-12" />
            </div>
          </div>
          <div className="max-w-md space-y-3">
            <h2 className="text-3xl font-black tracking-tight text-slate-900">
              {searchTerm ? "No matches found" : "Ready to draft your first letter?"}
            </h2>
            <p className="text-base font-medium leading-relaxed text-slate-500">
              {searchTerm
                ? "Try adjusting your search terms. We scan through company names, roles, and identifying themes from your saved letters."
                : "Tailored applications have a 3x higher response rate. Set up your first letter package to get started."}
            </p>
          </div>
          <div className="flex flex-col gap-4 sm:flex-row">
            {searchTerm ? (
              <Button variant="outline" className="tap-bounce h-14 rounded-2xl border-2 border-slate-100 px-8 font-black text-slate-900 transition-all hover:border-slate-300" onClick={() => setSearchTerm("")}>
                Clear Search
              </Button>
            ) : canGenerateCoverLetters ? (
              <Button className="tap-bounce h-14 rounded-2xl bg-slate-900 px-10 font-black text-white shadow-xl transition-all hover:bg-slate-800" onClick={() => setIsDialogOpen(true)} disabled={!resumes?.length}>
                <Sparkles className="mr-2 h-4 w-4 text-amber-400" />
                Start My First Draft
              </Button>
            ) : (
              <Button className="tap-bounce h-14 rounded-2xl bg-indigo-600 px-10 font-black text-white shadow-xl transition-all hover:bg-indigo-700" asChild>
                <Link href="/settings">Unlock Generation</Link>
              </Button>
            )}
            <Button variant="outline" className="tap-bounce h-14 rounded-2xl border-2 border-slate-100 px-8 font-black text-slate-900 transition-all hover:border-slate-300" asChild>
              <Link href="/editor">
                <Target className="mr-2 h-4 w-4" />
                Refine Resume
              </Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
