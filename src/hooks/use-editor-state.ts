
import { useCallback, useEffect, useRef, useState } from "react"
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc, useStorage } from "@/firebase"
import { collection, doc, updateDoc, serverTimestamp, query, orderBy, limit, addDoc, increment, where } from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage"
import { toast } from "@/hooks/use-toast"
import { useSearchParams } from "next/navigation"
import { TEMPLATES, TemplateConfig, canAccessTemplate, getTemplateConfig, getTemplatePresetStyles, resolveTemplateId } from "@/lib/templates-config"
import getCroppedImg, { blobToDataURL } from "@/lib/image-utils"
import { getPlanLimits } from "@/lib/plans"
import { plainTextToRichTextHtml, richTextToPlainText } from "@/lib/rich-text"
import { buildResumePlainText } from "@/lib/resume-to-text"
import { atsOptimizationScoring, type AtsOptimizationScoringOutput } from "@/ai/flows/ats-optimization-scoring-flow"
import { enhanceCvContent } from "@/ai/flows/cv-content-enhancement-flow"
import { fetchAuthedJson } from "@/lib/client/fetch-json"
import { classifyCareerRouting, getCareerAgentResponse } from "@/services/CareerRoutingActions"
import { AgentRole, RoutingResult } from "@/services/CareerAgents"
import { checkGrammar } from "@/lib/grammar-check"

function normalizeResumeDocument(resumeDoc: any) {
  const normalizedResume = JSON.parse(JSON.stringify(resumeDoc))

  if (!Array.isArray(normalizedResume.sectionOrder)) {
    normalizedResume.sectionOrder = []
  }
  if (!normalizedResume.sectionOrder.includes("interests")) {
    normalizedResume.sectionOrder.push("interests")
  }

  if (!normalizedResume.content || typeof normalizedResume.content !== "object") {
    normalizedResume.content = {}
  }
  if (!normalizedResume.content.personal || typeof normalizedResume.content.personal !== "object") {
    normalizedResume.content.personal = {}
  }
  if (!normalizedResume.content.personal.photoUrl && normalizedResume.content.personal.photo) {
    normalizedResume.content.personal.photoUrl = normalizedResume.content.personal.photo
  }
  if (!Array.isArray(normalizedResume.content.interests)) {
    normalizedResume.content.interests = []
  }
  if (!normalizedResume.content.interestsVariant) {
    normalizedResume.content.interestsVariant = "list"
  }
  if (normalizedResume.content.interestsContent === undefined) {
    normalizedResume.content.interestsContent = ""
  }

  return normalizedResume
}

function serializeResumeContent(resumeDoc: any) {
  return JSON.stringify(normalizeResumeDocument(resumeDoc).content)
}

function suggestionToText(suggestion: unknown): string {
  if (typeof suggestion === "string") {
    return suggestion.trim()
  }

  if (typeof suggestion === "number") {
    return String(suggestion)
  }

  if (Array.isArray(suggestion)) {
    return suggestion
      .map(suggestionToText)
      .filter(Boolean)
      .join(" ")
      .trim()
  }

  if (!suggestion || typeof suggestion !== "object") {
    return ""
  }

  const record = suggestion as Record<string, unknown>
  const keys = [
    "text",
    "bullet",
    "content",
    "value",
    "name",
    "skill",
    "interest",
    "suggestion",
    "replacement",
    "message",
  ]

  for (const key of keys) {
    const value = suggestionToText(record[key])
    if (value) return value
  }

  return ""
}

function normalizeSuggestions(suggestions: unknown[]): string[] {
  return suggestions
    .map(suggestionToText)
    .map((suggestion) => suggestion.replace(/^[-•*\d.)\s]+/, "").trim())
    .filter(Boolean)
}

