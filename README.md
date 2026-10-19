# Puble Studio

A focused book-writing workspace: plan chapters, write and save a manuscript,
bring your own cover, and export a PDF. Optional BYOK assistance supports Google
Gemini, OpenAI and OpenRouter. Manual writing, cover import and export require no
AI key.

## Start locally

1. Run `npm ci`.
2. Copy `.env.example` to `.env` and set the matching Supabase project URL and
   public publishable/anon key. Never use a service-role key here.
3. Install the application schema and storage policies in that Supabase project.
   For an empty application database, use
   `supabase/migrations/20261019000000_repair_mvp_schema.sql`, then
   `supabase/migrations/20261019105558_restrict_rls_event_trigger_access.sql`, then
   `supabase/migrations/20261019121345_private_book_cover_uploads.sql`.
   Inspect an existing database before applying migrations. The repair preserves
   existing rows/policies and backfills profiles for email users who signed up
   before schema installation. Normal migration workflows should reconcile the
   original Phase 1 migration/history before pushing to an existing database.
4. Run `npm run dev`. Vite includes the same authenticated AI relay used on Vercel.

## Author workflow

- Dashboard: continue your latest book, create a book, or configure optional AI.
- Settings: Account, AI Providers, Writing Defaults and Design Tools. Advanced MCP
  is collapsed and loaded only on demand.
- BYOK: add a key and model, test access without generation, then select a writing
  provider. Model access and credit availability are controlled by the provider.
- Cover: upload/drop PNG, JPG or WebP (up to 10 MB), preview, then save. Images are
  normalised to JPEG, scaled to a 2,000-pixel maximum side and stored in a private
  Supabase bucket. Transparent regions become white. The bucket caps saved files
  at 3 MB. Only the book owner can upload/read its cover. Front covers appear in
  the dashboard and as the first PDF page, fitted without stretching or cropping.
- A cover is optional. PDF export still includes the title page and saved chapters.
  A missing saved cover produces an actionable export error, not a silent omission.
- Removing/replacing a cover changes its book attachment; it does not purge old
  storage objects. Storage lifecycle cleanup can be added separately.
- Chapter navigation saves before changing chapters/steps. Failed saves retain
  edits; session-storage drafts support recovery after refresh. Save recovered
  chapters before exporting.

## Keys and integrations

Provider keys and MCP access tokens are held in page memory only, clear on page
refresh/sign-out, and never persist in local/session storage or the database.
Non-secret model preferences/defaults/server endpoints are saved in this browser,
separately for each account. A previous Gemini local-storage key can be explicitly
imported and its old copy removed from AI Providers.

`POST /api/ai` validates the caller with Supabase Auth, then forwards only the
requested action to fixed official provider URLs. It does not log/cache keys,
accept arbitrary upstream URLs, or retry against a different provider. Request
output is bounded. The Vercel function uses the same Supabase environment values
as the frontend. Ensure no infrastructure request-body logging is enabled.

API model listing tests do not generate paid text/images. Text/image generation
uses the user's provider billing; ChatGPT and other app subscriptions do not grant
API credits. Image generation requires an explicit paid-credit acknowledgement.
No real provider calls are made by the automated tests.

Canva and Midjourney work as external cover-design tools with file import.
Canva MCP additionally requires a registered OAuth app, per-user authorisation,
a valid access token and browser CORS support; one-click OAuth is not implemented.
Midjourney has no official public API integration here. OpenAI artwork uses GPT
Image models; the retired DALL·E API is not exposed.

Advanced MCP supports remote HTTPS Streamable HTTP endpoints, live tool discovery,
and explicit argument review before each tool call. It does not run local stdio
commands or automatically execute model-suggested actions. MCP calls go directly
from the browser to the selected endpoint with its dedicated token; a server that
does not support browser CORS will need an independently trusted gateway. Saved
server configuration is not presented as a verified connection.

## Deploy and verify

Vercel: build `npm run build`, output `dist`. Configure `VITE_SUPABASE_URL` and
`VITE_SUPABASE_ANON_KEY` for the correct deployment environment, apply database
migrations, and redeploy. `api/ai.ts` is the authenticated serverless relay; no
platform AI key is required.

Run `npm test`, `npm run build`, and `npm run lint`. Tests exercise auth/session
recovery, chapter preservation, export gating, PDF cover embedding, owner-specific
storage policies in PostgreSQL (PGlite), provider routing/authentication, credential
isolation and lean settings navigation. Existing legacy lint findings are not
silently suppressed.

Live smoke test: create a book, save chapter text, upload a cover, reload, reopen,
then download and inspect the PDF. Configure/test a real provider key only when
its owner authorises that use. Never use real secrets in test fixtures.

EPUB/DOCX, one-click OAuth, advanced typography and printer-specific wraparound
covers/bleed are not implemented. The PDF uses built-in Times with limited Unicode
coverage and is a manuscript export, not guaranteed publisher-specific print output.

### Default writing provider and fallback

In Settings → AI Providers, save a BYOK key and model, then choose **Default AI provider**. This choice is saved per account in this browser; API keys stay in page memory and clear on refresh or sign-out.

Chapter drafting and editing first use the chosen provider. If a non-Gemini provider fails, the app retries once using the author's separate Gemini key and saved Gemini model. On success, Gemini becomes the default and the editor reports the fallback. If Gemini has no key, or both requests fail, the app shows a clear error without changing chapter text or the default. Session and input errors do not trigger fallback. Key tests and cover artwork generation do not fall back. Both attempts may incur provider charges; this feature does not use a platform-funded key.
