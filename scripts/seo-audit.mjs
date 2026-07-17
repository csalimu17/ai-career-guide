import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const BUILD_APP_DIR = ".next/server/app";
const SITEMAP_PATH = join(BUILD_APP_DIR, "sitemap.xml.body");
const SITE_ORIGIN = "https://aicareerguide.uk";

const ignoredPaths = new Set([
  "/feed.xml",
  "/robots.txt",
  "/sitemap.xml",
  "/llms-full.txt",
]);

function read(path) {
  return readFileSync(path, "utf8");
}

function extractUrls(xml) {
  return Array.from(xml.matchAll(/<loc>([^<]+)<\/loc>/g)).map((match) => match[1].trim());
}

function htmlPathForUrl(url) {
  const { pathname } = new URL(url);
  if (ignoredPaths.has(pathname)) return null;
  if (pathname === "/") return join(BUILD_APP_DIR, "index.html");
  return join(BUILD_APP_DIR, `${pathname.slice(1)}.html`);
}

function count(pattern, input) {
  return Array.from(input.matchAll(pattern)).length;
}

function titleFor(html) {
  return html.match(/<title>(.*?)<\/title>/s)?.[1]?.trim() ?? "";
}

function descriptionFor(html) {
  return html.match(/<meta name="description" content="([^"]*)"/)?.[1]?.trim() ?? "";
}

function normalizeUrl(url) {
  return url.endsWith("/") ? url.slice(0, -1) : url;
}

function hasCanonicalFor(html, url) {
  const canonical = html.match(/rel="canonical" href="([^"]+)"/)?.[1]?.trim();
  return Boolean(canonical) && normalizeUrl(canonical) === normalizeUrl(url);
}

function auditPage(url) {
  const filePath = htmlPathForUrl(url);
  if (!filePath) return [];

  const issues = [];
  if (!existsSync(filePath)) {
    return { issues: [`missing generated HTML: ${filePath}`], warnings: [] };
  }

  const html = read(filePath);
  const title = titleFor(html);
  const description = descriptionFor(html);
  const h1Count = count(/<h1\b/g, html);
  const jsonLdCount = count(/application\/ld\+json/g, html);
  const warnings = [];

  if (!title) issues.push("missing <title>");
  if (title.length > 75) warnings.push(`title is long (${title.length} chars)`);
  if (!description) issues.push("missing meta description");
  if (description.length > 170) warnings.push(`description is long (${description.length} chars)`);
  if (!hasCanonicalFor(html, url)) issues.push("missing matching canonical");
  if (h1Count !== 1) issues.push(`expected exactly 1 h1, found ${h1Count}`);
  if (jsonLdCount < 1) issues.push("missing JSON-LD");
  if (html.includes('name="robots" content="noindex')) issues.push("contains noindex");

  return { issues, warnings };
}

function main() {
  if (!existsSync(SITEMAP_PATH)) {
    throw new Error("Build sitemap not found. Run npm run build before npm run seo:audit.");
  }

  const urls = extractUrls(read(SITEMAP_PATH)).filter((url) => url.startsWith(SITE_ORIGIN));
  const uniqueUrls = Array.from(new Set(urls));
  const failures = [];
  const warnings = [];

  for (const url of uniqueUrls) {
    const result = auditPage(url);
    const { issues, warnings: pageWarnings } = result;
    if (issues.length) {
      failures.push({ url, issues });
    }
    if (pageWarnings.length) {
      warnings.push({ url, warnings: pageWarnings });
    }
  }

  console.log(`SEO audit checked ${uniqueUrls.length} sitemap URLs.`);
  if (warnings.length) {
    console.warn(`SEO audit warnings: ${warnings.length} URL${warnings.length === 1 ? "" : "s"} with non-blocking metadata length notes.`);
  }

  if (failures.length) {
    for (const failure of failures) {
      console.error(`\n${failure.url}`);
      for (const issue of failure.issues) {
        console.error(`  - ${issue}`);
      }
    }
    throw new Error(`SEO audit failed for ${failures.length} URL${failures.length === 1 ? "" : "s"}.`);
  }

  console.log("SEO audit passed.");
}

main();
