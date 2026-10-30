import {AuthorGuideContent} from './AuthorGuidePage';
import '../styles/settings.css';
import { useLayoutEffect, useRef, useState } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { UserRound, SlidersHorizontal, Palette, ShieldCheck, Compass } from 'lucide-react';
import { Container } from '../components/layout/Container';
import { GlassCard } from '../components/ui/GlassCard';
import { GlassInput } from '../components/ui/GlassInput';
import { GlassButton } from '../components/ui/GlassButton';
import { useAuth } from '../hooks/useAuth';
import { useIntegrationStore } from '../store/useIntegrationStore';
import { DisplayNameSettings } from '../components/settings/DisplayNameSettings';
import { DesignTools } from '../components/settings/DesignTools';
const sections = [
  { id: 'account', name: 'Account', detail: 'Your profile and access', icon: UserRound },
  { id: 'writing', name: 'Writing Defaults', detail: 'Start each book your way', icon: SlidersHorizontal },
  { id: 'guide', name: 'Author Guide', detail: 'Walkthrough and friendly help', icon: Compass },
  { id: 'design', name: 'Design Tools', detail: 'Cover artwork and imports', icon: Palette },
];
export function Settings() {
  const [params, setParams] = useSearchParams();
  const { user, profile, signOut } = useAuth(); const settings = useIntegrationStore();
  const [prefs, setPrefs] = useState(settings.preferences); const [message, setMessage] = useState('');
  const section = sections.some(s => s.id === params.get('section')) ? params.get('section')! : 'account';
  const current = sections.find(s => s.id === section)!;
  const panel = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => { if (panel.current) panel.current.scrollTop = 0; }, [section]);
  if (params.get('section') === 'providers') return <Navigate to="/ai-providers" replace />;
  return <Container className="settings-page">
    <div className="settings-heading flex flex-wrap items-end justify-between gap-5"><div><p className="text-xs text-emerald-300 uppercase tracking-[.22em] mb-3">Your writing workspace</p><h1 className="text-3xl md:text-4xl font-bold text-white">Settings</h1><p className="text-slate-400 mt-3">A few useful choices. Everything else stays out of your way.</p></div></div>
    <div className="settings-workspace"><nav aria-label="Settings sections" className="settings-sections">{sections.map(s => <button type="button" key={s.id} onClick={() => { setParams({ section: s.id }); setMessage(''); }} aria-current={section === s.id ? 'page' : undefined} className={`rounded-xl border px-4 py-4 text-left flex gap-3 items-center ${section === s.id ? 'bg-emerald-400/10 border-emerald-400/30' : 'border-transparent hover:bg-white/5'}`}><s.icon size={19} className={section === s.id ? 'text-emerald-300' : 'text-slate-500'} /><span><span className="block text-sm text-white font-medium">{s.name}</span><span className="settings-section-detail block text-[11px] text-slate-500 mt-1">{s.detail}</span></span></button>)}</nav>
    <div ref={panel} className="settings-content space-y-6" role="region" aria-labelledby="settings-section-title" tabIndex={0}><div className="border-b border-white/10 pb-5"><h2 id="settings-section-title" className="text-xl font-semibold text-white">{current.name}</h2><p className="text-sm text-slate-400 mt-1">{current.detail}</p></div>
      {section === 'account' && <GlassCard className="p-7 space-y-6"><div className="flex gap-3 items-center"><ShieldCheck className="text-emerald-300" /><span className="text-emerald-200 text-sm">Signed in</span></div><DisplayNameSettings key={user?.id} /><div><p className="text-xs text-slate-500 uppercase tracking-widest">Email</p><p className="text-white mt-2 break-all">{user?.email}</p></div><div><p className="text-xs text-slate-500 uppercase tracking-widest">Access</p><p className="text-white mt-2 capitalize">{profile?.tier || 'free'} tier</p><p className="text-sm text-slate-400 mt-2">Writing, cover imports and PDF export work without an AI key.</p></div><Link to="/billing" className="glass-button inline-flex">Plan & payments</Link><GlassButton variant="secondary" onClick={() => signOut()}>Sign out</GlassButton></GlassCard>}
      {section === 'writing' && <GlassCard className="p-7 space-y-5"><p className="text-sm text-slate-400">Used when you create a new book. Existing books keep their own settings.</p><div className="grid sm:grid-cols-2 gap-5"><label className="text-sm text-slate-300">Genre<select className="glass-select w-full mt-2" value={prefs.genre} onChange={e => setPrefs({ ...prefs, genre: e.target.value })}><option value="non-fiction">Non-fiction</option><option value="fiction">Fiction</option><option value="self-help">Self-help</option><option value="business">Business</option><option value="biography">Biography & memoir</option></select></label><label className="text-sm text-slate-300">Tone<select className="glass-select w-full mt-2" value={prefs.tone} onChange={e => setPrefs({ ...prefs, tone: e.target.value })}><option value="professional">Professional</option><option value="casual">Conversational</option><option value="inspirational">Inspirational</option><option value="empathetic">Empathetic</option><option value="academic">Academic</option></select></label><GlassInput label="Target book words" aria-label="Target book words" type="number" min={1000} max={200000} value={prefs.targetWordCount} onChange={e => setPrefs({ ...prefs, targetWordCount: Number(e.target.value) })} /><GlassInput label="Maximum AI output tokens per request" aria-label="Maximum AI output tokens per request" type="number" min={128} max={8000} value={prefs.maxOutputTokens} onChange={e => setPrefs({ ...prefs, maxOutputTokens: Number(e.target.value) })} /></div><p className="text-xs text-slate-500">The token limit bounds each writing request; it is not a price quote or a book word limit.</p><GlassButton onClick={() => { if (!Number.isFinite(prefs.targetWordCount) || prefs.targetWordCount < 1000 || prefs.targetWordCount > 200000 || !Number.isFinite(prefs.maxOutputTokens) || prefs.maxOutputTokens < 128 || prefs.maxOutputTokens > 8000) { setMessage('Choose a book target from 1,000–200,000 words and an AI output limit from 128–8,000 tokens.'); return; } settings.setPreferences(prefs); setMessage('Writing defaults saved.'); }}>Save defaults</GlassButton>{message && <p role="status" className="text-sm text-emerald-200">{message}</p>}</GlassCard>}
      {section === 'guide' && <AuthorGuideContent />}
      {section === 'design' && <DesignTools />}
      {settings.error && <p role="alert" className="text-sm text-red-200">{settings.error}</p>}
    </div></div>
  </Container>;
}
