import { useEffect, useState } from 'react';
import { ExternalLink, Plug, ShieldAlert } from 'lucide-react';
import { readCredential, useIntegrationStore } from '../../store/useIntegrationStore';
import { discoverTools, runRemoteTool, validateMCPUrl } from '../../lib/mcp-client';
import type { RemoteTool } from '../../lib/mcp-client';
import { GlassCard } from '../ui/GlassCard';
import { GlassInput } from '../ui/GlassInput';
import { GlassButton } from '../ui/GlassButton';
export function MCPSettings() {
  const settings = useIntegrationStore();
  const [name, setName] = useState(''); const [url, setUrl] = useState(''); const [token, setToken] = useState('');
  const [active, setActive] = useState<string | null>(null); const [tools, setTools] = useState<RemoteTool[]>([]);
  const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [result, setResult] = useState('');
  const [selected, setSelected] = useState(''); const [args, setArgs] = useState('{}'); const [review, setReview] = useState(false);
  useEffect(() => { setReview(false); }, [selected, args, active]);
  const connect = async (id: string) => {
    const server = settings.servers.find(s => s.id === id); if (!server?.enabled) return;
    setBusy(true); setError(''); setResult(''); setTools([]); setSelected(''); setActive(null);
    try { const found = await discoverTools(server.url, readCredential(`mcp:${id}`)); setTools(found); setActive(id); }
    catch (e) { setError(e instanceof Error ? e.message : 'Connection failed.'); }
    finally { setBusy(false); }
  };
  const add = () => {
    try {
      if (!name.trim() || name.length > 80) throw new Error('Enter a server name of up to 80 characters.');
      if (settings.servers.length >= 20) throw new Error('You can save up to 20 servers.');
      settings.saveServer({ id: crypto.randomUUID(), name: name.trim(), url: validateMCPUrl(url), enabled: true }, token);
      setName(''); setUrl(''); setToken(''); setError('');
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not save server.'); }
  };
  const execute = async () => {
    const server = settings.servers.find(s => s.id === active); if (!server?.enabled || !review) return;
    setBusy(true); setError(''); setResult('');
    try { const parsed = JSON.parse(args); if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') throw new Error('Arguments must be a JSON object.'); setResult(await runRemoteTool(server.url, readCredential(`mcp:${server.id}`), selected, parsed)); }
    catch (e) { setError(e instanceof Error ? e.message : 'Tool call failed.'); }
    finally { setBusy(false); setReview(false); }
  };
  return <div className="space-y-6">
    <GlassCard className="p-6 space-y-4"><div className="flex items-center gap-3"><Plug className="text-emerald-300" /><h3 className="text-xl font-semibold text-white">Remote MCP tools</h3></div><p className="text-sm text-slate-400">Connect a remote server, discover its actual tools, and review each action before running it. Saving a server does not connect it. Remote HTTPS / Streamable HTTP only; desktop stdio commands cannot run in this web app.</p>
      <div className="grid md:grid-cols-2 gap-4"><GlassInput label="Server name" aria-label="Server name" value={name} onChange={e => setName(e.target.value)} placeholder="My design tools" /><GlassInput label="MCP server URL" aria-label="MCP server URL" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://your-server.example/mcp" /></div>
      <GlassInput label="Access token (if required)" aria-label="Access token (if required)" type="password" autoComplete="off" value={token} onChange={e => setToken(e.target.value)} placeholder="Server-specific OAuth access token" />
      <p className="text-xs text-slate-500">Tokens stay in page memory. This token goes only to the server you choose. Never paste an AI provider key here unless that server is its intended recipient.</p><GlassButton onClick={add}>Add server</GlassButton>
    </GlassCard>
    <GlassCard className="p-6 space-y-4"><div className="flex justify-between items-center gap-4"><h3 className="text-lg font-semibold text-white">Canva MCP</h3><span className="text-xs text-amber-200">OAuth setup required</span></div><p className="text-sm text-slate-400">Canva requires a registered OAuth app and individual user authorization. This app does not yet offer one-click Canva sign-in. Once authorized, add the official endpoint with its OAuth access token; browser access also depends on Canva’s CORS policy.</p><div className="flex flex-wrap gap-4"><GlassButton variant="secondary" onClick={() => { setName('Canva'); setUrl('https://api.canva.com/connect/v1/mcp'); }}>Use Canva endpoint</GlassButton><a href="https://www.canva.dev/docs/apps/mcp/access/" target="_blank" rel="noreferrer" className="text-sm text-emerald-300 inline-flex items-center gap-2">OAuth setup guide <ExternalLink size={14} /></a></div></GlassCard>
    {settings.servers.length === 0 && <p className="text-slate-400 text-sm">No servers saved. Add one above to get started.</p>}
    {settings.servers.map(server => <GlassCard key={server.id} className="p-5 space-y-4"><div className="flex justify-between flex-wrap gap-3"><div><h4 className="text-white font-semibold">{server.name}</h4><p className="text-xs text-slate-400 break-all">{server.url}</p></div><span className={`text-xs ${active === server.id ? 'text-emerald-300' : 'text-slate-400'}`}>{active === server.id ? `${tools.length} tools discovered` : server.enabled ? 'Saved · not connected' : 'Disabled'}</span></div>
      <GlassInput label={`Token for ${server.name}`} aria-label={`Token for ${server.name}`} type="password" autoComplete="off" defaultValue={readCredential(`mcp:${server.id}`)} onChange={e => { settings.saveServer(server, e.target.value); if (active === server.id) { setActive(null); setTools([]); } }} placeholder="Optional OAuth access token" />
      <div className="flex flex-wrap gap-3"><GlassButton variant="secondary" disabled={!server.enabled} isLoading={busy} onClick={() => connect(server.id)}>Connect & discover tools</GlassButton><GlassButton variant="ghost" disabled={busy} onClick={() => { settings.saveServer({ ...server, enabled: !server.enabled }); if (active === server.id) { setActive(null); setTools([]); } }}>{server.enabled ? 'Disable' : 'Enable'}</GlassButton><GlassButton variant="ghost" disabled={busy} onClick={() => { settings.removeServer(server.id); if (active === server.id) { setActive(null); setTools([]); } }}>Remove server</GlassButton></div>
    </GlassCard>)}
    {active && <GlassCard className="p-6 space-y-4"><h3 className="text-white font-semibold">Discovered tools</h3><label className="block text-sm text-slate-300">Choose tool<select className="glass-select w-full mt-2" value={selected} onChange={e => setSelected(e.target.value)}><option value="">Select a tool</option>{tools.map(tool => <option key={tool.name} value={tool.name}>{tool.name}</option>)}</select></label>
      {selected && <><p className="text-sm text-slate-400">{tools.find(t => t.name === selected)?.description}</p><details className="text-xs text-slate-400"><summary>View input schema</summary><pre className="overflow-x-auto mt-3">{JSON.stringify(tools.find(t => t.name === selected)?.inputSchema, null, 2)}</pre></details><label className="text-sm text-slate-300 block">Arguments (JSON)<textarea aria-label="Tool arguments" className="glass-input w-full font-mono mt-2" rows={6} value={args} onChange={e => setArgs(e.target.value)} /></label>
      {!review ? <GlassButton disabled={busy} onClick={() => { try { const value = JSON.parse(args); if (!value || Array.isArray(value) || typeof value !== 'object') throw new Error(); setError(''); setReview(true); } catch { setError('Enter a valid JSON object.'); } }}>Review action</GlassButton> : <div className="border border-amber-400/30 bg-amber-400/5 p-4 rounded-xl space-y-3"><p className="text-sm text-amber-200 flex gap-2"><ShieldAlert size={18} />Run {selected} on {settings.servers.find(s => s.id === active)?.name}? This shares the arguments above with that server and may change your external account or incur provider charges.</p><GlassButton isLoading={busy} onClick={execute}>Confirm & run this tool</GlassButton><GlassButton variant="ghost" onClick={() => setReview(false)}>Cancel</GlassButton></div>}</>}
    </GlassCard>}
    {error && <p role="alert" className="text-sm text-red-200 bg-red-500/10 p-4 rounded-xl">{error}</p>}
    {result && <pre role="status" className="text-xs text-slate-300 bg-black/30 rounded-xl p-5 whitespace-pre-wrap break-words max-h-96 overflow-auto">{result}</pre>}
  </div>;
}
