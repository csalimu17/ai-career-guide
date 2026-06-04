import { siteConfig } from "@/lib/site";

function normalizeOrigin(candidate: string | null | undefined): string | null {
  if (!candidate) return null;

  const trimmed = candidate.trim();
  if (!trimmed) return null;

  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  try {
    const url = new URL(withProtocol);
    return url.origin.replace(/\/$/, "");
  } catch {
    return null;
  }
}

export function getAppOrigin(req?: Request): string {
  return (
    normalizeOrigin(process.env.NEXT_PUBLIC_APP_URL) ||
    normalizeOrigin(process.env.APP_URL) ||
    normalizeOrigin(req ? new URL(req.url).origin : null) ||
    normalizeOrigin(siteConfig.url) ||
    "http://localhost:3000"
  );
}
