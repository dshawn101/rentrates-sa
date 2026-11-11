'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { BookOpen, Download, ShieldCheck, X } from 'lucide-react';
import type { DismissMethod } from '../hooks/useSeriesBibleModalTrigger';
import '../styles/series-bible-modal.css';

const bullets = [
  [BookOpen, 'Builds a full series bible from your manuscript'],
  [Download, 'Exports as Markdown — yours to keep'],
  [ShieldCheck, 'Processed in your browser. Nothing stored on our servers.'],
] as const;

export default function SeriesBibleModal({ close }: {close: (method: DismissMethod | 'cta') => void}) {
  const [announcement, setAnnouncement] = useState('');
  const dialog = useRef<HTMLDialogElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const laterButton = useRef<HTMLButtonElement>(null);
  const outside = useRef(false);
  const title = useId(), description = useId();

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    const previous = document.activeElement;
    const {overflow, paddingRight} = document.body.style;
    const gap = window.innerWidth - document.documentElement.clientWidth;
    const padding = parseFloat(getComputedStyle(document.body).paddingRight) || 0;
    element.showModal();
    document.body.style.overflow = 'hidden';
    if (gap > 0) document.body.style.paddingRight = `${padding + gap}px`;
    closeButton.current?.focus();
    const frame = requestAnimationFrame(() => setAnnouncement('Series Bible tool available.'));
    return () => {
      cancelAnimationFrame(frame);
      element.close();
      document.body.style.overflow = overflow;
      document.body.style.paddingRight = paddingRight;
      if (previous instanceof HTMLElement && previous.isConnected) previous.focus({preventScroll: true});
    };
  }, []);

  // The trigger only mounts this chunk in response to client events after load.
  return typeof document !== 'undefined' ? createPortal(
    <dialog ref={dialog} className="series-promo" role="dialog" aria-modal="true" aria-labelledby={title} aria-describedby={description}
      onCancel={event => {event.preventDefault(); close('escape');}}
      onPointerDown={event => {outside.current = event.target === event.currentTarget;}}
      onClick={event => {if (outside.current && event.target === event.currentTarget) close('backdrop'); outside.current = false;}}
      onKeyDown={event => {
        if (event.key !== 'Tab') return;
        if (event.shiftKey && document.activeElement === closeButton.current) {
          event.preventDefault(); laterButton.current?.focus();
        } else if (!event.shiftKey && document.activeElement === laterButton.current) {
          event.preventDefault(); closeButton.current?.focus();
        }
      }}>
      <div className="series-promo-content">
        <button ref={closeButton} type="button" className="series-promo-close" aria-label="Close" onClick={() => close('close')}><X size={20} aria-hidden="true"/></button>
        <div className="series-promo-brand">
          <img src="/puble-quill.png" width="60" height="60" alt=""/>
          <div><span className="series-promo-wordmark">PubléStudio</span><p className="series-promo-eyebrow">Free tool</p></div>
        </div>
        <h2 id={title}>Turn Book #1 into a Book #2 blueprint</h2>
        <p id={description}>Upload your finished manuscript and get a structured series bible — characters, unresolved threads, and a chapter-by-chapter outline for the next book.</p>
        <ul>{bullets.map(([Icon, label]) => <li key={label}><Icon size={16} aria-hidden="true"/><span>{label}</span></li>)}</ul>
        <a className="series-promo-cta" href="/series-bible?utm_source=modal&utm_medium=site&utm_campaign=series_bible_launch" onClick={() => close('cta')}>Try the Series Bible tool →</a>
        <button ref={laterButton} type="button" className="series-promo-later" onClick={() => close('later')}>Maybe later</button>
        <p className="series-promo-micro">No account needed. Bring your own OpenRouter key.</p>
        <span className="sr-only" aria-live="polite">{announcement}</span>
      </div>
    </dialog>, document.body) : null;
}
