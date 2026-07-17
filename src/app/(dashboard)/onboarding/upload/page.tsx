"use client"

import Image from "next/image"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@/firebase"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { 
  Upload, 
  FileText, 
  Sparkles, 
  CheckCircle2, 
  Loader2, 
  AlertCircle,
  ShieldCheck,
  Zap,
  CloudLightning
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { extractCvAction } from "@/app/actions/cv-actions"
import { toast } from "@/hooks/use-toast"
import { extractClientDocumentText } from "@/lib/client-document-text"
import { buildRecoveredExtractionFromText, getExtractionQuality, hasMeaningfulExtraction, hasRecoverableDraft } from "@/lib/resume-text-recovery"
import { cn } from "@/lib/utils"
import Link from "next/link"

/**
 * Fire-and-forget quality signal. /api/quality/report now requires auth,
 * so we attach the caller's Firebase ID token. Silently skipped if the
 * user isn't signed in (this page is dashboard-gated so that shouldn't
 * happen in practice).
 */
async function reportQualitySignal(
  user: { getIdToken: (forceRefresh?: boolean) => Promise<string> } | null | undefined,
  payload: Record<string, unknown>
) {
  if (!user) return;
  try {
    const idToken = await user.getIdToken();
    fetch("/api/quality/report", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify(payload),
    }).catch((err) => console.debug("Silent quality report fail", err));
  } catch {
    // Complete silence
  }
}

async function fileToDataUri(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result)
      } else {
        reject(new Error("The selected file could not be prepared for extraction."))
      }
    }
    reader.onerror = () => reject(reader.error || new Error("The selected file could not be read."))
    reader.readAsDataURL(file)
  })
}

