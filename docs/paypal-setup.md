# PayPal Lite activation

Implemented: server-created $9 USD/month subscriptions; authenticated ownership; durable checkout request IDs; validated plan price/frequency; signature-verified webhooks; read-only author billing records; renewal cancellation; refund/reversal handling; paid-period expiry; watermark-free PDF selection from database entitlement. No AI credits or new project cap. Legacy express/craft profiles are preserved; new Lite is derived from verified payments, not writable profile metadata.

**Live charging is disabled by default.** No merchant credentials were supplied or payment transaction executed in this implementation. The owner must configure the PayPal app and run real sandbox acceptance tests before enabling live checkout. Mock/unit/database tests do not replace a PayPal sandbox payment.

## Vercel server environment

Add these in the Vercel project environment settings. Do not paste secrets in chat or put them in browser-prefixed variables. Use the main production domain as APP_ORIGIN; preview domains cannot initiate checkout with the production origin.

| Name | Value |
| --- | --- |
| PAYPAL_CHECKOUT_ENABLED | `true` for authorized sandbox testing; otherwise `false` until live launch is approved |
| PAYPAL_ENVIRONMENT | `sandbox` initially; `live` after successful testing |
| PAYPAL_CLIENT_ID | REST app client ID from the matching PayPal environment |
| PAYPAL_CLIENT_SECRET | REST app secret; server secret |
| PAYPAL_LITE_PLAN_ID | Active plan ID for exactly $9 USD every month, indefinite regular cycle, quantity unsupported, no trial, no setup fee or extra percentage tax |
| PAYPAL_WEBHOOK_ID | Matching REST app's webhook ID |
| APP_ORIGIN | `https://www.publestudio.com` |
| SUPABASE_SECRET_KEY | Server-only Supabase secret (`sb_secret_…`) or legacy service_role key |
| VITE_SUPABASE_URL | Existing public project URL |
| VITE_SUPABASE_ANON_KEY | Existing public account key |

The $9 advertised amount is the total merchant subscription charge. Configure any merchant tax within that total; determine applicable tax obligations before launch. Bank/PayPal conversion can be separate. This implementation rejects a plan with extra percentage tax, trial cycles or setup fees. Do not edit the price of the active launch plan; use a separately reviewed new plan for future pricing.

Create a PayPal catalog product for PubléStudio Lite, then the subscription plan in the matching sandbox/live account. Ensure the merchant's account and country support USD recurring payments. Create separate sandbox and live resources and keep their credentials, plan and webhook IDs together.

## Webhook

Register this HTTPS URL in the **same PayPal REST app**:

`https://www.publestudio.com/api/paypal?action=webhook`

Subscribe to:

- BILLING.SUBSCRIPTION.CREATED
- BILLING.SUBSCRIPTION.ACTIVATED
- BILLING.SUBSCRIPTION.UPDATED
- BILLING.SUBSCRIPTION.CANCELLED
- BILLING.SUBSCRIPTION.SUSPENDED
- BILLING.SUBSCRIPTION.EXPIRED
- BILLING.SUBSCRIPTION.PAYMENT.FAILED
- PAYMENT.SALE.COMPLETED
- PAYMENT.SALE.REFUNDED
- PAYMENT.SALE.REVERSED

Verification uses PayPal's verify-webhook-signature endpoint and the server-configured webhook ID. PayPal's generic webhook simulator is not sufficient for this postback method: test with actual sandbox subscription events. Failed signature/processing returns non-2xx so PayPal retries. No raw payment payload, card credentials or merchant secrets are logged or retained. Database records retain only subscription IDs, sale IDs, owner, environment, status and dates plus deduplication event IDs. A partial or full refund removes the entitlement associated with that payment; refund issuance itself is handled by the merchant through PayPal/support, not automated here.

## Acceptance test — owner, before marketing

1. Configure sandbox values, redeploy, sign into a dedicated author account and open Plan & Usage. Confirm the sandbox label and $9 monthly terms. Approve with a separate sandbox buyer; never use real money in this test.
2. Confirm approval alone does not grant live Lite. The verified SALE.COMPLETED event should create a sandbox payment record. Sandbox records intentionally never grant live entitlements; SQL tests verify the equivalent live entitlement path.
3. Cancel or abandon checkout; retry an existing pending checkout and simultaneous requests. Confirm no duplicate subscriptions. A creating attempt reuses its durable request ID for up to 70 hours. Older unresolved attempts require manual reconciliation with PayPal before retrying; do not delete an uncertain attempt just to unblock checkout.
4. Confirm renewal, failed payment, suspended status, cancellation, full/partial refund and reversal. Resend the same webhook and reverse delivery order. Refund tombstones prevent late sale delivery from restoring refunded access. Status snapshots use PayPal timestamps so older deliveries cannot regress state.
5. Confirm cancellation retains a verified remaining paid period, then expires to Free. Download and edit existing manuscripts throughout. Paid periods are one calendar month from payment time, with month-end clamping; no access is extended on failed charges.
6. After the owner is satisfied, configure the **live** app/plan/webhook and redeploy. Perform the owner's limited live transaction/refund acceptance test, verify Lite badges and both PDF variants without attribution, and only then market paid Lite. No automatic live payment is performed by this code deployment.

Pause new checkout with PAYPAL_CHECKOUT_ENABLED=false. Keep the other configuration so existing subscribers can refresh/cancel. The PayPal automatic-payments link remains available if the app is unavailable.

## Operations and limits

Monitor failed webhook deliveries in PayPal and Vercel; replay failed deliveries before their retry window expires. There is no scheduled reconciliation worker yet: browser refresh updates subscription status but never manufactures payment entitlements. A missing payment webhook must be replayed. Keep webhook monitoring part of the launch routine.

All new billing tables have RLS; only the service role writes. Authors can read only their own records, and cannot reserve checkout or forge payment events. PDF generation runs in the browser, so removal of attribution is a product feature, not DRM. Paid access is checked against current verified database entitlement at PDF generation; a previously downloaded PDF is not altered when a subscription expires.

The introduction video is an optional popup on the homepage and dashboard. No YouTube connection or thumbnail loads until the author presses Play; playback uses the standard youtube.com embed with autoplay disabled so the viewer starts playback in the player and stops when the dialog closes. Verify video visibility and embedding permissions in YouTube Studio if playback is unavailable.
