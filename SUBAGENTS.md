# Subagent Operating Model

This project uses Claude-style subagents in `.claude/agents/`.

## Subagents

- `code-debug-improver`: debugs code and looks for scoped maintainability improvements.
- `full-app-user-tester`: tests the app like a real user across core journeys and devices.
- `deployment-quality-guardian`: performs the final pre-deployment quality gate and checks brand alignment.
- `seo-performance-specialist`: reviews public pages, metadata, sitemap, search intent, and performance.

## Standard Flow

Use this order for substantial product changes:

1. `code-debug-improver` reviews the changed code and fixes obvious defects.
2. `full-app-user-tester` runs user-flow checks and reports reproducible issues.
3. `seo-performance-specialist` reviews any public, content, route, metadata, or performance changes.
4. `deployment-quality-guardian` checks the final diff, proof, brand guide, and deployment readiness.

## Shared References

- Brand rules: `BRAND_GUIDE.md`
- App metadata and keywords: `src/lib/site.ts`
- Global metadata: `src/app/layout.tsx`
- Sitemap: `src/app/sitemap.ts`
- Brand tokens: `src/app/globals.css` and `tailwind.config.ts`

## Evidence Standard

Agents should report exactly what they checked. If a command was not run, the handoff must say so.

Common verification commands:

- `npm run typecheck`
- `npm run lint`
- `npm run build`
- `npm run e2e`
