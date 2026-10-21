import { Container } from '../components/layout/Container';
import { GlassCard } from '../components/ui/GlassCard';
import { Link } from 'react-router-dom';

export function Transparency() {
  return <Container className="py-12 space-y-6 text-slate-300">
    <Link to="/" className="text-purple-300">Back to home</Link>
    <div><h1 className="text-3xl font-bold text-white">Feature & Cost Transparency</h1><p className="text-slate-400 mt-3">What you can use today, who charges for AI, and what is still coming.</p></div>
    <GlassCard className="p-6 md:p-8 space-y-7">
      <div>
        <span className="inline-flex px-3 py-1 text-xs font-semibold tracking-wide rounded-full bg-purple-400/10 text-purple-200 border border-purple-400/25">FREE BETA · AVAILABLE NOW</span>
        <h2 className="text-2xl font-semibold text-white mt-4">Free beta access. Optional AI costs are separate.</h2>
        <p className="mt-3 text-sm leading-7">PubléStudio is not charging a subscription during this beta. There is no paid checkout or automatic paid trial.</p>
      </div>
      <section className="border-t border-white/10 pt-6">
        <h3 className="text-white font-semibold">Included in the current beta</h3>
        <p className="mt-2 text-sm leading-7">Book setup, manuscript import (DOCX, TXT and Markdown), chapter planning and reordering, writing with autosave and saved history, private cover imports, and DOCX, EPUB, PDF, TXT and Markdown export. Free-tier PDFs include a watermark. No AI key is needed for these features.</p>
      </section>
      <section className="border-t border-white/10 pt-6">
        <h3 className="text-white font-semibold">You pay your provider only when you use its AI</h3>
        <p className="mt-2 text-sm leading-7">Bring your own Gemini, OpenAI, or OpenRouter API key for optional writing assistance. OpenAI artwork generation also uses your provider account. Your provider sets the rates and may charge API credits; a chat-app subscription does not include those credits.</p>
        <p className="mt-2 text-sm text-slate-400 leading-7">PubléStudio does not currently track tokens or estimate AI costs. Check your provider dashboard for actual usage and charges.</p>
      </section>
      <section className="border-t border-white/10 pt-6">
        <h3 className="text-white font-semibold">Why paid tiers are disabled</h3>
        <p className="mt-2 text-sm leading-7">Paid tiers are not available to purchase during beta. Checkout, subscription updates, and paid feature access are not connected yet. Upgrades will open when the full purchase-to-access process is ready.</p>
        <p className="mt-2 text-sm text-purple-200 leading-7">Disabled tiers are previews, not active offers. No paid price, trial, or launch date is confirmed here.</p>
      </section>
      <p className="border-t border-white/10 pt-5 text-xs text-slate-400 leading-6">Imports preserve text and basic formatting, not complex page layouts, comments or footnotes. DOCX is for further editing; EPUB is reflowable; PDF is a reading copy. Check publishing-platform requirements separately. Cloud history keeps the last 50 changed text versions per chapter; device drafts are not a full offline mode. <Link to="/legal/privacy" className="text-purple-300 underline underline-offset-4">How your data and AI keys are handled</Link></p>
    </GlassCard>
  </Container>;
}
