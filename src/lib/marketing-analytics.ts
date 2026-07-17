'use client';

const allowedEvents = new Set(["public_cta_click", "template_select", "pricing_select", "signup_start"]);
const allowedProperties = new Set(["cta", "location", "intent", "template", "plan", "method"]);
type Properties = Record<string, string | undefined>;

export function trackMarketingEvent(event: string, properties: Properties = {}) {
  if (!allowedEvents.has(event) || typeof window === "undefined") return;
  const safe = Object.fromEntries(Object.entries(properties).filter(([key, value]) => allowedProperties.has(key) && typeof value === "string").map(([key, value]) => [key, value!.slice(0, 80)]));
  const gtag = (window as Window & { gtag?: (...args: unknown[]) => void }).gtag;
  gtag?.("event", event, safe);
}
