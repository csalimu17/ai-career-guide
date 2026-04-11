import React from "react"
import { JobListingRecord, JOB_SOURCE_CONFIG } from "@/lib/jobs/model"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Building2, MapPin, Zap, ChevronRight, Bookmark } from "lucide-react"

interface JobCardProps {
  job: JobListingRecord
  isActive: boolean
  onSelect: () => void
  isSaved?: boolean
}

export function JobCard({ job, isActive, onSelect, isSaved }: JobCardProps) {
  const source = JOB_SOURCE_CONFIG[job.source]
  
  return (
    <button
      type="button"
      onClick={onSelect}
      className="group relative w-full cursor-pointer text-left"
    >
      <div
        className={cn(
          "relative overflow-hidden rounded-[1.5rem] border p-4 text-left transition-all duration-300 ease-out lg:p-5",
          "hover:border-blue-200 hover:shadow-xl hover:shadow-blue-500/5 hover:-translate-y-0.5",
          isActive
            ? "border-blue-500 bg-blue-50/50 shadow-lg shadow-blue-500/10 ring-1 ring-blue-500/10"
            : "border-slate-100 bg-white shadow-sm"
        )}
      >
        <div className={cn("absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-orange-400", isActive ? "opacity-100" : "opacity-60")} />

        {/* Active Indicator Bar */}
        {isActive && (
          <div className="absolute left-0 top-1/2 -translate-y-1/2 h-10 w-1 rounded-r-full bg-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.4)]" />
        )}

        <div className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 space-y-1">
              <div className="mb-1 flex items-center gap-2">
                <Badge
                  variant="secondary"
                  className={cn(
                    "h-5 rounded-lg border px-2 py-0 text-[10px] font-black uppercase tracking-wider transition-colors",
                    source.badgeClassName
                  )}
                >
                  {source.shortLabel}
                </Badge>
                {isSaved && (
                  <div className="flex items-center gap-1 text-[10px] font-black text-amber-600 bg-amber-50 px-2 py-0 h-5 rounded-lg border border-amber-100 uppercase tracking-wider">
                    <Bookmark className="w-2.5 h-2.5 fill-current" />
                    Saved
                  </div>
                )}
              </div>
              <h3
                className={cn(
                  "text-[1.02rem] font-black leading-tight tracking-tight decoration-blue-500/30 underline-offset-4 group-hover:underline lg:text-lg line-clamp-2",
                  isActive ? "text-blue-900" : "text-slate-900"
                )}
              >
                {job.role}
              </h3>
            </div>

            <div className="shrink-0 flex h-8 w-8 items-center justify-center rounded-xl border border-slate-100 bg-slate-50 opacity-0 transition-all duration-300 group-hover:opacity-100">
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1.5 rounded-xl border border-slate-100/50 bg-slate-50 px-2.5 py-1.5 text-xs font-bold text-slate-500">
              <Building2 className="w-3.5 h-3.5 text-blue-500" />
              <span className="truncate max-w-[120px]">{job.company}</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-xl border border-slate-100/50 bg-slate-50 px-2.5 py-1.5 text-xs font-bold text-slate-500">
              <MapPin className="w-3.5 h-3.5 text-orange-500" />
              <span className="truncate max-w-[100px]">{job.location}</span>
            </div>
            {job.workplaceType === "remote" && (
              <div className="flex items-center gap-1.5 text-xs font-black text-green-700 bg-green-50 px-2.5 py-1.5 rounded-xl border border-green-100/50 uppercase tracking-widest">
                <Zap className="w-3.5 h-3.5 fill-current" />
                Remote
              </div>
            )}
          </div>

          <div className="flex items-center justify-between border-t border-slate-50 pt-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              {job.postedLabel}
            </span>
            <div className="flex items-center gap-2">
              {job.salarySummary && (
                <span className="text-[11px] font-black text-blue-600 bg-blue-50/80 px-2 py-1 rounded-lg">
                  {job.salarySummary}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-white shadow-sm transition-transform duration-300 group-hover:translate-x-0.5">
                Open details
                <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        </div>
      </div>
    </button>
  )
}
