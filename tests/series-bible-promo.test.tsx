// @vitest-environment jsdom
import {act, cleanup, fireEvent, render, screen} from '@testing-library/react';
import {afterEach, expect, it, vi} from 'vitest';

async function setup(options: {path?: string; loggedIn?: boolean; loading?: boolean; mobile?: boolean; width?: number; setupStorage?: () => void} = {}) {
  vi.resetModules();
  vi.useFakeTimers();
  Object.defineProperty(document, 'readyState', {configurable: true, value: 'complete'});
  Object.defineProperty(document, 'visibilityState', {configurable: true, value: 'visible'});
  vi.stubGlobal('matchMedia', (query: string) => ({matches: options.mobile ? query.includes('coarse') : query.includes('fine')}));
  vi.stubGlobal('innerWidth', options.width ?? (options.mobile ? 375 : 1200));
  vi.stubGlobal('innerHeight', 667);
  vi.stubGlobal('scrollY', 0);
  Object.defineProperty(document.documentElement, 'scrollHeight', {configurable: true, value: 2667});
  const previousShow = HTMLDialogElement.prototype.showModal;
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', ''); };
  restorers.push(() => { HTMLDialogElement.prototype.showModal = previousShow; });
  options.setupStorage?.();
  const {useSeriesBibleModalTrigger} = await import('../src/hooks/useSeriesBibleModalTrigger');
  function Harness() {
    const {open, close} = useSeriesBibleModalTrigger({pathname: options.path ?? '/', loggedIn: !!options.loggedIn, loading: !!options.loading});
    return <><button data-open-series-bible-modal>Explore</button>{open && <button onClick={() => close('later')}>Maybe later</button>}{open && <button onClick={() => close('cta')}>Visit tool</button>}</>;
  }
  return render(<Harness/>);
}
const restorers: (()=>void)[] = [];
afterEach(() => {cleanup(); vi.useRealTimers(); vi.unstubAllGlobals(); for (const restore of restorers.splice(0)) restore(); localStorage.clear(); sessionStorage.clear();});
const tick = (ms: number) => act(() => vi.advanceTimersByTime(ms));
const topExit = () => fireEvent.mouseLeave(document, {clientY: 0});
const modal = () => screen.queryByText('Maybe later');

it('waits through the grace period and debounces an exit intent once', async () => {
  await setup();
  topExit(); expect(modal()).toBeNull();
  tick(3000); topExit(); tick(499); expect(modal()).toBeNull();
  tick(1); expect(modal()).toBeTruthy();
  fireEvent.click(modal()!); expect(modal()).toBeNull();
  expect(Number(localStorage.getItem('ps_series_bible_modal_dismissed'))).toBeGreaterThan(0);
  localStorage.clear(); tick(60_000); topExit(); expect(modal()).toBeNull();
});
it('cancels the exit when the pointer returns and never re-arms that exit trigger', async () => {
  await setup(); tick(3000); topExit(); fireEvent.mouseEnter(document); tick(500); topExit(); tick(500); expect(modal()).toBeNull();
});
it('opens after 45 seconds only once the tab is visible', async () => {
  await setup(); Object.defineProperty(document, 'visibilityState', {configurable: true, value: 'hidden'});
  tick(45_000); expect(modal()).toBeNull();
  Object.defineProperty(document, 'visibilityState', {configurable: true, value: 'visible'});
  fireEvent(document, new Event('visibilitychange')); expect(modal()).toBeTruthy();
});
it('requires 60% scroll on a narrow touch viewport, then opens', async () => {
  await setup({mobile: true}); tick(3000); fireEvent.click(screen.getByText('Explore')); expect(modal()).toBeNull();
  vi.stubGlobal('scrollY', 1199); fireEvent.scroll(window); expect(modal()).toBeNull();
  vi.stubGlobal('scrollY', 1200); fireEvent.scroll(window); expect(modal()).toBeTruthy();
});
it.each(['/series-bible','/pricing','/login','/signup','/dashboard','/auth/login','/auth/signup'])('never arms on %s', async path => {
  await setup({path}); tick(46_000); fireEvent.click(screen.getByText('Explore')); expect(modal()).toBeNull();
});
it.each([{loggedIn:true},{loading:true}])('suppresses while authenticated or restoring a session (%j)', async state => {
  await setup(state); tick(46_000); fireEvent.click(screen.getByText('Explore')); expect(modal()).toBeNull();
});
it('respects local and session dismissal and permanent CTA suppression', async () => {
  await setup({setupStorage: () => localStorage.setItem('ps_series_bible_modal_dismissed', String(Date.now() - 13*86_400_000))});
  tick(46_000); expect(modal()).toBeNull();
});
it('opens after a fourteen-day dismissal expires and records permanent CTA intent', async () => {
  await setup({setupStorage: () => localStorage.setItem('ps_series_bible_modal_dismissed', String(Date.now() - 14*86_400_000))});
  tick(3000); fireEvent.click(screen.getByText('Explore')); expect(modal()).toBeTruthy();
  fireEvent.click(screen.getByText('Visit tool')); expect(localStorage.getItem('ps_series_bible_modal_clicked')).not.toBeNull();
});
it.each(['localStorage','sessionStorage'] as const)('suppresses on a pre-existing %s flag', async storage => {
  await setup({setupStorage: () => window[storage].setItem(storage === 'localStorage' ? 'ps_series_bible_modal_clicked' : 'ps_series_bible_modal_seen', '1')});
  tick(46_000); expect(modal()).toBeNull();
});
it('stops timers and removes listeners on unmount', async () => {
  const remove = vi.spyOn(document, 'removeEventListener');
  const harness = await setup(); tick(3000); topExit(); harness.unmount(); tick(46_000);
  expect(remove.mock.calls.some(([event]) => event === 'mouseleave')).toBe(true);
  expect(modal()).toBeNull(); remove.mockRestore();
});
