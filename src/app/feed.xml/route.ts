import { NextResponse } from "next/server";
import { BLOG_POSTS } from "@/lib/blog-data";
import { CV_EXAMPLE_PAGES } from "@/lib/cv-example-pages";
import { GUIDE_POSTS } from "@/lib/guide-data";
import { siteConfig } from "@/lib/site";
import { absoluteUrl } from "@/lib/metadata";

export const revalidate = 1200;

type FeedItem = {
  title: string;
  path: string;
  description: string;
  category: string;
  date: string;
  author?: string;
};

function cdata(value: string) {
  return `<![CDATA[${value.replaceAll("]]>", "]]]]><![CDATA[>")}]]>`;
}

export async function GET() {
  const contentItems: FeedItem[] = [
    ...BLOG_POSTS.map((post) => ({
      title: post.title,
      path: `/blog/${post.slug}`,
      description: post.excerpt,
      category: post.category,
      date: post.updatedAt || post.publishedAt,
      author: post.author.name,
    })),
    ...GUIDE_POSTS.map((guide) => ({
      title: guide.title,
      path: `/guides/${guide.slug}`,
      description: guide.excerpt,
      category: guide.category,
      date: guide.updatedAt || guide.publishedAt,
      author: siteConfig.name,
    })),
    ...CV_EXAMPLE_PAGES.map((page) => ({
      title: `${page.role} CV Example UK`,
      path: `/cv-examples/${page.slug}`,
      description: page.description,
      category: "UK CV Examples",
      date: "2026-06-14",
      author: siteConfig.name,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const feedItemsXml = contentItems.map((item) => {
    const pubDate = new Date(item.date).toUTCString();
    const link = absoluteUrl(item.path);

    return `
    <item>
      <title>${cdata(item.title)}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <pubDate>${pubDate}</pubDate>
      <category>${cdata(item.category)}</category>
      <description>${cdata(item.description)}</description>
      <author>${cdata(item.author || siteConfig.name)}</author>
    </item>`;
  }).join("");

  const rssXml = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>${cdata(`${siteConfig.name} Career Content`)}</title>
  <link>${siteConfig.url}</link>
  <description>${cdata("UK CV examples, career guides, ATS advice, AI hiring analysis, cover letters, interview prep, job tracking, and modern job search strategy.")}</description>
  <language>en-GB</language>
  <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
  <atom:link href="${absoluteUrl("/feed.xml")}" rel="self" type="application/rss+xml" />
  ${feedItemsXml}
</channel>
</rss>`;

  return new NextResponse(rssXml.trim(), {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=1200, stale-while-revalidate=600",
    },
  });
}
