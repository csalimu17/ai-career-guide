'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Briefcase,
  CheckCircle2,
  FileDown,
  FileText,
  LayoutTemplate,
  SendHorizontal,
  SlidersHorizontal,
  Sparkles,
  User,
  Wand2,
} from 'lucide-react';

const sections = [
  { label: 'Personal', icon: User },
  { label: 'Summary', icon: Sparkles },
  { label: 'Experience', icon: Briefcase },
  { label: 'Skills', icon: FileText },
];

const studioIcons = [FileText, LayoutTemplate, SlidersHorizontal];

const scenes = [
  {
    activeSection: 'Summary',
    title: 'Senior Product Designer',
    helperTitle: 'Summary suggestions',
    helperText: 'Shifted the opening to focus on product thinking, systems, and delivery impact.',
    ats: 84,
  },
  {
    activeSection: 'Experience',
    title: 'Lead Product Designer',
    helperTitle: 'Experience improved',
    helperText: 'Rewrote bullets with stronger ownership language and clearer measurable outcomes.',
    ats: 90,
  },
  {
    activeSection: 'Skills',
    title: 'Principal Product Designer',
    helperTitle: 'ATS alignment improved',
    helperText: 'Matched role keywords across strategy, research, design systems, and collaboration.',
    ats: 93,
  },
];

