import {DashboardIntroVideo} from '../components/onboarding/DashboardIntroVideo';
import {DashboardAnalytics} from '../components/dashboard/DashboardAnalytics';
import {Link,useNavigate} from 'react-router-dom';
import {useEffect,useState} from 'react';
import {ArrowRight,KeyRound} from 'lucide-react';
import {useAuth} from '../hooks/useAuth';
import {authorFirstName} from '../lib/author-profile';
import {readUsage} from '../lib/ai-usage';
import {useBookStore} from '../store/useBookStore';
import {PROVIDERS,readCredential,useIntegrationStore} from '../store/useIntegrationStore';
import {Container} from '../components/layout/Container';
import {GlassButton} from '../components/ui/GlassButton';
import {GlassCard} from '../components/ui/GlassCard';
import {latestSavedBook} from '../lib/dashboard-progress';
import '../styles/dashboard.css';
export function Dashboard(){
 const {books,isLoading,error}=useBookStore();const {user}=useAuth();const first=authorFirstName(user?.user_metadata?.display_name);
 const integrations=useIntegrationStore();const provider=PROVIDERS.find(p=>p.id===integrations.provider)!;const hasKey=!!readCredential(integrations.provider);
 const [,updateUsage]=useState(0);
 useEffect(()=>{const update=()=>updateUsage(n=>n+1);window.addEventListener('puble:usage',update);window.addEventListener('storage',update);return()=>{window.removeEventListener('puble:usage',update);window.removeEventListener('storage',update);};},[]);
 const usage=readUsage(user?.id||null);
 const navigate=useNavigate();const latestBook=latestSavedBook(books);
 const resume=latestBook?`/book/${latestBook.id}?step=${latestBook.lastEditedChapter?3:1}${latestBook.lastEditedChapter?'&chapter='+encodeURIComponent(latestBook.lastEditedChapter.id):''}`:null;
 return <Container className="dashboard-overview"><header className="dashboard-welcome"><div><p className="dashboard-eyebrow">YOUR WRITING ROOM</p><h1>Hello{first?`, ${first}`:''}<span aria-hidden="true">.</span></h1><p>A little perspective on the words you’re bringing to life.</p></div><nav className="dashboard-workspace-actions" aria-label="Writing workspaces"><Link to="/books" className="glass-button">Open My Books <ArrowRight size={17} aria-hidden="true"/></Link><Link to="/series-bible" className="glass-button">Open Series Bible <ArrowRight size={17} aria-hidden="true"/></Link></nav></header>
 {error&&<div className="dashboard-load-error"><p role="alert">{error}</p><GlassButton onClick={()=>void useBookStore.getState().fetchBooks()}>Retry loading books</GlassButton></div>}
 <GlassCard className="dashboard-start-card p-5 space-y-3"><h2 className="text-xl font-semibold text-white">Where would you like to start?</h2><p className="text-sm text-slate-400">Write manually from the first word. AI setup is optional.</p><div className="flex flex-wrap gap-3"><GlassButton disabled={!!error||isLoading} onClick={()=>navigate('/books?new=1')}>Start a book</GlassButton>{resume&&!error&&!isLoading&&<Link className="glass-button inline-flex items-center" to={resume}>Continue writing</Link>}</div></GlassCard>
 <div className="dashboard-video-section dashboard-video-content"><DashboardIntroVideo/></div>
 <DashboardAnalytics books={books} usage={usage} loading={isLoading} error={error}/>
 <section className="dashboard-provider-strip" aria-labelledby="dashboard-provider-title"><span className="dashboard-provider-icon"><KeyRound size={22}/></span><div><h2 id="dashboard-provider-title">Your AI setup · {provider.name}</h2><p>{hasKey?'Your key is saved. Optional requests use your provider account.':'Write freely without AI. Add a key only when you want assistance.'}</p></div><Link to="/ai-providers">Manage providers <ArrowRight size={15}/></Link></section>

 </Container>;
}
