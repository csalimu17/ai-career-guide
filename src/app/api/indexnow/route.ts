import { NextResponse } from "next/server";
import { siteConfig } from "@/lib/site";

const INDEXNOW_KEY = "aicareerguide-indexnow-20260614";
const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";

function toUrlList(input: unknown) {
  if (!input || typeof input !== "object") return [];

  const body = input as { url?: unknown; urls?: unknown; urlList?: unknown };
  const candidates = Array.isArray(body.urlList)
    ? body.urlList
    : Array.isArray(body.urls)
      ? body.urls
      : typeof body.url === "string"
        ? [body.url]
        : [];

  const siteHost = new URL(siteConfig.url).hostname;

  return candidates
    .filter((value): value is string => typeof value === "string")
    .map((value) => {
      try {
        return new URL(value, siteConfig.url);
      } catch {
        return null;
      }
    })
    .filter((url): url is URL => url !== null && url.hostname === siteHost)
    .map((url) => url.toString());
}

export async function GET() {
  return NextResponse.json({
    endpoint: "/api/indexnow",
    keyLocation: `${siteConfig.url}/${INDEXNOW_KEY}.txt`,
    usage: {
      method: "POST",
      body: { urls: [`${siteConfig.url}/cv-builder`] },
    },
  });
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Expected a JSON body." }, { status: 400 });
  }

  const urlList = Array.from(new Set(toUrlList(body))).slice(0, 10000);

  if (!urlList.length) {
    return NextResponse.json(
      { error: "Provide at least one URL on aicareerguide.uk in url, urls, or urlList." },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(INDEXNOW_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        host: new URL(siteConfig.url).hostname,
        key: INDEXNOW_KEY,
        keyLocation: `${siteConfig.url}/${INDEXNOW_KEY}.txt`,
        urlList,
      }),
    });

    return NextResponse.json(
      {
        submitted: urlList,
        indexNowStatus: response.status,
        ok: response.ok,
      },
      { status: response.ok ? 200 : 502 }
    );
  } catch (netErr: any) {
    console.error("[IndexNow] External API error:", netErr);
    return NextResponse.json(
      {
        submitted: urlList,
        ok: false,
        error: "IndexNow service unreachable",
      },
      { status: 502 }
    );
  }
}
