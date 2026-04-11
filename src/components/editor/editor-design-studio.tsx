"use client"

import { useMemo, useState } from "react"
import { Check, Crown, Gauge, LayoutTemplate, Lock, Paintbrush2, RefreshCcw, ShieldCheck, Sparkles } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { ATS_SAFE_RESUME_FONT_GROUPS, type ResumeFontKey } from "@/lib/resume-fonts"
import {
  TEMPLATES,
  canAccessTemplate,
  getTemplateConfig,
  getTemplateTierLabel,
  normalizeTemplateAccessTier,
  type TemplateConfig,
} from "@/lib/templates-config"
import { cn } from "@/lib/utils"

import { TemplateThumbnail } from "./template-thumbnail"

type ResumeStyleKey = "primaryColor" | "fontFamily" | "fontSize" | "lineHeight" | "margins"
type StudioSection = "templates" | "styles"

type EditorDesignStudioProps = {
  resume: any
  plan?: string | null
  compact?: boolean
  sections?: StudioSection[]
  onSelectTemplate: (templateId: string) => void
  onUpdateStyle: (styleKey: ResumeStyleKey, value: string | number) => void
  onResetStyles: () => void
}

const TEMPLATE_CATEGORIES = ["All", "Professional", "Modern", "Classic"] as const

const COLOR_SWATCHES = [
  { label: "Royal Plum", value: "#673AB7" },
  { label: "Signal Blue", value: "#2196F3" },
  { label: "Bright Ember", value: "#FF9800" },
  { label: "Executive Navy", value: "#1f3a5f" },
  { label: "Modern Teal", value: "#0f766e" },
  { label: "Forest Grid", value: "#14532d" },
  { label: "Slate Graphite", value: "#334155" },
  { label: "Nordic Charcoal", value: "#1e293b" },
  { label: "Terracotta Creative", value: "#ea580c" },
  { label: "Bordeaux Elegant", value: "#431407" },
] as const

function getTemplateTraits(template: TemplateConfig) {
  const headerLabel =
    template.design.headerVariant === "executive"
      ? "Executive header"
      : template.design.headerVariant === "elegant"
        ? "Framed header"
        : template.design.headerVariant === "modern"
          ? "Modern header"
          : template.design.headerVariant === "minimal"
            ? "Minimal header"
            : "Classic header"

  const densityLabel =
    template.design.density === "compact"
      ? "Lean spacing"
      : template.design.density === "relaxed"
        ? "Airy spacing"
        : "Balanced spacing"

  const skillLabel =
    template.design.skillVariant === "compact"
      ? "Compact skills"
      : template.design.skillVariant === "inline"
        ? "Inline skills"
        : "Stacked skills"

  return [headerLabel, densityLabel, skillLabel]
}

function MetricCard({
  label,
  value,
  hint,
  children,
}: {
  label: string
  value: string
  hint: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-[1.4rem] border border-slate-200/80 bg-slate-50/80 p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-[0.68rem] font-black uppercase tracking-[0.18em] text-slate-400">{label}</p>
          <p className="mt-1 text-xs text-slate-500">{hint}</p>
        </div>
        <Badge variant="secondary" className="rounded-full bg-white px-2.5 py-1 text-[0.68rem] font-bold text-slate-700">
          {value}
        </Badge>
      </div>
      {children}
    </div>
  )
}