export function useEditorState() {
  const { user, isUserLoading } = useUser()
  const db = useFirestore()
  const storage = useStorage()
  const searchParams = useSearchParams()
  
  const requestedTemplateParam = searchParams.get("template")
  const requestedTemplateId = resolveTemplateId(requestedTemplateParam)
  const requestedResumeId = searchParams.get("id")
  const forceNew = searchParams.get("new") === "true"
  const requestedName = searchParams.get("name")

  const [editorState, setEditorState] = useState<{
    resume: any,
    history: any[],
    index: number
  }>({
    resume: null,
    history: [],
    index: -1
  })

  const resume = editorState.resume
  const historyIndex = editorState.index
  const history = editorState.history
  
  const lastSavedContentRef = useRef<string | null>(null)
  
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
  const [isSuggestingInterests, setIsSuggestingInterests] = useState(false)
  const [interestSuggestions, setInterestSuggestions] = useState<string[]>([])
  const [jobDescription, setJobDescription] = useState("")
  const [atsResult, setAtsResult] = useState<AtsOptimizationScoringOutput | null>(null)
  const [isCropping, setIsCropping] = useState(false)
  const [cropImage, setCropImage] = useState<string | null>(null)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null)
  
  const [routingLogs, setRoutingLogs] = useState<RoutingResult[]>([])
  const [chatMessages, setChatMessages] = useState<{ role: "user" | "assistant", text: string, agent?: AgentRole, reason?: string }[]>([
    { role: "assistant", text: "Hi! I'm your AI Career Advisor. How can I help you today?", agent: "GENERAL" }
  ])

  const [isCheckingGrammarGlobal, setIsCheckingGrammarGlobal] = useState(false)
  const [globalGrammarIssues, setGlobalGrammarIssues] = useState<any[]>([])
  const [hasScannedGrammar, setHasScannedGrammar] = useState(false)

  const pushToHistory = useCallback((newResume: any) => {
    setEditorState(prev => {
      const nextHistory = prev.history.slice(0, prev.index + 1)
      nextHistory.push(JSON.parse(JSON.stringify(newResume)))
      const finalHistory = nextHistory.length > 50 ? nextHistory.slice(1) : nextHistory
      return {
        ...prev,
        history: finalHistory,
        index: finalHistory.length - 1
      }
    })
  }, [])

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

  const { data: resumes, isLoading: isCollectionLoading } = useCollection(resumesQuery)
  const [isCollectionCreating, setIsCollectionCreating] = useState(false)
  const isDataLoading = isUserLoading || isCollectionLoading || isCollectionCreating
  const isLoading = isDataLoading || (!!resumes && resumes.length > 0 && !editorState.resume)


  const getFirstAvailableTemplateId = useCallback((plan?: string | null) => {
    return TEMPLATES.find((template) => canAccessTemplate(template, plan))?.id ?? TEMPLATES[0].id
  }, [])


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
      sectionOrder: ["summary", "experience", "education", "skills", "languages", "projects", "certifications", "interests"],
      content: {
        personal: {
          name: profile?.firstName ? `${profile.firstName} ${profile?.lastName || ""}` : user.displayName || "",
          title: "",
          email: user.email || "",
          phone: "",
          location: "",
          linkedin: "",
          website: "",
          photoUrl: "",
        },
        summary: "",
        experience: [],
        education: [],
        skills: [],
        languages: [],
        projects: [],
        certifications: [],
        interests: [],
      },
      styles: {
        ...getTemplatePresetStyles(defaultTemplate.id),
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }
    
    setIsCollectionCreating(true)
    try {
      const docRef = await addDoc(resumesRef, newResume)
      const freshDoc = { id: docRef.id, ...newResume }
      lastSavedContentRef.current = serializeResumeContent(freshDoc)
      setEditorState({
        resume: freshDoc,
        history: [freshDoc],
        index: 0
      })
    } catch (err) {
      console.error("Failed to create default resume:", err)
      toast({ variant: "destructive", title: "Error", description: "Could not initialize editor." })
    } finally {
      setIsCollectionCreating(false)
    }
  }, [user, db, profile, requestedTemplateId, getFirstAvailableTemplateId, requestedName])

  useEffect(() => {
    if (!isDataLoading && resumes) {
      if (forceNew && !resume) {
        createDefaultResume()
        return
      }

      if (resumes.length > 0) {
        if (!resume) {
          const loadedResume = resumes[0]
          
          // Migration: Ensure interests exists in sectionOrder and content
          const initialResume = normalizeResumeDocument(loadedResume)
          lastSavedContentRef.current = serializeResumeContent(initialResume)
          setEditorState({
            resume: initialResume,
            history: [initialResume],
            index: 0
          })
        }
      } else if (!resume && !isDataLoading) {
        createDefaultResume()
      }
    }
  }, [resumes, isDataLoading, resume, createDefaultResume, forceNew])

  // External Updates Sync (e.g., from AI assistant background edits)
  useEffect(() => {
    if (!isDataLoading && resumes && resumes.length > 0 && resume) {
      const updatedResume = normalizeResumeDocument(resumes[0])
      const dbContentStr = serializeResumeContent(updatedResume)
      const localContentStr = serializeResumeContent(resume)
      
      // If we haven't set a last saved content reference, initialize it
      if (lastSavedContentRef.current === null) {
        lastSavedContentRef.current = dbContentStr
        return
      }

      if (dbContentStr === localContentStr) {
        lastSavedContentRef.current = dbContentStr
        return
      }
      
      if (dbContentStr !== lastSavedContentRef.current) {
        lastSavedContentRef.current = dbContentStr

        setEditorState(prev => ({
          ...prev,
          resume: updatedResume,
          history: [...prev.history.slice(0, prev.index + 1), updatedResume],
          index: prev.index + 1
        }))
      }
    }
  }, [resumes, isDataLoading, resume])

  const handleUpdate = useCallback((path: string, value: any, skipHistory = false) => {
    setEditorState(prevData => {
      const currentResume = prevData.resume
      if (!currentResume) return prevData
      
      const newData = JSON.parse(JSON.stringify(currentResume))
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
        
        if (skipHistory) {
          return { ...prevData, resume: newData }
        }
        
        const nextHistory = prevData.history.slice(0, prevData.index + 1)
        nextHistory.push(JSON.parse(JSON.stringify(newData)))
        const finalHistory = nextHistory.length > 50 ? nextHistory.slice(1) : nextHistory
        
        return {
          resume: newData,
          history: finalHistory,
          index: finalHistory.length - 1
        }
      }
      return prevData
    })
  }, [])

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

      setEditorState(prevData => {
        if (!prevData.resume) return prevData

        const alreadySelected =
          prevData.resume.templateId === template.id && JSON.stringify(prevData.resume.styles ?? {}) === JSON.stringify(nextStyles)

        if (alreadySelected) {
          return prevData
        }

        const nextResume = JSON.parse(JSON.stringify(prevData.resume))
        nextResume.templateId = template.id
        nextResume.styles = nextStyles
        didApply = true
        
        const nextHistory = prevData.history.slice(0, prevData.index + 1)
        nextHistory.push(JSON.parse(JSON.stringify(nextResume)))
        const finalHistory = nextHistory.length > 50 ? nextHistory.slice(1) : nextHistory
        
        return {
          resume: nextResume,
          history: finalHistory,
          index: finalHistory.length - 1
        }
      })

      if (didApply) {
        toast({
          title: `${template.name} applied`,
          description: "Template styling has been refreshed.",
        })
      }
    },
    [profile]
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
        lastSavedContentRef.current = serializeResumeContent(resume)
        setSaveStatus("saved")
      } catch (err) {
        console.error("Autosave failed:", err)
        setSaveStatus("error")
      }
    }, 2000)

    return () => clearTimeout(timer)
  }, [resume, user, db])

  const handleUndo = useCallback(() => {
    setEditorState(prev => {
      if (prev.index > 0) {
        const nextIndex = prev.index - 1
        return {
          ...prev,
          resume: JSON.parse(JSON.stringify(prev.history[nextIndex])),
          index: nextIndex
        }
      }
      return prev
    })
  }, [])

  const handleRedo = useCallback(() => {
    setEditorState(prev => {
      if (prev.index < prev.history.length - 1) {
        const nextIndex = prev.index + 1
        return {
          ...prev,
          resume: JSON.parse(JSON.stringify(prev.history[nextIndex])),
          index: nextIndex
        }
      }
      return prev
    })
  }, [])

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
    e.target.value = ""

    if (!file) return

    if (!file.type.startsWith("image/")) {
      toast({
        variant: "destructive",
        title: "Invalid file",
        description: "Please upload a JPG, PNG, or WebP image.",
      })
      return
    }

    if (file.size > 8 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "Image too large",
        description: "Please upload an image smaller than 8 MB.",
      })
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      setCropImage(reader.result as string)
      setCroppedAreaPixels(null)
      setIsCropping(true)
    }
    reader.readAsDataURL(file)
  }

  const handleDeletePhoto = async () => {
    if (!resume) return
    if (user && storage && resume.id) {
      try {
        await deleteObject(ref(storage, `users/${user.uid}/resumes/${resume.id}/profile-photo.jpg`))
      } catch (err) {
        console.warn("Could not delete stored profile photo:", err)
      }
    }
    handleUpdate("content.personal", {
      ...(resume.content.personal || {}),
      photoUrl: "",
      photo: "",
    })
    toast({ title: "Photo removed" })
  }

  const processCrop = async () => {
    if (!cropImage || !croppedAreaPixels) return
    setIsUploading(true)
    try {
      const croppedBlob = await getCroppedImg(cropImage, croppedAreaPixels, 0, { horizontal: false, vertical: false }, 480)
      if (croppedBlob && user && storage && resume) {
        const storageRef = ref(storage, `users/${user.uid}/resumes/${resume.id}/profile-photo.jpg`)
        await uploadBytes(storageRef, croppedBlob, {
          contentType: "image/jpeg",
          customMetadata: {
            source: "cv-profile-photo",
          },
        })
        const url = await getDownloadURL(storageRef)
        handleUpdate("content.personal", {
          ...(resume.content.personal || {}),
          photoUrl: url,
          photo: "",
        })
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

  const handleDownloadPdf = () => {
    if (!resume) return
    setIsExporting(true)

    const exportKey = `resume-export-${Date.now()}`
    try {
      window.localStorage.setItem(exportKey, JSON.stringify(resume))
    } catch (storageError) {
      // localStorage can throw in private mode / quota exceeded. Fall back to
      // sessionStorage, which the print page also reads.
      try {
        window.sessionStorage.setItem(exportKey, JSON.stringify(resume))
      } catch {
        // If both stores fail we still navigate — the print page will
        // re-fetch from Firestore using the resume id.
      }
    }

    const isMobile =
      typeof window !== "undefined" &&
      /Android|iPhone|iPad|iPod|Mobile/i.test(window.navigator.userAgent)

    if (isMobile) {
      // Mobile browsers heavily restrict window.open(_blank) — it often
      // returns null or opens an invisible background tab, so the user
      // sees nothing happen. Navigate the current tab to the print page
      // with autoprint=1 so it triggers Save-as-PDF on arrival.
      window.location.href = `/print/resume/${resume.id}?exportKey=${exportKey}&autoprint=1`
      // Leave isExporting=true; this tab is unloading.
      return
    }

    const printUrl = `/print/resume/${resume.id}?exportKey=${exportKey}`
    const printWindow = window.open(printUrl, "_blank")
    if (!printWindow) {
      // Popup blocked on desktop — fall back to same-tab navigation with
      // autoprint so the user still gets the print dialog automatically.
      window.location.href = `${printUrl}&autoprint=1`
      return
    }

    setIsExporting(false)
  }

  const runAtsCheck = async () => {
    if (!resume || !jobDescription || !checkLimit("atsChecks")) return
    setIsEnhancing(true)
    try {
      setRoutingLogs(prev => [...prev, { 
        role: "RECRUITER", 
        reason: "ATS intelligence scan initiated. Comparing current CV structure and keywords against Job Goal description." 
      }])
      
      const result = await atsOptimizationScoring({
        cvContent: buildResumePlainText(resume),
        jobDescription: jobDescription
      })
      
      setAtsResult(result)
      await incrementUsage("atsChecks")
      toast({ title: "ATS Scan Complete", description: `Your match score is ${Math.round(result.totalScore)}%` })
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
      } else if (section === "certifications" && typeof index === "number") {
        const next = [...resume.content.certifications]
        next[index] = { ...next[index], description: enhancedHtml }
        handleUpdate("content.certifications", next)
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

  const runSummarySuggestions = async (style?: 'professional' | 'short' | 'impact' | 'long') => {
    if (!resume || !checkLimit("aiGenerations")) return
    setIsGeneratingSummarySuggestions(true)
    try {
      const result = await enhanceCvContent({
        action: "suggest_summary_variants",
        targetContent: richTextToPlainText(resume.content.summary) || "Professional summary for " + resume.content.personal.name,
        currentCvContent: buildResumePlainText(resume),
        summaryStyle: style
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
    const exp = resume.content.experience[index]
    const title = exp?.title
    if (!title) return

    const company = exp?.company || ""
    const existingDesc = richTextToPlainText(exp?.description || "")
    const dateRange = [exp?.startDate, exp?.endDate].filter(Boolean).join(" – ")

    // Build rich additional context so the AI knows the seniority, company, and industry
    const additionalContext = [
      company && `Company: ${company}`,
      dateRange && `Tenure: ${dateRange}`,
      existingDesc && `Existing description to improve upon:\n${existingDesc}`,
    ].filter(Boolean).join("\n")

    setIsSuggestingRoleBullets(index)
    try {
      setRoutingLogs(prev => [...prev, { 
        role: "MANAGER", 
        reason: `User requested role bullet suggestions for "${title}"${company ? ` at ${company}` : ""}. Routed to Hiring Manager for impact optimization.` 
      }])

      const result = await enhanceCvContent({
        action: "suggest_role_bullets",
        targetContent: title,
        currentCvContent: buildResumePlainText(resume),
        jobDescription,
        jobTitle: title,
        additionalContext,
      })
      
      const rawSuggestions = (result.suggestions && result.suggestions.length > 0)
        ? result.suggestions
        : result.enhancedContent
          ? result.enhancedContent
              .split(/\r?\n+/)
              .map((line) => line.replace(/^[-•*\d.)\s]+/, "").trim())
              .filter(Boolean)
          : []
      const bullets = normalizeSuggestions(rawSuggestions)

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

  const applyRoleBulletSuggestions = async (bulletsToApply?: string[]) => {
    if (!resume || !roleBulletSuggestions) return
    const { index, bullets } = roleBulletSuggestions
    const selected = bulletsToApply && bulletsToApply.length > 0 ? bulletsToApply : bullets
    if (!selected || selected.length === 0) {
      toast({ variant: "destructive", title: "No bullets selected", description: "Please select at least one bullet to apply." })
      return
    }

    const next = [...(resume.content.experience || [])]
    const currentExp = next[index] || {}
    const formattedHtml = plainTextToRichTextHtml(selected.map((b) => `- ${b}`).join("\n"))
    
    const existingDesc = currentExp.description || ""
    const nextDesc = existingDesc ? `${existingDesc}\n${formattedHtml}` : formattedHtml

    next[index] = {
      ...currentExp,
      description: nextDesc,
    }
    handleUpdate("content.experience", next)
    setRoleBulletSuggestions(null)
    toast({ title: "Bullets Applied", description: `Added ${selected.length} bullet point(s) to experience.` })
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
        setSkillSuggestions(normalizeSuggestions(result.suggestions))
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
  
  const runInterestSuggestions = async () => {
    if (!resume || !checkLimit("aiGenerations")) return
    setIsSuggestingInterests(true)
    try {
      setRoutingLogs(prev => [...prev, { 
        role: "GENERAL", 
        reason: "User requested hobby and interest suggestions. Routing to Character Coach for authentic personality alignment." 
      }])

      const result = await enhanceCvContent({
        action: "suggest_interests",
        currentCvContent: buildResumePlainText(resume),
        jobDescription: jobDescription
      })
      
      if (result.suggestions) {
        setInterestSuggestions(normalizeSuggestions(result.suggestions))
      }

      await incrementUsage("aiGenerations")
      toast({ title: "Hobbies Suggested", description: "AI suggested fresh interests for your character profile." })
    } catch (err) {
      console.error("Interest suggestions failed:", err)
      toast({ variant: "destructive", title: "Suggestions Failed" })
    } finally {
      setIsSuggestingInterests(false)
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
    setSummarySuggestions,
    isSuggestingSkills,
    skillSuggestions,
    runSkillSuggestions,
    setSkillSuggestions,
    isSuggestingInterests,
    interestSuggestions,
    runInterestSuggestions,
    setInterestSuggestions,
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

    setResume: (r: any) => setEditorState(prev => ({ ...prev, resume: r })),
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
    },

    isCheckingGrammarGlobal,
    globalGrammarIssues,
    hasScannedGrammar,
    runGlobalGrammarCheck: async () => {
      if (!resume) return
      setIsCheckingGrammarGlobal(true)
      setGlobalGrammarIssues([])
      
      try {
        const targets = getScanTargets(resume)
        const allIssues: any[] = []
        
        for (const target of targets) {
          const issues = await checkGrammar(target.text)
          
          const mapped = issues.map((issue, idx) => ({
            id: `${target.path}-${issue.offset}-${idx}`,
            targetPath: target.path,
            label: target.label,
            isRichText: target.isRichText,
            message: issue.message,
            offset: issue.offset,
            length: issue.length,
            bad: issue.bad,
            suggestions: issue.suggestions,
            context: issue.context,
          }))
          
          allIssues.push(...mapped)
          // Small delay to prevent rate limit on free API
          await new Promise(resolve => setTimeout(resolve, 80))
        }
        
        setGlobalGrammarIssues(allIssues)
        setHasScannedGrammar(true)
        
        toast({
          title: "Scan Complete",
          description: allIssues.length === 0 
            ? "No spelling or grammar issues found!" 
            : `Found ${allIssues.length} issues to review.`
        })
      } catch (err) {
        console.error("Global grammar check failed:", err)
        toast({ variant: "destructive", title: "Scan Failed", description: "An error occurred while scanning." })
      } finally {
        setIsCheckingGrammarGlobal(false)
      }
    },
    applyGlobalGrammarFix: (issue: any, suggestion: string) => {
      if (!resume) return
      
      const keys = issue.targetPath.split(".")
      let current = resume
      for (const key of keys) {
        if (!current || typeof current !== "object") {
          current = undefined
          break
        }
        current = current[key]
      }
      
      if (typeof current !== "string") {
        console.error("Could not find text for path:", issue.targetPath)
        return
      }

      let updatedValue = ""
      
      if (issue.isRichText) {
        const plain = richTextToPlainText(current)
        const updatedPlain = plain.slice(0, issue.offset) + suggestion + plain.slice(issue.offset + issue.length)
        updatedValue = plainTextToRichTextHtml(updatedPlain)
      } else {
        updatedValue = current.slice(0, issue.offset) + suggestion + current.slice(issue.offset + issue.length)
      }
      
      handleUpdate(issue.targetPath, updatedValue)
      
      setGlobalGrammarIssues(prev => {
        const delta = suggestion.length - issue.length
        return prev
          .filter(item => item.id !== issue.id)
          .map(item => {
            if (item.targetPath === issue.targetPath && item.offset > issue.offset) {
              return {
                ...item,
                offset: item.offset + delta
              }
            }
            return item
          })
      })
      
      toast({
        title: "Fix Applied",
        description: `Replaced "${issue.bad}" with "${suggestion}".`
      })
    },
    dismissGlobalGrammarIssue: (issueId: string) => {
      setGlobalGrammarIssues(prev => prev.filter(item => item.id !== issueId))
    }
  }
}

function getScanTargets(resume: any) {
  if (!resume || !resume.content) return []
  const targets: { text: string; path: string; label: string; isRichText: boolean }[] = []

  const { personal, summary, experience, projects, education } = resume.content

  if (personal?.title && personal.title.trim()) {
    targets.push({
      text: personal.title,
      path: "content.personal.title",
      label: "Professional Title",
      isRichText: false
    })
  }

  if (summary && summary.trim()) {
    const plainSummary = richTextToPlainText(summary)
    if (plainSummary.trim()) {
      targets.push({
        text: plainSummary,
        path: "content.summary",
        label: "Professional Summary",
        isRichText: true
      })
    }
  }

  if (Array.isArray(experience)) {
    experience.forEach((exp: any, idx: number) => {
      const expLabel = `Work Experience: ${exp.company || exp.title || `Role ${idx + 1}`}`

      if (exp.title && exp.title.trim()) {
        targets.push({
          text: exp.title,
          path: `content.experience.${idx}.title`,
          label: `${expLabel} - Job Title`,
          isRichText: false
        })
      }
      if (exp.company && exp.company.trim()) {
        targets.push({
          text: exp.company,
          path: `content.experience.${idx}.company`,
          label: `${expLabel} - Company`,
          isRichText: false
        })
      }
      if (exp.description && exp.description.trim()) {
        const plainDesc = richTextToPlainText(exp.description)
        if (plainDesc.trim()) {
          targets.push({
            text: plainDesc,
            path: `content.experience.${idx}.description`,
            label: `${expLabel} - Description`,
            isRichText: true
          })
        }
      }
    })
  }

  if (Array.isArray(projects)) {
    projects.forEach((proj: any, idx: number) => {
      const projLabel = `Project: ${proj.name || `Project ${idx + 1}`}`

      if (proj.name && proj.name.trim()) {
        targets.push({
          text: proj.name,
          path: `content.projects.${idx}.name`,
          label: `${projLabel} - Project Title`,
          isRichText: false
        })
      }
      if (proj.description && proj.description.trim()) {
        const plainDesc = richTextToPlainText(proj.description)
        if (plainDesc.trim()) {
          targets.push({
            text: plainDesc,
            path: `content.projects.${idx}.description`,
            label: `${projLabel} - Description`,
            isRichText: true
          })
        }
      }
    })
  }

  if (Array.isArray(education)) {
    education.forEach((edu: any, idx: number) => {
      const school = edu.school || edu.institution || ""
      const eduLabel = `Education: ${edu.degree || school || `Item ${idx + 1}`}`

      if (edu.degree && edu.degree.trim()) {
        targets.push({
          text: edu.degree,
          path: `content.education.${idx}.degree`,
          label: `${eduLabel} - Degree/Course`,
          isRichText: false
        })
      }
      if (school && school.trim()) {
        targets.push({
          text: school,
          path: `content.education.${idx}.school`,
          label: `${eduLabel} - Institution`,
          isRichText: false
        })
      }
      if (edu.description && edu.description.trim()) {
        const plainDesc = richTextToPlainText(edu.description)
        if (plainDesc.trim()) {
          targets.push({
            text: plainDesc,
            path: `content.education.${idx}.description`,
            label: `${eduLabel} - Description`,
            isRichText: true
          })
        }
      }
    })
  }

  return targets
}
