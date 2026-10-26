import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Brand } from '../components/ui/Brand';
import { PublicFooter } from '../components/legal/PublicFooter';
import '../styles/welcome.css';
import '../styles/legal.css';

const policies: Record<string, { title: string; intro: string; sections: { title: string; text: string }[] }> = {
  about: {
    title: 'A little help. All your voice.', intro: 'PubléStudio is a writing workspace for authors who want a clear path from an idea to a manuscript.',
    sections: [
      { title: 'A focused writing process', text: 'Set up your book, outline chapters, write and edit your text, import an optional front cover, and export DOCX, EPUB, PDF or text manuscripts. You can write manually without an AI key.' },
      { title: 'Tools on your terms', text: 'Optional AI assistance uses your own supported provider API key. Provider charges are separate. Cover designs made in external tools can be imported without connecting those tools.' },
      { title: 'Contact', text: 'Questions, feedback, account requests, and privacy enquiries can be sent to support@publestudio.com. Do not include passwords or API keys in your message.' },
    ],
  },
  privacy: {
    title: 'Privacy Policy', intro: 'This policy explains how PubléStudio handles information when you use the website and writing workspace. Last updated: 26 October 2026.',
    sections: [
      { title: 'Information used to provide the service', text: 'We process your account email and authentication information, book details, chapter text, uploaded covers, settings you choose to save, and contact-form details (name, reply email, query type, subject, optional book title and message). Supabase provides authentication, database, and cover storage. Vercel hosts the application and AI relay and may process request, device, network, and security information to operate the service.' },
      { title: 'How your information is used', text: 'Information is used to sign you in, store and retrieve your projects, generate requested exports, remember requested settings, support your account, and maintain the service. Book and cover access is restricted to the account through database and storage access policies. No system can promise absolute security.' },
      { title: 'Optional AI and external tools', text: 'When you request AI assistance, your key, prompt, and relevant writing context pass through the authenticated PubléStudio relay to your selected provider. OpenAI artwork generation sends the requested prompt to OpenAI. Provider processing, retention, and any model-training use are governed by the provider’s own terms and account settings. PubléStudio does not operate a model-training service. External design tools have their own policies. Connecting an optional MCP server or running its tools sends the inputs you approve to that server.' },
      { title: 'Keys and browser storage', text: 'You choose whether each provider API key is remembered in encrypted IndexedDB storage for your account on this device or used for the current session only. Remembered keys survive refresh and sign-out; sign-out clears decrypted page memory. Forget key removes the remembered copy on this device. Clearing browser site data also removes it. The browser-held encryption key is not exportable, but scripts with access to this site can still use it; this is not a password-protected vault. MCP tokens remain in page memory and clear on refresh or sign-out. Neither kind of key is saved in the application database. Non-secret model choices, writing defaults, and saved server details are stored locally for each account. Authentication uses persistent browser storage. Chapter recovery drafts and the last opened chapter are stored locally, scoped by account, book and chapter. Drafts remain on this device until saved, replaced, discarded or site data is cleared; sign-out does not remove them. Shared-device users should clear site data when finished. Whole-book review checkpoints contain summaries and quoted manuscript excerpts under account/book-scoped puble:review keys. They remain on this browser across sign-out until Clear review is used or site data is cleared. Successful AI usage records under puble:ai-usage contain provider/model, time and reported tokens/cost, up to 50 per account on this device; they contain no prompts or API keys. They remain until overwritten or site data is cleared. Cloud history retains up to 50 previous changed text versions per chapter. A key saved by an older app version may remain in legacy browser storage until explicitly imported and removed.' },
      { title: 'Retention and deletion requests', text: 'Projects are retained to provide access to your saved work. Support requests are retained to review enquiries and provide follow-up; only service operators can access the support inbox. Browser settings and recovery data have separate lifetimes described in the Cookie Policy. Contact support@publestudio.com to request account access, correction, or deletion. We may verify account ownership before handling a request. Backup and operational records may remain subject to provider retention and applicable obligations; deletion is not an instant guarantee across every backup.' },
      { title: 'Service providers and international processing', text: 'Information is processed by the hosting, authentication, storage, and AI providers needed for the features you use. Processing may occur outside your country. Provider policies explain their locations, safeguards, and retention. PubléStudio currently has no app-installed advertising or optional analytics tracking.' },
      { title: 'Your choices and contact', text: 'AI and external tool use are optional. Avoid submitting sensitive information you do not want sent to a provider. Your privacy rights depend on applicable law; send requests or concerns to support@publestudio.com. Material changes to this policy will be reflected in the updated date and, where appropriate, a service notice.' },
    ],
  },
  terms: {
    title: 'Terms & Conditions', intro: 'These terms describe use of PubléStudio’s website and writing workspace. Last updated: 26 October 2026.',
    sections: [
      { title: 'Using PubléStudio', text: 'Use the service lawfully and provide account details you are authorised to use. Keep your credentials private and tell us if you suspect unauthorised access. Do not attempt to access another person’s projects, bypass security, interfere with the service, or misuse connected providers.' },
      { title: 'Your writing and uploaded material', text: 'You retain your rights in the writing and artwork you provide. You give PubléStudio the permissions necessary to store, process, display, and export that material to provide the features you request. You are responsible for having the rights and permissions needed for your uploads and for reviewing material before sharing or publication.' },
      { title: 'AI assistance and connected services', text: 'AI is optional and may produce inaccurate, incomplete, biased, or non-unique content. Review generated material for accuracy, suitability, and third-party rights. We cannot guarantee originality, copyright eligibility, publication acceptance, or commercial outcomes. Your AI providers and external tools apply their own terms. Do not share a key you are not authorised to use.' },
      { title: 'Costs and feature availability', text: 'BYOK requests may incur charges directly from your selected provider. A subscription to an AI chat app does not necessarily supply API credits. PubléStudio currently does not offer a working paid subscription checkout. Available features and limits are described on Features & costs. Free-tier PDF exports include a watermark. No paid upgrade or trial is promised by these terms.' },
      { title: 'Exports and backups', text: 'Exports include editable documents, ebooks and manuscript reading copies. They preserve basic supported text and formatting, not complex source layouts, comments, tracked changes or footnotes. They are not guaranteed to meet a printer’s bleed, spine, font, accessibility, or publishing-platform specifications. Keep your own copies of important work and inspect exports. The service does not guarantee uninterrupted availability, error-free operation, or recovery of every unsaved change.' },
      { title: 'Misuse and service changes', text: 'Access may be restricted where reasonably necessary to address unlawful use, compromised accounts, security threats, or material breaches. Features may change as the service develops. Where practicable, we will communicate material changes affecting access to saved work. Account or deletion requests can be sent to support@publestudio.com.' },
      { title: 'Responsibility and mandatory rights', text: 'You are responsible for your use and publication of content. To the extent permitted by applicable law, PubléStudio does not guarantee publishing results or assume responsibility for third-party service failures or indirect business losses. Nothing in these terms excludes liability or consumer and privacy rights that cannot lawfully be excluded.' },
      { title: 'Copyright and contact', text: 'PubléStudio’s branding, site design, and original service materials are protected by applicable intellectual property rights. This does not transfer ownership of your manuscripts to PubléStudio. Contact support@publestudio.com for support, rights concerns, or questions about these terms.' },
    ],
  },
  cookies: {
    title: 'Cookie & Browser Storage Policy', intro: 'Cookies are one way a website remembers information. PubléStudio also uses local storage and tab-based session storage. Last updated: 26 October 2026.',
    sections: [
      { title: 'Necessary storage', text: 'Authentication storage maintained by Supabase helps restore your sign-in session. Requested writing and provider settings use local storage under an account-specific puble:integrations key. Chapter recovery uses account-scoped local storage under puble:draft keys; puble:resume remembers the last opened chapter. Older tab drafts may be recovered from session storage with an explicit cloud comparison. Requested whole-book review progress uses account/book-scoped puble:review storage; successful-request token/cost records use account-scoped puble:ai-usage storage (up to 50 records). Review checkpoints contain summaries and source excerpts, not keys. Both remain after sign-out until explicitly cleared or site data is cleared. These functions support sign-in, requested features, and recovery; choosing necessary-only mode does not disable them.' },
      { title: 'The notice choice', text: 'The puble:cookie-notice:v1 local-storage entry records necessary-only mode, a notice version, and the time you saved the choice. The notice will ask again after up to 180 days or when its version changes. This is a browser-level acknowledgement, not proof of consent to optional tracking or acceptance of the Terms.' },
      { title: 'Optional cookies and tracking', text: 'No optional analytics, advertising, or social-media tracking is installed by this application at present. There are no optional categories to switch on. If we introduce non-essential storage, we will explain its purpose and ask for a separate choice before enabling it. Hosting and linked third-party sites may use their own necessary security mechanisms and policies.' },
      { title: 'Storage lifetimes', text: 'Local settings remain until overwritten or removed from this browser. Authentication storage follows session and sign-out behaviour. Chapter drafts remain in account-scoped local storage across refresh and sign-out until saved, replaced, discarded or site data is cleared. Last-opened-chapter preferences also remain locally. Clearing site data can remove settings and unsaved recovery drafts and sign you out.' },
      { title: 'Changing your choice', text: 'Use Cookie settings in the cookie banner to review storage information. After dismissing the banner, use the floating cookie icon at the bottom of the page to reopen it. You can also manage site storage in your browser. If storage is blocked, necessary-only mode still applies and the notice may reappear on a later visit. Remembered provider API keys and their browser encryption keys stay in IndexedDB until you forget them or clear site data. Session-only provider keys and MCP tokens stay in page memory; legacy keys from an older version may need explicit removal.' },
      { title: 'Questions', text: 'Read the Privacy Policy for information about account data, AI providers, and requests. Send cookie or privacy questions to support@publestudio.com.' },
    ],
  },
};

