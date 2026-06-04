import { BrandLoadingLogo } from "@/components/brand/brand-loading-logo";

export default function DashboardLoading() {
  return (
    <div className="app-shell flex min-h-[70vh] items-center justify-center py-12">
      <div className="surface-card flex w-full max-w-md flex-col items-center gap-6 px-8 py-10 text-center">
        <BrandLoadingLogo size="lg" />
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-secondary">Loading workspace</p>
        <h1 className="text-2xl font-bold text-primary">Preparing your dashboard</h1>
      </div>
    </div>
  );
}
