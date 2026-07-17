import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/*?_rsc=*",
          "/*?*&_rsc=*",
          "/admin",
          "/agency",
          "/dashboard",
          "/editor",
          "/cv-editor",
          "/settings",
          "/tracker",
          "/ats",
          "/chat",
          "/cover-letters",
          "/onboarding",
          "/print",
          "/api",
          "/qa",
          "/resumes",
          "/jobs",
          "/interview-prep",
        ],
      },
    ],
    sitemap: `${siteConfig.url}/sitemap.xml`,
    host: siteConfig.url,
  };
}
