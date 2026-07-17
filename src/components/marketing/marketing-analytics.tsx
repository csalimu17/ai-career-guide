'use client';
import { useEffect } from "react";
import { trackMarketingEvent } from "@/lib/marketing-analytics";
export function MarketingAnalytics() {
  useEffect(() => { const click = (event: MouseEvent) => { const link = (event.target as Element).closest<HTMLAnchorElement>("a[href]"); if (!link) return; const url = new URL(link.href, location.origin); if (url.origin !== location.origin) return; const label=(link.textContent||"").trim().replace(/\s+/g," ").slice(0,80); const locationName=link.closest("header")?"header":link.closest("footer")?"footer":"content";
      if(url.pathname==="/signup") trackMarketingEvent("public_cta_click",{cta:label,location:locationName,intent:url.searchParams.get("intent")||undefined,plan:url.searchParams.get("plan")||undefined,template:url.searchParams.get("template")||undefined});
      if(url.searchParams.has("template")) trackMarketingEvent("template_select",{template:url.searchParams.get("template")||undefined,location:locationName});
      if(url.searchParams.has("plan")) trackMarketingEvent("pricing_select",{plan:url.searchParams.get("plan")||undefined,location:locationName});
    }; document.addEventListener("click",click); return()=>document.removeEventListener("click",click); },[]); return null;
}
