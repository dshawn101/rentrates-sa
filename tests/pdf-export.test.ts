import { expect, it, vi } from 'vitest';
import { buildPDF } from '../src/lib/export';
vi.mock('file-saver', () => ({ saveAs: vi.fn() }));
it('creates a multipage PDF with the manuscript text', () => {
  const doc = buildPDF({ title: 'A long title '.repeat(10), author: 'Test Author', chapters: [{ title: 'Chapter One', content: 'Manuscript sentence. '.repeat(1000) }] });
  expect(doc.getNumberOfPages()).toBeGreaterThan(2);
  expect(doc.output()).toContain('Manuscript sentence.');
});
