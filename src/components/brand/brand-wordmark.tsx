import Image from "next/image";
import { cn } from "@/lib/utils";

interface BrandWordmarkProps {
  className?: string;
  hideText?: boolean;
}

export function BrandWordmark({ className, hideText }: BrandWordmarkProps) {
  return (
    <div className={cn("flex items-center gap-3 transition-all duration-300", className)}>
      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-none bg-transparent">
        <Image 
          src="/brand-resume-mark-256.webp" 
          alt="AI Career Guide logo"
          fill
          className="object-contain scale-[1.02] transform-gpu"
        />
      </div>
      {!hideText && (
        <div className="flex flex-col items-center justify-center leading-none transition-all duration-300">
          <span className="logo-gradient font-display text-center text-[0.9rem] font-semibold tracking-[-0.05em] sm:text-[1.02rem]">
            AI Career Guide.
          </span>
          <span className="mt-0.5 ml-1 text-center text-[0.52rem] font-bold uppercase tracking-[0.22em] text-slate-400">
            Build. Match. Apply.
          </span>
        </div>
      )}
    </div>
  );
}
