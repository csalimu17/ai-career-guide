"use client"

import Link from "next/link"
import { ArrowRight, History, Target } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export const ReportVerdict = ({ visibleReport, builderHref, formatDate }: { visibleReport: any, builderHref: string, formatDate: (val: any) => string }) => {
  return (
      <div className="magic-card relative overflow-hidden bg-gradient-to-br from-slate-900 to-slate-950 p-8 md:p-14 text-white shadow-2xl">
        <div className="absolute top-0 right-0 p-16 opacity-5 pointer-events-none rotate-12">
           <Target className="w-64 h-64" />
        </div>
        <div className="relative z-10 flex flex-col items-center gap-12 lg:flex-row lg:justify-between">
           <div className="flex flex-col items-center gap-8 lg:flex-row">
              <div className="relative shrink-0">
                 <div className="flex h-32 w-32 items-center justify-center rounded-full border-4 border-white/20 text-4xl font-black bg-white/5 backdrop-blur-md md:h-44 md:w-44 md:text-6xl">
                    {visibleReport.atsScore}%
                 </div>
                 <svg className="absolute -inset-4 h-[calc(100%+32px)] w-[calc(100%+32px)] rotate-[-90deg]">
                    <circle cx="50%" cy="50%" r="46%" fill="none" stroke="currentColor" strokeWidth="4" strokeDasharray={`${visibleReport.atsScore}, 100`} pathLength="100" className="text-blue-400 drop-shadow-[0_0_15px_rgba(96,165,250,0.8)]" />
                 </svg>
                 <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-white px-5 py-2 text-[11px] font-black uppercase tracking-widest text-slate-950 shadow-xl">
                    Match Score
                 </div>
              </div>

              <div className="space-y-4 text-center lg:text-left">
                 <div className="flex items-center justify-center lg:justify-start gap-4">
                    <Badge variant="outline" className="border-brand-teal/30 bg-brand-teal/10 text-brand-teal px-3 py-1 font-black uppercase text-[10px] tracking-widest">Diagnostic Verdict</Badge>
                    <div className="flex items-center gap-2 text-[10px] font-black text-slate-400/80 tracking-widest">
                       <History className="w-3.5 h-3.5" /> {formatDate(visibleReport.createdAt)}
                    </div>
                 </div>
                 <h2 className="text-[2rem] font-black leading-tight tracking-tighter md:text-5xl lg:max-w-xl">
                    {visibleReport.headline || "Analysis Complete"}
                 </h2>
                 <p className="max-w-2xl text-base font-medium text-slate-300 leading-relaxed md:text-lg">
                    {visibleReport.matchSummary}
                 </p>
              </div>
           </div>
           
           <div className="hidden shrink-0 space-y-4 lg:block">
              <Button className="h-16 rounded-[1.8rem] bg-white bg-none px-10 text-base font-black text-slate-900 transition-all hover:bg-slate-100 hover:scale-[1.02]" asChild>
                 <Link href={builderHref}>Apply to Editor <ArrowRight className="ml-3 h-5 w-5" /></Link>
              </Button>
              <p className="text-center text-[10px] font-bold text-slate-400/80 uppercase tracking-widest">Save and fix keywords</p>
           </div>
        </div>
     </div>
  )
}
