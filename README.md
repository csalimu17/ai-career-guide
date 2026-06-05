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

## AI Provider Stack

The app now uses a free-first provider chain:

- Primary: Google Gemini Flash
- Backup: Groq
- Final fallback: OpenRouter free router

Recommended environment variables:

- `GEMINI_API_KEY` or `GOOGLE_GENAI_API_KEY`
- `GROQ_API_KEY`
- `OPENROUTER_API_KEY`
- Optional: `GROQ_MODEL` defaults to `llama-3.1-8b-instant`
- Optional: `OPENROUTER_MODEL` defaults to `openrouter/free`
- Optional: `OPENROUTER_HTTP_REFERER` and `OPENROUTER_APP_NAME`

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

- The project uses **Firebase App Hosting** with an automated CI/CD pipeline.
- Continuous deployment is linked to the GitHub repository. Any pushes or merges to the `main` branch will automatically trigger a build and rollout in Firebase.
- `scripts/deploy.ps1` remains available for local verification, type checking, and manual Firebase Rules deployment.

## Useful Test Helpers

- `test-cv-extraction.ts`: run a local CV extraction against a file path you provide
- `test-validation.ts`: quick validation sanity checks for CV field heuristics
