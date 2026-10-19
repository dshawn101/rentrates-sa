// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { OutlineGenerator } from '../src/pages/book/steps/OutlineGenerator';
import { ChapterEditor } from '../src/pages/book/steps/ChapterEditor';
import { ExportFormatter } from '../src/pages/book/steps/ExportFormatter';

const mocks = vi.hoisted(() => ({ from: vi.fn(), pdf: vi.fn(), toast: vi.fn() }));
vi.mock('../src/lib/supabase', () => ({ supabase: { from: mocks.from } }));
vi.mock('../src/lib/export', () => ({ exportToPDF: mocks.pdf }));
vi.mock('../src/hooks/useAuth', () => ({ useAuth: () => ({ profile: { tier: 'free' } }) }));
vi.mock('../src/store/useToastStore', () => ({ useToastStore: () => ({ addToast: mocks.toast }) }));
const book = { id: 'book-1', user_id: 'user-1', title: 'My Book', metadata: { author: 'Author', genre: 'fiction' }, status: 'draft' as const, tier_created: 'free', created_at: '', updated_at: '' };
const chapter = { id: 'chapter-1', book_id: book.id, title: 'Opening', content: 'Existing prose', order_index: 0, ai_contribution: { outline_description: 'Premise', provider: 'manual' } };
let update: ReturnType<typeof vi.fn>;
let upsert: ReturnType<typeof vi.fn>;
let result: { data: typeof chapter[] | null; error: { message: string } | null };
beforeEach(() => {
  vi.clearAllMocks();
  sessionStorage.clear();
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
  expect(upsert.mock.calls[0][0][0]).toMatchObject({ id: chapter.id, content: 'Existing prose', title: 'Revised opening', ai_contribution: { provider: 'manual' } });
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
  expect(update).toHaveBeenCalledWith(expect.objectContaining({ content: 'New manuscript text', updated_at: expect.any(String) }));
});
it('keeps the editor open when saving fails', async () => {
  update.mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: { message: 'offline' } }) });
  const next = vi.fn();
  render(<ChapterEditor book={book} onNext={next} onPrev={vi.fn()} />);
  fireEvent.change(await screen.findByLabelText('Chapter content'), { target: { value: 'Unsaved text' } });
  fireEvent.click(screen.getByText('Continue'));
  await waitFor(() => expect(mocks.toast).toHaveBeenCalledWith('offline', 'error'));
  expect(next).not.toHaveBeenCalled();
});
it('exports saved ordered chapters and does not mark the book published', async () => {
  render(<ExportFormatter book={book} onPrev={vi.fn()} />);
  fireEvent.click(screen.getByText('Download PDF'));
  await waitFor(() => expect(mocks.pdf).toHaveBeenCalledWith(expect.objectContaining({ title: 'My Book', author: 'Author', chapters: [{ title: 'Opening', content: 'Existing prose' }] }), 'free'));
  expect(update).not.toHaveBeenCalled();
});
it('rejects empty chapters instead of downloading an empty manuscript', async () => {
  result = { data: [{ ...chapter, content: ' ' }], error: null };
  render(<ExportFormatter book={book} onPrev={vi.fn()} />);
  fireEvent.click(screen.getByText('Download PDF'));
  await waitFor(() => expect(mocks.toast).toHaveBeenCalledWith(expect.stringContaining('every chapter'), 'error'));
  expect(mocks.pdf).not.toHaveBeenCalled();
});

it('restores an unsaved chapter after navigating away and reopening', async () => {
  const first = render(<ChapterEditor book={book} onNext={vi.fn()} onPrev={vi.fn()} />);
  fireEvent.change(await screen.findByLabelText('Chapter content'), { target: { value: 'Recovered draft' } });
  first.unmount();
  render(<ChapterEditor book={book} onNext={vi.fn()} onPrev={vi.fn()} />);
  expect((await screen.findByLabelText('Chapter content') as HTMLTextAreaElement).value).toBe('Recovered draft');
});
it('does not change last-edit timestamps just by continuing with untouched text', async () => {
  const next = vi.fn();
  render(<ChapterEditor book={book} onNext={next} onPrev={vi.fn()} />);
  await screen.findByLabelText('Chapter content');
  fireEvent.click(screen.getByText('Continue'));
  await waitFor(() => expect(next).toHaveBeenCalled());
  expect(update).not.toHaveBeenCalled();
});
