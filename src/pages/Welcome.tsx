import { PricingPlans } from '../components/pricing/PricingPlans';
import { TypewriterHeadline } from '../components/ui/TypewriterHeadline';
import { PublicFooter } from '../components/legal/PublicFooter';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Check, Download, Feather, Image, Sparkles } from 'lucide-react';
import { Brand } from '../components/ui/Brand';
import { useAuth } from '../hooks/useAuth';
import '../styles/welcome.css';

const steps = [
  { number: '01', icon: BookOpen, title: 'Give your idea a home.', description: 'Start fresh or import DOCX, TXT or Markdown. Review, split and organise chapters before you save.' },
  { number: '02', icon: Feather, title: 'Find your writing rhythm.', description: 'Write at your own pace. Connect your own AI provider whenever you want help with a draft or rewrite.' },
  { number: '03', icon: Download, title: 'Make it a manuscript.', description: 'Add your own cover and optional front/back pages. Preview saved writing before downloading DOCX, EPUB, PDF or text.' },
];
const questions = [
  ['Do I need an AI key to start?', 'No. You can plan, write, and export without AI. Connect your preferred provider only when you want AI assistance.'],
  ['How does AI billing work?', 'AI is optional. When you connect your own API key, your chosen provider bills your usage. Provider charges are separate from the app; a ChatGPT subscription does not include API credits. You can remember provider keys on this device, or choose session-only use. Remembered keys survive refresh and sign-out until you forget them or clear site data.'],
  ['Can I use a cover I already designed?', 'Yes. Upload a PNG, JPG, or WebP front cover, including a design made in Canva or another tool. You can also skip the cover and add one later.'],
  ['Can I bring my existing manuscript?', 'Yes. Import DOCX, UTF-8 TXT or Markdown, review the detected chapters, then append them to your outline. Basic headings and emphasis transfer; complex layouts, comments and footnotes do not.'],
  ['How is my writing saved?', 'The editor autosaves after a pause and keeps a recovery draft on this device. Saved history retains the last 50 changed cloud text versions per chapter. Review AI suggestions before accepting, and download regular backups. Device recovery is not a full offline mode.'],
  ['What can I export?', 'Download editable DOCX, EPUB, PDF, TXT or Markdown. DOCX and EPUB retain basic formatting; Standard PDF is a reading copy. A separate beta 6 × 9 inch text-only print interior includes built-in checks but needs printer proofing. Free-tier PDFs include a watermark. Complex layouts and direct publishing are not supported.'],
];

