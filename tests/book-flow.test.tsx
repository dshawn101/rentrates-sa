// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { OutlineGenerator } from '../src/pages/book/steps/OutlineGenerator';
import { ChapterEditor } from '../src/pages/book/steps/ChapterEditor';
import { ExportFormatter } from '../src/pages/book/steps/ExportFormatter';

const mocks = vi.hoisted(() => ({ from: vi.fn(), pdf: vi.fn(), toast: vi.fn(), rpc: vi.fn(), ai:vi.fn() }));
vi.mock('../src/lib/supabase', () => ({ supabase: { from: mocks.from, rpc:mocks.rpc } }));
vi.mock('../src/lib/ai-provider',()=>({MultiProviderAI:{generate:mocks.ai}}));
vi.mock('../src/lib/export', () => ({ exportToPDF: mocks.pdf }));
vi.mock('../src/hooks/useAuth', () => ({ useAuth: () => ({ profile: { tier: 'free' } }) }));
vi.mock('../src/store/useToastStore', () => ({ useToastStore: () => ({ addToast: mocks.toast }) }));
const book = { id: 'book-1', user_id: 'user-1', title: 'My Book', metadata: { author: 'Author', genre: 'fiction' }, status: 'draft' as const, tier_created: 'free', created_at: '', updated_at: '' };
const chapter = { id: 'chapter-1', book_id: book.id, title: 'Opening', content: 'Existing prose', order_index: 0, revision:0, content_format:'plain', deleted_at:null, ai_contribution: { outline_description: 'Premise', provider: 'manual' } };
let update: ReturnType<typeof vi.fn>;
let upsert: ReturnType<typeof vi.fn>;
let result: { data: typeof chapter[] | null; error: { message: string } | null };
beforeEach(() => {
  vi.clearAllMocks();
  sessionStorage.clear(); localStorage.clear();
  mocks.rpc.mockImplementation(async(name,p)=>({data:name==='save_chapter_draft'?{...chapter,content:p.p_content,revision:p.p_revision+1}:null,error:null}));
  result = { data: [chapter], error: null };
  update = vi.fn(() => ({ eq: vi.fn().mockResolvedValue({ error: null }) }));
  upsert = vi.fn().mockResolvedValue({ error: null });
  mocks.from.mockImplementation(() => ({
    select: () => ({ eq: () => ({ order: () => Promise.resolve(result) }) }), update, upsert,
    delete: vi.fn(() => { throw new Error('Must not delete existing prose'); }),
  }));
});
afterEach(cleanup);
it('preserves chapter ID, prose and attribution when revisiting and saving an outline', async () => {
  const next = vi.fn();
  render(<OutlineGenerator book={book} onNext={next} onPrev={vi.fn()} />);
  fireEvent.change(await screen.findByDisplayValue('Opening'), { target: { value: 'Revised opening' } });
  fireEvent.click(screen.getByText('Save & Write Content'));
  await waitFor(() => expect(next).toHaveBeenCalled());
  expect(mocks.rpc).toHaveBeenCalledWith('save_book_outline',expect.objectContaining({p_items:[expect.objectContaining({id:chapter.id,content:'Existing prose',title:'Revised opening',revision:0})]}));
});
it('does not allow outline writes after a failed load', async () => {
  result = { data: null, error: { message: 'offline' } };
  render(<OutlineGenerator book={book} onNext={vi.fn()} onPrev={vi.fn()} />);
  await screen.findByRole('alert');
  expect(screen.queryByText('Save & Write Content')).toBeNull();
  expect(upsert).not.toHaveBeenCalled();
});
it('saves edits before leaving the chapter editor', async () => {
  const next = vi.fn();
  render(<ChapterEditor book={book} onNext={next} onPrev={vi.fn()} />);
  fireEvent.change(await screen.findByLabelText('Chapter content'), { target: { value: 'New manuscript text' } });
  fireEvent.click(screen.getByText('Continue'));
  await waitFor(() => expect(next).toHaveBeenCalled());
  expect(mocks.rpc).toHaveBeenCalledWith('save_chapter_draft',expect.objectContaining({p_content:'New manuscript text',p_revision:0}));
});
it('keeps the editor open when saving fails', async () => {
  mocks.rpc.mockResolvedValue({error:{message:'offline'}});
  const next = vi.fn();
  render(<ChapterEditor book={book} onNext={next} onPrev={vi.fn()} />);
  fireEvent.change(await screen.findByLabelText('Chapter content'), { target: { value: 'Unsaved text' } });
  fireEvent.click(screen.getByText('Continue'));
  await screen.findByText('offline');
  expect(next).not.toHaveBeenCalled();
});
it('exports saved ordered chapters and does not mark the book published', async () => {
  render(<ExportFormatter book={book} onPrev={vi.fn()} />);
  fireEvent.click(screen.getByText('PDF manuscript'));
  fireEvent.click(screen.getByText('Download PDF'));
  await waitFor(() => expect(mocks.pdf).toHaveBeenCalledWith(expect.objectContaining({ title: 'My Book', author: 'Author', chapters: [{ title: 'Opening', content: 'Existing prose',format:'plain' }] }), 'free'));
  expect(update).not.toHaveBeenCalled();
});
it('rejects empty chapters instead of downloading an empty manuscript', async () => {
  result = { data: [{ ...chapter, content: ' ' }], error: null };
  render(<ExportFormatter book={book} onPrev={vi.fn()} />);
  fireEvent.click(screen.getByText('PDF manuscript'));
  fireEvent.click(screen.getByText('Download PDF'));
  await waitFor(() => expect(mocks.toast).toHaveBeenCalledWith(expect.stringContaining('at least one chapter'), 'error'));
  expect(mocks.pdf).not.toHaveBeenCalled();
});

