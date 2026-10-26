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
        <p className="mt-2 text-sm leading-7">Book setup, manuscript import (DOCX, TXT and Markdown), chapter planning and reordering, writing with autosave and saved history, private cover imports, optional whole-book consistency review, and DOCX, EPUB, PDF, TXT and Markdown export. Free-tier PDFs include a watermark. Manual writing, import and export need no AI key. The optional review sends saved manuscript batches to your chosen AI provider and incurs usage charges.</p>
      </section>
      <section className="border-t border-white/10 pt-6">
        <h3 className="text-white font-semibold">You pay your provider only when you use its AI</h3>
        <p className="mt-2 text-sm leading-7">Bring your own supported Gemini, OpenAI, OpenRouter, Anthropic, xAI or compatible-provider API key for optional writing assistance. OpenAI artwork generation also uses your provider account. Your provider sets the rates and may charge API credits; a chat-app subscription does not include those credits.</p>
        <p className="mt-2 text-sm text-slate-400 leading-7">AI usage shows up to 50 successful request records on this device, including token counts and costs when providers return them. OpenRouter supports a manual rate lookup and approximate text-cost scenarios. These are not exact quotes or spending caps; failed requests, reasoning and retries can add charges. Your provider dashboard and invoice remain authoritative.</p>
      </section>
      <section className="border-t border-white/10 pt-6">
        <h3 className="text-white font-semibold">Our preliminary pricing structure</h3>
        <p className="mt-2 text-sm leading-7">Free beta signup is open. Lite is our intended $9 USD/month entry tier, with beta interest registration open while checkout is connected and tested. Author ($19 USD/month) and Pro ($49 USD/month) are preliminary later tiers, greyed out until a phase after the Product Hunt launch. Their benefits and limits are not confirmed.</p>
        <p className="mt-2 text-sm text-purple-200 leading-7">Joining the launch waitlist or registering Lite interest creates no subscription and takes no payment. Paid access requires a separate checkout once available. No automatic paid trial or upgrade. See the pricing page for the current structure and register for launch notifications.</p>
      </section>
      <Link to="/pricing" className="glass-button inline-flex">View tiers & join the launch waitlist</Link>
      <p className="border-t border-white/10 pt-5 text-xs text-slate-400 leading-6">Imports preserve text and basic formatting, not complex page layouts, comments or native linked footnotes. Available DOCX footnotes become a separate notes chapter with reference markers. DOCX is for further editing; EPUB is reflowable and gets built-in structure checks before download. Standard PDF is a reading copy. A separate beta 6 × 9 inch print-interior template checks page size, embedded font and margins, but still needs printer preview/proof approval; it is not certified print-ready. Check publishing-platform requirements separately. Cloud history keeps the last 50 changed text versions per chapter; device drafts are not a full offline mode. <Link to="/legal/privacy" className="text-purple-300 underline underline-offset-4">How your data and AI keys are handled</Link></p>
    </GlassCard>
  </Container>;
}
