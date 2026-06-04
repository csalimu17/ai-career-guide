"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { doc, serverTimestamp, updateDoc } from "firebase/firestore"
import {
  AlertCircle,
  ArrowLeft,
  Copy,
  FileDown,
  FileText,
  Loader2,
  Mail,
  Save,
  Sparkles,
} from "lucide-react"

import { useDoc, useFirestore, useMemoFirebase, useUser } from "@/firebase"
import { RichTextField } from "@/components/editor/rich-text-field"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/hooks/use-toast"
import { richTextToPlainText } from "@/lib/rich-text"

type CoverLetterRecord = {
  id: string
  company?: string
  role?: string
  hiringManager?: string
  resumeName?: string
  content?: string
  emailVersion?: string
  subjectLine?: string
  tone?: string
  length?: string
  keyThemes?: string[]
  customizationTips?: string[]
}

function sanitizeFileName(value: string) {
  return value.replace(/[^a-z0-9-_]+/gi, "-").replace(/-+/g, "-").replace(/^-|-$/g, "")
}

export default function EditCoverLetterPage() {
  const { id } = useParams()
  const { user } = useUser()
  const db = useFirestore()
  const [content, setContent] = useState("")
  const [subjectLine, setSubjectLine] = useState("")
  const [emailVersion, setEmailVersion] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  const letterRef = useMemoFirebase(() => {
    if (!db || !user || !id) return null
    return doc(db, "users", user.uid, "coverLetters", id as string)
  }, [db, user, id])

  const { data: letter, isLoading } = useDoc<CoverLetterRecord>(letterRef)

  useEffect(() => {
    if (!letter) return
    setContent(letter.content || "")
    setSubjectLine(letter.subjectLine || "")
    setEmailVersion(letter.emailVersion || "")
  }, [letter])

  const plainLetterContent = useMemo(() => richTextToPlainText(content), [content])

  const handleSave = async () => {
    if (!letterRef) return
    setIsSaving(true)
    try {
      await updateDoc(letterRef, {
        content,
        subjectLine,
        emailVersion,
        updatedAt: serverTimestamp(),
      })
      toast({ title: "Letter saved", description: "Your edits, subject line, and email draft have been preserved." })
    } catch (error) {
      console.error("Failed to save cover letter:", error)
      toast({ variant: "destructive", title: "Save failed", description: "We couldn't save your latest edits." })
    } finally {
      setIsSaving(false)
    }
  }

  const handleCopyLetter = async () => {
    if (!plainLetterContent.trim()) return
    try {
      await navigator.clipboard.writeText(plainLetterContent)
      toast({ title: "Cover letter copied", description: "The full letter is ready to paste into your application." })
    } catch (error) {
      console.error("Failed to copy cover letter:", error)
      toast({ variant: "destructive", title: "Copy failed", description: "We couldn't copy the letter to your clipboard." })
    }
  }

  const handleCopyEmail = async () => {
    const draft = [subjectLine ? `Subject: ${subjectLine}` : null, emailVersion].filter(Boolean).join("\n\n")
    if (!draft.trim()) {
      toast({ variant: "destructive", title: "Nothing to copy", description: "Add an email draft first, then try again." })
      return
    }

    try {
      await navigator.clipboard.writeText(draft)
      toast({ title: "Email draft copied", description: "The short version is ready to paste into an email application." })
    } catch (error) {
      console.error("Failed to copy email draft:", error)
      toast({ variant: "destructive", title: "Copy failed", description: "We couldn't copy the email draft to your clipboard." })
    }
  }

  const handleExport = async () => {
    if (!plainLetterContent.trim()) {
      toast({ variant: "destructive", title: "Nothing to export", description: "Add some letter content before exporting a PDF." })
      return
    }

    setIsExporting(true)
    try {
      const { jsPDF } = await import("jspdf")
      const pdf = new jsPDF({ unit: "pt", format: "a4" })
      const margin = 56
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const contentWidth = pageWidth - margin * 2
      let cursorY = margin

      const writeBlock = (text: string, options?: { fontSize?: number; fontStyle?: "normal" | "bold"; spacingAfter?: number }) => {
        if (!text.trim()) return
        const fontSize = options?.fontSize ?? 11
        const lineHeight = fontSize * 1.45
        pdf.setFont("helvetica", options?.fontStyle || "normal")
        pdf.setFontSize(fontSize)
        const lines = pdf.splitTextToSize(text, contentWidth)

        if (cursorY + lines.length * lineHeight > pageHeight - margin) {
          pdf.addPage()
          cursorY = margin
        }

        pdf.text(lines, margin, cursorY)
        cursorY += lines.length * lineHeight + (options?.spacingAfter ?? 10)
      }

      writeBlock(`${letter?.role || "Cover Letter"}${letter?.company ? ` - ${letter.company}` : ""}`, {
        fontSize: 20,
        fontStyle: "bold",
        spacingAfter: 16,
      })

      if (subjectLine.trim()) {
        writeBlock(`Subject: ${subjectLine}`, { fontSize: 10, fontStyle: "bold", spacingAfter: 18 })
      }

      plainLetterContent.split(/\n{2,}/).forEach((paragraph) => {
        writeBlock(paragraph.trim(), { fontSize: 11, spacingAfter: 14 })
      })

      const exportName = sanitizeFileName(`${letter?.role || "cover-letter"}-${letter?.company || "application"}`) || "cover-letter"
      pdf.save(`${exportName}.pdf`)
      toast({ title: "PDF ready", description: "Your cover letter has been downloaded as a clean PDF." })
    } catch (error) {
      console.error("Cover letter export failed:", error)
      toast({ variant: "destructive", title: "Export failed", description: "We couldn't generate the PDF right now." })
    } finally {
      setIsExporting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary/20" />
      </div>
    )
  }

  if (!letter) {
    return (
      <div className="mx-auto max-w-2xl py-20">
        <Card className="overflow-hidden rounded-[2.5rem] border-none bg-white shadow-xl">
          <CardHeader className="p-8 pb-4 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
              <AlertCircle className="h-7 w-7" />
            </div>
            <CardTitle className="text-2xl font-black text-primary">Cover letter not found</CardTitle>
            <CardDescription>
              This letter may have been deleted, or your session no longer has access to it.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 p-8 pt-2 sm:flex-row sm:justify-center">
            <Button asChild className="rounded-xl px-6 font-bold">
              <Link href="/cover-letters">Back to collection</Link>
            </Button>
            <Button variant="outline" asChild className="rounded-xl px-6 font-bold">
              <Link href="/cover-letters">Create another letter</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 pb-20 pt-4 md:space-y-8 md:px-8 md:pt-8">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" asChild className="mt-1 rounded-full hover:bg-muted">
            <Link href="/cover-letters">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="rounded-full px-3 py-1 text-[0.65rem] font-black uppercase tracking-[0.2em]">
                Cover letter studio
              </Badge>
              {letter.tone ? (
                <Badge variant="secondary" className="rounded-full bg-white px-3 py-1 text-[0.65rem] font-black uppercase tracking-[0.2em]">
                  {letter.tone}
                </Badge>
              ) : null}
              {letter.length ? (
                <Badge variant="outline" className="rounded-full px-3 py-1 text-[0.65rem] font-black uppercase tracking-[0.2em]">
                  {letter.length}
                </Badge>
              ) : null}
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight text-primary">
                {letter.role || "Cover letter"}{letter.company ? ` at ${letter.company}` : ""}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Edit the full letter, polish the email version, and export a clean PDF when it&apos;s ready to send.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button variant="outline" className="rounded-xl font-bold" onClick={handleCopyLetter}>
            <Copy className="mr-2 h-4 w-4" />
            Copy letter
          </Button>
          <Button variant="outline" className="rounded-xl font-bold" onClick={handleCopyEmail}>
            <Mail className="mr-2 h-4 w-4" />
            Copy email
          </Button>
          <Button variant="outline" className="rounded-xl font-bold" onClick={handleSave} disabled={isSaving}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save
          </Button>
          <Button className="rounded-xl font-bold" onClick={handleExport} disabled={isExporting}>
            {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileDown className="mr-2 h-4 w-4" />}
            Export PDF
          </Button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="overflow-hidden rounded-[2rem] border-none bg-white shadow-sm">
          <CardHeader className="border-b bg-[#fafafa] p-6 md:p-8">
            <CardTitle className="flex items-center gap-2 text-xl font-black">
              <FileText className="h-5 w-5 text-secondary" />
              Full letter editor
            </CardTitle>
            <CardDescription>
              Use the formatting toolbar to shape the body like a real document, not just a plain text note.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 md:p-8">
            <RichTextField
              value={content}
              onChange={setContent}
              placeholder="Your full cover letter will appear here. You can refine structure, emphasize key wins, and shape the final narrative before sending."
              minHeightClassName="min-h-[520px]"
              editorClassName="font-serif text-[15px]"
            />
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="rounded-[2rem] border-none bg-white shadow-sm">
            <CardHeader className="p-6 md:p-8">
              <CardTitle className="flex items-center gap-2 text-xl font-black">
                <Sparkles className="h-5 w-5 text-accent" />
                Application package
              </CardTitle>
              <CardDescription>
                Keep the main details, subject line, and short email version together so this letter is easier to send.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 p-6 pt-0 md:p-8 md:pt-0">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-[1.2rem] border border-border/70 bg-muted/20 p-4">
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Company</p>
                  <p className="mt-2 text-sm font-semibold text-primary">{letter.company || "Not specified"}</p>
                </div>
                <div className="rounded-[1.2rem] border border-border/70 bg-muted/20 p-4">
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Resume source</p>
                  <p className="mt-2 text-sm font-semibold text-primary">{letter.resumeName || "Selected resume"}</p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Subject line
                </label>
                <Input
                  value={subjectLine}
                  onChange={(event) => setSubjectLine(event.target.value)}
                  placeholder="Subject line for email applications"
                  className="h-12 rounded-2xl border-border/80 bg-muted/20"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Short email version
                </label>
                <Textarea
                  value={emailVersion}
                  onChange={(event) => setEmailVersion(event.target.value)}
                  placeholder="A shorter outreach version will appear here..."
                  className="min-h-[180px] rounded-[1.5rem] border-border/80 bg-muted/20 resize-none"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[2rem] border-none bg-white shadow-sm">
            <CardHeader className="p-6 md:p-8">
              <CardTitle className="text-xl font-black">AI guidance</CardTitle>
              <CardDescription>
                These themes and tips make it easier to personalize before you send the application.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 p-6 pt-0 md:p-8 md:pt-0">
              <div>
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Core themes
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {letter.keyThemes?.length ? (
                    letter.keyThemes.map((theme) => (
                      <Badge
                        key={theme}
                        variant="outline"
                        className="rounded-full border-accent/20 bg-accent/5 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-accent"
                      >
                        {theme}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">Generate a new letter package to get theme guidance here.</p>
                  )}
                </div>
              </div>

              <div>
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Personalization checklist
                </p>
                <div className="mt-3 space-y-3">
                  {letter.customizationTips?.length ? (
                    letter.customizationTips.map((tip) => (
                      <div key={tip} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary/40" />
                        <span>{tip}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      This saved draft doesn&apos;t have AI tips yet. New cover letters will include a stronger personalization checklist.
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
