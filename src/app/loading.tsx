import { BrandLoadingLogo } from "@/components/brand/brand-loading-logo";

export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="surface-card flex w-full max-w-md flex-col items-center gap-6 px-8 py-12 text-center">
        <BrandLoadingLogo size="lg" />
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-secondary">Loading workspace</p>
          <h1 className="text-2xl font-bold text-primary">Preparing your next move</h1>
          <p className="text-sm text-muted-foreground">We&apos;re assembling the latest career data, templates, and settings for this screen.</p>
        </div>
      </div>
    </div>
  );
}
