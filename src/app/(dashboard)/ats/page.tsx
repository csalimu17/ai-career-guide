"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { addDoc, collection, doc, increment, limit, orderBy, query, serverTimestamp, updateDoc } from "firebase/firestore"
import { 
  History, 
  Loader2, 
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

import { useCollection, useDoc, useFirestore, useMemoFirebase, useUser } from "@/firebase"
import type { AtsOptimizationScoringOutput } from "@/ai/flows/ats-optimization-scoring-flow"
import { Button } from "@/components/ui/button"
import { toast } from "@/hooks/use-toast"
import { fetchAuthedJson } from "@/lib/client/fetch-json"
import { getPlanLimits } from "@/lib/plans"
import { buildResumePlainText } from "@/lib/resume-to-text"
import { cn } from "@/lib/utils"

// Modular Components
import { PremiumIcon } from "@/components/ats/premium-icon"
import { ScannerAnimation } from "@/components/ats/scanner-animation"
import { ATSHeader } from "@/components/ats/ats-header"
import { WorkspaceArea } from "@/components/ats/workspace-area"
import { ReportVerdict } from "@/components/ats/report-verdict"
import { ReportDetails } from "@/components/ats/report-details"

type AtsReportDoc = AtsOptimizationScoringOutput & {
  id: string
  score?: number
  source?: "ats-page" | "editor"
  resumeId?: string | null
  resumeName?: string | null
  cvContent?: string
  jobDescription?: string
  createdAt?: { toDate?: () => Date } | Date | null
}

const formatDate = (value: AtsReportDoc["createdAt"]) => {
  const date = value instanceof Date ? value : value?.toDate?.()
  return date ? date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "Just now"
}

export default function AtsOptimizerPage() {
  const { user, uid, isUserLoading } = useUser()
  const db = useFirestore()
  const [cvContent, setCvContent] = useState("")
  const [jobDescription, setJobDescription] = useState("")
  const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null)
  const [activeReport, setActiveReport] = useState<AtsReportDoc | null>(null)
  const [isRunning, setIsRunning] = useState(false)

  const userDocRef = useMemoFirebase(() => (!db || !uid ? null : doc(db, "users", uid)), [db, uid])
  const { data: profile, isLoading: isProfileLoading } = useDoc(userDocRef)

  const resumesQuery = useMemoFirebase(
    () => (!db || !uid ? null : query(collection(db, "users", uid, "resumes"), orderBy("updatedAt", "desc"), limit(20))),
    [db, uid]
  )
  const { data: resumes, isLoading: isResumesLoading } = useCollection(resumesQuery)

  const reportsQuery = useMemoFirebase(
    () => (!db || !uid ? null : query(collection(db, "users", uid, "atsReports"), orderBy("createdAt", "desc"), limit(12))),
    [db, uid]
  )
  const { data: reports, isLoading: isReportsLoading } = useCollection<AtsReportDoc>(reportsQuery)

  const latestResume = resumes?.[0] || null
  const selectedResume = useMemo(() => resumes?.find((resume) => resume.id === selectedResumeId) || null, [resumes, selectedResumeId])

  useEffect(() => {
    if (!selectedResumeId && latestResume?.id) setSelectedResumeId(latestResume.id)
  }, [latestResume?.id, selectedResumeId])

  useEffect(() => {
    if (!activeReport && reports?.length) setActiveReport(reports[0])
  }, [activeReport, reports])

  const plan = (profile?.plan as "free" | "pro" | "master") || "free"
  const limits = getPlanLimits(plan)
  const usedChecks = profile?.usage?.atsChecks || 0
  const remainingChecks = Math.max(limits.atsChecks - usedChecks, 0)
  const visibleReport = activeReport || reports?.[0] || null

  const builderHref = visibleReport?.resumeId
    ? `/cv-editor?id=${visibleReport.resumeId}&returnTo=${encodeURIComponent("/ats")}`
    : selectedResume?.id
      ? `/cv-editor?id=${selectedResume.id}&returnTo=${encodeURIComponent("/ats")}`
      : latestResume?.id
        ? `/cv-editor?id=${latestResume.id}&returnTo=${encodeURIComponent("/ats")}`
        : `/cv-editor?new=true&returnTo=${encodeURIComponent("/ats")}`

  const loadResumeIntoWorkspace = (resume: any) => {
    setSelectedResumeId(resume.id)
    setCvContent(resume.plainText || buildResumePlainText(resume))
    toast({ title: "Resume loaded", description: `${resume.name} is now active.` })
  }

  const handleClear = () => {
    setJobDescription("")
    setCvContent("")
    setSelectedResumeId(null)
    setActiveReport(null)
    toast({ title: "Workspace cleared" })
  }

  const runScan = async () => {
    if (!user || !db) return
    if (!cvContent.trim()) return toast({ variant: "destructive", title: "Missing content", description: "Please provide your CV content." })
    if (!jobDescription.trim()) return toast({ variant: "destructive", title: "Missing Job Description", description: "Please paste the target role description." })
    
    if (usedChecks >= limits.atsChecks) {
      return toast({
        variant: "destructive",
        title: "Limit reached",
        description: "Upgrade your plan for more ATS scans.",
        action: <Button variant="outline" size="sm" asChild className="font-bold"><Link href="/settings">Upgrade</Link></Button>
      })
    }

    setIsRunning(true)
    try {
      const { result } = await fetchAuthedJson<{ result: AtsOptimizationScoringOutput }>(user, "/api/ats/scan", {
        method: "POST",
        body: JSON.stringify({ cvContent, jobDescription }),
      })
      
      const payload = {
        ...result,
        score: result.atsScore,
        source: "ats-page" as const,
        resumeId: selectedResume?.id || null,
        resumeName: selectedResume?.name || "Manual Scan",
        cvContent,
        jobDescription,
        createdAt: serverTimestamp(),
      }
      
      const reportRef = await addDoc(collection(db, "users", user.uid, "atsReports"), payload)
      setActiveReport({ 
        id: reportRef.id, 
        ...result, 
        score: result.atsScore, 
        resumeId: selectedResume?.id || null, 
        cvContent, 
        jobDescription, 
        createdAt: new Date() 
      })

      if (userDocRef) {
        await updateDoc(userDocRef, { "usage.atsChecks": increment(1), updatedAt: serverTimestamp() })
      }

      toast({ title: "Scan complete", description: `Match score: ${result.atsScore}%` })
    } catch (error) {
      console.error(error)
      toast({ variant: "destructive", title: "Analysis failed", description: "We couldn't reach the AI engine. Try again later." })
    } finally {
      setIsRunning(false)
    }
  }

  if (isUserLoading || isProfileLoading || isResumesLoading || isReportsLoading) {
    return <div className="flex h-[80vh] items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary/30" /></div>
  }

  return (
    <div className="mx-auto w-full max-w-[1440px] px-4 pb-20 pt-8 md:px-6 xl:px-8">
      <ATSHeader 
        plan={plan} 
        remainingChecks={remainingChecks} 
        builderHref={builderHref} 
      />

      <div className="space-y-12">
        <WorkspaceArea 
          resumes={resumes ?? undefined}
          selectedResumeId={selectedResumeId}
          loadResumeIntoWorkspace={loadResumeIntoWorkspace}
          cvContent={cvContent}
          setCvContent={setCvContent}
          jobDescription={jobDescription}
          setJobDescription={setJobDescription}
          runScan={runScan}
          isRunning={isRunning}
          handleClear={handleClear}
          formatDate={formatDate}
        />

        <AnimatePresence mode="wait">
          {isRunning ? (
            <motion.div 
               key="loading"
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0, scale: 1.05 }}
               className="py-12"
            >
               <ScannerAnimation />
            </motion.div>
          ) : visibleReport ? (
            <motion.div 
               key="report"
               initial={{ opacity: 0, y: 40 }}
               animate={{ opacity: 1, y: 0 }}
               className="space-y-10"
            >
               <ReportVerdict 
                 visibleReport={visibleReport} 
                 builderHref={builderHref} 
                 formatDate={formatDate} 
               />

               <ReportDetails visibleReport={visibleReport} />
            </motion.div>
          ) : (
            <motion.div 
               key="empty"
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               className="flex flex-col items-center justify-center py-20 text-center"
            >
               <div className="relative mb-8">
                  <div className="absolute inset-0 bg-blue-500/10 blur-3xl rounded-full translate-y-4" />
                  <div className="relative h-24 w-24 rounded-[2rem] bg-white border border-slate-100 shadow-xl flex items-center justify-center">
                     <PremiumIcon icon={History} color="slate" />
                  </div>
               </div>
               <h3 className="text-2xl font-black text-slate-900 tracking-tight">Ready for analysis</h3>
               <p className="max-w-xs text-base font-medium text-slate-400 mt-2 leading-relaxed italic">
                  Paste your CV and a JD above to see your ATS match score and keyword analysis.
               </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* --- RECENT REPORTS DRAWER --- */}
        {!isRunning && reports && reports.length > 0 && (
          <section className="space-y-8 border-t border-slate-100 pt-12">
             <div className="flex flex-col gap-4 px-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <h3 className="flex items-center gap-3 text-lg font-black text-slate-900 sm:text-xl">
                     <PremiumIcon icon={History} color="slate" />
                     Recent Scans
                  </h3>
                  <p className="text-[0.68rem] font-bold uppercase tracking-widest text-slate-400">Track your optimization progress</p>
                </div>
                <Button
                  variant="outline"
                  className="h-11 rounded-xl border-slate-200 font-bold sm:w-auto"
                  onClick={() => {
                    setActiveReport(reports[0] ?? null)
                    window.scrollTo({ top: 0, behavior: "smooth" })
                  }}
                >
                  Open Latest Scan
                </Button>
             </div>
             
             <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
                {reports.map(rep => (
                   <button 
                     key={rep.id} 
                     onClick={() => {
                        setActiveReport(rep);
                        setCvContent(rep.cvContent || "");
                        setJobDescription(rep.jobDescription || "");
                        window.scrollTo({ top: 800, behavior: 'smooth' });
                     }}
                     className={cn(
                       "group magic-card p-5 text-left transition-all hover:-translate-y-1 min-[420px]:p-5",
                       activeReport?.id === rep.id ? "ring-2 ring-brand-purple bg-brand-purple/5 shadow-md" : ""
                     )}
                   >
                     <div className="flex items-center justify-between mb-3">
                        <div className={cn("text-xs font-black", (rep.atsScore || 0) >= 80 ? "text-emerald-600" : "text-amber-600")}>
                           {rep.atsScore}%
                         </div>
                        <History className="w-3 h-3 text-slate-300" />
                     </div>
                     <p className="text-[0.68rem] font-black uppercase mt-2 tracking-tight text-slate-900 truncate">{rep.resumeName || "Manual Scan"}</p>
                     <p className="text-[0.65rem] font-bold text-slate-400 mt-1">{formatDate(rep.createdAt)}</p>
                   </button>
                ))}
             </div>
          </section>
        )}
      </div>
    </div>
  )
}
