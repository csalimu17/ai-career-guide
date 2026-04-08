"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import React, { useState, useEffect, useMemo } from "react"
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore"
import {
  Search,
  ArrowRight,
  Loader2,
  Building2,
  MapPin,
  Clock3,
  Archive,
  ExternalLink,
  Monitor,
  Target,
} from "lucide-react"

import {
  useUser,
  useFirestore,
  useMemoFirebase,
  useCollection,
} from "@/firebase"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { toast } from "@/hooks/use-toast"
import {
  type JobListingRecord,
  type JobApplicationRecord,
  type JobTrackingStatus,
  JOB_SOURCE_CONFIG,
  JOB_SOURCE_DEFAULT_URLS,
  JOB_STATUS_CONFIG,
  buildListingFingerprint,
  buildTrackedApplicationPayload,
  shouldAllowSavedToggle,
  getSafeJobSource,
  getNextStatusForExternalApply,
} from "@/lib/jobs/model"
import { useIsMobile } from "@/hooks/use-mobile"

type TrackedApplication = JobApplicationRecord & { id: string }

const statusIcons = {
  saved: Archive,
  started: Clock3,
  applied: Target, // Changed to Target to match lucide import
  interviewing: Building2,
  offer: ExternalLink,
  rejected: ArrowRight,
}

