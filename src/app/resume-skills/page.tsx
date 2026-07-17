import Link from "next/link";
import { ChevronRight, Target, Briefcase, Database, Settings, Megaphone, Coins, Users, Award } from "lucide-react";
import { PublicHeader } from "@/components/marketing/public-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { JOB_ROLES_SEO } from "@/lib/seo-roles-data";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { marketingHeaderItems } from "@/lib/marketing-nav";
import { createMetadata } from "@/lib/metadata";

export const metadata = createMetadata({
  title: "ATS Resume Skills & Keywords Guide",
  description: "Browse essential ATS-friendly keywords, professional action verbs, and optimization tips for top career roles.",
  path: "/resume-skills",
});

export const revalidate = 86400;

const categoryIcons: Record<string, any> = {
  Technology: Database,
  Management: Settings,
  "Data Science": Target,
  Marketing: Megaphone,
  Finance: Coins,
  Sales: Briefcase,
  "Human Resources": Users,
};

export default function ResumeSkillsPage() {
  return (
    <div className="min-h-screen bg-[#FDFDFC]">
      <PublicHeader items={marketingHeaderItems} ctaHref="/signup" ctaLabel="Start free" />

      <main className="pb-24 pt-12 sm:pt-20">
        <div className="app-shell space-y-12 sm:space-y-16">
          {/* Header */}
          <section className="space-y-6 text-center max-w-4xl mx-auto">
            <Badge variant="secondary" className="px-4 py-1.5 text-sm uppercase tracking-widest bg-primary/10 text-primary border-none">
              Resume Optimizer Library
            </Badge>
            <h1 className="font-display text-4xl font-semibold leading-[0.95] tracking-tight sm:text-6xl lg:text-7xl">
              ATS Keywords & <span className="headline-gradient-vivid">Skills Directory</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Select your job role to find target resume keywords, compliance checklists, and high-impact action verbs to pass automated recruiters.
            </p>
          </section>

          {/* Grid Layout */}
          <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {JOB_ROLES_SEO.map((role) => {
              const IconComponent = categoryIcons[role.category] || Briefcase;
              return (
                <Link
                  key={role.slug}
                  href={`/resume-skills/${role.slug}`}
                  className="group relative flex flex-col justify-between overflow-hidden rounded-[2rem] border border-border/70 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-md hover:border-primary/30"
                >
                  <div className="space-y-4">
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/5 text-primary group-hover:bg-primary group-hover:text-white transition-all duration-300">
                      <IconComponent className="h-5 w-5" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="font-display text-xl font-bold text-slate-900 group-hover:text-primary transition-colors">
                        {role.title}
                      </h3>
                      <p className="text-sm leading-relaxed text-muted-foreground line-clamp-3">
                        {role.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-6 text-sm font-bold text-primary opacity-80 group-hover:opacity-100 transition-opacity">
                    View keywords
                    <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </Link>
              );
            })}
          </section>

          {/* Prompt CTA */}
          <section className="relative overflow-hidden rounded-[3rem] p-8 sm:p-16 brand-gradient-bg text-white shadow-2xl">
            <div className="relative z-10 max-w-3xl space-y-6">
              <Badge variant="outline" className="border-white/30 text-white hover:bg-white/10 uppercase tracking-widest">
                AI Career Coach
              </Badge>
              <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-5xl">
                Ready to instantly grade your resume?
              </h2>
              <p className="text-lg text-white/80 max-w-xl">
                Upload your CV to our AI-powered analyzer to see your ATS compatibility rate against any target job description.
              </p>
              <div className="pt-4">
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center rounded-2xl bg-white px-8 py-3.5 text-sm font-bold text-primary hover:bg-white/95 transition-all shadow-md"
                >
                  Analyze Resume Now
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Link>
              </div>
            </div>
          </section>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
