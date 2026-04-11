import Image from "next/image";
import { cn } from "@/lib/utils";
import { logoBase64 } from "@/app/_assets/logo-b64";

type BrandWordmarkProps = {
  className?: string;
};

export function BrandWordmark({ className }: BrandWordmarkProps) {
  return (
    <div className={cn("flex items-center gap-1", className)}>
      <Image
        src={logoBase64}
        alt="Ai Career guide. Mascot"
        width={96}
        height={96}
        priority
        className="h-10 w-10 object-contain brightness-[1.15] contrast-[1.1] saturate-[1.2] transition-transform hover:scale-105 active:scale-95"
      />
      <span
        aria-label="Ai Career guide."
        className="logo-gradient font-black text-xl leading-normal tracking-tighter font-sans pb-0.5"
      >
        Ai Career guide.
      </span>
    </div>
  );
}
