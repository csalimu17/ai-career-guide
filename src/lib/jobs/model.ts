export const JOB_TRACKING_STATUSES = [
  "saved",
  "started",
  "applied",
  "interviewing",
  "offer",
  "rejected",
] as const

export type JobTrackingStatus = (typeof JOB_TRACKING_STATUSES)[number]

export const JOB_SOURCES = [
  "linkedin",
  "indeed",
  "greenhouse",
  "lever",
  "company_site",
  "arbeitnow",
  "loopcv",
  "adzuna",
  "reed",
] as const

export type JobSource = (typeof JOB_SOURCES)[number]

export type JobWorkplaceType = "remote" | "hybrid" | "onsite"
export type JobEmploymentType = "full-time" | "part-time" | "contract"
export type JobListingOrigin = "starter_catalog" | "firestore_catalog" | "partner_feed" | "manual_entry" | "api_search"
export type JobIntegrationMode = "redirect" | "partner_api"
export type JobPartnerCapability = "apply_connect" | "disposition_sync"
export type JobStatusHistorySource =
  | "discover_save"
  | "manual_entry"
  | "external_apply"
  | "apply_confirmation"
  | "status_update"
  | "partner_sync"

export interface JobListingRecord {
  id: string
  externalJobId?: string
  source: JobSource
  sourceUrl: string
  company: string
  role: string
  location: string
  workplaceType: JobWorkplaceType
  employmentType: JobEmploymentType
  shortDescription: string
  postedLabel: string
  tags: string[]
  salarySummary?: string
  listingOrigin: JobListingOrigin
  partnerCapabilities?: JobPartnerCapability[]
  integrationMode?: JobIntegrationMode
}

export interface JobStatusHistoryEntry {
  status: JobTrackingStatus
  label: string
  at: string
  note?: string
  source: JobStatusHistorySource
}

export interface JobPartnerSyncState {
  integrationMode: JobIntegrationMode
  capabilities: JobPartnerCapability[]
  partnerJobId?: string | null
  partnerApplicationId?: string | null
  disposition?: string | null
  dispositionUpdatedAt?: string | null
  lastSyncAt?: string | null
  syncStatus?: "not_connected" | "pending" | "connected" | "error"
}

export interface JobApplicationRecord {
  id?: string
  userId: string
  listingFingerprint: string
  jobListingId?: string | null
  externalJobId?: string | null
  company: string
  role: string
  location?: string
  workplaceType?: JobWorkplaceType
  employmentType?: JobEmploymentType
  status: JobTrackingStatus
  statusLabel: string
  statusHistory: JobStatusHistoryEntry[]
  source: JobSource
  sourceLabel: string
  sourceUrl: string
  listingOrigin?: JobListingOrigin
  resumeId?: string | null
  resumeName?: string | null
  notes?: string
  jobDescription?: string
  partnerSync: JobPartnerSyncState
  sourceClickStartedAt?: string | null
  appliedAt?: string | null
  updatedAt?: unknown
  createdAt?: unknown
}

export const JOB_STATUS_CONFIG: Record<
  JobTrackingStatus,
  {
    label: string
    chipClassName: string
    progressWeight: number
  }
> = {
  saved: {
    label: "Saved",
    chipClassName: "bg-amber-100 text-amber-700 border-amber-200",
    progressWeight: 1,
  },
  started: {
    label: "Started",
    chipClassName: "bg-sky-100 text-sky-700 border-sky-200",
    progressWeight: 2,
  },
  applied: {
    label: "Applied",
    chipClassName: "bg-blue-100 text-blue-700 border-blue-200",
    progressWeight: 3,
  },
  interviewing: {
    label: "Interviewing",
    chipClassName: "bg-violet-100 text-violet-700 border-violet-200",
    progressWeight: 4,
  },
  offer: {
    label: "Offer",
    chipClassName: "bg-emerald-100 text-emerald-700 border-emerald-200",
    progressWeight: 5,
  },
  rejected: {
    label: "Rejected",
    chipClassName: "bg-rose-100 text-rose-700 border-rose-200",
    progressWeight: 0,
  },
}

