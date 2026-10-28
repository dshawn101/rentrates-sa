// @vitest-environment jsdom
import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import {cleanup,fireEvent,render,screen} from '@testing-library/react';
import {IntroVideo} from '../src/components/onboarding/IntroVideo';
beforeEach(()=>{HTMLDialogElement.prototype.showModal=vi.fn(function(this:HTMLDialogElement){this.setAttribute('open','');});HTMLDialogElement.prototype.close=vi.fn(function(this:HTMLDialogElement){this.removeAttribute('open');});});afterEach(cleanup);
it('loads YouTube only after explicit play and removes the player and restores focus on close',()=>{
 render(<IntroVideo/>);const trigger=screen.getByRole('button',{name:'Watch the introduction'});expect(document.querySelector('iframe')).toBeNull();fireEvent.click(trigger);expect(document.querySelector('iframe')).toBeNull();fireEvent.click(screen.getByText('Play introduction'));expect(document.querySelector('iframe')?.src).toContain('youtube-nocookie.com/embed/1ehk8a2IEho');fireEvent.click(screen.getByLabelText('Close introduction video'));expect(document.querySelector('iframe')).toBeNull();expect(document.activeElement).toBe(trigger);expect(document.body.style.overflow).toBe('');
});
it('allows Escape to dismiss without loading the video',()=>{render(<IntroVideo/>);fireEvent.click(screen.getByText('Watch the introduction'));fireEvent(screen.getByRole('dialog'),new Event('cancel',{cancelable:true}));expect(screen.queryByRole('dialog')).toBeNull();expect(document.querySelector('iframe')).toBeNull();});
