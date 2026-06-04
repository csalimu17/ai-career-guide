"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Shield, Sparkles, Zap, ArrowRight, Loader2, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { generateGuardianInsightsAction, revealGuardianInsightAction } from "@/app/actions/guardian-actions"
import { useUser } from "@/firebase"
import { toast } from "@/hooks/use-toast"

export function GuardianIntelligence() {
  const { user } = useUser()
  const [insights, setInsights] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [revealingId, setRevealingId] = React.useState<string | null>(null)

  const fetchInsights = React.useCallback(async () => {
    if (!user) return
    try {
      const res = await generateGuardianInsightsAction(user.uid)
      setInsights(res.insights || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [user])

  React.useEffect(() => {
    fetchInsights()
  }, [fetchInsights])

  const handleReveal = async (insight: any) => {
    if (!user) return
    setRevealingId(insight.id)
    try {
      if (insight.type === "followup_reminder") {
        // Mock drafting logic
        toast({
          title: "Dan is Drafting...",
          description: `I've prepared a follow-up draft for ${insight.company}. You can find it in your Tracker.`,
        })
      } else {
        const result = (await revealGuardianInsightAction(user.uid, insight.jobId)) as any
        if (!result.success) throw new Error(result.error)
        
        toast({
          title: "Guardian Insight Revealed",
          description: `Dan found a ${result.atsScore}% match for ${insight.company}. View details in the ATS center.`,
        })
      }
      // Refresh insights (it will be gone since it now has a report)
      fetchInsights()
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Guardian Error",
        description: "Failed to reveal insight.",
      })
    } finally {
      setRevealingId(null)
    }
  }

  if (loading && insights.length === 0) return null

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-500 text-white">
            <Shield className="h-3.5 w-3.5" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Guardian Feed</span>
        </div>
        {insights.length > 0 && (
          <Badge variant="outline" className="h-5 rounded-full border-indigo-100 bg-indigo-50/50 px-2 text-[9px] font-black text-indigo-600">
            {insights.length} ACTIVE
          </Badge>
        )}
      </div>

      <AnimatePresence mode="popLayout">
        {insights.length > 0 ? (
          insights.map((insight) => (
            <motion.div
              key={insight.id}
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="group relative overflow-hidden rounded-3xl border border-indigo-100 bg-white p-5 shadow-sm transition-all hover:border-indigo-200 hover:shadow-md"
            >
              <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-indigo-500/5 blur-2xl group-hover:bg-indigo-500/10" />
              
              <div className="relative space-y-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500">Proactive Match</p>
                    <h4 className="font-black text-slate-900">{insight.role}</h4>
                    <p className="text-[10px] font-bold text-slate-400">{insight.company}</p>
                  </div>
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-50 text-slate-400">
                    <Sparkles className="h-4 w-4" />
                  </div>
                </div>

                <p className="text-xs font-medium leading-relaxed text-slate-600">
                  {insight.preview}
                </p>

                <Button
                  onClick={() => handleReveal(insight)}
                  disabled={!!revealingId}
                  className="h-9 w-full rounded-xl bg-indigo-600 text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-indigo-200 transition-all hover:bg-indigo-700 disabled:opacity-50"
                >
                  {revealingId === insight.id ? (
                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                  ) : (
                    <Zap className="mr-2 h-3 w-3 fill-white" />
                  )}
                  {revealingId === insight.id ? "Analyzing Deeply..." : insight.actionLabel}
                </Button>
              </div>
            </motion.div>
          ))
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-100 bg-slate-50/50 p-8 text-center"
          >
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm">
              <CheckCircle2 className="h-5 w-5 text-slate-300" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Guardian Silent</p>
            <p className="mt-1 text-[10px] font-medium text-slate-400 italic">No fresh roles needing proactive analysis.</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