export const JOB_SOURCE_CONFIG: Record<
  JobSource,
  {
    label: string
    shortLabel: string
    applyLabel: string
    badgeClassName: string
    integrationMode: JobIntegrationMode
    plannedCapabilities: JobPartnerCapability[]
  }
> = {
  linkedin: {
    label: "LinkedIn",
    shortLabel: "LinkedIn",
    applyLabel: "Apply on LinkedIn",
    badgeClassName: "border-[#0a66c2]/20 bg-[#0a66c2]/10 text-[#0a66c2]",
    integrationMode: "redirect",
    plannedCapabilities: ["apply_connect"],
  },
  indeed: {
    label: "Indeed",
    shortLabel: "Indeed",
    applyLabel: "Apply on Indeed",
    badgeClassName: "border-[#2557a7]/20 bg-[#2557a7]/10 text-[#2557a7]",
    integrationMode: "redirect",
    plannedCapabilities: ["disposition_sync"],
  },
  greenhouse: {
    label: "Greenhouse",
    shortLabel: "Greenhouse",
    applyLabel: "Apply on Greenhouse",
    badgeClassName: "border-emerald-200 bg-emerald-50 text-emerald-700",
    integrationMode: "redirect",
    plannedCapabilities: [],
  },
  lever: {
    label: "Lever",
    shortLabel: "Lever",
    applyLabel: "Apply on Lever",
    badgeClassName: "border-slate-200 bg-slate-100 text-slate-700",
    integrationMode: "redirect",
    plannedCapabilities: [],
  },
  company_site: {
    label: "Company Site",
    shortLabel: "Company",
    applyLabel: "Apply on company site",
    badgeClassName: "border-orange-200 bg-orange-50 text-orange-700",
    integrationMode: "redirect",
    plannedCapabilities: [],
  },
  arbeitnow: {
    label: "Arbeitnow",
    shortLabel: "Arbeitnow",
    applyLabel: "Apply on Arbeitnow",
    badgeClassName: "border-purple-200 bg-purple-50 text-purple-700",
    integrationMode: "redirect",
    plannedCapabilities: [],
  },
  loopcv: {
    label: "LoopCV",
    shortLabel: "LoopCV",
    applyLabel: "Apply on LoopCV",
    badgeClassName: "border-blue-200 bg-blue-50 text-blue-700",
    integrationMode: "redirect",
    plannedCapabilities: [],
  },
  adzuna: {
    label: "Adzuna",
    shortLabel: "Adzuna",
    applyLabel: "Apply on Adzuna",
    badgeClassName: "border-[#14877c]/20 bg-[#14877c]/10 text-[#14877c]",
    integrationMode: "redirect",
    plannedCapabilities: [],
  },
  reed: {
    label: "Reed",
    shortLabel: "Reed",
    applyLabel: "Apply on Reed",
    badgeClassName: "border-[#002d72]/20 bg-[#002d72]/10 text-[#002d72]",
    integrationMode: "redirect",
    plannedCapabilities: [],
  },
}

export const JOB_SOURCE_DEFAULT_URLS: Record<JobSource, string> = {
  linkedin: "https://www.linkedin.com/jobs/",
  indeed: "https://www.indeed.com/",
  greenhouse: "https://boards.greenhouse.io/",
  lever: "https://jobs.lever.co/",
  company_site: "https://careers.google.com/",
  arbeitnow: "https://www.arbeitnow.com/",
  loopcv: "https://www.loopcv.pro/",
  adzuna: "https://www.adzuna.co.uk/",
  reed: "https://www.reed.co.uk/",
}

export const JOB_PARTNER_ROUTE_BLUEPRINT = {
  appRoutes: ["/jobs", "/tracker"],
  apiRoutes: [
    "/api/jobs/partners/[source]/search",
    "/api/jobs/partners/[source]/apply-intents",
    "/api/jobs/partners/[source]/dispositions",
    "/api/jobs/partners/[source]/webhooks",
  ],
} as const

