'use client';

import { motion, AnimatePresence, Variants } from 'framer-motion';
import { MousePointer2, Sparkles, LayoutTemplate, Briefcase } from 'lucide-react';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

export function AnimatedEditorPreview() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    // 4 steps, each lasting 3.5 seconds
    const timer = setInterval(() => {
      setStep((s) => (s + 1) % 4);
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  const jobTitleText = step >= 1 ? "Senior Product Manager" : "";
  const isAiEnhanced = step >= 2;
  const isTwoColumn = step >= 3;

  // Approximate relative coordinates for the mouse cursor based on the sidebar layout
  const mouseVariants: Variants = {
    "0": { x: '90%', y: '80%', opacity: 0 },
    "1": { x: '18%', y: '22%', opacity: 1 },
    "2": { x: '16%', y: '46%', opacity: 1 },
    "3": { x: '24%', y: '85%', opacity: 1 },
  };

  return (
    <div className="relative w-full aspect-[4/3] lg:aspect-[16/11] overflow-hidden rounded-[1.15rem] border border-border/70 bg-background flex text-left font-sans shadow-inner">
      
      {/* ── Editor Sidebar ── */}
      <div className="w-[38%] sm:w-[32%] bg-white border-r border-border/60 p-3 sm:p-5 flex flex-col gap-4 relative z-10 shadow-[4px_0_24px_rgba(0,0,0,0.03)]">
        <div className="flex items-center gap-2 mb-1">
          <Briefcase className="w-3.5 h-3.5 text-primary" />
          <div className="h-3 w-16 bg-primary/20 rounded" />
        </div>

        {/* Job Title Input */}
        <div className="space-y-1.5">
          <div className="h-2 w-12 bg-muted-foreground/30 rounded" />
          <div className="h-7 sm:h-8 w-full bg-background border border-border/80 rounded-md flex items-center px-2.5 shadow-sm">
            <span className="text-[0.55rem] sm:text-[0.65rem] font-semibold text-primary flex items-center h-full">
              {jobTitleText}
              {step === 1 && (
                <motion.span animate={{ opacity: [1, 0] }} transition={{ repeat: Infinity, duration: 0.8 }} className="ml-[1px]">
                  |
                </motion.span>
              )}
            </span>
          </div>
        </div>

        {/* Professional Summary Box */}
        <div className="space-y-1.5 mt-1">
          <div className="h-2 w-20 bg-muted-foreground/30 rounded" />
          <div className="w-full bg-background border border-border/80 rounded-md p-2.5 shadow-sm relative overflow-hidden">
            <motion.div layout className="flex flex-col gap-1.5">
              <div className="h-1 w-full bg-muted-foreground/20 rounded" />
              <div className="h-1 w-[85%] bg-muted-foreground/20 rounded" />
              <div className="h-1 w-[95%] bg-muted-foreground/20 rounded" />
              <AnimatePresence>
                {isAiEnhanced && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }} 
                    animate={{ opacity: 1, height: 'auto' }} 
                    exit={{ opacity: 0, height: 0 }}
                    className="flex flex-col gap-1.5 pt-1.5 border-t border-primary/10 mt-1"
                  >
                    <div className="h-1 w-[92%] bg-primary/40 rounded" />
                    <div className="h-1 w-[78%] bg-primary/40 rounded" />
                    <div className="h-1 w-[88%] bg-primary/40 rounded" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
            
            {/* Shimmer effect when AI is generating (Start of step 2) */}
            {step === 2 && (
              <motion.div 
                className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent"
                animate={{ x: ['-100%', '200%'] }}
                transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
              />
            )}
          </div>

          <motion.div 
            className={cn(
              "mt-2 h-7 rounded-md flex items-center justify-center gap-1.5 shadow-sm transition-all duration-300",
              isAiEnhanced ? "bg-muted text-muted-foreground shadow-none" : "bg-primary text-white"
            )}
          >
            <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
            <span className="text-[0.55rem] sm:text-[0.6rem] font-semibold">{isAiEnhanced ? "Enhanced" : "Enhance with AI"}</span>
          </motion.div>
        </div>

        {/* Bottom Template Switch */}
        <div className="mt-auto pt-4 border-t border-border/50 flex flex-col sm:flex-row gap-1.5 sm:gap-2">
          <motion.div className={cn(
            "flex-1 h-7 rounded-md flex items-center justify-center gap-1.5 border transition-all",
            !isTwoColumn ? "bg-primary/10 border-primary/30 text-primary" : "bg-background border-border text-muted-foreground"
          )}>
            <LayoutTemplate className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
            <span className="text-[0.55rem] sm:text-[0.6rem] font-medium hidden sm:inline">Classic</span>
          </motion.div>
          <motion.div className={cn(
            "flex-1 h-7 rounded-md flex items-center justify-center gap-1.5 border transition-all",
            isTwoColumn ? "bg-primary/10 border-primary/30 text-primary" : "bg-background border-border text-muted-foreground"
          )}>
            <LayoutTemplate className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
            <span className="text-[0.55rem] sm:text-[0.6rem] font-medium hidden sm:inline">Modern</span>
          </motion.div>
        </div>
      </div>

      {/* ── CV Preview Main Area ── */}
      <div className="flex-1 bg-muted/20 p-3 sm:p-6 md:p-8 flex justify-center items-start overflow-hidden relative">
        <motion.div 
          layout 
          className="w-full max-w-[340px] aspect-[1/1.414] bg-white shadow-2xl rounded-sm border border-border/40 p-4 sm:p-6 flex flex-col gap-3 relative z-10"
          style={{ originY: 0 }}
        >
          {/* CV Header */}
          <motion.div layout className={cn("border-b border-border/40 pb-3 flex flex-col", isTwoColumn ? "items-start" : "items-center")}>
            <div className="h-2.5 sm:h-3.5 w-24 sm:w-32 bg-primary/80 rounded mb-1.5" />
            <div className={cn(
              "h-2 sm:h-2.5 rounded transition-all duration-700",
              jobTitleText ? "w-28 sm:w-36 bg-primary/40 opacity-100" : "w-0 opacity-0"
            )} />
          </motion.div>

          {/* CV Body Layout */}
          <motion.div layout className={cn("flex gap-3 flex-1", isTwoColumn ? "flex-row" : "flex-col")}>
            
            {/* Main Column */}
            <motion.div layout className={cn("flex flex-col gap-3", isTwoColumn ? "w-[65%]" : "w-full")}>
               {/* Summary Section */}
               <motion.div layout className="space-y-1.5">
                 <div className="h-1.5 w-14 bg-muted-foreground/40 rounded uppercase" />
                 <div className="space-y-1">
                   <div className="h-1 w-full bg-muted-foreground/20 rounded" />
                   <div className="h-1 w-[85%] bg-muted-foreground/20 rounded" />
                   <div className="h-1 w-[90%] bg-muted-foreground/20 rounded" />
                   {isAiEnhanced && (
                     <motion.div 
                       initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                       className="space-y-1 pt-0.5"
                     >
                       <div className="h-1 w-[95%] bg-primary/30 rounded" />
                       <div className="h-1 w-[80%] bg-primary/30 rounded" />
                     </motion.div>
                   )}
                 </div>
               </motion.div>

               {/* Experience Section */}
               <motion.div layout className="space-y-1.5">
                 <div className="h-1.5 w-20 bg-muted-foreground/40 rounded uppercase mt-2" />
                 <div className="flex justify-between items-center mb-0.5">
                   <div className="h-1.5 w-20 bg-primary/60 rounded" />
                   <div className="h-1 w-8 bg-muted-foreground/30 rounded" />
                 </div>
                 <div className="space-y-1 ml-2">
                   <div className="h-0.5 w-[95%] bg-muted-foreground/20 rounded" />
                   <div className="h-0.5 w-[85%] bg-muted-foreground/20 rounded" />
                   <div className="h-0.5 w-[90%] bg-muted-foreground/20 rounded" />
                 </div>
                 <div className="flex justify-between items-center mb-0.5 mt-2">
                   <div className="h-1.5 w-16 bg-primary/60 rounded" />
                   <div className="h-1 w-8 bg-muted-foreground/30 rounded" />
                 </div>
                 <div className="space-y-1 ml-2">
                   <div className="h-0.5 w-[90%] bg-muted-foreground/20 rounded" />
                   <div className="h-0.5 w-[80%] bg-muted-foreground/20 rounded" />
                 </div>
               </motion.div>
            </motion.div>

            {/* Sidebar Column (Skills & Education) */}
            <motion.div layout className={cn("flex flex-col gap-3", isTwoColumn ? "w-[35%] border-l border-border/40 pl-3" : "w-full")}>
              {/* Skills */}
              <motion.div layout className="space-y-1.5">
                 <div className="h-1.5 w-10 bg-muted-foreground/40 rounded uppercase" />
                 <div className="flex flex-wrap gap-1 mt-1">
                    <div className="h-2 sm:h-2.5 w-8 bg-primary/10 rounded-sm" />
                    <div className="h-2 sm:h-2.5 w-10 bg-primary/10 rounded-sm" />
                    <div className="h-2 sm:h-2.5 w-6 bg-primary/10 rounded-sm" />
                    <div className="h-2 sm:h-2.5 w-12 bg-primary/10 rounded-sm" />
                 </div>
              </motion.div>
              
              {/* Education */}
              <motion.div layout className="space-y-1.5 mt-1 sm:mt-2">
                 <div className="h-1.5 w-14 bg-muted-foreground/40 rounded uppercase" />
                 <div className="h-1.5 w-16 bg-primary/60 rounded mb-0.5" />
                 <div className="h-1 w-12 bg-muted-foreground/30 rounded" />
              </motion.div>
            </motion.div>

          </motion.div>
        </motion.div>

        {/* Decorative background grid */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0.03)_1px,transparent_1px)] bg-[size:12px_12px] sm:bg-[size:16px_16px] pointer-events-none" />
      </div>

      {/* ── Mouse Cursor ── */}
      <motion.div
        className="absolute z-50 pointer-events-none"
        variants={mouseVariants}
        animate={step.toString()}
        initial="0"
        transition={{ duration: 0.9, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <div className="relative">
          <MousePointer2 className="w-5 h-5 sm:w-6 sm:h-6 fill-white text-slate-900 drop-shadow-md" strokeWidth={2} />
          <AnimatePresence>
            {step > 0 && (
              <motion.div
                key={step}
                className="absolute top-0 left-0 w-6 h-6 bg-primary/30 rounded-full -z-10"
                initial={{ scale: 0, opacity: 1 }}
                animate={{ scale: 2.5, opacity: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              />
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
