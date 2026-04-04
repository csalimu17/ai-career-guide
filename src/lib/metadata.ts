import type { Metadata } from "next";
import { defaultKeywords, siteConfig } from "@/lib/site";

type CreateMetadataInput = {
  title: string;
  description: string;
  path?: string;
  image?: string;
  keywords?: string[];
  noIndex?: boolean;
  type?: "website" | "article";
};

export function absoluteUrl(path = "/") {
  return new URL(path, siteConfig.url).toString();
}

export function createMetadata({
  title,
  description,
  path,
  image = siteConfig.ogImage,
  keywords = [],
  noIndex = false,
  type = "website",
}: CreateMetadataInput): Metadata {
  const fullTitle = title === siteConfig.name ? siteConfig.name : `${title} | ${siteConfig.name}`;
  const imageUrl = absoluteUrl(image);
  const canonical = path ? absoluteUrl(path) : undefined;

  return {
    title,
    description,
    keywords: [...defaultKeywords, ...keywords],
    ...(canonical
      ? {
          alternates: {
            canonical,
          },
        }
      : {}),
    robots: noIndex
      ? {
          index: false,
          follow: false,
        }
      : {
          index: true,
          follow: true,
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
