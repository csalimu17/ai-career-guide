import { JobListingRecord, JobSource } from "../model"
import { JobApiAdapter, JobFetchParams } from "../adapter-interface"

export class LinkedInAdapter implements JobApiAdapter {
  name = "LinkedIn UK"

  private apiKey = process.env.RAPIDAPI_KEY || "a9e8b34f86msh13f7529159dc5a5p17d106jsnecb7da8c3fbb"
  private apiHost = "linkedin-jobs-search.p.rapidapi.com"

  async fetchJobs(params: JobFetchParams): Promise<JobListingRecord[]> {
    const { keywords, location, page = 1 } = params
    
    // Strict UK focus
    const safeLocation = location?.toLowerCase().includes("uk") || location?.toLowerCase().includes("united kingdom") 
      ? location 
      : `${location || "United Kingdom"}`

    const url = new URL(`https://${this.apiHost}/`)
    url.searchParams.set("search_terms", keywords || "")
    url.searchParams.set("location", safeLocation)
    url.searchParams.set("page", String(page))

    try {
      const res = await fetch(url.toString(), {
        method: "POST", // Some LinkedIn RapidAPIs use POST with search_terms or GET. 
        // Based on common "LinkedIn Jobs Search" API:
        headers: {
          "X-RapidAPI-Key": this.apiKey,
          "X-RapidAPI-Host": this.apiHost,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          search_terms: keywords || "Jobs",
          location: safeLocation,
          page: String(page)
        })
      })

      if (!res.ok) throw new Error(`LinkedIn API error: ${res.status}`)
      
      const results = await res.json()

      return results.map((raw: any) => ({
        id: `linkedin-${raw.job_id || raw.id}`,
        externalJobId: raw.job_id || raw.id,
        source: "linkedin" as JobSource,
        sourceUrl: raw.job_url || `https://www.linkedin.com/jobs/view/${raw.job_id}`,
        company: raw.company_name || "Unknown Company",
        role: raw.job_title || "Job Opportunity",
        location: raw.location || "UK",
        workplaceType: "onsite",
        employmentType: "full-time",
        shortDescription: raw.company_name ? `Explore this ${raw.job_title} role at ${raw.company_name}.` : "View details on LinkedIn.",
        postedLabel: raw.posted_date || "Recently",
        tags: ["LinkedIn", raw.company_name].filter(Boolean),
        listingOrigin: "api_search",
      }))
    } catch (error) {
      console.error("LinkedIn fetch error:", error)
      return []
    }
  }

  async fetchJobDetails(externalId: string): Promise<string | null> {
    // Note: Detail fetching on LinkedIn via RapidAPI often requires a separate 'get-job-description' endpoint.
    // Using a common endpoint pattern:
    try {
      const res = await fetch(`https://${this.apiHost}/get-job-details`, {
        method: "POST",
        headers: {
          "X-RapidAPI-Key": this.apiKey,
          "X-RapidAPI-Host": this.apiHost,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ job_id: externalId })
      })

      if (!res.ok) return null
      const data = await res.json()
      return data.job_description || data.description || null
    } catch (error) {
      console.error("LinkedIn details error:", error)
      return null
    }
  }
}
