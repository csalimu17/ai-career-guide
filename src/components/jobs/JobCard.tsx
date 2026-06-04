import React from "react"
import { motion } from "framer-motion"
import { JobListingRecord, JOB_SOURCE_CONFIG } from "@/lib/jobs/model"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Building2, MapPin, Zap, ChevronRight, Bookmark, ArrowUpRight } from "lucide-react"

interface JobCardProps {
  job: JobListingRecord
  isActive: boolean
  onSelect: () => void
  isSaved?: boolean
}

export function JobCard({ job, isActive, onSelect, isSaved }: JobCardProps) {
  const source = JOB_SOURCE_CONFIG[job.source]
  
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -5 }}
      transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
      className="group relative w-full h-full"
    >
      <div
        onClick={onSelect}
        className={cn(
          "relative h-full flex flex-col cursor-pointer overflow-hidden rounded-[2.5rem] border p-7 text-left transition-all duration-500",
          isActive
            ? "border-blue-500 bg-white shadow-[0_40px_80px_-20px_rgba(37,99,235,0.2)] ring-1 ring-blue-500/20"
            : "border-slate-50 bg-white/80 backdrop-blur-xl shadow-[0_20px_50px_-30px_rgba(15,23,42,0.1)] hover:border-blue-200 hover:shadow-[0_40px_80px_-40px_rgba(15,23,42,0.15)] hover:bg-white"
        )}
      >
        {/* Animated Mesh Gradient Accent */}
        <div className={cn(
          "absolute -top-12 -right-12 w-48 h-48 blur-[80px] rounded-full transition-all duration-700 opacity-0 group-hover:opacity-30",
          job.source === "adzuna" ? "bg-blue-400" : "bg-indigo-400"
        )} />
        <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
           <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
        </div>

        <div className="relative z-10 flex flex-col h-full space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex flex-wrap gap-2">
              <Badge
                variant="secondary"
                className={cn(
                  "h-6 rounded-lg border px-2.5 py-0 text-[10px] font-black uppercase tracking-[0.15em] transition-colors",
                  source.badgeClassName
                )}
              >
                {source.shortLabel}
              </Badge>
              {isSaved && (
                <div className="flex items-center gap-1.5 text-[10px] font-black text-amber-600 bg-amber-50 px-2.5 py-0 h-6 rounded-lg border border-amber-100 uppercase tracking-widest">
                  <Bookmark className="w-3 h-3 fill-current" />
                  Saved
                </div>
              )}
            </div>
            
            <div className={cn(
              "shrink-0 flex h-9 w-9 items-center justify-center rounded-2xl transition-all duration-300",
              isActive ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30" : "bg-slate-50 text-slate-300 group-hover:bg-blue-50 group-hover:text-blue-500"
            )}>
              <ArrowUpRight className="w-5 h-5" />
            </div>
          </div>

          <div className="space-y-2 flex-1">
            <h3 className={cn(
              "text-lg font-black leading-tight tracking-tight lg:text-xl",
              isActive ? "text-blue-950" : "text-slate-900"
            )}>
              {job.role}
            </h3>
            
            <div className="flex flex-wrap items-center gap-y-2 gap-x-4">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-500">
                <Building2 className="w-4 h-4 text-blue-500/70" />
                <span className="truncate max-w-[150px]">{job.company}</span>
              </div>
              <div className="flex items-center gap-2 text-sm font-bold text-slate-500">
                <MapPin className="w-4 h-4 text-orange-500/70" />
                <span className="truncate max-w-[120px]">{job.location}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-slate-50 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2.5">
              {job.workplaceType === "remote" && (
                <div className="flex items-center gap-2 text-[10px] font-black text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-full border border-emerald-100 uppercase tracking-widest">
                  <Zap className="w-3 h-3 fill-current" />
                  Remote
                </div>
              )}
              {job.workplaceType === "hybrid" && (
                <div className="flex items-center gap-2 text-[10px] font-black text-indigo-700 bg-indigo-50 px-2.5 py-1.5 rounded-full border border-indigo-100 uppercase tracking-widest">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                  Hybrid
                </div>
              )}
              <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400 sm:tracking-[0.2em]">
                {job.postedLabel}
              </span>
            </div>
            
            {job.salarySummary && (
              <span className="w-fit text-xs font-black text-slate-900 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-xl">
                {job.salarySummary}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
