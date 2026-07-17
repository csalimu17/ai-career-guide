import { JobListingRecord, JobSource, JobWorkplaceType } from "../model"
import { JobApiAdapter, JobFetchParams, JobFetchResultMeta } from "../adapter-interface"

export class AdzunaAdapter implements JobApiAdapter {
  name = "Adzuna"

  private appId = process.env.ADZUNA_APP_ID || ""
  private appKey = process.env.ADZUNA_APP_KEY || ""
  private baseEndpoint = "https://api.adzuna.com/v1/api/jobs/gb/search"

  async fetchJobsWithMeta(params: JobFetchParams): Promise<JobFetchResultMeta> {
    const appId = process.env.ADZUNA_APP_ID || this.appId
    const appKey = process.env.ADZUNA_APP_KEY || this.appKey
    const { keywords, location, workplace, page = 1 } = params

    if (!appId || !appKey) {
      throw new Error("Missing ADZUNA_APP_ID or APP_KEY")
    }

    const url = new URL(`${this.baseEndpoint}/${page}`)
    url.searchParams.set("app_id", appId)
    url.searchParams.set("app_key", appKey)
    url.searchParams.set("results_per_page", "50")
    url.searchParams.set("content-type", "application/json")

    if (keywords) url.searchParams.set("what", keywords)

    const rawLocation = (location || "").trim()
    const isBroadUk =
      !rawLocation ||
      ["uk", "united kingdom", "great britain", "gb"].includes(rawLocation.toLowerCase())

    // Adzuna GB endpoint already targets the UK. Passing "United Kingdom" yields 0 results,
    // so we either omit it or normalize to "UK".
    if (!isBroadUk) {
      url.searchParams.set("where", rawLocation)
    } else if (rawLocation) {
      url.searchParams.set("where", "UK")
    }
    
    // Adzuna supports 'remote' as a location or keyword, but we'll use a specific filter if possible
    if (workplace === "remote") {
      url.searchParams.set("what", `${keywords || ""} remote`)
    }

    const res = await fetch(url.toString())
    if (!res.ok) {
      let details = ""
      try {
        const body = await res.json()
        details =
          typeof body?.exception === "string"
            ? `${body.exception}${body.display ? ` (${body.display})` : ""}`
            : typeof body?.display === "string"
              ? body.display
              : ""
      } catch {
        // ignore parse errors
      }

      throw new Error(`Adzuna API error: ${res.status}${details ? ` - ${details}` : ""}`)
    }

    const data = await res.json()
    const results = data.results || []

    return {
      listings: results.map((raw: any) => this.mapToJobListing(raw)),
      total: typeof data?.count === "number" ? data.count : undefined,
    }
  }

  async fetchJobs(params: JobFetchParams): Promise<JobListingRecord[]> {
    const meta = await this.fetchJobsWithMeta(params)
    return meta.listings
  }

  async fetchJobDetails(externalId: string): Promise<string | null> {
    // Adzuna doesn't have a simple "fetch single" API for free users that is different from search.
    // However, the search result already contains the description.
    // In our implementation, we'll return null here and let the search-provided shortDescription be used,
    // OR we could potentially use the Adzuna canonical URL to scrape/fetch, but that's complex.
    // We'll return the existing description if we can find it, or null.
    return null 
  }

  private mapToJobListing(raw: any): JobListingRecord {
    const id = String(raw.id || Math.random().toString(36).slice(2))
    
    let workplaceType: JobWorkplaceType = "onsite"
    const content = (raw.description || "").toLowerCase() + (raw.title || "").toLowerCase()
    
    if (content.includes("remote") || content.includes("work from home") || content.includes("wfh")) {
      workplaceType = "remote"
    } else if (content.includes("hybrid") || content.includes("flexible working") || content.includes("office and home")) {
      workplaceType = "hybrid"
    }

    return {
      id: `adz-${id}`,
      externalJobId: id,
      source: "adzuna" as JobSource,
      sourceUrl: raw.redirect_url || "",
      company: raw.company?.display_name || "Unknown Company",
      role: raw.title || "Job Opportunity",
      location: raw.location?.display_name || "UK",
      workplaceType,
      employmentType: raw.contract_type === "contract" ? "contract" : "full-time",
      shortDescription: this.stripHtml(raw.description || ""),
      postedLabel: this.formatDate(raw.created),
      tags: [(raw.category?.label || "General")].concat(raw.company?.display_name ? [raw.company.display_name] : []),
      listingOrigin: "api_search",
    }
  }

  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>?/gm, "")
  }

  private formatDate(dateStr: string | number): string {
    if (!dateStr) return "Recently"
    
    let date: Date
    if (typeof dateStr === "number") {
      date = new Date(dateStr < 10000000000 ? dateStr * 1000 : dateStr)
    } else {
      date = new Date(dateStr)
    }

    if (isNaN(date.getTime())) return "Recently"
    
    const diffMs = Date.now() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return "Today"
    if (diffDays === 1) return "Yesterday"
    if (diffDays < 30) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }
}
