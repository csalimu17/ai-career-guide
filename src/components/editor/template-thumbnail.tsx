"use client"

import { useCallback, useEffect, useRef, useState } from "react"

import { ResumeTemplate } from "@/components/editor/resume-template"
import { buildTemplatePreviewResume, getTemplatePresetStyles, type TemplateConfig } from "@/lib/templates-config"
import { cn } from "@/lib/utils"

const THUMBNAIL_PAGE_WIDTH = 760
const THUMBNAIL_PAGE_HEIGHT = 1120
const THUMBNAIL_INSET = 12

function hexToRgba(hex: string, alpha: number) {
  const normalized = hex.replace("#", "")
  const expanded =
    normalized.length === 3
      ? normalized
          .split("")
          .map((character) => character + character)
          .join("")
      : normalized

  const value = Number.parseInt(expanded, 16)
  const r = (value >> 16) & 255
  const g = (value >> 8) & 255
  const b = value & 255
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

type TemplateThumbnailProps = {
  template: TemplateConfig
  className?: string
  highFidelity?: boolean
  resumeData?: any
}

export function TemplateThumbnail({ template, className, highFidelity = true, resumeData }: TemplateThumbnailProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [fitScale, setFitScale] = useState(template.thumbnail.scale)
  const [isIntersecting, setIsIntersecting] = useState(true)
  const accent = template.defaults.primaryColor
  const scaledWidth = Math.max(THUMBNAIL_PAGE_WIDTH * fitScale, 160)
  const scaledHeight = Math.max(THUMBNAIL_PAGE_HEIGHT * fitScale, 220)

  const computeScale = useCallback(() => {
    const container = containerRef.current
    if (!container) return

    const availableWidth = Math.max(container.clientWidth - THUMBNAIL_INSET * 2, 160)
    const availableHeight = Math.max(container.clientHeight - THUMBNAIL_INSET * 2, 220)
    const nextScale = Math.min(
      availableWidth / THUMBNAIL_PAGE_WIDTH,
      availableHeight / THUMBNAIL_PAGE_HEIGHT,
      template.thumbnail.scale
    )

    setFitScale(Number.isFinite(nextScale) ? nextScale : template.thumbnail.scale)
  }, [template.thumbnail.scale])

  useEffect(() => {
    computeScale()

    const observer = new ResizeObserver(() => computeScale())
    if (containerRef.current) {
      observer.observe(containerRef.current)
    }

    return () => observer.disconnect()
  }, [computeScale])

  useEffect(() => {
    const element = containerRef.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsIntersecting(true)
          observer.unobserve(element)
        }
      },
      { rootMargin: "200px" }
    )
    observer.observe(element)

    return () => {
      observer.disconnect()
    }
  }, [])

  const sampleResume = buildTemplatePreviewResume(template.id)

  // Build a rich preview resume for the template thumbnail gallery.
  // We start with sampleResume (which is fully populated with experience, skills, etc.)
  // and overlay any user data that actually has content (name, photo, etc.), while
  // ensuring empty sections fall back to rich sample items so the template always looks full.
  const previewResume = (() => {
    if (!resumeData) return sampleResume;

    const userContent = resumeData.content || {};
    const sampleContent = sampleResume.content || {};

    const userExperience = resumeData.workExperience || userContent.experience;
    const userEducation = resumeData.education || userContent.education;
    const userSkills = resumeData.skills || userContent.skills;
    const userSummary = resumeData.summary || userContent.summary;

    const hasUserExperience = Array.isArray(userExperience) && userExperience.length > 0;
    const hasUserEducation = Array.isArray(userEducation) && userEducation.length > 0;
    const hasUserSkills = Array.isArray(userSkills) && userSkills.length > 0;
    const hasUserSummary = typeof userSummary === "string" && userSummary.trim().length > 10;

    const userName = resumeData.contact?.name || userContent.personal?.name;
    const userTitle = resumeData.contact?.title || userContent.personal?.title;
    const userEmail = resumeData.contact?.email || userContent.personal?.email;
    const userPhone = resumeData.contact?.phone || userContent.personal?.phone;
    const userLocation = resumeData.contact?.location || userContent.personal?.location;
    const userPhoto = resumeData.contact?.photoUrl || userContent.personal?.photoUrl;

    return {
      ...sampleResume,
      templateId: template.id,
      styles: {
        ...getTemplatePresetStyles(template.id),
        ...(resumeData.styles || {}),
      },
      content: {
        ...sampleContent,
        personal: {
          ...sampleContent.personal,
          ...(userName ? { name: userName } : {}),
          ...(userTitle ? { title: userTitle } : {}),
          ...(userEmail ? { email: userEmail } : {}),
          ...(userPhone ? { phone: userPhone } : {}),
          ...(userLocation ? { location: userLocation } : {}),
          ...(userPhoto ? { photoUrl: userPhoto } : {}),
        },
        summary: hasUserSummary ? userSummary : sampleContent.summary,
        experience: hasUserExperience ? userExperience : sampleContent.experience,
        education: hasUserEducation ? userEducation : sampleContent.education,
        skills: hasUserSkills ? userSkills : sampleContent.skills,
      },
    };
  })();

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      role="presentation"
      data-template-cover="full-document"
      className={cn(
        "relative h-full w-full overflow-hidden bg-slate-50",
        className
      )}
    >
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `radial-gradient(circle at top right, ${hexToRgba(accent, 0.16)}, transparent 42%), radial-gradient(circle at bottom left, ${hexToRgba(accent, 0.1)}, transparent 45%), linear-gradient(180deg, rgba(255,255,255,0.98), ${hexToRgba(accent, 0.035)})`,
        }}
      />

      <div
        className="absolute inset-[10px] flex items-center justify-center overflow-hidden rounded-[0.4rem] border bg-white shadow-[0_18px_38px_-18px_rgba(15,23,42,0.25)]"
        style={{ borderColor: hexToRgba(accent, 0.08) }}
      >
        <div
          className="relative shrink-0 overflow-hidden"
          style={{
            width: `${scaledWidth}px`,
            height: `${scaledHeight}px`,
          }}
        >
          {isIntersecting ? (
            <div
              className="origin-top-left"
              style={{
                width: `${THUMBNAIL_PAGE_WIDTH}px`,
                height: `${THUMBNAIL_PAGE_HEIGHT}px`,
                transform: `scale(${fitScale})`,
                transformOrigin: "top left",
              }}
            >
              <ResumeTemplate data={previewResume} mode="thumbnail" className="shadow-none" />
            </div>
          ) : (
            <div className="flex h-full w-full flex-col justify-between p-6 bg-white animate-pulse">
              <div className="space-y-4">
                <div className="h-6 w-1/3 bg-slate-200 rounded" />
                <div className="h-4 w-1/2 bg-slate-100 rounded" />
                <div className="space-y-2 pt-8">
                  <div className="h-4 w-full bg-slate-200 rounded" />
                  <div className="h-4 w-5/6 bg-slate-100 rounded" />
                  <div className="h-4 w-4/5 bg-slate-100 rounded" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