export function EditorDesignStudio({
  resume,
  plan,
  compact = false,
  sections = ["templates", "styles"],
  onSelectTemplate,
  onUpdateStyle,
  onResetStyles,
}: EditorDesignStudioProps) {
  const [activeCategory, setActiveCategory] = useState<(typeof TEMPLATE_CATEGORIES)[number]>("All")
  const currentPlan = normalizeTemplateAccessTier(plan)
  const activeTemplate = getTemplateConfig(resume?.templateId)
  const currentStyles = resume?.styles ?? {}

  const visibleTemplates = useMemo(() => {
    const filtered =
      activeCategory === "All"
        ? TEMPLATES
        : TEMPLATES.filter((template) => template.category === activeCategory)

    return [...filtered].sort((left, right) => {
      const leftUnlocked = canAccessTemplate(left, plan) ? 1 : 0
      const rightUnlocked = canAccessTemplate(right, plan) ? 1 : 0

      if (left.id === activeTemplate.id) return -1
      if (right.id === activeTemplate.id) return 1
      if (leftUnlocked !== rightUnlocked) return rightUnlocked - leftUnlocked
      return left.name.localeCompare(right.name)
    })
  }, [activeCategory, activeTemplate.id, plan])

  const selectedFont = (currentStyles.fontFamily || activeTemplate.defaults.fontFamily) as ResumeFontKey
  const selectedColor = String(currentStyles.primaryColor || activeTemplate.defaults.primaryColor)
  const fontSize = Number(currentStyles.fontSize ?? activeTemplate.defaults.fontSize)
  const lineHeight = Number(currentStyles.lineHeight ?? activeTemplate.defaults.lineHeight)
  const margins = Number(currentStyles.margins ?? activeTemplate.defaults.margins)
  const showTemplates = sections.includes("templates")
  const showStyles = sections.includes("styles")

  const renderTemplates = () => showTemplates ? (
    <Card className="overflow-hidden rounded-[2rem] border-white/80 bg-white/90 shadow-[0_28px_70px_-42px_rgba(15,23,42,0.35)]">
      <div className="border-b border-slate-100 bg-[linear-gradient(135deg,rgba(103,58,183,0.08),rgba(33,150,243,0.08)_50%,rgba(255,152,0,0.08))] px-5 py-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/10 bg-white/80 px-3 py-1 text-[0.68rem] font-black uppercase tracking-[0.18em] text-primary">
              <LayoutTemplate className="h-3.5 w-3.5" />
              Template studio
            </div>
            <div>
              <h3 className="text-xl font-black tracking-tight text-slate-950">Choose a stronger, branded layout</h3>
              <p className="mt-1 text-sm text-slate-600">
                Every layout stays ATS-safe and single-column, but each one changes the rhythm, tone, and hierarchy.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge className="rounded-full bg-slate-950 px-3.5 py-1.5 text-[0.62rem] font-black uppercase tracking-[0.2em] text-white border-none shadow-sm">
              {currentPlan} plan
            </Badge>
            <Badge variant="outline" className="rounded-full border-emerald-500/20 bg-emerald-500/10 px-3.5 py-1.5 text-[0.62rem] font-black uppercase tracking-[0.2em] text-emerald-600">
              <ShieldCheck className="mr-1.5 h-3.5 w-3.5" />
              ATS-safe system
            </Badge>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {TEMPLATE_CATEGORIES.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setActiveCategory(category)}
              className={cn(
                "rounded-full px-5 py-2.5 text-[0.72rem] font-black uppercase tracking-[0.18em] transition-all duration-300",
                activeCategory === category
                  ? "bg-slate-950 text-white shadow-[0_10px_20px_-10px_rgba(15,23,42,0.4)]"
                  : "bg-slate-100/80 text-slate-500 hover:bg-slate-200 hover:text-slate-800"
              )}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      <div className={cn("grid gap-6 p-6", compact ? "grid-cols-1" : "grid-cols-2")}>
        {visibleTemplates.map((template) => {
          const locked = !canAccessTemplate(template, plan)
          const selected = template.id === activeTemplate.id

          return (
            <button
              key={template.id}
              type="button"
              onClick={() => onSelectTemplate(template.id)}
              className={cn(
                "group relative flex flex-col overflow-hidden rounded-[1.8rem] border-2 bg-white text-left transition-all duration-300",
                selected
                  ? "border-indigo-500 shadow-[0_20px_50px_-15px_rgba(99,102,241,0.25)] ring-4 ring-indigo-50"
                  : "border-transparent bg-slate-50/50 hover:border-slate-200 hover:bg-white hover:shadow-[0_20px_50px_-15px_rgba(15,23,42,0.12)]"
              )}
            >
              <div className="relative p-3 pb-0">
                <div className="relative aspect-[0.78] overflow-hidden rounded-2xl border border-slate-200/60 shadow-sm">
                  <TemplateThumbnail template={template} className="h-full w-full" />
                  
                  {/* Badge Overlay */}
                  <div className="absolute inset-x-0 top-0 flex items-start justify-between p-3">
                    <div className="flex flex-wrap gap-1.5">
                      <Badge className="rounded-lg bg-white/95 px-2.5 py-1 text-[0.62rem] font-black uppercase tracking-[0.12em] text-slate-800 shadow-sm border-none backdrop-blur-sm">
                        {template.category}
                      </Badge>
                      {template.isAtsSafe && (
                        <Badge className="rounded-lg bg-emerald-500 px-2 py-0.5 text-[0.62rem] font-black uppercase tracking-[0.12em] text-white shadow-sm border-none">
                          ATS
                        </Badge>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {selected && (
                        <Badge className="rounded-lg bg-indigo-600 px-2.5 py-1 text-[0.62rem] font-black uppercase tracking-[0.12em] text-white shadow-sm border-none backdrop-blur-sm animate-in fade-in zoom-in duration-300">
                          <Check className="mr-1 h-3 w-3" />
                          ACTIVE
                        </Badge>
                      )}
                      {locked && (
                        <Badge className="rounded-lg bg-slate-900/95 px-2.5 py-1 text-[0.62rem] font-black uppercase tracking-[0.12em] text-white shadow-sm border-none backdrop-blur-sm">
                          <Lock className="mr-1 h-3 w-3" />
                          {getTemplateTierLabel(template.accessTier)}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  {/* Action UI */}
                  <div className="absolute inset-x-4 bottom-4 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                    <div className="flex items-center justify-between rounded-xl bg-white/95 backdrop-blur-md p-2 shadow-xl border border-white">
                      <div className="px-2">
                        <p className="text-[10px] font-black uppercase tracking-wider text-slate-800 truncate">{template.name}</p>
                      </div>
                      <Button size="sm" className={cn("h-8 rounded-lg px-3 text-[10px] font-bold shadow-sm", selected ? "bg-indigo-600 text-white" : "bg-slate-900 text-white")}>
                        {selected ? "Active" : locked ? "Upgrade" : "Select"}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
              <div className="px-5 py-4">
                <p className="text-[11px] font-bold tracking-wide text-slate-500 leading-relaxed line-clamp-2">
                  {template.description}
                </p>
              </div>
            </button>
          )
        })}
      </div>
    </Card>
  ) : null

  const renderStyles = () => showStyles ? (
    <Card className="overflow-hidden rounded-[2rem] border-white/80 bg-white/95 shadow-[0_28px_70px_-42px_rgba(15,23,42,0.28)]">
      <div className="border-b border-slate-100 px-5 py-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[0.68rem] font-black uppercase tracking-[0.18em] text-slate-700">
              <Paintbrush2 className="h-3.5 w-3.5" />
              Style controls
            </div>
            <div>
              <h3 className="text-xl font-black tracking-tight text-slate-950">Customize the feel, keep the structure</h3>
              <p className="mt-1 text-sm text-slate-600">
                Adjust color, type, and spacing without drifting into risky multi-column layouts.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="rounded-full border-slate-200 bg-slate-50 px-3 py-1 text-[0.68rem] font-bold uppercase tracking-[0.18em] text-slate-700">
              {activeTemplate.name}
            </Badge>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onResetStyles}
              className="rounded-full border-slate-200 bg-white px-4 text-xs font-bold uppercase tracking-[0.14em] text-slate-700"
            >
              <RefreshCcw className="mr-2 h-3.5 w-3.5" />
              Reset
            </Button>
          </div>
        </div>
      </div>

      <div className={cn("grid gap-4 p-5", compact ? "grid-cols-1" : "grid-cols-2")}>
        <MetricCard label="Accent color" value={selectedColor.toUpperCase()} hint="Use our brand tones or pick your own accent.">
          <div className="grid grid-cols-2 gap-2">
            {COLOR_SWATCHES.map((swatch) => {
              const active = selectedColor.toLowerCase() === swatch.value.toLowerCase()
              return (
                <button
                  key={swatch.value}
                  type="button"
                  onClick={() => onUpdateStyle("primaryColor", swatch.value)}
                  className={cn(
                    "flex items-center gap-2.5 rounded-xl border p-2.5 text-left transition-all",
                    active ? "border-slate-300 bg-white shadow-sm ring-1 ring-slate-100" : "border-slate-100 bg-slate-50/50 hover:bg-white hover:border-slate-200"
                  )}
                >
                  <span className="h-4 w-4 shrink-0 rounded-full border border-black/10 shadow-sm" style={{ backgroundColor: swatch.value }} />
                  <span className="text-xs font-bold leading-tight text-slate-700">{swatch.label}</span>
                </button>
              )
            })}
          </div>
          <label className="mt-3 flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-3 transition-colors hover:bg-white">
            <div className="relative shrink-0">
              <input
                type="color"
                value={selectedColor}
                onChange={(event) => onUpdateStyle("primaryColor", event.target.value)}
                className="peer absolute inset-0 h-full w-full cursor-pointer opacity-0"
                aria-label="Custom accent color"
              />
              <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white shadow-sm peer-focus:ring-2 peer-focus:ring-primary/20">
                <div className="h-5 w-5 rounded-md border border-black/10" style={{ backgroundColor: selectedColor }} />
              </div>
            </div>
            <div>
              <p className="text-[0.68rem] font-black uppercase tracking-[0.14em] text-slate-400">Custom accent</p>
              <p className="mt-0.5 text-xs text-slate-600">Pick any color from the spectrum.</p>
            </div>
          </label>
        </MetricCard>

        <MetricCard label="Font family" value={selectedFont} hint="Stick to ATS-safe fonts for better parsing consistency.">
          <Select value={selectedFont} onValueChange={(value) => onUpdateStyle("fontFamily", value)}>
            <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-white text-sm font-semibold">
              <SelectValue placeholder="Choose a font" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-slate-200">
              {Object.entries(ATS_SAFE_RESUME_FONT_GROUPS).map(([group, fonts]) =>
                fonts.length ? (
                  <SelectGroup key={group}>
                    <SelectLabel>{group}</SelectLabel>
                    {fonts.map((font) => (
                      <SelectItem key={font.value} value={font.value}>
                        {font.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ) : null
              )}
            </SelectContent>
          </Select>
        </MetricCard>

        <MetricCard label="Font size" value={`${fontSize.toFixed(1)} pt`} hint="Dial readability for senior, graduate, or compact one-page resumes.">
          <Slider
            min={10}
            max={13}
            step={0.25}
            value={[fontSize]}
            onValueChange={([value]) => onUpdateStyle("fontSize", Number(value.toFixed(2)))}
          />
        </MetricCard>

        <MetricCard label="Line height" value={lineHeight.toFixed(2)} hint="Increase breathing room or tighten for denser applications.">
          <Slider
            min={1.35}
            max={1.8}
            step={0.01}
            value={[lineHeight]}
            onValueChange={([value]) => onUpdateStyle("lineHeight", Number(value.toFixed(2)))}
          />
        </MetricCard>

        <MetricCard label="Margins" value={`${Math.round(margins)} px`} hint="Control how airy or space-efficient the page feels.">
          <Slider
            min={32}
            max={56}
            step={1}
            value={[margins]}
            onValueChange={([value]) => onUpdateStyle("margins", Math.round(value))}
          />
        </MetricCard>

        <div className="rounded-[1.4rem] border border-slate-200/80 bg-[linear-gradient(135deg,rgba(103,58,183,0.08),rgba(33,150,243,0.08)_52%,rgba(255,152,0,0.08))] p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[0.68rem] font-black uppercase tracking-[0.18em] text-slate-500">Template strategy</p>
              <h4 className="mt-2 text-base font-black tracking-tight text-slate-950">Keep the candidate story clear</h4>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Use modern templates for tech-forward roles, professional styles for client-facing work, and classic layouts when you want maximum familiarity.
              </p>
            </div>
            <Gauge className="mt-1 h-5 w-5 text-primary" />
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Badge className="rounded-full bg-white/85 px-3 py-1 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-slate-700">
              {activeTemplate.category}
            </Badge>
            <Badge className="rounded-full bg-white/85 px-3 py-1 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-slate-700">
              {activeTemplate.design.density}
            </Badge>
            <Badge className="rounded-full bg-white/85 px-3 py-1 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-slate-700">
              {activeTemplate.design.skillVariant}
            </Badge>
          </div>

          <div className="mt-4 flex items-center gap-2 text-[0.72rem] font-bold uppercase tracking-[0.16em] text-slate-500">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Original AI Career Guide studio, not a copied builder
          </div>
        </div>
      </div>
    </Card>
  ) : null

  return (
    <div className={cn("space-y-5", compact ? "space-y-4" : "space-y-6")}>
      {compact ? (
        <>
          {renderStyles()}
          {renderTemplates()}
        </>
      ) : (
        <>
          {renderTemplates()}
          {renderStyles()}
        </>
      )}
    </div>
  )
}
