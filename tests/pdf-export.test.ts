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
it('embeds the Unicode font and preserves accented text in extracted PDF output',async()=>{
 const {readFileSync,mkdtempSync,writeFileSync,rmSync}=await import('node:fs');const {tmpdir}=await import('node:os');const {join}=await import('node:path');const {execFileSync,spawnSync}=await import('node:child_process');
 const directory=mkdtempSync(join(tmpdir(),'puble-pdf-'));
 try{
  const doc=buildPDF({title:'PubléStudio',author:'Zoë',chapters:[{title:'Chapter 1',content:'Café, naïve, résumé — αβγ.'}]},'free',readFileSync('public/fonts/DejaVuSerif.ttf').toString('base64'));
  const path=join(directory,'test.pdf');writeFileSync(path,Buffer.from(doc.output('arraybuffer')));
  const metadata=doc.getFont().metadata as unknown as {cmap:{unicode:{codeMap:Record<number,number>}}};expect(metadata.cmap.unicode.codeMap[233]).toBeGreaterThan(0);
  if(spawnSync('pdftotext',['-v']).error)return;
  const text=execFileSync('pdftotext',[path,'-'],{encoding:'utf8'});expect(text).toContain('PubléStudio');expect(text).toContain('Zoë');expect(text).toContain('Café, naïve, résumé');expect(text).toContain('αβγ');
 }finally{rmSync(directory,{recursive:true,force:true});}
});
