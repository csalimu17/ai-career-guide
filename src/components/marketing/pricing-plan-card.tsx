"use client";

import Link from "next/link";
import { CheckCircle2, Sparkles } from "lucide-react";
import type { Plan as BillingPlan } from "@/lib/plans";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useUser } from "@/firebase";

type PricingPlanCardProps = {
  plan: BillingPlan;
  compact?: boolean;
};

export function PricingPlanCard({ plan, compact = false }: PricingPlanCardProps) {
  const { user } = useUser();

  const getTargetHref = () => {
    if (plan.id === "free") {
      return user ? "/cv-editor?new=true" : "/signup?intent=create-cv";
    }
    if (plan.id === "agency") {
      return "/support?topic=agency-pricing";
    }
    // For paid plans (pro / master)
    if (user && user.email && !user.isAnonymous) {
      return `/settings?plan=${plan.id}&checkout=1`;
    }
    return `/signup?plan=${plan.id}`;
  };

  return (
    <div
      className={cn(
        "group surface-card relative flex h-full flex-col overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg",
        plan.highlight &&
          "border-primary/25 bg-[radial-gradient(ellipse_at_top_right,rgba(110,88,255,0.08),transparent_50%),linear-gradient(180deg,rgba(244,246,255,0.98),rgba(238,240,255,0.96))] shadow-[0_30px_80px_-46px_rgba(85,60,255,0.22)]"
      )}
    >
      {plan.highlight && (
        <div className="absolute right-4 top-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-white/80 px-2.5 py-1 text-[0.62rem] font-bold uppercase tracking-[0.2em] text-primary sm:right-5 sm:top-5 sm:px-3 sm:text-[0.68rem] sm:tracking-[0.22em] shadow-sm">
          <Sparkles className="h-3.5 w-3.5 text-accent animate-pulse" />
          Most popular
        </div>
      )}

      <div className={cn("space-y-4 p-6 sm:p-8", compact && "p-6")}>
        <div className="space-y-2">
          <h3 className={cn("font-display text-xl sm:text-2xl font-semibold text-slate-950", plan.highlight && "text-primary")}>{plan.name}</h3>
          <p className={cn("text-sm leading-relaxed text-slate-600", plan.highlight && "text-slate-600/90")}>
            {plan.id === "free"
              ? "Start building and validating your first CV at no cost."
              : plan.id === "pro"
              ? "Ideal for active job seekers who want stronger tailoring and more ATS coverage."
              : plan.id === "master"
              ? "For power users who want the fullest workflow, fastest iteration, and premium support."
              : "For recruitment agencies, universities, and professional CV writing teams."}
          </p>
        </div>
        <div className="flex items-end gap-2">
          <span className="font-display text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">{plan.price}</span>
          {plan.price !== "Custom" && (
            <span className={cn("pb-2 text-sm text-slate-500", plan.highlight && "text-slate-500/90")}>/ month</span>
          )}
        </div>
      </div>

      <div className={cn("flex-1 space-y-4 p-6 pt-0 sm:p-8 sm:pt-0", compact && "p-6 pt-0")}>
        {plan.features.map((feature) => (
          <div key={feature} className="flex items-start gap-3">
            <CheckCircle2 className={cn("mt-0.5 h-4 w-4 shrink-0 text-teal-600", plan.highlight && "text-primary")} />
            <span className={cn("text-sm leading-relaxed text-slate-700", plan.highlight && "text-slate-800")}>{feature}</span>
          </div>
        ))}
      </div>

      <div className={cn("p-6 pt-0 sm:p-8 sm:pt-0", compact && "p-6 pt-0")}>
        <Button
          variant={plan.highlight ? "secondary" : "outline"}
          className={cn("w-full transition-all duration-300", plan.highlight ? "bg-primary text-white hover:bg-primary/90" : "hover:border-primary/30 hover:text-primary")}
          asChild
        >
          <Link href={getTargetHref()}>
            {plan.id === "free"
              ? user ? "Go to CV Editor" : "Build My CV Free"
              : plan.id === "agency"
              ? "Request Agency Pricing"
              : `Choose ${plan.name}`}
          </Link>
        </Button>
      </div>
    </div>
  );
}
