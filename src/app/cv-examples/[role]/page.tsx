import { notFound } from "next/navigation";
import { SeoLandingPage } from "@/components/marketing/seo-landing-page";
import { createMetadata } from "@/lib/metadata";
import { CV_EXAMPLE_PAGES, getCvExamplePage } from "@/lib/cv-example-pages";

type Props = {
  params: Promise<{ role: string }>;
};

export const revalidate = 86400;

export function generateStaticParams() {
  return CV_EXAMPLE_PAGES.map((page) => ({ role: page.slug }));
}

export async function generateMetadata({ params }: Props) {
  const { role } = await params;
  const page = getCvExamplePage(role);

  if (!page) {
    return {};
  }

  return createMetadata({
    title: `${page.role} CV Example UK`,
    description: page.description,
    path: `/cv-examples/${page.slug}`,
    keywords: page.keywords,
  });
}

export default async function CvExampleRolePage({ params }: Props) {
  const { role } = await params;
  const page = getCvExamplePage(role);

  if (!page) {
    notFound();
  }

  return (
    <SeoLandingPage
      path={`/cv-examples/${page.slug}`}
      eyebrow={`${page.role} CV Example`}
      title={page.title}
      description={page.description}
      proof={page.proof}
      primaryCtaLabel="Build this CV"
      secondaryCtaLabel="Check ATS match"
      secondaryCtaHref="/ats-cv-checker"
      sections={[
        {
          title: "Use this profile as your starting point",
          body: page.profile,
          bullets: ["Adapt it to the target job", "Keep the opening specific", "Avoid generic personal qualities without evidence"],
        },
        ...page.sections,
      ]}
      examples={page.examples}
      relatedLinks={CV_EXAMPLE_PAGES.filter((relatedPage) => relatedPage.slug !== page.slug)
        .slice(0, 3)
        .map((relatedPage) => ({
          label: `${relatedPage.role} CV example`,
          href: `/cv-examples/${relatedPage.slug}`,
          description: relatedPage.description,
        }))}
      faqs={page.faqs}
    />
  );
}
