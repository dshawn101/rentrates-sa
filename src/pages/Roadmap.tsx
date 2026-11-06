import { ArrowRight, BookOpen, Feather, ScanText, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Brand } from '../components/ui/Brand';
import { PublicFooter } from '../components/legal/PublicFooter';
import '../styles/roadmap.css';

const stages = [
  { label: 'Live in beta', heading: 'Write with confidence.', detail: 'A place to plan, write, revise and take your manuscript with you.' },
  { label: 'Next · Author V1', heading: 'Finish with confidence.', detail: 'The proposed first paid expansion: stronger revision, editorial feedback and production checks.' },
  { label: 'Later · Pro V2', heading: 'Publish with a team.', detail: 'A later direction for small publishing teams managing several books.' },
];

const tracks = [
  { id: 'writing', title: 'Writing & organisation', icon: Feather, cells: [
    ['Chapter planning, editable book templates, goals and project folders', 'Autosave, recovery drafts and saved chapter versions'],
    ['Research and continuity notes for characters, sources and timelines', 'A revision checklist that follows the manuscript'],
    ['Shared series notes across books', 'A production view across multiple titles'],
  ] },
  { id: 'review', title: 'Review & AI', icon: ScanText, cells: [
    ['Optional AI with your own provider key and review before accepting edits', 'Whole-book review with suggestions linked to passages'],
    ['Review findings grouped by chapter and priority', 'Clearer usage estimates before sending a review request'],
    ['Shared editorial review queues and approval steps', 'Usage reporting across a team'],
  ] },
  { id: 'publishing', title: 'Export & publishing', icon: BookOpen, cells: [
    ['DOCX, EPUB, PDF, TXT and Markdown exports', 'Cover import and a beta 6 × 9 text-only interior template'],
    ['More interior templates and clearer print preflight checks', 'A publication checklist for front matter, cover and export files'],
    ['Reusable production settings across titles', 'Explore distribution handoffs and release tracking'],
  ] },
  { id: 'collaboration', title: 'Collaboration & support', icon: Users, cells: [
    ['Private author workspace', 'Author Guide, Help Center and page-aware Ask the Guide'],
    ['Invite an editor or beta reader to review a manuscript', 'Comments on passages and a way to resolve feedback'],
    ['Team workspaces with roles and approvals', 'Project activity history for handovers'],
  ] },
];

export function Roadmap() {
  return <div className="puble-roadmap">
    <header className="welcome-container puble-roadmap-header">
      <Link to="/" aria-label="PubléStudio home"><Brand /></Link>
      <nav aria-label="Roadmap navigation"><Link to="/features">Features</Link><Link to="/pricing">Pricing</Link></nav>
    </header>
    <main className="welcome-container">
      <section className="puble-roadmap-hero" aria-labelledby="roadmap-title">
        <p className="puble-roadmap-eyebrow">PubléStudio product roadmap</p>
        <h1 id="roadmap-title">From first draft<br /><em>to publication.</em></h1>
        <p>See what you can use today and where PubléStudio is heading: a better way to finish your manuscript, work with an editor and prepare your book for readers.</p>
        <div className="puble-roadmap-stages">{stages.map((stage, i) => <article key={stage.label}>
          <span className={`puble-roadmap-badge stage-${i}`}>{stage.label}</span>
          <h2>{stage.heading}</h2><p>{stage.detail}</p>
        </article>)}</div>
      </section>
      <section className="puble-roadmap-plan" aria-labelledby="roadmap-plan-title">
        <h2 id="roadmap-plan-title">The plan, by writing need</h2>
        <p className="puble-roadmap-note">Author V1 and Pro V2 describe the proposed release order. Scope, plan availability and timing may change with author feedback and testing.</p>
        {tracks.map(({ id, title, icon: Icon, cells }) => <section className="puble-roadmap-track" key={id} aria-labelledby={`roadmap-${id}`}>
          <h3 id={`roadmap-${id}`}><Icon size={21} aria-hidden="true" />{title}</h3>
          <div className="puble-roadmap-cells">{cells.map((items, i) => <div key={stages[i].label}>
            <h4 className={`puble-roadmap-badge stage-${i}`}>{stages[i].label}</h4>
            <ul>{items.map(item => <li key={item}>{item}</li>)}</ul>
          </div>)}</div>
        </section>)}
        <p className="puble-roadmap-note">AI remains optional and provider charges are separate. Print exports still need a printer proof. <Link to="/transparency">See current features and costs</Link>.</p>
      </section>
      <section className="puble-roadmap-feedback">
        <div><h2>What would help you finish your book?</h2><p>Tell us where you get stuck, or start writing in the free beta.</p></div>
        <div className="puble-roadmap-actions"><Link to="/contact" className="glass-button">Share feedback <ArrowRight size={16} aria-hidden="true" /></Link><Link to="/auth/signup" className="glass-button">Join the free beta</Link></div>
      </section>
    </main>
    <PublicFooter />
  </div>;
}