export function Legal() {
  const { document = '' } = useParams();
  const policy = policies[document];
  useEffect(() => {
    window.scrollTo(0, 0);
    const previousTitle = window.document.title;
    window.document.title = `${policy?.title || 'Page not found'} — PubléStudio`;
    return () => { window.document.title = previousTitle; };
  }, [document, policy?.title]);
  return <div className="welcome puble-legal-page">
    <header className="welcome-nav welcome-container"><Link to="/" aria-label="PubléStudio home"><Brand /></Link><Link className="welcome-signin" to="/">Back to home</Link></header>
    <main className="puble-legal-content welcome-container">
      <p className="welcome-eyebrow">{document === 'about' ? 'ABOUT PUBLÉSTUDIO' : 'CLEAR INFORMATION. YOUR CHOICES.'}</p>
      <h1>{policy?.title || 'Page not found'}</h1>
      <p className="puble-legal-intro">{policy?.intro || 'Choose a document from the legal links below.'}</p>
      {policy?.sections.map(section => <section key={section.title}><h2>{section.title}</h2><p>{section.text}</p></section>)}
      <nav className="puble-legal-links" aria-label="Related policies"><Link to="/legal/privacy">Privacy Policy</Link><Link to="/legal/terms">Terms & Conditions</Link><Link to="/legal/cookies">Cookie Policy</Link></nav>
    </main>
    <PublicFooter />
  </div>;
}
