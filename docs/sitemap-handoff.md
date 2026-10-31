# Task 1 — Sitemap and robots handoff

This repository is Vite + React Router, not Next.js App Router. There is no app/ directory. A build-generated sitemap is the appropriate implementation for its static public route set; introducing a Next.js runtime just for this task would require an unrelated framework migration.

## Public endpoints

- Sitemap: https://www.publestudio.com/sitemap.xml
- Robots: https://www.publestudio.com/robots.txt
- URLs: **10**

Included: `/`, `/pricing`, `/features`, `/help`, `/contact`, `/transparency`, `/legal/about`, `/legal/privacy`, `/legal/terms`, `/legal/cookies`. Help is the current public resource page. There are no public blog/article routes in this repository.

## Deliberate exclusions

- `/auth/login`, `/auth/signup`: sign-in/account actions, not search landing pages.
- `/dashboard`, `/books`, `/book/:id`, `/author-guide`, `/writing-goals`, `/ai-providers`, `/profile`, `/billing`, `/settings`: authenticated workspace and author data.
- `/api/*`: application endpoints, not public content pages.
- Unknown `/legal/*` slugs: not actual policy pages.
- Query strings, fragments, duplicate hosts, trailing-slash alternatives and nonindexable catalog entries: not separate canonical content.

Vercel adds `X-Robots-Tag: noindex, follow` for auth/workspace/API routes and unknown legal slugs. The robots file allows crawling, rather than blocking crawlers from seeing noindex. These headers do not replace authentication. Each listed public URL has an absolute canonical Link response header, using www.publestudio.com. No existing noindex directives were found on the included pages.

## Implementation and date accuracy

- `seo/public-pages.json`: audited allowlist, indexable flag and source files. Add future public content/tools here after reviewing their indexability.
- `scripts/generate-sitemap.mjs`: validates canonical paths and source files, rejects explicit noindex meta tags, generates XML and robots. Runs automatically before dev and production builds.
- `seo/page-modified.json`: Git-derived dates with SHA-256 fingerprints of their content sources. Lets shallow Vercel clones reuse a trustworthy date only while the source bytes still match.
- `public/sitemap.xml`, `public/robots.txt`: served as real files before the SPA fallback, with explicit production MIME types and revalidation.
- `vercel.json`: response headers. Add the canonical rule when adding an allowlisted route; tests prevent drift between the catalog and headers.

lastmod uses the latest known Git modification of a page's content source files, never build time or filesystem mtime. Dirty content, unavailable/incomplete history and stale source snapshots cause lastmod to be omitted. Legal documents share a module, so their individual update times cannot be reliably inferred: their lastmod values are deliberately omitted rather than assigning all policies the latest edit to any one policy. Sitemap dates are optional.

After committed public-content changes, run `npm run seo:dates` in a full-history checkout and commit the refreshed date snapshot and sitemap. `npm run seo` and normal build/dev runs regenerate XML and robots without inventing dates.

## Verification

Start the development server with `npm run dev -- --host 127.0.0.1 --port 4173 --strictPort`, then:

```bash
curl --fail --include http://127.0.0.1:4173/sitemap.xml
curl --fail --include http://127.0.0.1:4173/robots.txt
```

In this execution environment, a long-running dev server was not reachable from a separate command invocation. Verification therefore starts the actual Vite dev server and runs asynchronous curl requests in the same invocation. Both returned HTTP 200, with XML/text content types; Python XML parsing confirmed 10 URLs. The initial separate-command connection failures are an environment limitation, not hidden as successful checks. Vercel-specific canonical/noindex headers are tested from configuration and verified separately on production.

Targeted tests cover XML parsing, route coverage, private/noncanonical exclusions, canonical/noindex header alignment and fingerprint-verified historical dates. Production build includes automatic generation. The final handoff in chat records production verification results.

Submit `sitemap.xml` in the existing Google Search Console property after deployment. This work does not sign in to or submit anything to Search Console. Tasks 2 and 3 have not started; confirmation is required before either next task.
