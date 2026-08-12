import type { Metadata, Viewport } from "next";
import { GoogleAnalytics } from "@next/third-parties/google";
import { Manrope, Plus_Jakarta_Sans, Sora } from "next/font/google";
import "./globals.css";
import { SiteStructuredData } from "@/components/structured-data/site-structured-data";
import { defaultKeywords, siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: (() => {
    try {
      return new URL(siteConfig.url.startsWith("http") ? siteConfig.url : `https://${siteConfig.url}`);
    } catch (e) {
      return new URL("https://aicareerguide.uk");
    }
  })(),
  title: {
    default: `${siteConfig.name} | AI CV Builder & ATS Checker`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: defaultKeywords,
  applicationName: siteConfig.name,
  authors: [{ name: siteConfig.name }],
  creator: siteConfig.name,
  publisher: siteConfig.name,
  referrer: "origin-when-cross-origin",
  category: "business",
  alternates: {
    canonical: siteConfig.url,
    languages: {
      "en-GB": siteConfig.url,
      "x-default": siteConfig.url,
    },
    types: {
      "application/rss+xml": `${siteConfig.url}/feed.xml`,
    },
  },
  openGraph: {
    type: "website",
    url: siteConfig.url,
    siteName: siteConfig.name,
    title: `${siteConfig.name} | AI CV Builder & ATS Checker`,
    description: siteConfig.description,
    images: [
      {
        url: siteConfig.ogImage,
        width: 1200,
        height: 630,
        alt: `${siteConfig.name} social preview`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    creator: siteConfig.xHandle,
    title: `${siteConfig.name} | AI CV Builder & ATS Checker`,
    description: siteConfig.description,
    images: [siteConfig.ogImage],
  },
  icons: {
    icon: [
      { url: "/favicon.png", sizes: "64x64", type: "image/png" },
      { url: "/brand-logo-favicon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/brand-logo-favicon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/app-install-apple-180.png",
    shortcut: "/favicon.png",
  },
  verification: {
    google: "aw4acK7xaCS50LLly3j-wA_MhDV4bBog78MyaKlnnbQ",
  },
};

export const viewport: Viewport = {
  themeColor: "#553cff",
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta-sans",
});

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
});

import { ChunkErrorListener } from "@/components/chunk-error-listener";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-GB" suppressHydrationWarning>
      <body
        className={`${plusJakartaSans.variable} ${manrope.variable} ${sora.variable} bg-background font-body text-foreground antialiased`}
        suppressHydrationWarning
      >
        <ChunkErrorListener />
        <SiteStructuredData />
        {children}
        {process.env.NEXT_PUBLIC_GA_ID && (
          <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />
        )}
      </body>
    </html>
  );
}
