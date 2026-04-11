import { JobListingRecord, JobSource, JobWorkplaceType } from "../model"
import { JobApiAdapter, JobFetchParams } from "../adapter-interface"

export class ReedAdapter implements JobApiAdapter {
  name = "Reed.co.uk"

  private apiKey = process.env.REED_API_KEY || ""
  private baseEndpoint = "https://www.reed.co.uk/api/1.0/search"

  async fetchJobs(params: JobFetchParams): Promise<JobListingRecord[]> {
    const { keywords, location, workplace, page = 1 } = params

    if (!this.apiKey) {
      console.warn("Reed API key missing. Skipping Reed search.")
      return []
    }

    const url = new URL(this.baseEndpoint)
    if (keywords) url.searchParams.set("keywords", keywords)
    if (location) url.searchParams.set("locationName", location)
    
    // Pagination: Reed uses resultsToSkip
    const resultsPerPage = 50
    const resultsToSkip = (page - 1) * resultsPerPage
    url.searchParams.set("resultsToTake", String(resultsPerPage))
    url.searchParams.set("resultsToSkip", String(resultsToSkip))

    if (workplace === "remote") {
      url.searchParams.set("distancefromlocation", "100") // Common heuristic for Reed remote
      // If location is also provided, it will search within 100 miles. 
      // If we want purely remote, we might append 'remote' to keywords if no location.
      if (!location) {
        url.searchParams.set("keywords", `${keywords || ""} remote`)
      }
    }

    try {
      const authHeader = `Basic ${Buffer.from(`${this.apiKey}:`).toString("base64")}`
      const res = await fetch(url.toString(), {
        headers: {
          Authorization: authHeader,
          Accept: "application/json",
        },
      })

      if (!res.ok) {
        throw new Error(`Reed API error: ${res.status}`)
      }

      const data = await res.json()
      const results = data.results || []

      return results.map((raw: any) => this.mapToJobListing(raw))
    } catch (error) {
      console.error("Reed fetch error:", error)
      return []
    }
  }

  private mapToJobListing(raw: any): JobListingRecord {
    const id = String(raw.jobId || Math.random().toString(36).slice(2))
    
    let workplaceType: JobWorkplaceType = "onsite"
    if (raw.jobDescription?.toLowerCase().includes("remote") || raw.jobTitle?.toLowerCase().includes("remote")) {
      workplaceType = "remote"
    }

    return {
      id: `reed-${id}`,
      externalJobId: id,
      source: "reed" as JobSource,
      sourceUrl: raw.jobUrl || "",
      company: raw.employerName || "Unknown Company",
      role: raw.jobTitle || "Job Opportunity",
      location: raw.locationName || "UK",
      workplaceType,
      employmentType: "full-time",
      shortDescription: this.stripHtml(raw.jobDescription || "").slice(0, 320),
      postedLabel: raw.date || "Recently",
      tags: [(raw.employerName || "Employer")].concat(raw.locationName ? [raw.locationName] : []),
      listingOrigin: "api_search",
    }
  }

  async fetchJobDetails(externalId: string): Promise<string | null> {
    const url = `https://www.reed.co.uk/api/1.0/jobs/${externalId}`
    try {
      const authHeader = `Basic ${Buffer.from(`${this.apiKey}:`).toString("base64")}`
      const res = await fetch(url, {
        headers: {
          Authorization: authHeader,
          Accept: "application/json",
        },
      })

      if (!res.ok) return null
      const data = await res.json()
      return data.jobDescription || null
    } catch (error) {
      console.error("Reed details fetch error:", error)
      return null
    }
  }

  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>?/gm, "")
  }
}
