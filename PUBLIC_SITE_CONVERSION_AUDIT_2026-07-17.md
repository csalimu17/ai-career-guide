# Public website conversion audit — 17 July 2026

## Evidence base

Live production and the local Next.js repository were inspected before implementation. Live screenshots are in `test-results/design-audit/`. Production currently differs from the local repair branch, so findings distinguish live evidence from local code.

| Severity | Route / component | Reproducible evidence | User and conversion impact | Recommended correction |
| --- | --- | --- | --- | --- |
| High | Live homepage | Hero says “Design a sharper career system” and presents primary, pricing, builder, ATS, templates, assistant and guide links together. See `live-home-desktop.png`. | A first-time job seeker must decode the product and choose among competing actions before understanding the free path. | Lead with the concrete CV outcome, one primary CTA and one upload CTA; move discovery into the narrative. |
| High | Live homepage / `src/app/page.tsx` | Three testimonials have no provenance or external review source. | Unverifiable social proof damages trust and creates governance risk. | Remove until consent and source evidence exist; replace with product proof, transparent limits and privacy reassurance. |
| High | Live pricing | Production still shows “Unlimited Everything”, duplicate Master copy for Agency and “Custom/month”. See `live-pricing-desktop.png`. | Buyers cannot understand or trust entitlements; selected-plan confidence falls. | Use shared exact limits, consumer-first tiers and a separate agency callout. |
| High | Signup/login / auth intent | Prior local QA found email signup bypassed selected intent and old redirects used a prefix-only check. | Visitors repeat choices or land in an unrelated workflow; unsafe internal redirects were possible. | Preserve the existing typed, allowlisted intent repair and design all CTAs around it. |
| High | Live/public copy | Live pricing footer exposes “Launch note”; live homepage explains why its preview exists and repeats product-positioning commentary. | Makes the service feel unfinished and reveals internal framing. | Replace with concise customer benefit copy and repository regressions for internal phrases. |
| Medium | Homepage narrative | Connected-workspace message repeats across Trusted workflow, How it works, Platform and Built for confidence. | Long page delays proof, pricing and signup without answering new objections. | Give each section one job: outcome, proof, process, benefits, templates/ATS, wider workspace, pricing, FAQ. |
| Medium | `landing-motion.tsx` | Client-heavy Framer Motion file includes pointer tilt, floating orbs, counters and broad reveal wrappers. | More JavaScript and motion than the conversion story needs; reduced-motion support is incomplete. | Keep one purposeful product demonstration, remove decorative motion and honour reduced motion. |
| Medium | `globals.css` / `tailwind.config.ts` | 1.5–2.4rem radii, blur, glows and three fixed radial gradients dominate the system; documented colours and code tokens have drifted. | Generic AI-startup appearance and inconsistent brand execution. | Add calm marketing tokens, opaque surfaces, 12–20px radii, disciplined shadows and correct font wiring. |
| Medium | Public navigation | Seven desktop links; pricing/legal/support use alternate local navigation arrays. | Users relearn navigation between pages and mobile menus become crowded. | Standardise Product, CV Builder, ATS Checker, Templates, Pricing and Resources plus Log In and canonical CTA. |
| Medium | Auth shell | Desktop marketing panel and mobile reassurance duplicate content; title is visually heavy; password guidance appears only after submit. | Registration feels longer and users discover requirements too late. | Use a compact two-column shell, form-first mobile order, visible requirements, legal links and accessible status text. |
| Medium | Templates | Cards are already lightweight CSS thumbnails with a requested full preview, but every thumbnail mounts immediately. | Mobile browsing can still do unnecessary rendering. | Add native lazy/containment behaviour, stable card geometry and immediate tier/layout comparison. |
| Medium | Pricing page | Repeats start/upgrade copy, uses “resume”, and mixes Agency into four equal consumer cards. | Comparison is noisy and the organisation offer distracts job seekers. | Compare Free/Pro/Master together; separate Agency; use exact CV terminology and qualified billing copy. |
| Low | Global accessibility | No shared skip link; mobile Sheet needs landscape overflow verification. | Keyboard users take longer to reach content; compact landscape could clip menu items. | Add skip navigation and scrollable, focus-managed mobile menu; validate 320px and landscape. |

## Conversion architecture

- General: homepage → `Build My CV Free` → signup → start a new CV.
- Existing CV: homepage/builder → `Upload My CV` → signup → upload → editor.
- ATS: ATS landing → `Check My CV` → signup → ATS workspace.
- Template: template card → signup with validated template ID → selected editor template.
- Paid plan: pricing → signup/login with validated Pro/Master plan → settings checkout resume.

No route may use an arbitrary return URL. The typed allowlist in `src/lib/auth-intent.ts` remains the source of truth.

## Design direction

“Calm editorial workspace”: serious UK career guidance, generous whitespace, precise grid alignment, soft paper-like neutral surfaces and controlled purple/teal/coral accents. Plus Jakarta Sans carries body/UI; Sora is reserved for concise display moments. The memorable element is a real split-view CV improvement demonstration that shows weak copy becoming measurable, job-specific evidence—without fake controls or invented outcomes.
