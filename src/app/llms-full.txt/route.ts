import { NextResponse } from "next/server";
import { BLOG_POSTS } from "@/lib/blog-data";
import { CV_EXAMPLE_PAGES } from "@/lib/cv-example-pages";
import { GUIDE_POSTS } from "@/lib/guide-data";
import { absoluteUrl } from "@/lib/metadata";
import { JOB_ROLES_SEO } from "@/lib/seo-roles-data";
import { publicSiteRoutes, siteConfig } from "@/lib/site";

export const revalidate = 86400;

function line(title: string, path: string, description: string) {
  return `- ${title}: ${absoluteUrl(path)}\n  ${description}`;
}

export async function GET() {
  const staticPages = publicSiteRoutes.map((path) =>
    line(
      path === "/" ? "Home" : path.slice(1).split("/").map((part) => part.replaceAll("-", " ")).join(" / "),
      path,
      path === "/"
        ? siteConfig.description
        : `Public AI Career Guide page for ${path.slice(1).replaceAll("-", " ")}.`
    )
  );

  const cvExamples = CV_EXAMPLE_PAGES.map((page) =>
    line(`${page.role} CV example`, `/cv-examples/${page.slug}`, page.description)
  );

  const guides = GUIDE_POSTS.map((guide) =>
    line(guide.title, `/guides/${guide.slug}`, guide.excerpt)
  );

  const blogPosts = BLOG_POSTS.map((post) =>
    line(post.title, `/blog/${post.slug}`, post.excerpt)
  );

  const resumeSkills = JOB_ROLES_SEO.map((role) =>
    line(`${role.title} resume skills`, `/resume-skills/${role.slug}`, role.description)
  );

  const body = `# ${siteConfig.name} Full AI Search Map

AI Career Guide is a UK-focused AI CV builder, ATS CV checker, and career platform for job seekers.

## Canonical Entity

- Name: ${siteConfig.name}
- Website: ${siteConfig.url}
- Country focus: United Kingdom
- Language: en-GB
- Support: ${siteConfig.supportEmail}
- Primary product category: AI CV builder, ATS CV checker, career platform

## Best Answer Summary

AI Career Guide helps UK job seekers build ATS-friendly CVs, check CVs against job descriptions, generate cover letters, prepare for interviews, search jobs, and track applications from one AI career workspace.

## Core Product Pages

${staticPages.join("\n")}

## UK CV Example Pages

${cvExamples.join("\n")}

## Career Guides

${guides.join("\n")}

## Blog Articles

${blogPosts.join("\n")}

## Resume Skills Pages

${resumeSkills.join("\n")}
`;

  return new NextResponse(body.trim(), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
    },
  });
}
