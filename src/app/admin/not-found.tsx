import Link from "next/link";
import { FileQuestion, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Admin segment 404. Returned by `notFound()` calls in dynamic admin routes
 * (admin/users/[id], admin/content/[slug], admin/pricing/[planId]) so the
 * admin sidebar stays visible instead of jumping the user to the global 404.
 */
export default function AdminNotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
        <FileQuestion className="h-8 w-8 text-slate-500" />
      </div>
      <h1 className="mt-6 text-2xl font-black tracking-tight text-slate-900">
        Admin resource not found.
      </h1>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-slate-600">
        The user, plan, or content item you're looking for doesn't exist or
        has been removed.
      </p>
      <div className="mt-6">
        <Button asChild className="h-11 rounded-2xl px-5 font-bold">
          <Link href="/admin">
            <Home className="mr-2 h-4 w-4" />
            Back to admin home
          </Link>
        </Button>
      </div>
    </div>
  );
}
