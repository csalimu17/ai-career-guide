"use client"

import { motion } from "framer-motion"

export const ScannerAnimation = () => (
  <div className="relative h-64 w-full flex items-center justify-center overflow-hidden rounded-[2.5rem] bg-slate-50/50 border border-slate-100 shadow-inner">
    <div className="absolute inset-0 bg-dot-grid opacity-20" />
    
    <motion.div
      animate={{ 
        scale: [1, 1.1, 1],
        opacity: [0.3, 0.5, 0.3]
      }}
      transition={{ duration: 4, repeat: Infinity }}
      className="absolute h-48 w-48 rounded-full bg-blue-500/10 blur-3xl"
    />

    <div className="relative z-10 flex flex-col items-center gap-6">
      <div className="relative">
        <div className="h-32 w-24 rounded-lg border-2 border-slate-200 bg-white shadow-xl flex flex-col p-3 gap-2">
           <div className="h-1.5 w-full bg-slate-100 rounded-full" />
           <div className="h-1.5 w-[80%] bg-slate-100 rounded-full" />
           <div className="h-1.5 w-full bg-slate-100 rounded-full" />
           <div className="mt-auto h-2 w-full bg-blue-100 rounded-full" />
        </div>
        <motion.div
          animate={{ top: ["5%", "90%", "5%"] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          className="absolute left-[-20%] w-[140%] h-[2px] bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,1)]"
        />
      </div>
      <div className="text-center">
        <p className="text-sm font-black text-slate-900 uppercase tracking-widest">Scanning Algorithm...</p>
        <p className="text-[11px] font-medium text-slate-400">Benchmarking CV against JD vectors</p>
      </div>
    </div>
  </div>
);
