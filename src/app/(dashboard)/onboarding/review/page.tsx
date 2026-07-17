"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { addDoc, collection, doc, serverTimestamp, updateDoc } from "firebase/firestore"
import { useCollection, useDoc, useFirestore, useMemoFirebase, useUser } from "@/firebase"
import { getPlanLimits } from "@/lib/plans"
import { CvDataExtractionOutput } from "@/types/cv"
import { toast } from "@/hooks/use-toast"
import { hasMeaningfulExtraction, hasRecoverableDraft } from "@/lib/resume-text-recovery"
import { plainTextToRichTextHtml } from "@/lib/rich-text"
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
            // Infer professional title from first experience entry when available
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
            school: edu.institution || "",       // editor uses "school", parser uses "institution"
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
      router.push("/dashboard")
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
    <div className="mobile-app-page md:mx-auto md:max-w-6xl md:space-y-10 md:px-4 md:py-12 animate-in space-y-8 duration-1000 fade-in slide-in-from-bottom-8">
      {/* Header Section */}
      <div className="relative space-y-4 text-center">
        <div className="flex justify-center -mb-20">
          <Image
            src="/logo-mascot.png"
            alt="AI Mascot"
            width={256}
            height={256}
            className="relative h-64 w-64 object-contain transition-transform duration-700 mix-blend-multiply"
          />
        </div>

        <div className="space-y-2">
          {/* Badges removed per user request */}
          
          <h1 className="text-3xl font-black tracking-tight bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text text-transparent sm:text-4xl md:text-5xl">
            Review Your Story
          </h1>
          <p className="mx-auto max-w-2xl text-sm font-semibold text-slate-500/80 sm:text-lg">
            {isHealthy
              ? "Extraction complete. Our high-fidelity neural engine has mapped your career architecture. Please verify the structural details below."
              : "The document analysis was complex. We've flagged areas that require manual architectural verification."}
          </p>
        </div>

        <div className="flex justify-center pt-2">
          <Button variant="ghost" asChild className="group h-10 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-400 hover:bg-primary/5 hover:text-primary transition-all">
            <Link href="/onboarding/upload">
              <ArrowRight className="mr-2 h-4 w-4 rotate-180 group-hover:-translate-x-1 transition-transform" /> 
              Retry Extraction
            </Link>
          </Button>
        </div>
      </div>

      {/* Intelligence Briefings */}
      <div className="grid gap-4 md:gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-500">
        {!isHealthy && (
          <div className="relative overflow-hidden rounded-[1.8rem] border border-red-200 bg-red-50/30 p-5 shadow-[0_8px_30px_rgb(239,68,68,0.05)] backdrop-blur-md sm:p-7">
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-red-100/20 blur-3xl" />
            <div className="relative flex items-start gap-5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-100 text-red-600 shadow-inner">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div className="space-y-2">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-red-900/50">Intelligence Alert: Low Confidence</p>
                <p className="text-base font-bold text-red-900">
                  Detected structural ambiguity in the source file.
                </p>
                <p className="text-sm font-medium text-red-700/80 leading-relaxed">
                  The document layout was likely non-standard or scanned. {parsedData.metadata?.missingFields?.length || 0} fields may require your immediate attention to maintain pipeline integrity.
                </p>
                <div className="pt-2">
                  <Badge variant="outline" className="border-red-200 bg-white/50 text-[10px] font-black text-red-700">
                    URGENT REVIEW REQUIRED
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        )}

        {guardian?.activated ? (
          <div className="relative overflow-hidden rounded-[1.8rem] border border-blue-200/60 bg-gradient-to-br from-blue-50/80 via-white/40 to-orange-50/80 p-5 shadow-[0_8px_30px_rgba(59,130,246,0.08)] backdrop-blur-md sm:p-7">
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-blue-100/20 blur-3xl" />
            <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-orange-100/20 blur-3xl" />
            <div className="relative flex items-start gap-5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-orange-500 text-white shadow-lg ring-4 ring-white">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-900/40">Extraction Guardian Active</p>
                <p className="text-base font-black text-blue-950">
                  {guardian.status === 'recovered' ? 'Neural pathways successfully recovered.' : 'Structural integrity verified.'}
                </p>
                <p className="text-sm font-bold text-blue-800/70 leading-relaxed max-w-2xl">
                  {guardian.summary}
                </p>
                {guardian.appliedFixes?.length ? (
                  <div className="flex flex-wrap gap-2 pt-3">
                    {guardian.appliedFixes.slice(0, 3).map((fix) => (
                      <Badge key={fix} variant="outline" className="flex items-center gap-1.5 border-emerald-500/20 bg-emerald-50/80 px-2.5 py-1 text-[9px] font-black uppercase tracking-tight text-emerald-700 shadow-[0_2px_10px_rgba(16,185,129,0.1)]">
                        <div className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="truncate max-w-[180px]">RESOLVED: {fix}</span>
                      </Badge>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <div className="grid gap-5 lg:grid-cols-3 lg:gap-10">
        <div className="space-y-6 lg:col-span-2 lg:space-y-10">
          <section className="space-y-4 animate-in fade-in slide-in-from-left-8 duration-700" style={{ animationDelay: "600ms" }}>
            <div className="flex items-center gap-3 px-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-[inner_0_0_15px_rgba(124,58,237,0.1)]">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div className="space-y-0.5">
                <h2 className="text-sm font-black uppercase tracking-[0.2em] text-primary/50">Core Identity</h2>
                <p className="text-xl font-black text-primary">Contact Details</p>
              </div>
            </div>
            <Card className="glass-card overflow-hidden rounded-[2rem] border border-white/40 bg-white/60 shadow-xl backdrop-blur-md">
              <CardContent className="p-6 sm:p-10">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-10">
                  <EditableItem label="Full Name" value={parsedData.personalDetails?.name} onChange={(value) => handleUpdate("personalDetails.name", value)} />
                  <EditableItem label="Email Address" value={parsedData.personalDetails?.email} onChange={(value) => handleUpdate("personalDetails.email", value)} />
                  <EditableItem label="Phone Number" value={parsedData.personalDetails?.phone} onChange={(value) => handleUpdate("personalDetails.phone", value)} />
                  <EditableItem label="Location (City, Country)" value={parsedData.personalDetails?.location} onChange={(value) => handleUpdate("personalDetails.location", value)} />
                </div>
              </CardContent>
            </Card>
          </section>

          <section className="space-y-4 animate-in fade-in slide-in-from-left-8 duration-700" style={{ animationDelay: "700ms" }}>
            <div className="flex items-center gap-3 px-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-[inner_0_0_15px_rgba(124,58,237,0.1)]">
                <FileText className="h-5 w-5" />
              </div>
              <div className="space-y-0.5">
                <h2 className="text-sm font-black uppercase tracking-[0.2em] text-primary/50">Executive Narrative</h2>
                <p className="text-xl font-black text-primary">Professional Statement</p>
              </div>
            </div>
            <Card className="glass-card overflow-hidden rounded-[2rem] border border-white/40 bg-white/60 shadow-xl backdrop-blur-md">
              <CardContent className="p-6 sm:p-10">
                <Textarea
                  className="min-h-[160px] resize-none rounded-2xl border-2 border-transparent bg-slate-50/50 p-6 text-sm font-semibold leading-relaxed text-slate-700 focus-visible:border-primary/20 focus-visible:bg-white focus-visible:ring-0 transition-all"
                  value={parsedData.summary || ""}
                  onChange={(e) => handleUpdate("summary", e.target.value)}
                  placeholder="The AI is waiting for your input to finalize the executive summary..."
                />
              </CardContent>
            </Card>
          </section>

          {parsedData.customSections && parsedData.customSections.length > 0 && (
            <section className="space-y-4 animate-in fade-in slide-in-from-left-8 duration-700" style={{ animationDelay: "750ms" }}>
              <div className="flex items-center gap-3 px-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-[inner_0_0_15px_rgba(124,58,237,0.1)]">
                  <Layout className="h-5 w-5" />
                </div>
                <div className="space-y-0.5">
                  <h2 className="text-sm font-black uppercase tracking-[0.2em] text-primary/50">Extended Context</h2>
                  <p className="text-xl font-black text-primary">Additional Details</p>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
                {parsedData.customSections.map((section, index) => (
                  <Card key={index} className="glass-card relative overflow-hidden rounded-[2rem] border border-white/40 bg-white/60 p-1 shadow-lg backdrop-blur-md transition-all hover:bg-white">
                    <CardHeader className="p-6 pb-2">
                      <CardTitle className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/30">{section.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 pt-0">
                      <p className="text-sm font-semibold leading-relaxed text-slate-600">{section.content}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}

          <section className="space-y-4 animate-in fade-in slide-in-from-left-8 duration-700" style={{ animationDelay: "800ms" }}>
            <div className="flex items-center gap-3 px-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-[inner_0_0_15px_rgba(124,58,237,0.1)]">
                <Briefcase className="h-5 w-5" />
              </div>
              <div className="space-y-0.5">
                <h2 className="text-sm font-black uppercase tracking-[0.2em] text-primary/50">Experience Matrix</h2>
                <p className="text-xl font-black text-primary">Key Positions</p>
              </div>
            </div>
            <div className="space-y-4 md:space-y-6">
              {parsedData.workExperience && parsedData.workExperience.length > 0 ? (
                parsedData.workExperience.map((exp, index) => (
                  <Card key={index} className="group relative overflow-hidden rounded-[2rem] border border-white/40 bg-white/60 shadow-xl backdrop-blur-md transition-all duration-500 hover:border-primary/20 hover:bg-white hover:shadow-2xl">
                    <div className="absolute right-0 top-0 h-24 w-24 bg-primary/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                    <CardContent className="p-6 sm:p-10">
                      <div className="flex flex-col gap-6 md:flex-row">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border-2 border-primary/5 bg-primary/5 text-xl font-black text-primary transition-all duration-500 group-hover:bg-primary group-hover:text-white md:h-16 md:w-16">
                          {exp.company?.[0] || "?"}
                        </div>
                        <div className="flex-1 space-y-4">
                          <div className="grid grid-cols-1 gap-2 md:grid-cols-2 md:items-start">
                            <div className="space-y-1">
                              <Input
                                className="h-auto border-none bg-transparent p-0 text-xl font-black text-primary placeholder:text-red-300 focus-visible:ring-0"
                                value={exp.title}
                                placeholder="Missing Title"
                                onChange={(e) => {
                                  const nextExperience = [...parsedData.workExperience!]
                                  nextExperience[index].title = e.target.value
                                  handleUpdate("workExperience", nextExperience)
                                }}
                              />
                              <Input
                                className="h-auto border-none bg-transparent p-0 text-sm font-bold text-slate-400 focus-visible:ring-0"
                                value={exp.company}
                                placeholder="Company Name"
                                onChange={(e) => {
                                  const nextExperience = [...parsedData.workExperience!]
                                  nextExperience[index].company = e.target.value
                                  handleUpdate("workExperience", nextExperience)
                                }}
                              />
                            </div>
                            <div className="text-[11px] font-black uppercase tracking-widest text-slate-400 md:text-right md:pt-2">
                              {exp.startDate} — {exp.endDate || "Present"}
                            </div>
                          </div>
                          
                          <div className="space-y-3 border-l-2 border-slate-100 pl-4 transition-colors group-hover:border-primary/20">
                            {exp.description?.map((point, pointIndex) => (
                              <div key={pointIndex} className="flex items-start gap-3 text-sm font-semibold leading-relaxed text-slate-600/90">
                                <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/30 group-hover:bg-accent group-hover:scale-125 transition-all" />
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
                <div className="space-y-4 rounded-[2.5rem] border-2 border-dashed border-slate-200 bg-slate-50/50 p-12 text-center transition-all hover:bg-white">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                    <Briefcase className="h-8 w-8" />
                  </div>
                  <p className="text-sm font-bold uppercase tracking-widest text-slate-400">No work history detected</p>
                </div>
              )}
            </div>
          </section>
        </div>
        <div className="space-y-8">
          <Card className="sticky top-24 overflow-hidden rounded-[3rem] border-none bg-slate-950 bg-none text-white shadow-[0_30px_90px_-20px_rgba(0,0,0,0.6)] animate-in fade-in slide-in-from-right-8 duration-1000" style={{ animationDelay: "900ms" }}>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent)]" />
            
            <CardHeader className="relative p-8 pb-4 md:p-10 md:pb-4">
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-2.5 rounded-full bg-white/10 px-3 py-1 backdrop-blur-md">
                  <div className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Neural Link Active</span>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-bold text-slate-200">
                  ID: {parsedData.metadata?.jobId?.slice(-8) || "DRAFT_01"}
                </div>
              </div>
              
              <CardTitle className="space-y-1">
                <span className="block text-4xl font-black italic tracking-tighter text-slate-300 leading-none">DEPLOY</span>
                <span className="relative inline-block text-6xl font-[1000] italic tracking-tighter text-accent leading-none">
                  DRAFT
                  <div className="absolute -bottom-2 left-0 h-1.5 w-full rounded-full bg-accent/20" />
                </span>
              </CardTitle>
              <CardDescription className="pt-4 text-sm font-bold text-white">Synchronizing extracted semantic markers to workspace.</CardDescription>
            </CardHeader>

            <CardContent className="relative space-y-8 p-8 pt-4 md:p-10 md:pt-4">
              <div className="space-y-6">
                <div className="group space-y-3">
                  <div className="flex items-center justify-between px-1">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-200">Workspace Identifier</label>
                    <div className="h-4 w-[2px] bg-accent/40 animate-pulse" />
                  </div>
                  <Input
                    value={resumeName}
                    onChange={(e) => setResumeName(e.target.value)}
                    placeholder="e.g. CORE_MODULE_01"
                    className="h-18 rounded-2xl border-2 border-white/30 bg-white/10 px-6 text-xl font-black text-white placeholder:text-white/30 focus-visible:border-accent focus-visible:bg-white/20 focus-visible:ring-0 transition-all shadow-[inset_0_2px_10px_rgba(0,0,0,0.3)]"
                  />
                </div>

                <div className="relative space-y-5 rounded-[2.5rem] bg-black/40 p-8 shadow-2xl backdrop-blur-xl border border-white/10">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <span className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">Pipeline Integrity</span>
                      <span className="block text-2xl font-black italic text-accent">
                        {Math.round((parsedData.metadata?.confidence || 0.5) * 100)}%
                      </span>
                    </div>
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-accent shadow-[inset_0_0_20px_rgba(245,158,11,0.2)]">
                      <ShieldCheck className="h-8 w-8" />
                    </div>
                  </div>
                  
                  <div className="relative h-3 w-full overflow-hidden rounded-full bg-white/5 px-0.5 py-0.5">
                    <div 
                      className="relative h-full rounded-full bg-gradient-to-r from-accent/50 to-accent shadow-[0_0_15px_rgba(245,158,11,0.4)] transition-all duration-1000" 
                      style={{ width: `${Math.round((parsedData.metadata?.confidence || 0.5) * 100)}%` }}
                    >
                      <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.4)_50%,transparent_100%)] animate-[shimmer_2s_infinite] w-20" />
                    </div>
                  </div>

                  <p className="text-[11px] font-bold italic leading-relaxed text-slate-200">
                    {parsedData.metadata?.isWeak
                      ? "Neural engine detected fragmentation. Manual verification required."
                      : "Semantic markers validated. Ready for architectural deployment."}
                  </p>
                </div>
              </div>

              <div className="space-y-4 pt-4">
                <Button
                  className="relative h-24 w-full overflow-hidden rounded-[2rem] brand-gradient-bg p-0 text-2xl font-black text-white shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                  onClick={handleConfirm}
                  disabled={isSaving || isBlockedFallback}
                >
                  <div className="flex h-full w-full items-center justify-center gap-4">
                    {isSaving ? (
                      <Loader2 className="h-10 w-10 animate-spin" />
                    ) : (
                      <>
                        <span className="tracking-tighter uppercase">Confirm & Sync</span>
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-primary shadow-xl">
                          <ArrowRight className="h-6 w-6" />
                        </div>
                      </>
                    )}
                  </div>
                  <div className="absolute inset-0 translate-x-[-100%] bg-gradient-to-r from-transparent via-white/30 to-transparent animate-[shimmer_4s_infinite]" />
                </Button>

                <Button variant="ghost" asChild className="h-14 w-full rounded-2xl font-black text-slate-300 hover:bg-white/10 hover:text-white transition-all uppercase tracking-[0.2em] text-[10px]">
                  <Link href="/onboarding/upload">Cancel Extraction</Link>
                </Button>
              </div>

              <div className="flex justify-center gap-8 border-t border-white/5 pt-8">
                <div className="flex items-center gap-2.5">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-200">Secured</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-200">Encrypted</span>
                </div>
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
    <div className="group space-y-2.5">
      <div className="flex items-center gap-2 px-1">
        <p className={`text-[10px] font-black uppercase tracking-[0.2em] transition-colors ${isMissing ? "text-red-500" : "text-slate-400 group-focus-within:text-primary"}`}>
          {label}
        </p>
        {isMissing && <div className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />}
      </div>
      <Input
        className={`h-12 rounded-[1rem] border-2 px-5 text-sm font-bold transition-all placeholder:text-slate-300 focus-visible:ring-0 ${
          isMissing 
            ? "border-red-100 bg-red-50/30 text-red-900 focus-visible:border-red-300 focus-visible:bg-red-50/50" 
            : "border-slate-100 bg-slate-50/50 text-slate-700 focus-visible:border-primary/20 focus-visible:bg-white focus-visible:shadow-[0_0_20px_rgba(124,58,237,0.05)]"
        }`}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={`Awaiting ${label.toLowerCase()}...`}
      />
    </div>
  )
}
