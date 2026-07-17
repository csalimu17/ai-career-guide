import Link from "next/link";
import { CheckCircle2, Sparkles } from "lucide-react";
import type { Plan as BillingPlan } from "@/lib/plans";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type PricingPlanCardProps = {
  plan: BillingPlan;
  compact?: boolean;
};

export function PricingPlanCard({ plan, compact = false }: PricingPlanCardProps) {
  return (
    <Card
      className={cn(
        "relative flex h-full flex-col overflow-hidden border border-border/70 bg-white/90",
        plan.highlight &&
          "border-primary/20 bg-[linear-gradient(180deg,rgba(244,246,255,0.98),rgba(238,240,255,0.96))] text-foreground shadow-[0_30px_80px_-46px_rgba(85,60,255,0.22)]"
      )}
    >
      {plan.highlight && (
        <div className="absolute right-4 top-4 inline-flex items-center gap-2 rounded-full border border-primary/10 bg-white/78 px-2.5 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-primary sm:right-5 sm:top-5 sm:px-3 sm:text-[0.68rem] sm:tracking-[0.22em]">
          <Sparkles className="h-3.5 w-3.5 text-accent" />
          Most popular
        </div>
      )}

      <CardHeader className={cn("space-y-4 p-6 sm:p-8", compact && "p-6")}>
        <div className="space-y-2">
          <CardTitle className={cn("text-xl sm:text-2xl", plan.highlight && "text-primary")}>{plan.name}</CardTitle>
          <p className={cn("text-sm leading-relaxed text-muted-foreground", plan.highlight && "text-foreground/68")}>
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
          <span className="text-4xl font-black tracking-tight sm:text-5xl">{plan.price}</span>
          {plan.price !== "Custom" && (
            <span className={cn("pb-2 text-sm text-muted-foreground", plan.highlight && "text-foreground/60")}>/ month</span>
          )}
        </div>
      </CardHeader>

      <CardContent className={cn("flex-1 space-y-4 p-6 pt-0 sm:p-8 sm:pt-0", compact && "p-6 pt-0")}>
        {plan.features.map((feature) => (
          <div key={feature} className="flex items-start gap-3">
            <CheckCircle2 className={cn("mt-0.5 h-4 w-4 shrink-0", plan.highlight ? "text-primary" : "text-secondary")} />
            <span className={cn("text-sm leading-relaxed text-foreground/90", plan.highlight && "text-foreground/88")}>{feature}</span>
          </div>
        ))}
      </CardContent>

      <CardFooter className={cn("p-6 pt-0 sm:p-8 sm:pt-0", compact && "p-6 pt-0")}>
        <Button
          variant={plan.highlight ? "secondary" : "outline"}
          className={cn("w-full", plan.highlight && "bg-white/92 text-primary hover:bg-white")}
          asChild
        >
          <Link href={plan.id === "free" ? "/signup?intent=create-cv" : plan.id === "agency" ? "/support?topic=agency-pricing" : `/signup?plan=${plan.id}`}>
            {plan.id === "free"
              ? "Build My CV Free"
              : plan.id === "agency"
              ? "Request Agency Pricing"
              : `Choose ${plan.name}`}
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
