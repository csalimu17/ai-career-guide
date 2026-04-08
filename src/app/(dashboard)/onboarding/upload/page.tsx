"use client"

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
import { extractCvAction } from "@/app/actions/cv-actions"
import { toast } from "@/hooks/use-toast"
import { extractClientDocumentText } from "@/lib/client-document-text"
import { buildRecoveredExtractionFromText, getExtractionQuality, hasMeaningfulExtraction, hasRecoverableDraft } from "@/lib/resume-text-recovery"
import { cn } from "@/lib/utils"
import Link from "next/link"

async function reportQualitySignal(payload: Record<string, unknown>) {
  try {
    await fetch("/api/quality/report", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      keepalive: true,
    })
  } catch (error) {
    console.warn("Failed to report upload quality signal:", error)
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
        void reportQualitySignal({
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
        void reportQualitySignal({
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

      void reportQualitySignal({
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

      void reportQualitySignal({
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

      void reportQualitySignal({
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
        void reportQualitySignal({
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
    <div className="mobile-app-page md:mx-auto md:max-w-4xl md:px-6 md:py-12">
      <div className="mb-6 space-y-3 text-center sm:mb-12 sm:space-y-4">
        <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-accent shadow-xl shadow-accent/20 animate-bounce md:mb-4 md:h-14 md:w-14">
          <CloudLightning className="h-7 w-7 text-white" />
        </div>
        <h1 className="text-[1.8rem] font-black tracking-tight text-primary sm:text-4xl">Upload Your Experience</h1>
        <p className="text-sm text-muted-foreground sm:text-lg">Powered by our <span className="text-accent font-bold">AI extraction pipeline</span> for fast, high-quality recovery and parsing.</p>
        <div className="flex flex-wrap justify-center gap-3 pt-2 sm:pt-4">
           <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 px-3 py-1 font-bold">
             <ShieldCheck className="h-3 w-3 mr-2" /> Data Encrypted
           </Badge>
           <Badge variant="outline" className="bg-accent/5 text-accent border-accent/20 px-3 py-1 font-bold">
             <Sparkles className="h-3 w-3 mr-2" /> Gemini AI Core
           </Badge>
           <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 px-3 py-1 font-bold">
             <Zap className="h-3 w-3 mr-2" /> Extraction Guardian Active
           </Badge>
        </div>
      </div>

      <Card className="overflow-hidden rounded-[1.75rem] border-none bg-white p-2 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.14)] sm:rounded-[3rem]">
        <div className="space-y-5 rounded-[1.4rem] bg-gradient-to-b from-slate-50 to-white p-4 sm:space-y-8 sm:rounded-[2.5rem] sm:p-12">
          
          {status === 'idle' && (
            <div 
              className="group relative cursor-pointer space-y-4 rounded-[1.35rem] border-4 border-dashed border-slate-200 p-5 text-center transition-all hover:border-accent hover:bg-accent/5 sm:space-y-6 sm:rounded-[2rem] sm:p-16"
              onClick={() => document.getElementById('cv-upload')?.click()}
            >
              <input 
                id="cv-upload" 
                type="file" 
                className="hidden" 
                accept=".pdf,.docx,.txt,image/*" 
                onChange={handleFileChange}
              />
              
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[1.1rem] bg-white shadow-xl transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 sm:h-20 sm:w-20 sm:rounded-3xl">
                <Upload className="h-8 w-8 text-accent sm:h-10 sm:w-10" />
              </div>
              
              <div className="space-y-2">
                  <h3 className="text-lg font-black text-primary sm:text-2xl">
                  {file ? file.name : "Drop your CV here"}
                </h3>
                <p className="text-sm font-medium text-slate-400 sm:text-base">Supporting PDF, DOCX, or Photos up to 10MB</p>
              </div>

              {file && (
                <div className="flex flex-col items-center gap-3 pt-2">
                  <Button 
                    size="lg" 
                    className="mt-2 h-11 w-full rounded-2xl bg-primary px-6 text-sm font-bold shadow-2xl hover:bg-primary/90 sm:mt-4 sm:h-14 sm:w-auto sm:px-12 sm:text-lg"
                    onClick={(e) => { e.stopPropagation(); handleUpload(); }}
                  >
                    Analyze with AI <Sparkles className="ml-2 h-5 w-5" />
                  </Button>
                  <Button variant="ghost" asChild className="rounded-xl font-bold text-xs uppercase tracking-widest text-muted-foreground">
                    <Link href="/editor">Start from scratch instead</Link>
                  </Button>
                </div>
              )}
            </div>
          )}

          {(status === 'uploading' || status === 'parsing') && (
              <div className="relative overflow-hidden rounded-[1.5rem] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.98))] px-4 py-8 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] sm:px-10 sm:py-14">
                <div className="absolute inset-x-10 top-0 h-24 rounded-full bg-primary/8 blur-3xl" />
                <div className="relative mx-auto flex min-h-[320px] max-w-xl flex-col items-center justify-center space-y-8 text-center sm:min-h-[360px]">
                  <div className="flex h-24 w-24 items-center justify-center rounded-full border border-primary/15 bg-white shadow-[0_20px_50px_-20px_rgba(101,88,245,0.45)]">
                    {status === 'uploading' ? (
                      <Loader2 className="h-11 w-11 animate-spin text-accent" />
                    ) : (
                      <div className="relative">
                        <Loader2 className="h-11 w-11 animate-spin text-primary" />
                        <Sparkles className="absolute -right-2 -top-2 h-4 w-4 text-orange-500" />
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <Badge variant="outline" className="border-primary/15 bg-primary/5 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.24em] text-primary">
                      {status === 'uploading' ? 'Secure Preparation' : 'AI Extraction'}
                    </Badge>
                    <h2 className="text-2xl font-black text-primary sm:text-3xl">
                      {status === 'uploading' ? `Preparing file... ${Math.round(uploadProgress)}%` : 'Gemini AI Analysis In Progress'}
                    </h2>
                    <p className="mx-auto max-w-md text-sm font-medium leading-6 text-slate-500 sm:text-base">
                      {status === 'uploading'
                        ? 'Converting your CV into a secure server-ready payload before analysis begins.'
                        : 'Scanning your CV for contact details, experience, education, and skills.'}
                    </p>
                    {file && (
                      <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-400">
                        {file.name}
                      </p>
                    )}
                  </div>

                  <div className="w-full max-w-md space-y-4">
                    <div className="relative h-3 overflow-hidden rounded-full border border-slate-200 bg-slate-100">
                      <div
                        className={cn(
                          "absolute inset-y-0 left-0 rounded-full transition-[width] duration-500 ease-out",
                          status === 'uploading'
                            ? "bg-[linear-gradient(90deg,rgba(249,115,22,1),rgba(251,146,60,1))]"
                            : "bg-[linear-gradient(90deg,rgba(101,88,245,1),rgba(249,115,22,1))]"
                        )}
                        style={{ width: `${status === 'uploading' ? uploadProgress : parsingProgress}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.24em] text-slate-300">
                      <span className={cn(status === 'uploading' ? "text-accent" : "text-slate-300")}>Input</span>
                      <span className={cn(status === 'parsing' && parsingProgress < 70 ? "text-primary" : "text-slate-300")}>Processing</span>
                      <span className={cn(status === 'parsing' && parsingProgress >= 70 ? "text-orange-500" : "text-slate-300")}>Finalizing</span>
                    </div>
                  </div>
                </div>
              </div>
          )}

          {status === 'error' && (
            <div className="space-y-6 py-8 text-center sm:py-12">
              <div className="bg-red-50 h-20 w-20 rounded-full flex items-center justify-center mx-auto">
                <AlertCircle className="h-10 w-10 text-red-500" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-red-900 sm:text-2xl">Analysis Halted</h3>
                <p className="text-sm font-medium text-red-700/60 sm:text-base">{error || "Something went wrong during extraction."}</p>
              </div>
              <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                <Button variant="outline" className="border-2 rounded-xl h-12" onClick={() => setStatus('idle')}>
                  Try Another File
                </Button>
                <Button variant="ghost" asChild className="rounded-xl h-12 font-bold">
                  <Link href="/onboarding">Back to Setup</Link>
                </Button>
              </div>
            </div>
          )}

        </div>
      </Card>
      
      <div className="mt-10 text-center text-[10px] font-black uppercase tracking-[0.3em] text-slate-300 sm:mt-12">
        Enterprise Grade Parsing Architecture
      </div>
    </div>
  )
}
