import { NextResponse } from "next/server"
import { jobFetcher } from "@/lib/jobs/job-fetcher"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const source = searchParams.get("source")
  const externalId = searchParams.get("id")

  if (!source || !externalId) {
    return NextResponse.json({ error: "Missing source or id parameter" }, { status: 400 })
  }

  try {
    const description = await jobFetcher.fetchJobDescription(source, externalId)
    
    if (!description) {
      return NextResponse.json({ error: "Job description not found" }, { status: 404 })
    }

    return NextResponse.json({ description })
  } catch (error) {
    console.error("Job Details API error:", error)
    return NextResponse.json(
      { error: "Failed to fetch job details." },
      { status: 500 }
    )
  }
}
