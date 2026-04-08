import { JobListingRecord, JobSource, JobWorkplaceType } from "../model"
import { JobApiAdapter, JobFetchParams } from "../adapter-interface"

export class AdzunaAdapter implements JobApiAdapter {
  name = "Adzuna"

  private appId = process.env.ADZUNA_APP_ID || ""
  private appKey = process.env.ADZUNA_APP_KEY || ""
  private baseEndpoint = "https://api.adzuna.com/v1/api/jobs/gb/search"

  async fetchJobs(params: JobFetchParams): Promise<JobListingRecord[]> {
    const { keywords, location, workplace, page = 1 } = params

    if (!this.appId || !this.appKey) {
      console.warn("Adzuna API credentials missing. Skipping Adzuna search.")
      return []
    }

    const url = new URL(`${this.baseEndpoint}/${page}`)
    url.searchParams.set("app_id", this.appId)
    url.searchParams.set("app_key", this.appKey)
    url.searchParams.set("results_per_page", "20")
    url.searchParams.set("content-type", "application/json")

    if (keywords) url.searchParams.set("what", keywords)
    if (location) url.searchParams.set("where", location)
    
    // Adzuna supports 'remote' as a location or keyword, but we'll use a specific filter if possible
    if (workplace === "remote") {
      url.searchParams.set("what", `${keywords || ""} remote`)
    }

    try {
      const res = await fetch(url.toString())
      if (!res.ok) {
        throw new Error(`Adzuna API error: ${res.status}`)
      }

      const data = await res.json()
      const results = data.results || []

      return results.map((raw: any) => this.mapToJobListing(raw))
    } catch (error) {
      console.error("Adzuna fetch error:", error)
      return []
    }
  }

  private mapToJobListing(raw: any): JobListingRecord {
    const id = String(raw.id || Math.random().toString(36).slice(2))
    
    let workplaceType: JobWorkplaceType = "onsite"
    if (raw.description?.toLowerCase().includes("remote") || raw.title?.toLowerCase().includes("remote")) {
      workplaceType = "remote"
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
      shortDescription: this.stripHtml(raw.description || "").slice(0, 320),
      postedLabel: this.formatDate(raw.created),
      tags: [(raw.category?.label || "General")].concat(raw.company?.display_name ? [raw.company.display_name] : []),
      listingOrigin: "api_search",
    }
  }

  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>?/gm, "")
  }

  private formatDate(dateStr: string): string {
    if (!dateStr) return "Recently"
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return "Recently"
    
    const diffMs = Date.now() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return "Today"
    if (diffDays === 1) return "Yesterday"
    if (diffDays < 30) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }
}
