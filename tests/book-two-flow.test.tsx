// @vitest-environment jsdom
import {webcrypto} from 'node:crypto';
import {IDBFactory} from 'fake-indexeddb';
import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import {cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react';
import {BookTwoExtrapolator} from '../src/tools/book-two/BookTwoExtrapolator';
import {BLUEPRINT_SECTIONS,OPENROUTER_URL} from '../src/tools/book-two/openrouter';
import {hasOpenRouterKey} from '../src/tools/book-two/key-vault';
vi.mock('../src/components/LottieStageLoader',()=>({LottieStageLoader:({stage}:{stage:string})=><p role="status">{stage}</p>}));
beforeEach(()=>{vi.stubGlobal('crypto',webcrypto);vi.stubGlobal('indexedDB',new IDBFactory());});afterEach(()=>{cleanup();vi.unstubAllGlobals();vi.restoreAllMocks();});
function stream(text:string){return new Response(`data: ${JSON.stringify({choices:[{delta:{content:text}}]})}\n\ndata: {"choices":[{"delta":{},"finish_reason":"stop"}]}\n\ndata: [DONE]\n\n`);}
it('parses locally, hides saved key, streams a safe blueprint and resets while retaining only the encrypted key',async()=>{
 const output=BLUEPRINT_SECTIONS.map(s=>`## ${s}\n\nA proposal for the author.`).join('\n\n')+'\n\n<script>bad()</script>\n\n![tracking](https://untrusted.invalid/pixel)';
 const request=vi.fn().mockResolvedValueOnce(stream('{"digest":"A fictional narrator waits at a gate."}')).mockResolvedValueOnce(stream(JSON.stringify({markdown:output})));vi.stubGlobal('fetch',request);
 const log=vi.spyOn(console,'log');render(<BookTwoExtrapolator/>);
 fireEvent.change(screen.getByLabelText('Manuscript for Book #2 planning'),{target:{files:[new File(['FICTIONAL-FLOW-CANARY: Mara opens the gate.'],'fictional.txt')]}});await screen.findByText('fictional.txt');expect(request).not.toHaveBeenCalled();
 fireEvent.change(screen.getByLabelText('OpenRouter API key'),{target:{value:'synthetic-key-not-real'}});fireEvent.click(screen.getByText('Encrypt & save key'));await screen.findByText('Encrypted key saved · never displayed');expect(screen.queryByDisplayValue('synthetic-key-not-real')).toBeNull();expect(request).not.toHaveBeenCalled();
 fireEvent.click(screen.getByLabelText('This is the manuscript I want to use.'));fireEvent.click(screen.getByLabelText(/I choose to send this manuscript/));fireEvent.click(screen.getByText('Build Book #2 blueprint'));
 await screen.findByText(/Blueprint ready/);expect(screen.getByRole('heading',{name:'Proposed Book #2 Premise'})).toBeTruthy();expect(document.querySelector('script')).toBeNull();expect(document.querySelector('img')).toBeNull();expect(request).toHaveBeenCalledTimes(2);for(const [url,init] of request.mock.calls){expect(url).toBe(OPENROUTER_URL);expect(init.headers.Authorization).toBe('Bearer synthetic-key-not-real');expect(init.body).not.toContain('synthetic-key-not-real');}
 expect(log).not.toHaveBeenCalled();expect((screen.getByText('Try PubléStudio free →') as HTMLAnchorElement).getAttribute('href')).toBe('/auth/signup');fireEvent.click(screen.getByText('Start over'));expect(screen.queryByText('fictional.txt')).toBeNull();expect(screen.queryByRole('heading',{name:'Proposed Book #2 Premise'})).toBeNull();expect(await hasOpenRouterKey()).toBe(true);fireEvent.click(screen.getByText('Forget key'));await waitFor(()=>expect(screen.queryByText('Encrypted key saved · never displayed')).toBeNull());expect(await hasOpenRouterKey()).toBe(false);
});
