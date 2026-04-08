"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { addDoc, collection, doc, serverTimestamp, updateDoc } from "firebase/firestore"
import { useCollection, useDoc, useFirestore, useMemoFirebase, useUser } from "@/firebase"
import { getPlanLimits } from "@/lib/plans"
import { CvDataExtractionOutput } from "@/types/cv"
import { toast } from "@/hooks/use-toast"
import { hasMeaningfulExtraction, hasRecoverableDraft } from "@/lib/resume-text-recovery"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  AlertTriangle,
  ArrowRight,
  Briefcase,
  CheckCircle2,
  FileText,
  Layout,
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
    if (!user || !db || !parsedData) return

    const plan = profile?.plan || "free"
    const limits = getPlanLimits(plan)
    if (resumes && resumes.length >= limits.maxResumes) {
      toast({
        variant: "destructive",
        title: "Limit Reached",
        description: `You've reached your ${plan} plan limit of ${limits.maxResumes} resumes.`,
        action: (
          <Button variant="outline" size="sm" asChild className="border-2 font-bold">
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
            email: parsedData.personalDetails?.email || user.email || "",
            phone: parsedData.personalDetails?.phone || "",
            location: parsedData.personalDetails?.location || "",
            linkedin: parsedData.personalDetails?.linkedin || "",
            website: parsedData.personalDetails?.website || "",
          },
          summary: parsedData.summary || "",
          experience: parsedData.workExperience?.map((exp: any, index: number) => ({
            id: `exp-${Date.now()}-${index}`,
            title: exp.title,
            company: exp.company,
            period: `${exp.startDate} - ${exp.endDate || "Present"}`,
            description: exp.description?.map((line: string) => line.startsWith("-") ? line : `- ${line}`).join("\n") || "",
          })) || [],
          education: parsedData.education?.map((edu: any, index: number) => ({
            id: `edu-${Date.now()}-${index}`,
            degree: edu.degree,
            institution: edu.institution,
            period: edu.graduationDate || "",
          })) || [],
          skills: parsedData.skills || [],
          languages: parsedData.languages || [],
          projects: parsedData.projects?.map((proj: any, index: number) => ({
            id: `proj-${Date.now()}-${index}`,
            ...proj,
          })) || [],
          certifications: parsedData.certifications?.map((cert: any, index: number) => ({
            id: `cert-${Date.now()}-${index}`,
            ...cert,
          })) || [],
          customSections: parsedData.customSections?.map((section: any, index: number) => ({
            id: `custom-${Date.now()}-${index}`,
            ...section,
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

      const resumeDoc = await addDoc(resumesRef, resumeObject)
      if (userDocRef) {
        await updateDoc(userDocRef, {
          onboardingComplete: true,
          updatedAt: serverTimestamp(),
        })
      }
      sessionStorage.removeItem("parsedCvData")
      toast({
        title: "Workspace Ready!",
        description: hasMeaningfulExtraction(parsedData)
          ? "Your draft is saved and ready in the editor."
          : "Your partial draft is saved. You can finish refining it in the editor.",
      })
      router.push(`/editor?id=${resumeDoc.id}`)
    } catch (error) {
      console.error(error)
      toast({ variant: "destructive", title: "Error Saving", description: "Something went wrong." })
    } finally {
      setIsSaving(false)
    }
  }

  if (!parsedData) {
    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary opacity-20" />
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Loading parser state...</p>
      </div>
    )
  }

  const isHealthy = parsedData.metadata?.confidence ? parsedData.metadata.confidence > 0.5 : true
  const guardian = parsedData.metadata?.guardian
  const requiresManualReview = !hasMeaningfulExtraction(parsedData)
  const isBlockedFallback = !hasRecoverableDraft(parsedData)

  return (
    <div className="mobile-app-page md:mx-auto md:max-w-6xl md:space-y-10 md:px-4 md:py-12 animate-in space-y-6 duration-700 fade-in slide-in-from-bottom-4">
      <div className="space-y-2 text-center md:space-y-3">
        <div className="flex flex-wrap justify-center gap-2">
          <Badge variant="outline" className="rounded-full border-accent/20 bg-accent/5 px-4 py-1.5 font-bold text-accent">
            <Sparkles className="mr-2 h-3.5 w-3.5" /> AI Analysis Complete
          </Badge>
          <Badge variant={isHealthy ? "default" : "destructive"} className="rounded-full px-3 text-[9px] font-black uppercase tracking-tighter">
            {parsedData.metadata?.parsingMethod?.toUpperCase() || "MANUAL"} MODE
          </Badge>
          {guardian?.activated ? (
            <Badge variant="outline" className="rounded-full border-emerald-200 bg-emerald-50 px-3 text-[9px] font-black uppercase tracking-tighter text-emerald-700">
              Guardian {guardian.status}
            </Badge>
          ) : null}
        </div>
        <h1 className="text-[1.85rem] font-black tracking-tight text-primary md:text-5xl">Review Your Story</h1>
        <p className="mx-auto max-w-2xl text-sm font-medium text-muted-foreground sm:text-lg">
          {isHealthy
            ? "We've successfully extracted your profile. Briefly verify the details below."
            : "The document was complex. Please check for missing fields highlighted in red."}
        </p>
        <div className="flex justify-center">
          <Button variant="outline" asChild className="h-10 rounded-xl border-2 font-bold md:h-11">
            <Link href="/onboarding/upload">Upload a different CV</Link>
          </Button>
        </div>
      </div>

      {!isHealthy && (
        <div className="animate-pulse rounded-[1.4rem] border-2 border-red-100 bg-red-50 p-4 text-red-900 shadow-sm sm:p-6 md:flex md:items-center md:justify-between md:rounded-[2rem]">
          <div className="flex items-start gap-4">
            <AlertTriangle className="mt-1 h-6 w-6 shrink-0" />
            <div className="space-y-1">
              <p className="text-xs font-black uppercase tracking-widest">Low Confidence Detection</p>
              <p className="text-sm font-medium opacity-80">
                This document was likely scanned or has a complex layout. Some AI extraction failed; please review fields in red.
              </p>
            </div>
          </div>
          <div className="hidden gap-2 md:flex">
            <Badge variant="outline" className="border-red-200 bg-white/50 text-red-700">
              Missing: {parsedData.metadata?.missingFields?.length || 0}
            </Badge>
          </div>
        </div>
      )}

      {guardian?.activated ? (
        <div className="rounded-[1.4rem] border border-emerald-200 bg-emerald-50 p-4 text-emerald-900 shadow-sm sm:p-6 md:rounded-[2rem]">
          <div className="flex items-start gap-4">
            <Sparkles className="mt-1 h-6 w-6 shrink-0 text-emerald-600" />
            <div className="space-y-2">
              <p className="text-xs font-black uppercase tracking-widest">Extraction Guardian</p>
              <p className="text-sm font-medium opacity-90">{guardian.summary}</p>
              {guardian.appliedFixes?.length ? (
                <ul className="space-y-1 text-sm text-emerald-800/80">
                  {guardian.appliedFixes.slice(0, 3).map((fix) => (
                    <li key={fix}>- {fix}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-3 lg:gap-10">
        <div className="space-y-6 lg:col-span-2 lg:space-y-12">
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-black uppercase tracking-tight text-primary">Contact Details</h2>
            </div>
            <Card className="overflow-hidden rounded-[1.6rem] border-none bg-white shadow-sm md:rounded-[2.5rem]">
              <CardContent className="p-4 sm:p-8 md:p-10">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-8">
                  <EditableItem label="Full Name" value={parsedData.personalDetails?.name} onChange={(value) => handleUpdate("personalDetails.name", value)} />
                  <EditableItem label="Email Address" value={parsedData.personalDetails?.email} onChange={(value) => handleUpdate("personalDetails.email", value)} />
                  <EditableItem label="Phone Number" value={parsedData.personalDetails?.phone} onChange={(value) => handleUpdate("personalDetails.phone", value)} />
                  <EditableItem label="Location (City, Country)" value={parsedData.personalDetails?.location} onChange={(value) => handleUpdate("personalDetails.location", value)} />
                </div>
              </CardContent>
            </Card>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <FileText className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-black uppercase tracking-tight text-primary">Professional Statement</h2>
            </div>
            <Card className="rounded-[1.6rem] border-none bg-white shadow-sm md:rounded-[2.5rem]">
              <CardContent className="p-4 sm:p-8 md:p-10">
                <Textarea
                  className="min-h-[120px] resize-none rounded-2xl border-none bg-muted/30 p-4 text-sm font-medium leading-relaxed focus-visible:ring-accent sm:p-6"
                  value={parsedData.summary || ""}
                  onChange={(e) => handleUpdate("summary", e.target.value)}
                  placeholder="Write a brief professional summary..."
                />
              </CardContent>
            </Card>
          </section>

          {parsedData.customSections && parsedData.customSections.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Layout className="h-5 w-5" />
                </div>
                <h2 className="text-xl font-black uppercase tracking-tight text-primary">Additional Details</h2>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
                {parsedData.customSections.map((section, index) => (
                  <Card key={index} className="rounded-[1.4rem] border-none bg-white shadow-sm md:rounded-[2rem]">
                    <CardHeader className="p-5 pb-3 sm:p-8 sm:pb-3">
                      <CardTitle className="text-sm font-black uppercase tracking-widest text-primary/40">{section.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0 sm:p-8 sm:pt-0">
                      <p className="text-sm font-medium leading-relaxed text-slate-600">{section.content}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}

          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Briefcase className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-black uppercase tracking-tight text-primary">Key Positions</h2>
            </div>
                <div className="space-y-4 md:space-y-6">
              {parsedData.workExperience && parsedData.workExperience.length > 0 ? (
                parsedData.workExperience.map((exp, index) => (
                  <Card key={index} className="group rounded-[1.6rem] border-none bg-white shadow-sm transition-all duration-500 hover:shadow-xl md:rounded-[2.5rem]">
                    <CardContent className="p-4 sm:p-8">
                      <div className="flex flex-col gap-4 md:flex-row md:gap-6">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border-2 border-accent/20 bg-accent/10 text-base font-black text-accent transition-all duration-500 group-hover:bg-accent group-hover:text-white md:h-14 md:w-14 md:text-xl">
                          {exp.company?.[0] || "?"}
                        </div>
                        <div className="flex-1 space-y-4">
                          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <Input
                              className="h-auto border-none bg-transparent p-0 text-lg font-black placeholder:text-red-300 focus-visible:ring-0"
                              value={exp.title}
                              placeholder="Missing Title"
                              onChange={(e) => {
                                const nextExperience = [...parsedData.workExperience!]
                                nextExperience[index].title = e.target.value
                                handleUpdate("workExperience", nextExperience)
                              }}
                            />
                            <Input
                              className="hidden h-auto border-none bg-transparent p-0 text-right text-sm font-bold text-muted-foreground focus-visible:ring-0 md:block"
                              value={exp.company}
                              onChange={(e) => {
                                const nextExperience = [...parsedData.workExperience!]
                                nextExperience[index].company = e.target.value
                                handleUpdate("workExperience", nextExperience)
                              }}
                            />
                          </div>
                          <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                            {exp.startDate} - {exp.endDate || "Present"}
                          </div>
                          <div className="space-y-2 pt-2">
                            {exp.description?.map((point, pointIndex) => (
                              <div key={pointIndex} className="flex items-start gap-2 text-sm font-medium leading-relaxed text-slate-600">
                                <span className="mt-1 text-secondary">-</span>
                                <span>{String(point).replace(/^[\u2022-]\s*/, "")}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="space-y-4 rounded-[2rem] border-4 border-dashed border-red-100 bg-red-50/20 p-8 text-center sm:rounded-[3rem] sm:p-12">
                  <AlertTriangle className="mx-auto h-10 w-10 text-red-200" />
                  <p className="text-xs font-bold uppercase tracking-widest text-red-900/40">No work history detected</p>
                </div>
              )}
            </div>
          </section>
        </div>

        <div className="space-y-8">
          <Card className="overflow-hidden rounded-[2.5rem] border-none border-t-8 border-accent bg-primary text-primary-foreground shadow-2xl lg:sticky lg:top-24">
            <CardHeader className="p-5 pb-4 sm:p-8 sm:pb-4 md:p-10 md:pb-4">
              <div className="mb-2 flex items-center justify-between">
                <Badge variant="outline" className="rounded-full border-none bg-white/10 px-2 text-[8px] text-white/60">
                  {parsedData.metadata?.jobId}
                </Badge>
                <div className="flex gap-1">
                  <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                  <div className="h-1.5 w-1.5 rounded-full bg-green-500 opacity-50" />
                  <div className="h-1.5 w-1.5 rounded-full bg-green-500 opacity-30" />
                </div>
              </div>
              <CardTitle className="flex items-center gap-3 text-2xl font-black sm:text-3xl">
                <Sparkles className="h-8 w-8 fill-accent text-accent" />
                Proceed
              </CardTitle>
              <CardDescription className="font-medium text-primary-foreground/60">Ready to see your new CV?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 p-5 pt-0 sm:space-y-8 sm:p-8 sm:pt-0 md:p-10 md:pt-0">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest opacity-50">CV Name</label>
                  <Input
                    value={resumeName}
                    onChange={(e) => setResumeName(e.target.value)}
                    placeholder="e.g. My Pro Resume"
                    className="h-12 rounded-xl border-none bg-white/10 font-bold text-white placeholder:text-white/30 focus-visible:ring-accent"
                  />
                </div>
                <div className="flex items-center justify-between border-b border-white/10 pb-2 text-[10px] font-black uppercase tracking-widest opacity-50">
                  <span>Pipeline Quality</span>
                  <span>{Math.round((parsedData.metadata?.confidence || 0.5) * 100)}%</span>
                </div>
                <div className="flex gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10">
                    <ShieldCheck className="h-6 w-6 text-accent" />
                  </div>
                  <p className="text-xs font-medium italic leading-relaxed opacity-80">
                    {parsedData.metadata?.isWeak
                      ? "Extraction was partial. Please verify the details before continuing to the editor."
                      : "High-fidelity extraction. Ready for deployment."}
                  </p>
                </div>
              </div>

              <Button
                variant="outline"
                className="h-14 w-full rounded-2xl border-none bg-white text-lg font-black text-primary shadow-2xl transition-all hover:scale-[1.02] hover:bg-white/90 active:scale-[0.98] sm:h-16 sm:text-xl"
                onClick={handleConfirm}
                disabled={isSaving || isBlockedFallback}
              >
                {isSaving ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : "Confirm Draft"}
                {!isSaving && <ArrowRight className="ml-2 h-6 w-6" />}
              </Button>

              {requiresManualReview ? (
                <p className="text-center text-xs font-bold uppercase tracking-widest text-red-100/80">
                  This draft needs review, but you can still continue and finish it in the editor.
                </p>
              ) : null}

              <Button variant="outline" asChild className="h-12 w-full rounded-2xl border-white/20 bg-transparent font-black text-white hover:bg-white/10 hover:text-white">
                <Link href="/onboarding/upload">Go Back to Upload</Link>
              </Button>

              <div className="flex justify-center gap-6">
                <Badge variant="outline" className="border-white/20 px-3 text-[9px] uppercase text-white/40">Secure</Badge>
                <Badge variant="outline" className="border-white/20 px-3 text-[9px] uppercase text-white/40">Encrypted</Badge>
              </div>
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
  onChange: (value: string) => void
}) {
  const isMissing = !value || value.trim().length === 0

  return (
    <div className="group space-y-2">
      <div className="flex items-center gap-2">
        <p className={`text-[10px] font-black uppercase tracking-widest ${isMissing ? "text-red-500" : "text-slate-400"}`}>
          {label}
        </p>
        {isMissing && <AlertTriangle className="h-3 w-3 animate-pulse text-red-500" />}
      </div>
      <Input
        className={`h-12 rounded-xl border-2 px-4 text-sm font-bold transition-all focus-visible:ring-accent ${
          isMissing ? "border-red-100 bg-red-50/50" : "border-transparent bg-muted/30 group-hover:border-slate-100"
        }`}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={`Enter ${label.toLowerCase()}...`}
      />
    </div>
  )
}
