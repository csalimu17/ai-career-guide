import { JobListingRecord, JobSource, JobWorkplaceType } from "../model"
import { JobApiAdapter, JobFetchParams } from "../adapter-interface"

export class ArbeitnowAdapter implements JobApiAdapter {
  name = "Arbeitnow"

  private endpoint = "https://www.arbeitnow.com/api/job-board-api"

  async fetchJobs(params: JobFetchParams): Promise<JobListingRecord[]> {
    const { keywords, location, workplace, page = 1 } = params
    
    const url = new URL(this.endpoint)
    
    // If location is a broad country name, integrate it into keywords for better global search results
    let searchTerms = keywords || ""
    if (location && (location.toLowerCase().includes("uk") || location.toLowerCase().includes("united kingdom"))) {
      if (!searchTerms.toLowerCase().includes("uk") && !searchTerms.toLowerCase().includes("london")) {
        searchTerms = `${searchTerms} UK`.trim()
      }
    }
    
    if (searchTerms) url.searchParams.set("search", searchTerms)
    if (location) url.searchParams.set("location", location)
    
    if (workplace === "remote") {
      url.searchParams.set("remote", "true")
    }
    url.searchParams.set("page", String(page))

    try {
      const res = await fetch(url.toString(), {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      })

      if (!res.ok) {
        throw new Error(`Arbeitnow API error: ${res.status}`)
      }

      const data = await res.json()
      const rawJobs = Array.isArray(data.data) ? data.data : []

      return rawJobs.map((raw: any) => this.mapToJobListing(raw))
    } catch (error) {
      console.error("Arbeitnow fetch error:", error)
      return []
    }
  }

  private mapToJobListing(raw: any): JobListingRecord {
    const id = String(raw.slug || raw.id || Math.random().toString(36).slice(2))
    
    // Determine workplace type
    let workplaceType: JobWorkplaceType = "onsite"
    if (raw.remote) workplaceType = "remote"

    return {
      id: `an-${id}`,
      externalJobId: id,
      source: "arbeitnow" as JobSource,
      sourceUrl: raw.url || "",
      company: raw.company_name || "Unknown Company",
      role: raw.title || "Job Opportunity",
      location: this.sanitizeLocation(raw.location || "Remote / UK"),
      workplaceType,
      employmentType: "full-time",
      shortDescription: this.stripHtml(raw.description || "").slice(0, 320),
      postedLabel: this.formatDate(raw.created_at),
      tags: raw.tags || [],
      listingOrigin: "api_search",
    }
  }

  async fetchJobDetails(externalId: string): Promise<string | null> {
    const url = new URL(this.endpoint)
    url.searchParams.set("search", externalId) // In Arbeitnow, slug search works well
    try {
      const res = await fetch(url.toString(), {
        headers: { Accept: "application/json" },
      })
      if (!res.ok) return null
      const data = await res.json()
      const job = (data.data || []).find((j: any) => String(j.slug || j.id) === externalId)
      return job ? job.description : null
    } catch (error) {
      console.error("Arbeitnow details error:", error)
      return null
    }
  }

  private sanitizeLocation(loc: string): string {
    const l = loc.toLowerCase()
    const ukCities = ["london", "manchester", "birmingham", "leeds", "glasgow", "sheffield", "liverpool", "bristol", "edinburgh"]
    
    // If it's a known UK city but doesn't mention UK, append it
    if (ukCities.some(city => l.includes(city)) && !l.includes("uk") && !l.includes("united kingdom")) {
      return `${loc}, UK`
    }
    return loc
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
