"use client"

import Link from "next/link"
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
  Info,
  Sparkles,
  Zap,
  Bookmark,
  ArrowUpRight,
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

import { JobCard } from "@/components/jobs/JobCard"

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
  
  // Job Detail states
  const [fullDescription, setFullDescription] = useState<string | null>(null)
  const [isLoadingDetail, setIsLoadingDetail] = useState(false)

  const [applyListing, setApplyListing] = useState<JobListingRecord | null>(null)
  const [isApplyDialogOpen, setIsApplyDialogOpen] = useState(false)
  const [selectedResumeId, setSelectedResumeId] = useState("none")
  const [isStartingApply, setIsStartingApply] = useState(false)

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

  const handlePerformSearch = async () => {
    if (!searchTerm.trim()) return
    setIsApiLoading(true)
    setHasSearched(true)
    try {
      const params = new URLSearchParams({ 
        q: searchTerm.trim(),
        location: locationSearch.trim(),
        workplace: workplaceType
      })
      const resp = await fetch(`/api/jobs/search?${params.toString()}`)
      const data = await resp.json()
      
      // De-duplicate results by ID just in case the backend sent duplicates
      const uniqueListings = (data.listings || []).reduce((acc: JobListingRecord[], current: JobListingRecord) => {
        const x = acc.find(item => item.id === current.id);
        if (!x) return acc.concat([current]);
        return acc;
      }, []);
      
      setApiListings(uniqueListings)
    } catch (err) {
      toast({ variant: "destructive", title: "Search failed", description: "Try again in a moment." })
    } finally {
      setIsApiLoading(false)
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
    { label: "UK Opportunities", value: apiListings.length, icon: Sparkles, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Saved Jobs", value: trackedApplications?.filter(a => a.status === "saved").length || 0, icon: Archive, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "My Pipeline", value: trackedApplications?.filter(a => a.status !== "saved").length || 0, icon: Target, color: "text-emerald-600", bg: "bg-emerald-50" },
  ]

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#fdfdfd]">
      {/* Search Header Section */}
      <section className="relative overflow-hidden border-b border-slate-100 bg-white px-4 py-8 lg:px-8 lg:py-12">
        {/* Dynamic Background Elements */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/3 w-[600px] h-[600px] bg-blue-500/5 blur-[140px] rounded-full pointer-events-none" 
        />
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
          className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/4 w-[400px] h-[400px] bg-indigo-500/5 blur-[120px] rounded-full pointer-events-none" 
        />
        
        <div className="relative mx-auto flex max-w-[1600px] flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-5 lg:max-w-3xl">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3"
            >
              <div className="flex items-center gap-1.5 rounded-full bg-blue-600 px-4 py-1.5 text-[11px] font-black uppercase tracking-[0.2em] text-white shadow-[0_20px_40px_-15px_rgba(37,99,235,0.4)]">
                <Zap className="w-3.5 h-3.5 fill-current" />
                Live UK Search
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
               <h1 className="bg-clip-text pb-2 text-[3.2rem] font-black leading-[1.1] tracking-tighter text-transparent bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 sm:text-[4rem] lg:text-[4.5rem]">
                 Find your next role
               </h1>
               <p className="mt-4 max-w-2xl text-base font-medium leading-relaxed text-slate-500 lg:text-lg">
                 Search 140,000+ live opportunities across the UK, save the ones worth chasing, and track your applications in one premium dashboard.
               </p>
            </motion.div>
          </div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col gap-4 lg:items-end"
          >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  {/* Dashboard stats / tracker link */}
                  <div className="flex flex-wrap items-center gap-3">
                    {stats.map((stat) => (
                      <div key={stat.label} className={cn("flex items-center gap-2 rounded-2xl px-4 py-2.5 bg-white shadow-sm border border-slate-50", stat.bg)}>
                        <stat.icon className={cn("w-4 h-4", stat.color)} />
                        <div className="flex flex-col">
                          <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">{stat.label}</span>
                          <span className="text-sm font-black text-slate-900 leading-none">{stat.value}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Button 
                    variant="outline" 
                    className="h-12 md:h-14 px-6 md:px-8 rounded-2xl md:rounded-3xl font-black text-[10px] md:text-xs uppercase tracking-[0.2em] bg-gradient-to-br from-purple-600 to-orange-500 text-white border-0 shadow-lg hover:scale-[1.02] active:scale-95 transition-all group w-full md:w-auto mt-4 md:mt-0"
                    asChild
                  >
                    <Link href="/tracker">
                      Go to Tracker <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </Button>
                </div>
          </motion.div>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="mx-auto w-full max-w-[1800px] px-4 pb-20 lg:px-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* Left Column: List & Tabs */}
          <div className="bg-transparent">
            {/* Search & Filter Box */}
            <div className="mx-auto w-full max-w-5xl space-y-6 p-4 pb-4 lg:p-8">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="relative group"
              >
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 rounded-[2.5rem] blur opacity-15 group-focus-within:opacity-30 transition duration-1000 group-hover:duration-200" />
                <div className="relative flex flex-col md:flex-row items-stretch md:items-center bg-white/80 backdrop-blur-xl border border-white/50 rounded-[2rem] md:rounded-[3rem] p-2 md:p-2.5 shadow-[0_30px_70px_-30px_rgba(15,23,42,0.25)] gap-2 md:gap-3">
                  
                  {/* Keywords Input */}
                  <div className="flex flex-[1.2] items-center min-w-0 group/input">
                    <div className="ml-3 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 transition-colors group-focus-within/input:bg-blue-600 group-focus-within/input:text-white">
                      <Search className="h-5 w-5" />
                    </div>
                    <Input 
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && handlePerformSearch()}
                      placeholder="Role or skill..."
                      className="flex-1 border-0 bg-transparent text-base md:text-lg font-bold placeholder:text-slate-300 focus-visible:ring-0 focus-visible:ring-offset-0 h-11 md:h-14"
                    />
                  </div>

                  <div className="hidden md:block w-px h-10 bg-slate-100/80 self-center" />

                  {/* Location Input */}
                  <div className="flex flex-1 items-center min-w-0 group/input">
                    <div className="ml-3 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-orange-50 text-orange-600 transition-colors group-focus-within/input:bg-orange-600 group-focus-within/input:text-white">
                      <MapPin className="h-5 w-5" />
                    </div>
                    <Input 
                      value={locationSearch}
                      onChange={e => setLocationSearch(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && handlePerformSearch()}
                      placeholder="Location..."
                      className="flex-1 border-0 bg-transparent text-base md:text-lg font-bold placeholder:text-slate-300 focus-visible:ring-0 focus-visible:ring-offset-0 h-11 md:h-14"
                    />
                  </div>

                  <Button 
                    onClick={handlePerformSearch}
                    disabled={isApiLoading}
                    className="h-12 md:h-16 px-10 rounded-[1.8rem] md:rounded-[2.5rem] font-black text-xs uppercase tracking-[0.2em] bg-slate-900 hover:bg-slate-800 transition-all shadow-[0_20px_40px_-15px_rgba(15,23,42,0.5)] active:scale-95"
                  >
                    {isApiLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : "Search Jobs"}
                  </Button>
                </div>
              </motion.div>

              {/* Advanced Filters: Workplace Type */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="flex flex-wrap items-center justify-between gap-6 py-2 px-4"
              >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Workplace preference</span>
                      <div className="flex flex-wrap gap-1 p-1 bg-slate-100/60 rounded-2xl md:rounded-full border border-slate-200/50 backdrop-blur-sm">
                       {[
                         { id: "all", label: "Any" },
                         { id: "remote", label: "Remote" },
                         { id: "hybrid", label: "Hybrid" },
                         { id: "onsite", label: "On-site" }
                       ].map((type) => (
                         <button
                           key={type.id}
                           onClick={() => setWorkplaceType(type.id as any)}
                           className={cn(
                             "px-3 md:px-4 py-1.5 rounded-xl md:rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-wider transition-all duration-300",
                             workplaceType === type.id 
                               ? "bg-white text-slate-900 shadow-sm" 
                               : "text-slate-400 hover:text-slate-600"
                           )}
                         >
                           {type.label}
                         </button>
                       ))}
                     </div>
                  </div>

                  <TabsList className="h-11 md:h-12 items-center rounded-full border border-slate-100 bg-white/50 p-1.5 backdrop-blur-sm w-full md:w-auto md:min-w-[340px] shadow-[0_10px_30px_-10px_rgba(15,23,42,0.1)]">
                    <TabsTrigger key="t-discover" value="discover" className="flex-1 rounded-full h-8 md:h-9 font-black text-[9px] md:text-[10px] uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm transition-all">Discover</TabsTrigger><TabsTrigger key="t-saved" value="saved" className="flex-1 rounded-full h-8 md:h-9 font-black text-[9px] md:text-[10px] uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-amber-600 data-[state=active]:shadow-sm transition-all">Saved</TabsTrigger><TabsTrigger key="t-tracking" value="tracking" className="flex-1 rounded-full h-8 md:h-9 font-black text-[9px] md:text-[10px] uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-emerald-600 data-[state=active]:shadow-sm transition-all">Tracking</TabsTrigger>
                  </TabsList>
              </motion.div>
            </div>

            {/* Scrollable List container */}
            <div className="space-y-4 px-4 pb-12 pt-6 lg:px-8">
              <div className="mx-auto w-full max-w-[1600px]">
                <AnimatePresence mode="wait">
                  <TabsContent key="content-discover" value="discover" className="m-0 outline-none">
                    {!hasSearched ? (
                      <motion.div 
                        key="discover-initial"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="py-24 text-center lg:py-32"
                      >
                        <div className="relative inline-block">
                          <div className="absolute inset-0 bg-blue-500/10 blur-[50px] rounded-full animate-pulse" />
                          <div className="relative w-28 h-28 bg-white rounded-[3rem] shadow-[0_30px_60px_-15px_rgba(15,23,42,0.1)] border border-slate-50 flex items-center justify-center mx-auto mb-10">
                            <Briefcase className="w-12 h-12 text-blue-600/60" strokeWidth={1.5} />
                          </div>
                        </div>
                        <h3 className="text-3xl font-black text-slate-900 tracking-tighter mb-4">Ready to explore?</h3>
                        <p className="max-w-[380px] mx-auto text-base font-medium text-slate-500 leading-relaxed">
                          Enter role keywords above to filter through 140,000+ live opportunities aggregated for you.
                        </p>
                      </motion.div>
                    ) : isApiLoading ? (
                      <div key="discover-loading" className="py-32 flex flex-col items-center justify-center space-y-8">
                        <div className="relative h-20 w-20">
                          <div className="absolute inset-0 bg-blue-500/20 blur-[30px] rounded-full animate-ping" />
                          <Loader2 className="h-20 w-20 animate-spin text-blue-600 relative z-10" strokeWidth={2.5} />
                        </div>
                        <div className="text-center space-y-2">
                           <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em] animate-pulse">Scanning Cloud Feeds</p>
                           <p className="text-sm font-bold text-slate-400">Curating the best matches for you...</p>
                        </div>
                      </div>
                    ) : apiListings.length === 0 ? (
                      <motion.div 
                        key="discover-none"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="rounded-[3rem] border border-dashed border-slate-200 bg-slate-50/50 py-32 text-center"
                      >
                        <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm border border-slate-100">
                          <Info className="h-10 w-10 text-slate-300" />
                        </div>
                        <h4 className="text-xl font-black text-slate-900 tracking-tight">Zero matches found</h4>
                        <p className="mt-2 text-sm font-bold text-slate-400 max-w-[280px] mx-auto">Try broadening your search or checking for spelling errors.</p>
                      </motion.div>
                    ) : (
                      <motion.div 
                        key="discover-grid"
                        initial="hidden"
                        animate="show"
                        variants={{
                          show: { transition: { staggerChildren: 0.04 } }
                        }}
                        className="grid gap-6 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
                      >
                         {apiListings.map((job, idx) => (
                          <motion.div
                            key={`${job.source}-${job.id || idx}`}
                            variants={{
                              hidden: { opacity: 0, y: 20 },
                              show: { opacity: 1, y: 0 }
                            }}
                          >
                            <JobCard
                              job={job} 
                              isActive={false} 
                              onSelect={() => handleViewJob(job)}
                              isSaved={trackedByFingerprint.get(buildListingFingerprint(job))?.status === "saved"}
                            />
                          </motion.div>
                        ))}
                      </motion.div>
                    )}
                  </TabsContent><TabsContent key="content-saved" value="saved" className="m-0 outline-none">
                    <motion.div 
                      key="saved-grid"
                      initial="hidden"
                      animate="show"
                      variants={{ show: { transition: { staggerChildren: 0.04 } } }}
                      className="grid gap-6 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
                    >
                      {(trackedApplications || []).filter(a => a.status === "saved").map((app, idx) => (
                        <motion.div
                          key={`saved-${app.id || idx}`}
                          variants={{
                            hidden: { opacity: 0, y: 20 },
                            show: { opacity: 1, y: 0 }
                          }}
                        >
                          <JobCard
                              job={buildListingFromApp(app)}
                              isActive={false}
                              onSelect={() => handleViewJob(buildListingFromApp(app))}
                              isSaved={true}
                          />
                        </motion.div>
                      ))}
                    </motion.div>
                    {(trackedApplications || []).filter(a => a.status === "saved").length === 0 && (
                      <div key="saved-empty" className="py-32 text-center lg:py-40">
                          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 opacity-40">
                            <Bookmark className="w-8 h-8 text-slate-400" />
                          </div>
                          <p className="font-black uppercase tracking-[0.2em] text-[11px] text-slate-400">Your collection is empty</p>
                      </div>
                    )}
                  </TabsContent><TabsContent key="content-tracking" value="tracking" className="m-0 outline-none">
                    <motion.div 
                      key="tracking-grid"
                      initial="hidden"
                      animate="show"
                      variants={{ show: { transition: { staggerChildren: 0.04 } } }}
                      className="grid gap-6 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
                    >
                      {(trackedApplications || []).filter(a => a.status !== "saved").map((app, idx) => (
                        <motion.div
                          key={`tracked-${app.id || idx}`}
                          variants={{
                            hidden: { opacity: 0, y: 20 },
                            show: { opacity: 1, y: 0 }
                          }}
                        >
                          <JobCard
                              job={buildListingFromApp(app)}
                              isActive={false}
                              onSelect={() => handleViewJob(buildListingFromApp(app))}
                              isSaved={false}
                          />
                        </motion.div>
                      ))}
                    </motion.div>
                    {(trackedApplications || []).filter(a => a.status !== "saved").length === 0 && (
                      <div key="tracking-empty" className="py-32 text-center lg:py-40">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 opacity-40">
                          <Target className="w-8 h-8 text-slate-400" />
                        </div>
                        <p className="font-black uppercase tracking-[0.2em] text-[11px] text-slate-400">Your pipeline is empty</p>
                      </div>
                    )}
                  </TabsContent>
                </AnimatePresence>
              </div>
            </div>
          </div>
        </Tabs>
      </div>

      {/* Unified Detail Modal - Premium Polish */}
      <AnimatePresence>
        {viewingJob && (
          <Dialog open={!!viewingJob} onOpenChange={() => setViewingJob(null)}>
            <DialogContent className={cn(
               "max-w-4xl p-0 border-none outline-none overflow-hidden bg-white shadow-[0_50px_100px_-20px_rgba(15,23,42,0.25)] rounded-[3.5rem]",
               isMobile && "h-[100vh] w-full rounded-none m-0"
             )}>
              <div className="flex flex-col h-full max-h-[90vh]">
                <div className="flex-1 overflow-y-auto p-8 lg:p-14 space-y-12 scrollbar-hide">
                  <DialogHeader className="sr-only">
                    <DialogTitle>{viewingJob.role}</DialogTitle>
                    <DialogDescription>
                      Full job details for {viewingJob.role} at {viewingJob.company}.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-8">
                     <div className="flex items-center justify-between">
                        <Badge className={cn("rounded-xl px-5 py-2 text-[11px] font-black uppercase tracking-[0.2em] border-2 shadow-sm", JOB_SOURCE_CONFIG[viewingJob.source].badgeClassName)}>
                          {JOB_SOURCE_CONFIG[viewingJob.source].label}
                        </Badge>
                        <button 
                          onClick={() => setViewingJob(null)}
                          className="h-12 w-12 flex items-center justify-center rounded-full bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-900 transition-all active:scale-95"
                        >
                          <ChevronRight className="rotate-90 w-6 h-6" />
                        </button>
                     </div>
                     <h2 className="text-4xl font-black leading-[1.05] tracking-tighter text-slate-900 lg:text-6xl max-w-2xl">{viewingJob.role}</h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    <div className="flex items-center gap-4 text-slate-700 bg-blue-50/50 px-6 py-5 rounded-[2rem] border border-blue-100/50 shadow-sm transition-transform hover:scale-[1.02]">
                      <div className="h-12 w-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
                        <Building2 className="h-6 w-6" /> 
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-blue-600/60 uppercase tracking-widest">Company</span>
                        <span className="font-black text-lg leading-tight">{viewingJob.company}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-slate-700 bg-orange-50/50 px-6 py-5 rounded-[2rem] border border-orange-100/50 shadow-sm transition-transform hover:scale-[1.02]">
                      <div className="h-12 w-12 rounded-2xl bg-orange-600 flex items-center justify-center text-white shadow-lg shadow-orange-500/30">
                        <MapPin className="h-6 w-6" /> 
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-orange-600/60 uppercase tracking-widest">Location</span>
                        <span className="font-black text-lg leading-tight">{viewingJob.location}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-slate-700 bg-emerald-50/50 px-6 py-5 rounded-[2rem] border border-emerald-100/50 shadow-sm transition-transform hover:scale-[1.02]">
                      <div className="h-12 w-12 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/30">
                        <Zap className="h-6 w-6" /> 
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-emerald-600/60 uppercase tracking-widest">Environment</span>
                        <span className="font-black text-lg leading-tight capitalize">{viewingJob.workplaceType}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-5">
                    <Button size="lg" className="flex-1 h-20 rounded-[2.5rem] font-black text-xl shadow-[0_25px_50px_-15px_rgba(37,99,235,0.4)] bg-blue-600 hover:bg-blue-700 transition-all hover:-translate-y-1 active:scale-95 group" asChild>
                      <a href={viewingJob.sourceUrl} target="_blank" rel="noopener noreferrer">
                        Proceed to Apply <ArrowUpRight className="ml-3 h-6 w-6 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                      </a>
                    </Button>
                    <Button 
                      variant="outline" 
                      size="lg" 
                      className="flex-1 h-20 rounded-[2.5rem] font-black text-xl border-2 border-slate-100 hover:bg-slate-50 transition-all hover:border-blue-100"
                      onClick={() => handleSaveListing(viewingJob)}
                    >
                      <Bookmark className={cn(
                        "w-6 h-6 mr-3 transition-colors",
                        trackedByFingerprint.get(buildListingFingerprint(viewingJob))?.status === "saved" ? "fill-amber-500 text-amber-500" : "text-slate-400"
                      )} />
                      {trackedByFingerprint.get(buildListingFingerprint(viewingJob))?.status === "saved" ? "Unsave Role" : "Save for later"}
                    </Button>
                  </div>

                  <div className="space-y-10 pb-12">
                    <div className="flex items-center gap-6">
                       <h3 className="font-black text-xs uppercase tracking-[0.3em] text-slate-300 whitespace-nowrap">Opportunity Context</h3>
                       <div className="h-px w-full bg-slate-100" />
                    </div>
                    
                    {isLoadingDetail ? (
                      <div className="space-y-8 animate-pulse">
                        <div className="h-5 bg-slate-50 rounded-[2rem] w-full" />
                        <div className="h-5 bg-slate-50 rounded-[2rem] w-[90%]" />
                        <div className="h-5 bg-slate-50 rounded-[2rem] w-[95%]" />
                         <div className="flex flex-col items-center pt-10">
                           <Loader2 className="h-10 w-10 animate-spin text-blue-100" />
                        </div>
                      </div>
                    ) : (
                      <div className="prose prose-slate prose-xl max-w-none prose-p:text-slate-600 prose-p:text-xl prose-p:font-medium prose-p:leading-relaxed prose-li:text-slate-600 prose-li:font-bold prose-headings:font-black prose-headings:tracking-tight">
                        {fullDescription ? (
                          <div dangerouslySetInnerHTML={{ __html: fullDescription.replace(/\n/g, "<br/>") }} />
                        ) : (
                          <div dangerouslySetInnerHTML={{ __html: (viewingJob.shortDescription || "Full description not available. Please check the application link.").replace(/\n/g, "<br/>") }} />
                        )}
                      </div>
                    )}
                  </div>
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
