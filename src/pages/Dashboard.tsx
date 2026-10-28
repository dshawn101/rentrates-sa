import {DashboardIntroVideo} from '../components/onboarding/DashboardIntroVideo';
import {DashboardAnalytics} from '../components/dashboard/DashboardAnalytics';
import {Link} from 'react-router-dom';
import {useEffect,useState} from 'react';
import {ArrowRight,Play,KeyRound,ChevronDown} from 'lucide-react';
import {useAuth} from '../hooks/useAuth';
import {authorFirstName} from '../lib/author-profile';
import {readUsage} from '../lib/ai-usage';
import {useBookStore} from '../store/useBookStore';
import {PROVIDERS,readCredential,useIntegrationStore} from '../store/useIntegrationStore';
import {Container} from '../components/layout/Container';
import {GlassButton} from '../components/ui/GlassButton';
import '../styles/dashboard.css';
export function Dashboard(){
 const {books,isLoading,error}=useBookStore();const {user}=useAuth();const first=authorFirstName(user?.user_metadata?.display_name);
 const integrations=useIntegrationStore();const provider=PROVIDERS.find(p=>p.id===integrations.provider)!;const hasKey=!!readCredential(integrations.provider);
 const [,updateUsage]=useState(0),[videoOpen,setVideoOpen]=useState(false);
 useEffect(()=>{const update=()=>updateUsage(n=>n+1);window.addEventListener('puble:usage',update);window.addEventListener('storage',update);return()=>{window.removeEventListener('puble:usage',update);window.removeEventListener('storage',update);};},[]);
 const usage=readUsage(user?.id||null);
 return <Container className="dashboard-overview"><header className="dashboard-welcome"><div><p className="dashboard-eyebrow">YOUR WRITING ROOM</p><h1>Hello{first?`, ${first}`:''}<span aria-hidden="true">.</span></h1><p>A little perspective on the words you’re bringing to life.</p></div><Link to="/books" className="glass-button">Open My Books <ArrowRight size={17}/></Link></header>
 {error&&<div className="dashboard-load-error"><p role="alert">{error}</p><GlassButton onClick={()=>void useBookStore.getState().fetchBooks()}>Retry loading books</GlassButton></div>}
 <DashboardAnalytics books={books} usage={usage} loading={isLoading} error={error}/>
 <section className="dashboard-provider-strip" aria-labelledby="dashboard-provider-title"><span className="dashboard-provider-icon"><KeyRound size={22}/></span><div><h2 id="dashboard-provider-title">Your AI setup · {provider.name}</h2><p>{hasKey?'Your key is saved. Optional requests use your provider account.':'Write freely without AI. Add a key only when you want assistance.'}</p></div><Link to="/ai-providers">Manage providers <ArrowRight size={15}/></Link></section>
 <section className="dashboard-video-section"><button className="dashboard-video-toggle" aria-expanded={videoOpen} aria-controls="dashboard-video-content" onClick={()=>setVideoOpen(v=>!v)}><Play size={18}/><span>New here? Take a tour of PubléStudio.</span><ChevronDown size={18} className={videoOpen?'rotate-180':''}/></button>{videoOpen&&<div id="dashboard-video-content" className="dashboard-video-content"><DashboardIntroVideo/></div>}</section>
 </Container>;
}
