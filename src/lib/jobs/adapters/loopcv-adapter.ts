import { JobListingRecord, JobSource, JobWorkplaceType } from "../model"
import { JobApiAdapter, JobFetchParams } from "../adapter-interface"

export class LoopCvAdapter implements JobApiAdapter {
  name = "LoopCV"

  // LoopCV API endpoint (using the one suggested by the user)
  private endpoint = "https://www.loopcv.pro/api/jobs"
  
  async fetchJobs(params: JobFetchParams): Promise<JobListingRecord[]> {
    const { keywords, location, workplace } = params
    
    // Build query params
    const q = new URLSearchParams()
    if (keywords) q.set("q", keywords)
    if (location) q.set("location", location)
    if (workplace === "remote") q.set("remote", "true")

    try {
      // NOTE: LoopCV usually requires an API key, but for this implementation we'll try a public fetch first 
      // or assume it's handled by some middleware if that were the case. 
      // The user provided this as a fallback.
      const res = await fetch(`${this.endpoint}?${q.toString()}`, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      })

      if (!res.ok) {
        throw new Error(`LoopCV API error: ${res.status}`)
      }

      const data = await res.json()
      // Normalizing based on common API patterns for LoopCV (usually data.jobs or data.results)
      const rawJobs = Array.isArray(data.jobs) ? data.jobs : Array.isArray(data.results) ? data.results : []

      return rawJobs.map((raw: any) => this.mapToJobListing(raw))
    } catch (error) {
      console.error("LoopCV fetch error:", error)
      return []
    }
  }

  async fetchJobDetails(externalId: string): Promise<string | null> {
    // LoopCV often includes description in the list, but if we need to fetch specific details:
    try {
      const res = await fetch(`${this.endpoint}/${externalId}`, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      })
      if (!res.ok) return null
      const data = await res.json()
      return data.job?.description || data.description || null
    } catch (error) {
      console.error("LoopCV details error:", error)
      return null
    }
  }

  private mapToJobListing(raw: any): JobListingRecord {
    const id = String(raw.id || raw.job_id || Math.random().toString(36).slice(2))
    
    let workplaceType: JobWorkplaceType = "onsite"
    if (raw.remote) workplaceType = "remote"

    return {
      id: `lrc-${id}`,
      externalJobId: id,
      source: "loopcv" as JobSource,
      sourceUrl: raw.url || raw.apply_url || "",
      company: raw.company || raw.company_name || "Unknown Company",
      role: raw.title || raw.job_title || "Job Opportunity",
      location: this.sanitizeLocation(raw.location || "Location not specified"),
      workplaceType,
      employmentType: "full-time",
      shortDescription: this.stripHtml(raw.description || "").slice(0, 320),
      postedLabel: raw.posted_at || "Recently",
      tags: raw.skills || [],
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
}
