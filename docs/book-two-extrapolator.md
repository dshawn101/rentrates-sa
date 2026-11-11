# Public Series Bible and Book #2 Extrapolator

The repository is Vite and React Router. Vercel serves the standalone Vite HTML entry at `/series-bible` (including subpaths), before the SPA fallback. The old `/tools/series-bible` URL redirects permanently. There is no Next middleware. The signed-in series workspace remains under `ProtectedRoute` at `/series-bible-workspace`; it is noindexed and its dashboard link and auth return path were updated.

The public entry preserves the notes builder and defaults to the extrapolator. Static HTML provides the canonical, Open Graph tags, SoftwareApplication JSON-LD, output descriptions and FAQ. The existing sitemap generator lists the canonical URL monthly; private workspace URLs are excluded.

## Data boundary

- TXT/Markdown via FileReader; DOCX via browser Mammoth with archive bounds; PDF via locally bundled PDF.js worker, CMaps and fonts. No OCR. A pasted synopsis also works. Hard cap: 120,000 extracted words, plus 20 MiB files and 2 MiB extracted text for browser safety.
- File bytes, manuscript and output stay in browser memory except approved extracted text and digests sent directly to OpenRouter. The tool has no auth/session client or provider relay. The manual notes builder retains an optional counter that sends predefined event names only.
- The browser saves a non-extractable AES-256-GCM CryptoKey, a random IV, ciphertext and creation time in IndexedDB. The plaintext input clears after saving. Forget deletes the complete record. Trusted same-origin code can use the persisted CryptoKey; this does not protect against a compromised origin.
- CSP restricts scripts to self and connections to self/OpenRouter, and allows same-origin/blob workers. Raw model HTML, remote images and model-generated clickable links are suppressed. Inline styles are allowed for Lottie; inline executable scripts and eval are not allowed.

## Pipeline and costs

`src/tools/book-two/config.ts` is the single source for the default model, caps and estimated rates. Estimates are approximate and exclude retries; unknown model IDs show no estimate. A 12-section cap samples across the full manuscript when necessary. Each section returns a JSON digest, with one retry for section failures. Authentication, credit, rate and missing-model failures stop promptly. Synthesis streams raw Markdown, validates heading order and warns about omitted headings. Copy/download preserve Markdown. The signup link carries `ref=series-bible`.

Original Lottie JSON is bundled locally instead of using unverified third-party assets. It loads on demand, with a reduced-motion text fallback. This standalone client entry has no SSR or Next dynamic imports.

## Verification

Run `npm test` and `npm run build`. Automated tests use synthetic manuscripts and mocked OpenRouter streams, inspect exact outbound destinations and auth headers, and test encrypted IndexedDB persistence. Do not use real author manuscripts or credentials for smoke tests. A real provider run requires a separately authorized test key and budget.
