"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, ArrowRight } from "lucide-react";
import { PublicHeader } from "@/components/marketing/public-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Card3D } from "@/components/marketing/landing-motion";
import { TemplateThumbnail } from "@/components/editor/template-thumbnail";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { marketingHeaderItems } from "@/lib/marketing-nav";
import { TEMPLATES, type TemplateConfig } from "@/lib/templates-config";
import { cn } from "@/lib/utils";

function hexToRgba(hex: string, alpha: number) {
  const normalized = hex.replace("#", "");
  const expanded = normalized.length === 3
    ? normalized.split("").map((char) => char + char).join("")
    : normalized;
  const value = Number.parseInt(expanded, 16);
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export default function CvTemplatesPageClient() {
  const [activeCategory, setActiveCategory] = useState<"All" | "Professional" | "Modern" | "Classic">("All");
  const [previewTemplate, setPreviewTemplate] = useState<TemplateConfig | null>(null);

  const filteredTemplates = useMemo(() => {
    if (activeCategory === "All") return TEMPLATES;
    return TEMPLATES.filter((template) => template.category === activeCategory);
  }, [activeCategory]);

  const categories = ["All", "Professional", "Modern", "Classic"] as const;

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    numberOfItems: TEMPLATES.length,
    itemListElement: TEMPLATES.map((template, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "CreativeWork",
        name: template.name,
        description: template.description,
        genre: template.category,
        accessMode: template.accessTier === "free" ? "free" : "restricted",
      },
    })),
  };

  return (
    <div className="min-h-screen bg-slate-50/50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />

      <PublicHeader items={marketingHeaderItems} ctaHref="/signup" ctaLabel="Start free" />

      <main className="relative overflow-hidden pb-24 pt-12 sm:pt-20">
        {/* Ambient background glows */}
        <div className="absolute top-0 left-[-10%] -z-10 h-[600px] w-[600px] rounded-full bg-[radial-gradient(circle,rgba(124,99,255,0.12),transparent_70%)] blur-[100px] pointer-events-none animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute right-[-10%] top-[20%] -z-10 h-[500px] w-[500px] rounded-full bg-[radial-gradient(circle,rgba(51,184,255,0.1),transparent_70%)] blur-[90px] pointer-events-none animate-pulse" style={{ animationDuration: '10s' }} />
        <div className="absolute left-[30%] bottom-10 -z-10 h-[450px] w-[450px] rounded-full bg-[radial-gradient(circle,rgba(255,159,110,0.08),transparent_70%)] blur-[80px] pointer-events-none animate-pulse" style={{ animationDuration: '12s' }} />

        <div className="app-shell space-y-12">
          <section className="mx-auto max-w-4xl space-y-6 text-center">
            <Badge variant="secondary" className="bg-primary/10 px-4 py-1.5 text-sm uppercase tracking-widest text-primary border-none">
              Recruiter-Approved Formats
            </Badge>
            <h1 className="font-display text-5xl font-semibold leading-[0.95] tracking-tight sm:text-7xl lg:text-8xl">
              ATS-Friendly <span className="headline-gradient-vivid">CV Templates</span>
            </h1>
            <p className="mx-auto max-w-2xl text-lg leading-relaxed text-muted-foreground">
              Explore professional layouts designed to stay readable for recruiters and applicant tracking systems while giving your experience a polished structure.
            </p>
          </section>

          <section className="mx-auto flex max-w-xl flex-wrap justify-center gap-2 border-b border-border/60 pb-6">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                aria-pressed={activeCategory === category}
                className={cn(
                  "rounded-full px-6 py-2.5 text-xs font-black uppercase tracking-widest transition-all duration-300",
                  activeCategory === category
                    ? "brand-gradient-bg text-white shadow-[0_4px_20px_-4px_rgba(110,88,255,0.4)] scale-105"
                    : "border border-border bg-white/80 text-slate-600 hover:text-primary hover:bg-slate-50/50 backdrop-blur-sm"
                )}
              >
                {category}
              </button>
            ))}
          </section>

          <section
            aria-label="CV template gallery"
            className="grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3"
          >
            {filteredTemplates.map((template) => (
              <Card3D key={template.id} intensity={5} className="h-full">
                <Card
                  className="group flex h-full flex-col justify-between overflow-hidden rounded-[2rem] border border-border/70 bg-white/92 shadow-sm transition-all duration-300 hover:shadow-lg backdrop-blur-sm"
                  style={{
                    backgroundImage: `linear-gradient(180deg, #ffffff 0%, ${hexToRgba(template.defaults.primaryColor, 0.015)} 100%)`
                  }}
                >
                  <div>
                    <div className="relative aspect-[19/28] overflow-hidden select-none bg-slate-100">
                      <TemplateThumbnail
                        template={template}
                        highFidelity
                      />

                      <div className="absolute top-3 right-3 z-20 flex gap-1.5">
                        <Badge className="border-none bg-slate-900/80 text-[9px] font-black uppercase tracking-wider backdrop-blur-md">
                          {template.category}
                        </Badge>
                        <Badge
                          className={cn(
                            "border-none text-[9px] font-black uppercase tracking-wider backdrop-blur-md",
                            template.accessTier === "free"
                              ? "bg-emerald-500/80"
                              : template.accessTier === "pro"
                                ? "bg-indigo-500/80"
                                : "bg-purple-500/80"
                          )}
                        >
                          {template.accessTier === "free" ? "Free" : template.accessTier === "pro" ? "Pro" : "Master"}
                        </Badge>
                      </div>
                    </div>

                    <div className="space-y-3 p-6">
                      <h2 className="font-display text-xl font-bold text-slate-900 transition-colors group-hover:text-primary">
                        {template.name}
                      </h2>
                      <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                        {template.description}
                      </p>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        <span className="inline-flex items-center rounded border bg-slate-50/50 px-1.5 py-0.5 text-[9px] font-bold text-slate-500">
                          Font: {template.defaults.fontFamily.replace("-", " ")}
                        </span>
                        <span className="inline-flex items-center rounded border bg-slate-50/50 px-1.5 py-0.5 text-[9px] font-bold text-slate-500">
                          Layout: {template.layout.replace("-", " ")}
                        </span>
                        {template.isAtsSafe && (
                          <span className="inline-flex items-center rounded border border-emerald-100 bg-emerald-50/50 px-1.5 py-0.5 text-[9px] font-bold text-emerald-600">
                            ATS Safe
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="px-6 pt-2 pb-6 flex gap-2.5">
                    <Button
                      variant="outline"
                      className="flex-1 rounded-xl py-5 text-xs font-black uppercase tracking-wider transition-all duration-300"
                      onClick={() => setPreviewTemplate(template)}
                    >
                      Preview
                    </Button>
                    <Link
                      href={`/signup?template=${template.id}`}
                      className="flex-[1.5] flex items-center justify-center gap-2 rounded-xl bg-slate-900 py-3.5 text-xs font-black uppercase tracking-wider text-white shadow-md transition-all duration-300 hover:bg-primary hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
                    >
                      Use This Template <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                    </Link>
                  </div>
                </Card>
              </Card3D>
            ))}
          </section>

          <section className="brand-gradient-bg relative mt-12 overflow-hidden rounded-[3rem] p-8 text-white shadow-2xl sm:p-16">
            <div className="relative z-10 max-w-3xl space-y-6">
              <Badge variant="outline" className="border-white/30 text-white hover:bg-white/10 uppercase tracking-widest">
                Template customization
              </Badge>
              <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-5xl">
                Swap styles with a single click
              </h2>
              <p className="max-w-xl text-lg text-white/80">
                Build your CV once, then move between templates without retyping your experience, skills, or career history.
              </p>
              <div className="pt-4">
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center rounded-2xl bg-white px-8 py-3.5 text-sm font-bold text-primary shadow-md transition-all hover:bg-white/95"
                >
                  Create Your CV Now
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Link>
              </div>
            </div>
          </section>
        </div>
      </main>

      {previewTemplate && (
        <Dialog open={!!previewTemplate} onOpenChange={(open) => !open && setPreviewTemplate(null)}>
          <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-6 rounded-[2rem] overflow-hidden bg-white">
            <DialogHeader className="flex flex-row items-center justify-between border-b pb-4 pr-6">
              <div>
                <DialogTitle className="text-xl font-black text-slate-900">{previewTemplate.name} Preview</DialogTitle>
                <div className="mt-1 flex items-center gap-2">
                  <Badge className="bg-slate-100 text-slate-700 border-none text-[9px] font-black uppercase tracking-wider hover:bg-slate-100">
                    {previewTemplate.category}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground font-semibold">
                    Layout: {previewTemplate.layout.replace("-", " ")}
                  </span>
                </div>
              </div>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto rounded-2xl border border-slate-100 bg-slate-50 relative p-4 flex items-center justify-center min-h-0">
              <TemplateThumbnail template={previewTemplate} highFidelity={true} className="w-full h-full" />
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" className="rounded-xl" onClick={() => setPreviewTemplate(null)}>Close</Button>
              <Button asChild className="rounded-xl bg-slate-900 text-white hover:bg-primary">
                <Link href={`/signup?template=${previewTemplate.id}`}>
                  Use This Template
                </Link>
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      <SiteFooter />
    </div>
  );
}
