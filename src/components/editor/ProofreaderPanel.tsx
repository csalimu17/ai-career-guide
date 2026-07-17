import React from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  SpellCheck2, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  Eye, 
  Trash2, 
  Sparkles, 
  Loader2 
} from "lucide-react"

interface ProofreaderPanelProps {
  resume: any
  isCheckingGrammarGlobal: boolean
  globalGrammarIssues: any[]
  hasScannedGrammar: boolean
  runGlobalGrammarCheck: () => Promise<void>
  applyGlobalGrammarFix: (issue: any, suggestion: string) => void
  dismissGlobalGrammarIssue: (issueId: string) => void
  onNavigateToSection: (sectionId: string) => void
}

export function ProofreaderPanel({
  resume,
  isCheckingGrammarGlobal,
  globalGrammarIssues,
  hasScannedGrammar,
  runGlobalGrammarCheck,
  applyGlobalGrammarFix,
  dismissGlobalGrammarIssue,
  onNavigateToSection,
}: ProofreaderPanelProps) {

  // Helper to map Firestore paths to editor sections
  const getSectionFromPath = (path: string): string => {
    if (path.includes("personal")) return "personal"
    if (path.includes("summary")) return "summary"
    if (path.includes("experience")) return "experience"
    if (path.includes("projects")) return "projects"
    if (path.includes("education")) return "education"
    return "personal"
  }

  // Group issues by target section label
  const groupedIssues = globalGrammarIssues.reduce((acc: Record<string, any[]>, issue) => {
    if (!acc[issue.label]) {
      acc[issue.label] = []
    }
    acc[issue.label].push(issue)
    return acc
  }, {})

  if (isCheckingGrammarGlobal) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-6 text-center space-y-6 animate-fade-in">
        <div className="relative">
          <div className="h-16 w-16 rounded-2xl bg-orange-100 flex items-center justify-center text-orange-600 animate-pulse">
            <SpellCheck2 className="h-8 w-8 animate-bounce" />
          </div>
          <div className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-orange-500"></span>
          </div>
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-black text-slate-900 flex items-center justify-center gap-2">
            Scanning CV Content...
          </h3>
          <p className="text-sm text-slate-500 font-semibold opacity-75 max-w-sm">
            We are analyzing your professional title, summary, work history, projects, and education for spelling & grammar errors.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-slate-50 px-4 py-2.5 rounded-full border border-slate-100">
          <Loader2 className="h-4 w-4 animate-spin text-orange-500" />
          <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">Running check...</span>
        </div>
      </div>
    )
  }

  if (!hasScannedGrammar) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6 text-center space-y-8 animate-fade-in">
        <div className="h-20 w-20 rounded-[2.5rem] bg-gradient-to-tr from-orange-500 to-amber-400 shadow-xl shadow-orange-500/20 flex items-center justify-center text-white">
          <SpellCheck2 className="h-10 w-10" />
        </div>
        <div className="space-y-3 max-w-sm">
          <h3 className="text-xl font-black text-slate-900">Grammar & Spell Checker</h3>
          <p className="text-sm text-slate-500 font-semibold opacity-75">
            Instantly proofread your entire CV. Check all sections for typos, stylistic blunders, and grammatical mistakes before sharing with hiring managers.
          </p>
        </div>
        
        <Button 
          onClick={runGlobalGrammarCheck}
          className="gap-2.5 rounded-2xl bg-slate-900 text-white hover:bg-slate-800 shadow-xl shadow-slate-950/10 px-8 py-6 font-black uppercase tracking-widest text-[11px]"
        >
          <Sparkles className="h-4 w-4 text-amber-400" />
          Scan Resume for Typos
        </Button>
      </div>
    )
  }

  if (globalGrammarIssues.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6 text-center space-y-8 animate-fade-in">
        <div className="h-20 w-20 rounded-[2.5rem] bg-gradient-to-tr from-emerald-500 to-teal-400 shadow-xl shadow-emerald-500/25 flex items-center justify-center text-white">
          <CheckCircle2 className="h-10 w-10" />
        </div>
        <div className="space-y-3 max-w-sm">
          <h3 className="text-xl font-black text-slate-900">Spotless CV!</h3>
          <p className="text-sm text-slate-500 font-semibold opacity-75">
            Excellent job! No spelling mistakes, typos, or grammatical errors detected in your resume fields.
          </p>
        </div>
        
        <Button 
          onClick={runGlobalGrammarCheck}
          variant="outline"
          className="gap-2.5 rounded-2xl border-slate-200 hover:bg-slate-50/50 shadow-sm px-6 py-5 font-black uppercase tracking-widest text-[10px] text-slate-700"
        >
          <SpellCheck2 className="h-3.5 w-3.5" />
          Re-scan CV
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full animate-fade-in">
      {/* Header Summary Card */}
      <div className="p-6 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-widest text-slate-400">Scan Results</span>
            <Badge variant="destructive" className="rounded-full px-2 py-0.5 text-[10px] font-black tracking-normal">
              {globalGrammarIssues.length} {globalGrammarIssues.length === 1 ? 'Issue' : 'Issues'}
            </Badge>
          </div>
          <h3 className="text-base font-black text-slate-900">Spelling & Grammar Review</h3>
        </div>
        <Button 
          onClick={runGlobalGrammarCheck}
          size="sm"
          className="rounded-xl bg-orange-500 hover:bg-orange-600 text-white shadow-md shadow-orange-500/10 font-black uppercase tracking-widest text-[10px] h-9"
        >
          Re-scan
        </Button>
      </div>

      {/* Scrollable Issue Cards */}
      <ScrollArea className="flex-1 p-6">
        <div className="space-y-8 pb-10">
          {Object.entries(groupedIssues).map(([sectionLabel, issues]) => (
            <div key={sectionLabel} className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-orange-500" />
                <h4 className="text-xs font-black uppercase tracking-widest text-slate-800 opacity-90">
                  {sectionLabel}
                </h4>
              </div>

              <div className="space-y-3">
                {issues.map((issue) => (
                  <Card 
                    key={issue.id} 
                    className="overflow-hidden border-slate-200/60 shadow-sm hover:shadow-md transition-all duration-300 rounded-3xl"
                  >
                    <div className="p-5 space-y-4">
                      {/* Typo Context details */}
                      <div className="space-y-2">
                        <div className="flex items-start gap-2.5">
                          <AlertCircle className="h-4.5 w-4.5 text-red-500 shrink-0 mt-0.5" />
                          <p className="text-sm font-semibold text-slate-800 leading-relaxed">
                            {issue.message}
                          </p>
                        </div>
                        
                        {/* Context snippet highlight */}
                        {issue.context && (
                          <div className="text-[12px] bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-slate-500 font-medium leading-relaxed italic">
                            &ldquo;
                            {issue.context.slice(0, issue.context.indexOf(issue.bad))}
                            <span className="text-red-600 font-bold bg-red-50 px-1 py-0.5 rounded border border-red-200/50 not-italic">
                              {issue.bad}
                            </span>
                            {issue.context.slice(issue.context.indexOf(issue.bad) + issue.bad.length)}
                            &rdquo;
                          </div>
                        )}
                      </div>

                      {/* Suggestions list */}
                      <div className="space-y-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                          Suggestions
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {issue.suggestions.map((suggestion: string, idx: number) => (
                            <button
                              key={idx}
                              onClick={() => applyGlobalGrammarFix(issue, suggestion)}
                              className="group flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-100 hover:border-emerald-200 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all"
                            >
                              <span className="text-emerald-500/80 group-hover:text-emerald-600">Apply:</span>
                              <span className="font-extrabold">{suggestion}</span>
                              <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 translate-x-[-4px] group-hover:translate-x-0 transition-all" />
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Action buttons footer */}
                      <div className="flex items-center justify-between border-t border-slate-100 pt-3 mt-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onNavigateToSection(getSectionFromPath(issue.targetPath))}
                          className="h-8 gap-1.5 px-3 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-50 text-[11px] font-bold"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Go to Section
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => dismissGlobalGrammarIssue(issue.id)}
                          className="h-8 gap-1.5 px-3 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 text-[11px] font-bold"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Dismiss
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
