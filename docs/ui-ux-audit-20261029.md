# PubléStudio UI/UX audit — 29 October 2026

## Scope and confidence

Reviewed the source for all public and workspace routes, navigation, authentication screens, My Books/folders, the five-step book wizard, editor/recovery, import/export, cover tools, AI Providers/MCP, billing, help, feedback and support. Checked public routes in the live browser, footer destinations, FAQ positioning, help search, support field validation attributes and the live PayPal readiness response. Checked Vercel project settings and the most recent 30 minutes of available runtime error logs.

The cloud browser is signed out. Protected author workflows were reviewed through source and automated tests, **not** a signed-in live manuscript acceptance test. No manuscripts, payment transactions, support submissions or account settings were changed during the audit. No mobile-device or screen-reader certification is claimed. Existing automated tests do not replace testing a real manuscript copy.

## Changes delivered with this audit

- Removed the standalone PubléStudio label above the workspace copyright; retained the copyright itself.
- Moved Features & Costs into the main sidebar, after AI Providers and before Help Center and Settings.
- Removed its duplicate workspace-footer entry. The public footer and public cost-guide route remain available.
- Added the current-page accessibility state to sidebar links. The cost guide already uses the workspace layout for signed-in authors, so no extra page or dashboard card was introduced.

Sidebar: Dashboard → My Books → AI Providers → Features & Costs → Help Center → Settings. Plan & payments remains in Account settings and the account menu.

## Priority findings

| Priority | Finding and evidence | Author impact | Smallest useful improvement |
| --- | --- | --- | --- |
| Launch blocker | Live `/api/paypal` returns `available:false`, `checkoutReady:false`, `managementAvailable:true`, `environment:live`, with “The payment webhook endpoint is blocked or unreachable. Check deployment protection for PayPal notifications.” Vercel reports SSO protection enabled with deploymentType `all`. | Lite cannot open for purchase. Payment notifications must be able to reach the endpoint independently of an author's browser session. | Review public production/webhook access with the owner; preserve application authentication and signature validation. Verify an external notification reaches the handler, then complete the merchant's sandbox/live acceptance checks before marketing paid Lite. The protection settings were not changed. |
| High | `BookCard` invokes `onDelete` immediately; My Books passes `deleteBook`; the store issues a database DELETE. There is no confirmation or book trash/restore UI in this path. | A stray click can remove the manuscript, with no normal in-app recovery for the whole book. | Prefer archive/trash with restore. At minimum, add a named-book confirmation before permanent removal. Retain chapter-history protections; they are not a substitute for book recovery. Do not test this on an original manuscript. |
| High | `duplicateBook` copies metadata and creates a new book; it does not copy chapters, and it removes the cover reference. | “Duplicate” implies a manuscript copy but produces an empty project. | Copy chapters atomically and explain whether the cover is included. Until that exists, rename the action to “Copy book setup” so authors do not mistake it for a backup. |
| High | An invalid live URL (`/ui-audit-missing-page`) renders no page heading/content. App routes have no global wildcard destination. | Old, mistyped or shared links end on a blank screen. | Add a lightweight not-found screen with Home, My Books and Help destinations; keep the invalid address visible rather than silently redirecting it to the home page. |
| High | Sign-in offers a support link, but there is no password-reset request or recovery route. Signup navigates away after a short confirmation toast. | Locked-out authors depend on manual support; new authors can miss the email-confirmation instruction. | Add self-service password recovery and a persistent “Check your email” screen with resend guidance. Preserve the original destination after authentication. |
| Medium | The editor guards browser unload and its own Back/Continue/chapter switches. Sidebar route changes do not pass through those save guards. A recovery draft exists locally. | Clicking another workspace tab can interrupt a pending cloud save; recovery is possible but unexpected. | Guard in-app navigation while unsaved, save first when possible, and provide a clear stay/leave choice on failure. Keep recovery as a fallback. |
| Medium | The My Books creation overlay is a positioned div with autofocus, without dialog semantics, focus containment, Escape handling or focus restoration. The mobile sidebar similarly has no modal focus handling. | Keyboard users can lose context or tab into content behind the overlay. | Reuse the app's native-dialog pattern for creation; give the mobile drawer clear focus/Escape behavior and ensure closed links are not keyboard-focusable. |
| Medium | Most public/workspace routes retain the same browser title. Only legal pages explicitly update titles. | Tabs and browser history are hard to distinguish; assistive navigation gives less context. | Set concise titles such as “My Books — PubléStudio” and “AI Providers — PubléStudio”; announce page changes without moving focus into the editor unexpectedly. |
| Medium | “Plan & Usage”, “Plan & payments”, “Billing” and “Plan & payments” in help refer to the same destination. The Lite interest CTA remains a waitlist while readiness is false. | Authors can interpret a purchase failure as a dead redirect, even when interest registration is intended. | Use one label, preferably “Plan & payments”. Keep the interest action explicit and display a short checkout-status message beside Lite. Do not label interest registration as buying Lite. |
| Medium | Most route components are imported eagerly. The checked production build reports an 808.42 kB main JavaScript chunk (245.30 kB gzip), above its 500 kB warning threshold. | Authors on slower/mobile connections download editor/provider code before reaching simple public pages. | Split routes with lazy loading, retain clear loading/error states, and measure the initial-page improvement. No new framework is necessary. |

