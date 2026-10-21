import { rememberProviderKey, forgetProviderKey, loadProviderKeys } from '../lib/provider-vault';
import { normalizeOtherBaseUrl } from '../lib/other-provider';
import { create } from 'zustand';

export type ProviderId = 'gemini' | 'openai' | 'openrouter' | 'anthropic' | 'xai' | 'other';
export const PROVIDERS: { id: ProviderId; name: string; description: string; defaultModel: string; keyUrl: string }[] = [
  { id: 'gemini', name: 'Google Gemini', description: 'Draft and edit chapters with Gemini.', defaultModel: 'gemini-3.8-flash', keyUrl: 'https://aistudio.google.com/api-keys' },
  { id: 'openai', name: 'OpenAI', description: 'Write with GPT models and generate cover artwork.', defaultModel: 'gpt-4.1-mini', keyUrl: 'https://platform.openai.com/api-keys' },
  { id: 'openrouter', name: 'OpenRouter', description: 'Use Claude, Llama and other models through one API.', defaultModel: 'openai/gpt-4.1-mini', keyUrl: 'https://openrouter.ai/settings/keys' },
  { id: 'anthropic', name: 'Anthropic', description: 'Use Claude directly with your Anthropic API key.', defaultModel: '', keyUrl: 'https://platform.claude.com/settings/keys' },
  { id: 'xai', name: 'xAI', description: 'Write with Grok through the direct xAI API.', defaultModel: '', keyUrl: 'https://console.x.ai/' },
  { id: 'other', name: 'Other', description: 'Connect a public OpenAI-compatible text API.', defaultModel: '', keyUrl: '' },
];
export interface ProviderConfig { model: string; baseUrl?: string; remembered?: boolean; failures?: number; testedAt?: string; models?: string[] }
export interface MCPServer { id: string; name: string; url: string; enabled: boolean }
export interface Preferences { genre: string; tone: string; targetWordCount: number; maxOutputTokens: number }
interface IntegrationState {
  owner: string | null;
  provider: ProviderId;
  providers: Record<ProviderId, ProviderConfig>;
  preferences: Preferences;
  servers: MCPServer[];
  revision: number;
  credentialsLoading: boolean;
  rememberProvider: (id: ProviderId, remember: boolean) => Promise<void>;
  forgetProvider: (id: ProviderId) => Promise<void>;
  recordProviderResult: (id: ProviderId, succeeded: boolean) => void;
  error: string | null;
  configureOwner: (id: string | null) => void;
  saveProvider: (id: ProviderId, model: string, key: string, baseUrl?: string) => void;
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
let credentialEpoch=0;
let credentialRestore: Promise<void> = Promise.resolve();
export const waitForCredentials = () => credentialRestore;
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
  owner: null, provider: 'gemini', providers: defaults(), preferences: { ...defaultPreferences }, servers: [], revision: 0, error: null, credentialsLoading: false,
  configureOwner: owner => {
    if (owner === get().owner) return;
    credentials.clear();
    const epoch=++credentialEpoch;
    let saved: Partial<IntegrationState> = {};
    try { if (owner) saved = JSON.parse(localStorage.getItem(storageKey(owner)) || '{}'); } catch { /* Recover to defaults without reading credentials. */ }
    const providers = defaults();
    for (const p of PROVIDERS) {
      const model = saved.providers?.[p.id]?.model;
      if (typeof model === 'string' && model.length < 160) providers[p.id] = { model, ...(saved.providers?.[p.id]?.remembered === false ? { remembered:false } : {}), failures: Math.max(0, Math.min(3, Number(saved.providers?.[p.id]?.failures) || 0)), ...(p.id === 'other' && typeof saved.providers?.other?.baseUrl === 'string' ? { baseUrl: saved.providers.other.baseUrl } : {}) };
    }
    set({ owner, provider: PROVIDERS.some(p => p.id === saved.provider) ? saved.provider : 'gemini', providers,
      preferences: { ...defaultPreferences, ...saved.preferences }, servers: Array.isArray(saved.servers) ? saved.servers.filter(s => typeof s.id === 'string' && typeof s.name === 'string' && typeof s.url === 'string').slice(0, 20) : [], error: null, revision: get().revision + 1 });
    if (owner) {
      set({ credentialsLoading:true });
      credentialRestore=loadProviderKeys(owner).then(records=>{
        if (get().owner!==owner || epoch!==credentialEpoch) return;
        for(const record of records){
          const provider=PROVIDERS.find(p=>p.id===record.provider)?.id;
          if(!provider || (provider==='other' && record.endpoint!==get().providers.other.baseUrl)) continue;
          if(!readCredential(provider)) writeCredential(owner,provider,record.secret);
          set(s=>({providers:{...s.providers,[provider]:{...s.providers[provider],remembered:true}},revision:s.revision+1}));
        }
      }).catch(()=>{if(get().owner===owner && epoch===credentialEpoch) set({error:'Remembered keys could not be restored. They have not been removed. Open AI Providers to check or re-save them.'});})
        .finally(()=>{if(get().owner===owner && epoch===credentialEpoch) set({credentialsLoading:false});});
    } else { credentialRestore=Promise.resolve(); set({credentialsLoading:false}); }
  },
  rememberProvider: async (id,remember) => {
    const owner=get().owner;const secret=readCredential(id);
    if(!owner) throw new Error('Sign in before saving a key.');
    if(remember && secret) await rememberProviderKey(owner,id,secret,id==='other' ? get().providers.other.baseUrl : '');
    else await forgetProviderKey(owner,id);
    if(get().owner===owner) {set(s=>({providers:{...s.providers,[id]:{...s.providers[id],remembered:remember && !!secret}}}));persist(get());}
  },
  forgetProvider: async id => {
    const owner=get().owner;if(!owner) return;
    await forgetProviderKey(owner,id);
    if(get().owner!==owner) return;
    writeCredential(owner,id,'');
    set(s=>({providers:{...s.providers,[id]:{model:s.providers[id].model,baseUrl:s.providers[id].baseUrl}},revision:s.revision+1}));persist(get());
  },
  recordProviderResult: (id,succeeded) => {
    set(s=>({providers:{...s.providers,[id]:{...s.providers[id],failures:succeeded ? 0 : Math.min(3,(s.providers[id].failures || 0)+1)}}}));persist(get());
  },
  saveProvider: (id, model, key, baseUrl) => {
    if (!get().owner) throw new Error('Sign in before configuring providers.');
    const endpoint = id === 'other' ? normalizeOtherBaseUrl(baseUrl) : undefined;
    const previous=get().providers[id];
    const sameConfiguration=readCredential(id)===key.trim() && previous.model===model.trim() && previous.baseUrl===endpoint;
    writeCredential(get().owner!, id, key);
    set(s => ({ providers: { ...s.providers, [id]: { model: model.trim(), failures:sameConfiguration ? previous.failures : 0, ...(endpoint ? { baseUrl:endpoint } : {}) } }, revision: s.revision + 1 })); persist(get());
  },
  markTested: (id, models) => { set(s => ({ providers: { ...s.providers, [id]: { ...s.providers[id], testedAt: new Date().toISOString(), models } } })); persist(get()); },
  selectProvider: provider => {
    if (!readCredential(provider) || !get().providers[provider].model) throw new Error('Save a key for this provider before making it your default.');
    set({ provider }); persist(get());
  },
  setPreferences: preferences => { set({ preferences }); persist(get()); },
  saveServer: (server, token) => {
    if (!get().owner) throw new Error('Sign in before adding tools.');
    if (token !== undefined) writeCredential(get().owner!, `mcp:${server.id}`, token);
    set(s => ({ servers: [...s.servers.filter(item => item.id !== server.id), server], revision: s.revision + 1 })); persist(get());
  },
  removeServer: id => { if (get().owner) writeCredential(get().owner!, `mcp:${id}`, ''); set(s => ({ servers: s.servers.filter(item => item.id !== id) })); persist(get()); },
  clearKeys: () => { credentials.clear(); set(s => ({ providers: Object.fromEntries(PROVIDERS.map(p => [p.id, { model: s.providers[p.id].model, ...(s.providers[p.id].baseUrl ? { baseUrl:s.providers[p.id].baseUrl } : {}) }])) as Record<ProviderId, ProviderConfig>, revision: s.revision + 1 })); persist(get()); },
}));
