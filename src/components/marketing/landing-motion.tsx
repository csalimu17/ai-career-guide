'use client';

import { motion, useMotionValue, useSpring, useTransform, useInView, animate } from 'framer-motion';
import { useRef, useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Briefcase, ClipboardList, FileText, LayoutTemplate, MessageSquare, Mic, Search, Sparkles, Target, Upload, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

// ── Static data (must live here — icons can't cross server→client boundary) ────

const heroFeaturesData = [
  { label: 'AI career assistant', value: 'Dan helps with CV edits, ATS gaps, job strategy, and interview prep', icon: MessageSquare, color: 'text-primary', bg: 'bg-primary/5' },
  { label: 'Live job search', value: 'Find UK roles and move saved jobs straight into your tracker', icon: Briefcase, color: 'text-secondary', bg: 'bg-secondary/5' },
  { label: 'Interview readiness', value: 'Practise answers, sharpen stories, and prepare for next-stage calls', icon: Mic, color: 'text-accent', bg: 'bg-accent/5' },
];

const featureCardsData = [
  { icon: Upload, title: 'Import your current CV', description: 'Start from your existing CV so the platform can help you iterate faster instead of rebuilding from zero.' },
  { icon: MessageSquare, title: 'Ask Dan, your AI career assistant', description: 'Get help with CV edits, ATS improvements, career direction, role research, and interview preparation from one assistant.' },
  { icon: Search, title: 'Score against real job descriptions', description: 'Run ATS-style analysis to see missing keywords, weak alignment, and where to improve before you apply.' },
  { icon: Briefcase, title: 'Search live jobs inside the workspace', description: 'Discover roles, review job details, save opportunities, and keep your search connected to the CV you are tailoring.' },
  { icon: ClipboardList, title: 'Track applications and follow-ups', description: 'Move roles through saved, started, applied, interviewing, offer, and rejected stages without losing momentum.' },
  { icon: FileText, title: 'Generate tailored cover letters', description: 'Create role-specific cover letters and shorter email versions that stay aligned with your CV and target job.' },
  { icon: Mic, title: 'Prepare for interviews with AI practice', description: 'Generate target-role questions, practise answers, and review feedback before important calls and final rounds.' },
  { icon: LayoutTemplate, title: 'Switch templates without reformatting', description: 'Move between clean, ATS-friendly layouts while keeping the same CV data and section order intact.' },
  { icon: Wand2, title: 'Refine content with AI', description: 'Improve summaries, bullets, and skills with suggestions that stay grounded in a professional CV structure.' },
];

// ── Shared variants ────────────────────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0 },
};

// ── ScrollReveal ───────────────────────────────────────────────────────────────

