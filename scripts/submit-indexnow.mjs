import { existsSync, readFileSync } from "node:fs";

const SITE_URL = "https://aicareerguide.uk";
const SITE_HOST = new URL(SITE_URL).hostname;
const INDEXNOW_KEY = "aicareerguide-indexnow-20260614";
const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";
const LOCAL_SITEMAP_PATH = ".next/server/app/sitemap.xml.body";

function parseArgs() {
  const args = new Set(process.argv.slice(2));
  return {
    dryRun: args.has("--dry-run"),
    production: args.has("--production"),
  };
}

async function loadSitemapXml({ production }) {
  if (!production && existsSync(LOCAL_SITEMAP_PATH)) {
    return readFileSync(LOCAL_SITEMAP_PATH, "utf8");
  }

  const response = await fetch(`${SITE_URL}/sitemap.xml`, {
    headers: { "User-Agent": "AI Career Guide IndexNow Submitter" },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch production sitemap: ${response.status}`);
  }

  return response.text();
}

function extractUrls(xml) {
  return Array.from(xml.matchAll(/<loc>([^<]+)<\/loc>/g))
    .map((match) => match[1].trim())
    .filter((url) => {
      try {
        return new URL(url).hostname === SITE_HOST;
      } catch {
        return false;
      }
    });
}

function chunk(items, size) {
  const chunks = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

async function submitBatch(urlList) {
  const response = await fetch(INDEXNOW_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({
      host: SITE_HOST,
      key: INDEXNOW_KEY,
      keyLocation: `${SITE_URL}/${INDEXNOW_KEY}.txt`,
      urlList,
    }),
  });

  return {
    ok: response.ok,
    status: response.status,
    body: await response.text(),
  };
}

async function main() {
  const options = parseArgs();
  const sitemapXml = await loadSitemapXml(options);
  const urls = Array.from(new Set(extractUrls(sitemapXml)));

  if (!urls.length) {
    throw new Error("No valid aicareerguide.uk URLs found in sitemap.");
  }

  console.log(`IndexNow ${options.dryRun ? "dry run" : "submission"}: ${urls.length} URLs`);
  console.log(`Source: ${options.production ? "production sitemap" : existsSync(LOCAL_SITEMAP_PATH) ? "local build sitemap" : "production sitemap"}`);

  if (options.dryRun) {
    for (const url of urls.slice(0, 20)) {
      console.log(url);
    }
    if (urls.length > 20) {
      console.log(`...and ${urls.length - 20} more`);
    }
    return;
  }

  const batches = chunk(urls, 10000);
  for (const [index, urlList] of batches.entries()) {
    const result = await submitBatch(urlList);
    console.log(`Batch ${index + 1}/${batches.length}: status=${result.status} ok=${result.ok}`);
    if (!result.ok) {
      console.error(result.body);
      process.exitCode = 1;
      return;
    }
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
