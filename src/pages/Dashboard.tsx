import {IntroVideo} from '../components/onboarding/IntroVideo';
import {Link} from 'react-router-dom';
import {useEffect} from 'react';
import {useAuth} from '../hooks/useAuth';
import {authorFirstName} from '../lib/author-profile';
import {totalBookWords} from '../lib/book-stats';
import {useBookStore} from '../store/useBookStore';
import {PROVIDERS,readCredential,useIntegrationStore} from '../store/useIntegrationStore';
import {Container} from '../components/layout/Container';
import {GlassCard} from '../components/ui/GlassCard';
import {GlassButton} from '../components/ui/GlassButton';
export function Dashboard(){
 const {books,isLoading,error,fetchBooks}=useBookStore();const {user}=useAuth();const first=authorFirstName(user?.user_metadata?.display_name);
 const integrations=useIntegrationStore();const provider=PROVIDERS.find(p=>p.id===integrations.provider)!;const hasKey=!!readCredential(integrations.provider);
 useEffect(()=>{void fetchBooks();},[fetchBooks]);
 return <Container className="space-y-8"><div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-6"><div><h1 className="text-3xl font-bold text-white">Hello{first?`, ${first}`:''}</h1><p className="text-slate-400 mt-2">Your writing overview. Find manuscripts, folders and saved progress in My Books.</p></div><Link to="/books" className="glass-button inline-flex">Open My Books →</Link></div>
 <GlassCard className="p-7 flex flex-wrap items-center justify-between gap-5"><div><h2 className="text-xl text-white">A little guidance to begin.</h2><p className="text-slate-400 mt-2">Watch the introduction whenever you need a tour of your writing space.</p></div><IntroVideo /></GlassCard>
 {error&&<GlassCard className="p-6"><p role="alert">{error}</p><GlassButton onClick={fetchBooks}>Retry loading books</GlassButton></GlassCard>}
 <div className="grid md:grid-cols-3 gap-5">{[{label:'Total books',value:error?'—':isLoading?'…':books.length},{label:'Saved words',value:error?'—':isLoading?'…':totalBookWords(books).toLocaleString()},{label:'AI provider costs',value:'Not tracked'}].map(stat=><GlassCard key={stat.label} className="p-6"><p className="text-sm text-slate-400">{stat.label}</p><p className="text-3xl text-white mt-3">{stat.value}</p>{stat.label==='AI provider costs'&&<p className="text-xs text-slate-400 mt-3">Check your provider dashboard for usage and charges.</p>}</GlassCard>)}</div>
 <GlassCard className="p-7"><h2 className="text-xl font-semibold text-white">Your AI setup</h2><p className="text-white mt-4">{provider.name}</p><p className="text-sm text-slate-400 mt-2 break-all">{integrations.providers[integrations.provider].model}</p><p className="text-sm text-slate-400 mt-4">{hasKey?'Your key is saved. Optional writing requests use your provider’s API credits.':'AI is optional. Writing, manuscript imports and exports work without a key.'}</p><Link to="/settings?section=providers" className="text-purple-300 inline-block mt-5">Manage AI settings →</Link></GlassCard></Container>;
}
