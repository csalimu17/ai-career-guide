"use client"

import { cn } from "@/lib/utils"

export const PremiumIcon = ({ icon: Icon, color = "purple" }: { icon: any; color?: "purple" | "teal" | "slate" | "amber" | "emerald" | "magenta" | "blue" }) => {
  const themes = {
    purple: "from-purple-50 to-purple-100/40 text-brand-purple ring-brand-purple/20",
    teal: "from-teal-50 to-teal-100/40 text-brand-teal ring-brand-teal/20",
    slate: "from-slate-50 to-slate-100/40 text-slate-900 ring-slate-200/30",
    amber: "from-amber-50 to-amber-100/40 text-amber-600 ring-amber-200/30",
    emerald: "from-emerald-50 to-emerald-100/40 text-emerald-600 ring-amber-200/30",
    magenta: "from-fuchsia-50 to-fuchsia-100/40 text-brand-magenta ring-brand-magenta/20",
    blue: "from-blue-50 to-blue-100/40 text-blue-600 ring-blue-200/20",
  };

  return (
    <div className="relative group/icon shrink-0">
      <div className={cn(
        "flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr shadow-sm ring-1 transition-all duration-500 group-hover/icon:scale-105 group-hover/icon:shadow-md",
        themes[color]
      )}>
        <Icon className="h-6 w-6" strokeWidth={2.2} />
      </div>
    </div>
  );
};
