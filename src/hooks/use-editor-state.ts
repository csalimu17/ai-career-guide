
import { useCallback, useEffect, useRef, useState } from "react"
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc, useStorage } from "@/firebase"
import { collection, doc, updateDoc, serverTimestamp, query, orderBy, limit, addDoc, increment, where } from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { toast } from "@/hooks/use-toast"
import { useSearchParams } from "next/navigation"
import { TEMPLATES, TemplateConfig, canAccessTemplate, getTemplateConfig, getTemplatePresetStyles, resolveTemplateId } from "@/lib/templates-config"
import getCroppedImg, { blobToDataURL } from "@/lib/image-utils"
import { getPlanLimits } from "@/lib/plans"
import { plainTextToRichTextHtml, richTextToPlainText } from "@/lib/rich-text"
import { downloadResumePdf } from "@/lib/resume-pdf"
import { buildResumePlainText } from "@/lib/resume-to-text"
import type { AtsOptimizationScoringOutput } from "@/ai/flows/ats-optimization-scoring-flow"
import { enhanceCvContent } from "@/ai/flows/cv-content-enhancement-flow"
import { fetchAuthedJson } from "@/lib/client/fetch-json"
import { classifyCareerRouting, getCareerAgentResponse } from "@/services/CareerRoutingActions"
import { AgentRole, RoutingResult } from "@/services/CareerAgents"
export function useEditorState() {
  const { user } = useUser()
  const db = useFirestore()
  const storage = useStorage()
  const searchParams = useSearchParams()
  
  const requestedTemplateParam = searchParams.get("template")
  const requestedTemplateId = resolveTemplateId(requestedTemplateParam)
  const requestedResumeId = searchParams.get("id")
  const forceNew = searchParams.get("new") === "true"
  const requestedName = searchParams.get("name")

  const [resume, setResume] = useState<any>(null)
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "error">("saved")
  const [isExporting, setIsExporting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isEnhancing, setIsEnhancing] = useState(false)
  const [isSuggestingRoleBullets, setIsSuggestingRoleBullets] = useState<number | null>(null)
  const [roleBulletSuggestions, setRoleBulletSuggestions] = useState<{ index: number; title: string; bullets: string[] } | null>(null)
  const [isGeneratingSummarySuggestions, setIsGeneratingSummarySuggestions] = useState(false)
  const [summarySuggestions, setSummarySuggestions] = useState<string[]>([])
  const [isSuggestingSkills, setIsSuggestingSkills] = useState(false)
  const [skillSuggestions, setSkillSuggestions] = useState<string[]>([])
  const [jobDescription, setJobDescription] = useState("")
  const [atsResult, setAtsResult] = useState<AtsOptimizationScoringOutput | null>(null)
  const [isCropping, setIsCropping] = useState(false)
  const [cropImage, setCropImage] = useState<string | null>(null)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null)
  
  const [routingLogs, setRoutingLogs] = useState<RoutingResult[]>([])
  const [chatMessages, setChatMessages] = useState<{ role: "user" | "assistant", text: string, agent?: AgentRole, reason?: string }[]>([
    { role: "assistant", text: "Hi! I'm your AI Career Advisor. How can I help you today?", agent: "GENERAL" }
  ])
  
  const [history, setHistory] = useState<any[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  
  const requestedTemplateAppliedRef = useRef<string | null>(null)

  const userDocRef = useMemoFirebase(() => {
    if (!db || !user) return null
    return doc(db, "users", user.uid)
  }, [db, user])

  const { data: profile } = useDoc(userDocRef)

  const resumesQuery = useMemoFirebase(() => {
    if (!db || !user) return null
    const resumesRef = collection(db, "users", user.uid, "resumes")
    if (requestedResumeId) {
      return query(resumesRef, where("__name__", "==", requestedResumeId))
    }
    return query(resumesRef, orderBy("updatedAt", "desc"), limit(1))
  }, [db, user, requestedResumeId])

  const { data: resumes, isLoading } = useCollection(resumesQuery)

  const getFirstAvailableTemplateId = useCallback((plan?: string | null) => {
    return TEMPLATES.find((template) => canAccessTemplate(template, plan))?.id ?? TEMPLATES[0].id
  }, [])

  const pushToHistory = useCallback((newResume: any) => {
    setHistory((prev) => {
      const nextHistory = prev.slice(0, historyIndex + 1)
      nextHistory.push(JSON.parse(JSON.stringify(newResume)))
      if (nextHistory.length > 50) nextHistory.shift()
      return nextHistory
    })
    setHistoryIndex((prev) => {
      return Math.min(prev + 1, 49)
    })
  }, [historyIndex])

  const createDefaultResume = useCallback(async () => {
    if (!user || !db) return
    const resumesRef = collection(db, "users", user.uid, "resumes")
    const defaultTemplateId = canAccessTemplate(requestedTemplateId, profile?.plan)
      ? requestedTemplateId
      : getFirstAvailableTemplateId(profile?.plan)
    const defaultTemplate = getTemplateConfig(defaultTemplateId)
    const newResume = {
      userId: user.uid,
      name: requestedName || "My Professional Resume",
      templateId: defaultTemplate.id,
      sectionOrder: ["summary", "experience", "education", "skills", "languages"],
      content: {
        personal: {
          name: profile?.firstName ? `${profile.firstName} ${profile?.lastName || ""}` : user.displayName || "",
          title: "",
          email: user.email || "",
          phone: "",
          location: "",
          linkedin: "",
          website: "",
        },
        summary: "",
        experience: [],
        education: [],
        skills: [],
        languages: [],
        projects: [],
        certifications: [],
      },
      styles: {
        ...getTemplatePresetStyles(defaultTemplate.id),
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }
    
    try {
      const docRef = await addDoc(resumesRef, newResume)
      const freshDoc = { id: docRef.id, ...newResume }
      setResume(freshDoc)
      setHistory([freshDoc])
      setHistoryIndex(0)
    } catch (err) {
      console.error("Failed to create default resume:", err)
      toast({ variant: "destructive", title: "Error", description: "Could not initialize editor." })
    }
  }, [user, db, profile, requestedTemplateId, getFirstAvailableTemplateId, requestedName])

  useEffect(() => {
    if (!isLoading && resumes) {
      if (forceNew && !resume) {
        createDefaultResume()
        return
      }

      if (resumes.length > 0) {
        if (!resume) {
          const initialResume = resumes[0]
          setResume(initialResume)
          setHistory([initialResume])
          setHistoryIndex(0)
        }
      } else if (!resume && !isLoading) {
        createDefaultResume()
      }
    }
  }, [resumes, isLoading, resume, createDefaultResume, forceNew])

  const handleUpdate = useCallback((path: string, value: any, skipHistory = false) => {
    setResume((prev: any) => {
      if (!prev) return prev
      const newData = JSON.parse(JSON.stringify(prev))
      const keys = path.split(".")
      let current = newData
      
      for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i]
        if (!current[key] || typeof current[key] !== "object") {
          current[key] = {}
        }
        current = current[key]
      }
      
      const lastKey = keys[keys.length - 1]
      if (JSON.stringify(current[lastKey]) !== JSON.stringify(value)) {
        current[lastKey] = value
        if (!skipHistory) {
          pushToHistory(newData)
        }
        return newData
      }
      return prev
    })
  }, [pushToHistory])

  const updateStyle = useCallback(
    (styleKey: "primaryColor" | "fontFamily" | "fontSize" | "lineHeight" | "margins", value: string | number) => {
      handleUpdate(`styles.${styleKey}`, value)
    },
    [handleUpdate]
  )

  const resetTemplateStyles = useCallback(() => {
    if (!resume) return
    handleUpdate("styles", { ...getTemplatePresetStyles(resume.templateId) })
    toast({
      title: "Styles reset",
      description: "Template defaults have been restored.",
    })
  }, [handleUpdate, resume])

  const applyTemplate = useCallback(
    (templateId: string) => {
      const template = getTemplateConfig(templateId)

      if (!canAccessTemplate(template, profile?.plan)) {
        toast({
          variant: "destructive",
          title: "Template locked",
          description: `Upgrade to ${template.accessTier} to use ${template.name}.`,
        })
        return
      }

      const nextStyles = { ...getTemplatePresetStyles(template.id) }
      let didApply = false

      setResume((prev: any) => {
        if (!prev) return prev

        const alreadySelected =
          prev.templateId === template.id && JSON.stringify(prev.styles ?? {}) === JSON.stringify(nextStyles)

        if (alreadySelected) {
          return prev
        }

        const nextResume = JSON.parse(JSON.stringify(prev))
        nextResume.templateId = template.id
        nextResume.styles = nextStyles
        didApply = true
        pushToHistory(nextResume)
        return nextResume
      })

      if (didApply) {
        toast({
          title: `${template.name} applied`,
          description: "Template styling has been refreshed.",
        })
      }
    },
    [profile, pushToHistory]
  )

  // Autosave Logic
  useEffect(() => {
    if (!resume || !user || !db || !resume.id) return

    const timer = setTimeout(async () => {
      setSaveStatus("saving")
      try {
        const resumeRef = doc(db, "users", user.uid, "resumes", resume.id)
        await updateDoc(resumeRef, {
          ...resume,
          updatedAt: serverTimestamp(),
        })
        setSaveStatus("saved")
      } catch (err) {
        console.error("Autosave failed:", err)
        setSaveStatus("error")
      }
    }, 2000)

    return () => clearTimeout(timer)
  }, [resume, user, db])

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1
      setResume(JSON.parse(JSON.stringify(history[prevIndex])))
      setHistoryIndex(prevIndex)
    }
  }, [historyIndex, history])

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1
      setResume(JSON.parse(JSON.stringify(history[nextIndex])))
      setHistoryIndex(nextIndex)
    }
  }, [historyIndex, history])

  const incrementUsage = useCallback(async (type: "aiGenerations" | "atsChecks") => {
    if (userDocRef) {
      await updateDoc(userDocRef, {
        [`usage.${type}`]: increment(1),
      })
    }
  }, [userDocRef])

  const checkLimit = useCallback((type: "aiGenerations" | "atsChecks") => {
    const currentUsage = profile?.usage?.[type] || 0
    const plan = profile?.plan || "free"
    const limits = getPlanLimits(plan)
    const actualLimit = type === "atsChecks" ? limits.atsChecks : limits.aiGenerations
    
    if (currentUsage >= actualLimit) {
      toast({
        variant: "destructive",
        title: "Limit Reached",
        description: `Please upgrade your plan for more ${type === "aiGenerations" ? "AI optimizations" : "ATS scans"}.`,
      })
      return false
    }
    return true
  }, [profile])

  const onCropComplete = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }, [])

  const handlePhotoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = () => {
        setCropImage(reader.result as string)
        setIsCropping(true)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleDeletePhoto = async () => {
    if (!resume) return
    handleUpdate("content.personal.photoUrl", "")
    toast({ title: "Photo removed" })
  }

  const processCrop = async () => {
    if (!cropImage || !croppedAreaPixels) return
    setIsUploading(true)
    try {
      const croppedBlob = await getCroppedImg(cropImage, croppedAreaPixels)
      if (croppedBlob && user && storage && resume) {
        const storageRef = ref(storage, `users/${user.uid}/resumes/${resume.id}/photo`)
        await uploadBytes(storageRef, croppedBlob)
        const url = await getDownloadURL(storageRef)
        handleUpdate("content.personal.photoUrl", url)
        setIsCropping(false)
        setCropImage(null)
        toast({ title: "Photo updated" })
      }
    } catch (err) {
      console.error("Photo crop/upload failed:", err)
      toast({ variant: "destructive", title: "Upload Failed" })
    } finally {
      setIsUploading(false)
    }
  }

  const handleDownloadPdf = async () => {
    if (!resume) return
    setIsExporting(true)
    try {
      await downloadResumePdf(resume)
    } finally {
      setIsExporting(false)
    }
  }

  const runAtsCheck = async () => {
    if (!resume || !jobDescription || !checkLimit("atsChecks")) return
    setIsEnhancing(true)
    try {
      const plainText = buildResumePlainText(resume)
      const { result } = await fetchAuthedJson<{ result: AtsOptimizationScoringOutput }>(user, "/api/ats/scan", {
        method: "POST",
        body: JSON.stringify({ cvContent: plainText, jobDescription }),
      })
      setAtsResult(result)
      await incrementUsage("atsChecks")
      toast({ title: "ATS Scan Complete", description: "Optimization suggestions generated." })
    } catch (err) {
      console.error("ATS optimization failed:", err)
      toast({ variant: "destructive", title: "Scan Failed" })
    } finally {
      setIsEnhancing(false)
    }
  }

  const runEnhanceContent = async (section: string, index?: number) => {
    if (!resume || !checkLimit("aiGenerations")) return
    setIsEnhancing(true)
    try {
      // 1. Log Routing Decision (Fixed routing for this action)
      setRoutingLogs(prev => [...prev, { 
        role: "MANAGER", 
        reason: `User requested a rewrite of ${section}${typeof index === "number" ? ` (Item ${index + 1})` : ""}. Routed to Hiring Manager for impact optimization.` 
      }])

      let currentContent = ""
      
      if (section === "summary") {
        currentContent = richTextToPlainText(resume.content.summary)
      } else if (section === "experience" && typeof index === "number") {
        currentContent = richTextToPlainText(resume.content.experience[index].description)
      } else if (section === "projects" && typeof index === "number") {
        currentContent = richTextToPlainText(resume.content.projects[index].description)
      } else if (section === "education" && typeof index === "number") {
        currentContent = richTextToPlainText(resume.content.education[index].description)
      }

      const targetTitle =
        section === "experience" && typeof index === "number"
          ? resume.content.experience[index]?.title
          : undefined
      
      const result = await enhanceCvContent({ 
        action: "rewrite_bullet", 
        targetContent: currentContent || targetTitle || section,
        currentCvContent: buildResumePlainText(resume),
        jobDescription,
        jobTitle: section === "experience" ? targetTitle : undefined,
        preferredOutputFormat: section === "experience" ? "bullets" : "paragraph",
        additionalContext:
          section === "experience" && typeof index === "number"
            ? `${resume.content.experience[index]?.title || "Experience"} at ${resume.content.experience[index]?.company || "current role"}`
            : undefined,
      })

      if (!result.enhancedContent) throw new Error("No content generated")

      const enhancedHtml = plainTextToRichTextHtml(result.enhancedContent)
      
      if (section === "summary") {
        handleUpdate("content.summary", enhancedHtml)
      } else if (section === "experience" && typeof index === "number") {
        const next = [...resume.content.experience]
        next[index] = { ...next[index], description: enhancedHtml }
        handleUpdate("content.experience", next)
      } else if (section === "projects" && typeof index === "number") {
        const next = [...resume.content.projects]
        next[index] = { ...next[index], description: enhancedHtml }
        handleUpdate("content.projects", next)
      } else if (section === "education" && typeof index === "number") {
        const next = [...resume.content.education]
        next[index] = { ...next[index], description: enhancedHtml }
        handleUpdate("content.education", next)
      }
      
      await incrementUsage("aiGenerations")
      toast({
        title: section === "experience" ? "Bullets Rewritten" : "Content Enhanced",
        description: section === "experience"
          ? "AI turned the role into stronger bullet points."
          : "AI has refined your descriptions.",
      })
    } catch (err) {
      console.error("Enhancement failed:", err)
      toast({ variant: "destructive", title: "Enhancement Failed" })
    } finally {
      setIsEnhancing(false)
    }
  }

  const runSummarySuggestions = async () => {
    if (!resume || !checkLimit("aiGenerations")) return
    setIsGeneratingSummarySuggestions(true)
    try {
      const result = await enhanceCvContent({
        action: "suggest_summary_variants",
        targetContent: richTextToPlainText(resume.content.summary) || "Professional summary for " + resume.content.personal.name,
        currentCvContent: buildResumePlainText(resume)
      })
      
      if (result.suggestions) {
        setSummarySuggestions(result.suggestions)
      }
      
      await incrementUsage("aiGenerations")
    } catch (err) {
      console.error("Summary suggestions failed:", err)
      toast({ variant: "destructive", title: "Suggestions Failed" })
    } finally {
      setIsGeneratingSummarySuggestions(false)
    }
  }

  const runSuggestRoleBullets = async (index: number) => {
    if (!resume || !checkLimit("aiGenerations")) return
    const title = resume.content.experience[index]?.title
    if (!title) return

    setIsSuggestingRoleBullets(index)
    try {
      setRoutingLogs(prev => [...prev, { 
        role: "MANAGER", 
        reason: `User requested role bullet suggestions for the title "${title}". Routed to Hiring Manager for impact optimization.` 
      }])

      const result = await enhanceCvContent({
        action: "suggest_role_bullets",
        targetContent: title,
        currentCvContent: buildResumePlainText(resume),
        jobDescription,
        jobTitle: title,
      })
      
      const bullets = (result.suggestions && result.suggestions.length > 0)
        ? result.suggestions
        : result.enhancedContent
          ? result.enhancedContent
              .split(/\r?\n+/)
              .map((line) => line.replace(/^[-•*\d.)\s]+/, "").trim())
              .filter(Boolean)
          : []

      if (bullets.length > 0) {
        setRoleBulletSuggestions({ index, title, bullets })
        toast({ title: "Bullets Ready", description: "Review the AI bullets before applying them." })
      }
      
      await incrementUsage("aiGenerations")
    } catch (err) {
      console.error("Role bullets suggestions failed:", err)
      toast({ variant: "destructive", title: "Suggestions Failed" })
    } finally {
      setIsSuggestingRoleBullets(null)
    }
  }

  const applyRoleBulletSuggestions = async () => {
    if (!resume || !roleBulletSuggestions) return
    const { index, bullets } = roleBulletSuggestions
    const next = [...resume.content.experience]
    next[index] = {
      ...next[index],
      description: plainTextToRichTextHtml(bullets.map((bullet) => `- ${bullet}`).join("\n")),
    }
    handleUpdate("content.experience", next)
    setRoleBulletSuggestions(null)
    toast({ title: "Bullets Applied", description: "The experience block now uses AI bullet points." })
  }

  const dismissRoleBulletSuggestions = () => {
    setRoleBulletSuggestions(null)
  }

  const runSkillSuggestions = async () => {
    if (!resume || !checkLimit("aiGenerations")) return
    setIsSuggestingSkills(true)
    try {
      setRoutingLogs(prev => [...prev, { 
        role: "MANAGER", 
        reason: "User requested skill suggestions. Routed to Hiring Manager for domain expertise optimization." 
      }])

      const result = await enhanceCvContent({
        action: "suggest_skills",
        currentCvContent: buildResumePlainText(resume),
        jobDescription: jobDescription
      })
      
      if (result.suggestions) {
        setSkillSuggestions(result.suggestions)
      }
      
      await incrementUsage("aiGenerations")
      toast({ title: "Skills Suggested", description: "AI identified relevant skills for your profile." })
    } catch (err) {
      console.error("Skill suggestions failed:", err)
      toast({ variant: "destructive", title: "Suggestions Failed" })
    } finally {
      setIsSuggestingSkills(false)
    }
  }

  return {
    resume,
    isLoading,
    handleUpdate,
    handleUndo,
    handleRedo,
    historyIndex,
    historyLength: history.length,
    isExporting,
    handleDownloadPdf,
    saveStatus,
    runEnhanceContent,
    isEnhancing,
    isSuggestingRoleBullets,
    runSuggestRoleBullets,
    roleBulletSuggestions,
    applyRoleBulletSuggestions,
    dismissRoleBulletSuggestions,
    isGeneratingSummarySuggestions,
    summarySuggestions,
    runSummarySuggestions,
    isSuggestingSkills,
    skillSuggestions,
    runSkillSuggestions,
    setSkillSuggestions,
    jobDescription,
    setJobDescription,
    atsResult,
    runAtsCheck,
    applyTemplate,
    updateStyle,
    resetTemplateStyles,
    profile,

    isUploading,
    isCropping,
    setIsCropping,
    cropImage,
    onCropComplete,
    processCrop,
    handlePhotoFileChange,
    handleDeletePhoto,

    setResume,
    routingLogs,
    setRoutingLogs,
    chatMessages,
    setChatMessages,
    sendAdvisoryMessage: async (text: string) => {
      // Shared logic for AI Advisor chat
      const classification = await classifyCareerRouting(text)
      setRoutingLogs(prev => [...prev, classification])
      
      const response = await getCareerAgentResponse(classification.role, text, resume.content)
      setChatMessages(prev => [...prev, 
        { role: "user", text },
        { role: "assistant", text: response, agent: classification.role, reason: classification.reason }
      ])
      return response
    }
  }
}
