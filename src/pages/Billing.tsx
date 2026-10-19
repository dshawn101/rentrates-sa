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
      <p className="text-slate-300">The current MVP supports chapter planning, manual writing, optional AI assistance with your own provider key, private cover imports, and PDF manuscript export.</p>
      <p className="text-slate-300">Free beta access: PubleStudio is not charging a subscription. Paid upgrades are disabled until checkout, subscription updates, and paid feature access are connected.</p>
      <Link to="/transparency" className="inline-flex text-purple-300 underline underline-offset-4">Read the beta feature and cost guide</Link>
    </GlassCard>
    <GlassCard className="p-8 space-y-4">
      <h2 className="text-xl text-white">AI provider costs</h2>
      <p className="text-slate-300">AI usage and costs are not tracked here. Check your provider account for charges. Manual writing and PDF export do not require an AI key.</p>
    </GlassCard>
  </Container>;
}
