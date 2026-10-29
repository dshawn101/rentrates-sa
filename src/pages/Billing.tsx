import {PayPalBilling} from '../components/pricing/PayPalBilling';
import {Link} from 'react-router-dom';
import {useAuth} from '../hooks/useAuth';
import {Container} from '../components/layout/Container';
import {GlassCard} from '../components/ui/GlassCard';
import {useBookStore} from '../store/useBookStore';
import {totalBookWords} from '../lib/book-stats';
import '../styles/billing.css';

export function Billing(){
 const {profile}=useAuth();
 const {books,error,isLoading}=useBookStore();
 const pending=isLoading?'…':'—';
 return <Container className="puble-billing">
  <header className="puble-billing-heading"><h1>Plan & Usage</h1><p>Your current tier, saved work and optional upgrades.</p></header>
  <GlassCard className="puble-billing-overview">
   <div className="puble-billing-overview-top"><div><p className="puble-billing-label">Your current tier</p><h2 className="capitalize">{profile?.tier||'free'}</h2></div><dl className="puble-billing-stats"><div><dt>Saved words</dt><dd>{error||isLoading?pending:totalBookWords(books).toLocaleString()}</dd></div><div><dt>Projects</dt><dd>{error||isLoading?pending:books.length}</dd></div></dl></div>
   {error&&<p className="puble-billing-muted">Saved usage is temporarily unavailable.</p>}
   <details className="puble-billing-details"><summary>Included in your tier</summary><p>This current tier supports manuscript import, chapter planning and reordering, autosave with saved history, optional AI suggestions you review before accepting, private cover imports, and DOCX, EPUB, PDF and text exports.</p></details>
  </GlassCard>
  <div className="puble-billing-columns">
   <GlassCard className="puble-billing-payment"><PayPalBilling/></GlassCard>
   <aside className="puble-billing-sidebar" aria-label="Plan information">
    <GlassCard className="puble-billing-info"><p className="puble-billing-label">Optional AI</p><h2>Provider costs are separate.</h2><p>Manual writing, imports and exports need no AI key. Your provider bills optional AI usage.</p><Link to="/ai-providers" className="puble-billing-text-link">Open AI Providers →</Link><details className="puble-billing-details"><summary>Usage and estimates</summary><p>AI Providers shows recent successful-request usage and available OpenRouter cost scenarios. Your provider dashboard remains authoritative for charges.</p></details></GlassCard>
    <GlassCard className="puble-billing-info"><p className="puble-billing-label">Explore your options</p><h2>Choose at your own pace.</h2><p>Free beta remains available. Compare the published tiers and register for launch updates.</p><div className="puble-billing-pricing-action"><Link to="/pricing" className="glass-button">View tiers & launch waitlist</Link></div><div className="puble-billing-guide"><p>What’s included, what costs extra and what’s planned.</p><Link to="/transparency" className="puble-billing-text-link">Read the beta feature and cost guide →</Link></div></GlassCard>
   </aside>
  </div>
 </Container>;
}
