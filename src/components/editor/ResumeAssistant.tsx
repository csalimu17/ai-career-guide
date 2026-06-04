"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  Search, 
  TrendingUp,
  Target,
  Zap,
  Briefcase
} from "lucide-react"

interface ResumeAssistantProps {
  resume: any
}

export function ResumeAssistant({ resume }: ResumeAssistantProps) {
  // Mock analysis logic
  const score = 84
  const checks = [
    { title: "Contact Information", status: "pass", detail: "All required fields present" },
    { title: "Action Verbs", status: "pass", detail: "Strong vocabulary usage detected" },
    { title: "Quantified Impact", status: "warning", detail: "Adding more numbers could improve reach" },
    { title: "ATS Keywords", status: "pass", detail: "Relevant technical terms found" }
  ]

  return (
    <div className="space-y-8 py-4">
      <div className="grid grid-cols-2 gap-6">
        <Card className="p-6 border-slate-100 bg-white/50 backdrop-blur shadow-sm overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <Zap className="h-24 w-24 text-primary" />
          </div>
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">Content Intelligence</h3>
          <div className="flex items-end gap-3">
             <span className="text-5xl font-black tracking-tighter text-slate-950">{score}</span>
             <span className="text-sm font-bold text-slate-400 mb-1.5 uppercase">Score</span>
          </div>
          <Progress value={score} className="h-1.5 mt-6 bg-slate-100" />
          <p className="mt-4 text-[11px] font-medium text-slate-500 leading-relaxed">
            Your resume is in the <span className="text-emerald-500 font-bold italic">Top 15%</span> of candidates for this role category.
          </p>
        </Card>

        <Card className="p-6 border-slate-100 bg-white/50 backdrop-blur shadow-sm">
           <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6">Market Alignment</h3>
           <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-primary" />
                  <span className="text-xs font-bold text-slate-700">Role Relevance</span>
                </div>
                <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 uppercase text-[9px] font-black">High</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <span className="text-xs font-bold text-slate-700">Growth Potential</span>
                </div>
                <Badge className="bg-blue-50 text-blue-600 border-blue-100 uppercase text-[9px] font-black">Medium</Badge>
              </div>
           </div>
        </Card>
      </div>

      <div className="space-y-3">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 pl-1">Critical Checks</h3>
        <div className="grid grid-cols-1 gap-3">
          {checks.map((check, i) => (
            <div key={i} className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 bg-white shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "h-8 w-8 rounded-full flex items-center justify-center",
                  check.status === "pass" ? "bg-emerald-50 text-emerald-500" : "bg-orange-50 text-orange-500"
                )}>
                  {check.status === "pass" ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">{check.title}</p>
                  <p className="text-[10px] text-slate-500">{check.detail}</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="text-[10px] font-bold uppercase tracking-widest text-primary">
                View
              </Button>
            </div>
          ))}
        </div>
      </div>

      <Card className="p-8 border-none bg-slate-950 text-white overflow-hidden relative group cursor-pointer shadow-2xl shadow-slate-950/20">
        <div className="absolute top-0 right-0 -mr-8 -mt-8 h-48 w-48 bg-primary/20 rounded-full blur-3xl opacity-50 transition-opacity group-hover:opacity-100" />
        <div className="relative z-10">
          <Badge className="mb-4 bg-white/10 text-white border-white/20 uppercase text-[9px] font-black">AI Recommendation</Badge>
          <h4 className="text-xl font-black tracking-tight mb-3">Optimize for Fortune 500 ATS</h4>
          <p className="text-sm text-slate-400 leading-relaxed mb-6">
            Our analysis suggests your resume might struggle with legacy ATS systems used by larger firms. Would you like us to generate an ATS-optimized variant while preserving your brand?
          </p>
          <Button className="w-full bg-white text-slate-950 font-black hover:bg-slate-100 h-12 rounded-xl">
             Generate Optimized Version
          </Button>
        </div>
      </Card>
    </div>
  )
}

