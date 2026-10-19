import { supabase } from './supabase';
import { readCredential, useIntegrationStore } from '../store/useIntegrationStore';
import type { ProviderId } from '../store/useIntegrationStore';
export type AIProvider = ProviderId;
class AISessionError extends Error {}
class AIRequestError extends Error {
  readonly status: number;
  constructor(message: string, status: number) { super(message); this.status = status; }
}
interface GenerationOptions { provider?: ProviderId; modelOverride?: string; temperature?: number }
export async function requestAI(action: 'test' | 'generate' | 'image', provider: ProviderId, options: { prompt?: string; model?: string; apiKey?: string; maxOutputTokens?: number } = {}) {
  const owner = useIntegrationStore.getState().owner;
  const { data, error } = await supabase.auth.getSession();
  if (useIntegrationStore.getState().owner !== owner) throw new AISessionError('Your account changed. Please try again.');
  if (error || !data.session) throw new AISessionError('Please sign in to use AI tools.');
  const apiKey = options.apiKey ?? readCredential(provider);
  if (!apiKey) throw new Error(`Add your ${provider} key in Settings → AI Providers. Keys are cleared when you reload or sign out.`);
  const response = await fetch('/api/ai', {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${data.session.access_token}` },
    body: JSON.stringify({ action, provider, apiKey, ...options }), signal: AbortSignal.timeout(action === 'image' ? 180000 : 90000),
  });
  const body = await response.json().catch(() => ({ error: 'The AI service returned an invalid response.' }));
  if (!response.ok) throw new AIRequestError(body.error || 'AI request failed.', response.status);
  return body as { text?: string; models?: string[]; image?: string };
}
export class MultiProviderAI {
  static async generate(prompt: string, options?: GenerationOptions): Promise<{ text: string; providerUsed: ProviderId; fallbackUsed: boolean }> {
    const settings = useIntegrationStore.getState();
    const owner = settings.owner;
    const provider = options?.provider || settings.provider;
    const assertOwner = () => {
      if (!owner || useIntegrationStore.getState().owner !== owner) throw new AISessionError('Your account changed. Please try again.');
    };
    const generate = async (id: ProviderId, model: string) => {
      assertOwner();
      const result = await requestAI('generate', id, { prompt, model, maxOutputTokens: settings.preferences.maxOutputTokens });
      assertOwner();
      if (!result.text?.trim()) throw new Error('The provider returned no text. Try a different model.');
      return result.text;
    };
    try {
      const text = await generate(provider, options?.modelOverride || settings.providers[provider].model);
      return { text, providerUsed: provider, fallbackUsed: false };
    } catch (error) {
      // Never retry an expired session, invalid input, or a request under another account.
      assertOwner();
      if (error instanceof AISessionError || (error instanceof AIRequestError && [400, 401, 403, 413].includes(error.status)) || provider === 'gemini') throw error;
      if (!readCredential('gemini')) throw new Error('Your selected provider failed. Gemini fallback needs your own Gemini key in Settings → AI Providers. Your writing has not changed.');
      try {
        // Gemini uses its own credential and saved model, never the failed provider's key/model.
        const text = await generate('gemini', settings.providers.gemini.model);
        // Respect a new default chosen while this request was in flight.
        if (useIntegrationStore.getState().provider === provider) useIntegrationStore.getState().selectProvider('gemini');
        return { text, providerUsed: 'gemini', fallbackUsed: true };
      } catch {
        assertOwner();
        throw new Error('Your selected provider and Gemini fallback both failed. Check your keys, model access and quotas in Settings → AI Providers. Your writing has not changed.');
      }
    }
  }
}
