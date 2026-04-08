import { NextResponse } from "next/server"
import { jobFetcher } from "@/lib/jobs/job-fetcher"
import { JobFetchParams } from "@/lib/jobs/adapter-interface"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get("q")?.trim()
  const location = searchParams.get("location")?.trim() || ""
  const workplace = (searchParams.get("workplace")?.trim() || "all") as JobFetchParams["workplace"]
  const page = parseInt(searchParams.get("page") || "1")

  if (!query) {
    return NextResponse.json({ error: "Query parameter 'q' is required" }, { status: 400 })
  }

  try {
    const { listings, fromCache } = await jobFetcher.fetchJobs({
      keywords: query,
      location,
      workplace,
      page,
    })

    return NextResponse.json({
      listings,
      isStale: fromCache,
      count: listings.length,
    })
  } catch (error) {
    console.error("Job Search API error:", error)
    return NextResponse.json(
      { error: "Failed to fetch live jobs. Please try again later." },
      { status: 500 }
    )
  }
}
