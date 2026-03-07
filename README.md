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