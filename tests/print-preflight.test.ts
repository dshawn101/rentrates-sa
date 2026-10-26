import {expect,it} from 'vitest';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {buildPrintPDF,insideMargin} from '../src/lib/print-export';
const font=readFileSync('public/fonts/DejaVuSerif.ttf').toString('base64');
it('builds a bounded 6x9 print interior with an embedded font, even pages and a report',()=>{
 const data={title:'A Place to Begin',author:'Zoë Marais',chapters:[{title:'Chapter One — The Harbour',content:'Café lights glowed through the mist. Maya closed her notebook and watched the boats.\n\n'+('She had returned to find the truth, not to write another ending. '.repeat(320)),format:'plain' as const},{title:'Chapter Two — The Letter',content:'The next morning, a letter waited on the table.\n\n'+('A small beginning can change the shape of a whole story. '.repeat(250)),format:'plain' as const}]};
 const {doc,report}=buildPrintPDF(data,font,true);
 expect(report.pages).toBeGreaterThanOrEqual(24);expect(report.pages%2).toBe(0);expect(report.fontEmbedded).toBe(true);expect(report.insideMM).toBeGreaterThanOrEqual(insideMargin(report.pages));
 expect(doc.internal.pageSize.getWidth()).toBeCloseTo(152.4);expect(doc.internal.pageSize.getHeight()).toBeCloseTo(228.6);
 const directory=process.env.PUBLE_VALIDATION_DIR;
 if(directory){mkdirSync(directory,{recursive:true});const file=directory+'/paperback-sample.pdf';writeFileSync(file,Buffer.from(doc.output('arraybuffer')));writeFileSync(directory+'/print-report.json',JSON.stringify(report,null,2));const fonts=execFileSync('pdffonts',[file],{encoding:'utf8'});expect(fonts).toContain('CID TrueType');expect(fonts).not.toContain('Type 1');expect(fonts).toMatch(/yes\s+no\s+yes/);const extracted=execFileSync('pdftotext',[file,'-'],{encoding:'utf8'});expect(extracted).toContain('Café lights');expect(extracted).toContain('The next morning');}
});
it('rejects unsupported glyphs and missing author information instead of corrupting a print file',()=>{
 expect(()=>buildPrintPDF({title:'Book',author:'Author',chapters:[{title:'Chapter',content:'A missing emoji 🦄'}]},font)).toThrow(/characters/);
 expect(()=>buildPrintPDF({title:'Book',author:'Unknown',chapters:[{title:'Chapter',content:'Text'}]},font)).toThrow(/author/);
 expect([150,151,300,301,500,501,700,701].map(insideMargin)).toEqual([9.6,12.7,12.7,15.9,15.9,19.1,19.1,22.3]);
});
it('recalculates the inside margin when pagination crosses the 150-page threshold',()=>{
 const {report}=buildPrintPDF({title:'Long manuscript',author:'Author',chapters:[{title:'Opening',content:'A long manuscript needs a wider inside margin as the printed page count grows. '.repeat(6500)}]},font);
 expect(report.pages).toBeGreaterThan(150);expect(report.insideMM).toBeGreaterThanOrEqual(insideMargin(report.pages));expect(report.pages%2).toBe(0);
},20000);
