"use client"

import { useEffect } from "react"

export function ChunkErrorListener() {
  useEffect(() => {
    // Clear chunk reload counter on successful mount
    try {
      sessionStorage.removeItem("chunk_reload_count")
    } catch {
      // Ignore storage errors
    }

    const handleChunkError = (event: ErrorEvent | PromiseRejectionEvent) => {
      const errorMessage =
        event instanceof ErrorEvent
          ? event.message || event.error?.message || ""
          : event.reason?.message || String(event.reason || "")

      const isChunkError =
        errorMessage.includes("Loading chunk") ||
        errorMessage.includes("ChunkLoadError") ||
        errorMessage.includes("Failed to fetch dynamically imported module") ||
        errorMessage.includes("Loading CSS chunk")

      if (isChunkError) {
        try {
          const reloadCount = parseInt(sessionStorage.getItem("chunk_reload_count") || "0", 10)
          if (reloadCount < 2) {
            sessionStorage.setItem("chunk_reload_count", String(reloadCount + 1))
            console.warn("[ChunkErrorListener] Next.js chunk load failed due to fresh deployment. Reloading page...")
            window.location.reload()
          }
        } catch {
          window.location.reload()
        }
      }
    }

    const onError = (e: ErrorEvent) => handleChunkError(e)
    const onUnhandledRejection = (e: PromiseRejectionEvent) => handleChunkError(e)

    window.addEventListener("error", onError)
    window.addEventListener("unhandledrejection", onUnhandledRejection)

    return () => {
      window.removeEventListener("error", onError)
      window.removeEventListener("unhandledrejection", onUnhandledRejection)
    }
  }, [])

  return null
}
