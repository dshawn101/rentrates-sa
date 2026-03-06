# OpenBook Builder - Transparent AI Book Creation Platform

## Project Overview

OpenBook Builder is an MVP application designed to validate a business idea for creating, formatting, and publishing books using AI with transparent pricing.

## Features (MVP Scope)
- **Account Management:** User signup, login via Supabase.
- **Book Workflow:** 5-step wizard to create a book (Setup, Outline generation, AI-assisted Writing, Cover generation, Export).
- **Transparency:** Clear tracking of API costs with a zero-markup policy.
- **Integrations:** Stubbed integrations for Google Gemini 3.1, Pica AI (cover generation), and n8n webhooks.

## Tech Stack
- Frontend: React + Vite + TypeScript
- Styling: Tailwind CSS (Primary: slate-900, Secondary: blue-600, Accent: emerald-500)
- Database/Auth: Supabase
- AI Services: Google Gemini (Text), Pica AI (Images)
- Automation: n8n

## Getting Started

1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy the environment variables:
   ```bash
   cp .env.example .env
   ```
4. Fill out the `.env` file with your actual keys (Supabase URL/Key, Gemini API Key, etc.).
5. Start the development server:
   ```bash
   npm run dev
   ```

## Deployment

This application is configured for deployment on Vercel.
Simply push to your main branch or import the repository into the Vercel dashboard. Ensure the `.env` variables are duplicated in the Vercel Project Settings.
- Deployment Config: `vercel.json` included.

## Known Issues (MVP)
- AI integrations (`gemini.ts`, `pica.ts`, `n8n.ts`) currently use mock/stub data to prevent external billings during initial development/testing.
- PDF and EPUB exports are stubbed alert notifications for the MVP workflow validation.
- The `useAuth` session logic expects a real Supabase instance. If using local, ensure Supabase CLI is running.

## Next Steps Recommendations
1. Replace stubs in `src/lib/*` with real API calls using the provided keys.
2. Hook up `react-pdf` and `epub-gen` libraries to actually compile the finalized book structures.
3. Build the User Profile page for "Bring Your Own Key" functionality.
4. Set up the Supabase SQL Migrations for the Book tracking schemas.
