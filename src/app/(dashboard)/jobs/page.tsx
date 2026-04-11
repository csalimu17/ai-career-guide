"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import React, { useState, useEffect, useMemo, useRef } from "react"
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
      setApiListings(data.listings || [])
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
    <div className="flex h-[calc(100vh-64px)] flex-col bg-[#fdfdfd]">
      {/* Search Header Section */}
      <section className="shrink-0 relative overflow-hidden bg-white border-b border-slate-100 px-6 py-8 lg:px-12">
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/3 w-96 h-96 bg-blue-400/5 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/4 w-64 h-64 bg-purple-400/5 blur-[100px] rounded-full pointer-events-none" />
        
        <div className="relative flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between max-w-[1600px] mx-auto">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/20">
                <Zap className="w-3 h-3 fill-current" />
                Live UK Search
              </div>
            </div>
            <div>
               <h1 className="text-4xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 lg:text-5xl pb-2 leading-normal">
                 Find your next role
               </h1>
               <p className="mt-2 text-slate-500 font-bold text-lg max-w-xl leading-relaxed">Search and track thousands of live opportunities across the UK.</p>
            </div>
          </div>

          <div className="flex items-center gap-6">
             {stats.map((s, i) => (
                <div key={i} className="hidden xl:flex flex-col items-center bg-white border border-slate-100 px-6 py-4 rounded-[2rem] shadow-sm min-w-[140px] transition-transform hover:scale-105">
                   <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{s.label}</span>
                   <div className="flex items-center gap-2">
                     <s.icon className={cn("w-4 h-4", s.color)} />
                     <span className={cn("text-2xl font-black tabular-nums", s.color)}>{s.value}</span>
                   </div>
                </div>
             ))}
             <Button size="lg" className="h-16 px-8 rounded-[2rem] font-black shadow-2xl shadow-blue-500/30 text-lg hover:translate-y-[-2px] transition-all" asChild>
                <Link href="/tracker">
                  My Tracker <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
             </Button>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden max-w-[1800px] mx-auto w-full">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-1 overflow-hidden">
          {/* Left Column: List & Tabs */}
          <div className="flex flex-col flex-1 bg-transparent">
            {/* Search & Filter Box */}
            <div className="p-6 pb-2 space-y-4 max-w-5xl mx-auto w-full">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-[2.5rem] blur opacity-10 group-focus-within:opacity-25 transition duration-1000 group-hover:duration-200" />
                <div className="relative flex flex-col md:flex-row items-stretch md:items-center bg-white border border-slate-100 rounded-[2.5rem] md:rounded-[3rem] p-2 shadow-xl shadow-slate-200/50 gap-2">
                  
                  {/* Keywords Input */}
                  <div className="flex flex-1 items-center min-w-0">
                    <div className="ml-4 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                      <Search className="h-5 w-5" />
                    </div>
                    <Input 
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && handlePerformSearch()}
                      placeholder="Role or keywords..."
                      className="flex-1 border-0 bg-transparent text-base md:text-lg font-bold placeholder:text-slate-300 focus-visible:ring-0 focus-visible:ring-offset-0 h-12"
                    />
                  </div>

                  <div className="hidden md:block w-px h-8 bg-slate-100 self-center" />

                  {/* Location Input */}
                  <div className="flex flex-1 items-center min-w-0">
                    <div className="ml-4 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-orange-50 text-orange-600">
                      <MapPin className="h-5 w-5" />
                    </div>
                    <Input 
                      value={locationSearch}
                      onChange={e => setLocationSearch(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && handlePerformSearch()}
                      placeholder="City or UK region..."
                      className="flex-1 border-0 bg-transparent text-base md:text-lg font-bold placeholder:text-slate-300 focus-visible:ring-0 focus-visible:ring-offset-0 h-12"
                    />
                  </div>

                  <Button 
                    onClick={handlePerformSearch}
                    disabled={isApiLoading}
                    className="h-12 md:h-14 px-10 rounded-[2rem] font-black text-sm uppercase tracking-widest bg-slate-900 shadow-lg hover:translate-y-[-1px] transition-all"
                  >
                    {isApiLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Search Jobs"}
                  </Button>
                </div>
              </div>

              {/* Advanced Filters: Workplace Type */}
              <div className="flex flex-wrap items-center justify-center gap-4 py-2">
                 <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-100">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Workplace:</span>
                    <div className="flex gap-1">
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
                            "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition-all",
                            workplaceType === type.id 
                              ? "bg-slate-900 text-white shadow-md shadow-slate-200" 
                              : "text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                          )}
                        >
                          {type.label}
                        </button>
                      ))}
                    </div>
                 </div>
              </div>

              <div className="flex items-center justify-center pt-2">
                <TabsList className="inline-flex h-12 items-center rounded-2xl bg-slate-100/30 p-1.5 border border-slate-100/50 backdrop-blur-sm min-w-[320px]">
                  <TabsTrigger value="discover" className="flex-1 rounded-xl h-9 font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm transition-all">Discover</TabsTrigger>
                  <TabsTrigger value="saved" className="flex-1 rounded-xl h-9 font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-amber-600 data-[state=active]:shadow-sm transition-all">Saved</TabsTrigger>
                  <TabsTrigger value="tracking" className="flex-1 rounded-xl h-9 font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-emerald-600 data-[state=active]:shadow-sm transition-all">Tracking</TabsTrigger>
                </TabsList>
              </div>
            </div>

            {/* Scrollable List container */}
            <div className="flex-1 overflow-y-auto px-6 pb-24 space-y-4 scrollbar-hide">
              <div className="max-w-5xl mx-auto w-full pt-4">
                <TabsContent value="discover" className="m-0 space-y-4 outline-none">
                  {!hasSearched ? (
                    <div className="py-24 text-center">
                      <div className="w-24 h-24 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-[3rem] flex items-center justify-center mx-auto mb-8 shadow-inner">
                        <Briefcase className="w-10 h-10 text-blue-500/50" />
                      </div>
                      <h3 className="text-2xl font-black text-slate-800 tracking-tight">Find your next job</h3>
                      <p className="mt-2 text-slate-500 font-bold max-w-[320px] mx-auto text-sm leading-relaxed">Search for keywords above to pull live opportunities from across the UK tech ecosystem.</p>
                    </div>
                  ) : isApiLoading ? (
                    <div className="py-24 flex flex-col items-center justify-center space-y-6">
                      <div className="relative">
                        <div className="absolute inset-0 bg-blue-500/10 blur-[40px] animate-pulse rounded-full" />
                        <Loader2 className="h-16 w-16 animate-spin text-blue-600 relative opacity-80" strokeWidth={3} />
                      </div>
                      <div className="text-center">
                         <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] animate-pulse">Aggregating Live UK Feeds</p>
                      </div>
                    </div>
                  ) : apiListings.length === 0 ? (
                    <div className="py-24 text-center bg-slate-50/50 rounded-[2.5rem] border border-dashed border-slate-200">
                      <Info className="h-12 w-12 mx-auto mb-4 text-slate-200" />
                      <h4 className="text-lg font-black text-slate-800 uppercase tracking-tight">No matches found</h4>
                      <p className="mt-1 text-xs font-bold text-slate-400 px-12">Try different keywords or a more general search.</p>
                    </div>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                       {apiListings.map(job => (
                        <JobCard
                          key={job.id} 
                          job={job} 
                          isActive={false} 
                          onSelect={() => handleViewJob(job)}
                          isSaved={trackedByFingerprint.get(buildListingFingerprint(job))?.status === "saved"}
                        />
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="saved" className="m-0 space-y-4 outline-none">
                  <div className="grid gap-4 md:grid-cols-2">
                    {(trackedApplications || []).filter(a => a.status === "saved").map(app => (
                      <JobCard
                          key={app.id} 
                          job={buildListingFromApp(app)}
                          isActive={false}
                          onSelect={() => handleViewJob(buildListingFromApp(app))}
                          isSaved={true}
                      />
                    ))}
                  </div>
                  {(trackedApplications || []).filter(a => a.status === "saved").length === 0 && (
                    <div className="py-24 text-center opacity-40">
                        <Archive className="w-12 h-12 mx-auto mb-4" />
                        <p className="font-black uppercase tracking-widest text-xs">Saved list is empty</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="tracking" className="m-0 space-y-4 outline-none">
                  <div className="grid gap-4 md:grid-cols-2">
                    {(trackedApplications || []).filter(a => a.status !== "saved").map(app => (
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
              </div>
            </div>
          </div>
        </Tabs>
      </div>

      {/* Unified Detail Modal */}
      {viewingJob && (
         <Dialog open={!!viewingJob} onOpenChange={() => setViewingJob(null)}>
            <DialogContent className={cn(
              "max-w-4xl p-0 border-none outline-none overflow-hidden bg-white shadow-2xl rounded-[2.5rem]",
              isMobile && "h-[100vh] w-full rounded-none m-0"
            )}>
              <div className="flex flex-col h-full max-h-[90vh]">
                <div className="flex-1 overflow-y-auto p-8 lg:p-12 space-y-12 scrollbar-hide">
                  <DialogHeader className="sr-only">
                    <DialogTitle>{viewingJob.role}</DialogTitle>
                    <DialogDescription>
                      Full job details for {viewingJob.role} at {viewingJob.company}.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-6">
                     <div className="flex items-center gap-3">
                        <Badge className={cn("rounded-xl px-4 py-1.5 text-[10px] font-black uppercase tracking-widest border-2", JOB_SOURCE_CONFIG[viewingJob.source].badgeClassName)}>
                          {JOB_SOURCE_CONFIG[viewingJob.source].label}
                        </Badge>
                     </div>
                     <h2 className="text-4xl font-black leading-[1.1] tracking-tighter text-slate-900 lg:text-5xl">{viewingJob.role}</h2>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <div className="flex items-center gap-3 text-slate-700 bg-slate-50 px-5 py-3 rounded-2xl border border-slate-100 shadow-sm">
                      <Building2 className="h-5 w-5 text-blue-500" /> 
                      <span className="font-black text-sm">{viewingJob.company}</span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-700 bg-slate-50 px-5 py-3 rounded-2xl border border-slate-100 shadow-sm">
                      <MapPin className="h-5 w-5 text-orange-500" /> 
                      <span className="font-bold text-sm">{viewingJob.location}</span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-700 bg-slate-50 px-5 py-3 rounded-2xl border border-slate-100 shadow-sm font-bold text-sm uppercase tracking-widest">
                      <Zap className="h-5 w-5 text-green-500" />
                      {viewingJob.workplaceType}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button size="lg" className="flex-1 h-16 rounded-[2rem] font-black text-lg shadow-xl shadow-blue-500/20 bg-blue-600 hover:bg-blue-700 transition-all group" asChild>
                      <a href={viewingJob.sourceUrl} target="_blank" rel="noopener noreferrer">
                        Apply Now <ChevronRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                      </a>
                    </Button>
                    <Button 
                      variant="outline" 
                      size="lg" 
                      className="flex-1 h-16 rounded-[2rem] font-black text-lg border-2 border-slate-100 hover:bg-slate-50"
                      onClick={() => handleSaveListing(viewingJob)}
                    >
                      {trackedByFingerprint.get(buildListingFingerprint(viewingJob))?.status === "saved" ? "Remove from List" : "Save Job"}
                    </Button>
                  </div>

                  <div className="space-y-8 pb-12">
                    <div className="flex items-center gap-4">
                       <h3 className="font-black text-[10px] uppercase tracking-[0.2em] text-slate-400 whitespace-nowrap">Job Description</h3>
                       <div className="h-px w-full bg-slate-100" />
                    </div>
                    
                    {isLoadingDetail ? (
                      <div className="space-y-6 animate-pulse">
                        <div className="h-4 bg-slate-100 rounded-[2rem] w-full" />
                        <div className="h-4 bg-slate-100 rounded-[2rem] w-[90%]" />
                        <div className="h-4 bg-slate-100 rounded-[2rem] w-[95%]" />
                         <div className="flex flex-col items-center pt-8">
                           <Loader2 className="h-8 w-8 animate-spin text-blue-200" />
                        </div>
                      </div>
                    ) : (
                      <div className="prose prose-slate max-w-none prose-p:text-slate-600 prose-p:text-lg prose-p:leading-relaxed prose-li:text-slate-600 prose-li:font-bold prose-headings:font-black prose-headings:tracking-tight">
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
