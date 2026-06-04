"use client"

import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"

interface OnboardingGuideProps {
  message: string
  className?: string
}

export function OnboardingGuide({ message, className }: OnboardingGuideProps) {
  return (
    <div className={`flex items-start gap-4 ${className}`}>
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative flex-shrink-0"
      >
        {/* Animated Halo Rings */}
        <div className="absolute inset-[-8px] animate-[spin_10s_linear_infinite] rounded-full border border-dashed border-primary/20" />
        <div className="absolute inset-[-4px] animate-[spin_15s_linear_infinite_reverse] rounded-full border border-primary/10" />
        
        <div className="relative h-16 w-16 overflow-hidden rounded-2xl">
          <Image
            src="/logo-mascot.png"
            alt="AI Guide"
            width={64}
            height={64}
            className="relative z-10 scale-[1.3] object-cover mix-blend-multiply contrast-[1.2]"
          />
        </div>
      </motion.div>
      
      <AnimatePresence mode="wait">
        <motion.div
          key={message}
          initial={{ x: 10, opacity: 0, scale: 0.95 }}
          animate={{ x: 0, opacity: 1, scale: 1 }}
          exit={{ x: -10, opacity: 0, scale: 0.95 }}
          className="relative rounded-2xl rounded-tl-none bg-white/40 backdrop-blur-xl p-5 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] border border-white/60"
        >
          {/* Light-catch border */}
          <div className="absolute inset-0 rounded-2xl border-t border-l border-white/80 pointer-events-none" />
          
          <div className="absolute -left-2 top-0 h-4 w-4 bg-white/40 backdrop-blur-xl clip-path-triangle [clip-path:polygon(100%_0,0_0,100%_100%)] border-l border-white/60" />
          
          <p className="text-[0.95rem] font-semibold leading-relaxed text-primary/90">
            {message}
          </p>
          
          {/* Subtle glow underneath */}
          <div className="absolute -bottom-2 left-4 right-4 h-4 bg-primary/5 blur-xl -z-10 rounded-full" />
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
