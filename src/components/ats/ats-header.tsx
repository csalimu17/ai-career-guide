"use client"

import Link from "next/link"
import { ChevronRight, Layout, Search, Target, Trophy } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export const ATSHeader = ({ plan, remainingChecks, builderHref }: { plan: string, remainingChecks: number, builderHref: string }) => {
  return (
    <section className="section-shell relative mb-10 overflow-hidden border-none p-6 md:p-12">
      <div className="magic-glow-item h-96 w-96 -top-24 -right-24 animate-mesh-float opacity-10" />
      <div className="magic-glow-item h-96 w-96 -bottom-24 -left-24 bg-brand-teal animate-mesh-float opacity-10 [animation-delay:3s]" />
      
      <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-center">
        <div className="flex-1 space-y-6">
          <h1 className="font-display pb-2 text-[2.1rem] font-black leading-[1.12] tracking-tight text-slate-950 sm:text-[3.2rem] xl:text-[4.5rem]">
            Beat the <span className="headline-gradient-vivid pb-1">Hiring Robot.</span>
          </h1>
          <p className="max-w-xl text-base font-medium text-slate-500 leading-relaxed md:text-[1.25rem]">
            Simulate how Applicant Tracking Systems (ATS) read your resume. Find keyword gaps and fix them before you apply.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Badge variant="outline" className="h-9 px-4 rounded-full border-slate-200 bg-white text-slate-600 font-bold shadow-sm">
              <Layout className="w-3.5 h-3.5 mr-2" /> {plan.toUpperCase()} PLAN
            </Badge>
            <Badge variant="outline" className="h-9 px-4 rounded-full border-slate-200 bg-white text-slate-600 font-bold shadow-sm">
              <Search className="w-3.5 h-3.5 mr-2" /> {remainingChecks} SCANS LEFT
            </Badge>
          </div>
        </div>

        <div className="flex-1 w-full max-w-[500px] lg:max-w-none">
           <div className="magic-card bg-white/40 p-1">
              <div className="relative overflow-hidden rounded-[1.95rem] bg-slate-900 p-6 text-white md:p-10">
                 <div className="absolute top-0 right-0 p-10 opacity-10 pointer-events-none">
                    <Target className="w-40 h-40 rotate-12" />
                 </div>
                 <div className="relative z-10 space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full border border-brand-purple/30 bg-brand-purple/20">
                         <Trophy className="h-5 w-5 text-brand-purple" />
                      </div>
                      <p className="text-[0.68rem] font-black uppercase tracking-[0.24em] text-brand-purple sm:text-[0.7rem] sm:tracking-[0.3em]">Global Success Rate</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 sm:gap-8">
                       <div>
                          <p className="text-3xl font-black sm:text-4xl">78%</p>
                          <p className="text-[0.65rem] font-bold uppercase tracking-widest mt-1 text-slate-400">Faster Interviews</p>
                       </div>
                       <div>
                          <p className="text-3xl font-black sm:text-4xl">2.4x</p>
                          <p className="text-[0.65rem] font-bold uppercase tracking-widest mt-1 text-slate-400">Match Accuracy</p>
                       </div>
                    </div>
                    <Button className="h-13 w-full rounded-2xl bg-white text-sm font-black text-slate-950 transition-all hover:bg-slate-100 sm:h-14 sm:text-base" asChild>
                       <Link href={builderHref}>Fix my Resume Now <ChevronRight className="ml-2 w-5 h-5" /></Link>
                    </Button>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </section>
  )
}
