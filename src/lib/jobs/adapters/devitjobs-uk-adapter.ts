import { XMLParser } from "fast-xml-parser"
import { JobApiAdapter, JobFetchParams } from "../adapter-interface"
import { JobListingRecord, JobSource, JobWorkplaceType, JobEmploymentType } from "../model"

type DevItJob = {
  id?: string
  title?: string
  name?: string
  link?: string
  apply_url?: string
  url?: string
  company?: string
  "company-name"?: string
  location?: string
  city?: string
  region?: string
  country?: string
  pubdate?: string
  description?: string
  salary?: string
  category?: string
  jobtype?: string
  "job-type"?: string
}

function normalizeText(value: unknown): string {
  if (typeof value === "string") return value
  if (typeof value === "number") return String(value)
  return ""
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>?/gm, "")
}

function detectWorkplaceType(content: string): JobWorkplaceType {
  const c = content.toLowerCase()
  if (c.includes("remote") || c.includes("work from home") || c.includes("wfh")) return "remote"
  if (c.includes("hybrid") || c.includes("flexible working") || c.includes("office and home")) return "hybrid"
  return "onsite"
}

function detectEmploymentType(value: string): JobEmploymentType {
  const v = value.toLowerCase()
  if (v.includes("contract") || v.includes("freelance")) return "contract"
  if (v.includes("part")) return "part-time"
  return "full-time"
}

function formatPubDate(value: string): string {
  const raw = value.trim()
  if (!raw) return "Recently"

  // DevITjobs commonly uses DD.MM.YYYY
  const dotMatch = raw.match(/^(\d{2})\.(\d{2})\.(\d{4})$/)
  if (dotMatch) {
    const day = Number(dotMatch[1])
    const month = Number(dotMatch[2])
    const year = Number(dotMatch[3])
    const date = new Date(year, month - 1, day)
    if (!Number.isNaN(date.getTime())) {
      const diffMs = Date.now() - date.getTime()
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
      if (diffDays === 0) return "Today"
      if (diffDays === 1) return "Yesterday"
      if (diffDays < 30) return `${diffDays}d ago`
      return date.toLocaleDateString()
    }
  }

  const maybeDate = new Date(raw)
  if (!Number.isNaN(maybeDate.getTime())) {
    const diffMs = Date.now() - maybeDate.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    if (diffDays === 0) return "Today"
    if (diffDays === 1) return "Yesterday"
    if (diffDays < 30) return `${diffDays}d ago`
    return maybeDate.toLocaleDateString()
  }

  return "Recently"
}

export class DevItJobsUkAdapter implements JobApiAdapter {
  name = "DevITjobs UK"
  private endpoint = "https://devitjobs.uk/job_feed.xml"
  private techTokens = new Set([
    "react",
    "node",
    "nodejs",
    "typescript",
    "javascript",
    "python",
    "java",
    "golang",
    "go",
    "rust",
    "c",
    "c++",
    "c#",
    ".net",
    "dotnet",
    "aws",
    "azure",
    "gcp",
    "kubernetes",
    "k8s",
    "docker",
    "terraform",
    "sql",
    "postgres",
    "mysql",
    "mongodb",
    "data",
    "devops",
    "backend",
    "frontend",
    "fullstack",
    "full-stack",
    "qa",
    "sre",
    "security",
  ])

