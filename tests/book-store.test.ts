import { beforeEach, expect, it, vi } from 'vitest';
import { useBookStore } from '../src/store/useBookStore';
const mocks = vi.hoisted(() => ({ order: vi.fn() }));
vi.mock('../src/lib/supabase', () => ({ supabase: { from: () => ({ select: () => ({ order: mocks.order }) }) } }));
beforeEach(() => { useBookStore.getState().reset(); vi.clearAllMocks(); });
it('derives saved word counts from chapter content rather than metadata placeholders', async () => {
  mocks.order.mockResolvedValue({ data: [{ id: 'one', metadata: { wordCount: 45000 }, chapters: [{ content: 'One two' }, { content: 'three' }] }], error: null });
  await useBookStore.getState().fetchBooks();
  expect(useBookStore.getState().books[0].wordCount).toBe(3);
});
it('retains a visible setup error instead of presenting an empty successful dashboard', async () => {
  mocks.order.mockResolvedValue({ data: null, error: { code: 'PGRST205' } });
  await useBookStore.getState().fetchBooks();
  expect(useBookStore.getState().error).toContain('finish database setup');
  expect(useBookStore.getState().isLoading).toBe(false);
});
it('does not restore a previous account’s in-flight book results after logout', async () => {
  let resolve!: (value: unknown) => void;
  mocks.order.mockReturnValue(new Promise(done => { resolve = done; }));
  const pending = useBookStore.getState().fetchBooks();
  useBookStore.getState().reset();
  resolve({ data: [{ id: 'private-old-book', chapters: [] }], error: null });
  await pending;
  expect(useBookStore.getState().books).toHaveLength(0);
});

it('finds the latest saved chapter and orders projects by chapter activity', async () => {
  mocks.order.mockResolvedValue({ data: [
    { id: 'setup-latest', updated_at: '2026-10-18T10:00:00Z', chapters: [] },
    { id: 'writing-latest', updated_at: '2026-10-01T10:00:00Z', chapters: [
      { id:'old', title:'Opening', content:'One two', updated_at:'2026-10-05T10:00:00Z', order_index:0 },
      { id:'new', title:'Next chapter', content:'Three four five', updated_at:'2026-10-19T10:00:00Z', order_index:1 },
      { id:'empty', title:'Empty', content:'', updated_at:'2026-10-20T10:00:00Z', order_index:2 },
    ] },
  ], error:null });
  await useBookStore.getState().fetchBooks();
  expect(useBookStore.getState().books[0]).toMatchObject({ id:'writing-latest', wordCount:5, lastEditedChapter:{id:'new',title:'Next chapter',updatedAt:'2026-10-19T10:00:00Z'} });
});
