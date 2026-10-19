import { beforeEach, afterEach, expect, it, vi } from 'vitest';
import handler from '../api/ai';
import type { IncomingMessage, ServerResponse } from 'node:http';
let status: number; let output: string;
const response = () => ({ setHeader: vi.fn(), set statusCode(value: number) { status = value; }, end: (body: string) => { output = body; } }) as unknown as ServerResponse;
beforeEach(() => { status = 0; output = ''; vi.stubEnv('VITE_SUPABASE_URL','https://project.supabase.co'); vi.stubEnv('VITE_SUPABASE_ANON_KEY','public-key'); });
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });
it('rejects anonymous requests without contacting an AI provider', async () => {
  const send = vi.fn(); vi.stubGlobal('fetch',send);
  await handler({ method:'POST',headers:{},body:{} } as IncomingMessage,response());
  expect(status).toBe(401); expect(send).not.toHaveBeenCalled();
});
it('rejects an invalid account token before sending user keys anywhere', async () => {
  const send = vi.fn().mockResolvedValue(new Response('{}',{status:401})); vi.stubGlobal('fetch',send);
  await handler({ method:'POST',headers:{authorization:'Bearer invalid'},body:{provider:'openai',action:'generate',apiKey:'sk-secret',prompt:'Text'} } as IncomingMessage,response());
  expect(status).toBe(401); expect(send).toHaveBeenCalledTimes(1);
  expect(send.mock.calls[0][0]).toBe('https://project.supabase.co/auth/v1/user');
  expect(output).not.toContain('sk-secret');
});
