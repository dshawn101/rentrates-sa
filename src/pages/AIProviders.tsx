import {useIntegrationStore} from '../store/useIntegrationStore';
import {lazy,Suspense,useState} from 'react';
import {ChevronRight,KeyRound} from 'lucide-react';
import {Container} from '../components/layout/Container';
import {ProviderSettings} from '../components/settings/ProviderSettings';
const MCPSettings=lazy(()=>import('../components/settings/MCPSettings').then(m=>({default:m.MCPSettings})));
export function AIProviders(){
 const [advanced,setAdvanced]=useState(false);const error=useIntegrationStore(s=>s.error);
 return <Container className="space-y-7 py-6"><header><p className="text-xs uppercase tracking-[.2em] text-purple-200 mb-3 flex items-center gap-2"><KeyRound size={15}/>Your AI, your choice</p><h1 className="text-3xl md:text-4xl text-white font-bold">AI Providers</h1><p className="text-slate-400 mt-3">Connect your own keys, choose a default provider and test access. AI is optional; provider usage is billed separately.</p></header><ProviderSettings/>{error&&<p role="alert" className="text-sm text-amber-200">{error}</p>}<section className="pt-6 border-t border-white/10"><button className="rounded-lg p-3 flex items-center gap-2 text-sm" onClick={()=>setAdvanced(!advanced)} aria-expanded={advanced}><ChevronRight size={16} className={advanced?'rotate-90':''}/>Advanced tools · optional MCP connections</button>{advanced&&<div className="mt-5"><Suspense fallback={<p role="status">Loading advanced tools…</p>}><MCPSettings/></Suspense></div>}</section></Container>;
}
