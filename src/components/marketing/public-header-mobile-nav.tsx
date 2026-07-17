'use client';
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandWordmark } from "@/components/brand/brand-wordmark";
type Item = { label: string; href: string };
export function PublicHeaderMobileNav({ items, ctaHref, ctaLabel, showLogin }: { items: Item[]; ctaHref: string; ctaLabel: string; showLogin: boolean }) {
  const [open, setOpen] = useState(false); const trigger = useRef<HTMLButtonElement>(null); const panel = useRef<HTMLDivElement>(null);
  useEffect(() => { if (!open) return; const triggerNode = trigger.current; const previous = document.body.style.overflow; document.body.style.overflow = "hidden"; panel.current?.querySelector<HTMLElement>("a,button")?.focus();
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); if (event.key === "Tab" && panel.current) { const f = [...panel.current.querySelectorAll<HTMLElement>('a,button:not([disabled])')], first=f[0], last=f.at(-1); if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();} else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();} } };
    document.addEventListener("keydown", onKey); return () => { document.body.style.overflow=previous; document.removeEventListener("keydown",onKey); triggerNode?.focus(); }; }, [open]);
  return <><Button ref={trigger} type="button" variant="outline" size="icon" className="h-11 w-11 rounded-xl" aria-expanded={open} aria-controls="mobile-navigation" onClick={()=>setOpen(true)}><Menu className="h-5 w-5"/><span className="sr-only">Open navigation</span></Button>
    {open&&<div className="fixed inset-0 z-[150] bg-slate-950/50" onMouseDown={e=>{if(e.target===e.currentTarget)setOpen(false)}}><div ref={panel} id="mobile-navigation" role="dialog" aria-modal="true" aria-label="Mobile navigation" className="ml-auto flex h-[100dvh] w-[min(340px,calc(100vw-12px))] flex-col overflow-y-auto bg-white shadow-xl"><div className="flex items-center justify-between border-b border-slate-200 px-5 py-4"><BrandWordmark className="text-xl"/><Button type="button" variant="ghost" size="icon" className="h-11 w-11" onClick={()=>setOpen(false)}><X className="h-5 w-5"/><span className="sr-only">Close navigation</span></Button></div><nav aria-label="Mobile navigation" className="flex flex-1 flex-col gap-1 px-5 py-4">{items.map(item=><Link onClick={()=>setOpen(false)} key={item.href} href={item.href} className="flex min-h-11 items-center border-b border-slate-100 py-3 text-base font-semibold text-slate-800">{item.label}</Link>)}<div className="mt-auto grid gap-3 pt-6">{showLogin&&<Button variant="outline" asChild><Link href="/login">Log In</Link></Button>}<Button asChild><Link href={ctaHref}>{ctaLabel}</Link></Button></div></nav></div></div>}</>;
}
