# AI Career Guide

AI Career Guide is a Next.js application for CV building, ATS optimization, cover-letter generation, job tracking, and admin-managed subscription workflows.

## Stack

- Next.js 15 with React 19
- Firebase Authentication, Firestore, Storage, and App Hosting
- Genkit-based AI flows for extraction, ATS scoring, summaries, and career assistance
- Stripe billing for paid plans

## Local Development

1. Use Node `22.x`.
2. Install dependencies with `npm install`.
3. Start the app with `npm run dev`.
4. Open `http://localhost:3000`.

## Quality Checks

- `npm run lint`
- `npm run typecheck`
- `npm run build`

## Important Areas

- `src/app`: routes, layouts, server actions, and API endpoints
- `src/components`: editor, dashboard, marketing, admin, and shared UI
- `src/ai/flows`: Genkit flows for extraction, ATS scoring, cover letters, and chat
- `src/lib`: extraction pipeline, PDF/document handling, templates, plans, and utilities
- `src/firebase`: client/admin Firebase wiring

## Deployment Notes

- The current deployment workflow is manual.
- `scripts/deploy.ps1` is a helper script for local verification and Firebase rules deployment.
- If the project is running inside a real git checkout, the script can also trigger a git-based rollout. Otherwise it will skip the git step safely.

## Useful Test Helpers

- `test-cv-extraction.ts`: run a local CV extraction against a file path you provide
- `test-validation.ts`: quick validation sanity checks for CV field heuristics
