import { JobListingRecord, JobSource, JobWorkplaceType } from "../model"
import { JobApiAdapter, JobFetchParams } from "../adapter-interface"

export class ArbeitnowAdapter implements JobApiAdapter {
  name = "Arbeitnow"

  private endpoint = "https://www.arbeitnow.com/api/job-board-api"

  async fetchJobs(params: JobFetchParams): Promise<JobListingRecord[]> {
    const { keywords, location, workplace, page = 1 } = params
    
    const url = new URL(this.endpoint)
    if (keywords) url.searchParams.set("search", keywords)
    if (location) url.searchParams.set("location", location)
    // Arbeitnow doesn't have a direct workplace filter in the same way, 
    // but the API documentation (or common usage) often uses it in the search or as a separate param if supported.
    // For now, we'll try to find it in the search term if workplace is remote.
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
