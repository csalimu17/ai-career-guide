import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CheckCircle, Award, Target, Wand2, ArrowRight } from "lucide-react";
import { PublicHeader } from "@/components/marketing/public-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { getRoleBySlug, JOB_ROLES_SEO } from "@/lib/seo-roles-data";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { marketingHeaderItems } from "@/lib/marketing-nav";
import { absoluteUrl, createMetadata } from "@/lib/metadata";

export const revalidate = 86400;

export async function generateStaticParams() {
  return JOB_ROLES_SEO.map((role) => ({
    role: role.slug,
  }));
}

export async function generateMetadata({ params }: { params: Promise<{ role: string }> }) {
  const { role } = await params;
  const roleData = getRoleBySlug(role);
  if (!roleData) return {};

  return createMetadata({
    title: `${roleData.title} Resume Keywords & ATS Guide`,
    description: roleData.description,
    path: `/resume-skills/${role}`,
  });
}

export default async function ResumeRoleSkillsPage({ params }: { params: Promise<{ role: string }> }) {
  const { role } = await params;
  const roleData = getRoleBySlug(role);
  if (!roleData) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": `${roleData.title} Resume Keywords & ATS Optimization Guide`,
    "description": roleData.description,
    "url": absoluteUrl(`/resume-skills/${role}`),
    "breadcrumb": {
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": absoluteUrl("/")
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "Resume Skills",
          "item": absoluteUrl("/resume-skills")
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": roleData.title,
          "item": absoluteUrl(`/resume-skills/${role}`)
        }
      ]
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="min-h-screen bg-[#FDFDFC]">
        <PublicHeader items={marketingHeaderItems} ctaHref="/signup" ctaLabel="Start free" />

        <main className="pb-24 pt-10 sm:pt-16">
          <div className="app-shell pb-12">
            <Link href="/resume-skills" className="group flex items-center text-sm font-bold text-muted-foreground hover:text-primary transition-colors">
              <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
              Back to Skills Directory
            </Link>
          </div>

          <article className="app-shell max-w-4xl space-y-12">
            {/* Header */}
            <header className="space-y-6">
              <div className="flex items-center gap-3">
                <Badge className="bg-primary/10 text-primary border-none uppercase tracking-widest px-4 py-1">
                  {roleData.category}
                </Badge>
                <span className="h-1 w-1 rounded-full bg-border" />
                <span className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">ATS Optimizer</span>
              </div>
              <h1 className="font-display text-4xl font-semibold leading-[1.1] tracking-tight sm:text-6xl">
                {roleData.title} Resume Keywords & Action Verbs
              </h1>
              <p className="text-xl leading-relaxed text-muted-foreground">
                Maximize your search weight. Inject these industry-tested hard skills, tools, and descriptive terms into your bullet points.
              </p>
            </header>

            {/* Keyword Matrix */}
            <section className="space-y-6 border-t border-border/40 pt-10">
              <h2 className="font-display text-2xl font-semibold tracking-tight flex items-center gap-2 text-slate-900">
                <Target className="h-5 w-5 text-primary" />
                Target Keywords & Technical Skills
              </h2>
              <p className="text-muted-foreground">
                Incorporate these primary skills throughout your Summary, Core Competencies, and Experience sections to match automated candidate query requirements:
              </p>
              <div className="flex flex-wrap gap-2.5">
                {roleData.keywords.map((kw) => (
                  <Badge key={kw} variant="outline" className="rounded-xl px-4 py-1.5 text-sm bg-white border-border/80 text-slate-800 shadow-sm font-medium">
                    {kw}
                  </Badge>
                ))}
              </div>
            </section>

            {/* Action Verbs */}
            <section className="space-y-6 border-t border-border/40 pt-10">
              <h2 className="font-display text-2xl font-semibold tracking-tight flex items-center gap-2 text-slate-900">
                <CheckCircle className="h-5 w-5 text-primary" />
                High-Impact Action Verbs
              </h2>
              <p className="text-muted-foreground">
                Start your bullet points with strong action verbs to demonstrate leadership and impact instead of passive task descriptions:
              </p>
              <div className="flex flex-wrap gap-2.5">
                {roleData.actionVerbs.map((verb) => (
                  <Badge key={verb} className="rounded-xl px-4 py-1.5 text-sm bg-secondary/10 hover:bg-secondary/20 border-none text-secondary font-bold">
                    {verb}
                  </Badge>
                ))}
              </div>
            </section>

            {/* Certifications */}
            <section className="space-y-6 border-t border-border/40 pt-10">
              <h2 className="font-display text-2xl font-semibold tracking-tight flex items-center gap-2 text-slate-900">
                <Award className="h-5 w-5 text-primary" />
                Recommended Credentials
              </h2>
              <p className="text-muted-foreground">
                Having these industry standard certifications prominently featured helps bypass initial HR filters:
              </p>
              <div className="flex flex-wrap gap-2.5">
                {roleData.certifications.map((cert) => (
                  <Badge key={cert} variant="outline" className="rounded-xl px-4 py-1.5 text-sm bg-slate-50 border-slate-200 text-slate-700 font-medium">
                    {cert}
                  </Badge>
                ))}
              </div>
            </section>

            {/* ATS Advice */}
            <section className="space-y-6 border-t border-border/40 pt-10">
              <h2 className="font-display text-2xl font-semibold tracking-tight text-slate-900">
                Critical Compliance Tip
              </h2>
              <div className="surface-card p-6 border-l-4 border-primary bg-primary/5 rounded-[1.5rem]">
                <p className="text-slate-800 leading-relaxed text-base font-medium">
                  {roleData.atsAdvice}
                </p>
              </div>
            </section>

            {/* Call to Action */}
            <section className="overflow-hidden rounded-[2rem] border-2 border-primary/20 bg-primary/5 p-8 text-center sm:p-12">
              <div className="mx-auto h-16 w-16 mb-6 icon-orb text-primary">
                <Wand2 className="h-6 w-6" />
              </div>
              <h3 className="!mt-0 font-display text-2xl font-bold tracking-tight text-slate-900">
                Build your ATS-friendly resume now
              </h3>
              <p className="text-muted-foreground text-lg mb-8 max-w-md mx-auto">
                Use our dynamic CV builder to format your technical story in minutes, pre-loaded with optimized keywords.
              </p>
              <Button size="lg" className="rounded-2xl px-10" asChild>
                <Link href="/signup">
                  Get Started Free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </section>
          </article>
        </main>

        <SiteFooter />
      </div>
    </>
  );
}
