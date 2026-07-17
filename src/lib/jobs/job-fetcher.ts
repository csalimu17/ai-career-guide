import { JobListingRecord } from "./model"
import { JobFetchParams, JobApiAdapter } from "./adapter-interface"
import { ArbeitnowAdapter } from "./adapters/arbeitnow-adapter"
import { AdzunaAdapter } from "./adapters/adzuna-adapter"
import { DevItJobsUkAdapter } from "./adapters/devitjobs-uk-adapter"
import { ReedAdapter } from "./adapters/reed-adapter"
import { LoopCvAdapter } from "./adapters/loopcv-adapter"
import { SimpleCache } from "./cache"

export class JobFetcher {
  private adapters: Record<string, JobApiAdapter> = {
    reed: new ReedAdapter(),
    adzuna: new AdzunaAdapter(),
    devitjobs: new DevItJobsUkAdapter(),
    arbeitnow: new ArbeitnowAdapter(),
    loopcv: new LoopCvAdapter(),
  }

  // The product is "UK live jobs" by default. Some feeds skew EU-wide and rarely/never include UK,
  // so they are opt-in to avoid confusing "Success (raw)" with "0 UK results" outcomes.
  private includeEuFeeds = process.env.JOBS_INCLUDE_EU_FEEDS === "true"

  private primary: JobApiAdapter[] = [
    this.adapters.adzuna,
    this.adapters.devitjobs,
    ...(this.includeEuFeeds ? [this.adapters.arbeitnow, this.adapters.loopcv] : []),
    this.adapters.reed,
  ]

  private cache = new SimpleCache<JobListingRecord[]>()
  private detailCache = new SimpleCache<string>()

