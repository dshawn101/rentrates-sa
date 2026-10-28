# Beta pricing and launch handoff

Update: the PayPal integration is now implemented behind server configuration. See [PayPal setup](paypal-setup.md) for the current activation and acceptance checklist. Lite remains interest-only until merchant setup/testing are complete; no real checkout was executed during implementation. The older checklist below records launch intent; verified payments now grant Lite through separate RLS-protected billing records while legacy profile values are preserved.

Public intentions: Free $0; Lite $9 USD/month beta entry tier; Author $19 and Pro $49 USD/month preliminary tiers planned for a phase after Product Hunt. No release date is promised. Free account signup is live. Lite registration records interest and does not activate a paid subscription. Author/Pro purchase controls remain disabled, with separate notification signup.

## Gateway activation checklist (owner-managed)

- Keep Author and Pro unavailable until explicitly released after the Product Hunt launch.
- Configure Lite recurring pricing and show taxes, renewal, cancellation and all confirmed allowances before payment. No annual price is currently advertised.
- Map a verified paid subscription to server-controlled entitlements. Current profiles use legacy tier identifiers `free`, `express`, `craft`; gateway work must explicitly migrate/map these before using `lite`, `author`, `pro`. Changing a pricing label or saving a client preference must never grant paid access.
- Enforce actual promised allowances and PDF watermark removal on verified entitlement. Current preview cards do not introduce project limits or remove an existing author's access.
- Verify checkout success, abandonment, signed webhooks, duplicate/replayed events, payment failure, cancellation/refund, downgrade and writing retrieval. Do not delete writing when a plan changes.
- Test before Threads/Reddit promotion. Once checkout and access work, change the Lite CTA from interest registration to the tested purchase flow and update availability wording in pricing, Transparency, Billing and policies together.

## Waitlist operations

- `public.launch_waitlist` is an insert-only public submission surface. Only database/service operators may read it. It stores normalized email, first interest, source, consent/version and timestamp.
- Duplicate email submissions return empty success without changing the existing preference. This avoids exposing list membership or letting a stranger change another address's preference.
- The form records explicit permission for launch and selected-tier announcements. It does not send a confirmation email, verify ownership or create a user account/subscription.
- Launch email delivery is not connected. Before sending, connect an email delivery/list service or run an authorized manual campaign using this private list. Include withdrawal/unsubscribe handling, respect requested removals and do not expand the consent to unrelated marketing. Double opt-in is a possible follow-up to reduce unverified addresses.
- Access/export the list through the operator's Supabase dashboard; do not add an anonymous list/export API. Process corrections/removals through support@publestudio.com until self-service is implemented.
- A database guard deduplicates submissions and limits new entries to 1,000 per hour. The UI includes a honeypot. Monitor spam before broad promotion and add server-verified anti-abuse controls if needed.

## Verified in this release

Pricing/waitlist form tests, database grant/RLS/validation/deduplication tests, full application tests and production build. A live SQL test used only a synthetic `.invalid` address and rolled back the transaction. No launch emails or payment transactions were sent.
