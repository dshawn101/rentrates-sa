import { useEffect, useState } from 'react';
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
  const [baseUrl, setBaseUrl] = useState(settings.providers[editing].baseUrl || '');
  const [remember, setRemember] = useState(true);
  useEffect(() => { if (!settings.credentialsLoading) { setKey(readCredential(editing)); setRemember(settings.providers[editing].remembered ?? true); } }, [editing, settings.credentialsLoading]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [failure, setFailure] = useState(false);
  const choose = (id: ProviderId) => { setEditing(id); setKey(readCredential(id)); setModel(settings.providers[id].model); setBaseUrl(settings.providers[id].baseUrl || ''); setMessage(''); };
  const current = PROVIDERS.find(p => p.id === editing)!;
  const save = async (requireModel = true) => {
    if ((requireModel || model.trim()) && !/^[\w.\-/:]{1,160}$/.test(model.trim())) throw new Error('Enter a valid model ID.');
    settings.saveProvider(editing, model, key, baseUrl);
    await settings.rememberProvider(editing, remember);
    setFailure(false); setMessage(key ? (remember ? 'Key remembered on this device. Test it to verify access.' : 'Key saved for this session only.') : 'Key removed from this device and session.');
  };
  const test = async () => {
    setBusy(true); setMessage('');
    try {
      await save(false);
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
        {PROVIDERS.map(p => <option key={p.id} value={p.id} disabled={!readCredential(p.id) || !settings.providers[p.id].model}>{p.name}{readCredential(p.id) ? '' : ' · save a key first'}</option>)}
      </select>
      <p className="text-sm text-slate-400">Save your BYOK key below, then choose your default for chapter drafting and editing. The optional dashboard helper always uses your OpenRouter key and model.</p>
      <p className="text-xs text-slate-400">System fallback: Google Gemini, using your own saved Gemini key and model. If another provider fails, we retry once with Gemini. After a successful fallback, Gemini becomes your default. Both attempts may incur provider charges.</p>
      <p role="status" className={`text-xs ${readCredential('gemini') ? 'text-emerald-300' : 'text-amber-200'}`}>{readCredential('gemini') ? 'Gemini fallback key available. Use Test key below to check access.' : settings.credentialsLoading ? 'Restoring remembered keys…' : 'Gemini fallback unavailable — add your Gemini key to enable it.'}</p>
    </GlassCard>
    <div className="grid sm:grid-cols-3 gap-4">{PROVIDERS.map(p => {
      const configured = !!readCredential(p.id);
      const tested = configured && !!settings.providers[p.id].testedAt;
      return <button aria-pressed={editing === p.id} key={p.id} disabled={busy || settings.credentialsLoading} onClick={() => choose(p.id)} className={`text-left rounded-2xl border p-5 transition ${editing === p.id ? 'border-emerald-400/60 bg-emerald-400/5' : 'border-white/10 bg-white/[0.025] hover:bg-white/5'}`}>
        <div className="flex justify-between gap-2"><span className="font-semibold text-white">{p.name}</span>{settings.provider === p.id && <span className="text-[10px] text-emerald-300">DEFAULT</span>}</div>
        <p className="text-xs text-slate-400 mt-3 min-h-10">{p.description}</p>
        <span className={`mt-4 inline-flex items-center gap-1 text-xs ${tested ? 'text-emerald-300' : 'text-slate-400'}`}>{tested ? <CheckCircle2 size={13} /> : <KeyRound size={13} />}{tested ? 'Key verified' : configured ? 'Key saved · untested' : 'Needs key'}</span>
      </button>;
    })}</div>
    <GlassCard className="p-6 md:p-8 space-y-5">
      <div className="flex flex-wrap justify-between gap-4"><div><h3 className="text-xl font-semibold text-white">{current.name}</h3><p className="text-sm text-slate-400 mt-1">Add your key and test access to list models. Choose a model ID, then save.</p></div>{current.keyUrl && <a href={current.keyUrl} target="_blank" rel="noreferrer" className="text-sm text-emerald-300 flex items-center gap-2">Get an API key <ExternalLink size={14} /></a>}</div>
      {editing === 'other' && <div className="space-y-3">
        <GlassInput label="API base URL" type="url" autoComplete="off" value={baseUrl} onChange={e => { setBaseUrl(e.target.value); setKey(''); }} placeholder="https://api.your-provider.com/v1" />
        <p className="text-xs text-slate-400">For public OpenAI-compatible APIs supporting /models and /chat/completions with Bearer API keys. Include the version path, such as /v1. Local servers, private networks and IPv6-only endpoints are not supported. Proprietary APIs need a dedicated integration.</p>
        <p className="text-xs text-purple-200">Your key and writing prompts will be sent to this API host. Use a key issued by that provider. Changing the URL clears the key field; save the new configuration before using it.</p>
      </div>}
      <label className="flex items-start gap-3 text-sm text-slate-300"><input type="checkbox" checked={remember} disabled={busy || settings.credentialsLoading} onChange={e => setRemember(e.target.checked)} className="mt-1" />Remember this key on this device (survives refresh and sign-out)</label>
      <p className="text-xs text-slate-400">Remembered keys use encrypted browser storage for this account on this device. Use a trusted device; browser/site access can still expose saved keys. Uncheck for session-only use. Clearing browser site data removes remembered keys.</p>
      <GlassInput disabled={busy || settings.credentialsLoading} label={`${current.name} API key`} aria-label={`${current.name} API key`} type="password" autoComplete="off" value={key} onChange={e => setKey(e.target.value)} placeholder="Paste your own provider API key" />
      <details className="border border-white/10 rounded-xl p-4"><summary className="text-white">Advanced · model selection</summary><p className="text-xs text-slate-400 my-3">Saved model: {settings.providers[editing].model || 'Not selected'}. Model pricing and permissions come from your provider. A successful key test lists access; it does not prove generation will succeed.</p>
      <GlassInput label="Model ID" aria-label="Model ID" value={model} onChange={e => setModel(e.target.value)} list="provider-models" />
      <datalist id="provider-models">{settings.providers[editing].models?.map(id => <option key={id} value={id} />)}</datalist></details>
      {(key !== readCredential(editing) || model !== settings.providers[editing].model || (editing === 'other' && baseUrl !== (settings.providers.other.baseUrl || ''))) && <p className="text-xs text-amber-200">Unsaved changes. Save before using this configuration.</p>}
      <div className="flex flex-wrap gap-3"><GlassButton disabled={busy || settings.credentialsLoading} onClick={async () => { setBusy(true); try { await save(); } catch (e) { setFailure(true); setMessage(e instanceof Error ? e.message : 'Save failed.'); } finally { setBusy(false); } }}>Save key & model</GlassButton><GlassButton variant="secondary" disabled={!key.trim()} isLoading={busy} onClick={test}>Test key · no generation</GlassButton><GlassButton variant="ghost" disabled={busy || !readCredential(editing) || !settings.providers[editing].model} onClick={() => { settings.selectProvider(editing); setFailure(false); setMessage(`${current.name} is now your default AI provider.`); }}>Set as default</GlassButton><GlassButton variant="ghost" disabled={busy || settings.credentialsLoading} onClick={async () => { setBusy(true); try { await settings.forgetProvider(editing); setKey(''); setFailure(false); setMessage('Key forgotten on this device.'); } catch { setFailure(true); setMessage('Could not forget this key. Please try again.'); } finally { setBusy(false); } }}>Forget key on this device</GlassButton></div>
      {(settings.providers[editing].failures || 0) >= 3 && <p role="status" className="text-sm text-amber-200">This provider has failed several times. Check your connection, model access, billing or quota. Replace the key only if it is invalid or revoked. We have kept your key.</p>}
      {message && <p role={failure ? 'alert' : 'status'} className={`text-sm rounded-xl p-4 ${failure ? 'bg-red-500/10 text-red-200' : 'bg-emerald-500/10 text-emerald-200'}`}>{message}</p>}
    </GlassCard>
    <div className="flex gap-3 text-xs text-slate-400 rounded-xl border border-white/10 p-4"><ShieldCheck size={20} className="shrink-0 text-emerald-300" /><p>You choose whether to remember each provider key on this device or use it for this session only. Remembered keys are not deleted by sign-out or failed requests. Non-secret model preferences stay on this browser, separately for each account. Your key and prompt pass through this app’s authenticated relay to the provider you select; keys are not saved in the database. ChatGPT, Claude and Gemini app subscriptions do not supply API credits. Chapter writing requests can retry once with your saved Gemini configuration if your selected provider fails. This shares the same prompt with Google Gemini. Key tests and image generation never switch providers.</p></div>
    {!!localStorage.getItem('userGeminiKey') && <GlassButton variant="secondary" onClick={() => { const legacy = localStorage.getItem('userGeminiKey') || ''; settings.saveProvider('gemini', settings.providers.gemini.model, legacy); localStorage.removeItem('userGeminiKey'); choose('gemini'); }}>Import previously saved Gemini key and remove its old browser copy</GlassButton>}
  </div>;
}
