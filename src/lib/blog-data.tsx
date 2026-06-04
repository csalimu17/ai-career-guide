import { absoluteUrl } from "./metadata";

export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  category: "Resume Tips" | "Career Advice" | "AI Intelligence" | "Interview Prep";
  publishedAt: string;
  readingTime: string;
  mainImage: string;
  author: {
    name: string;
    role: string;
    image: string;
  };
  content: string; // Markdown or HTML string
}

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "top-resume-formats-for-2026",
    title: "Top Resume Formats for 2026: Which One Should You Choose?",
    excerpt: "The hiring landscape is changing. Learn which resume formats are winning in 2026 and how to choose the right one for your career level.",
    category: "Resume Tips",
    publishedAt: "April 18, 2026",
    readingTime: "8 min read",
    mainImage: "/blog_hero_modern_career_1776685806536.png",
    author: {
      name: "Paul Drury",
      role: "Career Expert",
      image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Paul",
    },
    content: "Content for resume formats guide...",
  },
  {
    slug: "how-to-optimize-your-resume-for-ai",
    title: "How to Optimize Your Resume for AI Filtering in 2026",
    excerpt: "Over 90% of Fortune 500 companies use AI to screen resumes. Here is how you can stay ahead of the algorithm and get more interviews.",
    category: "AI Intelligence",
    publishedAt: "April 15, 2026",
    readingTime: "12 min read",
    mainImage: "/ai_resume_optimization_visual_1776685824488.png",
    author: {
      name: "Sarah Chen",
      role: "AI Ethics Specialist",
      image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
    },
    content: "Content for AI optimization...",
  },
  {
    slug: "10-essential-skills-project-manager-resume",
    title: "10 Essential Skills for a Modern Project Manager Resume",
    excerpt: "What skills are recruiters actually looking for in 2026? We analyzed 5,000+ job descriptions to find the most in-demand PM skills.",
    category: "Career Advice",
    publishedAt: "April 12, 2026",
    readingTime: "6 min read",
    mainImage: "/blog_hero_modern_career_1776685806536.png",
    author: {
      name: "Marcus Thorne",
      role: "Project Management Consultant",
      image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus",
    },
    content: "Content for PM skills article...",
  },
];

export function getPostBySlug(slug: string) {
  return BLOG_POSTS.find((post) => post.slug === slug);
}
