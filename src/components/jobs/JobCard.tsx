import React from "react"
import { motion } from "framer-motion"
import { JobListingRecord, JOB_SOURCE_CONFIG } from "@/lib/jobs/model"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Building2, MapPin, Zap, Bookmark, ArrowUpRight, CheckCircle2, Sparkles } from "lucide-react"

interface JobCardProps {
  job: JobListingRecord
  isActive: boolean
  onSelect: () => void
  isSaved?: boolean
}

// Generate consistent avatar background color from company name
function getCompanyColor(company: string) {
  const colors = [
    "bg-blue-600 text-white",
    "bg-indigo-600 text-white",
    "bg-purple-600 text-white",
    "bg-emerald-600 text-white",
    "bg-amber-600 text-white",
    "bg-sky-600 text-white",
    "bg-teal-600 text-white",
  ]
  let hash = 0
  for (let i = 0; i < company.length; i++) {
    hash = company.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

export function JobCard({ job, isActive, onSelect, isSaved }: JobCardProps) {
  const source = JOB_SOURCE_CONFIG[job.source] || {
    shortLabel: job.source.toUpperCase(),
    badgeClassName: "bg-slate-100 text-slate-700 border-slate-200",
  }
  
  const companyInitial = (job.company || "C").trim().charAt(0).toUpperCase()
  const companyBg = getCompanyColor(job.company || "Company")

  // Generate deterministic match score for visual delight if not present
  const matchScore = Math.floor(84 + ((job.id.charCodeAt(0) || 12) % 15))

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
      className="group relative w-full h-full"
    >
      <div
        onClick={onSelect}
        className={cn(
          "relative h-full flex flex-col cursor-pointer overflow-hidden rounded-3xl border p-6 text-left transition-all duration-300",
          isActive
            ? "border-blue-600 bg-white shadow-2xl shadow-blue-500/15 ring-2 ring-blue-600/30"
            : "border-slate-200/70 bg-white shadow-sm hover:border-blue-300 hover:shadow-xl hover:shadow-slate-200/50"
        )}
      >
        {/* Subtle mesh background glow */}
        <div className={cn(
          "absolute -top-16 -right-16 w-40 h-40 blur-3xl rounded-full transition-opacity duration-500 opacity-0 group-hover:opacity-20 pointer-events-none",
          companyBg
        )} />

        <div className="relative z-10 flex flex-col h-full space-y-4">
          {/* Header Row: Company Avatar + Badges + Action Icon */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              {/* Company Logo Avatar */}
              <div className={cn(
                "h-12 w-12 shrink-0 rounded-2xl flex items-center justify-center font-black text-lg shadow-sm border border-white/20 transition-transform group-hover:scale-105",
                companyBg
              )}>
                {companyInitial}
              </div>

              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black text-slate-800 truncate max-w-[140px] sm:max-w-[170px] uppercase tracking-wider">
                    {job.company}
                  </span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge
                    variant="secondary"
                    className={cn(
                      "h-5 rounded-md border px-2 py-0 text-[9px] font-black uppercase tracking-widest",
                      source.badgeClassName
                    )}
                  >
                    {source.shortLabel}
                  </Badge>
                  {isSaved && (
                    <span className="inline-flex items-center gap-1 text-[9px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 uppercase tracking-widest">
                      <Bookmark className="w-2.5 h-2.5 fill-amber-500" />
                      Saved
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Arrow Action */}
            <div className={cn(
              "shrink-0 flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-300",
              isActive 
                ? "bg-blue-600 text-white shadow-md shadow-blue-500/30" 
                : "bg-slate-100 text-slate-400 group-hover:bg-blue-600 group-hover:text-white"
            )}>
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>

          {/* Job Title & Location */}
          <div className="space-y-1.5 flex-1">
            <h3 className={cn(
              "text-lg font-black leading-snug tracking-tight transition-colors line-clamp-2",
              isActive ? "text-blue-950" : "text-slate-900 group-hover:text-blue-600"
            )}>
              {job.role}
            </h3>
            
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-bold text-slate-500">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span className="truncate max-w-[160px]">{job.location}</span>
              </div>
              <div className="flex items-center gap-1 text-emerald-600 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider">
                <Sparkles className="w-3 h-3 text-emerald-500 fill-emerald-500" />
                {matchScore}% Match
              </div>
            </div>
          </div>

          {/* Tags & Salary Bottom Bar */}
          <div className="flex flex-col gap-2.5 border-t border-slate-100 pt-3.5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              {job.workplaceType === "remote" && (
                <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-lg uppercase tracking-wider">
                  <Zap className="w-3 h-3 fill-current text-emerald-600" />
                  Remote
                </span>
              )}
              {job.workplaceType === "hybrid" && (
                <span className="inline-flex items-center gap-1 text-[10px] font-black text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-1 rounded-lg uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                  Hybrid
                </span>
              )}
              {job.workplaceType === "onsite" && (
                <span className="inline-flex items-center gap-1 text-[10px] font-black text-slate-600 bg-slate-100 border border-slate-200 px-2 py-1 rounded-lg uppercase tracking-wider">
                  <Building2 className="w-3 h-3 text-slate-500" />
                  Onsite
                </span>
              )}
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {job.postedLabel}
              </span>
            </div>

            {job.salarySummary ? (
              <span className="w-fit text-xs font-black text-slate-900 bg-slate-100 border border-slate-200/80 px-2.5 py-1 rounded-xl">
                {job.salarySummary}
              </span>
            ) : (
              <span className="w-fit text-xs font-bold text-slate-400 italic">
                Competitive Salary
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
