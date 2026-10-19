import type { IncomingMessage, ServerResponse } from 'node:http';
import { runAI, validateAIRequest } from '../server/ai-core.js';
export const config = { maxDuration: 180 };
export default async function handler(req: IncomingMessage & { body?: unknown }, res: ServerResponse) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'application/json');
  const reply = (status: number, body: object) => { res.statusCode = status; res.end(JSON.stringify(body)); };
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return reply(405, { error: 'Use POST.' }); }
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) return reply(503, { error: 'The site account service is not configured.' });
  const authorization = req.headers.authorization;
  if (!authorization?.startsWith('Bearer ')) return reply(401, { error: 'Sign in before using AI tools.' });
  // Validate the caller with Supabase; never trust a decoded, unverified JWT.
  try {
    const auth = await fetch(`${url.replace(/\/$/, '')}/auth/v1/user`, { headers: { apikey: key, Authorization: authorization }, redirect: 'error', signal: AbortSignal.timeout(15000) });
    if (!auth.ok) return reply(401, { error: 'Your session expired. Please sign in again.' });
    let body = req.body;
    if (typeof body === 'string') body = JSON.parse(body);
    if (!body) {
      let raw = '';
      for await (const chunk of req) { raw += chunk; if (raw.length > 150000) return reply(413, { error: 'Request too large.' }); }
      body = JSON.parse(raw);
    }
    let input;
    try { input = validateAIRequest(body); } catch (error) { return reply(400, { error: error instanceof Error ? error.message : 'Invalid request.' }); }
    // User keys are held only for this request, sent only to the selected fixed provider,
    // and never logged, cached, written to Supabase, or shared with another provider by this relay.
    return reply(200, await runAI(input));
  } catch (error) {
    const message = error instanceof Error && /^(The provider|Provider quota|This model|No image)/.test(error.message) ? error.message : 'The provider could not be reached or timed out. Retry when your connection is stable.';
    return reply(502, { error: message });
  }
}
