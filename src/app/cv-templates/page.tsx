import CvTemplatesPageClient from "@/components/marketing/cv-templates-page-client";
import { createMetadata, absoluteUrl } from "@/lib/metadata";
import { TEMPLATES } from "@/lib/templates-config";

export const metadata = createMetadata({
  title: "ATS-Friendly CV Templates",
  description:
    "Browse ATS-friendly CV templates, compare layouts, and choose a professional format you can use inside the AI Career Guide builder.",
  path: "/cv-templates",
  keywords: [
    "CV templates",
    "ATS friendly CV templates",
    "free CV templates",
    "professional CV templates",
    "resume templates",
  ],
});

export const revalidate = 86400;

export default function CvTemplatesPage() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "ATS-Friendly CV Templates | AI Career Guide",
    description: "Browse ATS-friendly CV templates, compare layouts, and choose a professional format.",
    url: absoluteUrl("/cv-templates"),
    mainEntity: {
      "@type": "ItemList",
      itemListElement: TEMPLATES.map((tmpl, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: tmpl.name,
        description: tmpl.description,
        image: absoluteUrl(tmpl.preview),
        url: absoluteUrl(`/cv-templates?template=${tmpl.id}`),
      })),
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <CvTemplatesPageClient />
    </>
  );
}
