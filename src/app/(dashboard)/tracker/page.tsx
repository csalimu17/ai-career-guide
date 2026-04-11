"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { addDoc, collection, deleteDoc, doc, orderBy, query, serverTimestamp, updateDoc } from "firebase/firestore"
import {
  Archive,
  Building2,
  Calendar,
  CheckCircle2,
  Clock3,
  Edit2,
  ExternalLink,
  FileText,
  Filter,
  Loader2,
  MapPin,
  MoreVertical,
  Plus,
  Search,
  Sparkles,
  Trash2,
  Trophy,
  XCircle,
} from "lucide-react"

import { useCollection, useFirestore, useMemoFirebase, useUser } from "@/firebase"
import { LinkedInImporter } from "@/components/tracker/linkedin-importer"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/hooks/use-toast"
import {
  buildTrackedApplicationPayload,
  getSafeJobSource,
  getStatusCount,
  JOB_SOURCE_CONFIG,
  JOB_SOURCE_DEFAULT_URLS,
  JOB_TRACKING_STATUSES,
  JOB_STATUS_CONFIG,
  type JobApplicationRecord,
  type JobEmploymentType,
  type JobListingRecord,
  type JobSource,
  type JobTrackingStatus,
  type JobWorkplaceType,
} from "@/lib/jobs/model"
import { cn } from "@/lib/utils"

type ResumeRecord = { id: string; name: string }
type TrackedJob = JobApplicationRecord & {
  id: string
  appliedDate?: string
  updatedAt?: { toDate?: () => Date }
}
type TrackerFormState = {
  company: string
  role: string
  source: JobSource
  sourceUrl: string
  status: JobTrackingStatus
  location: string
  notes: string
  resumeId: string
  workplaceType: JobWorkplaceType
  employmentType: JobEmploymentType
}

const statusIcons = {
  saved: Archive,
  started: Clock3,
  applied: CheckCircle2,
  interviewing: Sparkles,
  offer: Trophy,
  rejected: XCircle,
} satisfies Record<JobTrackingStatus, typeof Archive>

function createDefaultFormState(): TrackerFormState {
  return {
    company: "",
    role: "",
    source: "linkedin",
    sourceUrl: JOB_SOURCE_DEFAULT_URLS.linkedin,
    status: "applied",
    location: "",
    notes: "",
    resumeId: "none",
    workplaceType: "remote",
    employmentType: "full-time",
  }
}

function formatJobDate(job: TrackedJob) {
  const raw = job.appliedAt || job.appliedDate || job.updatedAt?.toDate?.()?.toISOString()
  if (!raw) return "Recently updated"
  const resolved = new Date(raw)
  return Number.isNaN(resolved.getTime())
    ? "Recently updated"
    : resolved.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
}

function buildListingFromTrackedJob(job: TrackedJob): JobListingRecord {
  const source = getSafeJobSource(job.source)
  return {
    id: job.jobListingId || job.id,
    externalJobId: job.externalJobId || undefined,
    source,
    sourceUrl: job.sourceUrl || JOB_SOURCE_DEFAULT_URLS[source],
    company: job.company,
    role: job.role,
    location: job.location || "Location not specified",
    workplaceType: job.workplaceType || "remote",
    employmentType: job.employmentType || "full-time",
    shortDescription: job.jobDescription || "Tracked application record.",
    postedLabel: "Tracked in pipeline",
    tags: [],
    listingOrigin: job.listingOrigin || "manual_entry",
    integrationMode: job.partnerSync?.integrationMode || "redirect",
    partnerCapabilities: job.partnerSync?.capabilities || JOB_SOURCE_CONFIG[source].plannedCapabilities,
  }
}

