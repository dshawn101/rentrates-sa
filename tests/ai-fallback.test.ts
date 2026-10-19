// @vitest-environment jsdom
import { beforeEach, afterEach, expect, it, vi } from 'vitest';
import { MultiProviderAI, requestAI } from '../src/lib/ai-provider';
import { useIntegrationStore } from '../src/store/useIntegrationStore';
const { getSession } = vi.hoisted(() => ({ getSession: vi.fn() }));
vi.mock('../src/lib/supabase', () => ({ supabase: { auth: { getSession } } }));
const send = vi.fn();
const response = (body: object, status = 200) => new Response(JSON.stringify(body), { status });
const payload = (index: number) => JSON.parse(send.mock.calls[index][1].body);
beforeEach(() => {
  localStorage.clear();
  useIntegrationStore.getState().configureOwner(null);
  const store = useIntegrationStore.getState();
  store.configureOwner('author');
  store.saveProvider('openai', 'primary-model', 'openai-own-key');
  store.saveProvider('gemini', 'gemini-own-model', 'gemini-own-key');
  store.selectProvider('openai');
  getSession.mockReset().mockResolvedValue({ data: { session: { access_token: 'session-token' } } });
  send.mockReset(); vi.stubGlobal('fetch', send);
});
afterEach(() => vi.unstubAllGlobals());
it('uses the selected default without fallback when it succeeds', async () => {
  send.mockResolvedValueOnce(response({ text: 'Primary draft' }));
  expect(await MultiProviderAI.generate('Draft')).toEqual({ text: 'Primary draft', providerUsed: 'openai', fallbackUsed: false });
  expect(send).toHaveBeenCalledTimes(1);
  expect(useIntegrationStore.getState().provider).toBe('openai');
});
it('retries once with Gemini’s own key and model, then persists it as default', async () => {
  send.mockResolvedValueOnce(response({ error: 'Provider quota reached' }, 502)).mockResolvedValueOnce(response({ text: 'Fallback draft' }));
  expect(await MultiProviderAI.generate('Same prompt')).toEqual({ text: 'Fallback draft', providerUsed: 'gemini', fallbackUsed: true });
  expect(payload(0)).toMatchObject({ provider: 'openai', apiKey: 'openai-own-key', model: 'primary-model' });
  expect(payload(1)).toMatchObject({ provider: 'gemini', apiKey: 'gemini-own-key', model: 'gemini-own-model', prompt: 'Same prompt' });
  expect(useIntegrationStore.getState().provider).toBe('gemini');
  expect(JSON.parse(localStorage.getItem('puble:integrations:author')!).provider).toBe('gemini');
});
it.each(['network', 'empty'])('falls back on %s failure', async kind => {
  if (kind === 'network') send.mockRejectedValueOnce(new TypeError('Failed to fetch'));
  else send.mockResolvedValueOnce(response({ text: ' ' }));
  send.mockResolvedValueOnce(response({ text: 'Recovered' }));
  expect((await MultiProviderAI.generate('Draft')).fallbackUsed).toBe(true);
});
it('does not loop or change the default if Gemini also fails', async () => {
  send.mockResolvedValue(response({ error: 'Quota reached' }, 502));
  await expect(MultiProviderAI.generate('Draft')).rejects.toThrow('both failed');
  expect(send).toHaveBeenCalledTimes(2);
  expect(useIntegrationStore.getState().provider).toBe('openai');
});
it('does not retry when Gemini is already the selected provider', async () => {
  useIntegrationStore.getState().selectProvider('gemini');
  send.mockResolvedValue(response({ error: 'Quota reached' }, 502));
  await expect(MultiProviderAI.generate('Draft')).rejects.toThrow('Quota reached');
  expect(send).toHaveBeenCalledTimes(1);
});
it('explains missing Gemini credentials without sending a second request', async () => {
  useIntegrationStore.getState().saveProvider('gemini', 'gemini-own-model', '');
  send.mockResolvedValue(response({ error: 'Quota reached' }, 502));
  await expect(MultiProviderAI.generate('Draft')).rejects.toThrow('needs your own Gemini key');
  expect(send).toHaveBeenCalledTimes(1);
});
it.each([400, 401, 403, 413])('does not fallback for relay status %s', async status => {
  send.mockResolvedValue(response({ error: 'Request rejected' }, status));
  await expect(MultiProviderAI.generate('Draft')).rejects.toThrow('Request rejected');
  expect(send).toHaveBeenCalledTimes(1);
});
it('does not fallback after sign-out or send the prompt with another account’s credentials', async () => {
  send.mockImplementationOnce(() => {
    useIntegrationStore.getState().configureOwner('other-author');
    useIntegrationStore.getState().saveProvider('gemini', 'other-model', 'other-secret-key');
    return Promise.resolve(response({ error: 'Provider failed' }, 502));
  });
  await expect(MultiProviderAI.generate('Private manuscript')).rejects.toThrow('account changed');
  expect(send).toHaveBeenCalledTimes(1);
});
it('never falls back for key tests or image generation', async () => {
  send.mockImplementation(() => Promise.resolve(response({ error: 'Provider failed' }, 502)));
  await expect(requestAI('test', 'openai')).rejects.toThrow('Provider failed');
  await expect(requestAI('image', 'openai', { model: 'gpt-image-1', prompt: 'Cover' })).rejects.toThrow('Provider failed');
  expect(send).toHaveBeenCalledTimes(2);
  expect(useIntegrationStore.getState().provider).toBe('openai');
});
it('never sends a prompt if the account changes while checking the session', async () => {
  getSession.mockImplementationOnce(async () => {
    useIntegrationStore.getState().configureOwner('other-author');
    return { data: { session: { access_token: 'other-token' } } };
  });
  await expect(MultiProviderAI.generate('Private manuscript')).rejects.toThrow('account changed');
  expect(send).not.toHaveBeenCalled();
});
it('preserves a different default selected while fallback is running', async () => {
  useIntegrationStore.getState().saveProvider('openrouter', 'router-model', 'router-key');
  send.mockResolvedValueOnce(response({ error: 'Provider failed' }, 502)).mockImplementationOnce(async () => {
    useIntegrationStore.getState().selectProvider('openrouter');
    return response({ text: 'Fallback draft' });
  });
  expect((await MultiProviderAI.generate('Draft')).fallbackUsed).toBe(true);
  expect(useIntegrationStore.getState().provider).toBe('openrouter');
});
