// @vitest-environment jsdom
import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import {cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import {webcrypto} from 'node:crypto';
import {BookReview} from '../src/components/book/BookReview';
import {useIntegrationStore} from '../src/store/useIntegrationStore';
const mocks=vi.hoisted(()=>({ai:vi.fn(),order:vi.fn()}));
vi.mock('../src/lib/supabase',()=>({supabase:{from:()=>({select:()=>({eq:()=>({order:mocks.order})})})}}));
vi.mock('../src/lib/ai-provider',()=>({MultiProviderAI:{generate:mocks.ai},requestAI:vi.fn()}));
vi.mock('../src/store/useIntegrationStore',async original=>({...await original<typeof import('../src/store/useIntegrationStore')>(),readCredential:()=> 'test-key'}));
const book={id:'book',user_id:'owner',title:'A book',metadata:{},status:'writing' as const,tier_created:'free',created_at:'',updated_at:''};
const chapters=[{id:'one',title:'Opening',content:'Maya was thirty-two years old.',revision:1,content_format:'plain',deleted_at:null},{id:'two',title:'Later',content:'Maya celebrated her thirtieth birthday.',revision:1,content_format:'plain',deleted_at:null}];
const digest=(i:number)=>({text:JSON.stringify({summary:'Summary',facts:[{fact:'Age',quote:chapters[i].content}]})});
const report={text:JSON.stringify({findings:[{title:'Possible age conflict',explanation:'Check elapsed time.',severity:'high',evidence:chapters.map(c=>({chapterId:c.id,quote:c.content}))}]})};
beforeEach(()=>{vi.clearAllMocks();localStorage.clear();vi.stubGlobal('crypto',webcrypto);useIntegrationStore.setState({owner:'owner',provider:'openrouter'});mocks.order.mockResolvedValue({data:chapters,error:null});});
afterEach(()=>{cleanup();vi.unstubAllGlobals();});
function setup(){render(<MemoryRouter><BookReview book={book}/></MemoryRouter>);fireEvent.click(screen.getByText('Whole-book consistency review · beta'));fireEvent.click(screen.getByLabelText(/Send saved manuscript batches/));}
it('resumes completed batches after a failed request and provides source links without editing prose',async()=>{
 mocks.ai.mockResolvedValueOnce(digest(0)).mockRejectedValueOnce(new Error('Quota reached')).mockResolvedValueOnce(digest(1)).mockResolvedValueOnce(report);
 setup();fireEvent.click(screen.getByText('Review my book'));await screen.findByText('Quota reached');
 expect(JSON.parse(localStorage.getItem('puble:review:owner:book')!).digests).toHaveLength(1);
 fireEvent.click(screen.getByText('Resume / check saved review'));
 await screen.findByText('HIGH · Possible age conflict');expect(mocks.ai).toHaveBeenCalledTimes(4);expect(screen.getAllByText('Open source chapter')).toHaveLength(2);
 expect(mocks.ai.mock.calls.every(call=>call[1].allowFallback===false)).toBe(true);
 fireEvent.click(screen.getByText('Dismiss finding'));expect(screen.getByText('HIGH · Possible age conflict · Dismissed')).toBeTruthy();
});
it('rejects a report if the saved manuscript changed while reviewing',async()=>{
 mocks.order.mockResolvedValueOnce({data:chapters,error:null}).mockResolvedValueOnce({data:[{...chapters[0],content:'New prose',revision:2},chapters[1]],error:null});
 mocks.ai.mockResolvedValueOnce(digest(0)).mockResolvedValueOnce(digest(1)).mockResolvedValueOnce(report);
 setup();fireEvent.click(screen.getByText('Review my book'));await screen.findByText(/saved manuscript changed during review/);expect(screen.queryByText('HIGH · Possible age conflict')).toBeNull();
});
it('pauses after the current request and checkpoints the completed batch',async()=>{
 let finish!:(value:{text:string})=>void;mocks.ai.mockReturnValueOnce(new Promise(resolve=>{finish=resolve;}));
 setup();fireEvent.click(screen.getByText('Review my book'));await waitFor(()=>expect(mocks.ai).toHaveBeenCalledTimes(1));fireEvent.click(screen.getByText('Pause'));finish(digest(0));
 await screen.findByText('Review paused. The completed batch is saved on this device.');expect(mocks.ai).toHaveBeenCalledTimes(1);expect(JSON.parse(localStorage.getItem('puble:review:owner:book')!).digests).toHaveLength(1);
});