export function buildListingFingerprint(listing: {
  id?: string
  source: JobSource
  sourceUrl?: string
  externalJobId?: string
  company?: string
  role?: string
}) {
  const identity =
    listing.externalJobId ||
    listing.id ||
    listing.sourceUrl ||
    `${listing.company || "company"}-${listing.role || "role"}`

  return `${listing.source}::${identity}`
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9:/._-]+/g, "")
}

export function createStatusHistoryEntry(
  status: JobTrackingStatus,
  source: JobStatusHistorySource,
  note?: string
): JobStatusHistoryEntry {
  return {
    status,
    label: JOB_STATUS_CONFIG[status].label,
    at: new Date().toISOString(),
    note: note ?? null,
    source,
  }
}

export function getNextStatusForExternalApply(currentStatus?: JobTrackingStatus): JobTrackingStatus {
  if (!currentStatus) return "started"
  return JOB_STATUS_CONFIG[currentStatus].progressWeight >= JOB_STATUS_CONFIG.applied.progressWeight
    ? currentStatus
    : "started"
}

export function shouldAllowSavedToggle(status?: JobTrackingStatus) {
  return !status || status === "saved"
}

export function buildTrackedApplicationPayload(args: {
  userId: string
  listing: JobListingRecord
  status: JobTrackingStatus
  statusSource: JobStatusHistorySource
  note?: string
  resumeId?: string | null
  resumeName?: string | null
  existingHistory?: JobStatusHistoryEntry[]
  existingAppliedAt?: string | null
}) {
  const sourceConfig = JOB_SOURCE_CONFIG[args.listing.source]
  const integrationMode = args.listing.integrationMode || sourceConfig.integrationMode
  const partnerCapabilities = args.listing.partnerCapabilities || sourceConfig.plannedCapabilities
  const nextHistory = [...(args.existingHistory || []), createStatusHistoryEntry(args.status, args.statusSource, args.note)]
  const nextAppliedAt =
    args.status === "applied"
      ? new Date().toISOString()
      : args.existingAppliedAt || null

  return {
    userId: args.userId,
    listingFingerprint: buildListingFingerprint(args.listing),
    jobListingId: args.listing.id,
    externalJobId: args.listing.externalJobId || null,
    company: args.listing.company,
    role: args.listing.role,
    location: args.listing.location ?? "",
    workplaceType: args.listing.workplaceType ?? "onsite",
    employmentType: args.listing.employmentType ?? "full-time",
    status: args.status,
    statusLabel: JOB_STATUS_CONFIG[args.status].label,
    statusHistory: nextHistory,
    source: args.listing.source,
    sourceLabel: sourceConfig.label,
    sourceUrl: args.listing.sourceUrl,
    listingOrigin: args.listing.listingOrigin ?? "api_search",
    resumeId: args.resumeId ?? null,
    resumeName: args.resumeName ?? null,
    partnerSync: {
      integrationMode,
      capabilities: partnerCapabilities,
      partnerJobId: args.listing.externalJobId || null,
      syncStatus: "not_connected" as const,
      lastSyncAt: null,
      partnerApplicationId: null,
      disposition: null,
      dispositionUpdatedAt: null,
    },
    sourceClickStartedAt:
      args.statusSource === "external_apply" ? new Date().toISOString() : null,
    appliedAt: nextAppliedAt,
  }
}

export function getStatusCount(records: Array<{ status?: JobTrackingStatus }> | null | undefined, status: JobTrackingStatus) {
  return records?.filter((record) => record.status === status).length || 0
}

export function isJobSource(value: string): value is JobSource {
  return JOB_SOURCES.includes(value as JobSource)
}

export function getSafeJobSource(value?: string | null): JobSource {
  return value && isJobSource(value) ? value : "company_site"
}