export default function TrackerPage() {
  const { user } = useUser()
  const db = useFirestore()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<JobTrackingStatus | "all">("all")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingJob, setEditingJob] = useState<TrackedJob | null>(null)
  const [formData, setFormData] = useState<TrackerFormState>(createDefaultFormState())

  const resumesQuery = useMemoFirebase(() => {
    if (!db || !user) return null
    return query(collection(db, "users", user.uid, "resumes"), orderBy("updatedAt", "desc"))
  }, [db, user])
  const { data: resumes } = useCollection<ResumeRecord>(resumesQuery)

  const jobsQuery = useMemoFirebase(() => {
    if (!db || !user) return null
    return query(collection(db, "users", user.uid, "jobApplications"), orderBy("updatedAt", "desc"))
  }, [db, user])
  const { data: jobs, isLoading } = useCollection<TrackedJob>(jobsQuery)

  const resumesById = useMemo(() => new Map((resumes || []).map((resume) => [resume.id, resume])), [resumes])
  const filteredJobs = useMemo(() => {
    return (jobs || []).filter((job) => {
      const haystack = [job.company, job.role, job.location, job.sourceLabel, job.resumeName].filter(Boolean).join(" ").toLowerCase()
      return haystack.includes(searchTerm.toLowerCase()) && (statusFilter === "all" || job.status === statusFilter)
    })
  }, [jobs, searchTerm, statusFilter])

  const stats = [
    { label: "Total tracked", value: jobs?.length || 0, color: "text-primary" },
    { label: "Saved", value: getStatusCount(jobs, "saved"), color: "text-amber-600" },
    { label: "Started", value: getStatusCount(jobs, "started"), color: "text-sky-600" },
    { label: "Applied+", value: (jobs || []).filter((job) => ["applied", "interviewing", "offer"].includes(job.status)).length, color: "text-blue-600" },
  ]

  const resetForm = () => {
    setFormData(createDefaultFormState())
    setEditingJob(null)
  }

  const openEditDialog = (job: TrackedJob) => {
    const source = getSafeJobSource(job.source)
    setEditingJob(job)
    setFormData({
      company: job.company,
      role: job.role,
      source,
      sourceUrl: job.sourceUrl || JOB_SOURCE_DEFAULT_URLS[source],
      status: job.status,
      location: job.location || "",
      notes: job.notes || "",
      resumeId: job.resumeId || "none",
      workplaceType: job.workplaceType || "remote",
      employmentType: job.employmentType || "full-time",
    })
    setIsDialogOpen(true)
  }

  const handleSourceChange = (source: JobSource) => {
    setFormData((current) => ({
      ...current,
      source,
      sourceUrl: !current.sourceUrl || current.sourceUrl === JOB_SOURCE_DEFAULT_URLS[current.source] ? JOB_SOURCE_DEFAULT_URLS[source] : current.sourceUrl,
    }))
  }

  const handleSaveJob = async () => {
    if (!user || !db || !formData.company.trim() || !formData.role.trim()) {
      toast({ variant: "destructive", title: "Missing required details", description: "Add a company and role before saving." })
      return
    }

    try {
      const linkedResume = formData.resumeId === "none" ? null : resumesById.get(formData.resumeId) || null
      const listing: JobListingRecord = {
        id: editingJob?.jobListingId || `${formData.source}-${formData.company}-${formData.role}`.toLowerCase().replace(/\s+/g, "-"),
        externalJobId: editingJob?.externalJobId || undefined,
        source: formData.source,
        sourceUrl: formData.sourceUrl.trim() || JOB_SOURCE_DEFAULT_URLS[formData.source],
        company: formData.company.trim(),
        role: formData.role.trim(),
        location: formData.location.trim() || "Location not specified",
        workplaceType: formData.workplaceType,
        employmentType: formData.employmentType,
        shortDescription: editingJob?.jobDescription || "Manually tracked opportunity.",
        postedLabel: editingJob ? "Updated in tracker" : "Manually added",
        tags: [],
        listingOrigin: editingJob?.listingOrigin || "manual_entry",
        integrationMode: editingJob?.partnerSync?.integrationMode || "redirect",
        partnerCapabilities: editingJob?.partnerSync?.capabilities || JOB_SOURCE_CONFIG[formData.source].plannedCapabilities,
      }

      const payload = buildTrackedApplicationPayload({
        userId: user.uid,
        listing,
        status: formData.status,
        statusSource: editingJob ? "status_update" : "manual_entry",
        note: editingJob ? "Updated from the tracker workspace." : "Added manually from the tracker workspace.",
        resumeId: formData.resumeId === "none" ? null : formData.resumeId,
        resumeName: formData.resumeId === "none" ? "General resume" : linkedResume?.name || editingJob?.resumeName || "Selected resume",
        existingHistory: editingJob?.statusHistory,
        existingAppliedAt: editingJob?.appliedAt || null,
      })

      const nextPayload = {
        ...payload,
        notes: formData.notes.trim(),
        jobDescription: editingJob?.jobDescription || "",
        partnerSync: editingJob?.partnerSync ? { ...editingJob.partnerSync, integrationMode: listing.integrationMode || editingJob.partnerSync.integrationMode, capabilities: listing.partnerCapabilities || editingJob.partnerSync.capabilities } : payload.partnerSync,
        sourceClickStartedAt: editingJob?.sourceClickStartedAt || payload.sourceClickStartedAt,
        appliedDate: payload.appliedAt ? payload.appliedAt.split("T")[0] : editingJob?.appliedDate || "",
        updatedAt: serverTimestamp(),
      }

      if (editingJob) {
        await updateDoc(doc(db, "users", user.uid, "jobApplications", editingJob.id), nextPayload)
      } else {
        await addDoc(collection(db, "users", user.uid, "jobApplications"), { ...nextPayload, createdAt: serverTimestamp() })
      }

      toast({ title: editingJob ? "Tracker record updated" : "Application added", description: `${formData.role} at ${formData.company} is now ${JOB_STATUS_CONFIG[formData.status].label}.` })
      setIsDialogOpen(false)
      resetForm()
    } catch (error) {
      console.error("Failed to save tracker record:", error)
      toast({ variant: "destructive", title: "Couldn't save application", description: "We couldn't save this tracker record right now." })
    }
  }

  const handleStatusUpdate = async (job: TrackedJob, status: JobTrackingStatus) => {
    if (!user || !db || status === job.status) return
    try {
      const payload = buildTrackedApplicationPayload({
        userId: user.uid,
        listing: buildListingFromTrackedJob(job),
        status,
        statusSource: "status_update",
        note: `Status changed to ${JOB_STATUS_CONFIG[status].label} from the tracker.`,
        resumeId: job.resumeId || null,
        resumeName: job.resumeName || null,
        existingHistory: job.statusHistory,
        existingAppliedAt: job.appliedAt || null,
      })
      await updateDoc(doc(db, "users", user.uid, "jobApplications", job.id), {
        ...payload,
        notes: job.notes || "",
        jobDescription: job.jobDescription || "",
        partnerSync: job.partnerSync || payload.partnerSync,
        sourceClickStartedAt: job.sourceClickStartedAt || payload.sourceClickStartedAt,
        appliedDate: payload.appliedAt ? payload.appliedAt.split("T")[0] : job.appliedDate || "",
        updatedAt: serverTimestamp(),
      })
      toast({ title: "Status updated", description: `${job.role} at ${job.company} is now ${JOB_STATUS_CONFIG[status].label}.` })
    } catch (error) {
      console.error("Failed to update tracker status:", error)
      toast({ variant: "destructive", title: "Couldn't update status", description: "We couldn't update this application right now." })
    }
  }

  const handleDeleteJob = async (id: string) => {
    if (!user || !db) return
    try {
      await deleteDoc(doc(db, "users", user.uid, "jobApplications", id))
      toast({ title: "Tracker record deleted", description: "The application has been removed from your pipeline." })
    } catch (error) {
      console.error("Failed to delete tracker record:", error)
      toast({ variant: "destructive", title: "Couldn't delete record", description: "We couldn't remove this application right now." })
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 pb-20 pt-4 md:px-8 md:pt-8">
      <section className="section-shell relative overflow-hidden p-6 md:p-12">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-500/10 blur-[100px] rounded-full pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-indigo-500/10 blur-[80px] rounded-full pointer-events-none" />
        
        <div className="relative space-y-6">
          <div className="eyebrow-chip px-4 py-1.5">
            <Clock3 className="h-3.5 w-3.5 text-indigo-500" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Application Pipeline</span>
          </div>

          <div className="flex flex-col gap-8 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-4xl space-y-4">
              <h1 className="headline-gradient-vivid text-[2.5rem] font-black leading-[0.95] tracking-tight sm:text-[3.5rem] lg:text-6xl">
                Track your career momentum in one studio.
              </h1>
              <p className="max-w-2xl text-base font-medium leading-relaxed text-slate-500 md:text-lg">
                Manage saved roles, active interviews, and final outcomes. All applications started from your discovery workspace land here automatically.
              </p>
            </div>
            
            <div className="flex flex-col gap-4 sm:flex-row xl:shrink-0">
              <Button variant="outline" size="lg" className="tap-bounce h-14 rounded-2xl border-2 border-slate-100 bg-white font-black text-slate-900 transition-all hover:border-slate-300" asChild>
                <Link href="/jobs">Explore Market</Link>
              </Button>
              <LinkedInImporter />
              <Button size="lg" className="tap-bounce h-14 rounded-2xl bg-slate-900 px-8 font-black text-white shadow-xl transition-all hover:bg-slate-800" onClick={() => { resetForm(); setIsDialogOpen(true) }}>
                <Plus className="mr-2 h-5 w-5" />
                Add Record
              </Button>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-4 md:gap-6 xl:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="surface-card group relative overflow-hidden p-6 md:p-8">
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">{stat.label}</p>
            <div className="mt-4 flex items-baseline gap-2">
              <p className={cn("text-3xl font-black tracking-tight md:text-5xl", stat.color)}>{stat.value}</p>
              <div className={cn("h-1.5 w-1.5 rounded-full", stat.color.replace("text-", "bg-"))} />
            </div>
            <div className={cn("absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-[0.03] transition-transform group-hover:scale-125", stat.color.replace("text-", "bg-"))} />
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_280px] lg:gap-6">
        <div className="relative group">
          <Search className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-indigo-500" />
          <Input 
            value={searchTerm} 
            onChange={(event) => setSearchTerm(event.target.value)} 
            placeholder="Search company, role, location, source..." 
            className="h-14 rounded-2xl border-2 border-slate-100 bg-white/50 pl-12 font-bold text-slate-900 shadow-sm transition-all focus:border-indigo-500/50 focus:bg-white focus:ring-0" 
          />
        </div>
        <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as JobTrackingStatus | "all")}>
          <SelectTrigger className="h-14 rounded-2xl border-2 border-slate-100 bg-white/50 px-6 font-bold text-slate-900 shadow-sm focus:border-indigo-500/50 focus:ring-0">
            <div className="flex items-center gap-3">
              <Filter className="h-4 w-4 text-slate-400" />
              <SelectValue placeholder="All Activities" />
            </div>
          </SelectTrigger>
          <SelectContent className="rounded-2xl border-slate-100 shadow-xl">
            <SelectItem value="all" className="rounded-xl font-bold py-3">All Active Roles</SelectItem>
            {JOB_TRACKING_STATUSES.map((status) => (
              <SelectItem key={status} value={status} className="rounded-xl font-bold py-3">
                {JOB_STATUS_CONFIG[status].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-slate-300" />
        </div>
      ) : filteredJobs.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredJobs.map((job) => {
            const resolvedSource = getSafeJobSource(job.source)
            const statusConfig = JOB_STATUS_CONFIG[job.status]
            const StatusIcon = statusIcons[job.status]
            const sourceConfig = JOB_SOURCE_CONFIG[resolvedSource]

            return (
              <Card key={job.id} className="surface-card group flex h-full flex-col overflow-hidden border-none transition-all duration-300 hover:-translate-y-2">
                <CardHeader className="space-y-4 p-8 pb-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-[1.25rem] bg-slate-50 text-slate-900 shadow-sm border border-slate-100/50 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                      <Building2 className="h-6 w-6" />
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className={cn("rounded-xl px-3 py-1 text-[10px] font-black uppercase tracking-widest shadow-sm border-none", statusConfig.chipClassName)}>
                        <StatusIcon className="mr-1.5 h-3.5 w-3.5" />
                        {statusConfig.label}
                      </Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-slate-100">
                            <MoreVertical className="h-4 w-4 text-slate-400" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-2xl border-slate-100 p-2 shadow-xl">
                          <DropdownMenuItem className="rounded-xl font-bold py-3 text-slate-600" onClick={() => openEditDialog(job)}>
                            <Edit2 className="mr-2 h-4 w-4" />
                            Edit details
                          </DropdownMenuItem>
                          <DropdownMenuItem className="rounded-xl font-bold py-3 text-rose-500 focus:bg-rose-50 focus:text-rose-600" onClick={() => handleDeleteJob(job.id)}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete record
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <CardTitle className="line-clamp-2 text-xl font-black tracking-tight text-slate-900 md:text-2xl leading-tight transition-colors group-hover:text-indigo-600">
                      {job.role}
                    </CardTitle>
                    <div className="flex items-center gap-2 text-sm font-black text-slate-400 uppercase tracking-tight">
                      {job.company}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="flex-1 space-y-6 p-8 pt-0">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className={cn("rounded-full border-none px-3.5 py-1 text-[9px] font-black uppercase tracking-widest", sourceConfig.badgeClassName)}>
                      {sourceConfig.label}
                    </Badge>
                    <Badge variant="outline" className="rounded-full border-slate-100 bg-white px-3.5 py-1 text-[9px] font-black uppercase tracking-widest text-slate-400">
                      {job.workplaceType || "remote"}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-300">Location</p>
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                        <MapPin className="h-3.5 w-3.5 text-slate-400" />
                        <span className="truncate">{job.location || "Unspecified"}</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-300">Last activity</p>
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        <span>{formatJobDate(job)}</span>
                      </div>
                    </div>
                  </div>

                  {job.resumeName ? (
                    <div className="rounded-2xl border border-indigo-50 bg-[#F5F7FF] p-4 shadow-inner">
                      <p className="text-[9px] font-black uppercase tracking-widest text-indigo-400">Anchor CV version</p>
                      <div className="mt-2 flex items-center gap-2 text-sm font-black text-indigo-900">
                        <FileText className="h-4 w-4 text-indigo-500" />
                        <span className="truncate">{job.resumeName}</span>
                      </div>
                    </div>
                  ) : null}

                  <div className="space-y-3">
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Update pipeline status</p>
                    <Select value={job.status} onValueChange={(value) => handleStatusUpdate(job, value as JobTrackingStatus)}>
                      <SelectTrigger className="h-10 rounded-xl border-2 border-slate-100 bg-white/50 px-4 font-bold text-slate-700 shadow-sm transition-all focus:border-indigo-500/50 hover:bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl border-slate-100 shadow-xl">
                        {JOB_TRACKING_STATUSES.map((status) => (
                          <SelectItem key={status} value={status} className="rounded-xl font-bold py-3">
                            {JOB_STATUS_CONFIG[status].label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>

                <CardFooter className="grid grid-cols-2 gap-3 p-8 pt-0">
                  <Button variant="outline" size="sm" className="tap-bounce h-11 rounded-xl border-2 border-slate-100 font-black text-[10px] uppercase tracking-widest text-slate-900 hover:border-slate-300" onClick={() => openEditDialog(job)}>
                    Open details
                  </Button>
                  <Button variant="outline" size="sm" className="tap-bounce h-11 rounded-xl border-2 border-slate-100 font-black text-[10px] uppercase tracking-widest text-slate-900 hover:border-slate-300" asChild>
                    <a href={job.sourceUrl || JOB_SOURCE_DEFAULT_URLS[resolvedSource]} target="_blank" rel="noreferrer">
                      Go to Source
                      <ExternalLink className="ml-2 h-3.5 w-3.5" />
                    </a>
                  </Button>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center space-y-8 rounded-[3rem] border-4 border-dashed border-slate-50 px-6 py-24 text-center">
          <div className="relative">
            <div className="absolute inset-0 bg-blue-500/10 blur-3xl rounded-full" />
            <div className="relative flex h-28 w-28 items-center justify-center rounded-[2.5rem] bg-blue-50 text-blue-600 shadow-inner border border-blue-100/50">
              {searchTerm ? <Search className="h-12 w-12" /> : <Archive className="h-12 w-12" />}
            </div>
          </div>
          <div className="max-w-md space-y-3">
            <h2 className="text-3xl font-black tracking-tight text-slate-900">
              {searchTerm ? "No roles matched" : "Zero active applications"}
            </h2>
            <p className="text-base font-medium leading-relaxed text-slate-500">
              {searchTerm
                ? "Try broadening your search criteria. We scan across company names, roles, and tracked locations in your pipeline."
                : "Your tracker is empty. Any job you start from the discovery feed is added here, or you can record external applications manually."}
            </p>
          </div>
          <div className="flex flex-col gap-4 sm:flex-row">
            {searchTerm ? (
              <Button variant="outline" className="tap-bounce h-14 rounded-2xl border-2 border-slate-100 px-8 font-black text-slate-900 transition-all hover:border-slate-300" onClick={() => { setSearchTerm(""); setStatusFilter("all") }}>
                Clear Filters
              </Button>
            ) : (
              <>
                <Button className="tap-bounce h-14 rounded-2xl bg-slate-900 px-10 font-black text-white shadow-xl transition-all hover:bg-slate-800" asChild>
                  <Link href="/jobs">Discover Market</Link>
                </Button>
                <Button variant="outline" className="tap-bounce h-14 rounded-2xl border-2 border-slate-100 px-8 font-black text-slate-900 transition-all hover:border-slate-300" onClick={() => setIsDialogOpen(true)}>
                  Add Manually
                </Button>
              </>
            )}
          </div>
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm() }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-[2.5rem] border-none p-0 shadow-2xl sm:max-w-[720px]">
          <div className="bg-slate-50/50 p-8 md:p-12">
            <DialogHeader className="space-y-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-200">
                <Plus className="h-7 w-7" />
              </div>
              <div>
                <DialogTitle className="text-3xl font-black tracking-tight text-slate-900">
                  {editingJob ? "Refine entry" : "New pipeline record"}
                </DialogTitle>
                <DialogDescription className="text-base font-medium text-slate-500">
                  Document external opportunities or enrich existing tracked data for better career insights.
                </DialogDescription>
              </div>
            </DialogHeader>

            <div className="mt-10 grid gap-8 pb-4">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Target Company</label>
                  <Input 
                    value={formData.company} 
                    onChange={(event) => setFormData((current) => ({ ...current, company: event.target.value }))} 
                    placeholder="e.g. Stripe" 
                    className="h-14 rounded-2xl border-2 border-slate-100 bg-white px-6 font-bold text-slate-900 shadow-sm transition-all focus:border-indigo-500/50 focus:ring-0" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Position Role</label>
                  <Input 
                    value={formData.role} 
                    onChange={(event) => setFormData((current) => ({ ...current, role: event.target.value }))} 
                    placeholder="e.g. Staff Designer" 
                    className="h-14 rounded-2xl border-2 border-slate-100 bg-white px-6 font-bold text-slate-900 shadow-sm transition-all focus:border-indigo-500/50 focus:ring-0" 
                  />
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Information Source</label>
                  <Select value={formData.source} onValueChange={(value) => handleSourceChange(value as JobSource)}>
                    <SelectTrigger className="h-14 rounded-2xl border-2 border-slate-100 bg-white px-6 font-bold text-slate-900 shadow-sm focus:border-indigo-500/50 focus:ring-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-slate-100 shadow-xl">
                      {Object.entries(JOB_SOURCE_CONFIG).map(([source, config]) => (
                        <SelectItem key={source} value={source} className="rounded-xl font-bold py-3">
                          {config.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Current Phase</label>
                  <Select value={formData.status} onValueChange={(value) => setFormData((current) => ({ ...current, status: value as JobTrackingStatus }))}>
                    <SelectTrigger className="h-14 rounded-2xl border-2 border-slate-100 bg-white px-6 font-bold text-slate-900 shadow-sm focus:border-indigo-500/50 focus:ring-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-slate-100 shadow-xl">
                      {JOB_TRACKING_STATUSES.map((status) => (
                        <SelectItem key={status} value={status} className="rounded-xl font-bold py-3">
                          {JOB_STATUS_CONFIG[status].label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Listing URL (Optional)</label>
                <Input 
                  value={formData.sourceUrl} 
                  onChange={(event) => setFormData((current) => ({ ...current, sourceUrl: event.target.value }))} 
                  placeholder="Paste the link here" 
                  className="h-14 rounded-2xl border-2 border-slate-100 bg-white px-6 font-bold text-slate-900 shadow-sm transition-all focus:border-indigo-500/50 focus:ring-0" 
                />
              </div>

              <div className="grid gap-6 md:grid-cols-3">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Setting</label>
                  <Select value={formData.workplaceType} onValueChange={(value) => setFormData((current) => ({ ...current, workplaceType: value as JobWorkplaceType }))}>
                    <SelectTrigger className="h-14 rounded-2xl border-2 border-slate-100 bg-white px-6 font-bold text-slate-900 shadow-sm focus:border-indigo-500/50 focus:ring-0 transition-all">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-slate-100 shadow-xl">
                      <SelectItem value="remote" className="rounded-xl font-bold py-3">Remote</SelectItem>
                      <SelectItem value="hybrid" className="rounded-xl font-bold py-3">Hybrid</SelectItem>
                      <SelectItem value="onsite" className="rounded-xl font-bold py-3">On-site</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Agreement</label>
                  <Select value={formData.employmentType} onValueChange={(value) => setFormData((current) => ({ ...current, employmentType: value as JobEmploymentType }))}>
                    <SelectTrigger className="h-14 rounded-2xl border-2 border-slate-100 bg-white px-6 font-bold text-slate-900 shadow-sm focus:border-indigo-500/50 focus:ring-0 transition-all">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-slate-100 shadow-xl">
                      <SelectItem value="full-time" className="rounded-xl font-bold py-3">Full-time</SelectItem>
                      <SelectItem value="part-time" className="rounded-xl font-bold py-3">Part-time</SelectItem>
                      <SelectItem value="contract" className="rounded-xl font-bold py-3">Contract</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Anchor CV</label>
                  <Select value={formData.resumeId} onValueChange={(value) => setFormData((current) => ({ ...current, resumeId: value }))}>
                    <SelectTrigger className="h-14 rounded-2xl border-2 border-slate-100 bg-white px-6 font-bold text-slate-900 shadow-sm focus:border-indigo-500/50 focus:ring-0 transition-all">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-slate-100 shadow-xl">
                      <SelectItem value="none" className="rounded-xl font-bold py-3 italic">General / Unspecified</SelectItem>
                      {resumes?.map((resume) => (
                        <SelectItem key={resume.id} value={resume.id} className="rounded-xl font-bold py-3">
                          {resume.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Primary Location</label>
                  <Input 
                    value={formData.location} 
                    onChange={(event) => setFormData((current) => ({ ...current, location: event.target.value }))} 
                    placeholder="e.g. Remote, UK" 
                    className="h-14 rounded-2xl border-2 border-slate-100 bg-white px-6 font-bold text-slate-900 shadow-sm transition-all focus:border-indigo-500/50 focus:ring-0" 
                  />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Research & Notes</label>
                <Textarea 
                  value={formData.notes} 
                  onChange={(event) => setFormData((current) => ({ ...current, notes: event.target.value }))} 
                  placeholder="Recruiter names, interview reflections, or next steps..." 
                  className="min-h-[160px] rounded-2xl border-2 border-slate-100 bg-white p-6 font-medium text-slate-900 shadow-sm transition-all focus:border-indigo-500/50 focus:ring-0" 
                />
              </div>
            </div>

            <DialogFooter className="mt-8 flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button variant="outline" size="lg" className="tap-bounce h-14 rounded-2xl border-2 border-slate-100 px-8 font-black text-slate-900 transition-all hover:border-slate-300 sm:w-auto" onClick={() => setIsDialogOpen(false)}>
                Stay in pipeline
              </Button>
              <Button size="lg" className="tap-bounce h-14 rounded-2xl bg-indigo-600 px-10 font-black text-white shadow-xl shadow-indigo-100 transition-all hover:bg-indigo-700 sm:w-auto" onClick={handleSaveJob}>
                {editingJob ? "Commit changes" : "Record application"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