export function Welcome() {
  const { user } = useAuth();
  const start = user ? '/books' : '/auth/signup';
  return <div className="welcome">
    <a className="welcome-skip" href="#main">Skip to content</a>
    <header className="welcome-nav welcome-container">
      <Link to="/" aria-label="PubléStudio home"><Brand /></Link>
      <nav aria-label="Main navigation"><a className="welcome-desktop-link" href="#how-it-works">How it works</a><Link className="welcome-desktop-link" to="/pricing">Pricing</Link><a className="welcome-desktop-link" href="#questions">Questions</a><Link className="welcome-signin" to={user ? '/dashboard' : '/auth/login'}>{user ? 'My dashboard' : 'Sign in'} <ArrowRight size={16} /></Link></nav>
    </header>
    <main id="main">
      <section className="welcome-hero welcome-container">
        <div className="welcome-hero-copy">
          <p className="welcome-eyebrow"><span /> A little structure. A lot of possibility.</p>
          <TypewriterHeadline />
          <p className="welcome-intro">A calm space to turn your ideas into a manuscript. Plan your chapters, find your words, and bring it all together — with AI help when you want it.</p>
          <div className="welcome-actions"><Link className="welcome-primary" to={start}>{user ? 'Continue writing' : 'Start your book'} <ArrowRight size={19} /></Link><a className="welcome-text-link" href="#how-it-works">Take a look around <span>↗</span></a></div>
          <p className="welcome-small"><Check size={14} /> Write without AI. Connect your own key anytime.</p>
        </div>
        <div className="welcome-studio-preview" aria-label="Illustrative preview of the book-writing workflow">
          <div className="welcome-preview-top"><Brand compact /><span>THE WRITING ROOM</span><span className="welcome-preview-dot" /></div>
          <div className="welcome-preview-body">
            <aside className="welcome-preview-chapters"><span className="welcome-mini-label">YOUR MANUSCRIPT</span><strong>The art of<br />starting again</strong><span className="welcome-preview-chapter">01 &nbsp; A small beginning</span><span className="welcome-preview-chapter selected">02 &nbsp; Room to grow</span><span className="welcome-preview-chapter">03 &nbsp; Your next chapter</span><div className="welcome-preview-cover"><Feather size={24} /><span>THE ART OF<br /><b>STARTING<br />AGAIN</b></span><small>A NEW PERSPECTIVE</small></div></aside>
            <div className="welcome-preview-page"><div className="welcome-mini-label">CHAPTER TWO</div><h2>Room to grow</h2><p>Every story starts somewhere. Sometimes with a grand idea. Sometimes with a quiet thought that refuses to leave.</p><p>She opened the notebook, made a little room on the page, and began.</p><div className="welcome-preview-lines"><i /><i /><i /></div><div className="welcome-preview-note"><Sparkles size={18} /><span>A little help, when you need it.<small>Optional AI for drafting and rewriting.</small></span></div><span className="welcome-preview-caption">Illustrative workspace · sample manuscript</span></div>
          </div>
          <div className="welcome-preview-bottom"><span><span className="welcome-preview-dot" /> Your words come first</span><span>Plan / Write / Export</span></div>
        </div>
      </section>
      <section className="welcome-beliefs" aria-label="Made for your writing process"><div className="welcome-container">{[
        { icon: Feather, title: 'Author-led writing', detail: 'Your story. Your voice. Your pace.' },
        { icon: Sparkles, title: 'Optional AI assistance', detail: 'A little help, on your terms.' },
        { icon: Image, title: 'Your own cover designs', detail: 'Bring the cover you love.' },
        { icon: Download, title: 'Portable manuscript exports', detail: 'DOCX, EPUB, PDF and text backups.' },
      ].map(({ icon: Icon, title, detail }) => <article className="welcome-feature-glass" key={title}><div className="welcome-feature-icon"><Icon size={23} aria-hidden="true" /></div><h2>{title}</h2><p>{detail}</p></article>)}</div></section>
      <section id="how-it-works" className="welcome-section welcome-container"><div className="welcome-section-heading"><p className="welcome-eyebrow">FROM THE FIRST IDEA TO THE LAST PAGE</p><h2>One book. A few clear steps.</h2><p>You don’t need every answer before you start.<br />Just a place to put the first words.</p></div><div className="welcome-step-grid">{steps.map(({ number, icon: Icon, title, description }) => <article className="welcome-step" key={number}><div className="welcome-step-top"><Icon size={25} /><span>{number}</span></div><h3>{title}</h3><p>{description}</p></article>)}</div></section>
      <section className="welcome-choice welcome-container"><div><p className="welcome-eyebrow">SUPPORT FOR YOUR PROCESS</p><h2>Your creativity.<br />Your choice of tools.</h2><p>Write on your own, or bring your own API key for help drafting or editing a selected passage. Preview suggestions and accept only what works for you.</p><p>You choose the provider and when to use it.</p><p>Already made a cover you love? Bring it with you. Your writing workflow shouldn’t ask you to start over.</p></div><div className="welcome-tool-card"><span className="welcome-mini-label">KEEP IT SIMPLE</span><div><Feather /><span><strong>Start with your words</strong><small>No AI setup needed to begin.</small></span><Check size={18} /></div><div><Sparkles /><span><strong>Add AI when it helps</strong><small>Gemini · OpenAI · OpenRouter</small></span><Check size={18} /></div><div><Image /><span><strong>Bring your own cover</strong><small>PNG · JPG · WebP</small></span><Check size={18} /></div><p>Provider API usage is billed separately by your provider.</p></div></section>
      <div className="welcome-container"><PricingPlans source="landing"/></div>
      <section id="questions" className="welcome-section welcome-container welcome-faq"><div><p className="welcome-eyebrow">A FEW THINGS TO KNOW</p><h2>Before your<br />first chapter.</h2><img className="welcome-faq-illustration" src="/faq-questions.png" alt="" width="512" height="512" loading="lazy" /></div><div>{questions.map(([question, answer]) => <details key={question}><summary>{question}<span aria-hidden="true">+</span></summary><p>{answer}</p></details>)}</div></section>
      <section className="welcome-final welcome-container"><div className="welcome-final-quill"><Brand compact /></div><p className="welcome-eyebrow">THERE’S A BOOK IN THAT IDEA.</p><h2>Let’s give it a first page.</h2><p>Start with a title. The rest can take shape as you go.</p><Link className="welcome-primary" to={start}>{user ? 'Open your dashboard' : 'Start your book'} <ArrowRight size={19} /></Link></section>
    </main>
    <PublicFooter />
  </div>;
}