  async fetchJobs(params: JobFetchParams): Promise<{ listings: JobListingRecord[]; fromCache: boolean; diagnostics?: Record<string, string>; totals?: Record<string, number> }> {
    const effectivePageSize = params.pageSize ?? 50
    // Determine effective location - only default to UK if nothing provided
    const isUkSearch = !params.location || 
                         params.location.toLowerCase() === "united kingdom" || 
                         params.location.toLowerCase() === "uk"
    
    // Broad search handler: if query is "latest", treat as empty keyword for broad discovery
    const effectiveKeywords = params.keywords?.toLowerCase() === "latest" ? "" : params.keywords

    // Use "United Kingdom" as a stronger hint for generic APIs when no specific city is provided
    const effectiveLocation = isUkSearch ? "United Kingdom" : params.location
    const effectiveParams = {
      ...params,
      keywords: effectiveKeywords,
      location: effectiveLocation,
      pageSize: effectivePageSize,
    }

    const cacheKey = this.buildCacheKey({ ...params, location: effectiveLocation, pageSize: effectivePageSize })
    const cached = this.cache.get(cacheKey)
    if (cached) {
      return { listings: cached, fromCache: true }
    }

    let results: JobListingRecord[] = []
    const adapterStats: Record<string, string> = {}
    const totalsByProvider: Record<string, number> = {}

    try {
      const sourcePromises = this.primary.map(async adapter => {
        try {
          const start = Date.now()
          
          // Add a timeout to prevent an adapter from stalling the whole search
          const timeoutPromise = new Promise<JobListingRecord[]>((_, reject) => 
            setTimeout(() => reject(new Error("Timeout")), 8000)
          )
          
          const fetchPromise = (typeof adapter.fetchJobsWithMeta === "function"
            ? adapter.fetchJobsWithMeta(effectiveParams).then((meta) => {
                if (typeof meta?.total === "number") {
                  totalsByProvider[adapter.name] = meta.total
                }
                return meta?.listings || []
              })
            : adapter.fetchJobs(effectiveParams)) as Promise<JobListingRecord[]>
          
          const rawData = await Promise.race([fetchPromise, timeoutPromise]) as JobListingRecord[]
          const duration = Date.now() - start
          
          const data = (rawData && Array.isArray(rawData)) ? rawData : []
          if (data.length === 0) {
            adapterStats[adapter.name] = "Returned 0 results"
            return []
          }

          // Filter to UK at the adapter boundary so diagnostics reflect what the UI will show.
          const ukOnly = this.filterUkResults(data)
          adapterStats[adapter.name] =
            ukOnly.length > 0
              ? `Success (${ukOnly.length} UK / ${data.length} raw in ${duration}ms)`
              : `0 UK results (${data.length} raw in ${duration}ms)`

          return ukOnly
        } catch (err: any) {
          adapterStats[adapter.name] = `Failed: ${err.message || err}`
          console.error(`Adapter ${adapter.name} failed:`, err)
          return []
        }
      })

      const allResults = await Promise.all(sourcePromises)
      const flatResults = allResults.flat()

      // Deduplicate results by ID to prevent key collisions in the UI
      const seen = new Set<string>()
      results = flatResults.filter(job => {
        const uniqueId = job.id || `${job.source}-${job.externalJobId}`
        if (!uniqueId || seen.has(uniqueId)) return false
        seen.add(uniqueId)
        return true
      })

      console.log("Job Search Diagnostics:", adapterStats)

      // Final UK safety filter (Strict)
      results = this.filterUkResults(results)
      
      // Selectively filter by city if requested
      if (params.location && !isUkSearch) {
        const requestedCity = params.location.toLowerCase().split(",")[0].trim()
        results = results.filter(job => {
          const jobLoc = job.location.toLowerCase()
          const jobRole = job.role.toLowerCase()
          // If the user explicitly selects remote-only, don't constrain by city.
          // Otherwise, keep city filtering strict (including for remote listings),
          // to match user expectations when they type a city.
          const allowRemoteAnywhere = params.workplace === "remote"
          return jobLoc.includes(requestedCity) || jobRole.includes(requestedCity) || (allowRemoteAnywhere && job.workplaceType === "remote")
        })
      }

      // Sort: Priority to recent
      results = results.sort((a, b) => {
        const getAge = (label: string) => {
          const l = label.toLowerCase()
          if (l.includes("today") || l.includes("just") || l.includes("hour")) return 0
          if (l.includes("yesterday")) return 1
          const match = l.match(/(\d+)d/)
          return match ? parseInt(match[1]) : 100
        }
        return getAge(a.postedLabel) - getAge(b.postedLabel)
      })

      // Enforce page size at the aggregator layer
      results = results.slice(0, effectivePageSize)

      if (results.length > 0) {
        this.cache.set(cacheKey, results, 600_000) // 10 min cache
      }
      return { listings: results, fromCache: false, diagnostics: adapterStats, totals: totalsByProvider }
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
      "reading", "oxford", "cambridge", "newcastle", "york",
      "nottingham", "southampton", "portsmouth", "aberdeen", "swansea",
      "brighton", "norwich", "plymouth", "derby", "wolverhampton",
      "milton keynes", "slough", "swindon", "luton", "warrington",
      "crawley", "st albans", "chelmsford", "basildon", "watford",
      "sheffield", "sunderland", "newport", "derby", "salford"
    ]
    
    // USA states and other non-UK indicators to exclude
    const nonUk = [
      "usa", "us", "america", "germany", "france", "india", "canada", 
      "berlin", "paris", "spain", "italy", "australia", "mexico", 
      "uae", "dubai", "singapore", "netherlands", "sweden", "china",
      "alabama", "alaska", "arizona", "arkansas", "california", "colorado", 
      "connecticut", "delaware", "florida", "georgia", "hawaii", "idaho", 
      "illinois", "indiana", "iowa", "kansas", "kentucky", "louisiana", 
      "maine", "maryland", "massachusetts", "michigan", "minnesota", 
      "mississippi", "missouri", "montana", "nebraska", "nevada", 
      "new hampshire", "new jersey", "new mexico", "new york", 
      "north carolina", "north dakota", "ohio", "oklahoma", "oregon", 
      "pennsylvania", "rhode island", "south carolina", "south dakota", 
      "tennessee", "texas", "utah", "vermont", "virginia", "washington", 
      "west virginia", "wisconsin", "wyoming", 
      "united states", "hong kong", "switzerland", "dublin" // Note: Dublin is not in UK
    ]
    
    return listings.filter(job => {
      const location = (job.location || "").toLowerCase()
      const role = (job.role || "").toLowerCase()
      const description = (job.shortDescription || "").toLowerCase()
      const hasGbpSymbol = description.includes("\u00a3") || location.includes("\u00a3")

      // Northern Ireland Safety
      const isNorthernIreland = location.includes("northern ireland") || location.includes("belfast")
      
      // Mandatory UK indicator for global sources
      // We use word boundaries to avoid false positives
      const mentionsUkSpecifics = [
          "united kingdom", "england", "scotland", "wales", "northern ireland", 
          "inside ir35", "outside ir35", "salary in gbp", "£", "gbp", "remote uk", "london", "gb", "uk-based", "uk based"
      ].some(term => {
        if (term === "£") return description.includes(term) || location.includes(term)
        // For short terms like "gb" or "uk", we are more careful
        const regex = new RegExp(`\\b${term}\\b`, "i")
        return regex.test(description) || regex.test(location) || regex.test(role)
      })
      
      const hasUkCity = ukKeywords.some(kw => {
        const regex = new RegExp(`\\b${kw}\\b`, "i")
        return regex.test(location) || regex.test(role)
      })
      
      // Source-based trust: Reed and Adzuna GB are targeted UK feeds
      if (job.source === "reed" || job.source === "adzuna" || job.source === "devitjobs") {
        const lowerLoc = (job.location || "").toLowerCase()
        const hasConflictMatch = nonUk.some(country => {
            const regex = new RegExp(`\\b${country}\\b`, "i")
            return regex.test(lowerLoc)
        })
        if (hasConflictMatch && !hasUkCity) return false
        return true
      }

      // CRITICAL: Must have at least one UK indicator to pass from a global feed
      const isLikelyUk = hasUkCity || mentionsUkSpecifics || hasGbpSymbol
      if (!isLikelyUk) {
        // Broad remote safety: if it mentions remote and the location (even if not city) is UK
        const isBroadRemote = description.includes("remote") && (location.includes("uk") || location.includes("united kingdom"))
        if (!isBroadRemote) return false
      }

      // Prevent false positives from foreign locations (with word boundaries)
      const hasConflict = nonUk.some(country => {
        if (country === "ireland" && isNorthernIreland) return false
        const regex = new RegExp(`\\b${country}\\b`, "i")
        return regex.test(location)
      })
      
      if (hasConflict) return false

      return true
    })
  }

  async fetchJobDetails(source: string, externalId: string): Promise<string | null> {
    const cacheKey = `details-${source}-${externalId}`
    const cached = this.detailCache.get(cacheKey)
    if (cached) return cached

    const adapter = this.adapters[source]
    if (!adapter || !adapter.fetchJobDetails) return null

    try {
      const details = await adapter.fetchJobDetails(externalId)
      if (details) {
        this.detailCache.set(cacheKey, details, 3600_000) // 1 hr cache
      }
      return details
    } catch (error) {
      console.error(`Details fetch failed for ${source}/${externalId}:`, error)
      return null
    }
  }

  private buildCacheKey(params: JobFetchParams): string {
    return JSON.stringify({
      q: params.keywords || "",
      l: params.location || "UK",
      w: params.workplace || "all",
      p: params.page || 1,
      s: params.pageSize || 50,
    })
  }
}

export const jobFetcher = new JobFetcher()
