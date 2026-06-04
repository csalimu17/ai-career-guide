"use client"

import { cn } from "@/lib/utils"

export const StatCard = ({ label, value, subvalue, icon: Icon, colorTheme }: { label: string, value: string | number, subvalue?: string, icon: any, colorTheme: "purple" | "teal" | "amber" | "blue" }) => {
  const themes = {
    purple: "bg-purple-50 text-brand-purple",
    teal: "bg-teal-50 text-brand-teal",
    amber: "bg-amber-50 text-amber-600",
    blue: "bg-blue-50 text-blue-600",
  };

  return (
    <div className="magic-card group p-6 transition-all hover:-translate-y-1 hover:shadow-lg">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1.5">{label}</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-black text-slate-900">{value}</span>
            {subvalue && <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{subvalue}</span>}
          </div>
        </div>
        <div className={cn("flex h-12 w-12 items-center justify-center rounded-2xl shadow-sm ring-1 ring-white/20 transition-transform duration-500 group-hover:scale-110", themes[colorTheme])}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
};
