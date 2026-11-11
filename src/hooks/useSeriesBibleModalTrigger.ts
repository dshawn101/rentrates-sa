import { useEffect, useRef, useState } from 'react';

export const DISMISSAL_DAYS = 14;
const DISMISSED = 'ps_series_bible_modal_dismissed';
const CLICKED = 'ps_series_bible_modal_clicked';
const SESSION = 'ps_series_bible_modal_seen';
const DAY_MS = 86_400_000;
const PRICING_APPROACH_PX = 160;
export type Trigger = 'exit_intent' | 'time' | 'scroll' | 'cta';
export type DismissMethod = 'close' | 'backdrop' | 'escape' | 'later';
type Event =
  | ['series_bible_modal_shown', {trigger: Trigger}]
  | ['series_bible_modal_cta_clicked']
  | ['series_bible_modal_dismissed', {method: DismissMethod}];

function track(..._event: Event) {
  // Wire into a consent-aware site analytics wrapper when one is introduced.
  void _event;
}
let seenInMemory = false;
function read(kind: 'localStorage' | 'sessionStorage', key: string) {
  try { return window[kind].getItem(key); } catch { return null; }
}
function write(kind: 'localStorage' | 'sessionStorage', key: string, value: string) {
  try { window[kind].setItem(key, value); } catch { /* Storage may be blocked. */ }
}
function suppressed() {
  const dismissed = Number(read('localStorage', DISMISSED));
  return seenInMemory || read('sessionStorage', SESSION) !== null ||
    read('localStorage', CLICKED) !== null ||
    (dismissed > 0 && Date.now() - dismissed < DISMISSAL_DAYS * DAY_MS);
}

export function useSeriesBibleModalTrigger({ pathname, loggedIn, loading }: {
  pathname: string; loggedIn: boolean; loading: boolean;
}) {
  const eligible = pathname === '/' && !loggedIn && !loading;
  const [open, setOpen] = useState(false);
  const active = useRef(false);

  function close(method: DismissMethod | 'cta') {
    if (!active.current) return;
    active.current = false;
    write('sessionStorage', SESSION, '1');
    if (method === 'cta') {
      write('localStorage', CLICKED, String(Date.now()));
      track('series_bible_modal_cta_clicked');
    } else {
      write('localStorage', DISMISSED, String(Date.now()));
      track('series_bible_modal_dismissed', {method});
    }
    setOpen(false);
  }

  useEffect(() => {
    if (!eligible || suppressed() || typeof HTMLDialogElement.prototype.showModal !== 'function') return;
    let grace: number | undefined, timer: number | undefined, exit: number | undefined;
    let exitAttempted = false, timeReady = false, scrollMet = false;
    let previousScrollY = window.scrollY;
    const pricing = document.querySelector('[data-series-bible-pricing]');
    const fine = window.matchMedia('(pointer: fine)');
    const coarse = window.matchMedia('(pointer: coarse)');
    const updateScroll = () => {
      const distance = document.documentElement.scrollHeight - window.innerHeight;
      if (distance > 0 && window.scrollY / distance >= .6) scrollMet = true;
    };
    const show = (trigger: Trigger, reachedPricing = false) => {
      updateScroll();
      if (suppressed() || document.visibilityState !== 'visible' ||
          (window.innerWidth < 640 && !scrollMet && !reachedPricing) || document.querySelector('dialog[open]')) return false;
      seenInMemory = true;
      write('sessionStorage', SESSION, '1');
      active.current = true;
      setOpen(true);
      track('series_bible_modal_shown', {trigger});
      disarm();
      return true;
    };
    const onExit = (event: MouseEvent) => {
      if (!fine.matches || event.clientY > 0 || exitAttempted) return;
      exitAttempted = true;
      exit = window.setTimeout(() => show('exit_intent'), 500);
    };
    const onEnter = () => window.clearTimeout(exit);
    const onScroll = () => {
      updateScroll();
      const currentScrollY = window.scrollY;
      const scrolledDown = currentScrollY > previousScrollY;
      previousScrollY = currentScrollY;
      if (!scrolledDown) return;
      // The section's top stays above this line even if a fast scroll skips past it.
      const reachedPricing = pricing !== null &&
        pricing.getBoundingClientRect().top <= window.innerHeight + PRICING_APPROACH_PX;
      if (reachedPricing || (scrollMet && coarse.matches)) show('scroll', reachedPricing);
    };
    const onTime = () => { if (timeReady && fine.matches) show('time'); };
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey ||
          event.ctrlKey || event.shiftKey || event.altKey) return;
      if (event.target instanceof Element && event.target.closest('[data-open-series-bible-modal]') && show('cta')) {
        event.preventDefault();
      }
    };
    const disarm = () => {
      window.clearTimeout(grace);
      window.clearTimeout(timer);
      window.clearTimeout(exit);
      window.removeEventListener('load', onLoad);
      document.removeEventListener('mouseleave', onExit);
      document.removeEventListener('mouseenter', onEnter);
      window.removeEventListener('scroll', onScroll);
      document.removeEventListener('visibilitychange', onTime);
      document.removeEventListener('click', onClick);
    };
    const onLoad = () => {
      const elapsed = performance.now() - ((performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined)?.loadEventEnd || performance.now());
      grace = window.setTimeout(() => {
        if (suppressed()) return;
        document.addEventListener('mouseleave', onExit, {passive: true});
        document.addEventListener('mouseenter', onEnter, {passive: true});
        previousScrollY = window.scrollY;
        window.addEventListener('scroll', onScroll, {passive: true});
        document.addEventListener('visibilitychange', onTime);
        document.addEventListener('click', onClick);
        timer = window.setTimeout(() => { timeReady = true; onTime(); }, Math.max(0, 45_000 - Math.max(3000, elapsed)));
      }, Math.max(0, 3000 - elapsed));
    };
    if (document.readyState === 'complete') onLoad();
    else window.addEventListener('load', onLoad, {once: true});
    return disarm;
  }, [eligible]);

  return {open: eligible && open, close};
}