export default function UploadCvPage() {
  const router = useRouter()
  const { user } = useUser()
  
  const [file, setFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [status, setStatus] = useState<'idle' | 'uploading' | 'parsing' | 'complete' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)
  const [parsingProgress, setParsingProgress] = useState(0)
  const [loadingStep, setLoadingStep] = useState(0)

  // Cycle loading messages during parsing
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (status === 'parsing') {
      interval = setInterval(() => {
        setLoadingStep(prev => (prev + 1) % 4)
      }, 3000)
    } else {
      setLoadingStep(0)
    }
    return () => clearInterval(interval)
  }, [status])

  // Simulate parsing progress
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (status === 'parsing') {
      setParsingProgress(0)
      interval = setInterval(() => {
        setParsingProgress(prev => {
          if (prev >= 92) return prev
          // Slow down as it gets higher
          const increment = Math.max(0.5, (95 - prev) / 15)
          return prev + increment
        })
      }, 150)
    }
    return () => clearInterval(interval)
  }, [status])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (selected) {
      if (selected.size > 10 * 1024 * 1024) {
        void reportQualitySignal(user, {
          category: "upload",
          eventType: "cv_upload_rejected_size",
          status: "warning",
          summary: "A CV upload was rejected because it exceeded the 10MB size limit.",
          userId: user?.uid,
          metadata: {
            fileSizeBytes: selected.size,
            mimeType: selected.type || "unknown",
          },
        })
        toast({ variant: "destructive", title: "File too large", description: "Maximum size is 10MB." })
        return
      }

      const isSupportedFile =
        selected.type === "application/pdf" ||
        selected.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
        selected.type === "application/msword" ||
        selected.type === "text/plain" ||
        selected.type.startsWith("image/") ||
        /\.(pdf|docx|doc|txt|png|jpg|jpeg|tiff|bmp)$/i.test(selected.name)

      if (!isSupportedFile) {
        void reportQualitySignal(user, {
          category: "upload",
          eventType: "cv_upload_rejected_type",
          status: "warning",
          summary: "A CV upload was rejected because its file type is not supported.",
          userId: user?.uid,
          metadata: {
            fileSizeBytes: selected.size,
            mimeType: selected.type || "unknown",
          },
        })
        toast({ variant: "destructive", title: "Unsupported file", description: "Use PDF, DOCX, DOC, TXT, or Image (PNG/JPG)." })
        return
      }

      setFile(selected)
      setError(null)

      void reportQualitySignal(user, {
        category: "upload",
        eventType: "cv_upload_selected",
        status: "healthy",
        summary: "A CV file was selected and passed client-side validation.",
        userId: user?.uid,
        metadata: {
          fileSizeBytes: selected.size,
          mimeType: selected.type || "unknown",
        },
      })
    }
  }

  const handleUpload = async () => {
    if (!file || !user) return

    let extractionStarted = false

    try {
      sessionStorage.removeItem("parsedCvData")
      setStatus('uploading')
      setUploadProgress(12)
      setError(null)
      const preflightTextPromise = extractClientDocumentText(file)
      const fileDataUriPromise = fileToDataUri(file)

      void reportQualitySignal(user, {
        category: "upload",
        eventType: "cv_upload_started",
        status: "healthy",
        summary: "A validated CV upload started preparing for server-side extraction.",
        userId: user.uid,
        metadata: {
          fileSizeBytes: file.size,
          mimeType: file.type || "application/pdf",
        },
      })

      const fileDataUri = await fileDataUriPromise
      setUploadProgress(100)

      void reportQualitySignal(user, {
        category: "upload",
        eventType: "cv_upload_prepared",
        status: "healthy",
        summary: "The CV file was prepared locally and handed off to the server extraction pipeline.",
        userId: user.uid,
        metadata: {
          fileSizeBytes: file.size,
          mimeType: file.type || "application/pdf",
        },
      })

      // 1. Multimodal AI Extraction
      setStatus("parsing")
      extractionStarted = true
      console.log("[Client] Initializing CV extraction pipeline...")
      const preflightText = await preflightTextPromise

      let parsedData = await extractCvAction({
        cvDataUri: fileDataUri,
        cvMimeType: file.type || 'application/pdf',
        cvRawText: preflightText,
        userId: user.uid,
      })

      if (preflightText.trim().length >= 80) {
        const recoveredFromClientText = buildRecoveredExtractionFromText(preflightText, {
          jobId: parsedData?.metadata?.jobId,
          strategyUsed: "client-preflight-recovery",
          warning: "Recovered your draft directly from the uploaded file text because the server extraction result was unusable.",
        })

        const parsedQuality = getExtractionQuality(parsedData)
        const recoveredQuality = getExtractionQuality(recoveredFromClientText)
        const shouldPromoteRecovered =
          recoveredQuality.experienceCount > parsedQuality.experienceCount ||
          recoveredQuality.educationCount > parsedQuality.educationCount ||
          recoveredQuality.summaryLength > parsedQuality.summaryLength ||
          recoveredQuality.score > parsedQuality.score + 1

        if (!hasMeaningfulExtraction(parsedData) || shouldPromoteRecovered) {
          parsedData = recoveredFromClientText
        }
      }

      if (!parsedData) throw new Error("Could not extract data from the document.")
      if (!hasRecoverableDraft(parsedData)) {
        throw new Error("We couldn't extract usable information from this CV yet. Please try a different file.")
      }

      // 3. Store in session and redirect
      sessionStorage.setItem('parsedCvData', JSON.stringify(parsedData))
      setStatus('complete')
      const guardianStatus = parsedData.metadata?.guardian?.status
      toast({
        title: guardianStatus === "recovered" ? "Analysis Recovered" : "Analysis Success",
        description:
          guardianStatus === "recovered"
            ? "The extraction guardian recovered a draft. Review it carefully and fill in anything missing."
            : hasMeaningfulExtraction(parsedData)
            ? "CV successfully analyzed and ready for review."
            : "A partial draft was created from your CV. Review it carefully before continuing.",
      })
      
      router.push('/onboarding/review')
    } catch (err: any) {
      console.error("Extraction failed:", err)
      setStatus('error')
      setError(err.message || "Failed to analyze document.")
      if (!extractionStarted) {
        void reportQualitySignal(user, {
          category: "upload",
          eventType: "cv_upload_or_preparation_failed",
          status: "critical",
          summary: "The file could not be prepared for extraction before the server pipeline began.",
          detail: err?.message || "Unknown file preparation failure",
          userId: user?.uid,
          metadata: {
            fileSizeBytes: file?.size,
            mimeType: file?.type || "application/pdf",
          },
        })
      }
      toast({ variant: "destructive", title: "Parsing Error", description: "Check the file format or try another document." })
    }
  }

  return (
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden lg:px-8">
      {/* Dynamic Background Accents */}
      
      <div className="relative mx-auto max-w-4xl py-12">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mx-auto -mb-24 flex h-64 w-64 items-center justify-center shrink-0 relative">
            <Image
              src="/logo-mascot.png"
              alt="AI Mascot"
              width={256}
              height={256}
              className="relative h-64 w-64 object-contain transition-transform duration-700 mix-blend-multiply"
            />
          </div>
          <h1 className="text-3xl font-black tracking-tight bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text text-transparent sm:text-4xl">
            Upload Your Experience
          </h1>
          <p className="mx-auto max-w-xl text-base font-medium text-slate-500/80 sm:text-lg">
            Powered by our <span className="text-brand-gradient font-black">AI extraction pipeline</span> for lightning-fast, high-fidelity recovery.
          </p>
        </div>

        <div className="animate-tilt">
          <Card className="surface-card group relative overflow-hidden p-1 sm:p-1.5">
            <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent pointer-events-none" />
            
            <div className="relative space-y-6 rounded-[1.2rem] p-4 sm:p-10">
              
              {status === 'idle' && (
                <div 
                  className="group/drop relative cursor-pointer space-y-6 rounded-[1.5rem] border-2 border-dashed border-slate-200/60 bg-slate-50/30 p-6 text-center transition-all duration-500 hover:border-accent hover:bg-accent/[0.03] hover:shadow-[0_0_80px_-20px_rgba(255,152,0,0.15)] sm:p-12"
                  onClick={() => document.getElementById('cv-upload')?.click()}
                >
                  <input 
                    id="cv-upload" 
                    type="file" 
                    className="hidden" 
                    accept=".pdf,.docx,.txt,image/*" 
                    onChange={handleFileChange}
                  />
                  
                  {/* Cyber-Ring Container */}
                  <div className="relative mx-auto flex h-20 w-20 items-center justify-center sm:h-24 sm:w-24">
                    <div className="absolute inset-0 animate-spin-slow rounded-[1.5rem] border-2 border-accent/20" />
                    <div className="absolute inset-1.5 rounded-[1.2rem] border border-primary/10 shadow-[inner_0_0_20px_rgba(124,58,237,0.05)]" />
                    <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-2xl transition-all duration-700 group-hover/drop:scale-110 group-hover/drop:rotate-6 sm:h-16 sm:w-16">
                      <Upload className="h-6 w-6 text-accent sm:h-8 w-8" />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-xl font-black text-primary sm:text-2xl">
                      {file ? file.name : "Drop your CV here"}
                    </h3>
                    <p className="mx-auto max-w-xs text-sm font-semibold text-slate-400 sm:text-base">
                      Supporting PDF, DOCX, or Photos up to 10MB
                    </p>
                  </div>

                  {file && (
                    <div className="flex flex-col items-center gap-4 pt-4 animate-in fade-in slide-in-from-bottom-4">
                      <Button 
                        size="lg" 
                        className="btn-premium h-14 w-full px-12 text-lg sm:w-auto"
                        onClick={(e) => { e.stopPropagation(); handleUpload(); }}
                      >
                        Analyze with AI <Sparkles className="ml-2 h-5 w-5" />
                      </Button>
                      <button 
                        className="text-xs font-black uppercase tracking-widest text-slate-400 hover:text-primary transition-colors"
                        onClick={(e) => { e.stopPropagation(); router.push('/cv-editor'); }}
                      >
                        Start from scratch instead
                      </button>
                    </div>
                  )}
                </div>
              )}

              {(status === 'uploading' || status === 'parsing') && (
                  <div className="relative overflow-hidden rounded-[1.5rem] bg-white px-4 py-12 shadow-2xl sm:px-10 sm:py-20 text-center">
                    <div className="absolute inset-x-0 top-0 h-1 bg-slate-100">
                       <motion.div 
                          className="h-full bg-gradient-to-r from-blue-600 via-indigo-500 to-orange-500"
                          initial={{ width: "0%" }}
                          animate={{ width: `${status === 'uploading' ? uploadProgress : parsingProgress}%` }}
                          transition={{ duration: 0.5 }}
                       />
                    </div>

                    <div className="relative mx-auto flex max-w-xl flex-col items-center justify-center space-y-10">
                      <div className="relative flex items-center justify-center">
                         <motion.div 
                           animate={{ rotate: 360 }}
                           transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                           className="h-32 w-32 rounded-full border-[3px] border-slate-100 border-t-indigo-500 border-r-indigo-500/30" 
                         />
                         <motion.div 
                           animate={{ rotate: -360 }}
                           transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                           className="absolute h-24 w-24 rounded-full border-[3px] border-slate-50 border-t-orange-500/40 border-l-orange-500" 
                         />
                         <div className="absolute flex items-center justify-center">
                            {status === 'uploading' ? (
                               <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white shadow-xl ring-1 ring-slate-100">
                                  <Upload className="h-10 w-10 text-blue-600 animate-bounce" />
                               </div>
                            ) : (
                               <motion.div 
                                 className="absolute flex h-24 w-24 items-center justify-center rounded-full bg-white shadow-2xl ring-1 ring-slate-100"
                                 initial={{ scale: 0.8 }}
                                 animate={{ 
                                   scale: [1, 1.15, 1],
                                 }}
                                 transition={{ 
                                   duration: 3,
                                   repeat: Infinity,
                                   ease: "easeInOut"
                                 }}
                               >
                                 <div className="relative h-56 w-56">
                                   <Image
                                     src="/logo-mascot.png"
                                     alt="AI Strategist"
                                     fill
                                     className="object-contain" 
                                     priority
                                   />
                                 </div>
                               </motion.div>
                            )}
                         </div>
                         
                         {/* Orbital Particles */}
                         {[0, 1, 2].map((i) => (
                           <motion.div
                             key={i}
                             animate={{ 
                               rotate: 360,
                               scale: [1, 1.2, 1]
                             }}
                             transition={{ 
                               duration: 3 + i, 
                               repeat: Infinity, 
                               ease: "linear" 
                             }}
                             className="absolute h-full w-full"
                           >
                              <div className={cn(
                                "h-2 w-2 rounded-full mt-[-4px] ml-[50%] -translate-x-1/2 shadow-lg",
                                i === 0 ? "bg-blue-500" : i === 1 ? "bg-orange-500" : "bg-indigo-500"
                              )} />
                           </motion.div>
                         ))}
                      </div>

                      <div className="space-y-4">
                        <AnimatePresence mode="wait">
                          <motion.div
                            key={status === 'uploading' ? 'uploading' : `step-${loadingStep}`}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-3"
                          >
                             <Badge variant="outline" className="rounded-full border-slate-200 bg-slate-50 px-4 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                               {status === 'uploading' ? 'Phase 1: Secure Preparation' : 'Phase 2: Neural Extraction'}
                             </Badge>
                             <h2 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
                               {status === 'uploading' 
                                 ? `Calibrating Payload... ${Math.round(uploadProgress)}%` 
                                 : ["Gemini AI Deep Scan", "Neural OCR Active", "Mapping Career Genes", "Synthesizing Professional DNA"][loadingStep]
                               }
                             </h2>
                             <p className="mx-auto max-w-sm text-[13px] font-semibold leading-relaxed text-slate-500">
                               {status === 'uploading'
                                 ? 'Preparing your experience files for high-fidelity extraction.'
                                 : [
                                     'Retrieving your contact details and core profile data.',
                                     'Scanning historical documents for hidden achievements.',
                                     'Structuring skills into industry-standard benchmarks.',
                                     'Finalizing your digital career signature for review.'
                                   ][loadingStep]
                               }
                             </p>
                          </motion.div>
                        </AnimatePresence>
                      </div>

                      <div className="w-full max-w-xs space-y-4 pt-4">
                         <div className="flex justify-between text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">
                           <span className={cn(status === 'uploading' ? "text-blue-600" : "text-emerald-500")}>
                              {status === 'uploading' ? "In Flight" : "Verified"}
                           </span>
                           <span className="text-slate-900">{Math.round(status === 'uploading' ? uploadProgress : parsingProgress)}%</span>
                         </div>
                         <div className="relative h-1.5 overflow-hidden rounded-full bg-slate-100">
                            <motion.div 
                               className="absolute inset-y-0 left-0 bg-slate-900"
                               initial={{ width: "0%" }}
                               animate={{ width: `${status === 'uploading' ? uploadProgress : parsingProgress}%` }}
                            />
                         </div>
                      </div>
                    </div>
                  </div>
              )}

              {status === 'error' && (
                <div className="space-y-8 py-12 text-center">
                  <div className="bg-red-50 h-24 w-24 rounded-full flex items-center justify-center mx-auto shadow-inner border border-red-100">
                    <AlertCircle className="h-12 w-12 text-red-500" />
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-2xl font-black text-red-900 sm:text-3xl italic">Analysis Halted</h3>
                    <p className="text-base font-semibold text-red-600/70 sm:text-lg">{error || "Something went wrong during extraction."}</p>
                  </div>
                  <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                    <Button variant="outline" className="border-2 rounded-2xl h-14 px-8 font-black" onClick={() => setStatus('idle')}>
                      Try Another File
                    </Button>
                    <button 
                      className="text-sm font-black uppercase tracking-widest text-slate-400 hover:text-primary"
                      onClick={() => router.push('/onboarding')}
                    >
                      Back to Setup
                    </button>
                  </div>
                </div>
              )}

            </div>
          </Card>
        </div>
      </div>
      
      <div className="mt-12 text-center text-[10px] font-black uppercase tracking-[0.4em] text-slate-300">
        Enterprise Grade Neural Parsing Engine
      </div>
    </div>
  )
}