export function AnimatedEditorPreview() {
  const [sceneIndex, setSceneIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setSceneIndex((current) => (current + 1) % scenes.length);
    }, 2800);

    return () => window.clearInterval(timer);
  }, []);

  const scene = scenes[sceneIndex];

  return (
    <div className="relative aspect-[16/10] w-full overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-[linear-gradient(180deg,#fcfdff_0%,#f7f9fc_100%)] text-slate-900 shadow-[0_50px_140px_-74px_rgba(15,23,42,0.4)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(103,58,183,0.12),transparent_26%),radial-gradient(circle_at_84%_16%,rgba(33,150,243,0.12),transparent_20%),radial-gradient(circle_at_82%_84%,rgba(255,152,0,0.12),transparent_18%)]" />
      <motion.div
        className="absolute inset-y-0 -left-1/3 w-1/2 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.75)_50%,transparent_100%)] blur-2xl"
        animate={{ x: ['0%', '260%'] }}
        transition={{ duration: 7.5, repeat: Infinity, ease: 'linear' }}
      />

      <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between border-b border-slate-200/70 bg-white/82 px-4 py-3 backdrop-blur-xl sm:px-5">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
          </div>
          <div className="hidden items-center gap-3 sm:flex">
            <div>
              <p className="text-[0.58rem] font-black uppercase tracking-[0.18em] text-slate-400">AI Career Guide</p>
              <p className="text-sm font-semibold text-slate-900">Editor workspace</p>
            </div>
            <div className="h-5 w-px bg-slate-200" />
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-200/70 bg-white/85 px-3 py-1 text-[0.62rem] font-semibold text-slate-500">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Live Sync Active
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden rounded-full bg-orange-500 px-3 py-1.5 text-[0.62rem] font-black uppercase tracking-[0.14em] text-white shadow-[0_14px_28px_-16px_rgba(249,115,22,0.75)] md:inline-flex md:items-center md:gap-2">
            <Wand2 className="h-3.5 w-3.5" />
            AI Assistant
          </span>
          <span className="hidden rounded-full bg-slate-900 px-3 py-1.5 text-[0.62rem] font-black uppercase tracking-[0.14em] text-white lg:inline-flex lg:items-center lg:gap-2">
            <FileDown className="h-3.5 w-3.5" />
            Export PDF
          </span>
          <span className="hidden rounded-full bg-emerald-600 px-3 py-1.5 text-[0.62rem] font-black uppercase tracking-[0.14em] text-white xl:inline-flex xl:items-center xl:gap-2">
            <SendHorizontal className="h-3.5 w-3.5" />
            Push to ATS
          </span>
        </div>
      </div>

      <div className="relative z-10 grid h-full min-w-0 grid-cols-[7.4rem_minmax(0,1fr)] gap-2 p-2 pt-[4.45rem] sm:gap-3 sm:p-4 sm:pt-[5.4rem] md:grid-cols-[4.4rem_12rem_minmax(0,1fr)] lg:grid-cols-[4.4rem_12rem_minmax(0,1.05fr)_minmax(16rem,1fr)]">
        <div className="hidden rounded-[1.5rem] border border-white/85 bg-white/72 px-2 py-3 shadow-[0_22px_46px_-34px_rgba(15,23,42,0.24)] backdrop-blur-sm md:flex md:flex-col md:items-center md:gap-2.5">
          {studioIcons.map((Icon, index) => (
            <motion.div
              key={index}
              className={`flex h-10 w-10 items-center justify-center rounded-[1rem] ${
                index === 0
                  ? 'bg-[linear-gradient(135deg,rgba(103,58,183,0.14),rgba(33,150,243,0.12),rgba(255,152,0,0.16))] text-slate-900 shadow-[0_16px_28px_-20px_rgba(79,70,229,0.35)]'
                  : 'bg-slate-100 text-slate-400'
              }`}
              animate={index === 0 ? { y: [0, -2, 0] } : {}}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Icon className="h-4.5 w-4.5" />
            </motion.div>
          ))}
        </div>

        <div className="min-w-0 rounded-[1.2rem] border border-white/85 bg-white/75 px-2 py-3 shadow-[0_22px_46px_-34px_rgba(15,23,42,0.2)] backdrop-blur-sm sm:rounded-[1.5rem] sm:px-3 sm:py-4">
          <p className="text-[0.5rem] font-black uppercase tracking-[0.12em] text-slate-400 sm:text-[0.58rem] sm:tracking-[0.18em]">Sections</p>
          <div className="mt-2 space-y-1 sm:mt-3 sm:space-y-1.5">
            {sections.map((section) => {
              const active = section.label === scene.activeSection;

              return (
                <motion.div
                  key={section.label}
                  className={`flex items-center gap-1.5 rounded-[0.85rem] border px-1.5 py-2 text-[0.64rem] font-bold sm:gap-2.5 sm:rounded-[0.95rem] sm:px-2.5 sm:py-2.5 sm:text-[0.74rem] ${
                    active
                      ? 'border-primary/12 bg-primary/5 text-primary'
                      : 'border-transparent bg-white/10 text-slate-500'
                  }`}
                  animate={active ? { x: [0, 2, 0] } : { x: 0 }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <div
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-[0.72rem] sm:h-7 sm:w-7 sm:rounded-[0.8rem] ${
                      active ? 'bg-primary text-white shadow-[0_14px_26px_-18px_rgba(79,70,229,0.55)]' : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    <section.icon className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  </div>
                  <span className="truncate">{section.label}</span>
                </motion.div>
              );
            })}
          </div>
        </div>

        <div className="min-w-0 rounded-[1.2rem] border border-white/90 bg-white/88 p-2 shadow-[0_28px_60px_-40px_rgba(15,23,42,0.24)] backdrop-blur-xl sm:rounded-[1.55rem] sm:p-3">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <p className="text-[0.5rem] font-black uppercase tracking-[0.12em] text-slate-400 sm:text-[0.58rem] sm:tracking-[0.16em]">CV Builder</p>
              <p className="mt-1 text-xs font-semibold leading-4 text-slate-900 sm:text-sm sm:leading-5">{scene.title}</p>
            </div>
            <span className="hidden rounded-full bg-slate-100 px-2.5 py-1 text-[0.62rem] font-black uppercase tracking-[0.14em] text-slate-500 sm:inline-flex">
              Auto-saved
            </span>
          </div>

          <div className="mt-2 space-y-2 sm:mt-3 sm:space-y-3">
            <div className="rounded-[0.9rem] bg-slate-50/90 p-2 sm:rounded-[1rem] sm:p-3">
              <div className="mb-2 h-2 w-24 rounded-full bg-slate-300" />
              <div className="h-8 rounded-[0.85rem] bg-white shadow-[inset_0_0_0_1px_rgba(226,232,240,0.95)] sm:h-10 sm:rounded-[0.95rem]" />
            </div>

            <motion.div
              className="rounded-[0.9rem] border bg-[linear-gradient(180deg,rgba(103,58,183,0.04),rgba(255,255,255,0.96))] p-2 sm:rounded-[1rem] sm:p-3"
              animate={{ borderColor: sceneIndex === 0 ? 'rgba(103,58,183,0.22)' : 'rgba(226,232,240,0.95)' }}
              transition={{ duration: 0.35 }}
            >
              <div className="flex items-center justify-between">
                <div className="h-2 w-24 rounded-full bg-slate-300" />
                <span className="text-[0.62rem] font-black uppercase tracking-[0.14em] text-orange-500">Enhanced</span>
              </div>
              <div className="mt-3 space-y-2">
                <motion.div
                  className="h-2.5 rounded-full bg-slate-200"
                  animate={{ width: sceneIndex === 0 ? '88%' : '76%' }}
                  transition={{ duration: 0.55 }}
                />
                <motion.div
                  className="h-2.5 rounded-full bg-slate-200"
                  animate={{ width: sceneIndex === 0 ? '92%' : '86%' }}
                  transition={{ duration: 0.55 }}
                />
                <motion.div
                  className="relative h-2.5 overflow-hidden rounded-full bg-orange-100"
                  animate={{ width: sceneIndex === 0 ? '82%' : sceneIndex === 1 ? '90%' : '74%' }}
                  transition={{ duration: 0.55 }}
                >
                  <motion.div
                    className="absolute inset-y-0 left-0 w-1/3 bg-[linear-gradient(90deg,transparent,rgba(249,115,22,0.48),transparent)]"
                    animate={{ x: ['-120%', '280%'] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  />
                </motion.div>
              </div>
            </motion.div>

            <motion.div
              className="hidden rounded-[1rem] border border-slate-200 bg-white p-3 sm:block"
              animate={{ borderColor: sceneIndex === 1 ? 'rgba(103,58,183,0.2)' : 'rgba(226,232,240,1)' }}
              transition={{ duration: 0.35 }}
            >
              <div className="flex items-center justify-between">
                <div className="h-2 w-20 rounded-full bg-slate-300" />
                <div className="h-2 w-12 rounded-full bg-slate-200" />
              </div>
              <div className="mt-3 space-y-2">
                {[94, sceneIndex === 1 ? 88 : 72, 84].map((width, index) => (
                  <motion.div
                    key={`${width}-${index}`}
                    className={`h-2.5 rounded-full ${index === 1 ? 'bg-violet-100' : 'bg-slate-200'}`}
                    animate={index === 1 ? { width: `${width}%`, opacity: [0.6, 1, 0.6] } : { width: `${width}%` }}
                    transition={{ duration: 1.9, repeat: index === 1 ? Infinity : 0, ease: 'easeInOut' }}
                  />
                ))}
              </div>
            </motion.div>
          </div>
        </div>

        <div className="hidden rounded-[1.55rem] border border-white/90 bg-white/80 p-3 shadow-[0_28px_60px_-40px_rgba(15,23,42,0.22)] backdrop-blur-xl lg:block">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <p className="text-[0.58rem] font-black uppercase tracking-[0.16em] text-slate-400">Preview + AI</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">Resume builder live preview</p>
            </div>
            <motion.span
              className="rounded-full bg-emerald-500/12 px-2.5 py-1 text-[0.62rem] font-black uppercase tracking-[0.14em] text-emerald-600"
              animate={{ opacity: [0.55, 1, 0.55] }}
              transition={{ duration: 1.8, repeat: Infinity }}
            >
              Synced
            </motion.span>
          </div>

          <div className="mt-3 space-y-3">
            <div className="rounded-[1.15rem] bg-slate-50/85 p-3 shadow-[inset_0_0_0_1px_rgba(226,232,240,0.8)]">
              <div className="mx-auto w-[82%] rounded-[0.9rem] bg-white px-4 py-4 shadow-[0_16px_34px_-26px_rgba(15,23,42,0.28)]">
                <div className="border-b border-slate-200 pb-2.5">
                  <div className="h-2.5 w-32 rounded-full bg-slate-900" />
                  <div className="mt-2 h-2 w-24 rounded-full bg-slate-300" />
                </div>
                <div className="mt-3 space-y-2">
                  <div className="h-2 w-16 rounded-full bg-slate-300" />
                  <div className="h-2.5 w-full rounded-full bg-slate-200" />
                  <div className="h-2.5 w-[86%] rounded-full bg-slate-200" />
                  <div className="h-2.5 w-[72%] rounded-full bg-slate-200" />
                </div>
                <div className="mt-4 space-y-2">
                  <div className="h-2 w-14 rounded-full bg-slate-300" />
                  <div className="h-2.5 w-[92%] rounded-full bg-slate-200" />
                  <motion.div
                    className="h-2.5 rounded-full bg-orange-100"
                    animate={{ width: sceneIndex === 2 ? '82%' : '68%' }}
                    transition={{ duration: 0.55 }}
                  />
                  <div className="h-2.5 w-[78%] rounded-full bg-slate-200" />
                </div>
              </div>
            </div>

            <motion.div
              key={scene.helperTitle}
              className="rounded-[1rem] border border-orange-200/80 bg-orange-50/95 p-3"
              initial={{ opacity: 0.45, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
            >
              <div className="flex items-start gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-[0.9rem] bg-orange-500 text-white">
                  <Wand2 className="h-4 w-4" />
                </div>
                <div className="space-y-1">
                  <p className="text-[0.62rem] font-black uppercase tracking-[0.14em] text-orange-600">{scene.helperTitle}</p>
                  <p className="text-sm font-semibold leading-relaxed text-slate-900">{scene.helperText}</p>
                </div>
              </div>
            </motion.div>

            <div className="rounded-[1rem] border border-slate-200 bg-white/92 px-3 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <p className="text-[0.66rem] font-black uppercase tracking-[0.14em] text-slate-500">Live ATS result</p>
                </div>
                <span className="rounded-full bg-secondary/10 px-2.5 py-1 text-[0.7rem] font-black text-secondary">
                  {scene.ats}% match
                </span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                <motion.div
                  className="h-full rounded-full bg-secondary"
                  animate={{ width: `${scene.ats}%` }}
                  transition={{ duration: 0.65, ease: 'easeInOut' }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <motion.div
        className="pointer-events-none absolute z-30 hidden text-slate-900 drop-shadow-[0_10px_20px_rgba(255,255,255,0.95)] md:block"
        animate={{
          left: sceneIndex === 0 ? '49%' : sceneIndex === 1 ? '54%' : '69%',
          top: sceneIndex === 0 ? '56%' : sceneIndex === 1 ? '66%' : '72%',
          scale: [1, 0.96, 1],
        }}
        transition={{ duration: 0.7, ease: 'easeInOut' }}
      >
        <svg width="28" height="32" viewBox="0 0 28 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M3 2L22.5 16.2L14.3 17.4L18.4 28L13.6 30L9.4 19.5L3 25.6V2Z" fill="white" stroke="#0F172A" strokeWidth="1.6" />
        </svg>
      </motion.div>
    </div>
  );
}
