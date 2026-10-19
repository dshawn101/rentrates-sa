import { Link } from 'react-router-dom';
import { Brand } from '../ui/Brand';
import { COOKIE_NOTICE_EVENT } from '../../lib/cookie-preferences';

export function PublicFooter() {
  return <footer className="puble-public-footer welcome-container">
    <div className="puble-footer-grid">
      <div className="puble-footer-brand"><Link to="/" aria-label="PubléStudio home"><Brand /></Link><p>A calm space to plan, write, and bring your manuscript together. A little help. All your voice.</p></div>
      <nav aria-label="Product"><h2>Product</h2><a href="/#how-it-works">How it works</a><a href="/#questions">FAQ</a><Link to="/transparency">Features & costs</Link></nav>
      <nav aria-label="Company"><h2>Company</h2><Link to="/legal/about">About PubléStudio</Link><a href="mailto:support@publestudio.com">Contact & support</a></nav>
      <nav aria-label="Legal"><h2>Legal</h2><Link to="/legal/privacy">Privacy Policy</Link><Link to="/legal/terms">Terms & Conditions</Link><Link to="/legal/cookies">Cookie Policy</Link><button type="button" onClick={() => window.dispatchEvent(new Event(COOKIE_NOTICE_EVENT))}>Cookie settings</button></nav>
    </div>
    <div className="puble-footer-bottom"><p>© {new Date().getFullYear()} PubléStudio. All rights reserved.</p><a href="mailto:support@publestudio.com">support@publestudio.com</a></div>
  </footer>;
}
