import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Container } from '../components/layout/Container';
import { GlassCard } from '../components/ui/GlassCard';
import { useBookStore } from '../store/useBookStore';
import { totalBookWords } from '../lib/book-stats';

export function Billing() {
  const { profile } = useAuth();
  const { books, error, isLoading } = useBookStore();
  return <Container className="space-y-8 py-8">
    <h1 className="text-3xl font-bold text-white">Plan & Usage</h1>
    <GlassCard className="p-8 space-y-4">
      <h2 className="text-xl text-white capitalize">{profile?.tier || 'free'} tier</h2>
      <p className="text-slate-300">{isLoading ? 'Loading saved words…' : error ? 'Saved word count unavailable.' : `${totalBookWords(books).toLocaleString()} saved words across ${books.length} projects.`}</p>
      <p className="text-slate-300">The current MVP supports manuscript import, chapter planning and reordering, autosave with saved history, optional AI suggestions you review before accepting, private cover imports, and DOCX, EPUB, PDF and text exports.</p>
      <p className="text-slate-300">Free beta access: PubléStudio is not charging a subscription. Paid upgrades are disabled until checkout, subscription updates, and paid feature access are connected.</p>
      <Link to="/pricing" className="glass-button inline-flex">View preliminary tiers & launch waitlist</Link>
      <Link to="/transparency" className="inline-flex text-purple-300 underline underline-offset-4">Read the beta feature and cost guide</Link>
    </GlassCard>
    <GlassCard className="p-8 space-y-4">
      <h2 className="text-xl text-white">AI provider costs</h2>
      <p className="text-slate-300">Open AI Providers to view recent successful-request usage and available OpenRouter cost scenarios. Your provider dashboard remains authoritative for charges. Manual writing and manuscript exports do not require an AI key.</p>
    </GlassCard>
  </Container>;
}
