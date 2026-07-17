import type { Metadata } from "next";
import { siteConfig } from "@/lib/site";

type CreateMetadataInput = {
  title: string;
  description: string;
  path?: string;
  canonicalPath?: string;
  image?: string;
  keywords?: string[];
  noIndex?: boolean;
  type?: "website" | "article";
};

export function absoluteUrl(path = "/") {
  return new URL(path, siteConfig.url).toString();
}

function normalizeTitle(title: string) {
  const suffix = `| ${siteConfig.name}`;

  if (title.endsWith(suffix)) {
    return title.slice(0, -suffix.length).trim();
  }

  return title.trim();
}

function compactTitleForSearch(title: string) {
  const maxTitleLength = 75 - ` | ${siteConfig.name}`.length;
  const normalizedTitle = title.trim();

  if (normalizedTitle.length <= maxTitleLength) {
    return normalizedTitle;
  }

  const replacements: Array<[RegExp, string]> = [
    [/\bHow to Handle the ['"]?What are your salary expectations\?['"]? Question\b/gi, "Salary Expectations Interview Question"],
    [/\bHow to Use\b/gi, "Use"],
    [/\bHow to Write\b/gi, "Write"],
    [/\bHow to Build\b/gi, "Build"],
    [/\bHow to Handle\b/gi, "Handle"],
    [/\bfor Your Role\b/gi, "by Role"],
    [/\bAgainst Popular CV Builders\b/gi, "Comparison"],
    [/\bfor UK CV Builders\b/gi, "UK CV Builder"],
    [/\bfor AI CV Building\b/gi, "AI CV Builder"],
    [/\bResume Templates\b/gi, "CV Templates"],
    [/\bJob Application\b/gi, "Application"],
    [/\bProfessionally\b/gi, "Well"],
  ];

  let compacted = normalizedTitle;
  for (const [pattern, replacement] of replacements) {
    compacted = compacted.replace(pattern, replacement).replace(/\s{2,}/g, " ").trim();
    if (compacted.length <= maxTitleLength) {
      return compacted;
    }
  }

  const separators = [": ", " - ", " | "];
  for (const separator of separators) {
    const [first] = compacted.split(separator);
    if (first && first.length >= 28 && first.length <= maxTitleLength) {
      return first;
    }
  }

  const words = compacted.split(/\s+/);
  while (words.join(" ").length > maxTitleLength && words.length > 4) {
    words.pop();
  }

  return words.join(" ");
}

export function createMetadata({
  title,
  description,
  path,
  canonicalPath,
  image = siteConfig.ogImage,
  keywords = [],
  noIndex = false,
  type = "website",
}: CreateMetadataInput): Metadata {
  const normalizedTitle = compactTitleForSearch(normalizeTitle(title));
  const fullTitle = normalizedTitle === siteConfig.name ? siteConfig.name : `${normalizedTitle} | ${siteConfig.name}`;
  const imageUrl = absoluteUrl(image);
  const canonical = canonicalPath ? absoluteUrl(canonicalPath) : path ? absoluteUrl(path) : undefined;
  const metadataKeywords = Array.from(new Set(keywords.map((keyword) => keyword.trim()).filter(Boolean)));

  return {
    title: normalizedTitle,
    description,
    ...(metadataKeywords.length ? { keywords: metadataKeywords } : {}),
    alternates: {
      ...(canonical ? {
        canonical,
        languages: {
          "en-GB": canonical,
          "x-default": canonical,
        },
      } : {}),
      types: {
        "application/rss+xml": absoluteUrl("/feed.xml"),
      },
    },
    robots: noIndex
      ? {
          index: false,
          follow: false,
        }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-image-preview": "large",
            "max-snippet": -1,
            "max-video-preview": -1,
          },
        },
    openGraph: {
      type,
      ...(canonical ? { url: canonical } : {}),
      siteName: siteConfig.name,
      title: fullTitle,
      description,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: fullTitle,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      creator: siteConfig.xHandle,
      title: fullTitle,
      description,
      images: [imageUrl],
    },
  };
}
