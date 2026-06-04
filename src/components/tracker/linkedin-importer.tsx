"use client"

import { useState } from "react"
import { useFirestore, useUser } from "@/firebase"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Sparkles, Check, AlertCircle, Linkedin, Trash2, ListChecks } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import {
  buildTrackedApplicationPayload,
  JOB_SOURCE_DEFAULT_URLS,
  JOB_STATUS_CONFIG,
  type JobTrackingStatus,
  type JobListingRecord,
} from "@/lib/jobs/model"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"

export function LinkedInImporter() {
  const { user } = useUser()
  const db = useFirestore()
  
  const [isOpen, setIsOpen] = useState(false)
  const [text, setText] = useState("")
  const [isParsing, setIsParsing] = useState(false)
  const [parsedJobs, setParsedJobs] = useState<any[]>([])
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set())
  const [step, setStep] = useState<"input" | "review" | "success">("input")

  const reset = () => {
    setText("")
    setParsedJobs([])
    setSelectedIndices(new Set())
    setStep("input")
    setIsParsing(false)
  }

  const handleParse = async () => {
    if (!text.trim()) {
      toast({ title: "Paste something first", description: "We need some text to work with!" })
      return
    }
    setIsParsing(true)
    try {
      const res = await fetch("/api/jobs/import/linkedin", {
        method: "POST",
        body: JSON.stringify({ text }),
        headers: { "Content-Type": "application/json" },
      })
      
      if (!res.ok) throw new Error("API failure")
      
      const data = await res.json()
      if (data.jobs && data.jobs.length > 0) {
        setParsedJobs(data.jobs)
        setSelectedIndices(new Set(data.jobs.map((_: any, i: number) => i)))
        setStep("review")
      } else {
        toast({
          variant: "destructive",
          title: "No jobs detected",
          description: "The AI couldn't find any job listings in that text. Try copying your 'Applied' page.",
        })
      }
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Parsing failed",
        description: "Something went wrong while analyzing the text.",
      })
    } finally {
      setIsParsing(false)
    }
  }

  const toggleSelection = (index: number) => {
    const next = new Set(selectedIndices)
    if (next.has(index)) next.delete(index)
    else next.add(index)
    setSelectedIndices(next)
  }

  const handleImport = async () => {
    if (!user || !db) return
    const toImport = parsedJobs.filter((_, i) => selectedIndices.has(i))
    
    if (toImport.length === 0) {
      toast({ title: "Nothing selected", description: "Select at least one job to import." })
      return
    }

    setIsParsing(true) // Reuse parsing state for loading
    try {
      for (const job of toImport) {
        // Clean up role/company for ID
        const cleanRole = job.role.toLowerCase().replace(/[^a-z0-9]/g, "-")
        const cleanCompany = job.company.toLowerCase().replace(/[^a-z0-9]/g, "-")
        
        const listing: JobListingRecord = {
          id: `linkedin-${cleanCompany}-${cleanRole}-${Date.now() % 10000}`,
          source: "linkedin",
          sourceUrl: job.sourceUrl || JOB_SOURCE_DEFAULT_URLS.linkedin,
          company: job.company,
          role: job.role,
          location: job.location || "Remote",
          workplaceType: "remote",
          employmentType: "full-time",
          shortDescription: `Imported via Magic LinkedIn Import. Original date info: ${job.appliedDateLabel || "LinkedIn Dashboard"}`,
          postedLabel: "Imported via AI",
          tags: ["linkedin-import"],
          listingOrigin: "manual_entry",
        }

        const payload = buildTrackedApplicationPayload({
          userId: user.uid,
          listing,
          status: job.status as JobTrackingStatus,
          statusSource: "manual_entry",
          note: `Imported via Magic LinkedIn Importer. Original LinkedIn Date: ${job.appliedDateLabel || "Unknown"}.`,
        })

        await addDoc(collection(db, "users", user.uid, "jobApplications"), {
          ...payload,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })
      }
      setStep("success")
      toast({ title: "Imported!", description: `Successfully added ${toImport.length} jobs to your tracker.` })
    } catch (err) {
      console.error(err)
      toast({ variant: "destructive", title: "Import error", description: "Failed to save some jobs. Please try again." })
    } finally {
      setIsParsing(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) reset() }}>
      <DialogTrigger asChild>
        <Button variant="outline" className="h-12 rounded-2xl font-bold border-indigo-200 bg-indigo-50/50 text-indigo-700 hover:bg-indigo-100 hover:text-indigo-800 transition-all">
          <Sparkles className="mr-2 h-4 w-4" />
          Magic Import
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[640px] rounded-[2rem] overflow-hidden p-0 gap-0 border-none shadow-2xl">
        <div className="bg-indigo-600 px-8 py-10 text-white relative">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Linkedin className="h-24 w-24 rotate-12" />
          </div>
          <DialogHeader>
            <DialogTitle className="text-3xl font-black tracking-tight flex items-center gap-3">
              <Sparkles className="h-8 w-8 text-indigo-200 animate-pulse" />
              LinkedIn Magic Import
            </DialogTitle>
            <DialogDescription className="text-indigo-100/80 text-lg font-medium">
              {step === "input" && "Paste text from your LinkedIn 'Applied' page to bulk-import roles."}
              {step === "review" && `We found ${parsedJobs.length} potential jobs. Select which ones to keep.`}
              {step === "success" && "Your pipeline has been updated!"}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="p-8 bg-white">
          {step === "input" && (
            <div className="space-y-6">
              <div className="rounded-2xl border-2 border-dashed border-indigo-100 bg-indigo-50/30 p-1">
                <Textarea
                  placeholder="Visit LinkedIn > Jobs > Applied. Select all (Ctrl+A), Copy, and Paste here..."
                  className="min-h-[240px] border-none bg-transparent focus-visible:ring-0 text-base leading-relaxed p-4"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                />
              </div>
              <div className="flex gap-4 items-start bg-amber-50 rounded-2xl p-4 text-amber-800 border border-amber-100">
                <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                <div className="text-xs font-semibold leading-normal">
                  <p className="uppercase tracking-widest opacity-60 mb-1">How it works</p>
                  Our AI models identify company names, roles, and application statuses from your clipboard text. No passwords or direct profile access required.
                </div>
              </div>
            </div>
          )}

          {step === "review" && (
            <div className="space-y-6">
              <ScrollArea className="h-[400px] rounded-2xl border bg-slate-50/50 p-4">
                <div className="space-y-3">
                  {parsedJobs.map((job, i) => (
                    <div
                      key={i}
                      onClick={() => toggleSelection(i)}
                      className={`flex items-center gap-4 p-4 rounded-xl border transition-all cursor-pointer ${
                        selectedIndices.has(i) 
                          ? "bg-white border-indigo-500 shadow-md ring-1 ring-indigo-500/10" 
                          : "bg-white/50 border-slate-200 opacity-60 grayscale-[0.5]"
                      }`}
                    >
                      <Checkbox checked={selectedIndices.has(i)} onCheckedChange={() => toggleSelection(i)} className="rounded-full h-5 w-5 border-2" />
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-slate-900 truncate">{job.role}</p>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest truncate">{job.company}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1.5">
                        <Badge variant="outline" className={`${JOB_STATUS_CONFIG[job.status as JobTrackingStatus]?.chipClassName} rounded-full px-2 py-0 text-[0.6rem] font-black uppercase`}>
                          {job.status}
                        </Badge>
                        <span className="text-[0.65rem] font-bold text-slate-400">{job.location}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              <div className="flex justify-between items-center px-2">
                <p className="text-sm font-bold text-slate-500">
                  {selectedIndices.size} of {parsedJobs.length} selected
                </p>
                <Button variant="ghost" className="text-indigo-600 font-bold hover:bg-indigo-50" onClick={() => setSelectedIndices(selectedIndices.size === parsedJobs.length ? new Set() : new Set(parsedJobs.map((_, i) => i)))}>
                  {selectedIndices.size === parsedJobs.length ? "Deselect all" : "Select all"}
                </Button>
              </div>
            </div>
          )}

          {step === "success" && (
            <div className="py-12 flex flex-col items-center text-center space-y-4">
              <div className="h-20 w-20 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                <Check className="h-10 w-10 stroke-[3]" />
              </div>
              <div className="space-y-1">
                <h3 className="text-2xl font-black text-slate-900">Import Complete!</h3>
                <p className="text-slate-500 font-medium tracking-tight">Your jobs have been added to your tracking pipeline.</p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="bg-slate-50/50 p-8 border-t">
          {step === "input" && (
            <>
              <Button variant="outline" className="rounded-xl h-12 px-6 font-bold" onClick={() => setIsOpen(false)}>Cancel</Button>
              <Button 
                className="rounded-xl h-12 px-10 font-black bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-600/20" 
                onClick={handleParse}
                disabled={isParsing || !text.trim()}
              >
                {isParsing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyzing...</> : "Start AI Extraction"}
              </Button>
            </>
          )}
          {step === "review" && (
            <>
              <Button variant="outline" className="rounded-xl h-12 px-6 font-bold" onClick={() => setStep("input")}>Back</Button>
              <Button 
                className="rounded-xl h-12 px-10 font-black bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-600/20" 
                onClick={handleImport}
                disabled={isParsing || selectedIndices.size === 0}
              >
                {isParsing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Importing...</> : `Import ${selectedIndices.size} jobs`}
              </Button>
            </>
          )}
          {step === "success" && (
            <Button className="w-full rounded-xl h-12 font-black bg-slate-900 hover:bg-slate-800" onClick={() => setIsOpen(false)}>Done</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
