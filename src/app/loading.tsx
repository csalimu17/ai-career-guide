import { Loader2, Sparkles } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="surface-card flex w-full max-w-md flex-col items-center gap-5 px-8 py-12 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-primary text-white shadow-[0_20px_40px_-24px_rgba(15,23,42,0.6)]">
          <Sparkles className="h-7 w-7" />
        </div>
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-secondary">Loading workspace</p>
          <h1 className="text-2xl font-bold text-primary">Preparing your next move</h1>
          <p className="text-sm text-muted-foreground">We&apos;re assembling the latest career data, templates, and settings for this screen.</p>
        </div>
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    </div>
  );
}
