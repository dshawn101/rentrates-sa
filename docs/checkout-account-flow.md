# Lite checkout account continuation

The account step identifies the author before PayPal approval. It does not create a paid subscription.

1. Lite sends the author to `/billing`. An unauthenticated author is sent to `/auth/login?next=billing`.
2. Sign-in and signup links preserve only the fixed `billing` continuation. Arbitrary URLs/paths are ignored, avoiding an open redirect.
3. Signup passes an explicit Supabase `emailRedirectTo` of `https://www.publestudio.com/auth/login?next=billing` on the production domain. Normal free signup uses `/auth/login`.
4. A signup response without a session opens `/auth/signup?next=billing&checkEmail=1`, with persistent confirmation instructions. No email or password is stored in that URL. Authors can confirm in a new tab/device, return to sign in, or use a different email without losing the Lite continuation.
5. A confirmed session arriving at the callback goes to billing; a signed-out author sees the Lite-specific sign-in explanation and continues to billing after signing in. An already signed-in author skips account forms.
6. Billing presents the monthly price and terms, and requires a separate action before opening PayPal. Verified payment notifications control Lite entitlement; query parameters and account creation never grant paid access.

## Required hosted Supabase Auth URL configuration

Project: `chcjdbanuhrbqgkztsfb` → Authentication → URL Configuration.

- Site URL: `https://www.publestudio.com`
- Add exact Redirect URLs: `https://www.publestudio.com/auth/login` and `https://www.publestudio.com/auth/login?next=billing`.
- Preserve existing redirects needed by other authorized environments; do not add a broad arbitrary-domain wildcard.
- The confirmation email should use Supabase's `{{ .ConfirmationURL }}` so its `redirect_to` is preserved. A template hard-coded to `{{ .SiteURL }}` alone loses the continuation.

An unauthenticated verification request with a deliberately invalid token checks the redirect configuration without creating an account, sending an email or authenticating anyone. On initial inspection it returned the default `http://localhost:3000/` instead of the requested production callback. Repeat that check after updating the hosted settings; a successful configuration check redirects to the intended callback with an error fragment for the deliberately invalid token.

Tests mock signup/session responses and cover confirmation pending, immediate sessions, returning signed-in authors, login/signup switches, page refresh, and invalid continuation targets. No actual signup or payment is performed by those tests. A real confirmation-email acceptance test still needs the owner's dedicated test account.
