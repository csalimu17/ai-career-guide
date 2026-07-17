import { NextResponse } from "next/server"
import { jobFetcher } from "@/lib/jobs/job-fetcher"
import { getClientIp, rateLimit, rateLimitHeaders } from "@/lib/server/rate-limit"

export async function GET(request: Request) {
  const limit = rateLimit(`jobs:details:${getClientIp(request)}`, {
    windowMs: Number(process.env.JOBS_RATE_LIMIT_WINDOW_MS || 60_000),
    max: Number(process.env.JOBS_DETAILS_RATE_LIMIT_MAX || 60),
  })

  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many job detail requests. Please try again shortly." },
      { status: 429, headers: rateLimitHeaders(limit) }
    )
  }

  const { searchParams } = new URL(request.url)
  const source = searchParams.get("source")
  const externalId = searchParams.get("id")

  if (!source || !externalId) {
    return NextResponse.json({ error: "Missing source or id parameter" }, { status: 400, headers: rateLimitHeaders(limit) })
  }

  try {
    const description = await jobFetcher.fetchJobDescription(source, externalId)
    
    if (!description) {
      return NextResponse.json({ error: "Job description not found" }, { status: 404, headers: rateLimitHeaders(limit) })
    }

    return NextResponse.json({ description }, { headers: rateLimitHeaders(limit) })
  } catch (error) {
    console.error("Job Details API error:", error)
    return NextResponse.json(
      { error: "Failed to fetch job details." },
      { status: 500 }
    )
  }
}
