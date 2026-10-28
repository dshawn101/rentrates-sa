import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { COOKIE_NOTICE_EVENT, hasCurrentCookieChoice, saveNecessaryOnly } from '../../lib/cookie-preferences';

export function CookieNotice() {
  const { pathname } = useLocation();
  const [visible, setVisible] = useState(() => {
    try { return !hasCurrentCookieChoice(window.localStorage); } catch { return true; }
  });
  const [details, setDetails] = useState(false);
  const [explicitlyOpened, setExplicitlyOpened] = useState(false);
  const [storageError, setStorageError] = useState(false);

  useEffect(() => {
    const open = () => { setVisible(true); setDetails(true); setExplicitlyOpened(true); setStorageError(false); };
    window.addEventListener(COOKIE_NOTICE_EVENT, open);
    return () => window.removeEventListener(COOKIE_NOTICE_EVENT, open);
  }, []);

  const save = () => {
    let saved = false;
    try { saved = saveNecessaryOnly(window.localStorage); } catch { /* Browser storage can be unavailable. */ }
    if (!saved) { setStorageError(true); return; }
    setVisible(false);
    setExplicitlyOpened(false);
  };
  const publicPage = pathname === '/' || pathname.startsWith('/legal/');
  if (!publicPage && !explicitlyOpened) return null;
  if (!visible) return <button type="button" className="puble-cookie-launcher" aria-label="Open cookie settings" title="Cookie settings" onClick={() => { setVisible(true); setDetails(true); setStorageError(false); }}>
    <img src="/cookie-icon.jpg" width="28" height="28" alt="" />
  </button>;

  return <section className="puble-cookie" aria-label="Cookie and browser storage notice">
    <div className="puble-cookie-intro">
      <img src="/cookie-icon.jpg" width="48" height="48" alt="" />
      <div><h2>{details ? 'Cookie settings' : 'A little storage. A clear choice.'}</h2><p>We use necessary browser storage for sign-in, requested settings, and draft recovery. No optional analytics or advertising cookies are enabled by this app. The dashboard includes a YouTube introduction player; the landing-page player loads only when you choose Play.</p></div>
    </div>
    {details && <div className="puble-cookie-details">
      <p><strong>Necessary storage · always active</strong><br />Keeps your session working, remembers settings you save, and recovers chapter drafts in this tab. This notice remembers your choice on this browser for up to 180 days.</p>
      <p><strong>Optional tracking · not in use</strong><br />There are currently no optional tracking categories to enable. The dashboard loads an embedded YouTube introduction. The landing-page introduction asks before loading YouTube; PayPal opens only for a requested checkout. These services may use their own storage. If that changes, we will ask before enabling them.</p>
      <Link to="/legal/cookies">Read the Cookie Policy</Link><span> · </span><Link to="/legal/privacy">Privacy Policy</Link>
    </div>}
    {storageError && <p role="alert" className="puble-cookie-error">Your browser could not save this choice. Necessary-only mode still applies. You can dismiss this notice for this visit.</p>}
    <div className="puble-cookie-actions">
      {!details && <button type="button" onClick={() => setDetails(true)} aria-expanded={details}>Cookie settings</button>}
      <button type="button" onClick={save}>{details ? 'Save & close' : 'Necessary only'}</button>
      {storageError && <button type="button" onClick={() => { setVisible(false); setExplicitlyOpened(false); }}>Dismiss for this visit</button>}
      {!details && <Link to="/legal/cookies">Cookie Policy</Link>}
    </div>
  </section>;
}
