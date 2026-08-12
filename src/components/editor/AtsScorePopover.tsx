"use client"

import React from "react"
import { CheckCircle2, AlertCircle, Sparkles, Target, Zap, ChevronRight } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"

interface AtsScorePopoverProps {
  resume: any
  onNavigateToSection?: (sectionId: string) => void
}

const ACTION_VERBS = ["lead", "led", "manage", "managed", "develop", "developed", "create", "created", "build", "built", "spearhead", "spearheaded", "design", "designed", "increase", "increased", "reduce", "reduced", "optimize", "optimized", "scale", "scaled", "launch", "launched"]

export function calculateAtsScore(resume: any) {
  if (!resume?.content) return { totalScore: 0, checks: [] }

  const c = resume.content
  const personal = c.personal || {}
  const summary = c.summary || ""
  const experience = Array.isArray(c.experience) ? c.experience : []
  const skills = Array.isArray(c.skills) ? c.skills : []
  const education = Array.isArray(c.education) ? c.education : []

  const checks = [
    {
      id: "personal",
      label: "Contact Information",
      points: 20,
      passed: Boolean(personal.name && (personal.email || personal.phone)),
      hint: personal.name && (personal.email || personal.phone) ? "Name and contact info present" : "Add full name and phone/email",
      sectionId: "personal",
    },
    {
      id: "summary",
      label: "Professional Summary",
      points: 15,
      passed: typeof summary === "string" && summary.trim().length >= 40,
      hint: summary.trim().length >= 40 ? "Strong profile summary" : "Add a summary of at least 40 characters",
      sectionId: "summary",
    },
    {
      id: "experience",
      label: "Work Experience",
      points: 25,
      passed: experience.length > 0 && experience.some((e: any) => e.title || e.company),
      hint: experience.length > 0 ? `${experience.length} position(s) added` : "Add at least one work experience entry",
      sectionId: "experience",
    },
    {
      id: "skills",
      label: "Core Skills",
      points: 20,
      passed: skills.length >= 4,
      hint: skills.length >= 4 ? `${skills.length} skills listed` : `Add ${Math.max(0, 4 - skills.length)} more skills`,
      sectionId: "skills",
    },
    {
      id: "education",
      label: "Education",
      points: 10,
      passed: education.length > 0,
      hint: education.length > 0 ? "Education listed" : "Add degree or certifications",
      sectionId: "education",
    },
    {
      id: "actionVerbs",
      label: "Impact & Action Verbs",
      points: 10,
      passed: experience.some((e: any) => {
        const text = `${e.description || ""} ${Array.isArray(e.bullets) ? e.bullets.join(" ") : ""}`.toLowerCase()
        return ACTION_VERBS.some(verb => text.includes(verb))
      }),
      hint: "Use strong action verbs like 'Spearheaded', 'Optimized', 'Scaled'",
      sectionId: "experience",
    },
  ]

  const totalScore = checks.reduce((acc, curr) => acc + (curr.passed ? curr.points : 0), 0)

  return { totalScore, checks }
}

export function AtsScorePopover({ resume, onNavigateToSection }: AtsScorePopoverProps) {
  const { totalScore, checks } = calculateAtsScore(resume)

  const getScoreColor = (score: number) => {
    if (score >= 85) return "text-emerald-600 bg-emerald-50 border-emerald-200 hover:bg-emerald-100/80"
    if (score >= 60) return "text-amber-600 bg-amber-50 border-amber-200 hover:bg-amber-100/80"
    return "text-indigo-600 bg-indigo-50 border-indigo-200 hover:bg-indigo-100/80"
  }

  const getBadgeText = (score: number) => {
    if (score >= 85) return "Excellent"
    if (score >= 60) return "Good Progress"
    return "Needs Optimization"
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-black transition-all hover:scale-[1.02] active:scale-95 shadow-xs cursor-pointer ${getScoreColor(totalScore)}`}
          title="View ATS Readiness Score"
        >
          <Target className="h-3.5 w-3.5" />
          <span>{totalScore}% ATS Score</span>
          <Badge className="ml-0.5 rounded-md px-1.5 py-0 text-[8px] font-black uppercase border-none bg-white/60 text-slate-800">
            {getBadgeText(totalScore)}
          </Badge>
        </button>
      </PopoverTrigger>

      <PopoverContent className="w-80 p-5 rounded-3xl border-slate-200 shadow-2xl bg-white/95 backdrop-blur-xl space-y-4" align="start">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-xs">
              <Zap className="h-4 w-4 text-amber-400 fill-amber-400" />
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-900">ATS Optimization</h4>
              <p className="text-[10px] text-slate-500 font-medium">Real-time parser compatibility</p>
            </div>
          </div>
          <span className="text-xl font-black text-slate-900">{totalScore}%</span>
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between text-[11px] font-bold text-slate-600">
            <span>Overall Readiness</span>
            <span>{totalScore}/100</span>
          </div>
          <Progress value={totalScore} className="h-2 rounded-full bg-slate-100" />
        </div>

        <div className="space-y-2 pt-1">
          <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Optimization Checklist</p>
          <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
            {checks.map((check) => (
              <div
                key={check.id}
                onClick={() => onNavigateToSection && onNavigateToSection(check.sectionId)}
                className={`flex items-start justify-between p-2.5 rounded-2xl border transition-all cursor-pointer ${
                  check.passed
                    ? "bg-slate-50/50 border-slate-100 hover:bg-slate-100/60"
                    : "bg-amber-50/40 border-amber-100 hover:bg-amber-50"
                }`}
              >
                <div className="flex items-start gap-2.5">
                  {check.passed ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p className="text-[11px] font-bold text-slate-800">{check.label}</p>
                    <p className="text-[10px] text-slate-500 font-medium">{check.hint}</p>
                  </div>
                </div>
                <ChevronRight className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-1 opacity-60" />
              </div>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