it('restores an unsaved chapter after navigating away and reopening', async () => {
  const first = render(<ChapterEditor book={book} onNext={vi.fn()} onPrev={vi.fn()} />);
  fireEvent.change(await screen.findByLabelText('Chapter content'), { target: { value: 'Recovered draft' } });
  first.unmount();
  render(<ChapterEditor book={book} onNext={vi.fn()} onPrev={vi.fn()} />);
  await waitFor(()=>expect((screen.getByLabelText('Chapter content') as HTMLTextAreaElement).value).toBe('Recovered draft'));
});
it('does not change last-edit timestamps just by continuing with untouched text', async () => {
  const next = vi.fn();
  render(<ChapterEditor book={book} onNext={next} onPrev={vi.fn()} />);
  await screen.findByLabelText('Chapter content');
  fireEvent.click(screen.getByText('Continue'));
  await waitFor(() => expect(next).toHaveBeenCalled());
  expect(update).not.toHaveBeenCalled();
});

it('keeps AI suggestions separate until accepted and rejects without writing',async()=>{
 mocks.ai.mockResolvedValue({text:'Replacement prose',providerUsed:'openrouter',fallbackUsed:false});
 render(<ChapterEditor book={book} onNext={vi.fn()} onPrev={vi.fn()}/>);
 await screen.findByLabelText('Chapter content');fireEvent.click(screen.getByText('Improve'));
 await screen.findByText('Review AI suggestion');
 expect((screen.getByLabelText('Chapter content') as HTMLTextAreaElement).value).toBe('Existing prose');
 expect(mocks.rpc).not.toHaveBeenCalled();fireEvent.click(screen.getByText('Reject suggestion'));expect(mocks.rpc).not.toHaveBeenCalled();
 fireEvent.click(screen.getByText('Improve'));await screen.findByText('Review AI suggestion');fireEvent.click(screen.getByText('Accept suggestion'));
 await waitFor(()=>expect(mocks.rpc).toHaveBeenCalledWith('save_chapter_draft',expect.objectContaining({p_content:'Replacement prose',p_revision:0})));
});
it('pauses a recovered stale draft for explicit conflict review',async()=>{
 localStorage.setItem('puble:draft:user-1:book-1:chapter-1',JSON.stringify({content:'Recovered',format:'plain',revision:99}));
 render(<ChapterEditor book={book} onNext={vi.fn()} onPrev={vi.fn()}/>);
 await screen.findByText('Review the cloud version');expect(mocks.rpc).not.toHaveBeenCalled();
 fireEvent.click(screen.getByText('Use cloud version'));expect((screen.getByLabelText('Chapter content') as HTMLTextAreaElement).value).toBe('Existing prose');
});
it('autosaves after a pause and retains newer text typed during an in-flight save',async()=>{
 let finish:(v:unknown)=>void=()=>{};
 mocks.rpc.mockImplementationOnce(()=>new Promise(resolve=>{finish=resolve;}));
 render(<ChapterEditor book={book} onNext={vi.fn()} onPrev={vi.fn()}/>);
 const editor=await screen.findByLabelText('Chapter content');
 fireEvent.change(editor,{target:{value:'First draft'}});fireEvent.click(screen.getByText('Save'));
 await waitFor(()=>expect(mocks.rpc).toHaveBeenCalledTimes(1));
 fireEvent.change(editor,{target:{value:'Newer draft'}});
 finish({data:{...chapter,content:'First draft',revision:1},error:null});
 await screen.findByText('Newer edits waiting to save');
 expect((editor as HTMLTextAreaElement).value).toBe('Newer draft');
 await waitFor(()=>expect(mocks.rpc).toHaveBeenCalledWith('save_chapter_draft',expect.objectContaining({p_content:'Newer draft',p_revision:1})),{timeout:3000});
});
it('does not auto-retry failed saves until the author edits or retries',async()=>{
 mocks.rpc.mockResolvedValue({error:{message:'offline'}});
 render(<ChapterEditor book={book} onNext={vi.fn()} onPrev={vi.fn()}/>);
 fireEvent.change(await screen.findByLabelText('Chapter content'),{target:{value:'Keep me'}});
 fireEvent.click(screen.getByText('Save'));await screen.findByText('offline');
 expect(JSON.parse(localStorage.getItem('puble:draft:user-1:book-1:chapter-1')!).content).toBe('Keep me');
 expect(mocks.rpc).toHaveBeenCalledTimes(1);
});
it('recovers legacy tab drafts through an explicit cloud comparison',async()=>{
 sessionStorage.setItem('chapter-draft:book-1:chapter-1','Legacy writing');
 render(<ChapterEditor book={book} onNext={vi.fn()} onPrev={vi.fn()}/>);
 await screen.findByText('Review the cloud version');
 expect((screen.getByLabelText('Chapter content') as HTMLTextAreaElement).value).toBe('Legacy writing');expect(mocks.rpc).not.toHaveBeenCalled();
 expect(localStorage.getItem('puble:draft:user-1:book-1:chapter-1')).toContain('Legacy writing');
});
