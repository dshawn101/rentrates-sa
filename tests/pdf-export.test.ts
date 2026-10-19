import { expect, it, vi } from 'vitest';
import { buildPDF } from '../src/lib/export';
vi.mock('file-saver', () => ({ saveAs: vi.fn() }));
it('creates a multipage PDF with the manuscript text', () => {
  const doc = buildPDF({ title: 'A long title '.repeat(10), author: 'Test Author', chapters: [{ title: 'Chapter One', content: 'Manuscript sentence. '.repeat(1000) }] });
  expect(doc.getNumberOfPages()).toBeGreaterThan(2);
  expect(doc.output()).toContain('Manuscript sentence.');
});

it('embeds an imported cover before the title page and chapter', async () => {
  const { readFileSync } = await import('node:fs');
  const dataUrl = 'data:image/jpeg;base64,' + readFileSync('tests/fixtures/cover.jpg').toString('base64');
  const doc = buildPDF({ title: 'Book', author: 'Author', cover: { dataUrl, width: 8, height: 12 }, chapters: [{ title: 'Opening', content: 'My saved text.' }] });
  expect(doc.getNumberOfPages()).toBe(3);
  expect(doc.output()).toContain('/Subtype /Image');
  expect(doc.output()).toContain('My saved text.');
});
