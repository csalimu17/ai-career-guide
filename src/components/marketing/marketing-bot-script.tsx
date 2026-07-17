import Script from "next/script";

export function MarketingBotScript() {
  return <Script src="/marketing-bot.js" strategy="lazyOnload" />;
}
