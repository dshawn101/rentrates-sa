import { create } from 'zustand';

export type ProviderId = 'gemini' | 'openai' | 'openrouter';
export const PROVIDERS: { id: ProviderId; name: string; description: string; defaultModel: string; keyUrl: string }[] = [
  { id: 'gemini', name: 'Google Gemini', description: 'Draft and edit chapters with Gemini.', defaultModel: 'gemini-3.8-flash', keyUrl: 'https://aistudio.google.com/api-keys' },
  { id: 'openai', name: 'OpenAI', description: 'Write with GPT models and generate cover artwork.', defaultModel: 'gpt-4.1-mini', keyUrl: 'https://platform.openai.com/api-keys' },
  { id: 'openrouter', name: 'OpenRouter', description: 'Use Claude, Llama and other models through one API.', defaultModel: 'openai/gpt-4.1-mini', keyUrl: 'https://openrouter.ai/settings/keys' },
];
export interface ProviderConfig { model: string; testedAt?: string; models?: string[] }
export interface MCPServer { id: string; name: string; url: string; enabled: boolean }
export interface Preferences { genre: string; tone: string; targetWordCount: number; maxOutputTokens: number }
interface IntegrationState {
  owner: string | null;
  provider: ProviderId;
  providers: Record<ProviderId, ProviderConfig>;
  preferences: Preferences;
  servers: MCPServer[];
  revision: number;
  error: string | null;
  configureOwner: (id: string | null) => void;
  saveProvider: (id: ProviderId, model: string, key: string) => void;
  markTested: (id: ProviderId, models: string[]) => void;
  selectProvider: (id: ProviderId) => void;
  setPreferences: (prefs: Preferences) => void;
  saveServer: (server: MCPServer, token?: string) => void;
  removeServer: (id: string) => void;
  clearKeys: () => void;
}
const defaults = () => Object.fromEntries(PROVIDERS.map(p => [p.id, { model: p.defaultModel }])) as Record<ProviderId, ProviderConfig>;
const defaultPreferences: Preferences = { genre: 'non-fiction', tone: 'professional', targetWordCount: 50000, maxOutputTokens: 2500 };
const storageKey = (owner: string) => `puble:integrations:${owner}`;
const credentialKey = (owner: string, name: string) => `puble:credentials:${owner}:${name}`;
const credentials = new Map<string, string>();
export function readCredential(name: string): string {
  const owner = useIntegrationStore.getState().owner;
  if (!owner) return '';
  return credentials.get(credentialKey(owner, name)) || '';
}
function writeCredential(owner: string, name: string, value: string) {
  const key = credentialKey(owner, name);
  if (value.trim()) credentials.set(key, value.trim()); else credentials.delete(key);
}
function persist(state: IntegrationState) {
  if (!state.owner) return;
  try { localStorage.setItem(storageKey(state.owner), JSON.stringify({ provider: state.provider, providers: state.providers, preferences: state.preferences, servers: state.servers })); }
  catch { useIntegrationStore.setState({ error: 'Settings could not be saved in this browser. Check available storage.' }); }
}
export const useIntegrationStore = create<IntegrationState>((set, get) => ({
  owner: null, provider: 'gemini', providers: defaults(), preferences: { ...defaultPreferences }, servers: [], revision: 0, error: null,
  configureOwner: owner => {
    if (owner === get().owner) return;
    credentials.clear();
    let saved: Partial<IntegrationState> = {};
    try { if (owner) saved = JSON.parse(localStorage.getItem(storageKey(owner)) || '{}'); } catch { /* Recover to defaults without reading credentials. */ }
    const providers = defaults();
    for (const p of PROVIDERS) {
      const model = saved.providers?.[p.id]?.model;
      if (typeof model === 'string' && model.length < 160) providers[p.id] = { model };
    }
    set({ owner, provider: PROVIDERS.some(p => p.id === saved.provider) ? saved.provider : 'gemini', providers,
      preferences: { ...defaultPreferences, ...saved.preferences }, servers: Array.isArray(saved.servers) ? saved.servers.filter(s => typeof s.id === 'string' && typeof s.name === 'string' && typeof s.url === 'string').slice(0, 20) : [], error: null, revision: get().revision + 1 });
  },
  saveProvider: (id, model, key) => {
    if (!get().owner) throw new Error('Sign in before configuring providers.');
    writeCredential(get().owner!, id, key);
    set(s => ({ providers: { ...s.providers, [id]: { model: model.trim() } }, revision: s.revision + 1 })); persist(get());
  },
  markTested: (id, models) => { set(s => ({ providers: { ...s.providers, [id]: { ...s.providers[id], testedAt: new Date().toISOString(), models } } })); persist(get()); },
  selectProvider: provider => { set({ provider }); persist(get()); },
  setPreferences: preferences => { set({ preferences }); persist(get()); },
  saveServer: (server, token) => {
    if (!get().owner) throw new Error('Sign in before adding tools.');
    if (token !== undefined) writeCredential(get().owner!, `mcp:${server.id}`, token);
    set(s => ({ servers: [...s.servers.filter(item => item.id !== server.id), server], revision: s.revision + 1 })); persist(get());
  },
  removeServer: id => { if (get().owner) writeCredential(get().owner!, `mcp:${id}`, ''); set(s => ({ servers: s.servers.filter(item => item.id !== id) })); persist(get()); },
  clearKeys: () => { credentials.clear(); set(s => ({ providers: Object.fromEntries(PROVIDERS.map(p => [p.id, { model: s.providers[p.id].model }])) as Record<ProviderId, ProviderConfig>, revision: s.revision + 1 })); persist(get()); },
}));
