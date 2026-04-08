import { JobListingRecord } from "./model"
import { JobFetchParams, JobApiAdapter } from "./adapter-interface"
import { ArbeitnowAdapter } from "./adapters/arbeitnow-adapter"
import { LoopCvAdapter } from "./adapters/loopcv-adapter"
import { AdzunaAdapter } from "./adapters/adzuna-adapter"
import { ReedAdapter } from "./adapters/reed-adapter"
import { SimpleCache } from "./cache"

export class JobFetcher {
  private primary: JobApiAdapter[] = [
    new AdzunaAdapter(),
    new ReedAdapter(),
  ]
  private secondary: JobApiAdapter[] = [
    new ArbeitnowAdapter(),
    new LoopCvAdapter(),
  ]
  private cache = new SimpleCache<JobListingRecord[]>()

  async fetchJobs(params: JobFetchParams): Promise<{ listings: JobListingRecord[]; fromCache: boolean }> {
    const isUkSearch = !params.location || this.isLikelyUk(params.location)
    const effectiveParams = {
      ...params,
      location: params.location || "UK",
    }

    const cacheKey = this.buildCacheKey(effectiveParams)
    const cached = this.cache.get(cacheKey)
    if (cached) {
      return { listings: cached, fromCache: true }
    }

    let results: JobListingRecord[] = []

    try {
      // Try primary adapters (UK-specific)
      for (const adapter of this.primary) {
        const adapterResults = await adapter.fetchJobs(effectiveParams)
        results = [...results, ...adapterResults]
      }
      
      // If primary returns very few results, try secondary aggregators
      if (results.length < 5) {
        for (const adapter of this.secondary) {
          const adapterResults = await adapter.fetchJobs(effectiveParams)
          results = [...results, ...adapterResults]
        }
      }

      // Robust UK filtering: Always applied unless it's explicitly a non-UK search
      if (isUkSearch) {
        results = this.filterUkResults(results)
      }

      if (results.length > 0) {
        this.cache.set(cacheKey, results, 600_000)
      }
      return { listings: results, fromCache: false }
    } catch (error) {
      console.error("Job search failed:", error)
      throw new Error("Job search system failed to retrieve localized results.")
    }
  }

  private isLikelyUk(location: string): boolean {
    const loc = location.toLowerCase()
    // Explicit non-UK markers
    const nonUk = ["usa", "germany", "france", "india", "canada", "berlin", "paris", "new york", "munich", "frankfurt"]
    if (nonUk.some(country => loc.includes(country))) return false
    
    // If it's a known UK city or region, or just general 'UK'
    const ukKeywords = [
      "uk", "united kingdom", "london", "manchester", "birmingham", "leeds", "glasgow", 
      "sheffield", "liverpool", "bristol", "edinburgh", "southampton", "portsmouth",
      "reading", "slough", "nottingham", "leicester", "coventry", "hull", "belfast",
      "cardiff", "england", "scotland", "wales", "northern ireland", "gb"
    ]
    return ukKeywords.some(kw => loc.includes(kw)) || loc.length === 0 || !loc.includes(",") // Fallback: if short or no comma, assume local
  }

  private filterUkResults(listings: JobListingRecord[]): JobListingRecord[] {
    const ukKeywords = [
      "uk", "united kingdom", "london", "manchester", "birmingham", 
      "leeds", "glasgow", "sheffield", "liverpool", "bristol", 
      "edinburgh", "leicester", "coventry", "hull", "belfast",
      "cardiff", "england", "scotland", "wales", "northern ireland",
      "southampton", "portsmouth", "brighton", "bournemouth", "reading",
      "slough", "oxford", "cambridge", "milton keynes", "luton",
      "surrey", "essex", "kent", "hertfordshire", "sussex", "berkshire",
      "oxfordshire", "cambridgeshire", "hampshire", "dorset", "somerset",
      "devon", "cornwall", "gloucestershire", "wiltshire", "staffordshire",
      "yorkshire", "lancashire", "cheshire", "derbyshire", "nottinghamshire",
      "gb", "united kingdom"
    ]
    
    return listings.filter(job => {
      const location = job.location.toLowerCase()
      // If it mentions UK cities/regions or explicitly says UK
      const isUk = ukKeywords.some(kw => location.includes(kw))
      // Or if it's remote and we're in "UK default mode", we'll allow it if it doesn't specify another country
      const isRemoteWithoutConflict = job.workplaceType === "remote" && !this.hasNonUkCountry(location)
      
      return isUk || isRemoteWithoutConflict
    })
  }

  private hasNonUkCountry(location: string): boolean {
    const nonUk = ["usa", "germany", "france", "india", "canada", "berlin", "paris", "new york"]
    return nonUk.some(country => location.includes(country))
  }

  private buildCacheKey(params: JobFetchParams): string {
    return JSON.stringify({
      q: params.keywords || "",
      l: params.location || "",
      w: params.workplace || "all",
      p: params.page || 1,
    })
  }
}

// Export a singleton instance
export const jobFetcher = new JobFetcher()
