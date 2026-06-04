import Link from "next/link";
import { FileQuestion, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Dashboard segment 404. Used by `notFound()` calls in dynamic routes like
 * /cover-letters/[id] so the dashboard chrome is preserved.
 */
export default function DashboardNotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
        <FileQuestion className="h-8 w-8 text-slate-500" />
      </div>
      <h1 className="mt-6 text-2xl font-black tracking-tight text-slate-900">
        We couldn't find that.
      </h1>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-slate-600">
        The resume, cover letter, or job you were trying to open isn't there
        anymore — it may have been deleted or never existed.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Button asChild className="h-11 rounded-2xl px-5 font-bold">
          <Link href="/dashboard">
            <Home className="mr-2 h-4 w-4" />
            Back to dashboard
          </Link>
        </Button>
        <Button asChild variant="outline" className="h-11 rounded-2xl px-5 font-bold">
          <Link href="/resumes">Browse resumes</Link>
        </Button>
      </div>
    </div>
  );
}
