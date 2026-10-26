// @vitest-environment jsdom
import {expect,it} from 'vitest';
import {buildDOCX,buildEPUB,buildTXT} from '../src/lib/export';
import {importManuscript} from '../src/lib/manuscript-import';
import {manuscriptHTML} from '../src/lib/manuscript-format';
const data={title:'Publé & <Book>',author:'Zoë',chapters:[{title:'Chapter 1: Start & grow',content:'# A heading\n\nA **bold** and *italic* paragraph.\n\n- One item\n\nLiteral <script> & text.',format:'markdown' as const}]};
it('round trips DOCX chapter titles, Unicode prose and basic emphasis',async()=>{
 const bytes=await buildDOCX(data).generateAsync({type:'arraybuffer'});
 const result=await importManuscript('book.docx',bytes);
 expect(result.chapters).toHaveLength(1);expect(result.chapters[0].title).toBe(data.chapters[0].title);
 expect(result.chapters[0].content).toContain('**bold**');expect(result.chapters[0].content).toContain('*italic*');expect(result.chapters[0].content).toContain('Literal <script> & text.');
 expect(result.warnings.length).toBeGreaterThan(0);
});
it('exports escaped EPUB3 XML with navigation and complete spine references',async()=>{
 const zip=buildEPUB(data);
 for(const path of Object.keys(zip.files).filter(p=>/\.(opf|xml|xhtml)$/.test(p))){const xml=await zip.file(path)!.async('string');const doc=new DOMParser().parseFromString(xml,'application/xml');expect(doc.getElementsByTagName('parsererror').length,path).toBe(0);}
 const opf=await zip.file('OEBPS/content.opf')!.async('string');expect(opf).toContain('properties="nav"');expect(opf).toContain('dcterms:modified');
 const content=await zip.file('OEBPS/chap_0.xhtml')!.async('string');expect(content).toContain('&lt;script&gt;');expect(content).toContain('<strong>bold</strong>');expect(content).not.toContain('<script>');
 expect(await zip.file('mimetype')!.async('string')).toBe('application/epub+zip');
});
it('imports UTF-8 TXT and Markdown with previewable chapters and rejects unsupported files',async()=>{
 const bytes=new TextEncoder().encode('Chapter 1\nHello Zoë\n\nChapter 2\nGoodbye.').buffer;
 expect((await importManuscript('book.txt',bytes)).chapters).toHaveLength(2);
 const md=new TextEncoder().encode('# Opening\n\n**Hello**').buffer;
 expect((await importManuscript('book.md',md)).chapters[0].format).toBe('markdown');
 await expect(importManuscript('book.pdf',bytes)).rejects.toThrow(/not editable/);
 expect(buildTXT(data)).toContain('A bold and italic paragraph.');expect(buildTXT(data)).not.toContain('**bold**');
 expect(manuscriptHTML('<img src=x onerror=alert(1)>')).toContain('&lt;img');
});
it('rejects XML entities and oversized DOCX archives before parsing',async()=>{
 const zip=buildDOCX(data);zip.file('word/document.xml','<!DOCTYPE x [<!ENTITY x "bad">]><x>&x;</x>');
 await expect(importManuscript('bad.docx',await zip.generateAsync({type:'arraybuffer'}))).rejects.toThrow(/Unsupported XML/);
 await expect(importManuscript('large.txt',new ArrayBuffer(10_000_001))).rejects.toThrow(/10 MB/);
});
it('preserves footnote text as a notes chapter and reports unsupported objects before import',async()=>{
 const zip=buildDOCX({title:'Sample',author:'Author',chapters:[{title:'Chapter 1',content:'A sourced claim.'}]});
 const xml=await zip.file('word/document.xml')!.async('string');zip.file('word/document.xml',xml.replace('A sourced claim.</w:t>','A sourced claim.</w:t><w:footnoteReference w:id="1"/>').replace('</w:body>','<w:p><w:r><w:drawing/></w:r></w:p></w:body>'));
 zip.file('word/footnotes.xml','<w:footnotes xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:footnote w:id="1"><w:p><w:r><w:t>Source and supporting detail.</w:t></w:r></w:p></w:footnote></w:footnotes>');
 const result=await importManuscript('notes.docx',await zip.generateAsync({type:'arraybuffer'}));
 expect(result.chapters[0].content).toContain('[Note 1]');expect(result.chapters.at(-1)?.content).toContain('Source and supporting detail.');expect(result.warnings.some(w=>w.includes('drawing/image'))).toBe(true);
});
