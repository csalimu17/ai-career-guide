
"use client"

import { useIsMobile } from "@/hooks/use-mobile"
import { useEditorState } from "@/hooks/use-editor-state"
import { DesktopEditor } from "@/components/editor/DesktopEditor"
import { MobileEditor } from "@/components/editor/MobileEditor"
import { Loader2, Monitor } from "lucide-react"

export default function CvEditorPage() {
  const isMobile = useIsMobile()
  const editor = useEditorState()
  const { isLoading, resume } = editor

  if (isLoading && !resume) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 gap-4">
        <div className="relative">
          <Loader2 className="h-12 w-12 text-primary animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-2 w-2 bg-primary rounded-full animate-ping" />
          </div>
        </div>
        <div className="flex flex-col items-center gap-1">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-400">Loading Workspace</p>
          <div className="flex gap-1">
             <div className="h-1 w-4 bg-slate-200 rounded-full animate-pulse" />
             <div className="h-1 w-8 bg-slate-200 rounded-full animate-pulse delay-75" />
             <div className="h-1 w-4 bg-slate-200 rounded-full animate-pulse delay-150" />
          </div>
        </div>
      </div>
    )
  }

  if (!resume && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-8 text-center">
        <div className="h-20 w-20 bg-white rounded-[2.5rem] shadow-xl flex items-center justify-center mb-6">
          <Monitor className="h-8 w-8 text-slate-300" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 mb-2">Unexpected Error</h2>
        <p className="text-slate-500 max-w-sm mb-8">We couldn't initialize your resume editor. Please try refreshing or contact support if the issue persists.</p>
        <button 
          onClick={() => window.location.reload()}
          className="px-8 h-12 bg-slate-900 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all active:scale-95"
        >
          Refresh Page
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {isMobile ? (
        <MobileEditor editor={editor} />
      ) : (
        <DesktopEditor editor={editor} />
      )}
    </div>
  )
}
