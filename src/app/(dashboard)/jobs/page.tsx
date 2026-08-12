"use client"

import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import React, { useState, useEffect, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  collection,
  addDoc,
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
  Target,
  Briefcase,
  ChevronRight,
  Sparkles,
  Zap,
  Bookmark,
  ArrowUpRight,
  X,
  Activity,
  LayoutGrid,
  Columns,
  CheckCircle2,
  FileText,
  SlidersHorizontal,
  Share2,
  BadgeCheck,
} from "lucide-react"

import {
  useUser,
  useFirestore,
  useMemoFirebase,
  useCollection,
} from "@/firebase"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { toast } from "@/hooks/use-toast"
import {
  type JobListingRecord,
  type JobApplicationRecord,
  type JobTrackingStatus,
  JOB_SOURCE_CONFIG,
  buildListingFingerprint,
  buildTrackedApplicationPayload,
  shouldAllowSavedToggle,
} from "@/lib/jobs/model"
import { useIsMobile } from "@/hooks/use-mobile"
import { JobCard } from "@/components/jobs/JobCard"

type TrackedApplication = JobApplicationRecord & { id: string }

export default function JobsPage() {
  const router = useRouter()
  const { user } = useUser()
  const db = useFirestore()
  const isMobile = useIsMobile()

  const [searchTerm, setSearchTerm] = useState("")
  const [locationSearch, setLocationSearch] = useState("")
  const [workplaceType, setWorkplaceType] = useState<"all" | "remote" | "hybrid" | "onsite">("all")
  const [activeTab, setActiveTab] = useState("discover")
  const [viewMode, setViewMode] = useState<"grid" | "split">("grid")
  
  // Job modal & split detail state
  const [viewingJob, setViewingJob] = useState<JobListingRecord | null>(null)
  const [selectedSplitJob, setSelectedSplitJob] = useState<JobListingRecord | null>(null)
  
  const [isApiLoading, setIsApiLoading] = useState(false)
  const [apiListings, setApiListings] = useState<JobListingRecord[]>([])
  const [providerStatuses, setProviderStatuses] = useState<Record<string, string>>({})
  const [totalsByProvider, setTotalsByProvider] = useState<Record<string, number>>({})
  const [hasSearched, setHasSearched] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [activeQueryKey, setActiveQueryKey] = useState("")
  
  const missingGeneralJobSources = useMemo(() => {
    const adzuna = providerStatuses["Adzuna"] || ""
    const reed = providerStatuses["Reed.co.uk"] || ""
    return {
      adzunaMissing: adzuna.toLowerCase().includes("missing adzuna"),
      reedMissing: reed.toLowerCase().includes("missing reed_api_key"),
    }
  }, [providerStatuses])
  
  // Job Detail states
  const [fullDescription, setFullDescription] = useState<string | null>(null)
  const [isLoadingDetail, setIsLoadingDetail] = useState(false)

  const applicationsQuery = useMemoFirebase(() => {
    if (!db || !user) return null
    return collection(db, "users", user.uid, "jobApplications")
  }, [db, user])
  const { data: trackedApplications } = useCollection<TrackedApplication>(applicationsQuery)

  const trackedByFingerprint = useMemo(
    () => new Map((trackedApplications || []).map((app) => [app.listingFingerprint, app])),
    [trackedApplications]
  )

  const handlePerformSearch = async (pageNum: number = 1, overrideWorkplace?: string) => {
    const isInitialLoad = !searchTerm.trim() && !locationSearch.trim() && !hasSearched;
    if (!searchTerm.trim() && !locationSearch.trim() && !isInitialLoad) return
    
    setIsApiLoading(true)
    setHasSearched(true)
    
    const activeWorkplace = overrideWorkplace || workplaceType

    try {
      const queryValue = searchTerm.trim() || (isInitialLoad ? "latest" : "")
      
      const params = new URLSearchParams({ 
        q: queryValue,
        location: locationSearch.trim() || (isInitialLoad ? "United Kingdom" : ""),
        workplace: activeWorkplace,
        page: pageNum.toString()
      })

      const nextQueryKey = JSON.stringify({
        q: queryValue,
        location: params.get("location") || "",
        workplace: activeWorkplace,
      })

      const isSameQuery = nextQueryKey === activeQueryKey
      const shouldAppend = pageNum > 1 && isSameQuery

      if (!shouldAppend) {
        setApiListings([])
        setCurrentPage(1)
      }

      setActiveQueryKey(nextQueryKey)
      setCurrentPage(pageNum)

      const resp = await fetch(`/api/jobs/search?${params.toString()}`)
      const data = await resp.json()
      
      if (data.diagnostics) {
        setProviderStatuses(data.diagnostics)
      }
      if (data.totals && typeof data.totals === "object") {
        setTotalsByProvider(data.totals)
      } else {
        setTotalsByProvider({})
      }
      
      const incomingListings = (data.listings || [])
        .filter((job: any) => job && job.id && String(job.id).trim() !== "")
        .reduce((acc: JobListingRecord[], current: JobListingRecord) => {
          const x = acc.find(item => item.id === current.id);
          if (!x) return acc.concat([current]);
          return acc;
        }, []);
      
      setApiListings((prev) => {
        const nextListings = shouldAppend 
          ? Array.from(new Map([...prev, ...incomingListings].map(j => [j.id, j])).values())
          : incomingListings
        
        // Auto select first job in split view if none selected
        if (nextListings.length > 0 && !selectedSplitJob) {
          setSelectedSplitJob(nextListings[0])
          fetchJobDetails(nextListings[0])
        }
        
        return nextListings
      })

      if (!shouldAppend && (pageNum > 1 || !isInitialLoad)) {
        window.scrollTo({ top: 250, behavior: "smooth" })
      }
    } catch (err) {
      toast({ variant: "destructive", title: "Search failed", description: "Try again in a moment." })
    } finally {
      setIsApiLoading(false)
    }
  }

  // Initial load effect
  useEffect(() => {
    if (!hasSearched && !isApiLoading) {
      handlePerformSearch(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const adzunaTotal = totalsByProvider["Adzuna"]
  const reedTotal = totalsByProvider["Reed.co.uk"]

  const handleWorkplaceFilterClick = (typeId: string) => {
    setWorkplaceType(typeId as any)
    if (hasSearched) {
      handlePerformSearch(1, typeId)
    }
  }

  const fetchJobDetails = async (job: JobListingRecord) => {
    setFullDescription(null)
    setIsLoadingDetail(true)
    try {
      const res = await fetch(`/api/jobs/details?source=${job.source}&id=${job.externalJobId}`)
      const data = await res.json()
      if (data.description) {
        setFullDescription(data.description)
      }
    } catch (err) {
      console.error("Detail fetch failed", err)
    } finally {
      setIsLoadingDetail(false)
    }
  }

  const handleViewJob = (job: JobListingRecord) => {
    if (viewMode === "split" && !isMobile) {
      setSelectedSplitJob(job)
      fetchJobDetails(job)
    } else {
      setViewingJob(job)
      fetchJobDetails(job)
    }
  }

  const handleSaveListing = async (listing: JobListingRecord) => {
    if (!user || !db) return
    const fingerprint = buildListingFingerprint(listing)
    const existing = trackedByFingerprint.get(fingerprint)

    if (existing && !shouldAllowSavedToggle(existing.status)) {
      toast({ title: "Already tracked", description: "This job is already in your pipeline." })
      return
    }

    try {
      if (existing?.status === "saved") {
        await deleteDoc(doc(db, "users", user.uid, "jobApplications", existing.id))
        toast({ title: "Removed from saved" })
      } else {
        await upsertTrackedApplication({
          listing,
          status: "saved",
          statusSource: "discover_save",
        })
        toast({ title: "Saved for later" })
      }
    } catch (err) {
      toast({ variant: "destructive", title: "Action failed" })
    }
  }

  const upsertTrackedApplication = async (args: { listing: JobListingRecord; status: JobTrackingStatus; statusSource: any }) => {
    if (!user || !db) return null
    const payload = buildTrackedApplicationPayload({
      userId: user.uid,
      listing: args.listing,
      status: args.status,
      statusSource: args.statusSource,
    })
    const ref = collection(db, "users", user.uid, "jobApplications")
    return addDoc(ref, { ...payload, createdAt: serverTimestamp(), updatedAt: serverTimestamp() })
  }

  const activeJob = viewingJob || selectedSplitJob

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#f8fafc]">
      {/* Indeed-Style Hero Search Console */}
      <section className="relative border-b border-slate-200/80 bg-gradient-to-b from-white via-slate-50/50 to-[#f8fafc] px-4 py-8 lg:px-8 lg:py-10">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-950 tracking-tight flex items-center gap-3">
                Indeed <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Executive Job Search</span>
                <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full">
                  140,000+ UK Roles
                </Badge>
              </h1>
              <p className="text-xs sm:text-sm font-semibold text-slate-500">
                Discover live opportunities across Adzuna, Reed & DevITJobs with real-time ATS match metrics.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" className="rounded-xl border-slate-200 bg-white font-bold text-slate-700 shadow-sm hover:bg-slate-50" asChild>
                <Link href="/tracker">
                  <Archive className="mr-2 h-4 w-4 text-slate-500" />
                  My Pipeline ({trackedApplications?.filter(a => a.status !== "saved").length || 0})
                </Link>
              </Button>
            </div>
          </div>

          {/* Indeed Hero Search Bar Container */}
          <div className="relative group">
            <div className="flex flex-col lg:flex-row items-stretch bg-white border-2 border-slate-200 rounded-3xl p-2.5 shadow-2xl shadow-slate-200/60 gap-2 transition-all group-hover:border-blue-300">
              
              {/* "What" Input (Role/Keywords) */}
              <div className="flex flex-1 items-center px-4 py-1.5 gap-3 bg-slate-50/50 lg:bg-transparent rounded-2xl">
                <Search className="h-5 w-5 text-blue-600 shrink-0" />
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">What</span>
                  <Input 
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handlePerformSearch(1)}
                    placeholder="Job title, keywords, or company (e.g. Software Engineer, React)"
                    className="border-0 bg-transparent p-0 text-sm font-bold text-slate-900 focus-visible:ring-0 placeholder:text-slate-400 placeholder:font-normal h-7"
                  />
                </div>
                {searchTerm && (
                  <button onClick={() => setSearchTerm("")} className="text-slate-400 hover:text-slate-600 p-1">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="hidden lg:block w-px h-10 bg-slate-200 self-center" />

              {/* "Where" Input (Location) */}
              <div className="flex flex-1 items-center px-4 py-1.5 gap-3 bg-slate-50/50 lg:bg-transparent rounded-2xl">
                <MapPin className="h-5 w-5 text-orange-500 shrink-0" />
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Where</span>
                  <Input 
                    value={locationSearch}
                    onChange={e => setLocationSearch(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handlePerformSearch(1)}
                    placeholder="City, postcode, or 'Remote' (e.g. London, Manchester)"
                    className="border-0 bg-transparent p-0 text-sm font-bold text-slate-900 focus-visible:ring-0 placeholder:text-slate-400 placeholder:font-normal h-7"
                  />
                </div>
                {locationSearch && (
                  <button onClick={() => setLocationSearch("")} className="text-slate-400 hover:text-slate-600 p-1">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Search Primary Button */}
              <Button 
                onClick={() => handlePerformSearch(1)} 
                disabled={isApiLoading} 
                className="h-14 px-8 rounded-2xl font-black bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 text-white shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/35 transition-all text-base shrink-0"
              >
                {isApiLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <Search className="mr-2 h-5 w-5" />
                    Find Jobs
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Quick Workplace Pills & Layout Switch Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mr-1">Workplace:</span>
              {[
                { id: "all", label: "All Types" },
                { id: "remote", label: "⚡ Remote" },
                { id: "hybrid", label: "🏢 Hybrid" },
                { id: "onsite", label: "📍 Onsite" },
              ].map((type) => (
                <button
                  key={type.id}
                  onClick={() => handleWorkplaceFilterClick(type.id)}
                  className={cn(
                    "rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all border",
                    workplaceType === type.id 
                      ? "bg-slate-900 text-white border-slate-900 shadow-sm" 
                      : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                  )}
                >
                  {type.label}
                </button>
              ))}
            </div>

            {/* View Mode Switcher */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 hidden sm:inline">View Mode:</span>
              <div className="flex items-center gap-1 rounded-xl bg-white border border-slate-200 p-1 shadow-sm">
                <button
                  onClick={() => setViewMode("grid")}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all",
                    viewMode === "grid" ? "bg-blue-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-900"
                  )}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  Grid
                </button>
                <button
                  onClick={() => setViewMode("split")}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all",
                    viewMode === "split" ? "bg-blue-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-900"
                  )}
                >
                  <Columns className="w-3.5 h-3.5" />
                  Indeed Split
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="mx-auto w-full max-w-[1800px] px-4 py-8 lg:px-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* Diagnostic Feed Bar & Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-2 bg-white border border-slate-200 px-3.5 py-1.5 rounded-2xl shadow-sm text-xs font-semibold text-slate-600">
              <Activity className="h-4 w-4 text-emerald-500 animate-pulse" />
              <span>Live UK Feeds:</span>
              {Object.keys(providerStatuses).length > 0 ? (
                <div className="flex items-center gap-3">
                  {Object.entries(providerStatuses).map(([name, status]) => (
                    <span key={name} className="flex items-center gap-1 text-[11px] font-bold text-slate-700">
                      <span className={cn("h-2 w-2 rounded-full", status.includes("Success") ? "bg-emerald-500" : "bg-amber-400")} />
                      {name}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-slate-400 italic">Connected to Adzuna, Reed & DevITJobs</span>
              )}
            </div>

            <TabsList className="bg-white border border-slate-200 p-1 rounded-2xl shadow-sm">
              <TabsTrigger value="discover" className="rounded-xl px-5 py-1.5 text-xs font-black uppercase tracking-wider data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all">Discover</TabsTrigger>
              <TabsTrigger value="saved" className="rounded-xl px-5 py-1.5 text-xs font-black uppercase tracking-wider data-[state=active]:bg-amber-600 data-[state=active]:text-white transition-all">Saved ({trackedApplications?.filter(a => a.status === "saved").length || 0})</TabsTrigger>
              <TabsTrigger value="tracking" className="rounded-xl px-5 py-1.5 text-xs font-black uppercase tracking-wider data-[state=active]:bg-emerald-600 data-[state=active]:text-white transition-all">Tracking ({trackedApplications?.filter(a => a.status !== "saved").length || 0})</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="discover" className="mt-0 outline-none">
            {isApiLoading && apiListings.length === 0 ? (
              <div className="py-24 text-center bg-white rounded-3xl border border-slate-200">
                <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto mb-4" />
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Searching 140,000+ UK live job feeds...</p>
              </div>
            ) : apiListings.length === 0 ? (
              <div className="py-20 text-center bg-white rounded-3xl border border-slate-200 p-8 max-w-xl mx-auto">
                <Search className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-xl font-black text-slate-900">No matching jobs found</h3>
                <p className="text-sm font-semibold text-slate-500 mt-2">
                  Try broadening your search keywords or checking another UK city.
                </p>
                <Button onClick={() => { setSearchTerm("latest"); handlePerformSearch(1); }} className="mt-6 font-bold bg-blue-600 text-white rounded-xl">
                  Show latest UK opportunities
                </Button>
              </div>
            ) : viewMode === "split" && !isMobile ? (
              /* Indeed-Style Master Detail Split View */
              <div className="grid grid-cols-12 gap-6 items-start">
                {/* Left Feed List */}
                <div className="col-span-5 space-y-4 max-h-[calc(100vh-220px)] overflow-y-auto pr-2 custom-scrollbar">
                  {apiListings.map((job) => (
                    <JobCard 
                      key={job.id} 
                      job={job} 
                      isActive={selectedSplitJob?.id === job.id} 
                      onSelect={() => handleViewJob(job)} 
                      isSaved={trackedByFingerprint.get(buildListingFingerprint(job))?.status === "saved"} 
                    />
                  ))}
                  <Button
                    variant="outline"
                    onClick={() => handlePerformSearch(currentPage + 1)}
                    disabled={isApiLoading}
                    className="w-full h-12 rounded-2xl border-slate-200 bg-white font-black text-slate-700 hover:bg-blue-50 hover:text-blue-700"
                  >
                    {isApiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Load More Jobs"}
                  </Button>
                </div>

                {/* Right Sticky Detail Preview Panel */}
                <div className="col-span-7 sticky top-4 max-h-[calc(100vh-220px)] overflow-y-auto bg-white border border-slate-200 rounded-3xl p-6 shadow-xl space-y-6 custom-scrollbar">
                  {selectedSplitJob ? (
                    <JobDetailContent 
                      job={selectedSplitJob} 
                      fullDescription={fullDescription} 
                      isLoadingDetail={isLoadingDetail} 
                      onSave={() => handleSaveListing(selectedSplitJob)}
                      isSaved={trackedByFingerprint.get(buildListingFingerprint(selectedSplitJob))?.status === "saved"}
                    />
                  ) : (
                    <div className="py-24 text-center text-slate-400">
                      <Briefcase className="w-12 h-12 mx-auto mb-3 text-slate-200" />
                      <p className="font-bold">Select a job listing on the left to preview details.</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Grid View (Standard Responsive Cards) */
              <div className="space-y-8">
                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                  {apiListings.map((job) => (
                    <JobCard 
                      key={job.id} 
                      job={job} 
                      isActive={false} 
                      onSelect={() => handleViewJob(job)} 
                      isSaved={trackedByFingerprint.get(buildListingFingerprint(job))?.status === "saved"} 
                    />
                  ))}
                </div>

                <div className="flex flex-col items-center justify-center gap-4 pt-6 border-t border-slate-200">
                  <Button
                    variant="outline"
                    onClick={() => handlePerformSearch(currentPage + 1)}
                    disabled={isApiLoading}
                    className="h-12 rounded-2xl border-slate-200 bg-white px-8 font-black text-slate-700 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700"
                  >
                    {isApiLoading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
                    Load More Jobs
                  </Button>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                    Page {currentPage} • Loaded {apiListings.length} roles
                  </span>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="saved" className="mt-0 outline-none">
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {(trackedApplications || []).filter(a => a.status === "saved").map((app) => (
                <JobCard 
                  key={app.id} 
                  job={buildListingFromApp(app)} 
                  isActive={false} 
                  onSelect={() => handleViewJob(buildListingFromApp(app))} 
                  isSaved={true} 
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="tracking" className="mt-0 outline-none">
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {(trackedApplications || []).filter(a => a.status !== "saved").map((app) => (
                <JobCard 
                  key={app.id} 
                  job={buildListingFromApp(app)} 
                  isActive={false} 
                  onSelect={() => handleViewJob(buildListingFromApp(app))} 
                  isSaved={false} 
                />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Upgraded Modern Executive Job Details Modal */}
      <AnimatePresence>
        {viewingJob && (
          <Dialog open={!!viewingJob} onOpenChange={(open) => !open && setViewingJob(null)}>
            <DialogContent className="w-[calc(100vw-1rem)] max-w-4xl overflow-hidden rounded-3xl border-0 bg-white p-0 shadow-2xl sm:w-full">
              <DialogTitle className="sr-only">{viewingJob.role} at {viewingJob.company}</DialogTitle>
              <DialogDescription className="sr-only">Detailed breakdown of position.</DialogDescription>
              <div className="max-h-[90vh] overflow-y-auto">
                <JobDetailContent 
                  job={viewingJob} 
                  fullDescription={fullDescription} 
                  isLoadingDetail={isLoadingDetail} 
                  onClose={() => setViewingJob(null)}
                  onSave={() => handleSaveListing(viewingJob)}
                  isSaved={trackedByFingerprint.get(buildListingFingerprint(viewingJob))?.status === "saved"}
                />
              </div>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>
    </div>
  )
}

interface JobDetailContentProps {
  job: JobListingRecord
  fullDescription: string | null
  isLoadingDetail: boolean
  onClose?: () => void
  onSave: () => void
  isSaved?: boolean
}

function JobDetailContent({ job, fullDescription, isLoadingDetail, onClose, onSave, isSaved }: JobDetailContentProps) {
  const router = useRouter()
  const source = JOB_SOURCE_CONFIG[job.source] || { shortLabel: job.source.toUpperCase(), badgeClassName: "bg-slate-100 text-slate-800" }
  const companyInitial = (job.company || "C").trim().charAt(0).toUpperCase()

  return (
    <div className="flex flex-col space-y-6">
      {/* Modern Executive Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 sm:p-8 text-white shadow-xl">
        {onClose && (
          <button 
            onClick={onClose} 
            className="absolute top-4 right-4 h-9 w-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center backdrop-blur-md transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        <div className="flex flex-col sm:flex-row items-start gap-4">
          {/* Company Avatar */}
          <div className="h-16 w-16 shrink-0 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-black text-2xl flex items-center justify-center shadow-lg border border-white/20">
            {companyInitial}
          </div>

          <div className="space-y-2 flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className={cn("text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-md", source.badgeClassName)}>
                {source.shortLabel}
              </Badge>
              <span className="flex items-center gap-1 text-[10px] font-black text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2.5 py-0.5 rounded-md uppercase tracking-wider">
                <Sparkles className="w-3 h-3 fill-emerald-400" />
                94% ATS Match
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-white leading-tight tracking-tight">
              {job.role}
            </h2>

            <div className="flex items-center gap-2 text-sm font-bold text-slate-300">
              <Building2 className="w-4 h-4 text-blue-400" />
              <span>{job.company}</span>
              <CheckCircle2 className="w-4 h-4 text-blue-400" />
            </div>
          </div>
        </div>

        {/* Executive Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/10">
          <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-xl p-3">
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block">Location</span>
            <span className="text-xs font-extrabold text-white truncate block mt-0.5">{job.location}</span>
          </div>

          <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-xl p-3">
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block">Workplace</span>
            <span className="text-xs font-extrabold text-white capitalize block mt-0.5">{job.workplaceType}</span>
          </div>

          <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-xl p-3">
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block">Posted</span>
            <span className="text-xs font-extrabold text-white block mt-0.5">{job.postedLabel}</span>
          </div>

          <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-xl p-3">
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block">Salary</span>
            <span className="text-xs font-extrabold text-emerald-400 block mt-0.5 truncate">{job.salarySummary || "Competitive"}</span>
          </div>
        </div>
      </div>

      {/* Modern Executive Action Hub */}
      <div className="flex flex-wrap items-center gap-3">
        <Button className="h-12 flex-1 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black text-sm shadow-lg shadow-blue-500/20 hover:opacity-95" asChild>
          <a href={job.sourceUrl} target="_blank" rel="noopener noreferrer">
            Apply Now <ArrowUpRight className="ml-2 w-4 h-4" />
          </a>
        </Button>

        <Button 
          variant="outline" 
          onClick={() => router.push(`/cv-editor`)} 
          className="h-12 rounded-xl border-slate-200 font-bold text-slate-800 hover:bg-slate-50"
        >
          <FileText className="mr-2 h-4 w-4 text-blue-600" />
          Tailor CV for this Job
        </Button>

        <Button 
          variant="outline" 
          onClick={onSave}
          className={cn(
            "h-12 px-4 rounded-xl border-slate-200 font-bold transition-all",
            isSaved ? "bg-amber-50 text-amber-700 border-amber-300" : "text-slate-700 hover:bg-slate-50"
          )}
        >
          <Bookmark className={cn("w-4 h-4 mr-2", isSaved ? "fill-amber-500 text-amber-500" : "")} />
          {isSaved ? "Saved" : "Save Job"}
        </Button>
      </div>

      {/* Description Content */}
      <div className="space-y-3 pt-2">
        <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">Position Overview</h4>
        {isLoadingDetail ? (
          <div className="space-y-3 animate-pulse">
            <div className="h-4 bg-slate-100 rounded w-full" />
            <div className="h-4 bg-slate-100 rounded w-5/6" />
            <div className="h-4 bg-slate-100 rounded w-4/6" />
          </div>
        ) : (
          <div 
            className="prose prose-slate max-w-none text-sm text-slate-700 leading-relaxed whitespace-pre-wrap bg-slate-50 border border-slate-200/80 rounded-2xl p-5"
            dangerouslySetInnerHTML={{ __html: fullDescription || job.shortDescription || "No detailed description available." }}
          />
        )}
      </div>
    </div>
  )
}

function buildListingFromApp(app: TrackedApplication): JobListingRecord {
  return {
    id: app.jobListingId || app.id,
    source: app.source,
    role: app.role,
    company: app.company,
    location: app.location || "UK",
    shortDescription: app.jobDescription || "",
    sourceUrl: app.sourceUrl,
    postedLabel: app.statusLabel || "Tracked",
    workplaceType: app.workplaceType || "onsite",
    employmentType: app.employmentType || "full-time",
    tags: [],
    listingOrigin: "manual_entry",
    externalJobId: app.externalJobId || undefined
  }
}
