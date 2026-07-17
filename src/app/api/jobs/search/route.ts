import { NextResponse } from "next/server"
import { jobFetcher } from "@/lib/jobs/job-fetcher"
import { JobFetchParams } from "@/lib/jobs/adapter-interface"
import { getClientIp, rateLimit, rateLimitHeaders } from "@/lib/server/rate-limit"

const WORKPLACE_VALUES = new Set(["all", "remote", "hybrid", "onsite"])

export async function GET(request: Request) {
  const limit = rateLimit(`jobs:search:${getClientIp(request)}`, {
    windowMs: Number(process.env.JOBS_RATE_LIMIT_WINDOW_MS || 60_000),
    max: Number(process.env.JOBS_RATE_LIMIT_MAX || 30),
  })

  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many job searches. Please try again shortly." },
      { status: 429, headers: rateLimitHeaders(limit) }
    )
  }

  const { searchParams } = new URL(request.url)
  const query = searchParams.get("q")?.trim()
  const location = searchParams.get("location")?.trim() || ""
  const rawWorkplace = searchParams.get("workplace")?.trim() || "all"
  const workplace = (WORKPLACE_VALUES.has(rawWorkplace) ? rawWorkplace : "all") as JobFetchParams["workplace"]
  const requestedPage = parseInt(searchParams.get("page") || "1")
  const page = Number.isFinite(requestedPage) ? Math.max(requestedPage, 1) : 1
  const requestedPageSize = parseInt(searchParams.get("pageSize") || "50")
  const pageSize = Number.isFinite(requestedPageSize) ? Math.min(Math.max(requestedPageSize, 1), 50) : 50

  if (!query) {
    return NextResponse.json({ error: "Query parameter 'q' is required" }, { status: 400, headers: rateLimitHeaders(limit) })
  }

  try {
    const result = await jobFetcher.fetchJobs({
      keywords: query,
      location,
      workplace,
      page,
      pageSize,
    })

    return NextResponse.json(
      {
        listings: result.listings,
        fromCache: result.fromCache,
        diagnostics: result.diagnostics,
        count: result.listings.length,
        totals: result.totals || {},
      },
      { headers: rateLimitHeaders(limit) }
    )
  } catch (error) {
    console.error("Job Search API error:", error)
    return NextResponse.json(
      { error: "Failed to fetch live jobs. Please try again later." },
      { status: 500 }
    )
  }
}
