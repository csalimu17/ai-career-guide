import { JobListingRecord } from "./model"
import { JobFetchParams, JobApiAdapter } from "./adapter-interface"
import { ArbeitnowAdapter } from "./adapters/arbeitnow-adapter"
import { AdzunaAdapter } from "./adapters/adzuna-adapter"
import { ReedAdapter } from "./adapters/reed-adapter"
import { IndeedAdapter } from "./adapters/indeed-adapter"
import { LinkedInAdapter } from "./adapters/linkedin-adapter"
import { LoopCvAdapter } from "./adapters/loopcv-adapter"
import { SimpleCache } from "./cache"

export class JobFetcher {
  private adapters: Record<string, JobApiAdapter> = {
    indeed: new IndeedAdapter(),
    linkedin: new LinkedInAdapter(),
    reed: new ReedAdapter(),
    adzuna: new AdzunaAdapter(),
    arbeitnow: new ArbeitnowAdapter(),
    loopcv: new LoopCvAdapter(),
  }

  // Define priorities - Move key-required ones to after public ones if possible, 
  // or keep broad coverage.
  private primary: JobApiAdapter[] = [
    this.adapters.adzuna,
    this.adapters.arbeitnow,
    this.adapters.loopcv,
    this.adapters.reed,
    this.adapters.indeed,
    this.adapters.linkedin,
  ]

  private cache = new SimpleCache<JobListingRecord[]>()
  private detailCache = new SimpleCache<string>()

  async fetchJobs(params: JobFetchParams): Promise<{ listings: JobListingRecord[]; fromCache: boolean }> {
    // Determine effective location - only default to UK if nothing provided
    const isGenericUk = !params.location || 
                         params.location.toLowerCase() === "united kingdom" || 
                         params.location.toLowerCase() === "uk"
    
    const effectiveLocation = isGenericUk ? "" : params.location
    const effectiveParams = {
      ...params,
      location: effectiveLocation,
    }

    const cacheKey = this.buildCacheKey(effectiveParams)
    const cached = this.cache.get(cacheKey)
    if (cached) {
      return { listings: cached, fromCache: true }
    }

    let results: JobListingRecord[] = []
    const adapterStats: Record<string, string> = {}

    try {
      const sourcePromises = this.primary.map(async adapter => {
        try {
          const start = Date.now()
          const data = await adapter.fetchJobs(effectiveParams)
          const duration = Date.now() - start
          
          if (data.length > 0) {
            adapterStats[adapter.name] = `Success (${data.length} results in ${duration}ms)`
          } else {
            adapterStats[adapter.name] = "Returned 0 results"
          }
          return data
        } catch (err: any) {
          adapterStats[adapter.name] = `Error: ${err.message || err}`
          console.error(`Adapter ${adapter.name} failed:`, err)
          return []
        }
      })

      const allResults = await Promise.all(sourcePromises)
      const flatResults = allResults.flat()

      // Deduplicate results by ID to prevent key collisions in the UI
      const seen = new Set<string>()
      results = flatResults.filter(job => {
        if (!job.id || seen.has(job.id)) return false
        seen.add(job.id)
        return true
      })

      console.log("Job Search Diagnostics:", adapterStats)

      // Final UK safety filter (Strict)
      results = this.filterUkResults(results)
      
      // City Filter: If a specific location was requested (not generic UK), 
      // loosely check if the results are relevant.
      if (params.location && params.location.toLowerCase() !== "uk" && params.location.toLowerCase() !== "united kingdom") {
        const requestedCity = params.location.toLowerCase().split(",")[0].trim()
        
        // We allow results that EITHER:
        // 1. Explicitly mention the city
        // 2. Are from a trust-worthy UK source (Adzuna/Reed) and contain 'UK'
        // 3. Are marked as 'remote' (since remote jobs apply everywhere)
        results = results.filter(job => {
          const jobLoc = job.location.toLowerCase()
          const isLocal = jobLoc.includes(requestedCity) || job.role.toLowerCase().includes(requestedCity)
          const isRemote = job.workplaceType === "remote"
          const isStrongUkSource = job.source === "adzuna" || job.source === "reed"
          
          return isLocal || isRemote || (isStrongUkSource && (jobLoc.includes("uk") || jobLoc.includes("united kingdom")))
        })
      }

      // Fallback: The user requested NO mock jobs. 
      // If results are empty, we return empty rather than injecting simulation.
      if (results.length === 0) {
        console.warn(`No real results found for ${params.keywords} in ${params.location}.`)
      }

      // Sort by "Recently" if possible, or just shuffle for variety
      results = results.sort((a, b) => b.postedLabel.localeCompare(a.postedLabel))

      if (results.length > 0) {
        this.cache.set(cacheKey, results, 600_000) // 10 min cache
      }
      return { listings: results, fromCache: false }
    } catch (error) {
      console.error("Job search failed:", error)
      throw new Error("Job search system failed to retrieve results.")
    }
  }

  async fetchJobDescription(source: string, externalId: string): Promise<string | null> {
    const cacheKey = `desc:${source}:${externalId}`
    const cached = this.detailCache.get(cacheKey)
    if (cached) return cached

    const adapter = this.adapters[source]
    if (!adapter) {
      console.warn(`No adapter found for source: ${source}`)
      return null
    }

    try {
      const description = await adapter.fetchJobDetails(externalId)
      if (description) {
        this.detailCache.set(cacheKey, description, 3600_000) // 1 hour cache
      }
      return description
    } catch (err) {
      console.error(`Failed to fetch description for ${source}:${externalId}`, err)
      return null
    }
  }

  private filterUkResults(listings: JobListingRecord[]): JobListingRecord[] {
    const ukKeywords = [
      "uk", "united kingdom", "london", "manchester", "birmingham", 
      "leeds", "glasgow", "sheffield", "liverpool", "bristol", 
      "edinburgh", "leicester", "coventry", "hull", "belfast",
      "cardiff", "england", "scotland", "wales", "northern ireland", "gb",
      "reading", "bristol", "oxford", "cambridge", "newcastle", "york",
      "nottingham", "southampton", "portsmouth", "aberdeen", "swansea",
      "brighton", "norwich", "plymouth", "derby", "wolverhampton",
      "milton keynes", "slough", "swindon", "luton", "warrington"
    ]
    
    return listings.filter(job => {
      // Source-based trust: Reed and Adzuna GB are naturally UK jobs
      if (job.source === "reed" || job.source === "adzuna") return true

      const location = job.location.toLowerCase()
      const isUk = ukKeywords.some(kw => location.includes(kw))
      
      // Prevent false positives from foreign US locations or other European countries
      const nonUk = ["usa", "germany", "france", "india", "canada", "berlin", "paris", "ny", "california", "spain", "italy", "australia", "mexico"]
      const hasConflict = nonUk.some(country => location.includes(country))
      
      return isUk && !hasConflict
    })
  }

  private buildCacheKey(params: JobFetchParams): string {
    return JSON.stringify({
      q: params.keywords || "",
      l: params.location || "UK",
      w: params.workplace || "all",
      p: params.page || 1,
    })
  }
}

export const jobFetcher = new JobFetcher()
