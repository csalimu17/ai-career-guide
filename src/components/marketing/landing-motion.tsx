'use client';

import { motion, Variants } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Sparkles, Target, Wand2, LayoutTemplate, ClipboardList, Briefcase, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AnimatedEditorPreview } from './animated-editor-preview';

// ── Shared variants ────────────────────────────────────────────────────────────

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.21, 0.47, 0.32, 0.98] } },
};

const staggerParent: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const item: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.21, 0.47, 0.32, 0.98] } },
};

// ── Static data ────────────────────────────────────────────────────────────────

const featureCardsData = [
  { icon: Upload, title: 'Import your current CV', description: 'Start from your existing CV so the platform can help you iterate faster instead of rebuilding from zero.' },
  { icon: Wand2, title: 'Refine content with AI', description: 'Improve summaries, bullets, and skills with suggestions that stay grounded in your real experience.' },
  { icon: Target, title: 'Score against real jobs', description: 'Paste a job description and see instantly what keywords are missing and where your CV is weak.' },
  { icon: LayoutTemplate, title: 'Export to modern ATS formats', description: 'Generate clean, ATS-readable PDFs that maintain professional design without confusing parsers.' },
  { icon: ClipboardList, title: 'Track every application', description: 'Move opportunities across a kanban board, store notes, and never miss a follow-up date.' },
  { icon: Sparkles, title: 'Generate tailored cover letters', description: 'Use your CV context and the job description to instantly draft cover letters that sound like you.' },
];

// ── HeroSection ────────────────────────────────────────────────────────────────

export function HeroSection() {
  return (
    <section className="relative overflow-hidden pb-16 pt-24 md:pb-32 md:pt-32">
      <div className="container-shell relative z-10 mx-auto max-w-5xl text-center">
        <motion.div className="space-y-8 flex flex-col items-center" initial="hidden" animate="visible" variants={staggerParent}>
          
          <motion.div variants={item}>
            <div className="eyebrow-chip w-fit mx-auto inline-block rounded-full border border-border/70 bg-muted/30 px-3 py-1 text-sm font-medium">Creative Career Workspace</div>
            <div className="sr-only">AI CV builder, free CV editor, free ATS checker, cover letter generator, and free job search tracker.</div>
          </motion.div>

          <motion.div variants={item} className="space-y-4">
            <h1 className="font-display max-w-4xl py-2 text-[2.5rem] font-semibold leading-[1.05] tracking-[-0.05em] sm:text-[4.5rem] lg:text-[6.5rem] xl:text-[7rem] pb-4">
              <span className="headline-glossy-black block text-foreground">Design a sharper</span>
              <span className="headline-gradient-vivid block bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">career system</span>
              <span className="headline-glossy-black block pb-2 text-foreground">not just another CV.</span>
            </h1>
            <p className="max-w-2xl mx-auto text-[1rem] leading-7 text-muted-foreground sm:text-[1.18rem]">
              AI Career Guide is an AI CV builder and free CV editor that helps you create a professional CV, improve ATS performance, generate tailored cover letters, and manage your free job search in one workspace.
            </p>
          </motion.div>

          <motion.div variants={item} className="grid gap-3 sm:flex sm:flex-row justify-center">
            <Button size="lg" asChild>
              <Link href="/signup">Start free <ArrowRight className="h-4 w-4 ml-2" /></Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/pricing">See plans</Link>
            </Button>
          </motion.div>

          <motion.div variants={item} className="flex flex-wrap justify-center gap-2 text-sm font-medium text-muted-foreground pt-4">
            <Link href="/cv-builder" className="rounded-full border border-border/70 bg-white/80 dark:bg-black/80 px-3 py-1.5 transition-colors hover:text-primary">
              Explore Free CV Builder
            </Link>
            <Link href="/ats-cv-checker" className="rounded-full border border-border/70 bg-white/80 dark:bg-black/80 px-3 py-1.5 transition-colors hover:text-primary">
              ATS Checker
            </Link>
          </motion.div>

        </motion.div>

        {/* Hero Image Mockup */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3, ease: [0.21, 0.47, 0.32, 0.98] }}
          className="mx-auto mt-16 max-w-5xl overflow-hidden rounded-xl border bg-background shadow-2xl"
        >
          <div className="flex items-center border-b bg-muted/40 px-4 py-3">
            <div className="flex gap-1.5">
              <div className="h-3 w-3 rounded-full bg-red-500/20" />
              <div className="h-3 w-3 rounded-full bg-amber-500/20" />
              <div className="h-3 w-3 rounded-full bg-green-500/20" />
            </div>
          </div>
          <div className="aspect-video bg-muted/10 relative">
            <AnimatedEditorPreview />
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ── PlatformFeaturesSection ───────────────────────────────────────────────────

export function PlatformFeaturesSection() {
  return (
    <section id="platform" className="border-t bg-muted/20 pb-20 pt-20">
      <div className="container-shell space-y-12">
        <div className="max-w-2xl space-y-4">
          <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Everything you need to move from sourcing to placement.
          </h2>
          <p className="text-lg text-muted-foreground">
            A cohesive platform for pipeline management, AI candidate matching, and automated tracking.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {featureCardsData.map((feature) => (
            <motion.div key={feature.title} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
              <Card className="h-full transition-colors hover:bg-muted/40">
                <CardContent className="space-y-4 p-6">
                  <div className="inline-flex rounded-lg bg-primary/10 p-3 text-primary">
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-semibold">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── CtaSection ─────────────────────────────────────────────────────────────────

export function CtaSection() {
  return (
    <section className="border-t pb-24 pt-24">
      <div className="container-shell">
        <div className="rounded-2xl border bg-card px-6 py-16 text-center sm:px-12 sm:py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-violet-600/10 pointer-events-none" />
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="relative z-10 mx-auto max-w-2xl space-y-8"
          >
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.24em] text-foreground/72">Ready when you are</p>
            <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
              Build the version of your career story that actually gets read.
            </h2>
            <p className="text-lg text-muted-foreground">
              Create your account, complete onboarding, and choose whether to upload an existing CV or start from scratch in the AI-guided editor.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button size="lg" asChild className="h-12 px-8">
                <Link href="/signup">Start free</Link>
              </Button>
              <Button variant="outline" size="lg" asChild className="h-12 px-8">
                <Link href="/login">Log in</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
