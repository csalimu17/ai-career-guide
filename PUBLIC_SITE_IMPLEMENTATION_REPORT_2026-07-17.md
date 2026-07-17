# Public website implementation report — 17 July 2026

## Outcome

The public conversion path now leads with one concrete promise and two honest starting actions: **Build My CV Free** and **Upload My CV**. Signup, ATS, template and paid-plan intent use the existing typed allowlist and resume the selected workflow after authentication.

## Routes audited

Live production and local implementations were inspected for the homepage, CV Builder, ATS Checker, CV Templates, Pricing and Signup. Repository inventory also covered Login, password recovery, blog/guides, CV examples, comparison pages, feature landings, Support, Privacy, Terms, onboarding entry and protected route families. Fifteen final visual captures cover five primary routes at 390×844, 768×1024 and 1440×900.

## Conversion and content corrections

- Replaced the abstract, multi-action homepage hero with outcome-led UK CV copy, one primary CTA, one upload CTA and honest “Free plan available” reassurance.
- Removed the five-link hero feature menu, repeated connected-workspace sections and unverified testimonials.
- Removed unsupported “No credit card required”, “Unlimited Everything”, launch/editorial notes and legacy plain-signup CTA destinations.
- Standardised visible canonical CTA destinations to `intent=create-cv`; retained `upload-cv`, `ats-check`, template and plan context.
- Replaced decorative proof with a product-style CV bullet transformation and ATS cue grounded in actual capabilities.

## Design system and shared components

- Introduced restrained marketing tokens for shell widths, section rhythm, typography and skip-link behaviour.
- Reduced glass/glow dependence in the public conversion surface and moved toward opaque editorial panels, fine borders and controlled brand accents.
- Corrected font-token wiring and preserved the established purple/teal/coral identity.
- Standardised the public navigation to Product, CV Builder, ATS Checker, Templates, Pricing and Resources.
- Simplified the footer for mobile and removed unnecessary link density.

## Authentication and activation

- Signup renders immediately while Firebase resolves instead of waiting behind an indefinite auth-loading screen.
- Signup uses UK-facing CV copy, visible eight-character password guidance, correct field association, Terms and Privacy links, autocomplete, disabled submission and loading state.
- The mobile menu now implements explicit dialog semantics, initial focus, focus containment/restoration, Escape and backdrop dismissal, body scroll lock and landscape-safe scrolling.
- The evaluator and a separate 375×667 browser assertion confirmed `aria-expanded` false→true, visible dialog/link, locked scroll, Escape close and restored trigger focus.
- The earlier typed auth-intent repair remains intact for email, Google redirect, login, refresh, templates, ATS and plans.

## Templates and pricing

- Template gallery continues to use lightweight CSS thumbnails; full preview renders only on request, cards expose tier/category/layout, sample contact details are absent from initial body text, and selection survives signup.
- Homepage and Pricing compare Free, Pro and Master as consumer plans using shared exact limits.
- Agency is separated as an organisation support path rather than a fourth equal consumer card.
- Visible UK UI uses CV terminology; custom pricing no longer displays `/month` or an unsupported unlimited promise.

## Accessibility and mobile

- Added skip navigation and consistent landmarks.
- Verified no horizontal overflow on homepage, signup, pricing, templates and ATS at mobile, tablet and desktop widths.
- Core controls retain visible focus and 44px targets; mobile navigation works in portrait and landscape.
- Decorative animation no longer determines whether homepage sections render, addressing the blank full-page capture seen on live production.

## Performance and SEO

- Homepage first-load JavaScript fell from the pre-redesign build’s **191 kB** to **130 kB**.
- Homepage route payload is 3.45 kB in the final build; shared JS remains 102 kB.
- Final build generated 137 static pages. Existing metadata, canonical helpers, sitemap, robots and SEO route families remain.
- The only build warning is the existing Next.js edge-runtime/static-generation warning.

## Ethical analytics

- Added an allowlisted GA helper and shared marketing instrumentation for safe page/CTA/template/pricing/signup-stage signals.
- Properties are restricted to route, placement, intent, plan/template identifiers and other non-sensitive enums.
- CV content, job descriptions, names, emails, filenames, passwords and free-form values are excluded.
- Full event governance is documented in `ANALYTICS_EVENT_MAP.md`.

## Validation

- Independent design evaluation: **PASS** on attempt 3; Design Quality 2/2, Originality 2/2, Craft 2/2, Functionality 2/2.
- Lint: pass.
- Type-check: pass.
- Focused CTA intent regression: pass on mobile and desktop.
- Expanded conversion regression: 15/16 initially; the one failure identified and corrected a legacy CV Builder CTA. The focused rerun passed 2/2 across both projects.
- Visual QA: 15 captures; HTTP 200 and no horizontal overflow on all. Screenshot-time signup caret styling produced a Playwright instrumentation hydration warning; clean screenshot-free navigation confirmed null inline styles and no hydration warning.
- Production build: pass.
- Unit/integration scripts: no separate unit or integration scripts are defined in `package.json`.

## Evidence and screenshots

- Audit: `PUBLIC_SITE_CONVERSION_AUDIT_2026-07-17.md`
- Event map: `ANALYTICS_EVENT_MAP.md`
- Live-before and local-after screenshots: `test-results/design-audit/`
- Playwright HTML report: `playwright-report/index.html`
- Independent evaluations: `%TEMP%/aicg-redesign-brxkqwll.1zk/eval_main_1.md`, `eval_main_2.md`, `eval_main_3.md`

## Main files changed

`src/app/page.tsx`, `src/app/globals.css`, `src/app/pricing/page.tsx`, `src/app/cv-builder/page.tsx`, `src/app/ats-cv-checker/page.tsx`, auth signup/login clients, shared public header/mobile nav/footer, landing/comparison/SEO components, pricing/template cards, marketing navigation, analytics helper/components, `tailwind.config.ts`, typed auth-intent/settings checkout files, and `e2e/conversion-regression.spec.ts`.

## Business decisions still required

- Supply verified testimonial consent/source records before social proof can return.
- Confirm whether Agency belongs in top-level pricing navigation or should have a dedicated organisation page.
- Approve the full analytics event map and GA consent behavior before treating all events as production KPIs.
- Provide staging/emulator test identities and Stripe test credentials for email verification, social OAuth completion, checkout/webhook, and post-signup first-value validation.
- Validate any categorical “ATS-friendly” template claim with an agreed product/legal standard.
