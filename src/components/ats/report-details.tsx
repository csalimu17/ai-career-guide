"use client"

import { AlertTriangle, CheckCircle2, Layout as LayoutIcon, Target, Zap } from "lucide-react"
import { StatCard } from "./stat-card"
import { PremiumIcon } from "./premium-icon"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export const ReportDetails = ({ visibleReport }: { visibleReport: any }) => {
  return (
    <div className="space-y-10">
       {/* KPI Grid */}
       <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Keyword Match" value={`${visibleReport.keywordCoverage || 0}%`} icon={Target} colorTheme="blue" subvalue="Coverage" />
          <StatCard label="Gaps Identified" value={visibleReport.missingKeywords?.length || 0} icon={AlertTriangle} colorTheme="amber" subvalue="Actionable" />
          <StatCard label="Formatting" value="Optimal" icon={CheckCircle2} colorTheme="teal" />
          <StatCard label="Impact Score" value={`${visibleReport.categories?.impact || 0}%`} icon={Zap} colorTheme="purple" subvalue="Strategic" />
        </div>

       {/* Detailed Breakdown Bento */}
       <div className="grid gap-8 lg:grid-cols-[1fr_1.1fr]">
          {/* Left Column: Keywords */}
          <div className="space-y-8">
             <Card className="magic-card">
                <CardHeader className="p-8 pb-0">
                   <CardTitle className="text-xl font-black flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100">
                         <Target className="w-5 h-5" />
                      </div>
                      Keywords Analysis
                   </CardTitle>
                </CardHeader>
                <CardContent className="p-8 space-y-8">
                   <div className="space-y-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Successfully Matched</p>
                      <div className="flex flex-wrap gap-2">
                         {visibleReport.matchedKeywords?.length ? visibleReport.matchedKeywords.map((kw: string) => (
                            <Badge key={kw} className="h-8 rounded-xl border-emerald-100 bg-emerald-50 text-emerald-700 text-[11px] font-black px-4 shadow-sm">
                               {kw}
                            </Badge>
                         )) : <p className="text-sm font-medium text-slate-400 italic">No direct matches found.</p>}
                      </div>
                   </div>
                   <div className="space-y-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Critical Gaps (Add these)</p>
                      <div className="flex flex-wrap gap-2">
                         {visibleReport.missingKeywords?.length ? visibleReport.missingKeywords.map((kw: string) => (
                            <Badge key={kw} className="h-8 rounded-xl border-amber-100 bg-amber-50 text-amber-700 text-[11px] font-black px-4 shadow-sm">
                               {kw}
                            </Badge>
                         )) : <p className="text-sm font-medium text-slate-400 italic">No critical gaps identified.</p>}
                      </div>
                   </div>
                </CardContent>
             </Card>

             <Card className="magic-card p-1">
                <div className="rounded-[1.95rem] bg-slate-50/50 p-8 space-y-6">
                   <div className="flex items-center gap-4">
                      <PremiumIcon icon={Zap} color="purple" />
                      <h3 className="text-lg font-black text-slate-900">Strategic Wins</h3>
                   </div>
                   <div className="space-y-4">
                      {visibleReport.quickWins?.map((win: string) => (
                         <div key={win} className="flex gap-4">
                            <div className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 text-[10px] font-black shadow-sm ring-1 ring-emerald-200">✓</div>
                            <p className="text-sm font-medium text-slate-600 leading-relaxed">{win}</p>
                         </div>
                      )) || <p className="text-sm font-medium text-slate-400 italic">Wins not calculated yet.</p>}
                   </div>
                </div>
             </Card>
          </div>

          {/* Right Column: Section Feedback & Recommendations */}
          <div className="space-y-8">
             <Card className="magic-card">
                <CardHeader className="p-8 pb-0">
                   <CardTitle className="text-xl font-black flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-teal-50 text-teal-600 border border-teal-100">
                         <LayoutIcon className="w-5 h-5" />
                      </div>
                      Section Performance
                   </CardTitle>
                </CardHeader>
                <CardContent className="p-8 space-y-4">
                   {visibleReport.sectionFeedback?.map((section: any) => (
                      <div key={section.section} className="rounded-3xl border border-slate-50 bg-slate-50/30 p-5 transition-all hover:bg-white hover:shadow-md hover:border-slate-100">
                         <div className="flex items-center justify-between gap-4 mb-2">
                            <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{section.section}</p>
                            <Badge className={cn(
                               "rounded-full px-3 py-0.5 text-[9px] font-black uppercase tracking-widest border shadow-sm",
                               section.status === "strong" ? "bg-emerald-50 text-emerald-700 border-emerald-100" : section.status === "needs-work" ? "bg-amber-50 text-amber-700 border-amber-100" : "bg-rose-50 text-rose-700 border-rose-100"
                            )}>
                               {section.status.replace("-", " ")}
                            </Badge>
                         </div>
                         <p className="text-xs font-medium text-slate-500 leading-relaxed mb-4">{section.summary}</p>
                         <div className="flex flex-wrap gap-2">
                            {section.fixes?.map((fix: string) => (
                               <div key={fix} className="bg-white/80 rounded-full px-3 py-1 border border-slate-100 text-[10px] font-bold text-slate-600 flex items-center gap-2">
                                  <div className="h-1 w-1 rounded-full bg-blue-400" /> {fix}
                               </div>
                            ))}
                         </div>
                      </div>
                   ))}
                </CardContent>
             </Card>

             <Card className="magic-card bg-brand-gradient-soft border-none p-1 shadow-2xl">
                <div className="rounded-[1.95rem] bg-white p-8 space-y-6">
                   <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                         <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-100 text-brand-purple shadow-sm">
                            <Target className="w-6 h-6" />
                         </div>
                         <h3 className="text-xl font-black text-slate-900">Priority Fixes</h3>
                      </div>
                      <span className="text-[10px] font-black px-3 py-1 bg-purple-50 text-brand-purple rounded-full tracking-[0.2em]">{visibleReport.recommendations?.length || 0} STEPS</span>
                   </div>
                   <div className="space-y-4">
                      {visibleReport.recommendations?.map((item: any, idx: number) => (
                         <div key={idx} className="group/fix flex items-start gap-5 p-4 rounded-2xl transition-all hover:bg-slate-50 border border-transparent hover:border-slate-100">
                            <div className={cn(
                               "mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-[12px] font-black shadow-sm",
                               item.priority === "high" ? "bg-rose-100 text-rose-600" : "bg-purple-100 text-brand-purple"
                            )}>
                               {idx + 1}
                            </div>
                            <div className="space-y-1">
                               <p className="text-base font-black text-slate-900 leading-tight group-hover/fix:text-brand-purple transition-colors">{item.title}</p>
                               <p className="text-xs font-medium text-slate-500 leading-relaxed">{item.description}</p>
                            </div>
                         </div>
                      ))}
                   </div>
                </div>
             </Card>
          </div>
       </div>
    </div>
  )
}
