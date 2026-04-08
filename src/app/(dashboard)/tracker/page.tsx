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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
    <div className="mobile-app-page md:mx-auto md:max-w-7xl md:space-y-8 md:px-8 md:pt-8">
      <section className="section-shell space-y-3 px-4 py-4 sm:space-y-4 sm:px-5 sm:py-6 md:px-8">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="min-w-0 space-y-3 xl:flex-1">
            <div className="eyebrow-chip"><Clock3 className="h-3.5 w-3.5" />Application tracking</div>
            <h1 className="text-[1.65rem] font-black leading-[0.98] tracking-[-0.05em] text-primary sm:text-[2rem] lg:text-5xl">
              Track saved roles, started applies, interviews, and final outcomes in one premium pipeline.
            </h1>
            <p className="max-w-3xl text-[0.92rem] leading-relaxed text-muted-foreground sm:text-base md:text-lg">
              Jobs started from the discovery workspace arrive here automatically. You can also add roles manually and attach the CV version you used.
            </p>
          </div>
          <div className="grid w-full gap-2 sm:grid-cols-2 xl:flex xl:w-auto xl:shrink-0">
            <Button variant="outline" className="h-11 rounded-2xl font-bold md:h-12" asChild><Link href="/jobs">Discover jobs</Link></Button>
            <LinkedInImporter />
            <Button className="h-11 rounded-2xl font-bold md:h-12" onClick={() => { resetForm(); setIsDialogOpen(true) }}><Plus className="mr-2 h-4 w-4" />Add application</Button>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3 md:gap-4 xl:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="group relative overflow-hidden rounded-[1.35rem] bg-white p-4 shadow-sm ring-1 ring-black/[0.03] transition-all hover:shadow-md md:rounded-[2rem] md:p-6">
            <p className="text-[0.68rem] font-black uppercase tracking-[0.22em] text-muted-foreground/70">{stat.label}</p>
            <div className="mt-3 flex items-baseline gap-2">
              <p className={cn("text-[1.8rem] font-black tracking-tight md:text-4xl", stat.color)}>{stat.value}</p>
            </div>
            {/* Visual accent */}
            <div className={cn("absolute -right-4 -top-4 h-16 w-16 rounded-full opacity-[0.03] transition-transform group-hover:scale-110", stat.color.replace("text-", "bg-"))} />
          </div>
        ))}
      </div>

      <div className="grid gap-3 lg:grid-cols-[1fr_240px] lg:gap-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search company, role, location, source, or CV version..." className="h-11 rounded-2xl border-border/80 bg-white pl-11 md:h-12" />
        </div>
        <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as JobTrackingStatus | "all")}>
          <SelectTrigger className="h-11 rounded-2xl border-border/80 bg-white md:h-12"><div className="flex items-center gap-2"><Filter className="h-4 w-4" /><SelectValue placeholder="Filter by status" /></div></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {JOB_TRACKING_STATUSES.map((status) => <SelectItem key={status} value={status}>{JOB_STATUS_CONFIG[status].label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-12 w-12 animate-spin text-primary/20" />
        </div>
      ) : filteredJobs.length > 0 ? (
        <div className="grid gap-3 md:grid-cols-2 md:gap-6 xl:grid-cols-3">
          {filteredJobs.map((job) => {
            const resolvedSource = getSafeJobSource(job.source)
            const linkedResume = job.resumeId ? resumesById.get(job.resumeId) : null
            const statusConfig = JOB_STATUS_CONFIG[job.status]
            const StatusIcon = statusIcons[job.status]
            const sourceConfig = JOB_SOURCE_CONFIG[resolvedSource]

            return (
              <div key={job.id} className="canva-card group flex h-full flex-col overflow-hidden rounded-[1.45rem] md:rounded-[2rem]">
                <div className="relative space-y-3 bg-muted/30 p-4 md:space-y-4 md:p-7">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-[1rem] border bg-white text-primary shadow-sm ring-4 ring-white/50 transition-transform group-hover:scale-110 md:h-14 md:w-14 md:rounded-[1.25rem]">
                      <Building2 className="h-5 w-5 md:h-6 md:w-6" />
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={cn("rounded-full px-3 py-1 text-[0.65rem] font-black uppercase tracking-[0.18em]", statusConfig.chipClassName)}>
                        <StatusIcon className="mr-1.5 h-3.5 w-3.5" />
                        {statusConfig.label}
                      </Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-2xl p-2">
                          <DropdownMenuItem className="rounded-xl font-semibold" onClick={() => openEditDialog(job)}>
                            <Edit2 className="mr-2 h-4 w-4" />
                            Edit details
                          </DropdownMenuItem>
                          <DropdownMenuItem className="rounded-xl font-semibold text-destructive focus:bg-destructive/10 focus:text-destructive" onClick={() => handleDeleteJob(job.id)}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete record
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-2">
                    <h3 className="text-lg font-black tracking-tight text-primary transition-colors group-hover:text-indigo-600 md:text-2xl">{job.role}</h3>
                    <p className="text-sm font-bold text-muted-foreground/70 uppercase tracking-widest">{job.company}</p>
                  </div>
                </div>

                <div className="flex flex-1 flex-col space-y-4 p-4 md:space-y-6 md:p-7">
                  <div className="flex flex-wrap gap-2.5">
                    <Badge variant="outline" className={cn("rounded-full px-3.5 py-1 text-[0.62rem] font-black uppercase tracking-[0.15em] border-none", sourceConfig.badgeClassName)}>
                      {sourceConfig.label}
                    </Badge>
                    <Badge variant="outline" className="rounded-full px-3.5 py-1 text-[0.62rem] font-black uppercase tracking-[0.15em] border-border/50">
                      {job.workplaceType || "remote"}
                    </Badge>
                  </div>

                  <div className="space-y-3 text-[0.8rem] font-bold text-muted-foreground/80">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted/50">
                        <MapPin className="h-3.5 w-3.5" />
                      </div>
                      <span>{job.location || "Location not specified"}</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted/50">
                        <Calendar className="h-3.5 w-3.5" />
                      </div>
                      <span>{formatJobDate(job)}</span>
                    </div>
                  </div>

                  {job.resumeName ? (
                    <div className="rounded-2xl bg-indigo-50/50 p-4 ring-1 ring-indigo-500/10">
                      <p className="text-[0.6rem] font-black uppercase tracking-[0.2em] text-indigo-900/40">Linked CV</p>
                      <div className="mt-2 flex items-center gap-2 text-[0.85rem] font-black text-indigo-950">
                        <FileText className="h-4 w-4 text-indigo-500" />
                        <span className="truncate">{job.resumeName}</span>
                      </div>
                    </div>
                  ) : null}

                  <div className="pt-1 md:pt-2">
                    <p className="mb-2 text-[0.6rem] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Update pipeline</p>
                    <Select value={job.status} onValueChange={(value) => handleStatusUpdate(job, value as JobTrackingStatus)}>
                      <SelectTrigger className="h-11 rounded-2xl border-border/60 bg-white shadow-sm ring-1 ring-black/[0.02] md:h-12">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl p-2 font-bold">
                        {JOB_TRACKING_STATUSES.map((status) => (
                          <SelectItem key={status} value={status} className="rounded-xl">
                            {JOB_STATUS_CONFIG[status].label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2 pt-1 sm:grid-cols-2 md:gap-3 md:pt-2">
                    <Button variant="outline" className="h-10 rounded-xl border-border/60 font-bold hover:bg-muted/30 md:h-11" onClick={() => openEditDialog(job)}>
                      Details
                    </Button>
                    <Button variant="outline" className="h-10 rounded-xl border-border/60 font-bold hover:bg-muted/30 md:h-11" asChild>
                      <a href={job.sourceUrl || JOB_SOURCE_DEFAULT_URLS[resolvedSource]} target="_blank" rel="noreferrer">
                        Source
                        <ExternalLink className="ml-2 h-3.5 w-3.5" />
                      </a>
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : searchTerm.trim() || statusFilter !== "all" ? (
          <Card className="border-none bg-white shadow-sm">
            <CardContent className="flex flex-col items-center gap-4 p-8 text-center md:p-10">
            <Search className="h-10 w-10 text-muted-foreground" />
            <div className="space-y-1">
              <p className="text-lg font-black text-primary">No tracked jobs match these filters</p>
              <p className="text-sm text-muted-foreground">Clear the current filters or search the jobs workspace to add more opportunities into your pipeline.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" className="rounded-xl font-bold" onClick={() => setSearchTerm("")}>
                Clear search
              </Button>
              <Button className="rounded-xl font-bold" onClick={() => setStatusFilter("all")}>
                Show all statuses
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
          <Card className="border-none bg-white shadow-sm">
            <CardContent className="flex flex-col items-center gap-4 p-8 text-center md:p-10">
            <Archive className="h-10 w-10 text-muted-foreground" />
            <div className="space-y-1">
              <p className="text-lg font-black text-primary">Your tracker is ready</p>
              <p className="text-sm text-muted-foreground">Start from the jobs workspace for automatic external apply tracking, or add an existing application manually.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button className="rounded-xl font-bold" asChild>
                <Link href="/jobs">Discover jobs</Link>
              </Button>
              <Button variant="outline" className="rounded-xl font-bold" onClick={() => setIsDialogOpen(true)}>
                Add manually
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm() }}>
        <DialogContent className="rounded-[1.5rem] sm:max-w-[720px] md:rounded-[2rem]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-primary">{editingJob ? "Edit tracked application" : "Add application manually"}</DialogTitle>
            <DialogDescription>
              Use this for roles that came from outside the jobs workspace, or to enrich an existing tracked record with more detail.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-5 py-2">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Company</label>
              <Input value={formData.company} onChange={(event) => setFormData((current) => ({ ...current, company: event.target.value }))} placeholder="e.g. Stripe" className="h-11 rounded-2xl border-border/80 bg-muted/20 md:h-12" />
              </div>
              <div className="space-y-2">
                <label className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Role</label>
              <Input value={formData.role} onChange={(event) => setFormData((current) => ({ ...current, role: event.target.value }))} placeholder="e.g. Senior Product Designer" className="h-11 rounded-2xl border-border/80 bg-muted/20 md:h-12" />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Source</label>
                <Select value={formData.source} onValueChange={(value) => handleSourceChange(value as JobSource)}>
                  <SelectTrigger className="h-11 rounded-2xl border-border/80 bg-muted/20 md:h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(JOB_SOURCE_CONFIG).map(([source, config]) => (
                      <SelectItem key={source} value={source}>
                        {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Current status</label>
                <Select value={formData.status} onValueChange={(value) => setFormData((current) => ({ ...current, status: value as JobTrackingStatus }))}>
                  <SelectTrigger className="h-11 rounded-2xl border-border/80 bg-muted/20 md:h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {JOB_TRACKING_STATUSES.map((status) => (
                      <SelectItem key={status} value={status}>
                        {JOB_STATUS_CONFIG[status].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Source URL</label>
              <Input value={formData.sourceUrl} onChange={(event) => setFormData((current) => ({ ...current, sourceUrl: event.target.value }))} placeholder="Paste the LinkedIn, Indeed, or company careers link" className="h-11 rounded-2xl border-border/80 bg-muted/20 md:h-12" />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <label className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Workplace</label>
                <Select value={formData.workplaceType} onValueChange={(value) => setFormData((current) => ({ ...current, workplaceType: value as JobWorkplaceType }))}>
                  <SelectTrigger className="h-11 rounded-2xl border-border/80 bg-muted/20 md:h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="remote">Remote</SelectItem>
                    <SelectItem value="hybrid">Hybrid</SelectItem>
                    <SelectItem value="onsite">On-site</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Employment</label>
                <Select value={formData.employmentType} onValueChange={(value) => setFormData((current) => ({ ...current, employmentType: value as JobEmploymentType }))}>
                  <SelectTrigger className="h-11 rounded-2xl border-border/80 bg-muted/20 md:h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full-time">Full-time</SelectItem>
                    <SelectItem value="part-time">Part-time</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">CV version</label>
                <Select value={formData.resumeId} onValueChange={(value) => setFormData((current) => ({ ...current, resumeId: value }))}>
                  <SelectTrigger className="h-11 rounded-2xl border-border/80 bg-muted/20 md:h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">General resume / not specified</SelectItem>
                    {resumes?.map((resume) => (
                      <SelectItem key={resume.id} value={resume.id}>
                        {resume.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Location</label>
              <Input value={formData.location} onChange={(event) => setFormData((current) => ({ ...current, location: event.target.value }))} placeholder="Remote, London, Manchester, New York..." className="h-11 rounded-2xl border-border/80 bg-muted/20 md:h-12" />
            </div>

            <div className="space-y-2">
              <label className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Notes</label>
              <Textarea value={formData.notes} onChange={(event) => setFormData((current) => ({ ...current, notes: event.target.value }))} placeholder="Interview contact, salary range, recruiter notes, or why this role matters..." className="min-h-[120px] rounded-2xl border-border/80 bg-muted/20" />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" className="rounded-xl font-bold" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button className="rounded-xl font-bold" onClick={handleSaveJob}>
              {editingJob ? "Save changes" : "Add to tracker"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
