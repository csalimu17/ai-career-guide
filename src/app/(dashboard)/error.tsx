"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const isChunkError =
    error.name === "ChunkLoadError" ||
    error.message?.includes("Loading chunk") ||
    error.message?.includes("Failed to fetch dynamically imported module") ||
    error.message?.includes("Loading CSS chunk");

  useEffect(() => {
    console.error("[dashboard error boundary]", error);

    if (isChunkError) {
      try {
        const reloadCount = parseInt(sessionStorage.getItem("chunk_reload_count") || "0", 10);
        if (reloadCount < 2) {
          sessionStorage.setItem("chunk_reload_count", String(reloadCount + 1));
          console.warn("[dashboard error boundary] Chunk error detected. Reloading page...");
          window.location.reload();
        }
      } catch {
        window.location.reload();
      }
    }
  }, [error, isChunkError]);

  const handleRetry = () => {
    if (isChunkError || typeof window !== "undefined") {
      window.location.reload();
    } else {
      reset();
    }
  };

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50">
        <AlertTriangle className="h-8 w-8 text-red-500" />
      </div>
      <h1 className="mt-6 text-2xl font-black tracking-tight text-slate-900">
        Something went wrong loading this page.
      </h1>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-slate-600">
        {isChunkError
          ? "A new update was deployed. Refreshing will load the latest version."
          : error.message || "We hit an unexpected error. You can try again, or jump back to your dashboard."}
        {error.digest ? (
          <span className="block mt-2 font-mono text-[0.7rem] text-slate-400">
            ref: {error.digest}
          </span>
        ) : null}
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Button onClick={handleRetry} className="h-11 rounded-2xl px-5 font-bold">
          <RotateCcw className="mr-2 h-4 w-4" />
          Try again
        </Button>
        <Button asChild variant="outline" className="h-11 rounded-2xl px-5 font-bold">
          <Link href="/dashboard">
            <Home className="mr-2 h-4 w-4" />
            Back to dashboard
          </Link>
        </Button>
      </div>
    </div>
  );
}
