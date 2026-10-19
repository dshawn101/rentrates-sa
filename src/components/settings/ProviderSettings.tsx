import { useState } from 'react';
import { CheckCircle2, ExternalLink, KeyRound, ShieldCheck } from 'lucide-react';
import { PROVIDERS, readCredential, useIntegrationStore } from '../../store/useIntegrationStore';
import type { ProviderId } from '../../store/useIntegrationStore';
import { requestAI } from '../../lib/ai-provider';
import { GlassCard } from '../ui/GlassCard';
import { GlassInput } from '../ui/GlassInput';
import { GlassButton } from '../ui/GlassButton';
export function ProviderSettings() {
  const settings = useIntegrationStore();
  const [editing, setEditing] = useState<ProviderId>(settings.provider);
  const [key, setKey] = useState(() => readCredential(editing));
  const [model, setModel] = useState(settings.providers[editing].model);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [failure, setFailure] = useState(false);
  const choose = (id: ProviderId) => { setEditing(id); setKey(readCredential(id)); setModel(settings.providers[id].model); setMessage(''); };
  const current = PROVIDERS.find(p => p.id === editing)!;
  const save = () => {
    if (!model.trim() || !/^[\w.\-/:]{1,160}$/.test(model.trim())) throw new Error('Enter a valid model ID.');
    settings.saveProvider(editing, model, key); setFailure(false); setMessage(key ? 'Saved for this page session. Test the key to verify access.' : 'Key removed from this session.');
  };
  const test = async () => {
    setBusy(true); setMessage('');
    try {
      save();
      const result = await requestAI('test', editing);
      const models = result.models || [];
      settings.markTested(editing, models); setFailure(false);
      setMessage(`Key accepted. ${models.length} models listed. ${models.includes(model) ? 'Your selected model is listed.' : 'Check your model ID against the available models.'} Generation is billed separately and may require additional model permissions.`);
    } catch (error) { setFailure(true); setMessage(error instanceof Error ? error.message : 'Connection test failed.'); }
    finally { setBusy(false); }
  };
  return <div className="space-y-6">
    <GlassCard className="p-6 space-y-3">
      <label className="block text-white font-semibold" htmlFor="default-writing-provider">Default AI provider</label>
      <select id="default-writing-provider" className="glass-select w-full" value={settings.provider} onChange={e => { settings.selectProvider(e.target.value as ProviderId); setFailure(false); setMessage('Default AI provider updated.'); }}>
        {PROVIDERS.map(p => <option key={p.id} value={p.id} disabled={!readCredential(p.id)}>{p.name}{readCredential(p.id) ? '' : ' · save a key first'}</option>)}
      </select>
      <p className="text-sm text-slate-400">Save your BYOK key below, then choose your default for chapter drafting and editing.</p>
      <p className="text-xs text-slate-400">System fallback: Google Gemini, using your own saved Gemini key and model. If another provider fails, we retry once with Gemini. After a successful fallback, Gemini becomes your default. Both attempts may incur provider charges.</p>
      <p role="status" className={`text-xs ${readCredential('gemini') ? 'text-emerald-300' : 'text-amber-200'}`}>{readCredential('gemini') ? 'Gemini fallback key saved for this session. Use Test key below to check access.' : 'Gemini fallback unavailable — save your Gemini key to enable it. Keys clear on refresh or sign-out.'}</p>
    </GlassCard>
    <div className="grid sm:grid-cols-3 gap-4">{PROVIDERS.map(p => {
      const configured = !!readCredential(p.id);
      const tested = configured && !!settings.providers[p.id].testedAt;
      return <button key={p.id} onClick={() => choose(p.id)} className={`text-left rounded-2xl border p-5 transition ${editing === p.id ? 'border-emerald-400/60 bg-emerald-400/5' : 'border-white/10 bg-white/[0.025] hover:bg-white/5'}`}>
        <div className="flex justify-between gap-2"><span className="font-semibold text-white">{p.name}</span>{settings.provider === p.id && <span className="text-[10px] text-emerald-300">DEFAULT</span>}</div>
        <p className="text-xs text-slate-400 mt-3 min-h-10">{p.description}</p>
        <span className={`mt-4 inline-flex items-center gap-1 text-xs ${tested ? 'text-emerald-300' : 'text-slate-400'}`}>{tested ? <CheckCircle2 size={13} /> : <KeyRound size={13} />}{tested ? 'Key verified' : configured ? 'Key saved · untested' : 'Needs key'}</span>
      </button>;
    })}</div>
    <GlassCard className="p-6 md:p-8 space-y-5">
      <div className="flex flex-wrap justify-between gap-4"><div><h3 className="text-xl font-semibold text-white">{current.name}</h3><p className="text-sm text-slate-400 mt-1">Add your key, select a model, then test access.</p></div><a href={current.keyUrl} target="_blank" rel="noreferrer" className="text-sm text-emerald-300 flex items-center gap-2">Get an API key <ExternalLink size={14} /></a></div>
      <GlassInput label={`${current.name} API key`} aria-label={`${current.name} API key`} type="password" autoComplete="off" value={key} onChange={e => setKey(e.target.value)} placeholder="Paste your own provider API key" />
      <GlassInput label="Model ID" aria-label="Model ID" value={model} onChange={e => setModel(e.target.value)} list="provider-models" />
      <datalist id="provider-models">{settings.providers[editing].models?.map(id => <option key={id} value={id} />)}</datalist>
      {(key !== readCredential(editing) || model !== settings.providers[editing].model) && <p className="text-xs text-amber-200">Unsaved changes. Save before using this configuration.</p>}
      <div className="flex flex-wrap gap-3"><GlassButton disabled={busy} onClick={() => { try { save(); } catch (e) { setFailure(true); setMessage(e instanceof Error ? e.message : 'Save failed.'); } }}>Save key & model</GlassButton><GlassButton variant="secondary" disabled={!key.trim()} isLoading={busy} onClick={test}>Test key · no generation</GlassButton><GlassButton variant="ghost" disabled={busy || !readCredential(editing)} onClick={() => { settings.selectProvider(editing); setFailure(false); setMessage(`${current.name} is now your default AI provider.`); }}>Set as default</GlassButton></div>
      {message && <p role={failure ? 'alert' : 'status'} className={`text-sm rounded-xl p-4 ${failure ? 'bg-red-500/10 text-red-200' : 'bg-emerald-500/10 text-emerald-200'}`}>{message}</p>}
    </GlassCard>
    <div className="flex gap-3 text-xs text-slate-400 rounded-xl border border-white/10 p-4"><ShieldCheck size={20} className="shrink-0 text-emerald-300" /><p>Keys stay in page memory and clear on refresh or sign-out. Non-secret model preferences stay on this browser, separately for each account. Your key and prompt pass through this app’s authenticated relay to the provider you select; keys are not saved in the database. ChatGPT, Claude and Gemini app subscriptions do not supply API credits. Chapter writing requests can retry once with your saved Gemini configuration if your selected provider fails. This shares the same prompt with Google Gemini. Key tests and image generation never switch providers.</p></div>
    {!!localStorage.getItem('userGeminiKey') && <GlassButton variant="secondary" onClick={() => { const legacy = localStorage.getItem('userGeminiKey') || ''; settings.saveProvider('gemini', settings.providers.gemini.model, legacy); localStorage.removeItem('userGeminiKey'); choose('gemini'); }}>Import previously saved Gemini key and remove its old browser copy</GlassButton>}
  </div>;
}
