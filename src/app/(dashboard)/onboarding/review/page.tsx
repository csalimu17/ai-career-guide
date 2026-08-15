"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { addDoc, collection, doc, serverTimestamp, updateDoc } from "firebase/firestore"
import { useCollection, useDoc, useFirestore, useMemoFirebase, useUser } from "@/firebase"
import { supabaseDb } from "@/lib/supabase/db"
import { getPlanLimits } from "@/lib/plans"
import { CvDataExtractionOutput } from "@/types/cv"
import { toast } from "@/hooks/use-toast"
import { hasMeaningfulExtraction, hasRecoverableDraft } from "@/lib/resume-text-recovery"
import { plainTextToRichTextHtml } from "@/lib/rich-text"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  AlertTriangle,
  ArrowRight,
  Briefcase,
  CheckCircle2,
  FileText,
  Loader2,
  ShieldCheck,
  Sparkles,
} from "lucide-react"

export default function ReviewParsedDataPage() {
  const router = useRouter()
  const { user } = useUser()
  const db = useFirestore()

  const [parsedData, setParsedData] = useState<CvDataExtractionOutput | null>(null)
  const [resumeName, setResumeName] = useState("My Professional Resume")
  const [isSaving, setIsSaving] = useState(false)

  const userDocRef = useMemoFirebase(() => {
    if (!db || !user) return null
    return doc(db, "users", user.uid)
  }, [db, user])
  const { data: profile } = useDoc(userDocRef)

  const resumesQuery = useMemoFirebase(() => {
    if (!db || !user) return null
    return collection(db, "users", user.uid, "resumes")
  }, [db, user])
  const { data: resumes } = useCollection(resumesQuery)

  useEffect(() => {
    const data = sessionStorage.getItem("parsedCvData")
    if (data) {
      setParsedData(JSON.parse(data))
      return
    }

    router.push("/onboarding/upload")
  }, [router])

  const handleUpdate = (path: string, value: any) => {
    if (!parsedData) return
    const newData = { ...parsedData }
    const keys = path.split(".")
    let current: any = newData

    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]]
    }

    current[keys[keys.length - 1]] = value
    setParsedData(newData)
  }

  const handleConfirm = async () => {
    if (!parsedData) return

    if (!user || !db) {
      sessionStorage.setItem("importedResumeDraft", JSON.stringify(parsedData))
      toast({
        title: "Draft Saved!",
        description: "Opening editor workspace...",
      })
      router.push("/cv-editor")
      return
    }

    const plan = profile?.plan || "free"
    const limits = getPlanLimits(plan)
    if (resumes && resumes.length >= limits.maxResumes) {
      toast({
        variant: "destructive",
        title: "Limit Reached",
        description: `You've reached your ${plan} plan limit of ${limits.maxResumes} resumes.`,
        action: (
          <Button variant="outline" size="sm" asChild className="text-xs font-bold">
            <Link href="/settings">Upgrade</Link>
          </Button>
        ),
      })
      return
    }

    setIsSaving(true)
    try {
      const resumesRef = collection(db, "users", user.uid, "resumes")
      const resumeObject = {
        userId: user.uid,
        name: resumeName,
        templateId: "classic",
        sectionOrder: ["summary", "experience", "education", "skills", "projects", "certifications", "languages"],
        content: {
          personal: {
            name: parsedData.personalDetails?.name || "",
            title: parsedData.workExperience?.[0]?.title || "",
            email: parsedData.personalDetails?.email || user.email || "",
            phone: parsedData.personalDetails?.phone || "",
            location: parsedData.personalDetails?.location || "",
            linkedin: parsedData.personalDetails?.linkedin || "",
            website: parsedData.personalDetails?.website || "",
          },
          summary: plainTextToRichTextHtml(parsedData.summary || ""),
          experience: parsedData.workExperience?.map((exp: any, index: number) => ({
            id: `exp-${Date.now()}-${index}`,
            title: exp.title || "",
            company: exp.company || "",
            period: [exp.startDate, exp.endDate || "Present"].filter(Boolean).join(" - "),
            description: plainTextToRichTextHtml(
              exp.description
                ?.map((line: string) => (line.startsWith("-") ? line : `- ${line}`))
                .join("\n") || ""
            ),
          })) || [],
          education: parsedData.education?.map((edu: any, index: number) => ({
            id: `edu-${Date.now()}-${index}`,
            degree: edu.degree || "",
            school: edu.institution || "",
            period: edu.graduationDate || "",
            description: edu.description || "",
          })) || [],
          skills: parsedData.skills || [],
          languages: parsedData.languages || [],
          projects: parsedData.projects?.map((proj: any, index: number) => ({
            id: `proj-${Date.now()}-${index}`,
            name: proj.name || "",
            description: proj.description || "",
            url: proj.url || "",
            period: proj.period || "",
          })) || [],
          certifications: parsedData.certifications?.map((cert: any, index: number) => ({
            id: `cert-${Date.now()}-${index}`,
            name: cert.name || "",
            issuer: cert.issuer || "",
            date: cert.date || "",
          })) || [],
          customSections: parsedData.customSections?.map((section: any, index: number) => ({
            id: `custom-${Date.now()}-${index}`,
            title: section.title || "",
            content: section.content || "",
          })) || [],
        },
        sourceExtraction: {
          parsingMethod: parsedData.metadata?.parsingMethod || "manual",
          confidence: parsedData.metadata?.confidence ?? null,
          guardianStatus: parsedData.metadata?.guardian?.status || null,
          jobId: parsedData.metadata?.jobId || null,
          missingFields: parsedData.metadata?.missingFields || [],
          reviewRequired: !hasMeaningfulExtraction(parsedData),
        },
        styles: {
          primaryColor: "#1e293b",
          fontFamily: "serif",
          fontSize: 12,
          lineHeight: 1.5,
          margins: 40,
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }

      try {
        if (db) {
          await addDoc(resumesRef, resumeObject)
          if (userDocRef) {
            await updateDoc(userDocRef, {
              onboardingComplete: true,
              updatedAt: serverTimestamp(),
            })
          }
        } else {
          throw new Error('No firestore')
        }
      } catch (err) {
        await supabaseDb.saveResume(user.uid, resumeObject)
        await supabaseDb.updateProfile(user.uid, { onboarding_complete: true })
      }
      sessionStorage.removeItem("parsedCvData")
      toast({
        title: "Resume Draft Saved!",
        description: "Opening editor workspace...",
      })
      router.push("/cv-editor")
    } catch (error) {
      console.error(error)
      toast({ variant: "destructive", title: "Error Saving", description: "Something went wrong saving your resume draft." })
    } finally {
      setIsSaving(false)
    }
  }

  if (!parsedData) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-3">
        <Loader2 className="h-6 w-6 animate-spin text-primary opacity-40" />
        <p className="text-xs font-medium text-slate-400">Loading parsed data...</p>
      </div>
    )
  }

  const isHealthy = parsedData.metadata?.confidence ? parsedData.metadata.confidence > 0.5 : true
  const isBlockedFallback = !hasRecoverableDraft(parsedData)

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 md:px-8 md:py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px] font-semibold uppercase">
              Extraction Complete
            </Badge>
            <span className="text-xs text-muted-foreground">• Verify & Edit</span>
          </div>
          <h1 className="text-xl font-black tracking-tight text-slate-900 sm:text-2xl">
            Review Extracted Profile
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild className="h-8 text-xs">
            <Link href="/onboarding/upload">Re-upload File</Link>
          </Button>
          <Button
            size="sm"
            className="h-8 text-xs font-bold px-4"
            onClick={handleConfirm}
            disabled={isSaving || isBlockedFallback}
          >
            {isSaving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
            ) : (
              <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
            )}
            Confirm & Save
          </Button>
        </div>
      </div>

      {!isHealthy && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-3.5 text-xs text-amber-900 flex items-start gap-2.5">
          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
          <div>
            <span className="font-bold">Partial Extraction Warning:</span> Some sections could not be fully structured. Please review and complete missing fields below.
          </div>
        </div>
      )}

      {/* Grid Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Details (2 cols) */}
        <div className="space-y-5 lg:col-span-2">
          {/* Personal Details */}
          <Card className="rounded-xl border border-slate-200/80 shadow-xs">
            <CardHeader className="py-3 px-4 border-b">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <EditableItem label="Full Name" value={parsedData.personalDetails?.name} onChange={(v) => handleUpdate("personalDetails.name", v)} />
              <EditableItem label="Email Address" value={parsedData.personalDetails?.email} onChange={(v) => handleUpdate("personalDetails.email", v)} />
              <EditableItem label="Phone Number" value={parsedData.personalDetails?.phone} onChange={(v) => handleUpdate("personalDetails.phone", v)} />
              <EditableItem label="Location" value={parsedData.personalDetails?.location} onChange={(v) => handleUpdate("personalDetails.location", v)} />
            </CardContent>
          </Card>

          {/* Professional Summary */}
          <Card className="rounded-xl border border-slate-200/80 shadow-xs">
            <CardHeader className="py-3 px-4 border-b">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-primary" />
                Professional Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <Textarea
                className="min-h-[100px] rounded-lg text-xs leading-relaxed"
                value={parsedData.summary || ""}
                onChange={(e) => handleUpdate("summary", e.target.value)}
                placeholder="Enter professional summary..."
              />
            </CardContent>
          </Card>

          {/* Work Experience */}
          <Card className="rounded-xl border border-slate-200/80 shadow-xs">
            <CardHeader className="py-3 px-4 border-b flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Briefcase className="h-3.5 w-3.5 text-primary" />
                Work Experience ({parsedData.workExperience?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              {parsedData.workExperience && parsedData.workExperience.length > 0 ? (
                parsedData.workExperience.map((exp, index) => (
                  <div key={index} className="rounded-lg border p-3 space-y-2 bg-slate-50/50">
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <Input
                        className="h-8 rounded text-xs font-bold"
                        value={exp.title || ""}
                        placeholder="Job Title"
                        onChange={(e) => {
                          const nextExp = [...parsedData.workExperience!]
                          nextExp[index].title = e.target.value
                          handleUpdate("workExperience", nextExp)
                        }}
                      />
                      <Input
                        className="h-8 rounded text-xs"
                        value={exp.company || ""}
                        placeholder="Company Name"
                        onChange={(e) => {
                          const nextExp = [...parsedData.workExperience!]
                          nextExp[index].company = e.target.value
                          handleUpdate("workExperience", nextExp)
                        }}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Input
                        className="h-7 rounded text-[11px]"
                        value={exp.startDate || ""}
                        placeholder="Start Date"
                        onChange={(e) => {
                          const nextExp = [...parsedData.workExperience!]
                          nextExp[index].startDate = e.target.value
                          handleUpdate("workExperience", nextExp)
                        }}
                      />
                      <Input
                        className="h-7 rounded text-[11px]"
                        value={exp.endDate || ""}
                        placeholder="End Date"
                        onChange={(e) => {
                          const nextExp = [...parsedData.workExperience!]
                          nextExp[index].endDate = e.target.value
                          handleUpdate("workExperience", nextExp)
                        }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-muted-foreground italic text-center py-2">No work history parsed.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Save Box (1 col) */}
        <div className="space-y-4">
          <Card className="rounded-xl border border-slate-200/80 shadow-xs">
            <CardHeader className="py-3 px-4 border-b">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Save & Open Resume
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Resume Document Title</label>
                <Input
                  className="h-9 rounded-lg text-xs"
                  value={resumeName}
                  onChange={(e) => setResumeName(e.target.value)}
                  placeholder="e.g. Software Engineer Resume"
                />
              </div>

              <div className="rounded-lg bg-slate-50 p-3 space-y-1">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span>Confidence Score</span>
                  <span className="text-primary">{Math.round((parsedData.metadata?.confidence || 0.5) * 100)}%</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full bg-primary"
                    style={{ width: `${Math.round((parsedData.metadata?.confidence || 0.5) * 100)}%` }}
                  />
                </div>
              </div>

              <Button
                size="sm"
                className="h-9 w-full rounded-lg text-xs font-bold"
                onClick={handleConfirm}
                disabled={isSaving || isBlockedFallback}
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                )}
                Save Draft & Open Editor
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function EditableItem({
  label,
  value,
  onChange,
}: {
  label: string
  value?: string
  onChange: (v: string) => void
}) {
  return (
    <div className="space-y-1">
      <label className="text-[11px] font-semibold text-slate-600">{label}</label>
      <Input
        className="h-8 rounded-lg text-xs"
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={`Enter ${label.toLowerCase()}`}
      />
    </div>
  )
}