export default function JobsPage() {
  const router = useRouter()
  const { user } = useUser()
  const db = useFirestore()
  const isMobile = useIsMobile()

  const [searchTerm, setSearchTerm] = useState("")
  const [locationTerm, setLocationTerm] = useState("")
  const [sourceFilter, setSourceFilter] = useState<"all" | JobListingRecord["source"]>("all")
  const [workplaceFilter, setWorkplaceFilter] = useState<"all" | JobListingRecord["workplaceType"]>("all")

  const [currentPage, setCurrentPage] = useState(1)
  const [viewingJob, setViewingJob] = useState<JobListingRecord | null>(null)
  const JOBS_PER_PAGE = isMobile ? 6 : 12

  const handleSourceFilterChange = (value: "all" | JobListingRecord["source"]) => {
    setSourceFilter(value)
    setCurrentPage(1)
  }

  const handleWorkplaceFilterChange = (value: "all" | JobListingRecord["workplaceType"]) => {
    setWorkplaceFilter(value)
    setCurrentPage(1)
  }

  const [activeTab, setActiveTab] = useState("discover")
  const [applyListing, setApplyListing] = useState<JobListingRecord | null>(null)
  const [selectedResumeId, setSelectedResumeId] = useState("none")
  const [isApplyDialogOpen, setIsApplyDialogOpen] = useState(false)
  const [isStartingApply, setIsStartingApply] = useState(false)

  // API Search states
  const [apiListings, setApiListings] = useState<JobListingRecord[]>([])
  const [isApiLoading, setIsApiLoading] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const [hasSearched, setHasSearched] = useState(false)
  const [apiServedFromCache, setApiServedFromCache] = useState(false)

  const resumesQuery = useMemoFirebase(() => {
    if (!db || !user) return null
    return collection(db, "users", user.uid, "resumes")
  }, [db, user])
  const { data: resumes } = useCollection(resumesQuery)

  const applicationsQuery = useMemoFirebase(() => {
    if (!db || !user) return null
    return collection(db, "users", user.uid, "jobApplications")
  }, [db, user])
  const { data: trackedApplications, isLoading: isApplicationsLoading } = useCollection<TrackedApplication>(applicationsQuery)

  const trackedByFingerprint = useMemo(
    () =>
      new Map(
        (trackedApplications || [])
          .filter((application) => Boolean(application.listingFingerprint))
          .map((application) => [application.listingFingerprint, application])
      ),
    [trackedApplications]
  )

  const latestResume = resumes?.[0]

  useEffect(() => {
    if (selectedResumeId === "none" && latestResume?.id) {
      setSelectedResumeId(latestResume.id)
    }
  }, [latestResume?.id, selectedResumeId])

  const handlePerformSearch = async (overriddenSearchTerm?: string) => {
    const term = overriddenSearchTerm ?? searchTerm
    if (!term.trim()) return

    setIsApiLoading(true)
    setApiError(null)
    setHasSearched(true)
    setApiServedFromCache(false)
    setCurrentPage(1)
    try {
      const params = new URLSearchParams({
        q: term.trim(),
        workplace: workplaceFilter,
      })

      if (locationTerm.trim()) {
        params.set("location", locationTerm.trim())
      }

      const resp = await fetch(`/api/jobs/search?${params.toString()}`)
      const data = await resp.json()

      if (!resp.ok || data.error) {
        setApiListings([])
        setApiError(data.error)
        setApiServedFromCache(false)
        toast({
          variant: "destructive",
          title: data.code === 403 ? "Subscription required" : "Search failed",
          description: data.error || "We couldn't load live jobs right now.",
        })
      } else {
        setApiListings(data.listings || [])
        setApiError(null)
        setApiServedFromCache(Boolean(data.isStale))
      }
    } catch (err) {
      console.error("Search fetch error:", err)
      setApiListings([])
      setApiError("Failed to connect to search service.")
      setApiServedFromCache(false)
      toast({
        variant: "destructive",
        title: "Search unavailable",
        description: "We couldn't connect to the live job search service right now.",
      })
    } finally {
      setIsApiLoading(false)
    }
  }

  const filteredListings = useMemo(() => {
    if (!hasSearched) {
      return []
    }

    return apiListings.filter((listing) => {
      const matchesSource = sourceFilter === "all" || listing.source === sourceFilter
      const matchesWorkplace = workplaceFilter === "all" || listing.workplaceType === workplaceFilter
      return matchesSource && matchesWorkplace
    })
  }, [apiListings, sourceFilter, workplaceFilter, hasSearched])

  const totalPages = Math.ceil(filteredListings.length / JOBS_PER_PAGE)
  const paginatedListings = useMemo(() => {
    const start = (currentPage - 1) * JOBS_PER_PAGE
    return filteredListings.slice(start, start + JOBS_PER_PAGE)
  }, [filteredListings, currentPage, JOBS_PER_PAGE])

  const savedJobs = useMemo(
    () => (trackedApplications || []).filter((application) => application.status === "saved"),
    [trackedApplications]
  )

  const pipelineJobs = useMemo(
    () => (trackedApplications || []).filter((application) => application.status !== "saved"),
    [trackedApplications]
  )

  const statsCount = (status: JobTrackingStatus) => (trackedApplications || []).filter(a => a.status === status).length

  const stats = [
    { label: "Discoverable", value: hasSearched ? filteredListings.length : 0, tone: "text-primary" },
    { label: "Saved", value: statsCount("saved"), tone: "text-amber-600" },
    { label: "Started App", value: statsCount("started"), tone: "text-sky-600" },
    { label: "Applied", value: statsCount("applied"), tone: "text-blue-600" },
  ]
  const showSearchErrorState = hasSearched && !isApiLoading && Boolean(apiError)
  const showSearchEmptyState = hasSearched && !isApiLoading && !apiError && filteredListings.length === 0

  const buildListingFromApplication = (application: TrackedApplication): JobListingRecord => {
    const source = getSafeJobSource(application.source)
    return {
      id: application.jobListingId || application.id,
      externalJobId: application.externalJobId || undefined,
      source,
      sourceUrl: application.sourceUrl || JOB_SOURCE_DEFAULT_URLS[source],
      company: application.company,
      role: application.role,
      location: application.location || "Location not specified",
      workplaceType: application.workplaceType || "remote",
      employmentType: application.employmentType || "full-time",
      shortDescription: application.jobDescription || "Tracked application record.",
      postedLabel: application.statusLabel || JOB_STATUS_CONFIG[application.status].label,
      tags: [],
      listingOrigin: application.listingOrigin || "partner_feed",
      integrationMode: application.partnerSync?.integrationMode || "redirect",
      partnerCapabilities: application.partnerSync?.capabilities || JOB_SOURCE_CONFIG[source].plannedCapabilities,
    }
  }

  const upsertTrackedApplication = async (args: {
    listing: JobListingRecord
    status: JobTrackingStatus
    statusSource: Parameters<typeof buildTrackedApplicationPayload>[0]["statusSource"]
    resumeId?: string | null
    resumeName?: string | null
    note?: string
  }) => {
    if (!user || !db) return null

    const fingerprint = buildListingFingerprint(args.listing)
    const existing = trackedByFingerprint.get(fingerprint)
    const payload = buildTrackedApplicationPayload({
      userId: user.uid,
      listing: args.listing,
      status: args.status,
      statusSource: args.statusSource,
      note: args.note,
      resumeId: args.resumeId,
      resumeName: args.resumeName,
      existingHistory: existing?.statusHistory,
      existingAppliedAt: existing?.appliedAt,
    })

    if (existing) {
      await updateDoc(doc(db, "users", user.uid, "jobApplications", existing.id), {
        ...payload,
        updatedAt: serverTimestamp(),
      })
      return existing.id
    }

    const newDoc = await addDoc(collection(db, "users", user.uid, "jobApplications"), {
      ...payload,
      notes: "",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    return newDoc.id
  }

  const handleSaveListing = async (listing: JobListingRecord) => {
    if (!user || !db) return
    const fingerprint = buildListingFingerprint(listing)
    const existing = trackedByFingerprint.get(fingerprint)

    if (existing && !shouldAllowSavedToggle(existing.status)) {
      toast({
        title: "Already in your pipeline",
        description: `${listing.role} at ${listing.company} is already being tracked.`,
      })
      return
    }

    try {
      if (existing && existing.status === "saved") {
        await deleteDoc(doc(db, "users", user.uid, "jobApplications", existing.id))
        toast({ title: "Removed from saved jobs" })
        return
      }

      await upsertTrackedApplication({
        listing,
        status: "saved",
        statusSource: "discover_save",
        note: "Saved from the jobs discovery workspace.",
      })
      toast({ title: "Saved to your pipeline" })
    } catch (error) {
      console.error("Save error:", error)
      toast({
        variant: "destructive",
        title: "Save failed",
        description: "We couldn't update this job in your pipeline right now.",
      })
    }
  }

  const handleStartApply = (listing: JobListingRecord) => {
    setApplyListing(listing)
    const existing = trackedByFingerprint.get(buildListingFingerprint(listing))
    setSelectedResumeId(existing?.resumeId || latestResume?.id || "none")
    setIsApplyDialogOpen(true)
  }

  const handleContinueToExternalApply = async () => {
    if (!applyListing || !user || !db) return
    setIsStartingApply(true)
    try {
      const existing = trackedByFingerprint.get(buildListingFingerprint(applyListing))
      const nextStatus = getNextStatusForExternalApply(existing?.status)
      const linkedResume = resumes?.find((resume) => resume.id === selectedResumeId)
      const applicationId = await upsertTrackedApplication({
        listing: applyListing,
        status: nextStatus,
        statusSource: "external_apply",
        note: `Opened external apply on ${JOB_SOURCE_CONFIG[applyListing.source].label}.`,
        resumeId: selectedResumeId === "none" ? null : selectedResumeId,
        resumeName: selectedResumeId === "none" ? "General resume" : linkedResume?.name || "Selected resume",
      })

      if (!applicationId) {
        throw new Error("We couldn't prepare your application workspace.")
      }

      setIsApplyDialogOpen(false)
      toast({
        title: "Apply workspace ready",
        description: "Your tracking state is saved. Finish the application from the dedicated apply workspace.",
      })
      router.push(`/jobs/apply?applicationId=${applicationId}`)
    } catch (error) {
      console.error("Apply error:", error)
      toast({
        variant: "destructive",
        title: "Couldn't start apply flow",
        description: "We couldn't prepare the apply workspace right now.",
      })
    } finally {
      setIsStartingApply(false)
    }
  }

  const handleMarkApplied = async (application: TrackedApplication) => {
    if (!user || !db) return
    try {
      const payload = buildTrackedApplicationPayload({
        userId: user.uid,
        listing: buildListingFromApplication(application),
        status: "applied",
        statusSource: "apply_confirmation",
        note: "User confirmed the application was submitted from the jobs workspace.",
        resumeId: application.resumeId || null,
        resumeName: application.resumeName || null,
        existingHistory: application.statusHistory,
        existingAppliedAt: application.appliedAt || null,
      })

      await updateDoc(doc(db, "users", user.uid, "jobApplications", application.id), {
        ...payload,
        notes: application.notes || "",
        jobDescription: application.jobDescription || "",
        partnerSync: application.partnerSync || payload.partnerSync,
        sourceClickStartedAt: application.sourceClickStartedAt || payload.sourceClickStartedAt,
        updatedAt: serverTimestamp(),
      })
      toast({ title: "Application marked as applied!" })
    } catch (err) {
      console.error("Confirm error:", err)
      toast({
        variant: "destructive",
        title: "Update failed",
        description: "We couldn't mark this application as applied.",
      })
    }
  }

  const handleCancelStarted = async (application: TrackedApplication) => {
    if (!user || !db) return
    try {
      await deleteDoc(doc(db, "users", user.uid, "jobApplications", application.id))
      toast({ title: "Application tracking removed" })
    } catch (err) {
      console.error("Cancel error:", err)
      toast({
        variant: "destructive",
        title: "Removal failed",
        description: "We couldn't remove this started application right now.",
      })
    }
  }

  const renderTrackedCard = (application: TrackedApplication) => {
    const source = getSafeJobSource(application.source)
    const statusConfig = JOB_STATUS_CONFIG[application.status]
    const StatusIcon = statusIcons[application.status] || Archive

    return (
      <Card key={application.id} className="flex h-full flex-col overflow-hidden rounded-[1.5rem] border-none bg-white shadow-sm md:rounded-[2rem]">
        <CardHeader className="space-y-3 bg-muted/20 p-4 md:space-y-4 md:p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="eyebrow-chip">
              <StatusIcon className="h-3.5 w-3.5" />
              {statusConfig.label}
            </div>
          </div>
          <div className="space-y-1">
            <CardTitle className="text-lg font-black tracking-tight text-primary md:text-xl">{application.role}</CardTitle>
            <CardDescription className="text-sm font-semibold text-muted-foreground">{application.company}</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 p-4 md:p-6">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="rounded-full px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.18em]">
              {application.sourceLabel || JOB_SOURCE_CONFIG[source].label}
            </Badge>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {application.status === "started" ? (
              <>
                <Button className="h-10 rounded-xl font-bold md:h-11" onClick={() => handleMarkApplied(application)}>
                  Mark applied
                </Button>
                <Button variant="ghost" className="h-10 rounded-xl font-bold text-destructive hover:bg-destructive/5 md:h-11" onClick={() => handleCancelStarted(application)}>
                  Cancel/Not applied
                </Button>
              </>
            ) : (
              <Button variant="outline" className="h-10 rounded-xl font-bold md:h-11" asChild>
                <Link href="/tracker">Open tracker</Link>
              </Button>
            )}
            <Button variant="outline" className="h-10 rounded-xl font-bold md:h-11" asChild>
              <a href={application.sourceUrl || JOB_SOURCE_DEFAULT_URLS[source]} target="_blank" rel="noreferrer">
                Re-open source
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="mobile-app-page md:mx-auto md:max-w-7xl md:space-y-8 md:px-8 md:pt-8">
      <section className="section-shell space-y-3 px-4 py-4 sm:space-y-4 sm:px-5 sm:py-6 md:px-8">
        <div className="eyebrow-chip">
          <Search className="h-3.5 w-3.5" />
          Jobs discovery
        </div>
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="min-w-0 space-y-3 xl:flex-1">
            <h1 className="text-[1.65rem] font-black leading-[0.98] tracking-[-0.05em] text-primary sm:text-[2rem] lg:text-5xl">
              Discover jobs, and keep the application trail in one place.
            </h1>
            <p className="max-w-2xl text-[0.92rem] leading-relaxed text-muted-foreground md:text-base">
              Search live roles, save the best ones, and keep your application trail tidy without a desktop-sized workspace.
            </p>
          </div>
          <div className="grid w-full gap-2 sm:grid-cols-2 xl:flex xl:w-auto xl:shrink-0">
            <Button className="h-11 rounded-2xl font-bold md:h-12" asChild>
              <Link href="/tracker">
                Open tracker
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3 md:gap-6 xl:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="rounded-[1.25rem] border-none bg-white p-4 shadow-sm md:rounded-[1.8rem] md:p-5">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">{stat.label}</p>
            <p className={cn("mt-2 text-[1.8rem] font-black tracking-tight md:text-3xl", stat.tone)}>{stat.value}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-3 lg:grid-cols-[1fr_240px_auto_220px_220px] lg:gap-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handlePerformSearch()}
            placeholder="Search role, company..."
            className="h-11 rounded-2xl border-border/80 bg-white pl-11 md:h-12"
          />
        </div>
        <Input
          value={locationTerm}
          onChange={(e) => setLocationTerm(e.target.value)}
          placeholder="Location or county (UK)..."
          className="h-11 rounded-2xl border-border/80 bg-white md:h-12"
        />
        <Button className="h-11 rounded-2xl px-6 font-bold md:h-12" disabled={isApiLoading} onClick={() => handlePerformSearch()}>
          {isApiLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
          Search
        </Button>
        <Select value={sourceFilter} onValueChange={handleSourceFilterChange}>
          <SelectTrigger className="h-11 rounded-2xl border-border/80 bg-white md:h-12">
            <SelectValue placeholder="Source" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All sources</SelectItem>
            {Object.entries(JOB_SOURCE_CONFIG).map(([s, c]) => (
              <SelectItem key={s} value={s}>{c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={workplaceFilter} onValueChange={handleWorkplaceFilterChange}>
          <SelectTrigger className="h-11 rounded-2xl border-border/80 bg-white md:h-12">
            <SelectValue placeholder="Workplace" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="remote">Remote</SelectItem>
            <SelectItem value="onsite">On-site</SelectItem>
            <SelectItem value="hybrid">Hybrid</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid h-auto grid-cols-3 rounded-[1.25rem] bg-white p-1">
          <TabsTrigger value="discover" className="rounded-[0.95rem] px-2 py-2.5 text-[0.75rem] font-bold md:rounded-xl md:text-sm">Discover</TabsTrigger>
          <TabsTrigger value="saved" className="rounded-[0.95rem] px-2 py-2.5 text-[0.75rem] font-bold md:rounded-xl md:text-sm">Saved</TabsTrigger>
          <TabsTrigger value="tracking" className="rounded-[0.95rem] px-2 py-2.5 text-[0.75rem] font-bold md:rounded-xl md:text-sm">Tracking</TabsTrigger>
        </TabsList>

        <TabsContent value="discover" className="space-y-5">
          {apiServedFromCache && (
            <div className="flex items-center gap-3 rounded-2xl border border-secondary/20 bg-secondary/5 p-4">
              <Clock3 className="h-5 w-5 text-secondary" />
              <div className="flex-1 text-sm font-medium text-secondary">
                Browsing community-cached roles. Use the Search button to fetch fresh UK opportunities in real-time.
              </div>
            </div>
          )}

          {isApiLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Loader2 className="h-10 w-10 animate-spin text-primary/20" />
              <p className="mt-4 font-bold text-muted-foreground">Finding the best roles...</p>
            </div>
          ) : paginatedListings.length > 0 ? (
            <div className="space-y-12">
              <div className="grid gap-3 md:gap-6 lg:grid-cols-2 2xl:grid-cols-3">
                {paginatedListings.map((listing) => {
                  const fingerprint = buildListingFingerprint(listing)
                  const tracked = trackedByFingerprint.get(fingerprint)
                  const sourceConfig = JOB_SOURCE_CONFIG[listing.source]

                  return (
                    <Card key={listing.id} className="flex h-full flex-col overflow-hidden rounded-[1.45rem] border-none bg-white shadow-sm transition-shadow hover:shadow-md md:rounded-[2rem]">
                      <CardHeader className="space-y-3 bg-muted/20 p-4 md:space-y-4 md:p-6">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className={cn("rounded-full px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.18em]", sourceConfig.badgeClassName)}>
                                {sourceConfig.shortLabel}
                              </Badge>
                              <Badge variant="outline" className="rounded-full px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.18em]">
                                {listing.workplaceType}
                              </Badge>
                            </div>
                            <CardTitle className="line-clamp-2 text-base font-black text-primary md:text-xl">{listing.role}</CardTitle>
                            <CardDescription className="flex items-center gap-2 font-bold text-muted-foreground">
                              <Building2 className="h-3.5 w-3.5" />
                              {listing.company}
                            </CardDescription>
                          </div>
                          {tracked && (
                            <Badge variant="outline" className={cn("rounded-full px-2 py-0.5 text-[0.6rem] font-black uppercase tracking-wider", JOB_STATUS_CONFIG[tracked.status].chipClassName)}>
                              {JOB_STATUS_CONFIG[tracked.status].label}
                            </Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="flex flex-1 flex-col justify-between p-4 md:p-6">
                        <div className="space-y-3 md:space-y-4">
                          <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                            <MapPin className="h-3.5 w-3.5" />
                            {listing.location}
                          </div>
                          <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">{listing.shortDescription}</p>
                        </div>
                        <div className="mt-4 space-y-2.5 md:mt-6 md:space-y-3">
                          <div className="grid grid-cols-2 gap-2">
                            <Button variant="outline" className="h-10 rounded-xl font-bold md:h-11" onClick={() => setViewingJob(listing)}>View details</Button>
                            <Button className="h-10 rounded-xl font-bold md:h-11" onClick={() => handleStartApply(listing)}>{sourceConfig.applyLabel}</Button>
                          </div>
                          <Button
                            variant={tracked?.status === "saved" ? "outline" : "secondary"}
                            className="h-9 w-full rounded-xl text-xs font-bold md:h-10"
                            onClick={() => handleSaveListing(listing)}
                          >
                            {tracked?.status === "saved" ? "Remove saved" : "Save for later"}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>

              {totalPages > 1 && (
                <div className="flex flex-col items-center gap-6 pb-4">
                  {isMobile ? (
                    <div className="flex w-full items-center justify-between gap-3">
                      <Button variant="outline" className="h-10 flex-1 rounded-xl font-bold" disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))}>
                        Previous
                      </Button>
                      <div className="min-w-[88px] text-center text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
                        {currentPage} / {totalPages}
                      </div>
                      <Button variant="outline" className="h-10 flex-1 rounded-xl font-bold" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}>
                        Next
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-10 w-10 rounded-xl"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      >
                        <ArrowRight className="h-4 w-4 rotate-180" />
                      </Button>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                          <Button
                            key={p}
                            variant={currentPage === p ? "default" : "outline"}
                            className={cn("h-10 w-10 rounded-xl font-bold", currentPage === p ? "shadow-md shadow-primary/20" : "")}
                            onClick={() => setCurrentPage(p)}
                          >
                            {p}
                          </Button>
                        ))}
                      </div>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-10 w-10 rounded-xl"
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      >
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60">
                    Page {currentPage} of {totalPages}
                  </p>
                </div>
              )}
            </div>
          ) : (
              <Card className="border-none bg-white p-8 text-center shadow-sm md:p-20">
              <Search className="mx-auto h-12 w-12 text-muted-foreground/20" />
              <p className="mt-4 text-lg font-black text-primary">
                {hasSearched ? "No matching jobs found" : "Search for live jobs"}
              </p>
              <p className="text-sm text-muted-foreground">
                {hasSearched
                  ? "Try broadening your search or clearing filters."
                  : "Discover now shows live search results only, so old seeded jobs won't appear here anymore."}
              </p>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="saved" className="space-y-5">
          {savedJobs.length > 0 ? (
            <div className="grid gap-6 lg:grid-cols-2 2xl:grid-cols-3">
              {savedJobs.map((app) => renderTrackedCard(app))}
            </div>
          ) : (
              <Card className="border-none bg-white p-8 text-center shadow-sm md:p-20">
              <Archive className="mx-auto h-12 w-12 text-muted-foreground/20" />
              <p className="mt-4 text-lg font-black text-primary">Your saved jobs will appear here</p>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="tracking" className="space-y-5">
          {pipelineJobs.length > 0 ? (
            <div className="grid gap-6 lg:grid-cols-2 2xl:grid-cols-3">
              {pipelineJobs.map((app) => renderTrackedCard(app))}
            </div>
          ) : (
              <Card className="border-none bg-white p-8 text-center shadow-sm md:p-20">
              <Target className="mx-auto h-12 w-12 text-muted-foreground/20" />
              <p className="mt-4 text-lg font-black text-primary">Jobs you apply for will be tracked here</p>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={isApplyDialogOpen} onOpenChange={setIsApplyDialogOpen}>
        <DialogContent className="rounded-[1.75rem] sm:max-w-xl md:rounded-[2.5rem]">
          <DialogHeader className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-sm md:h-14 md:w-14">
                <Monitor className="h-6 w-6 md:h-7 md:w-7" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-black text-primary md:text-3xl">Apply Workspace</DialogTitle>
                <DialogDescription className="mt-1.5 text-balance text-sm leading-relaxed text-muted-foreground sm:text-base">
                  Record your tracking state first, then open the in-app apply. If they allow embedding, you&apos;ll get a clean workspace and a fast way to confirm submission.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="space-y-5 py-4">
            <div className="rounded-[1.4rem] border border-border/70 bg-muted/20 p-5">
              <p className="font-black text-primary">{applyListing?.role}</p>
              <p className="text-sm font-semibold text-muted-foreground">{applyListing?.company} • {applyListing?.location}</p>
            </div>
            <div className="space-y-2">
              <label className="text-[0.68rem] font-bold uppercase tracking-widest text-muted-foreground">Select CV Version</label>
              <Select value={selectedResumeId} onValueChange={setSelectedResumeId}>
                <SelectTrigger className="h-12 rounded-2xl border-border/80 bg-muted/20">
                  <SelectValue placeholder="Choose a resume version" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">General resume</SelectItem>
                  {resumes?.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:justify-start">
            <Button className="h-12 flex-1 rounded-2xl font-black shadow-lg shadow-primary/20 md:h-14 md:text-lg" disabled={isStartingApply} onClick={handleContinueToExternalApply}>
              {isStartingApply ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ExternalLink className="mr-2 h-4 w-4" />}
              Continue to Apply
            </Button>
            <Button variant="outline" className="h-12 flex-1 rounded-2xl font-black md:h-14 md:text-lg" onClick={() => setIsApplyDialogOpen(false)}>Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewingJob} onOpenChange={o => !o && setViewingJob(null)}>
        <DialogContent className="max-w-2xl overflow-hidden rounded-[1.9rem] border-none p-0 shadow-2xl md:rounded-[3rem]">
          {viewingJob && (
            <div className="flex h-[85vh] flex-col">
              <div className="bg-muted/20 p-5 pt-10 md:p-10 md:pt-12">
                <div className="flex items-center gap-2 mb-4">
                  <Badge variant="outline" className="rounded-full px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.18em]">
                    {JOB_SOURCE_CONFIG[viewingJob.source].shortLabel}
                  </Badge>
                  <Badge variant="outline" className="rounded-full px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.18em]">
                    {viewingJob.workplaceType}
                  </Badge>
                </div>
                <DialogTitle className="text-[1.8rem] font-black leading-[0.95] tracking-tighter text-primary md:text-4xl">{viewingJob.role}</DialogTitle>
                <div className="mt-4 flex flex-col gap-2 text-sm font-semibold text-muted-foreground md:mt-6 md:flex-row md:items-center md:gap-4 md:text-base">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    {viewingJob.company}
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    {viewingJob.location}
                  </div>
                </div>
              </div>

              <div className="flex-1 space-y-6 overflow-y-auto p-5 md:space-y-8 md:p-10">
                {viewingJob.salarySummary && (
                  <div className="rounded-2xl bg-primary/5 border border-primary/10 p-5">
                    <p className="text-[0.65rem] font-black uppercase tracking-[0.15em] text-primary/70 mb-2">Compensation</p>
                    <p className="text-2xl font-black text-primary">{viewingJob.salarySummary}</p>
                  </div>
                )}
                <div className="space-y-4">
                  <h3 className="text-xl font-black text-primary tracking-tight">About this role</h3>
                  <div className="text-muted-foreground text-lg leading-relaxed whitespace-pre-line">
                    {viewingJob.shortDescription}
                  </div>
                </div>
                {viewingJob.tags && viewingJob.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-4">
                    {viewingJob.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="rounded-full px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.12em] bg-muted/10">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <DialogFooter className="flex flex-col gap-3 border-t bg-muted/5 p-5 md:flex-row md:gap-4 md:p-10">
                <Button className="h-12 flex-1 rounded-2xl font-black shadow-xl shadow-primary/20 md:h-16 md:text-xl" onClick={() => handleStartApply(viewingJob)}>Apply for Job</Button>
                <Button variant="outline" className="h-12 flex-1 rounded-2xl font-black md:h-16 md:text-xl" onClick={() => handleSaveListing(viewingJob)}>
                  {trackedByFingerprint.get(buildListingFingerprint(viewingJob))?.status === "saved" ? "Remove saved" : "Save for later"}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
