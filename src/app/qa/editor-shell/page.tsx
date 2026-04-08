"use client"

import { useState } from "react"

import { DesktopEditor } from "@/components/editor/DesktopEditor"
import { buildTemplatePreviewResume, getTemplatePresetStyles } from "@/lib/templates-config"

function cloneResume<T>(value: T): T {
  return JSON.parse(JSON.stringify(value))
}

function setByPath(target: Record<string, any>, path: string, value: any) {
  const keys = path.split(".")
  let current: Record<string, any> = target

  for (let index = 0; index < keys.length - 1; index += 1) {
    const key = keys[index]
    if (!current[key] || typeof current[key] !== "object") {
      current[key] = {}
    }
    current = current[key]
  }

  current[keys[keys.length - 1]] = value
}

function createQaResume() {
  const resume = buildTemplatePreviewResume("classic-ats")

  return {
    ...resume,
    content: {
      ...resume.content,
      personal: {
        ...resume.content.personal,
        name: "Charles Salimu",
        title: "Technical Support Engineer",
        email: "csalimu@email.com",
        location: "Bournemouth, England",
      },
      summary:
        "<p>Technical support specialist with strong troubleshooting, customer communication, and operational improvement experience across product, hardware, and service environments.</p>",
      experience: [
        {
          id: "exp-1",
          title: "Technical Support Engineer",
          company: "4com - Bournemouth",
          period: "12/2022 - Current",
          description:
            "<ul><li>Resolved complex customer issues across software, connectivity, and hardware support workflows.</li><li>Documented recurring faults and reduced repeat tickets through clearer internal guidance.</li><li>Collaborated with product and service teams to improve handoff quality and issue visibility.</li></ul>",
        },
        {
          id: "exp-2",
          title: "Technical Support Executive",
          company: "Enjoy - Southampton",
          period: "08/2019 - 11/2022",
          description:
            "<ul><li>Supported retail trials and customer troubleshooting for new technical products.</li><li>Maintained strong communication between customers, sales teams, and service operations.</li><li>Helped improve support consistency with better issue logging and process clarity.</li></ul>",
        },
      ],
      skills: [
        "Technical Troubleshooting",
        "Customer Support",
        "Incident Triage",
        "Knowledge Base Writing",
        "Hardware Diagnostics",
        "Process Improvement",
      ],
    },
  }
}

export default function EditorShellQaPage() {
  const [resume, setResume] = useState<any>(() => createQaResume())
  const [history, setHistory] = useState<any[]>(() => [cloneResume(createQaResume())])
  const [historyIndex, setHistoryIndex] = useState(0)
  const [summarySuggestions, setSummarySuggestions] = useState<string[]>([])

  const pushResume = (nextResume: any) => {
    setResume(nextResume)
    setHistory((previous) => {
      const nextHistory = previous.slice(0, historyIndex + 1)
      nextHistory.push(cloneResume(nextResume))
      return nextHistory.slice(-50)
    })
    setHistoryIndex((previous) => Math.min(previous + 1, 49))
  }

  const handleUpdate = (path: string, value: any) => {
    setResume((previous: any) => {
      const nextResume = cloneResume(previous)
      setByPath(nextResume, path, value)

      setHistory((previousHistory) => {
        const nextHistory = previousHistory.slice(0, historyIndex + 1)
        nextHistory.push(cloneResume(nextResume))
        return nextHistory.slice(-50)
      })
      setHistoryIndex((previousIndex) => Math.min(previousIndex + 1, 49))

      return nextResume
    })
  }

  const handleUndo = () => {
    if (historyIndex <= 0) return
    const nextIndex = historyIndex - 1
    setHistoryIndex(nextIndex)
    setResume(cloneResume(history[nextIndex]))
  }

  const handleRedo = () => {
    if (historyIndex >= history.length - 1) return
    const nextIndex = historyIndex + 1
    setHistoryIndex(nextIndex)
    setResume(cloneResume(history[nextIndex]))
  }

  const applyTemplate = (templateId: string) => {
    const nextResume = cloneResume(resume)
    nextResume.templateId = templateId
    nextResume.styles = {
      ...getTemplatePresetStyles(templateId),
    }
    pushResume(nextResume)
  }

  const updateStyle = (styleKey: "primaryColor" | "fontFamily" | "fontSize" | "lineHeight" | "margins", value: string | number) => {
    handleUpdate(`styles.${styleKey}`, value)
  }

  const resetTemplateStyles = () => {
    handleUpdate("styles", {
      ...getTemplatePresetStyles(resume.templateId),
    })
  }

  const runSummarySuggestions = () => {
    setSummarySuggestions([
      "Technical support engineer known for calm issue handling, strong fault isolation, and dependable communication across customer and internal teams.",
      "Support specialist blending troubleshooting depth with customer empathy, process clarity, and measurable service improvements.",
      "Operations-minded technical support professional with experience improving issue resolution quality and reducing repeat support effort.",
    ])
  }

  const editor = {
    resume,
    handleUpdate,
    handleUndo,
    handleRedo,
    historyIndex,
    historyLength: history.length,
    isExporting: false,
    handleDownloadPdf: () => undefined,
    saveStatus: "saved" as const,
    runEnhanceContent: () => undefined,
    isEnhancing: false,
    isGeneratingSummarySuggestions: false,
    summarySuggestions,
    runSummarySuggestions,
    applyTemplate,
    updateStyle,
    resetTemplateStyles,
    profile: {
      plan: "master",
    },
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6">
        <div>
          <p className="text-[0.68rem] font-black uppercase tracking-[0.22em] text-slate-400">QA Harness</p>
          <h1 className="text-sm font-bold text-slate-900">Desktop editor shell preview</h1>
        </div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">/qa/editor-shell</p>
      </div>

      <DesktopEditor editor={editor} />
    </div>
  )
}
