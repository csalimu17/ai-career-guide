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
    <div className="mx-auto max-w-7xl space-y-6 px-4 pb-20 pt-4 md:space-y-8 md:px-8 md:pt-8">
      <section className="section-shell space-y-4 px-5 py-6 md:px-8">
        <div className="eyebrow-chip">
          <Sparkles className="h-3.5 w-3.5" />
          Cover letter studio
        </div>
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="min-w-0 space-y-3 xl:flex-1">
            <h1 className="text-[2rem] font-black leading-[0.96] tracking-[-0.05em] text-primary sm:text-4xl lg:text-5xl">
              Generate stronger letters, then keep refining them like real application assets.
            </h1>
            <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-base md:text-lg">
              This flow now creates a full cover letter, a shorter email version, a subject line, and practical editing tips so you can move faster without sending something generic.
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="rounded-full px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.2em]">
                {plan.toUpperCase()} plan
              </Badge>
              <Badge variant="outline" className="rounded-full border-secondary/20 bg-secondary/5 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-secondary">
                {resumes?.length || 0} resume sources
              </Badge>
              <Badge variant="outline" className="rounded-full border-accent/20 bg-accent/5 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-accent">
                {letters?.length || 0} saved letters
              </Badge>
            </div>
          </div>

          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row xl:shrink-0">
            <div className="relative min-w-[280px]">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search company, role, tone, or content..."
                className="h-12 rounded-2xl border-border/80 bg-white pl-11 font-medium"
              />
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  className="h-12 rounded-2xl px-6 font-bold"
                  disabled={!canGenerateCoverLetters || !resumes?.length}
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  {!canGenerateCoverLetters ? "Upgrade for letters" : !resumes?.length ? "Add resume first" : "New AI letter"}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[720px]">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-accent" />
                    Build a better cover letter package
                  </DialogTitle>
                  <DialogDescription>
                    We&apos;ll use your resume, the role, and your extra guidance to create a fuller application draft that is easier to personalize before sending.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                      1. Resume source
                    </label>
                    <Select value={genData.resumeId} onValueChange={(value) => setGenData((current) => ({ ...current, resumeId: value }))}>
                      <SelectTrigger className="h-12 rounded-2xl border-border/80 bg-muted/20">
                        <SelectValue placeholder="Choose the resume you want to pull evidence from..." />
                      </SelectTrigger>
                      <SelectContent>
                        {resumes?.map((resume) => (
                          <SelectItem key={resume.id} value={resume.id}>
                            {resume.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {latestResume && (
                      <p className="text-xs text-muted-foreground">
                        Latest resume: <span className="font-semibold text-primary">{latestResume.name}</span>
                      </p>
                    )}
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Company</label>
                      <Input
                        value={genData.company}
                        onChange={(event) => setGenData((current) => ({ ...current, company: event.target.value }))}
                        placeholder="Stripe"
                        className="h-12 rounded-2xl border-border/80 bg-muted/20"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Role</label>
                      <Input
                        value={genData.role}
                        onChange={(event) => setGenData((current) => ({ ...current, role: event.target.value }))}
                        placeholder="Senior Product Designer"
                        className="h-12 rounded-2xl border-border/80 bg-muted/20"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Hiring manager</label>
                      <Input
                        value={genData.hiringManager}
                        onChange={(event) => setGenData((current) => ({ ...current, hiringManager: event.target.value }))}
                        placeholder="Optional"
                        className="h-12 rounded-2xl border-border/80 bg-muted/20"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                      2. Job description
                    </label>
                    <Textarea
                      value={genData.jobDescription}
                      onChange={(event) => setGenData((current) => ({ ...current, jobDescription: event.target.value }))}
                      placeholder="Paste the full job description so the letter can respond to what the role actually needs..."
                      className="min-h-[180px] rounded-[1.5rem] border-border/80 bg-muted/20 resize-none"
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">3. Tone</label>
                      <div className="grid grid-cols-3 gap-2">
                        {(["professional", "enthusiastic", "creative"] as const).map((tone) => (
                          <Button
                            key={tone}
                            type="button"
                            variant={genData.tone === tone ? "default" : "outline"}
                            className="h-10 rounded-xl text-[10px] font-bold uppercase tracking-[0.18em]"
                            onClick={() => setGenData((current) => ({ ...current, tone }))}
                          >
                            {tone}
                          </Button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">4. Length</label>
                      <Select
                        value={genData.length}
                        onValueChange={(value: "concise" | "standard" | "detailed") =>
                          setGenData((current) => ({ ...current, length: value }))
                        }
                      >
                        <SelectTrigger className="h-12 rounded-2xl border-border/80 bg-muted/20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="concise">Concise</SelectItem>
                          <SelectItem value="standard">Standard</SelectItem>
                          <SelectItem value="detailed">Detailed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                        5. Must-include wins
                      </label>
                      <Textarea
                        value={genData.keyPoints}
                        onChange={(event) => setGenData((current) => ({ ...current, keyPoints: event.target.value }))}
                        placeholder="Mention achievements, leadership moments, products, clients, or outcomes you want the draft to emphasize."
                        className="min-h-[120px] rounded-[1.5rem] border-border/80 bg-muted/20 resize-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                        6. Extra guidance
                      </label>
                      <Textarea
                        value={genData.customInstructions}
                        onChange={(event) => setGenData((current) => ({ ...current, customInstructions: event.target.value }))}
                        placeholder="Optional: mention relocation, remote preference, startup fit, product interest, or any nuance the AI should respect."
                        className="min-h-[120px] rounded-[1.5rem] border-border/80 bg-muted/20 resize-none"
                      />
                    </div>
                  </div>

                  <div className="rounded-[1.4rem] border border-border/70 bg-muted/20 p-4">
                    <p className="text-sm font-black text-primary">What you&apos;ll get back</p>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-[1rem] border border-border/70 bg-white/90 p-3 text-sm text-muted-foreground">
                        A full cover letter draft with clearer role alignment.
                      </div>
                      <div className="rounded-[1rem] border border-border/70 bg-white/90 p-3 text-sm text-muted-foreground">
                        A shorter email version and a suggested subject line.
                      </div>
                      <div className="rounded-[1rem] border border-border/70 bg-white/90 p-3 text-sm text-muted-foreground">
                        Key themes the draft is built around.
                      </div>
                      <div className="rounded-[1rem] border border-border/70 bg-white/90 p-3 text-sm text-muted-foreground">
                        Editing tips so you can personalize before sending.
                      </div>
                    </div>
                  </div>
                </div>

                <DialogFooter className="sticky bottom-0 bg-background pt-4">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="rounded-xl">
                    Cancel
                  </Button>
                  <Button
                    onClick={handleGenerate}
                    className="rounded-xl px-8"
                    disabled={isGenerating || !genData.resumeId || !genData.jobDescription.trim() || !canGenerateCoverLetters}
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Drafting...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Generate package
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </section>

      {!canGenerateCoverLetters && (
        <Card className="border-none bg-white">
          <CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between md:p-6">
            <div className="space-y-1">
              <p className="text-sm font-black text-primary">Cover letters are currently locked on the free plan.</p>
              <p className="text-sm text-muted-foreground">
                Upgrade to Pro or Master to generate tailored letters, short email versions, and reusable application drafts.
              </p>
            </div>
            <Button className="rounded-2xl px-6 font-bold" asChild>
              <Link href="/settings">Upgrade plan</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {!resumes?.length && (
        <Card className="border-none bg-white">
          <CardContent className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <p className="text-sm font-black text-primary">You need at least one resume before cover letters become useful.</p>
              <p className="text-sm text-muted-foreground">
                Upload or build a resume first so the letter generator can pull real evidence instead of guessing.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button variant="outline" className="rounded-2xl font-bold" asChild>
                <Link href="/onboarding/upload">Upload CV</Link>
              </Button>
              <Button className="rounded-2xl font-bold" asChild>
                <Link href="/editor">Open builder</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-primary/20" />
        </div>
      ) : filteredLetters.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredLetters.map((letter) => {
            const previewText = richTextToPlainText(letter.content).slice(0, 240)
            return (
              <Card key={letter.id} className="flex h-full flex-col overflow-hidden border-none bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl">
                <CardHeader className="space-y-4 bg-muted/20 p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl border bg-white text-primary shadow-sm">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="flex flex-wrap justify-end gap-2">
                      {letter.tone && (
                        <Badge variant="secondary" className="bg-white px-3 py-1 text-[0.65rem] font-black uppercase tracking-[0.2em]">
                          {letter.tone}
                        </Badge>
                      )}
                      {letter.length && (
                        <Badge variant="outline" className="bg-white px-3 py-1 text-[0.65rem] font-black uppercase tracking-[0.2em]">
                          {letter.length}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <CardTitle className="line-clamp-2 text-xl font-black tracking-tight text-primary">
                      {letter.role || "Untitled cover letter"}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2 text-sm font-semibold text-accent">
                      <Briefcase className="h-4 w-4" />
                      {letter.company || "Company not specified"}
                    </CardDescription>
                    {letter.subjectLine && (
                      <p className="line-clamp-2 text-sm text-muted-foreground">
                        <span className="font-semibold text-primary">Subject:</span> {letter.subjectLine}
                      </p>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="flex-1 space-y-4 p-6">
                  <p className="line-clamp-5 text-sm leading-relaxed text-muted-foreground">
                    {previewText || "Open this draft to edit the letter body, email version, and personalization notes."}
                  </p>

                  {letter.keyThemes?.length ? (
                    <div className="flex flex-wrap gap-2">
                      {letter.keyThemes.slice(0, 3).map((theme) => (
                        <Badge
                          key={theme}
                          variant="outline"
                          className="rounded-full border-accent/20 bg-accent/5 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-accent"
                        >
                          {theme}
                        </Badge>
                      ))}
                    </div>
                  ) : null}

                  <div className="space-y-2 rounded-[1.2rem] border border-border/70 bg-muted/20 p-4">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
                      <UserRound className="h-3.5 w-3.5" />
                      Letter source
                    </div>
                    <p className="text-sm font-semibold text-primary">{letter.resumeName || "Selected resume"}</p>
                    <p className="text-xs text-muted-foreground">
                      Updated {letter.updatedAt?.toDate ? letter.updatedAt.toDate().toLocaleDateString() : letter.createdAt?.toDate ? letter.createdAt.toDate().toLocaleDateString() : "recently"}
                    </p>
                  </div>
                </CardContent>

                <CardFooter className="grid grid-cols-[1fr_auto_auto] gap-2 p-6 pt-0">
                  <Button variant="outline" size="sm" className="rounded-xl font-bold uppercase tracking-[0.18em]" asChild>
                    <Link href={`/cover-letters/${letter.id}`}>
                      <Eye className="mr-2 h-3.5 w-3.5" />
                      View & edit
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-xl"
                    onClick={() => handleCopyEmail(letter)}
                    title="Copy email version"
                  >
                    <Mail className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => handleDelete(letter.id)}
                    title="Delete cover letter"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center space-y-5 rounded-[2rem] border-2 border-dashed border-border/80 px-6 py-20 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
            <ClipboardType className="h-10 w-10 text-muted-foreground" />
          </div>
          <div className="max-w-md space-y-2">
            <h2 className="text-2xl font-black tracking-tight text-primary">
              {searchTerm ? "No letters matched that search" : "No cover letters yet"}
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {searchTerm
                ? "Try another company, role, or keyword. We search across saved letter content, subject lines, and themes."
                : "Generate your first tailored cover letter package to get a full letter, a shorter email version, and editing guidance in one place."}
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            {searchTerm ? (
              <Button variant="outline" className="rounded-xl font-bold" onClick={() => setSearchTerm("")}>
                Clear search
              </Button>
            ) : canGenerateCoverLetters ? (
              <Button className="rounded-xl font-bold" onClick={() => setIsDialogOpen(true)} disabled={!resumes?.length}>
                <Sparkles className="mr-2 h-4 w-4" />
                Create first letter
              </Button>
            ) : (
              <Button className="rounded-xl font-bold" asChild>
                <Link href="/settings">Upgrade for letters</Link>
              </Button>
            )}
            <Button variant="outline" className="rounded-xl font-bold" asChild>
              <Link href="/editor">
                <Target className="mr-2 h-4 w-4" />
                Improve resume first
              </Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
