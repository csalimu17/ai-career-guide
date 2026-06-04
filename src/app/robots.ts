import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/cv-builder", "/ats-cv-checker", "/pricing", "/support", "/privacy", "/terms"],
        disallow: [
          "/admin",
          "/dashboard",
          "/editor",
          "/cv-editor",
          "/settings",
          "/tracker",
          "/ats",
          "/chat",
          "/cover-letters",
          "/onboarding",
          "/login",
          "/signup",
          "/forgot-password",
          "/api",
        ],
      },
    ],
    sitemap: `${siteConfig.url}/sitemap.xml`,
    host: siteConfig.url,
  };
}
