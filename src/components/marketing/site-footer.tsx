import Link from "next/link";
import { BrandWordmark } from "@/components/brand/brand-wordmark";

export function SiteFooter() {
  return (
    <footer className="border-t border-white/70 bg-white/76 backdrop-blur-xl">
      <div className="app-shell flex flex-col gap-6 py-8 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-md space-y-3">
          <BrandWordmark className="text-[1.35rem] sm:text-2xl" />
          <p className="text-[0.92rem] leading-6 text-muted-foreground">
            A polished career workspace for building resumes, improving ATS match scores, generating cover letters, and tracking applications with confidence.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-3">
          <div className="space-y-3">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground">Product</p>
            <div className="grid gap-2 text-[0.92rem]">
              <Link href="/pricing" className="text-muted-foreground transition-colors hover:text-primary">
                Pricing
              </Link>
              <Link href="/signup" className="text-muted-foreground transition-colors hover:text-primary">
                Start free
              </Link>
              <Link href="/login" className="text-muted-foreground transition-colors hover:text-primary">
                Log in
              </Link>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground">Resources</p>
            <div className="grid gap-2 text-[0.92rem]">
              <Link href="/support" className="text-muted-foreground transition-colors hover:text-primary">
                Support
              </Link>
              <Link href="/privacy" className="text-muted-foreground transition-colors hover:text-primary">
                Privacy
              </Link>
              <Link href="/terms" className="text-muted-foreground transition-colors hover:text-primary">
                Terms
              </Link>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground">Launch note</p>
            <p className="text-[0.92rem] leading-6 text-muted-foreground">
              Built for professionals who want conversion-ready resumes without sacrificing clarity, trust, or speed.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
