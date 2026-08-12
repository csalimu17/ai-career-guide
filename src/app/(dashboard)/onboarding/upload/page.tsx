"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@/firebase"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Upload, 
  FileText, 
  Sparkles, 
  CheckCircle2, 
  Loader2, 
  AlertCircle,
  ArrowLeft
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { extractCvAction } from "@/app/actions/cv-actions"
import { toast } from "@/hooks/use-toast"
import { extractClientDocumentText } from "@/lib/client-document-text"
import { buildRecoveredExtractionFromText, getExtractionQuality, hasMeaningfulExtraction, hasRecoverableDraft } from "@/lib/resume-text-recovery"
import { cn } from "@/lib/utils"
import Link from "next/link"

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

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (status === 'parsing') {
      interval = setInterval(() => {
        setLoadingStep(prev => (prev + 1) % 4)
      }, 2500)
    } else {
      setLoadingStep(0)
    }
    return () => clearInterval(interval)
  }, [status])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (status === 'parsing') {
      setParsingProgress(0)
      interval = setInterval(() => {
        setParsingProgress(prev => {
          if (prev >= 92) return prev
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
    if (!file) return

    let extractionStarted = false
    const userId = user?.uid || "anonymous_user"

    try {
      sessionStorage.removeItem("parsedCvData")
      setStatus('uploading')
      setUploadProgress(15)
      setError(null)
      const preflightTextPromise = extractClientDocumentText(file)
      const fileDataUriPromise = fileToDataUri(file)

      if (user) {
        void reportQualitySignal(user, {
          category: "upload",
          eventType: "cv_upload_started",
          status: "healthy",
          summary: "A validated CV upload started preparing for server-side extraction.",
          userId: userId,
          metadata: {
            fileSizeBytes: file.size,
            mimeType: file.type || "application/pdf",
          },
        })
      }

      const fileDataUri = await fileDataUriPromise
      setUploadProgress(100)

      if (user) {
        void reportQualitySignal(user, {
          category: "upload",
          eventType: "cv_upload_prepared",
          status: "healthy",
          summary: "The CV file was prepared locally and handed off to the server extraction pipeline.",
          userId: userId,
          metadata: {
            fileSizeBytes: file.size,
            mimeType: file.type || "application/pdf",
          },
        })
      }

      setStatus("parsing")
      extractionStarted = true
      const preflightText = await preflightTextPromise

      let parsedData = await extractCvAction({
        cvDataUri: fileDataUri,
        cvMimeType: file.type || 'application/pdf',
        cvRawText: preflightText,
        userId: userId,
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

      sessionStorage.setItem('parsedCvData', JSON.stringify(parsedData))
      setStatus('complete')
      const guardianStatus = parsedData.metadata?.guardian?.status
      toast({
        title: guardianStatus === "recovered" ? "Analysis Recovered" : "Analysis Success",
        description:
          guardianStatus === "recovered"
            ? "The extraction guardian recovered a draft. Review it carefully."
            : hasMeaningfulExtraction(parsedData)
            ? "CV successfully analyzed and ready for review."
            : "A partial draft was created. Review it carefully before continuing.",
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
      toast({ variant: "destructive", title: "Parsing Error", description: "Check file format or try another document." })
    }
  }

  return (
    <div className="relative min-h-[calc(100vh-5rem)] px-4 py-6 md:px-8 md:py-10 flex flex-col items-center justify-center">
      <div className="w-full max-w-xl space-y-5">
        {/* Top Header */}
        <div className="space-y-2 text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/10 bg-primary/5 px-3 py-0.5 text-xs font-semibold text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            <span>AI Extraction Engine</span>
          </div>

          <h1 className="text-xl font-black tracking-tight text-slate-900 sm:text-2xl">
            Upload Your Resume / CV
          </h1>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Upload your document for instant AI parsing. Supports PDF, DOCX, and Text files up to 10MB.
          </p>
        </div>

        <Card className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white/90 shadow-lg backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/90">
          <CardContent className="p-5 sm:p-6">
            {status === 'idle' && (
              <div className="space-y-4">
                <div 
                  className="group relative cursor-pointer flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-6 text-center transition-all hover:border-primary hover:bg-primary/5 dark:border-slate-800 dark:bg-slate-950/40"
                  onClick={() => document.getElementById('cv-upload')?.click()}
                >
                  <input 
                    id="cv-upload" 
                    type="file" 
                    className="hidden" 
                    accept=".pdf,.docx,.doc,.txt,image/*" 
                    onChange={handleFileChange}
                  />

                  <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary transition-transform group-hover:scale-105">
                    <Upload className="h-5 w-5" />
                  </div>

                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    {file ? file.name : "Click to select or drag & drop file"}
                  </p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {file ? `${(file.size / (1024 * 1024)).toFixed(2)} MB` : "PDF, DOCX, DOC, or TXT up to 10MB"}
                  </p>
                </div>

                {file && (
                  <div className="flex flex-col gap-2 pt-1">
                    <Button 
                      size="sm" 
                      className="h-9 w-full rounded-lg text-xs font-bold shadow-sm"
                      onClick={handleUpload}
                    >
                      Analyze CV with AI <Sparkles className="ml-1.5 h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}

                <div className="flex items-center justify-between pt-1">
                  <Button variant="ghost" size="sm" asChild className="h-8 text-xs text-muted-foreground">
                    <Link href="/onboarding">
                      <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Back to Setup
                    </Link>
                  </Button>

                  <Button variant="ghost" size="sm" asChild className="h-8 text-xs text-muted-foreground">
                    <Link href="/cv-editor">
                      Start from scratch
                    </Link>
                  </Button>
                </div>
              </div>
            )}

            {(status === 'uploading' || status === 'parsing') && (
              <div className="space-y-5 py-4 text-center">
                <div className="relative mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>

                <div className="space-y-1">
                  <Badge variant="outline" className="text-[10px] font-semibold uppercase">
                    {status === 'uploading' ? 'Preparing File' : 'AI Neural Extraction'}
                  </Badge>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {status === 'uploading'
                      ? `Uploading... ${Math.round(uploadProgress)}%`
                      : ["Scanning Structure", "Extracting Work History", "Mapping Skills & Roles", "Finalizing Profile"][loadingStep]}
                  </h3>
                  <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                    Please wait while our AI parses your background details.
                  </p>
                </div>

                <div className="mx-auto max-w-xs space-y-1.5">
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <motion.div
                      className="h-full bg-primary"
                      initial={{ width: "0%" }}
                      animate={{ width: `${status === 'uploading' ? uploadProgress : parsingProgress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>In progress</span>
                    <span>{Math.round(status === 'uploading' ? uploadProgress : parsingProgress)}%</span>
                  </div>
                </div>
              </div>
            )}

            {status === 'error' && (
              <div className="space-y-4 py-2 text-center">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-600">
                  <AlertCircle className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-red-900 dark:text-red-300">Extraction Issue</h3>
                  <p className="text-xs text-red-600 dark:text-red-400">{error || "Could not process this file."}</p>
                </div>
                <div className="flex justify-center gap-2 pt-2">
                  <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => setStatus('idle')}>
                    Try Another File
                  </Button>
                  <Button size="sm" variant="ghost" className="h-8 text-xs" asChild>
                    <Link href="/cv-editor">Build Manually</Link>
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
