"use client"

import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import React, { useState, useEffect, useMemo, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
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
  Target,
  Briefcase,
  ChevronRight,
  ChevronLeft,
  Info,
  Sparkles,
  Zap,
  Bookmark,
  ArrowUpRight,
  TrendingDown,
  TrendingUp,
  LineChart,
  BarChart3,
  X,
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogHeader,
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
  JOB_SOURCE_DEFAULT_URLS,
  JOB_STATUS_CONFIG,
  buildListingFingerprint,
  buildTrackedApplicationPayload,
  shouldAllowSavedToggle,
  getSafeJobSource,
  getNextStatusForExternalApply,
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
  const [viewingJob, setViewingJob] = useState<JobListingRecord | null>(null)
  const [isApiLoading, setIsApiLoading] = useState(false)
  const [apiListings, setApiListings] = useState<JobListingRecord[]>([])
  const [hasSearched, setHasSearched] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  
  // Job Detail states
  const [fullDescription, setFullDescription] = useState<string | null>(null)
  const [isLoadingDetail, setIsLoadingDetail] = useState(false)

  const resumesQuery = useMemoFirebase(() => {
    if (!db || !user) return null
    return collection(db, "users", user.uid, "resumes")
  }, [db, user])
  const { data: resumes } = useCollection(resumesQuery)

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
    if (!searchTerm.trim()) return
    setIsApiLoading(true)
    setHasSearched(true)
    setCurrentPage(pageNum)
    
    const activeWorkplace = overrideWorkplace || workplaceType

    try {
      const params = new URLSearchParams({ 
        q: searchTerm.trim(),
        location: locationSearch.trim(),
        workplace: activeWorkplace,
        page: pageNum.toString()
      })
      const resp = await fetch(`/api/jobs/search?${params.toString()}`)
      const data = await resp.json()
      
      const uniqueListings = (data.listings || [])
        .filter((job: any) => job && job.id && String(job.id).trim() !== "") // Ensure valid IDs
        .reduce((acc: JobListingRecord[], current: JobListingRecord) => {
          const x = acc.find(item => item.id === current.id);
          if (!x) return acc.concat([current]);
          return acc;
        }, []);
      
      setApiListings(uniqueListings)
      if (pageNum > 1) {
        window.scrollTo({ top: 300, behavior: "smooth" })
      }
    } catch (err) {
      toast({ variant: "destructive", title: "Search failed", description: "Try again in a moment." })
    } finally {
      setIsApiLoading(false)
    }
  }

  const handleWorkplaceFilterClick = (typeId: string) => {
    setWorkplaceType(typeId as any)
    if (hasSearched) {
      handlePerformSearch(1, typeId)
    }
  }

  const handleViewJob = async (job: JobListingRecord) => {
    setViewingJob(job)
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

  const stats = [
    { label: "UK Opportunities", value: apiListings.length, icon: Sparkles, color: "text-sky-700", bg: "bg-sky-50" },
    { label: "Saved Jobs", value: trackedApplications?.filter(a => a.status === "saved").length || 0, icon: Archive, color: "text-orange-700", bg: "bg-orange-50" },
    { label: "My Pipeline", value: trackedApplications?.filter(a => a.status !== "saved").length || 0, icon: Target, color: "text-emerald-700", bg: "bg-emerald-50" },
  ]

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#fdfdfd]">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-slate-100 bg-white px-4 py-8 lg:px-8 lg:py-12">
        <div className="relative mx-auto max-w-7xl flex flex-col items-center text-center gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-3 flex flex-col items-center w-full">
             <h1 className="headline-glossy-black py-2 text-xl font-black leading-tight tracking-tighter sm:text-3xl lg:text-4xl">
               Elevate your <span className="headline-gradient-vivid">professional orbit.</span>
             </h1>
             <p className="max-w-2xl text-base font-medium leading-relaxed text-slate-500 lg:text-lg">
               Access 140,000+ top-tier UK roles with intelligent tracking and premium insights.
             </p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full">
             <div className="flex flex-col items-center gap-6 w-full">
                <div className="flex flex-wrap justify-center items-center gap-2.5 sm:gap-4">
                  {stats.map((stat) => (
                    <div key={stat.label} className={cn("flex min-w-[114px] items-center gap-2 rounded-[1.15rem] px-2.5 py-1.5 sm:min-w-[138px] sm:gap-3 sm:rounded-[2rem] sm:px-4 sm:py-2 bg-white shadow-sm border border-slate-100 transition-all hover:shadow-md hover:border-blue-200", stat.bg)}>
                      <div className={cn("flex h-6 w-6 items-center justify-center rounded-lg sm:h-8 sm:w-8 sm:rounded-xl", stat.bg)}>
                        <stat.icon className={cn("h-3.5 w-3.5 sm:h-4 sm:w-4", stat.color)} />
                      </div>
                      <div className="flex flex-col text-left">
                        <span className="text-[8px] font-black uppercase tracking-[0.16em] text-slate-400 leading-tight sm:text-[9px] sm:tracking-[0.2em]">{stat.label}</span>
                        <span className="text-[0.95rem] font-black text-slate-900 leading-tight sm:text-base">{stat.value}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <Button variant="outline" className="btn-premium h-11 w-full px-6 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-slate-200/50 sm:w-auto" asChild>
                  <Link href="/tracker">
                    Go to Pipeline <ArrowRight className="ml-2 w-3.5 h-3.5" />
                  </Link>
                </Button>
             </div>
          </motion.div>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="mx-auto w-full max-w-[1800px] px-4 pb-20 lg:px-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="mx-auto w-full max-w-5xl space-y-6 pt-8">
            {/* Search Input Container */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative group">
              <div className="relative flex flex-col md:flex-row items-stretch md:items-center bg-white border border-slate-100 rounded-[2rem] p-2 shadow-xl gap-2">
                <div className="flex flex-[1.2] items-center min-w-0 px-4">
                  <Search className="h-5 w-5 text-slate-400" />
                  <Input 
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handlePerformSearch(1)}
                    placeholder="Role or skill..."
                    className="flex-1 border-0 bg-transparent text-lg font-bold focus-visible:ring-0 h-14"
                  />
                </div>
                <div className="hidden md:block w-px h-10 bg-slate-100" />
                <div className="flex flex-1 items-center min-w-0 px-4">
                  <MapPin className="h-5 w-5 text-slate-400" />
                  <Input 
                    value={locationSearch}
                    onChange={e => setLocationSearch(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handlePerformSearch(1)}
                    placeholder="Location..."
                    className="flex-1 border-0 bg-transparent text-lg font-bold focus-visible:ring-0 h-14"
                  />
                </div>
                <Button onClick={() => handlePerformSearch(1)} disabled={isApiLoading} className="h-14 px-8 rounded-2xl font-black bg-slate-900 text-white">
                  {isApiLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : "Search"}
                </Button>
              </div>
            </motion.div>

            {/* Workplace Filters & Tabs */}
            <div className="flex flex-wrap items-center justify-between gap-6">
              <div className="flex w-full flex-col gap-3 md:w-auto md:flex-row md:items-center md:gap-4">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Workplace</span>
                <div className="no-scrollbar flex overflow-x-auto gap-1 rounded-full bg-slate-100 p-1">
                  {["all", "remote", "hybrid", "onsite"].map((type) => (
                    <button
                      key={type}
                      onClick={() => handleWorkplaceFilterClick(type)}
                      className={cn(
                        "shrink-0 rounded-full px-4 py-1.5 text-[10px] font-black uppercase tracking-wider transition-all",
                        workplaceType === type ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"
                      )}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <TabsList className="grid h-auto w-full grid-cols-3 rounded-[1.35rem] border border-slate-100 bg-white p-1.5 shadow-sm sm:w-auto sm:rounded-full">
                <TabsTrigger value="discover" className="rounded-xl px-3 py-2 font-black text-[9px] uppercase tracking-[0.16em] data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all sm:rounded-full sm:px-6 sm:text-[10px]">Discover</TabsTrigger>
                <TabsTrigger value="saved" className="rounded-xl px-3 py-2 font-black text-[9px] uppercase tracking-[0.16em] data-[state=active]:bg-amber-600 data-[state=active]:text-white transition-all sm:rounded-full sm:px-6 sm:text-[10px]">Saved</TabsTrigger>
                <TabsTrigger value="tracking" className="rounded-xl px-3 py-2 font-black text-[9px] uppercase tracking-[0.16em] data-[state=active]:bg-emerald-600 data-[state=active]:text-white transition-all sm:rounded-full sm:px-6 sm:text-[10px]">Tracking</TabsTrigger>
              </TabsList>
            </div>
          </div>

          <div className="mt-8">
            <AnimatePresence mode="wait">
              <TabsContent value="discover" key="discover" className="m-0 outline-none">
                {(!hasSearched && !isApiLoading) ? (
                  <div className="py-12 text-center">
                    <Briefcase className="w-16 h-16 text-slate-200 mx-auto mb-6" />
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">Ready to explore?</h3>
                    <p className="text-slate-500 font-medium">Search 140,000+ live UK opportunities.</p>
                  </div>
                ) : (isApiLoading && apiListings.length === 0) ? (
                  <div className="py-12 text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
                    <p className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">Scanning Feeds...</p>
                  </div>
                ) : (
                  <div className="space-y-12 pb-20">
                    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                      {apiListings.map((job) => (
                        <JobCard key={job.id} job={job} isActive={false} onSelect={() => handleViewJob(job)} isSaved={trackedByFingerprint.get(buildListingFingerprint(job))?.status === "saved"} />
                      ))}
                    </div>

                    {/* Pagination Controls - Up to 10 Pages */}
                    <div className="flex flex-col items-center justify-center gap-6 pt-12 border-t border-slate-100">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          onClick={() => handlePerformSearch(currentPage - 1)}
                          disabled={currentPage === 1 || isApiLoading}
                          className="h-11 w-11 rounded-2xl border-slate-200 bg-white p-0 text-slate-600 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600 disabled:opacity-30"
                        >
                          <ChevronLeft className="h-5 w-5" />
                        </Button>

                        <div className="hidden items-center gap-1.5 sm:flex">
                          {[...Array(10)].map((_, i) => {
                            const page = i + 1
                            return (
                              <Button
                                key={page}
                                variant={currentPage === page ? "default" : "outline"}
                                onClick={() => handlePerformSearch(page)}
                                disabled={isApiLoading}
                                className={cn(
                                  "h-11 w-11 rounded-2xl border-slate-200 font-black transition-all duration-300",
                                  currentPage === page 
                                    ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30 scale-110" 
                                    : "bg-white text-slate-500 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                                )}
                              >
                                {page}
                              </Button>
                            )
                          })}
                        </div>
                        
                        <div className="text-sm font-black text-slate-400 sm:hidden">
                          Page {currentPage} of 10
                        </div>

                        <Button
                          variant="outline"
                          onClick={() => handlePerformSearch(currentPage + 1)}
                          disabled={currentPage === 10 || isApiLoading}
                          className="h-11 w-11 rounded-2xl border-slate-200 bg-white p-0 text-slate-600 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600 disabled:opacity-30"
                        >
                          <ChevronRight className="h-5 w-5" />
                        </Button>
                      </div>
                      
                      <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                        Showing {apiListings.length} jobs per page max (UK Sources Only)
                      </p>
                    </div>
                  </div>
                )}
              </TabsContent>
              <TabsContent value="saved" key="saved" className="m-0 outline-none">
                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                  {(trackedApplications || []).filter(a => a.status === "saved").map((app) => (
                    <JobCard key={app.id} job={buildListingFromApp(app)} isActive={false} onSelect={() => handleViewJob(buildListingFromApp(app))} isSaved={true} />
                  ))}
                </div>
              </TabsContent>
              <TabsContent value="tracking" key="tracking" className="m-0 outline-none">
                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                  {(trackedApplications || []).filter(a => a.status !== "saved").map((app) => (
                    <JobCard key={app.id} job={buildListingFromApp(app)} isActive={false} onSelect={() => handleViewJob(buildListingFromApp(app))} isSaved={false} />
                  ))}
                </div>
              </TabsContent>
            </AnimatePresence>
          </div>
        </Tabs>
      </div>

      {/* Detail Dialog */}
      <AnimatePresence>
        {viewingJob && (
          <Dialog open={!!viewingJob} onOpenChange={(open) => !open && setViewingJob(null)}>
            <DialogContent className="w-[calc(100vw-0.75rem)] max-w-4xl overflow-hidden rounded-[2rem] border-none bg-white p-0 shadow-2xl sm:w-full sm:rounded-[2.5rem]">
              <div className="flex max-h-[92dvh] flex-col sm:max-h-[90vh]">
                {/* Header with Vibrant Light Blue to Orange Gradient */}
                <div className="relative flex h-44 w-full shrink-0 flex-col justify-end overflow-hidden bg-gradient-to-br from-sky-400 via-blue-500 to-orange-500 p-5 pb-6 sm:h-56 sm:p-8 md:h-64 md:p-12">
                  {/* Custom High-Visibility Close Button */}
                  <div className="absolute right-4 top-4 z-50 sm:right-6 sm:top-6">
                    <Button 
                      variant="ghost" 
                      className="group h-10 w-10 rounded-full border border-white/30 bg-white/20 text-white backdrop-blur-md transition-all hover:scale-110 hover:bg-white/40 active:scale-95"
                      onClick={() => setViewingJob(null)}
                    >
                      <X className="w-5 h-5 font-black group-hover:rotate-90 transition-transform duration-300" />
                    </Button>
                  </div>

                  {/* Decorative Elements */}
                  <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-3xl rounded-full -mr-20 -mt-20" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-orange-400/20 blur-3xl rounded-full -ml-20 -mb-20" />
                  </div>

                  <div className="relative z-10 space-y-3 sm:space-y-4">
                    <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
                      <Badge className="rounded-full border border-white/30 bg-white/20 px-3 py-1 text-[9px] font-black uppercase tracking-[0.18em] text-white shadow-lg backdrop-blur-md sm:px-4 sm:py-1.5 sm:text-[10px] sm:tracking-[0.2em]">
                        {viewingJob.source} listing
                      </Badge>
                      <div className="flex h-2 w-2 rounded-full bg-emerald-300 animate-pulse shadow-[0_0_10px_rgba(110,231,183,1)]" />
                      <span className="text-[10px] font-black uppercase tracking-[0.16em] text-white drop-shadow-md sm:text-[11px] sm:tracking-widest">Live Platform</span>
                    </div>
                    <DialogTitle className="text-2xl font-black leading-tight tracking-tighter text-white drop-shadow-xl sm:text-3xl md:text-5xl">
                      {viewingJob.role}
                    </DialogTitle>
                    <div className="flex items-center gap-2 text-base font-bold text-white drop-shadow-md sm:text-lg">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/20 bg-white/20 shadow-inner backdrop-blur-sm sm:h-9 sm:w-9">
                        <Building2 className="h-4 w-4 text-white sm:h-5 sm:w-5" />
                      </div>
                      {viewingJob.company}
                    </div>
                  </div>
                </div>

                <div className="flex-1 space-y-7 overflow-y-auto bg-slate-50/20 p-5 sm:space-y-12 sm:p-8 md:p-12">
                  <DialogDescription className="sr-only">Detailed breakdown of the {viewingJob.role} position.</DialogDescription>
                  
                  <div className="grid grid-cols-2 gap-3 sm:gap-6 md:grid-cols-4">
                    {[
                      { label: "Location", value: viewingJob.location, icon: MapPin, color: "text-blue-600", bg: "bg-blue-50/50" },
                      { label: "Workplace", value: viewingJob.workplaceType, icon: Zap, color: "text-amber-600", bg: "bg-amber-50/50" },
                      { label: "Posted", value: viewingJob.postedLabel, icon: Clock3, color: "text-purple-600", bg: "bg-purple-50/50" },
                      { label: "Employment", value: viewingJob.employmentType || "Full-time", icon: Briefcase, color: "text-emerald-600", bg: "bg-emerald-50/50" },
                    ].map((stat, i) => (
                      <div key={i} className="group relative overflow-hidden rounded-[1.5rem] border border-slate-100 bg-white p-3.5 shadow-sm transition-all hover:border-slate-200 hover:shadow-md sm:rounded-[2rem] sm:p-5">
                        <div className={cn("mb-2.5 flex h-8 w-8 items-center justify-center rounded-xl transition-transform group-hover:scale-110 sm:mb-3 sm:h-10 sm:w-10", stat.bg)}>
                          <stat.icon className={cn("h-4 w-4 sm:h-5 sm:w-5", stat.color)} />
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-400 sm:text-[10px] sm:tracking-widest">{stat.label}</span>
                          <p className="text-[0.95rem] font-extrabold capitalize text-slate-900 sm:text-sm">{stat.value}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="prose prose-slate max-w-none">
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className="font-black text-xs uppercase tracking-widest text-slate-400">Description</h3>
                      {!isLoadingDetail && !fullDescription && (
                        <Badge variant="outline" className="text-[9px] border-slate-200 text-slate-400 uppercase font-black px-2 py-0">Summary</Badge>
                      )}
                    </div>
                    {isLoadingDetail ? (
                      <div className="space-y-4 animate-pulse">
                        <div className="h-4 bg-slate-100 rounded w-full" />
                        <div className="h-4 bg-slate-100 rounded w-5/6" />
                        <div className="h-4 bg-slate-100 rounded w-4/6" />
                      </div>
                    ) : (
                      <div 
                        className="whitespace-pre-wrap text-[0.95rem] leading-7 text-slate-600 sm:text-base md:text-lg"
                        dangerouslySetInnerHTML={{ __html: fullDescription || viewingJob.shortDescription || "" }}
                      />
                    )}
                    {!isLoadingDetail && !fullDescription && (
                      <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-center">
                        <p className="text-xs font-bold text-slate-500 sm:text-sm">
                          This is a summary provided by {viewingJob.source}. 
                          <br className="hidden md:block" /> Click <span className="text-slate-900">View Full Job</span> below to see the complete listing.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex shrink-0 flex-col gap-3 border-t border-slate-100 bg-white/95 p-4 shadow-[0_-10px_30px_-10px_rgba(0,0,0,0.03)] backdrop-blur-xl sm:gap-4 sm:p-8 md:flex-row">
                  <Button className="group relative h-12 flex-[1.5] overflow-hidden rounded-2xl bg-slate-900 text-base font-black text-white sm:h-14 md:h-16 md:text-lg" asChild>
                    <a href={viewingJob.sourceUrl} target="_blank" rel="noopener noreferrer">
                      <span className="relative z-10 flex items-center justify-center">
                        Apply Now <ArrowUpRight className="ml-2 w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                      </span>
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </a>
                  </Button>
                  
                  <Button variant="outline" className="h-12 flex-1 rounded-2xl border-2 border-slate-100 font-black text-slate-600 transition-all hover:border-slate-200 hover:bg-slate-50 hover:text-slate-900 sm:h-14 md:h-16" asChild>
                    <a href={viewingJob.sourceUrl} target="_blank" rel="noopener noreferrer">
                      View Full Job <ExternalLink className="ml-2 w-4 h-4" />
                    </a>
                  </Button>

                  <Button 
                    variant="outline" 
                    className="group h-12 w-full shrink-0 rounded-2xl border-2 border-slate-100 hover:bg-slate-50 sm:h-14 sm:w-14 md:h-16 md:w-16" 
                    onClick={() => handleSaveListing(viewingJob)}
                  >
                    <Bookmark className={cn(
                      "h-6 w-6 transition-all duration-300",
                      trackedByFingerprint.get(buildListingFingerprint(viewingJob))?.status === "saved" 
                        ? "fill-amber-500 text-amber-500 scale-125" 
                        : "text-slate-300 group-hover:text-slate-500"
                    )} />
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>
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
