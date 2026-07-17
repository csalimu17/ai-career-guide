"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, ClipboardList, Wand2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ChecklistItem {
  id: string;
  label: string;
  weight: number;
}

const DEFAULT_CHECKLIST: ChecklistItem[] = [
  { id: "single-col", label: "Single-column layout (no tables or columns)", weight: 20 },
  { id: "no-graphics", label: "No tables, icons, or progress bars", weight: 20 },
  { id: "metrics", label: "Achievements quantified with metrics", weight: 20 },
  { id: "standard-headers", label: "Standard section headers (e.g. Work Experience)", weight: 15 },
  { id: "file-format", label: "Format is strictly PDF or DOCX", weight: 15 },
  { id: "no-header-info", label: "Contact info is in the body, not header margins", weight: 10 },
];

export function BlogAtsWidget() {
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({
    "single-col": true,
    "file-format": true,
  });

  const toggleItem = (id: string) => {
    setCheckedItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const calculateScore = () => {
    return DEFAULT_CHECKLIST.reduce((acc, item) => {
      return acc + (checkedItems[item.id] ? item.weight : 0);
    }, 0);
  };

  const score = calculateScore();

  return (
    <div className="rounded-3xl border border-border/80 bg-white p-6 shadow-xl space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <ClipboardList className="h-5 w-5" />
        </div>
        <div>
          <h4 className="font-display font-bold text-slate-900 leading-tight">ATS Compliance Meter</h4>
          <p className="text-xs text-muted-foreground">Self-assess your resume layout score</p>
        </div>
      </div>

      {/* Score Circle Display */}
      <div className="flex flex-col items-center justify-center py-4 border-y border-border/40 space-y-3">
        <div className="relative flex items-center justify-center h-28 w-28">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            {/* Background Circle */}
            <circle
              className="text-slate-100"
              strokeWidth="8"
              stroke="currentColor"
              fill="transparent"
              r="40"
              cx="50"
              cy="50"
            />
            {/* Foreground Progress Circle */}
            <circle
              className={`${score >= 70 ? "text-emerald-500" : score >= 40 ? "text-amber-500" : "text-red-500"} transition-all duration-500`}
              strokeWidth="8"
              strokeDasharray={251.2}
              strokeDashoffset={251.2 - (251.2 * score) / 100}
              strokeLinecap="round"
              stroke="currentColor"
              fill="transparent"
              r="40"
              cx="50"
              cy="50"
            />
          </svg>
          <div className="absolute flex flex-col items-center justify-center">
            <span className="text-3xl font-black tracking-tight text-slate-800">{score}%</span>
            <span className="text-[0.62rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Score</span>
          </div>
        </div>

        {score >= 80 ? (
          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
            <Check className="h-3.5 w-3.5" /> Good Compliance
          </div>
        ) : (
          <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
            <ShieldAlert className="h-3.5 w-3.5" /> Needs Optimization
          </div>
        )}
      </div>

      {/* Checkbox List */}
      <div className="space-y-3">
        {DEFAULT_CHECKLIST.map((item) => {
          const isChecked = !!checkedItems[item.id];
          return (
            <button
              key={item.id}
              onClick={() => toggleItem(item.id)}
              className="flex items-start gap-3 w-full text-left group"
            >
              <div
                className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-all duration-200 ${
                  isChecked
                    ? "bg-primary border-primary text-white"
                    : "border-slate-300 bg-white group-hover:border-primary/50"
                }`}
              >
                {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
              </div>
              <span className={`text-xs leading-relaxed transition-colors ${isChecked ? "text-slate-800 font-medium" : "text-muted-foreground"}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* CTA Button */}
      <div className="space-y-3 pt-2">
        <Button className="w-full rounded-xl gap-2 font-bold py-5" asChild>
          <Link href="/signup">
            <Wand2 className="h-4 w-4" />
            Check Full Resume
          </Link>
        </Button>
        <p className="text-[0.65rem] text-center text-muted-foreground">
          Grade your real PDF with our advanced parser tool in seconds.
        </p>
      </div>
    </div>
  );
}
