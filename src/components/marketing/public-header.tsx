'use client';

import Link from "next/link";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetClose, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { BrandWordmark } from "@/components/brand/brand-wordmark";

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
  ctaLabel = "Start free",
  showLogin = true,
}: PublicHeaderProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-white/70 bg-white/80 backdrop-blur-xl">
      <div className="app-shell flex h-14 items-center justify-between gap-3 sm:h-20">
        <div className="flex min-w-0 items-center gap-3">
          <Link href="/" className="inline-flex min-w-0 items-center gap-2">
            <BrandWordmark className="text-[1.05rem] sm:text-2xl" />
          </Link>
        </div>

        <nav className="hidden items-center gap-8 lg:flex">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-semibold text-muted-foreground transition-colors hover:text-primary"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          {showLogin && (
            <Button variant="ghost" asChild>
              <Link href="/login">Log in</Link>
            </Button>
          )}
          <Button asChild>
            <Link href={ctaHref}>{ctaLabel}</Link>
          </Button>
        </div>

        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="h-9 w-9 rounded-2xl lg:hidden">
              <Menu className="h-4 w-4" />
              <span className="sr-only">Open navigation</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[min(320px,calc(100vw-0.75rem))] rounded-l-[1.75rem] p-0">
            <div className="flex h-full flex-col">
              <div className="border-b border-border/70 px-5 py-[max(1rem,env(safe-area-inset-top))]">
                <BrandWordmark className="text-[1.35rem]" />
              </div>
              <div className="flex flex-1 flex-col gap-2.5 px-5 py-5 pb-[calc(env(safe-area-inset-bottom)+1.25rem)]">
                {items.map((item) => (
                  <SheetClose asChild key={item.href}>
                    <Link
                      href={item.href}
                      className="rounded-[1.1rem] border border-border/70 bg-white px-4 py-3 text-[0.9rem] font-semibold text-primary transition-colors hover:bg-muted/30"
                    >
                      {item.label}
                    </Link>
                  </SheetClose>
                ))}
                <div className="mt-auto grid gap-3 pt-5">
                  {showLogin && (
                    <SheetClose asChild>
                      <Button variant="outline" asChild className="w-full">
                        <Link href="/login">Log in</Link>
                      </Button>
                    </SheetClose>
                  )}
                  <SheetClose asChild>
                    <Button asChild className="w-full">
                      <Link href={ctaHref}>{ctaLabel}</Link>
                    </Button>
                  </SheetClose>
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
