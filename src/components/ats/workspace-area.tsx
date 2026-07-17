"use client"

import { FileSearch, Info, Loader2, Plus, Search, Sparkles, Zap } from "lucide-react"
import { PremiumIcon } from "./premium-icon"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

export const WorkspaceArea = ({ 
  resumes, 
  selectedResumeId, 
  loadResumeIntoWorkspace, 
  cvContent, 
  setCvContent, 
  jobDescription, 
  setJobDescription, 
  runScan, 
  isRunning, 
  handleClear,
  formatDate
}: {
  resumes: any[] | undefined,
  selectedResumeId: string | null,
  loadResumeIntoWorkspace: (resume: any) => void,
  cvContent: string,
  setCvContent: (val: string) => void,
  jobDescription: string,
  setJobDescription: (val: string) => void,
  runScan: () => void,
  isRunning: boolean,
  handleClear: () => void,
  formatDate: (val: any) => string
}) => {
  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-3 px-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="flex items-center gap-3 font-display text-xl font-black tracking-tight text-slate-950 sm:text-2xl">
          <PremiumIcon icon={FileSearch} color="purple" />
          Scan workspace
        </h2>
        <Button variant="ghost" onClick={handleClear} className="h-10 justify-start px-0 text-[0.68rem] font-black uppercase tracking-widest text-slate-400 hover:text-rose-500 sm:h-auto sm:justify-center sm:px-3">
           Reset Workspace
        </Button>
      </div>

      <div className="grid gap-8 lg:grid-cols-[3fr_2fr]">
        <Card className="magic-card p-1">
           <div className="rounded-[1.95rem] bg-white p-6 md:p-8 space-y-8">
              <div className="space-y-4">
                <p className="flex items-center gap-2 text-[0.68rem] font-black uppercase tracking-[0.2em] text-slate-400">
                  <Plus className="w-3 h-3" /> Select Source Resume
                </p>
                <div className="no-scrollbar flex gap-3 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible">
                  {resumes?.slice(0, 4).map(res => (
                    <button 
                      key={res.id}
                      onClick={() => loadResumeIntoWorkspace(res)}
                      className={cn(
                        "group relative shrink-0 rounded-2xl border px-4 py-3 text-left transition-all duration-300 sm:shrink",
                        selectedResumeId === res.id ? "bg-brand-purple/5 border-brand-purple/20 ring-1 ring-brand-purple/10" : "bg-slate-50 border-slate-100 hover:bg-white hover:shadow-md"
                      )}
                    >
                      <p className={cn("text-[0.68rem] font-black max-w-[120px] truncate", selectedResumeId === res.id ? "text-brand-purple" : "text-slate-600")}>
                        {res.name}
                      </p>
                      <p className="mt-1 text-[0.65rem] font-bold text-slate-400">{formatDate(res.updatedAt)}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-3">
                  <div className="flex items-center justify-between px-1">
                    <label className="text-[0.68rem] font-black uppercase tracking-widest text-slate-400">Content of CV</label>
                    <span className="text-[0.65rem] font-bold text-slate-300">{cvContent.length} chars</span>
                  </div>
                  <Textarea 
                     value={cvContent}
                     onChange={e => setCvContent(e.target.value)}
                     placeholder="Paste your CV here..."
                     className="min-h-[180px] md:min-h-[320px] rounded-3xl border-slate-100 bg-slate-50/50 p-6 text-sm leading-relaxed transition-all focus:bg-white focus:ring-brand-purple/10"
                  />
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between px-1">
                    <label className="text-[0.68rem] font-black uppercase tracking-widest text-slate-400">Target job description</label>
                    <span className="text-[0.65rem] font-bold text-slate-300">{jobDescription.length} chars</span>
                  </div>
                  <Textarea 
                     value={jobDescription}
                     onChange={e => setJobDescription(e.target.value)}
                     placeholder="Paste the Job Description here..."
                     className="min-h-[180px] md:min-h-[320px] rounded-3xl border-slate-100 bg-slate-50/50 p-6 text-sm leading-relaxed transition-all focus:bg-white focus:ring-brand-purple/10"
                  />
                </div>
              </div>

             <div className="flex justify-center pt-4">
                <Button 
                  onClick={runScan}
                  disabled={isRunning}
                  className={cn(
                    "h-14 w-full rounded-full text-base font-black tracking-tight transition-all duration-300 shadow-xl sm:h-16 sm:max-w-sm sm:text-lg",
                    isRunning ? "bg-slate-100 text-slate-400" : "bg-slate-900 text-white hover:bg-black hover:scale-[1.02] active:scale-[0.98] shadow-slate-200"
                  )}
                >
                  {isRunning ? <><Loader2 className="mr-3 h-6 w-6 animate-spin" /> Analyzing...</> : <><Search className="mr-3 h-5 w-5" /> Run ATS Diagnostic</>}
                </Button>
              </div>
           </div>
        </Card>

        <div className="space-y-6">
           <Card className="magic-card p-8 space-y-6">
              <div className="flex items-center gap-4">
                 <PremiumIcon icon={Info} color="teal" />
                 <div className="space-y-1">
                    <h3 className="text-lg font-black text-slate-900">How it works</h3>
                    <p className="text-sm font-medium text-slate-400 italic">Advanced AI benchmarking</p>
                 </div>
              </div>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-900 text-[11px] font-black text-white">1</div>
                  <p className="text-sm font-medium text-slate-600 leading-relaxed"><span className="font-bold text-slate-950">Keyword Mapping:</span> AI identifies essential skills and certifications from the JD.</p>
                </div>
                <div className="flex gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-900 text-[11px] font-black text-white">2</div>
                  <p className="text-sm font-medium text-slate-600 leading-relaxed"><span className="font-bold text-slate-950">Structural Audit:</span> We check if your experience blocks are logically formatted for parser logic.</p>
                </div>
                <div className="flex gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-900 text-[11px] font-black text-white">3</div>
                  <p className="text-sm font-medium text-slate-600 leading-relaxed"><span className="font-bold text-slate-950">Actionable Plan:</span> You get a prioritized checklist of exactly what to add or rephrase.</p>
                </div>
              </div>
           </Card>

           <div className="magic-card bg-brand-gradient-soft p-1">
              <div className="rounded-[1.95rem] bg-white/60 backdrop-blur-xl p-8 space-y-4">
                <p className="flex items-center gap-2 text-[0.68rem] font-black uppercase tracking-widest text-slate-400"><Sparkles className="w-3.5 h-3.5 text-brand-purple" /> Dynamic Suggestion</p>
                <p className="text-base font-bold text-slate-900">"Your CV matches the core technical role, but misses soft-skill mentions like 'Cross-functional leadership'."</p>
                <p className="text-[0.68rem] font-medium italic text-slate-500">— AI Insight Pilot</p>
              </div>
           </div>
        </div>
      </div>
    </section>
  )
}
