import { NextResponse } from "next/server"

import { isJobSource, type JobSource } from "@/lib/jobs/model"

type ApplyIntentResponse = {
  canEmbed: boolean
  launchMode: "iframe" | "external"
  reason:
    | "embed_allowed"
    | "provider_blocks_embedding"
    | "custom_site_external_only"
    | "untrusted_target"
    | "probe_failed"
  note: string
  targetUrl: string
  checkedAt: string
}

const SOURCE_HOST_RULES: Record<JobSource, string[]> = {
  linkedin: ["linkedin.com"],
  indeed: ["indeed.com"],
  greenhouse: ["greenhouse.io"],
  lever: ["lever.co", "jobs.lever.co"],
  company_site: [],
  arbeitnow: ["arbeitnow.com"],
  loopcv: ["loopcv.pro"],
  adzuna: ["adzuna.co.uk", "adzuna.com"],
  reed: ["reed.co.uk"],
}

const KNOWN_EXTERNAL_ONLY = new Set<JobSource>(["linkedin", "indeed"])

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null)
    const source = typeof body?.source === "string" && isJobSource(body.source) ? body.source : null
    const rawUrl = typeof body?.url === "string" ? body.url : null

    if (!source || !rawUrl) {
      return NextResponse.json({ error: "A valid source and url are required." }, { status: 400 })
    }

    const normalizedUrl = normalizePublicUrl(rawUrl)
    if (!normalizedUrl) {
      return NextResponse.json(buildIntentResponse(source, rawUrl, false, "untrusted_target"), { status: 200 })
    }

    if (!matchesExpectedHost(source, normalizedUrl)) {
      return NextResponse.json(buildIntentResponse(source, normalizedUrl.toString(), false, "untrusted_target"), { status: 200 })
    }

    if (KNOWN_EXTERNAL_ONLY.has(source)) {
      const reason = source === "company_site" ? "custom_site_external_only" : "provider_blocks_embedding"
      return NextResponse.json(buildIntentResponse(source, normalizedUrl.toString(), false, reason), { status: 200 })
    }

    const probe = await probeEmbeddability(normalizedUrl)
    return NextResponse.json(
      buildIntentResponse(
        source,
        normalizedUrl.toString(),
        probe.canEmbed,
        probe.canEmbed ? "embed_allowed" : probe.reason
      ),
      { status: 200 }
    )
  } catch (error) {
    console.error("[JobsApplyIntent] Failed to resolve apply intent:", error)
    return NextResponse.json({ error: "Failed to resolve apply intent." }, { status: 500 })
  }
}

function buildIntentResponse(
  source: JobSource,
  targetUrl: string,
  canEmbed: boolean,
  reason: ApplyIntentResponse["reason"]
): ApplyIntentResponse {
  return {
    canEmbed,
    launchMode: canEmbed ? "iframe" : "external",
    reason,
    note: getIntentNote(source, reason),
    targetUrl,
    checkedAt: new Date().toISOString(),
  }
}

function getIntentNote(source: JobSource, reason: ApplyIntentResponse["reason"]) {
  if (reason === "embed_allowed") {
    return "This job board appears to allow in-app embedding, so you can review and apply without leaving the workspace."
  }

  if (reason === "provider_blocks_embedding") {
    return `${source === "indeed" ? "Indeed" : "LinkedIn"} blocks embedded applications, so the final submission has to open in a separate tab.`
  }

  if (reason === "custom_site_external_only") {
    return "Custom company sites vary too much to embed safely, so we open them in a secure new tab."
  }

  if (reason === "untrusted_target") {
    return "This application target could not be verified as a supported public job board, so it will open externally."
  }

  return "We couldn't prove that this board allows framing, so the application will open externally to avoid a broken in-app experience."
}

function normalizePublicUrl(rawUrl: string) {
  try {
    const parsed = new URL(rawUrl)
    if (parsed.protocol !== "https:") {
      return null
    }

    const host = parsed.hostname.toLowerCase()
    if (
      host === "localhost" ||
      host.endsWith(".localhost") ||
      host.endsWith(".local") ||
      host.startsWith("127.") ||
      host === "0.0.0.0" ||
      host.startsWith("10.") ||
      host.startsWith("192.168.") ||
      host.startsWith("169.254.")
    ) {
      return null
    }

    return parsed
  } catch {
    return null
  }
}

function matchesExpectedHost(source: JobSource, url: URL) {
  const rules = SOURCE_HOST_RULES[source]
  if (!rules.length) {
    return source === "company_site"
  }

  return rules.some((rule) => url.hostname === rule || url.hostname.endsWith(`.${rule}`))
}

async function probeEmbeddability(url: URL): Promise<{ canEmbed: boolean; reason: ApplyIntentResponse["reason"] }> {
  try {
    const response = await fetch(url.toString(), {
      method: "HEAD",
      redirect: "follow",
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; AI Career Guide Apply Probe)",
      },
      cache: "no-store",
    })

    const xFrameOptions = response.headers.get("x-frame-options")?.toLowerCase() || ""
    const csp = response.headers.get("content-security-policy")?.toLowerCase() || ""
    const hasFrameBlock =
      xFrameOptions.includes("deny") ||
      xFrameOptions.includes("sameorigin") ||
      csp.includes("frame-ancestors 'none'") ||
      csp.includes("frame-ancestors 'self'")

    return {
      canEmbed: !hasFrameBlock,
      reason: hasFrameBlock ? "provider_blocks_embedding" : "embed_allowed",
    }
  } catch {
    return { canEmbed: false, reason: "probe_failed" }
  }
}
