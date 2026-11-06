import type { IncomingMessage, ServerResponse } from 'node:http';

export default async function handler(req: IncomingMessage & { body?: unknown }, res: ServerResponse) {
  const finish = (status: number) => { res.statusCode = status; res.end(); };
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return finish(405); }
  if (req.headers.origin !== 'https://www.publestudio.com') return finish(403);
  const event = req.body;
  if (event !== 'start' && event !== 'export' && event !== 'signup') return finish(400);
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) return finish(503);
  try {
    const result = await fetch(new URL('/rest/v1/series_bible_event_input', url), {
      method: 'POST',
      headers: { apikey: key, ...(key.startsWith('eyJ') ? { Authorization: 'Bearer ' + key } : {}), 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify({ event }),
      redirect: 'error',
      signal: AbortSignal.timeout(5000),
    });
    return finish(result.ok ? 204 : 503);
  } catch {
    return finish(503);
  }
}
