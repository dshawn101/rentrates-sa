# Book #2 Extrapolator

Route: `/tools/series-bible` (same existing public tool, below the notes-based generator).

The repository is **Vite + React**, not Next.js. The existing public HTML page was moved from `public/tools/series-bible.html` to the Vite build entry `tools/series-bible.html` so React, Mammoth, PDF.js, Lottie and Markdown rendering are bundled locally. The signed-in `/series-bible` editor and its server-relayed AI helpers are separate and were not reused by this tool. `src/components/LottieStageLoader.tsx` has `'use client'`, but there are no Next Server Components or SSR routes to wrap with `next/dynamic`.

## Data boundary

- TXT/MD: FileReader. DOCX: browser-bundled Mammoth `extractRawText`. PDF: PDF.js with a local same-origin worker, CMaps and fonts. No OCR. No raw file upload, form post or server parsing.
- Maximum file size: 20 MiB; maximum extracted UTF-8 text: 2 MiB. `parseManuscript` accepts a configurable `maxTextBytes`; defaults are exported from `ingestion.ts`. DOCX archive metadata is bounded before decompression; PDFs are capped at 2,000 pages and checked incrementally against the text limit. Empty/scanned or encrypted/unreadable documents get explicit messages.
- The only content-bearing network requests are browser POSTs to `https://openrouter.ai/api/v1/chat/completions`. Authorization goes only to that fixed destination, with redirects rejected, no cookies and no referrer. No PubléStudio API route is used. No Supabase client, analytics SDK or error-reporting SDK is imported into the standalone entry.
- The manuscript, analysis digests and output live in React/local variables only, not localStorage, sessionStorage, IndexedDB, cookies, application servers, logs or the database. Copy and download are explicit user actions. Reload/Start over clears them. The existing notes generator still has an optional anonymous three-event counter; it sends only predefined event names, never content. The new extrapolator does not call that counter.
- Key intake is a password field. Save creates a non-extractable 256-bit AES-GCM CryptoKey with Web Crypto, generates a fresh 96-bit IV, and stores ciphertext + CryptoKey + IV in the dedicated `puble-book-two-key-v1` IndexedDB database. The plaintext field is cleared/unmounted after save; saved keys are never placed back in the DOM. Forget deletes the complete record. This is browser encryption, not an independent password vault; trusted same-origin code can still use a stored CryptoKey.
- No platform AI proxy/Gateway, cloud persistence, automatic manuscript import into an account, or provider-key logging. OpenRouter and its model provider necessarily receive approved extracted text and apply their own rates and retention policies.

## CSP and assets

Both the tool HTML meta policy and a tool-scoped Vercel response header specify:

`script-src 'self'; connect-src 'self' https://openrouter.ai`

There is no `unsafe-eval` or inline script permission. Workers are same-origin. The response also denies framing, objects, base-URL changes and form submission. `style-src` allows inline styles for the Lottie SVG engine; this does not permit inline scripts. AI Markdown never renders raw HTML, image requests or clickable model-generated links. The fixed signup CTA is `/auth/signup`, without manuscript/query parameters.

Animations are small original JSON files in `public/tools/animations`, loaded on demand by `LottieLight` from the pinned `lottie-react` package. The light engine has no expression evaluator. Each stage has its own color/JSON and a visible label. Wrapper Tailwind classes set dimensions; reduced-motion users see a static indicator. PDF assets are copied from the pinned npm dependency during predev/prebuild; generated copies are git-ignored, with upstream licenses retained.

## AI flow

1. Parse locally and show filename, character count, UTF-8 size and first 700 characters. Require confirmation.
2. Require an encrypted key plus explicit permission to send extracted text and incur any provider charges.
3. Analyse **every** sequential 32,000-character chunk. Show the current chunk and streamed digest. A 2 MiB manuscript can require many requests; count is visible before starting. Digests are lossy, limited in size, and overlong notes are shortened only with a visible warning.
4. Generate a blueprint from the digest map, using JSON mode with a `markdown` string. Decode the partial string into visible Markdown as it streams. Seven required sections cover recap, character arcs, threads, Book #2 premise, chapter beats, continuity risks and author questions. Output is a proposed planning document, not an authored novel or a guaranteed continuity audit.
5. Unsupported JSON mode or malformed JSON triggers one plain-text fallback with an explicit warning about formatting and extra provider requests. 401/402/404/429, network loss, timeouts, truncated output and user cancellation do not silently switch models. Partial output remains available when safe; it is labelled incomplete.

Default: `liquid/lfm-3-1.7b:free`, listed with response_format/structured_outputs support when checked. The suggested `cohere/north-mini-code:free` existed but did not advertise JSON mode, so it is not the default. Model ID is editable and is not persisted. No real author key or paid generation was used for automated verification.

## Verification

- `npm run build` builds the existing app and the isolated tool.
- `npm test` includes archive/text/PDF-empty errors, secure key persistence/forgetting, complete chunk coverage, split SSE frames, JSON fallback, exact 401 handling, cancellation, direct-only request destinations, no logging in feature modules, strict CSP, SSR-safe stage rendering, and the complete upload/consent/stream/reset component flow with synthetic content and a synthetic key.
- Dev mode: `npm run dev -- --mode series-bible --host 127.0.0.1`. The special mode disables React inline refresh preambles/HMR to respect the strict CSP. An in-process HTTP smoke test verified the route returns 200 and the CSP/entry root are present.
- Browser verification must use a synthetic invalid key for the 401 path or an explicitly approved provider key/budget for real generation. Do not use account keys from other tools. Do not record a real key, manuscript, prompt or output in console/network artifacts.
