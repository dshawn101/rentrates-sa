# Production activation email configuration

The app passes an explicit emailRedirectTo for signup and resend. All public deployments return to the canonical production URL; localhost/loopback development remains local. Browser callbacks containing Supabase error codes are sent to the sign-in recovery screen, where authors may request another signup activation email. Successful session token callbacks are left for supabase-js; no token is logged or displayed.

## Supabase project settings (requires dashboard access)

Project: chcjdbanuhrbqgkztsfb.

Open Authentication → URL Configuration:

- Site URL: `https://www.publestudio.com`
- Allowed redirect URLs:
  - `https://www.publestudio.com/auth/login`
  - `https://www.publestudio.com/auth/login?next=billing`
- Preserve any other specifically required legitimate redirects. Avoid broad preview-domain wildcards for production. Local development URLs may remain explicit entries if actually used; localhost must not be the production Site URL.

Open Authentication → Emails → Confirm signup (in some dashboard versions: Email Templates):

- The confirmation button should use `{{ .ConfirmationURL }}` so Supabase verifies the token before returning to the allowed redirect.
- Do not hardcode localhost, link straight to `{{ .SiteURL }}` without token verification, or replace the generated verification URL with a normal login URL.
- If the template constructs a custom confirmation endpoint with TokenHash, it needs a matching verification handler; this app uses the built-in verification flow instead.
- Keep email confirmation enabled. Do not bypass validation by marking users confirmed or increasing token lifetimes to mask this error.

Existing expired/used links cannot be repaired by changing these settings. Save the configuration, then request a fresh activation email using the site's sign-in or check-email screen. Open only the newest message. First try signing in if the link may have been used already. If brand-new links fail immediately, inspect Supabase Auth logs and investigate whether email link scanning consumed the one-time link or whether email tracking rewrote it; do not assume expiry is the only cause.

## Verification

1. Read back the saved Site URL, exact redirect allowlist and confirmation template.
2. With an owner-supplied test mailbox, sign up on the live site. Confirm that the generated email verification URL has a production redirect_to, not localhost. Do not paste a live confirmation token into chat or logs.
3. Open the email once; verify a session and the correct dashboard/billing continuation. Reusing it should show recovery, not silently mark another account confirmed.
4. Request another email with the resend form. Check cooldown and rate-limit handling. Check already-confirmed and unknown-address responses remain generic.

No real email was sent or token consumed by the automated tests. Dashboard settings still require a signed-in operator if no management-auth session is available.