## Verified working or deliberately unavailable

- Public landing, Features, Pricing, Help Center, Contact, cost guide, About, Privacy, Terms, Cookies, sign-in and signup pages render in the live browser.
- The static scan found 79 literal internal destinations and no unmatched paths or empty `href="#"` controls. Navigation-array and dynamic book destinations were additionally reviewed in source. This is not a claim that every dynamic ID exists.
- Footer FAQ reaches the FAQ section; after navigation settles, the section top is at the top of the viewport. Features and Contact reach their named pages. The cookie notice must be dismissed or avoided when it covers bottom-of-page controls.
- Help search for “autosave” returns the relevant saving article. Empty-search recovery and feedback behavior have existing automated tests.
- Contact has five required fields and clear secret/manuscript exclusions. No live support request was submitted. Support and feedback explicitly state that no automatic confirmation email is sent.
- Old Settings provider links redirect to the dedicated AI Providers route; this is intentional compatibility, not a dead redirect.
- Author/Pro purchase controls are intentionally disabled and hidden behind the planned-tier popup. Their timing/benefits are unconfirmed. This is deliberate beta scope.
- Lite interest registration is working as interest registration; the blocked readiness response explains why it is not currently a payment gateway.
- Cover import, import-preview acknowledgements, export preview checks, chapter revision/conflict handling, provider-key persistence and optional AI consent have implementation/tests. They still need the signed-in real-manuscript walkthrough below.
- No production runtime error groups were returned for the available last-30-minute window. This is a quiet-window observation, not proof that the service has no errors. A 24-hour query exceeded this project's available retention.

## Validation for the delivered cleanup

Production build passed. The 23 existing help/navigation, settings, route-scroll and My Books tests passed. The repository CI also runs the full manuscript/publication suite before merge. No new test payment, paid AI call, support submission or manuscript deletion was performed.

The earlier video playback issue is not certified resolved by this audit: the direct YouTube fallback is present, but full media playback still needs confirmation in the author’s normal browser.

## Keep the app focused

Do next: resolve checkout readiness, protect deletion, make duplication truthful, add not-found/recovery screens, then complete the author acceptance walkthrough. Those changes improve trust and task completion more than adding another dashboard card, AI assistant or design integration.

Keep Features & Costs in the sidebar, with details collapsed in its existing guide. Retain My Books as the home for manuscripts and folders. Keep the dashboard to progress, one useful next action and optional help. Consider a click-to-load poster for the visible dashboard video so it remains discoverable without loading a third-party player on every dashboard visit.

## Remaining acceptance walkthrough

Use a dedicated test account and a copy of the owner's manuscript. Sign up/confirm, sign out/in and recover access; import DOCX/TXT/Markdown; inspect splits and formatting warnings; edit and wait for cloud save; change routes during pending/failed save; refresh and inspect recovery; move a book by keyboard and drag/drop; check the promised duplication behavior; import a cover; preview/download DOCX, EPUB and both PDF modes; test on a narrow viewport and keyboard only. Check account isolation and empty/error states. Paid AI calls require an agreed provider/budget; payment acceptance remains owner-run.

Report each failure at its first broken boundary. Do not delete an original manuscript, submit real support messages or execute a real charge just to complete a UI audit.
