# Puble Studio

The transparent, author-centric, lean, and beautiful AI book creation platform.

## Features
- **Project Scaffold:** Vite + React + TypeScript + Tailwind CSS
- **Database/Auth:** Supabase Auth and PostgreSQL Database (RLS Secured)
- **AI Integrations:** Google Gemini 1.5 Pro (Outlining & Writing), Pica/Unsplash API (Cover Generation)
- **Zero Platform Markup:** Bring Your Own Key (BYOK) architecture to pay for AI usage directly
- **Exports:** Browser-native generation for PDF (print ready A5) and EPUB

## Quickstart

1. Clone repo and install dependencies
```bash
npm install
```

2. Set up Environment Variables
Copy `.env.example` to `.env` and fill in your keys:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GEMINI_API_KEY=your_gemini_key (optional, can use BYOK in app)
VITE_PICA_API_KEY=your_pica_key (optional)
```

3. Setup Supabase Database
Run the migration file located at `supabase/migrations/20250101000000_puble_schema.sql` in your Supabase SQL Editor.

4. Run the development server
```bash
npm run dev &
```

## Deployment (Vercel)
This project includes a `vercel.json` file designed for immediate deployment. Connect your repository to Vercel, ensure the build command is `npm run build`, output directory is `dist`, and inject the Environment Variables inside the Vercel dashboard.
## Book creation MVP

Configure `.env` with your Supabase URL and anon key, apply
`supabase/migrations/20250101000000_puble_schema.sql`, then run `npm ci` and
`npm run dev`. Sign up/sign in to create a project from the dashboard.

1. Enter a title, author and book details; save and continue.
2. Add chapters manually or append the editable starter template. Save the outline.
3. Write chapter text. Switching chapters or using Back/Continue saves the current
   chapter first; a failed save keeps you in the editor. Unsaved prose is also
   retained in this browser tab's session storage for recovery after navigation
   or refresh. Save recovered chapters before exporting.
4. Continue past the optional cover step. This MVP exports a title page; custom
   image cover generation is not integrated.
5. Download the A5 PDF manuscript. Every chapter must contain saved text. Export
   reads chapters from Supabase in outline order and does not publish the book.

Wizard steps are addressable via `/book/:id?step=1` through `step=5`. Book metadata
and progress updates are reflected immediately in the shared store. Outline saves
preserve chapter IDs and prose; removing a chapter deletes its prose on save.
No database migration is needed beyond the existing Phase 1 schema.

PDF is the supported MVP export, not a guarantee of publisher-specific print
compliance. The built-in Times font has limited Unicode coverage. EPUB/DOCX and
custom cover generation are not exposed. Manual creation needs no AI keys;
optional Gemini assistance requires a valid key and supported model. OpenRouter
now reports an unavailable integration rather than returning simulated prose.

Validation: `npm test` exercises prose preservation, failed loads/saves, draft
recovery, export gating and multipage PDF generation; `npm run build` checks the
production bundle. For a live smoke test, create a two-chapter book, edit and save
both chapters, revisit the outline and rename one, refresh the editor, then
export and inspect the PDF. The automated tests mock Supabase and do not verify
live authentication, database policies or provider access.
