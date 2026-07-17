import { BrandLoadingLogo } from "@/components/brand/brand-loading-logo";

export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="surface-card flex w-full max-w-md flex-col items-center gap-6 px-8 py-12 text-center" aria-busy="true" aria-live="polite">
        <BrandLoadingLogo size="lg" />
        <div className="w-full max-w-[15rem] space-y-3">
          <div className="mx-auto h-2.5 w-28 animate-pulse rounded-full bg-secondary/20" />
          <div className="mx-auto h-6 w-48 animate-pulse rounded-full bg-primary/12" />
          <div className="mx-auto h-2.5 w-40 animate-pulse rounded-full bg-muted" />
        </div>
        <span className="sr-only">Loading page</span>
      </div>
    </div>
  );
}
