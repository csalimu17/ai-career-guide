import { absoluteUrl } from "@/lib/metadata";
import { siteConfig } from "@/lib/site";

export function SiteStructuredData() {
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${siteConfig.url}/#organization`,
        name: siteConfig.name,
        legalName: siteConfig.name,
        url: siteConfig.url,
        logo: {
          "@type": "ImageObject",
          url: absoluteUrl(siteConfig.searchLogo),
          width: 512,
          height: 512,
        },
        contactPoint: {
          "@type": "ContactPoint",
          email: siteConfig.supportEmail,
          contactType: "customer support",
          areaServed: "GB",
          availableLanguage: ["en-GB"],
        },
        knowsAbout: [
          "AI CV builder",
          "UK CV writing",
          "ATS CV checking",
          "cover letters",
          "job search",
          "interview preparation",
          "career planning",
        ],
      },
      {
        "@type": "WebSite",
        "@id": `${siteConfig.url}/#website`,
        name: siteConfig.name,
        alternateName: siteConfig.shortName,
        url: siteConfig.url,
        inLanguage: "en-GB",
        publisher: {
          "@id": `${siteConfig.url}/#organization`,
        },
        about: {
          "@id": `${siteConfig.url}/#software`,
        },
      },
      {
        "@type": "SoftwareApplication",
        "@id": `${siteConfig.url}/#software`,
        name: siteConfig.name,
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        url: siteConfig.url,
        image: absoluteUrl(siteConfig.ogImage),
        description: siteConfig.description,
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "GBP",
          url: absoluteUrl("/pricing"),
          availability: "https://schema.org/InStock",
        },
        featureList: [
          "AI CV builder",
          "ATS CV checker",
          "CV templates",
          "Cover letter generator",
          "AI interview preparation",
          "Job search and application tracking",
        ],
        publisher: {
          "@id": `${siteConfig.url}/#organization`,
        },
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}
