import { JobListingRecord, JobSource } from "../model"
import { JobApiAdapter, JobFetchParams } from "../adapter-interface"

export class IndeedAdapter implements JobApiAdapter {
  name = "Indeed UK"

  private apiKey = process.env.RAPIDAPI_KEY || "a9e8b34f86msh13f7529159dc5a5p17d106jsnecb7da8c3fbb"
  private apiHost = "indeed12.p.rapidapi.com"

  async fetchJobs(params: JobFetchParams): Promise<JobListingRecord[]> {
    const { keywords, location, page = 1 } = params
    
    // Strict UK focus
    const safeLocation = (location?.toLowerCase().includes("uk") || location?.toLowerCase().includes("united kingdom"))
      ? location 
      : location 
        ? `${location}, UK` 
        : "United Kingdom"

    const url = new URL(`https://${this.apiHost}/jobs/search`)
    url.searchParams.set("query", keywords || "")
    url.searchParams.set("location", safeLocation)
    url.searchParams.set("page", String(page))

    try {
      const res = await fetch(url.toString(), {
        headers: {
          "X-RapidAPI-Key": this.apiKey,
          "X-RapidAPI-Host": this.apiHost,
        },
      })

      if (!res.ok) throw new Error(`Indeed API error: ${res.status}`)
      
      const data = await res.json()
      const results = data.hits || data.results || data.data || []

      return results.map((raw: any) => ({
        id: `indeed-${raw.id || raw.job_id}`,
        externalJobId: raw.id || raw.job_id,
        source: "indeed" as JobSource,
        sourceUrl: raw.url || `https://www.indeed.com/viewjob?jk=${raw.id || raw.job_id}`,
        company: raw.company_name || raw.company || "Unknown Company",
        role: raw.job_title || raw.title || "Job Opportunity",
        location: raw.location || "UK",
        workplaceType: "onsite", // Indeed 12 doesn't always specify clearly in search
        employmentType: "full-time",
        shortDescription: raw.snippet || raw.description || "",
        postedLabel: raw.formatted_relative_time || "Recently",
        tags: [raw.company_name || "Indeed"].filter(Boolean),
        listingOrigin: "api_search",
      }))
    } catch (error) {
      console.error("Indeed fetch error:", error)
      return []
    }
  }

  async fetchJobDetails(externalId: string): Promise<string | null> {
    try {
      const res = await fetch(`https://${this.apiHost}/job/${externalId}`, {
        headers: {
          "X-RapidAPI-Key": this.apiKey,
          "X-RapidAPI-Host": this.apiHost,
        },
      })

      if (!res.ok) return null
      const data = await res.json()
      return data.description || data.job_description || null
    } catch (error) {
      console.error("Indeed details error:", error)
      return null
    }
  }
}
