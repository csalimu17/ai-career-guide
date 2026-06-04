"use client"

import { motion, AnimatePresence } from "framer-motion"
import { X, CheckCircle2, AlertCircle, Zap, Target, ArrowRight, BarChart3, Search, Lightbulb, ClipboardCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Progress } from "@/components/ui/progress"
import { Card } from "@/components/ui/card"
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts'

interface AtsReportOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  report: {
    headline: string;
    matchSummary: string;
    totalScore: number;
    atsScore: number;
    measurableImpactScore: number;
    categories: {
      keywordMatch: number;
      completeness: number;
      formatting: number;
      impact: number;
      readability: number;
      contactInfo: number;
    };
    missingKeywords: string[];
    matchedKeywords: string[];
    warnings: string[];
    strengths: string[];
    recommendations: { title: string; description: string; priority: 'high' | 'medium' | 'low' }[];
  } | null;
}

export function AtsReportOverlay({ isOpen, onClose, report }: AtsReportOverlayProps) {
  if (!report) return null;

  const radarData = [
    { subject: 'Keywords', A: report.categories.keywordMatch, fullMark: 100 },
    { subject: 'Structure', A: report.categories.completeness, fullMark: 100 },
    { subject: 'Format', A: report.categories.formatting, fullMark: 100 },
    { subject: 'Impact', A: report.categories.impact, fullMark: 100 },
    { subject: 'Clarity', A: report.categories.readability, fullMark: 100 },
    { subject: 'Contact', A: report.categories.contactInfo, fullMark: 100 },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
          />
          
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative flex h-full max-h-[900px] w-full max-w-5xl flex-col overflow-hidden rounded-[2rem] border border-white/20 bg-white shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-4 md:px-8">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-200">
                  <Target className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black tracking-tight text-slate-900">ATS Intelligence Report</h2>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Powered by Dan Cognitive Engine</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-slate-100">
                <X className="h-5 w-5 text-slate-500" />
              </Button>
            </div>

            <ScrollArea className="flex-1">
              <div className="space-y-8 p-6 md:p-10">
                
                {/* Score Hero */}
                <div className="grid gap-8 lg:grid-cols-12">
                  <div className="lg:col-span-5 flex flex-col items-center justify-center rounded-3xl bg-slate-900 p-8 text-white shadow-xl">
                    <div className="relative mb-6 flex h-40 w-40 items-center justify-center">
                       <svg className="h-full w-full -rotate-90 transform">
                         <circle
                           cx="80" cy="80" r="70"
                           className="stroke-slate-800 fill-none"
                           strokeWidth="12"
                         />
                         <motion.circle
                           cx="80" cy="80" r="70"
                           className="stroke-indigo-500 fill-none"
                           strokeWidth="12"
                           strokeDasharray={440}
                           initial={{ strokeDashoffset: 440 }}
                           animate={{ strokeDashoffset: 440 - (440 * report.totalScore) / 100 }}
                           transition={{ duration: 1.5, ease: "easeOut" }}
                           strokeLinecap="round"
                         />
                       </svg>
                       <div className="absolute inset-0 flex flex-col items-center justify-center">
                         <span className="text-5xl font-black">{report.totalScore}%</span>
                         <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Match Score</span>
                       </div>
                    </div>
                    <h3 className="text-center text-xl font-black tracking-tight">{report.headline}</h3>
                    <p className="mt-4 text-center text-sm leading-relaxed text-slate-400">{report.matchSummary}</p>
                  </div>

                  <div className="lg:col-span-7 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <Card className="border-none bg-slate-50 p-5 shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                            <CheckCircle2 className="h-4 w-4" />
                          </div>
                          <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">Measurable Impact</span>
                        </div>
                        <div className="mt-3 flex items-baseline gap-2">
                          <span className="text-3xl font-black text-slate-900">{report.measurableImpactScore}%</span>
                          <Progress value={report.measurableImpactScore} className="h-2 flex-1 bg-slate-200" />
                        </div>
                      </Card>
                      <Card className="border-none bg-slate-50 p-5 shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                            <BarChart3 className="h-4 w-4" />
                          </div>
                          <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">Technical Alignment</span>
                        </div>
                        <div className="mt-3 flex items-baseline gap-2">
                          <span className="text-3xl font-black text-slate-900">{report.categories.keywordMatch}%</span>
                          <Progress value={report.categories.keywordMatch} className="h-2 flex-1 bg-slate-200" />
                        </div>
                      </Card>
                    </div>

                    <div className="h-[260px] w-full rounded-3xl border border-slate-100 p-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                          <PolarGrid stroke="#e2e8f0" />
                          <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }} />
                          <Radar
                            name="Match"
                            dataKey="A"
                            stroke="#6366f1"
                            fill="#6366f1"
                            fillOpacity={0.5}
                          />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Keywords */}
                <div className="grid gap-8 lg:grid-cols-2">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-emerald-500" />
                      <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-900">Found Keywords</h4>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {report.matchedKeywords.map((k, i) => (
                        <Badge key={i} variant="outline" className="rounded-lg border-emerald-100 bg-emerald-50 py-1.5 px-3 text-emerald-700">
                          {k}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-rose-500" />
                      <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-900">Missing Keywords</h4>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {report.missingKeywords.map((k, i) => (
                        <Badge key={i} variant="outline" className="rounded-lg border-rose-100 bg-rose-50 py-1.5 px-3 text-rose-700">
                          {k}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Warnings & Strengths */}
                <div className="grid gap-6 md:grid-cols-2">
                   <div className="rounded-[1.5rem] bg-amber-50 p-6">
                     <div className="flex items-center gap-2 text-amber-800 mb-4">
                       <AlertCircle className="h-5 w-5" />
                       <h4 className="text-sm font-black uppercase tracking-wider">Critical Warnings</h4>
                     </div>
                     <ul className="space-y-3">
                       {report.warnings.map((w, i) => (
                         <li key={i} className="flex gap-3 text-sm font-medium text-amber-900/80">
                           <ArrowRight className="h-4 w-4 shrink-0 mt-0.5" />
                           {w}
                         </li>
                       ))}
                     </ul>
                   </div>
                   <div className="rounded-[1.5rem] bg-indigo-50 p-6">
                     <div className="flex items-center gap-2 text-indigo-800 mb-4">
                       <Zap className="h-5 w-5" />
                       <h4 className="text-sm font-black uppercase tracking-wider">Key Strengths</h4>
                     </div>
                     <ul className="space-y-3">
                       {report.strengths.map((s, i) => (
                         <li key={i} className="flex gap-3 text-sm font-medium text-indigo-900/80">
                           <ArrowRight className="h-4 w-4 shrink-0 mt-0.5" />
                           {s}
                         </li>
                       ))}
                     </ul>
                   </div>
                </div>

                {/* Recommendations */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ClipboardCheck className="h-6 w-6 text-indigo-600" />
                      <h4 className="text-[14px] font-black uppercase tracking-[0.2em] text-slate-900">Actionable Roadmap</h4>
                    </div>
                    <Badge className="bg-slate-900 text-white font-black uppercase tracking-widest text-[9px] py-1 px-3">
                      {report.recommendations.length} Suggestions
                    </Badge>
                  </div>
                  <div className="grid gap-4 md:grid-cols-3">
                    {report.recommendations.map((rec, i) => (
                      <Card key={i} className="relative overflow-hidden border-slate-100 p-5 transition-all hover:shadow-md">
                        <div className={cn(
                          "absolute top-0 right-0 h-1 w-12",
                          rec.priority === 'high' ? 'bg-rose-500' : rec.priority === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'
                        )} />
                        <div className="mb-3 flex items-center justify-between">
                           <span className={cn(
                             "text-[9px] font-black uppercase tracking-widest",
                             rec.priority === 'high' ? 'text-rose-600' : rec.priority === 'medium' ? 'text-amber-600' : 'text-emerald-600'
                           )}>
                             {rec.priority} Priority
                           </span>
                           <Lightbulb className="h-4 w-4 text-slate-300" />
                        </div>
                        <h5 className="mb-2 font-black text-slate-900 leading-tight">{rec.title}</h5>
                        <p className="text-xs font-medium leading-relaxed text-slate-500">{rec.description}</p>
                      </Card>
                    ))}
                  </div>
                </div>

              </div>
            </ScrollArea>
            
            <div className="border-t border-slate-100 bg-slate-50 p-6 flex justify-end">
               <Button onClick={onClose} className="rounded-full bg-slate-900 px-8 py-6 text-[11px] font-black uppercase tracking-[0.2em] hover:bg-slate-800">
                 Acknowledge & Close
               </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ')
}