export function ScrollReveal({
  children,
  className,
  delay = 0,
  direction = 'up',
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  direction?: 'up' | 'left' | 'right' | 'none';
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-8%' });
  const initial = {
    opacity: 0,
    y: direction === 'up' ? 28 : 0,
    x: 0,
  };
  return (
    <motion.div
      ref={ref}
      initial={initial}
      animate={isInView ? { opacity: 1, y: 0, x: 0 } : initial}
      transition={{ duration: 0.65, ease: [0.25, 0.46, 0.45, 0.94], delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ── Card3D ─────────────────────────────────────────────────────────────────────

export function Card3D({
  children,
  className,
  intensity = 7,
}: {
  children: React.ReactNode;
  className?: string;
  intensity?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0.5);
  const y = useMotionValue(0.5);
  const xSpring = useSpring(x, { stiffness: 200, damping: 26 });
  const ySpring = useSpring(y, { stiffness: 200, damping: 26 });
  const rotateX = useTransform(ySpring, [0, 1], [intensity, -intensity]);
  const rotateY = useTransform(xSpring, [0, 1], [-intensity, intensity]);
  const scale = useSpring(1, { stiffness: 260, damping: 25 });
  const [is3DEnabled, setIs3DEnabled] = useState(false);

  useEffect(() => {
    const query = window.matchMedia('(hover: hover) and (pointer: fine) and (min-width: 768px)');
    const sync = () => setIs3DEnabled(query.matches);
    sync();
    query.addEventListener('change', sync);
    return () => query.removeEventListener('change', sync);
  }, []);

  return (
    <div style={{ perspective: '900px' }} className={className}>
      <motion.div
        ref={ref}
        onMouseMove={(e) => {
          if (!is3DEnabled) return;
          const rect = ref.current?.getBoundingClientRect();
          if (!rect) return;
          x.set((e.clientX - rect.left) / rect.width);
          y.set((e.clientY - rect.top) / rect.height);
          scale.set(1.025);
        }}
        onMouseLeave={() => {
          if (!is3DEnabled) return;
          x.set(0.5);
          y.set(0.5);
          scale.set(1);
        }}
        style={is3DEnabled ? { rotateX, rotateY, scale, transformStyle: 'preserve-3d' } : { transformStyle: 'preserve-3d' }}
        className="h-full"
      >
        {children}
      </motion.div>
    </div>
  );
}

// ── FloatingOrbs ───────────────────────────────────────────────────────────────

export function FloatingOrbs() {
  const orbs = [
    { size: 640, x: -8, y: 2, color: 'rgba(85,60,255,0.1)', dur: 20, delay: 0 },
    { size: 460, x: 70, y: -6, color: 'rgba(0,102,255,0.08)', dur: 24, delay: -7 },
    { size: 380, x: 80, y: 66, color: 'rgba(130,90,255,0.07)', dur: 28, delay: -14 },
    { size: 280, x: 18, y: 76, color: 'rgba(85,60,255,0.05)', dur: 22, delay: -10 },
  ];
  return (
    <div className="pointer-events-none absolute inset-0 hidden overflow-hidden sm:block" aria-hidden="true">
      {orbs.map((orb, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: orb.size,
            height: orb.size,
            left: `${orb.x}%`,
            top: `${orb.y}%`,
            background: `radial-gradient(circle, ${orb.color}, transparent 70%)`,
            filter: 'blur(70px)',
            translateX: '-50%',
            translateY: '-50%',
          }}
          animate={{ x: ['0%', '5%', '-3%', '2%', '0%'], y: ['0%', '-4%', '7%', '-2%', '0%'], scale: [1, 1.1, 0.94, 1.06, 1] }}
          transition={{ duration: orb.dur, delay: orb.delay, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
}

// ── ATS score badge ────────────────────────────────────────────────────────────

function AtsScoreBadge() {
  const [score, setScore] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, 92, {
      duration: 1.6,
      ease: 'easeOut',
      onUpdate: (v) => setScore(Math.round(v)),
    });
    return controls.stop;
  }, [inView]);

  return (
    <motion.div
      ref={ref}
      className="absolute -bottom-6 -left-4 hidden max-w-[280px] rounded-[1.6rem] border border-white/80 bg-white/92 p-4 shadow-[0_24px_50px_-34px_rgba(15,23,42,0.5)] backdrop-blur md:block"
      initial={{ opacity: 0, x: -24, y: 8 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ duration: 0.7, delay: 1.0, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <div className="flex items-center justify-between">
        <p className="text-[0.68rem] font-bold uppercase tracking-[0.14em] text-muted-foreground sm:tracking-[0.22em]">
          Live ATS result
        </p>
        <span className="rounded-full bg-secondary/10 px-2.5 py-1 text-xs font-semibold text-secondary">
          {score}% match
        </span>
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
        <motion.div
          className="h-full rounded-full bg-secondary"
          initial={{ width: '0%' }}
          animate={inView ? { width: '92%' } : { width: '0%' }}
          transition={{ duration: 1.6, delay: 1.0, ease: [0.25, 0.46, 0.45, 0.94] }}
        />
      </div>
      <p className="mt-3 text-sm leading-relaxed text-primary">
        Strong relevance for product, design, and cross-functional collaboration keywords.
      </p>
    </motion.div>
  );
}

// ── HeroSection ────────────────────────────────────────────────────────────────

function DeferredHeroVideo() {
  const [shouldLoadVideo, setShouldLoadVideo] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setShouldLoadVideo(true), 2500);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div className="relative aspect-video w-full overflow-hidden">
      <Image
        src="/dashboard-preview.jpg"
        alt="AI Career Guide product workspace showing the CV builder, ATS checker, and career tools"
        fill
        priority
        sizes="(max-width: 1024px) 100vw, 65vw"
        className={cn(
          "object-cover transition-opacity duration-500",
          shouldLoadVideo && "opacity-0"
        )}
      />
      {shouldLoadVideo ? (
        <video
          className="absolute inset-0 h-full w-full object-cover"
          src="/app-action-video.mp4"
          aria-label="AI Career Guide product demo showing the CV builder, ATS checker, and career workspace"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
        />
      ) : null}
    </div>
  );
}

export function HeroSection() {
  const features = heroFeaturesData;
  const heroRef = useRef<HTMLElement>(null);
  const [isDesktopMotion, setIsDesktopMotion] = useState(false);
  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);
  const mxSpring = useSpring(mouseX, { stiffness: 80, damping: 32 });
  const mySpring = useSpring(mouseY, { stiffness: 80, damping: 32 });
  const dashRotX = useTransform(mySpring, [0, 1], [2.5, -2.5]);
  const dashRotY = useTransform(mxSpring, [0, 1], [-4, 4]);

  useEffect(() => {
    const query = window.matchMedia('(min-width: 768px)');
    const sync = () => setIsDesktopMotion(query.matches);
    sync();
    query.addEventListener('change', sync);
    return () => query.removeEventListener('change', sync);
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDesktopMotion) return;
      const rect = heroRef.current?.getBoundingClientRect();
      if (!rect) return;
      mouseX.set((e.clientX - rect.left) / rect.width);
      mouseY.set((e.clientY - rect.top) / rect.height);
    },
    [isDesktopMotion, mouseX, mouseY]
  );

  const staggerParent = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.13 } },
  };
  const item = {
    hidden: { opacity: 0, y: 28 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] } },
  };

  return (
    <section
      ref={heroRef}
      onMouseMove={handleMouseMove}
      className="relative overflow-hidden pb-10 pt-8 sm:pb-28 sm:pt-24"
    >
      <FloatingOrbs />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_14%_16%,rgba(85,60,255,0.14),transparent_30%),radial-gradient(circle_at_82%_18%,rgba(0,102,255,0.12),transparent_26%),radial-gradient(circle_at_84%_82%,rgba(130,90,255,0.09),transparent_24%),linear-gradient(180deg,rgba(255,255,255,0)_0%,rgba(255,255,255,0.35)_100%)]" />
      <motion.div
        className="absolute right-[-14%] top-[-6%] hidden h-[30rem] w-[30rem] rounded-full bg-[radial-gradient(circle,rgba(15,23,42,0.22),transparent_64%)] blur-3xl sm:block"
        animate={{ x: ['0%', '-4%', '0%'], y: ['0%', '5%', '0%'], scale: [1, 1.05, 1] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute left-[-12%] bottom-[-12%] hidden h-[26rem] w-[26rem] rounded-full bg-[radial-gradient(circle,rgba(8,145,178,0.12),transparent_62%)] blur-3xl sm:block"
        animate={{ x: ['0%', '4%', '0%'], y: ['0%', '-5%', '0%'], scale: [1, 1.08, 1] }}
        transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut' }}
      />

      <div className="app-shell relative z-10 space-y-5 sm:space-y-10">
        <motion.div className="mx-auto max-w-5xl space-y-4 text-center sm:space-y-6" initial="hidden" animate="visible" variants={staggerParent}>
          <motion.div variants={item}>
            <div className="eyebrow-chip mx-auto w-fit">AI CV builder for UK job seekers</div>
            <div className="sr-only">AI CV builder, free CV editor, AI career assistant, free ATS checker, cover letter generator, interview prep, live job search, and job search tracker.</div>
          </motion.div>

          <motion.div variants={item} className="space-y-3 sm:space-y-5">
            <h1 className="font-display mx-auto max-w-5xl pb-[0.08em] text-center text-[2.18rem] font-semibold leading-[0.94] tracking-[-0.045em] min-[390px]:text-[2.35rem] sm:pb-[0.1em] sm:text-5xl sm:leading-[0.93] sm:tracking-[-0.07em] lg:text-[5.4rem]">
              <span className="headline-glossy-black">Build a stronger CV.</span>
              <span className="headline-gradient-vivid block">Match more jobs.</span>
              <span className="block headline-glossy-black">Apply with confidence.</span>
            </h1>
            <p className="mx-auto max-w-3xl text-[0.98rem] leading-7 text-muted-foreground sm:text-[1.22rem] sm:leading-8 font-light">
              Create, improve and tailor your CV with AI, check its ATS fit and manage your applications from one connected career workspace.
            </p>
            <p className="mx-auto hidden max-w-2xl text-sm font-semibold leading-6 text-primary/72 sm:block sm:text-[0.98rem]">
              The preview below is built to feel like the real editor: live section editing, assistant actions, export controls, and ATS feedback in one workspace.
            </p>
          </motion.div>

          <motion.div variants={item} className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <Button size="lg" className="w-full sm:w-auto px-10 py-6 text-base shadow-lg shadow-primary/20" asChild>
              <Link href="/signup?intent=create-cv">Build My CV Free</Link>
            </Button>
            <Button size="lg" variant="outline" className="w-full sm:w-auto px-10 py-6 text-base bg-white/60 hover:bg-white/80 backdrop-blur-sm" asChild>
              <Link href="/signup?intent=upload-cv">Upload My CV</Link>
            </Button>
          </motion.div>

          <motion.div variants={item} className="text-xs text-muted-foreground/80 font-medium pt-1">
            Free plan available.
          </motion.div>

          <motion.div variants={item} className="hidden flex-wrap justify-center gap-2 text-sm font-medium text-muted-foreground sm:flex">
            <Link href="/cv-builder" className="rounded-full border border-border/70 bg-white/80 px-3 py-1.5 transition-colors hover:text-primary">
              Explore CV Builder
            </Link>
            <Link href="/ats-cv-checker" className="rounded-full border border-border/70 bg-white/80 px-3 py-1.5 transition-colors hover:text-primary">
              Explore ATS Checker
            </Link>
            <Link href="/cv-templates" className="rounded-full border border-border/70 bg-white/80 px-3 py-1.5 transition-colors hover:text-primary">
              Browse CV Templates
            </Link>
            <Link href="/signup" className="rounded-full border border-border/70 bg-white/80 px-3 py-1.5 transition-colors hover:text-primary">
              Try AI Assistant
            </Link>
            <Link href="/guides" className="rounded-full border border-border/70 bg-white/80 px-3 py-1.5 transition-colors hover:text-primary">
              Read CV Guides
            </Link>
          </motion.div>
        </motion.div>

        <div className="grid min-w-0 items-start gap-6 lg:grid-cols-[minmax(0,1.1fr)_20rem] xl:grid-cols-[minmax(0,1.12fr)_22rem]">
          <div className="min-w-0" style={{ perspective: isDesktopMotion ? '1100px' : 'none' }}>
            <motion.div
              data-hero-preview
              className="relative min-w-0"
              initial={{ opacity: 0, y: 44, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.9, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.15 }}
              style={isDesktopMotion ? { rotateX: dashRotX, rotateY: dashRotY, transformStyle: 'preserve-3d' } : { transformStyle: 'preserve-3d' }}
            >
              <div className="relative min-w-0 overflow-hidden rounded-[1.4rem] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.82)_0%,rgba(246,248,252,0.96)_100%)] p-1.5 shadow-[0_35px_100px_-68px_rgba(15,23,42,0.45)] backdrop-blur-xl sm:rounded-[2rem] sm:p-4 sm:shadow-[0_55px_140px_-72px_rgba(15,23,42,0.45)]">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(103,58,183,0.09),transparent_26%),radial-gradient(circle_at_82%_80%,rgba(255,152,0,0.1),transparent_28%)]" />
                <div className="absolute inset-x-10 top-0 h-24 bg-[radial-gradient(circle,rgba(255,255,255,0.85),transparent_70%)] blur-3xl" />
                <div className="relative overflow-hidden rounded-[1.35rem] border border-white/90 bg-slate-950">
                  <DeferredHeroVideo />
                </div>
              </div>
            </motion.div>
          </div>

          <motion.div variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.1 } } }} initial="hidden" animate="visible" className="hidden gap-4 sm:grid sm:grid-cols-3 lg:grid-cols-1">
            {features.map((feat) => (
              <motion.div key={feat.label} variants={fadeUp} className="h-full">
                <Card3D intensity={9} className="h-full">
                  <div className="canva-block group cursor-pointer h-full px-4 py-6 sm:px-6 shadow-sm">
                    <div className="flex items-center justify-between mb-5">
                      <p className="text-[0.6rem] font-black uppercase tracking-[0.24em] text-muted-foreground/60">{feat.label}</p>
                      <motion.div
                        className={cn('flex h-10 w-10 items-center justify-center rounded-2xl bg-white shadow-card', feat.color)}
                        whileHover={{ scale: 1.18, rotate: 8 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 14 }}
                      >
                        <feat.icon className="h-5 w-5" />
                      </motion.div>
                    </div>
                    <p className="relative z-10 text-[1.05rem] font-bold leading-7 text-slate-900 group-hover:text-primary transition-colors duration-300">
                      {feat.value}
                    </p>
                    <div className={cn('absolute -bottom-6 -right-6 h-24 w-24 rounded-full blur-3xl opacity-0 transition-opacity duration-700 group-hover:opacity-40', feat.bg)} />
                  </div>
                </Card3D>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ── TrustedWorkflowSection ─────────────────────────────────────────────────────

export type WorkflowValueItem = { label: string; value: string };

export function TrustedWorkflowSection({ items }: { items: WorkflowValueItem[] }) {
  return (
    <section className="pb-14 sm:pb-24">
      <div className="app-shell">
        <ScrollReveal>
          <div className="section-shell grid gap-5 px-4 py-5 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-10">
            <div className="space-y-3">
              <p className="eyebrow-chip w-fit">Trusted workflow</p>
              <h2 className="font-display text-[1.85rem] font-semibold tracking-tight text-primary sm:text-4xl">
                From assistant guidance to interview prep, the whole search stays connected.
              </h2>
              <p className="text-[0.92rem] leading-6 text-muted-foreground">
                The product is structured so every next step is obvious: ask Dan for direction, build a master CV, improve it against real jobs, save opportunities, create cover letters, and prepare for interviews.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {items.map((item, i) => (
                <ScrollReveal key={item.label} delay={0.1 + i * 0.09}>
                  <Card3D intensity={5} className="h-full">
                    <div className="h-full rounded-2xl bg-card p-4">
                      <p className="text-[0.6rem] font-bold uppercase tracking-[0.14em] text-muted-foreground sm:tracking-[0.22em]">{item.label}</p>
                      <p className="mt-2 text-[0.92rem] font-bold leading-6 text-primary">{item.value}</p>
                    </div>
                  </Card3D>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

// ── WorkflowSection ────────────────────────────────────────────────────────────

export type WorkflowStep = { step: string; title: string; description: string };

export function WorkflowSection({ steps }: { steps: WorkflowStep[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-15%' });

  return (
    <section id="workflow" className="scroll-mt-24 pb-14 sm:pb-24">
      <div className="app-shell grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <ScrollReveal>
          <div className="space-y-3">
            <p className="eyebrow-chip w-fit">How it works</p>
            <h2 className="font-display text-[1.8rem] font-semibold tracking-tight text-primary sm:text-4xl">
              A cleaner workflow for moving from CV draft to interview-ready.
            </h2>
            <p className="max-w-xl text-[0.92rem] leading-6 text-muted-foreground">
              Instead of juggling separate tools, the app keeps CV editing, assistant guidance, ATS refinement, job discovery, cover letters, and interview prep close together.
            </p>
            <div className="pt-2">
              <Button asChild>
                <Link href="/signup">Start building your CV <ArrowRight className="h-4 w-4" /></Link>
              </Button>
            </div>
          </div>
        </ScrollReveal>

        <div ref={ref} className="grid gap-3">
          {steps.map((step, i) => (
            <motion.div
              key={step.step}
              initial={{ opacity: 0, y: 18 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 }}
              transition={{ duration: 0.55, delay: i * 0.14, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              <Card3D intensity={4}>
                <div className="surface-card px-4 py-4 sm:px-7">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                    <motion.div
                      className="font-display text-[2.2rem] font-semibold tracking-[-0.08em] text-secondary/35 select-none"
                      initial={{ opacity: 0, scale: 0.3 }}
                      animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.3 }}
                      transition={{ duration: 0.5, delay: 0.22 + i * 0.14, type: 'spring', stiffness: 220 }}
                    >
                      {step.step}
                    </motion.div>
                    <div className="space-y-1.5">
                      <h3 className="text-[1.04rem] font-bold text-primary">{step.title}</h3>
                      <p className="text-[0.88rem] leading-6 text-muted-foreground sm:text-base">{step.description}</p>
                    </div>
                  </div>
                </div>
              </Card3D>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── PlatformFeaturesSection ────────────────────────────────────────────────────

export function PlatformFeaturesSection() {
  const features = featureCardsData;
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-10%' });

  return (
    <section id="platform" className="scroll-mt-24 pb-16 sm:pb-24">
      <div className="app-shell space-y-8 sm:space-y-10">
        <ScrollReveal>
          <div className="max-w-3xl space-y-3 sm:space-y-4">
            <p className="eyebrow-chip w-fit">Platform</p>
            <h2 className="font-display text-[1.9rem] font-semibold tracking-tight text-primary sm:text-4xl">
              More than a CV builder: a full career workspace.
            </h2>
            <p className="text-[0.95rem] leading-relaxed text-muted-foreground sm:text-base">
              The product keeps the essentials together: CV editing, Dan the AI assistant, ATS validation, live job search, cover letter generation, application tracking, and interview preparation.
            </p>
            <div className="pt-2">
              <Button variant="outline" asChild>
                <Link href="/guides">Explore guides and tools <ArrowRight className="h-4 w-4" /></Link>
              </Button>
            </div>
          </div>
        </ScrollReveal>

        <div ref={ref} className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 36 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 36 }}
              transition={{ duration: 0.55, delay: i * 0.09, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="h-full"
            >
              <Card3D intensity={6} className="h-full">
                <Card className="group border border-border/70 bg-white/88 h-full">
                  <CardContent className="space-y-4 p-5 sm:p-7">
                    <motion.div
                      className="icon-orb h-14 w-14 text-primary"
                      whileHover={{ scale: 1.12, rotate: 6 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 14 }}
                    >
                      <feature.icon className="h-5 w-5" />
                    </motion.div>
                    <div className="space-y-2">
                      <h3 className="font-display text-[1.02rem] font-semibold text-primary sm:text-[1.2rem]">{feature.title}</h3>
                      <p className="text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
                    </div>
                  </CardContent>
                </Card>
              </Card3D>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── BuiltForConfidenceSection ──────────────────────────────────────────────────

export function BuiltForConfidenceSection({ checkItems }: { checkItems: string[] }) {
  return (
    <section className="pb-16 sm:pb-24">
      <div className="app-shell">
        <ScrollReveal>
          <div className="surface-card grid gap-6 overflow-hidden px-4 py-6 sm:px-8 sm:py-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div className="space-y-4 sm:space-y-5">
              <p className="eyebrow-chip w-fit">Built for confidence</p>
              <h2 className="font-display text-[1.9rem] font-semibold tracking-tight text-primary sm:text-4xl">
                Sharper CVs, better signals, and fewer dead ends.
              </h2>
              <p className="text-[0.95rem] leading-relaxed text-muted-foreground sm:text-base">
                The editor, assistant, ATS checks, jobs, tracker, cover letters, and interview prep are built to feel like one coherent product, so users always have a next step and a way back.
              </p>
              <div className="grid gap-3">
                {checkItems.map((item, i) => (
                  <motion.div
                    key={item}
                    className="flex items-start gap-3"
                    initial={{ opacity: 0, x: -18 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.45, delay: i * 0.1 }}
                  >
                    <motion.div
                      className="mt-0.5 h-4 w-4 shrink-0 rounded-full bg-secondary/15 flex items-center justify-center"
                      whileInView={{ scale: [0, 1.3, 1] }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: i * 0.1 + 0.15 }}
                    >
                      <div className="h-1.5 w-1.5 rounded-full bg-secondary" />
                    </motion.div>
                    <p className="text-sm leading-relaxed text-primary">{item}</p>
                  </motion.div>
                ))}
              </div>
            </div>
            <motion.div
              className="overflow-hidden rounded-[1.4rem] border border-border/70 bg-white/85 p-3 sm:rounded-[1.8rem] sm:p-4"
              whileHover={{ scale: 1.015 }}
              transition={{ type: 'spring', stiffness: 200, damping: 26 }}
              style={{ perspective: '800px' }}
            >
              <Image
                src="/resume-preview.jpg"
                alt="Professional CV Preview"
                width={1200}
                height={1600}
                sizes="(max-width: 1024px) 100vw, 42vw"
                className="h-auto w-full rounded-[1.2rem] object-cover"
              />
            </motion.div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

// ── TestimonialsSection ────────────────────────────────────────────────────────

// ── CtaSection ─────────────────────────────────────────────────────────────────

export function CtaSection() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-10%' });

  return (
    <section className="pb-16 sm:pb-24">
      <div className="app-shell">
        <motion.div
          ref={ref}
          className="relative overflow-hidden rounded-[1.8rem] px-5 py-8 text-white shadow-[0_40px_100px_-52px_rgba(85,60,255,0.3)] sm:px-10 sm:py-14 sm:rounded-[2.4rem] brand-gradient-bg border border-white/10"
          initial={{ opacity: 0, y: 36, scale: 0.97 }}
          animate={isInView ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 36, scale: 0.97 }}
          transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          {/* Floating particles */}
          {Array.from({ length: 7 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full bg-white/10 backdrop-blur-sm"
              style={{ width: 26 + i * 16, height: 26 + i * 16, left: `${8 + i * 13}%`, top: `${14 + (i % 3) * 28}%` }}
              animate={{ y: [-12, 12, -12], x: [-5, 5, -5], scale: [1, 1.25, 1], opacity: [0.2, 0.5, 0.2] }}
              transition={{ duration: 3.5 + i * 0.7, repeat: Infinity, ease: 'easeInOut', delay: i * 0.45 }}
            />
          ))}

          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center lg:gap-8 relative z-10">
            <motion.div
              className="space-y-3 sm:space-y-4"
              initial={{ opacity: 0, x: -24 }}
              animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -24 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <p className="text-[0.68rem] font-bold uppercase tracking-[0.24em] text-white/72">Ready when you are</p>
              <h2 className="font-display max-w-3xl text-[2.1rem] font-semibold tracking-tight sm:text-5xl">
                Build the version of your career story that actually gets read.
              </h2>
              <p className="max-w-2xl text-[0.95rem] leading-relaxed text-white/72 sm:text-lg">
                Create your account, complete onboarding, and choose whether to upload an existing CV or start from scratch in the AI-guided editor.
              </p>
            </motion.div>
            <motion.div
              className="flex flex-col gap-3 sm:flex-row lg:flex-col"
              initial={{ opacity: 0, x: 24 }}
              animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 24 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <Button variant="secondary" size="lg" asChild className="bg-white text-primary hover:bg-white/95 shadow-md">
                <Link href="/signup?intent=create-cv">Build My CV Free</Link>
              </Button>
              <Button variant="outline" size="lg" asChild className="border-white/20 bg-white/10 text-white hover:bg-white/15">
                <Link href="/login">Log in</Link>
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
