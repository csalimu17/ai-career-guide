import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/metadata";
import { publicSiteRoutes } from "@/lib/site";
import { BLOG_POSTS } from "@/lib/blog-data";
import { GUIDE_POSTS } from "@/lib/guide-data";
import { JOB_ROLES_SEO } from "@/lib/seo-roles-data";
import { CV_EXAMPLE_PAGES } from "@/lib/cv-example-pages";

const STATIC_ROUTE_PRIORITY: Record<string, number> = {
  "/": 1,
  "/cv-builder": 0.98,
  "/free-cv-builder": 0.95,
  "/ats-cv-checker": 0.96,
  "/cv-templates": 0.9,
  "/cv-examples": 0.86,
  "/uk-cv-format": 0.86,
  "/graduate-cv-template": 0.84,
  "/cover-letter-examples": 0.84,
  "/cv-personal-statement-examples": 0.84,
  "/career-change-cv": 0.84,
  "/nhs-cv-template": 0.82,
  "/finance-cv-template": 0.82,
  "/tech-cv-template": 0.82,
  "/compare": 0.82,
  "/compare/zety-alternative": 0.78,
  "/compare/resume-io-alternative": 0.78,
  "/compare/rezi-alternative": 0.78,
  "/compare/kickresume-alternative": 0.78,
  "/compare/novoresume-alternative": 0.78,
  "/compare/enhancv-alternative": 0.78,
  "/ai-career-assistant": 0.88,
  "/job-search": 0.86,
  "/ai-interview-prep": 0.84,
  "/cover-letter-generator": 0.84,
  "/pricing": 0.85,
  "/support": 0.7,
};

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticUrls = publicSiteRoutes.map((path) => ({
    url: absoluteUrl(path),
    lastModified: now,
    changeFrequency: (path === "/" ? "weekly" : "monthly") as "weekly" | "monthly",
    priority: STATIC_ROUTE_PRIORITY[path] ?? 0.6,
  }));

  const blogIndexUrl = {
    url: absoluteUrl("/blog"),
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  };

  const blogPostUrls = BLOG_POSTS.map((post) => ({
    url: absoluteUrl(`/blog/${post.slug}`),
    lastModified: new Date(post.updatedAt || post.publishedAt),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  const guideIndexUrl = {
    url: absoluteUrl("/guides"),
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.82,
  };

  const guidePostUrls = GUIDE_POSTS.map((guide) => ({
    url: absoluteUrl(`/guides/${guide.slug}`),
    lastModified: new Date(guide.publishedAt),
    changeFrequency: "monthly" as const,
    priority: 0.74,
  }));

  const cvExampleUrls = CV_EXAMPLE_PAGES.map((page) => ({
    url: absoluteUrl(`/cv-examples/${page.slug}`),
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.76,
  }));

  const seoRolesIndexUrl = {
    url: absoluteUrl("/resume-skills"),
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  };

  const seoRolesUrls = JOB_ROLES_SEO.map((role) => ({
    url: absoluteUrl(`/resume-skills/${role.slug}`),
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [
    ...staticUrls,
    ...cvExampleUrls,
    blogIndexUrl,
    ...blogPostUrls,
    guideIndexUrl,
    ...guidePostUrls,
    seoRolesIndexUrl,
    ...seoRolesUrls,
  ];
}
