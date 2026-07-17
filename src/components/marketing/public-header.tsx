import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BrandWordmark } from "@/components/brand/brand-wordmark";
import { MarketingBotScript } from "@/components/marketing/marketing-bot-script";
import { PublicHeaderMobileNav } from "@/components/marketing/public-header-mobile-nav";
import { MarketingAnalytics } from "@/components/marketing/marketing-analytics";

type PublicHeaderItem = {
  label: string;
  href: string;
};

type PublicHeaderProps = {
  items: PublicHeaderItem[];
  ctaHref?: string;
  ctaLabel?: string;
  showLogin?: boolean;
};

export function PublicHeader({
  items,
  ctaHref = "/signup",
  ctaLabel = "Build My CV Free",
  showLogin = true,
}: PublicHeaderProps) {
  const normalizedCtaLabel = ctaLabel === "Start free" ? "Build My CV Free" : ctaLabel;
  const normalizedCtaHref = ctaHref === "/signup" ? "/signup?intent=create-cv" : ctaHref;

  return (
    <>
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <header className="public-marketing-header sticky top-0 z-50 border-b border-white/60 bg-white/75 backdrop-blur-xl">
        <div className="marketing-shell flex h-16 items-center justify-between gap-3 sm:h-[72px]">
          <div className="flex min-w-0 items-center gap-3">
            <Link href="/" className="inline-flex min-w-0 items-center gap-2">
              <BrandWordmark className="text-[1.05rem] sm:text-2xl" />
            </Link>
          </div>

          <nav aria-label="Primary navigation" className="hidden items-center gap-5 xl:flex">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-semibold tracking-tight text-slate-600 transition-colors hover:text-purple-700"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-2 xl:flex">
            {showLogin && (
              <Button variant="ghost" asChild>
                <Link href="/login">Log in</Link>
              </Button>
            )}
            <Button asChild>
              <Link href={normalizedCtaHref}>{normalizedCtaLabel}</Link>
            </Button>
          </div>

          <div className="xl:hidden"><PublicHeaderMobileNav
            items={items}
            ctaHref={normalizedCtaHref}
            ctaLabel={normalizedCtaLabel}
            showLogin={showLogin}
          /></div>
        </div>
      </header>
      <MarketingBotScript />
      <MarketingAnalytics />
    </>
  );
}
