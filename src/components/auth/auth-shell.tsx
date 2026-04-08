import Link from "next/link";
import { ArrowRight, Bot, CheckCircle2, Home, Sparkles } from "lucide-react";
import { BrandWordmark } from "@/components/brand/brand-wordmark";
import { HistoryButtons } from "@/components/navigation/history-buttons";

type AuthShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  supportingTitle: string;
  supportingCopy: string;
  highlights: Array<{ title: string; description: string }>;
  children: React.ReactNode;
  footer: React.ReactNode;
};

export function AuthShell({
  eyebrow,
  title,
  description,
  supportingTitle,
  supportingCopy,
  highlights,
  children,
  footer,
}: AuthShellProps) {
  return (
    <div className="relative min-h-screen overflow-x-hidden px-3 py-3 sm:px-6 sm:py-6 lg:px-8">
      <div className="app-shell relative z-10 flex min-h-[calc(100dvh-1.5rem)] flex-col gap-4 sm:min-h-[calc(100vh-3rem)] sm:gap-6 lg:gap-10">
        <div className="flex items-center justify-between max-md:gap-2">
          <div className="flex items-center gap-3">
            <HistoryButtons fallbackHref="/" buttonClassName="rounded-full max-md:h-8 max-md:w-8" />
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/75 px-3.5 py-2 text-[0.62rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground shadow-sm backdrop-blur transition-colors hover:text-primary"
            >
              <Home className="h-3.5 w-3.5" />
              Home
            </Link>
          </div>
          <div className="hidden items-center gap-4 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground sm:flex">
            <Link href="/pricing" className="transition-colors hover:text-primary">
              Pricing
            </Link>
            <Link href="/support" className="transition-colors hover:text-primary">
              Support
            </Link>
          </div>
        </div>


        <div className="grid flex-1 gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="surface-card relative hidden overflow-hidden px-8 py-10 lg:flex lg:flex-col lg:justify-between">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(8,145,178,0.12),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(249,115,22,0.12),transparent_26%)]" />
            <div className="relative space-y-8">
              <div className="eyebrow-chip">
              <Bot className="h-4 w-4" />
                {eyebrow}
              </div>
              <div className="space-y-5">
                <p className="max-w-lg text-5xl font-black leading-[0.95] text-primary">
                  {supportingTitle}
                </p>
                <p className="max-w-xl text-lg leading-relaxed text-muted-foreground">
                  {supportingCopy}
                </p>
              </div>
            </div>

            <div className="relative grid gap-4">
              {highlights.map((highlight) => (
                <div
                  key={highlight.title}
                  className="rounded-[1.5rem] border border-white/80 bg-white/80 p-5 shadow-[0_18px_40px_-34px_rgba(15,23,42,0.55)] backdrop-blur"
                >
                  <div className="mb-3 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-secondary/10 text-secondary">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                    <p className="text-base font-bold text-primary">{highlight.title}</p>
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground">{highlight.description}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="surface-card flex flex-col justify-between overflow-hidden px-4 py-5 sm:px-8 sm:py-10">
            <div className="space-y-5 sm:space-y-8">
              <div className="space-y-3 sm:space-y-4">
                <div className="eyebrow-chip">
                  <Bot className="h-4 w-4" />
                  {eyebrow}
                </div>
                <div className="space-y-3">
                  <Link href="/" className="inline-flex items-center gap-2">
                    <BrandWordmark className="text-[1.35rem] sm:text-2xl" />
                  </Link>
                  <div className="space-y-2">
                    <h1 className="text-[1.7rem] font-black tracking-tight text-primary sm:text-4xl">
                      {title}
                    </h1>
                    <p className="max-w-md text-[0.92rem] leading-6 text-muted-foreground sm:text-base">
                      {description}
                    </p>
                  </div>
                </div>
              </div>

              {children}
            </div>

            <div className="mt-6 border-t border-border/70 pt-5 text-sm text-muted-foreground sm:mt-8">{footer}</div>
          </section>
        </div>

        <section className="surface-card overflow-hidden px-4 py-4 sm:px-6 sm:py-6 lg:hidden">
          <div className="space-y-3.5">
            <div className="eyebrow-chip">
              <Bot className="h-4 w-4" />
              {eyebrow}
            </div>
            <div className="space-y-2.5">
              <p className="text-[1.65rem] font-black leading-tight text-primary">{supportingTitle}</p>
              <p className="text-[0.92rem] leading-6 text-muted-foreground">{supportingCopy}</p>
            </div>
            <div className="space-y-2.5">
              {highlights.slice(0, 2).map((highlight) => (
                <div key={highlight.title} className="rounded-[1.15rem] border border-border/70 bg-white/80 p-3.5 shadow-sm">
                  <div className="mb-2 flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-2xl bg-secondary/10 text-secondary">
                      <CheckCircle2 className="h-4.5 w-4.5" />
                    </div>
                    <p className="text-[0.92rem] font-bold text-primary">{highlight.title}</p>
                  </div>
                  <p className="text-[0.88rem] leading-6 text-muted-foreground">{highlight.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="flex flex-col items-center justify-between gap-3 border-t border-white/70 pt-3 text-center text-[0.72rem] font-medium text-muted-foreground sm:pt-4 sm:flex-row sm:text-left">
          <p>AI Career Guide helps you build sharper resumes, better applications, and faster career momentum.</p>
          <Link href="/pricing" className="inline-flex items-center gap-2 font-semibold text-primary transition-opacity hover:opacity-80">
            View plans <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