  private parse(xml: string): DevItJob[] {
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "",
      trimValues: true,
    })

    const parsed = parser.parse(xml) as any
    const jobsNode = parsed?.jobs?.job
    if (!jobsNode) return []
    return Array.isArray(jobsNode) ? (jobsNode as DevItJob[]) : ([jobsNode] as DevItJob[])
  }

  private buildLocation(job: DevItJob): string {
    const location = normalizeText(job.location).trim()
    if (location) return location

    const city = normalizeText(job.city).trim()
    const region = normalizeText(job.region).trim()
    const country = normalizeText(job.country).trim()
    return [city, region, country].filter(Boolean).join(", ") || "United Kingdom"
  }

  private isUk(job: DevItJob): boolean {
    const country = normalizeText(job.country).toLowerCase()
    const location = normalizeText(job.location).toLowerCase()
    return country.includes("united kingdom") || country === "uk" || location.includes("united kingdom") || location.includes(" uk")
  }

  private matchesQuery(job: DevItJob, keywords: string, mode: "strict" | "loose"): boolean {
    const query = keywords.trim().toLowerCase()
    if (!query) return true

    const baseFields = [
      normalizeText(job.title),
      normalizeText(job.name),
      normalizeText(job.company),
      normalizeText(job["company-name"]),
      normalizeText(job.location),
      normalizeText(job.city),
      normalizeText(job.region),
      normalizeText(job.country),
      normalizeText(job.category),
      normalizeText(job.salary),
      normalizeText(job["job-type"]),
      normalizeText(job.jobtype),
    ]

    const fields = mode === "loose" ? baseFields.concat([stripHtml(normalizeText(job.description))]) : baseFields

    const haystack = fields.join(" ").toLowerCase()

    return query
      .split(/\s+/)
      .filter(Boolean)
      .every((token) => haystack.includes(token))
  }

  private isTechQuery(keywords: string): boolean {
    const q = keywords.trim().toLowerCase()
    if (!q) return true
    const tokens = q.split(/\s+/).filter(Boolean)
    return tokens.some((token) => this.techTokens.has(token) || token.includes("c#") || token.includes(".net"))
  }

  private matchesLocation(job: DevItJob, requestedLocation: string, workplaceType: JobWorkplaceType): boolean {
    const loc = requestedLocation.trim().toLowerCase()
    if (!loc) return true

    // Treat broad UK inputs as non-restrictive.
    if (["uk", "united kingdom", "great britain", "gb", "england", "scotland", "wales", "northern ireland"].includes(loc)) {
      return true
    }

    if (workplaceType === "remote") return true

    const jobLoc = this.buildLocation(job).toLowerCase()
    const city = normalizeText(job.city).toLowerCase()
    const region = normalizeText(job.region).toLowerCase()
    return jobLoc.includes(loc) || city.includes(loc) || region.includes(loc)
  }

  private toListing(job: DevItJob): JobListingRecord {
    const externalId = normalizeText(job.id) || normalizeText((job as any)?.["id"]) || normalizeText(job.url) || normalizeText(job.link)
    const title = normalizeText(job.title) || normalizeText(job.name) || "Job Opportunity"
    const company = normalizeText(job.company) || normalizeText(job["company-name"]) || "Unknown Company"
    const descriptionHtml = normalizeText(job.description)
    const contentForSignals = `${title} ${descriptionHtml}`
    const workplaceType = detectWorkplaceType(contentForSignals)

    const jobTypeRaw = normalizeText(job["job-type"]) || normalizeText(job.jobtype) || ""
    const employmentType = detectEmploymentType(jobTypeRaw)

    const sourceUrl = normalizeText(job.apply_url) || normalizeText(job.url) || normalizeText(job.link) || ""
    const location = this.buildLocation(job)

    return {
      id: `devit-${externalId || Math.random().toString(36).slice(2)}`,
      externalJobId: externalId || undefined,
      source: "devitjobs" as JobSource,
      sourceUrl,
      company,
      role: title,
      location,
      workplaceType,
      employmentType,
      shortDescription: stripHtml(descriptionHtml).slice(0, 320),
      postedLabel: formatPubDate(normalizeText(job.pubdate)),
      tags: [normalizeText(job.category) || "IT", company].filter(Boolean),
      salarySummary: normalizeText(job.salary) || undefined,
      listingOrigin: "api_search",
    }
  }

  async fetchJobs(params: JobFetchParams): Promise<JobListingRecord[]> {
    const { keywords = "", location = "", workplace = "all", page = 1, pageSize = 50 } = params

    const res = await fetch(this.endpoint, { headers: { Accept: "application/xml,text/xml,*/*" } })
    if (!res.ok) throw new Error(`DevITjobs feed error: ${res.status}`)

    const xml = await res.text()
    const jobs = this.parse(xml).filter((job) => this.isUk(job))

    const strictMatches = jobs.filter((job) => this.matchesQuery(job, keywords, "strict"))
    const useJobs =
      strictMatches.length > 0
        ? strictMatches
        : this.isTechQuery(keywords)
          ? jobs.filter((job) => this.matchesQuery(job, keywords, "loose"))
          : []

    let listings = useJobs.map((job) => this.toListing(job))

    if (workplace !== "all") {
      listings = listings.filter((listing) => listing.workplaceType === workplace)
    }

    const requestedLocation = location.trim().toLowerCase()
    const isBroadUkLocation = !requestedLocation || ["uk", "united kingdom", "great britain", "gb"].includes(requestedLocation)
    if (!isBroadUkLocation) {
      const token = requestedLocation.split(",")[0]?.trim() || requestedLocation
      listings = listings.filter((listing) => {
        const allowRemoteAnywhere = workplace === "remote"
        if (allowRemoteAnywhere && listing.workplaceType === "remote") return true
        const jobLoc = (listing.location || "").toLowerCase()
        const jobRole = (listing.role || "").toLowerCase()
        return jobLoc.includes(token) || jobRole.includes(token)
      })
    }

    const start = Math.max(0, (page - 1) * pageSize)
    return listings.slice(start, start + pageSize)
  }

  async fetchJobDetails(externalId: string): Promise<string | null> {
    if (!externalId) return null
    const res = await fetch(this.endpoint, { headers: { Accept: "application/xml,text/xml,*/*" } })
    if (!res.ok) return null

    const xml = await res.text()
    const jobs = this.parse(xml)
    const match = jobs.find((job) => normalizeText(job.id) === externalId)
    if (!match) return null
    return normalizeText(match.description) || null
  }
}
