import Image from "next/image";
import { cn } from "@/lib/utils";

interface BrandLoadingLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function BrandLoadingLogo({ className, size = "md" }: BrandLoadingLogoProps) {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-14 w-14",
    lg: "h-20 w-20",
  };

  return (
    <div className={cn("relative flex items-center justify-center", className)}>
      <div className={cn("relative shrink-0 overflow-hidden animate-pulse-subtle", sizeClasses[size])}>
        <Image 
          src="/brand-resume-transparent.png" 
          alt="Ai Career Guide Logo"
          fill
          className="object-contain"
          priority
        />
      </div>
      <div className="absolute inset-0 animate-ping-slow rounded-full border-2 border-primary/20" />
    </div>
  );
}
