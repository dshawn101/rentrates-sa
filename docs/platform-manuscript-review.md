# Platform manuscript review beta

In Series Bible, choose an existing book and upload DOCX, TXT or Markdown. Parsing and preview are local. Both actions append the chapters to the existing outline. **Import and review** opens a separate review panel for the entire saved book. Only a subsequent consent and Review my book action sends text to AI. The review provides exact source excerpts and chapter links; it never edits chapters.

Platform review is selected by default. BYOK is a separate opt-in choice; switching clears consent and failed jobs never switch providers automatically. Drafting, rewriting and artwork continue to use the user's existing AI setup.

## Enable

1. Apply the platform review budget migration to the project's Supabase database. The ledger and reservation RPC are service-role-only. No manuscript or findings are stored there.
2. Create a **dedicated** OpenRouter key with a **USD 10 lifetime credit limit** (no reset). Disable optional input/output logging for the key/workspace. Use only for this feature; separate preview/staging credentials.
3. Set `OPENROUTER_REVIEW_KEY` as a Vercel Secret (never `VITE_`), `OPENROUTER_REVIEW_MODEL` to one approved exact model ID, and reuse the existing server-only `SUPABASE_SECRET_KEY`. The approved model must support JSON output, a context large enough for the capped input, and a zero-retention route within $0.50/M input and $2/M output, with no request fee. Check the route in OpenRouter before choosing the model; no model is selected by the browser.
4. Enable `PLATFORM_REVIEW_ENABLED=true` in a test deployment and test with a short synthetic draft. Check the credit and usage dashboards, quoted evidence, and duplicate-request rejection before enabling production. Redeploy after setting variables. Leave disabled if the key/model or migration is missing.

The server accepts only a book ID, snapshot hash and affirmative consent. It validates the session and reads the saved book with the user's permissions. The snapshot is capped at 60 KB of serialized manuscript data and 100 chapters, with a 2,500-token output limit. One attempt per account per UTC day. The database atomically reserves $0.10 per attempt from a $10 lifetime beta pool; failures are not automatically released, so concurrency and retries cannot reuse the same reservation. This is a conservative application budget, not a quote. The dedicated provider key's credit limit is the external spend guard. Provider-reported costs are recorded when available; inspect the ledger and provider dashboard before expanding the beta. Set the flag to false to stop new review requests.
