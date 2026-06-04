"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { X, Check, Wand2, ArrowRight, History, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

interface MagicEditOverlayProps {
  isOpen: boolean
  onClose: () => void
  onApply: (content: string) => Promise<void>
  originalContent: string
  newContent: string
  title?: string
  toolAction?: string
}

export function MagicEditOverlay({
  isOpen,
  onClose,
  onApply,
  originalContent,
  newContent,
  title = "Dan's Resume Enhancement",
  toolAction = "Rewriting for Impact"
}: MagicEditOverlayProps) {
  const [isApplying, setIsApplying] = useState(false)

  const handleApply = async () => {
    setIsApplying(true)
    try {
      await onApply(newContent)
      onClose()
    } catch (error) {
      console.error("Failed to apply changes:", error)
    } finally {
      setIsApplying(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-6xl overflow-hidden rounded-[2rem] border border-white/20 bg-white/95 shadow-2xl shadow-indigo-500/20 backdrop-blur-2xl md:h-[85vh]"
          >
            {/* Header */}
            <div className="relative flex items-center justify-between border-b border-slate-200/60 bg-white/50 px-6 py-5 backdrop-blur-md md:px-10">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-200">
                  <Sparkles className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-xl font-black tracking-tight text-slate-900">{title}</h2>
                  <p className="text-sm font-bold uppercase tracking-widest text-indigo-600">{toolAction}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="rounded-full hover:bg-slate-100"
              >
                <X className="h-5 w-5 text-slate-400" />
              </Button>
            </div>

            <div className="flex h-[calc(85vh-5rem)] flex-col md:flex-row">
              {/* Original Content */}
              <div className="flex-1 border-r border-slate-100 p-6 md:p-10">
                <div className="mb-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                  <History className="h-3 w-3" />
                  Original Content
                </div>
                <ScrollArea className="h-[calc(100%-2rem)]">
                  <div className="whitespace-pre-wrap text-[15px] leading-relaxed text-slate-400 line-through decoration-slate-300">
                    {originalContent}
                  </div>
                </ScrollArea>
              </div>

              {/* Improved Content */}
              <div className="flex-1 bg-emerald-50/30 p-6 md:p-10">
                <div className="mb-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600">
                  <Wand2 className="h-3 w-3" />
                  Dan's Improvements
                </div>
                <ScrollArea className="h-[calc(100%-2rem)]">
                  <div className="whitespace-pre-wrap text-[15px] font-medium leading-relaxed text-slate-800">
                    {newContent}
                  </div>
                </ScrollArea>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between border-t border-slate-200/60 bg-white/80 p-6 backdrop-blur-xl md:px-10">
              <p className="hidden text-xs font-bold text-slate-400 md:block">
                This will update your resume content in the database.
              </p>
              <div className="flex w-full items-center gap-3 md:w-auto">
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="flex-1 rounded-full border-slate-200 px-8 font-bold text-slate-600 md:flex-none"
                >
                  Discard
                </Button>
                <Button
                  onClick={handleApply}
                  disabled={isApplying}
                  className="tap-bounce flex-1 rounded-full bg-emerald-500 px-10 font-black text-white shadow-lg shadow-emerald-100 hover:bg-emerald-600 md:flex-none"
                >
                  {isApplying ? "Updating..." : (
                    <span className="flex items-center gap-2">
                      Apply Changes <Check className="h-4 w-4" />
                    </span>
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
