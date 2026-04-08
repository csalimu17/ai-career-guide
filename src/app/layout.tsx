import type { Metadata, Viewport } from "next";
import { Inter, Manrope, Merriweather, Montserrat, Playfair_Display, Plus_Jakarta_Sans, Roboto, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { FirebaseClientProvider } from "@/firebase/client-provider";
import { ImpersonationBanner } from "@/components/admin/impersonation-banner";
import { Toaster } from "@/components/ui/toaster";
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
    default: `${siteConfig.name} | AI Resume Builder, ATS Optimizer & Career Workspace`,
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
  openGraph: {
    type: "website",
    url: siteConfig.url,
    siteName: siteConfig.name,
    title: `${siteConfig.name} | AI Resume Builder, ATS Optimizer & Career Workspace`,
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
    title: `${siteConfig.name} | AI Resume Builder, ATS Optimizer & Career Workspace`,
    description: siteConfig.description,
    images: [siteConfig.ogImage],
  },
  icons: {
    shortcut: [{ url: "/icon", type: "image/png", sizes: "32x32" }],
    icon: [
      { url: "/icon", type: "image/png", sizes: "32x32" },
      { url: "/icon", type: "image/png", sizes: "192x192" },
    ],
    apple: [{ url: "/apple-icon", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#6558f5",
  colorScheme: "light",
};

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta-sans",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-roboto",
});

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
});

const merriweather = Merriweather({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-merriweather",
});

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair-display",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${plusJakartaSans.variable} ${manrope.variable} ${inter.variable} ${roboto.variable} ${montserrat.variable} ${merriweather.variable} ${playfairDisplay.variable} ${spaceGrotesk.variable} bg-background font-body text-foreground antialiased`}
        suppressHydrationWarning
      >
        <FirebaseClientProvider>
          <ImpersonationBanner />
          {children}
          <Toaster />
          <script src="/marketing-bot.js" defer></script>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
