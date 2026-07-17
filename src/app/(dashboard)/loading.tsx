import { BrandLoadingLogo } from "@/components/brand/brand-loading-logo";

export default function DashboardLoading() {
  return (
    <div className="app-shell flex min-h-[70vh] items-center justify-center py-12">
      <div className="surface-card flex w-full max-w-md flex-col items-center gap-6 px-8 py-10 text-center" aria-busy="true" aria-live="polite">
        <BrandLoadingLogo size="lg" />
        <div className="w-full max-w-[14rem] space-y-3">
          <div className="mx-auto h-2.5 w-24 animate-pulse rounded-full bg-secondary/20" />
          <div className="mx-auto h-6 w-44 animate-pulse rounded-full bg-primary/12" />
        </div>
        <span className="sr-only">Loading dashboard</span>
      </div>
    </div>
  );
}
