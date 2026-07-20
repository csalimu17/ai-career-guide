import Image from "next/image";
import { cn } from "@/lib/utils";

interface BrandLoadingLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function BrandLoadingLogo({ className, size = "md" }: BrandLoadingLogoProps) {
  const sizeClasses = {
    sm: "h-12 w-12",
    md: "h-20 w-20",
    lg: "h-32 w-32",
  };

  return (
    <div className={cn("brand-loading-logo relative flex items-center justify-center", sizeClasses[size], className)}>
      <div className="brand-loading-logo__halo" aria-hidden="true" />
      <div className="brand-loading-logo__mark relative h-full w-full shrink-0 overflow-visible">
        <Image 
          src="/final-compass-logo.png" 
          alt="AI Career Guide logo"
          fill
          className="brand-loading-logo__image object-contain"
          priority
        />
        <div className="brand-loading-logo__cv-layer" aria-hidden="true">
          <span className="brand-loading-logo__card brand-loading-logo__card--top" />
          <span className="brand-loading-logo__line brand-loading-logo__line--one" />
          <span className="brand-loading-logo__line brand-loading-logo__line--two" />
          <span className="brand-loading-logo__line brand-loading-logo__line--three" />
          <span className="brand-loading-logo__line brand-loading-logo__line--four" />
          <span className="brand-loading-logo__card brand-loading-logo__card--bottom" />
        </div>
        <span className="brand-loading-logo__spark brand-loading-logo__spark--one" aria-hidden="true" />
        <span className="brand-loading-logo__spark brand-loading-logo__spark--two" aria-hidden="true" />
      </div>
    </div>
  );
}
