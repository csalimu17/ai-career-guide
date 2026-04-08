import { Loader2, ShieldCheck } from "lucide-react";

export default function AdminLoading() {
  return (
    <div className="app-shell flex min-h-[70vh] items-center justify-center py-12">
      <div className="surface-card flex w-full max-w-md flex-col items-center gap-4 px-8 py-10 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-[1.25rem] bg-primary text-white">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-secondary">Loading governance</p>
        <h1 className="text-2xl font-bold text-primary">Preparing admin controls</h1>
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    </div>
  );
}
