import { supabase } from './supabase';
import { readCredential, useIntegrationStore } from '../store/useIntegrationStore';
import type { ProviderId } from '../store/useIntegrationStore';
export type AIProvider = ProviderId;
interface GenerationOptions { provider?: ProviderId; modelOverride?: string; temperature?: number }
export async function requestAI(action: 'test' | 'generate' | 'image', provider: ProviderId, options: { prompt?: string; model?: string; apiKey?: string; maxOutputTokens?: number } = {}) {
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session) throw new Error('Please sign in to use AI tools.');
  const apiKey = options.apiKey ?? readCredential(provider);
  if (!apiKey) throw new Error(`Add your ${provider} key in Settings → AI Providers. Keys are cleared when you reload or sign out.`);
  const response = await fetch('/api/ai', {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${data.session.access_token}` },
    body: JSON.stringify({ action, provider, apiKey, ...options }), signal: AbortSignal.timeout(action === 'image' ? 180000 : 90000),
  });
  const body = await response.json().catch(() => ({ error: 'The AI service returned an invalid response.' }));
  if (!response.ok) throw new Error(body.error || 'AI request failed.');
  return body as { text?: string; models?: string[]; image?: string };
}
export class MultiProviderAI {
  static async generate(prompt: string, options?: GenerationOptions): Promise<{ text: string; providerUsed: ProviderId }> {
    const settings = useIntegrationStore.getState();
    const provider = options?.provider || settings.provider;
    const model = options?.modelOverride || settings.providers[provider].model;
    const result = await requestAI('generate', provider, { prompt, model, maxOutputTokens: settings.preferences.maxOutputTokens });
    if (!result.text?.trim()) throw new Error('The provider returned no text. Try a different model.');
    return { text: result.text, providerUsed: provider };
  }
}
