import {validateEPUBStructure} from '../src/lib/epub-validation';
// @vitest-environment jsdom
import {expect,it} from 'vitest';
import {mkdirSync,writeFileSync,readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {buildEPUB,buildDOCX} from '../src/lib/export';
import {importManuscript} from '../src/lib/manuscript-import';
it('round trips a manuscript and checks generated EPUBs with EPUBCheck when configured',async()=>{
 const chapters=Array.from({length:6},(_,i)=>({title:`Chapter ${i+1}: A beginning`,content:`# Scene ${i+1}\n\nCafé lights & **bold words** with *quiet emphasis*.\n\n- A first point\n\n- A second point`,format:'markdown' as const}));
 const data={title:'A Place to Begin',author:'Zoë Marais',chapters};
 await validateEPUBStructure(buildEPUB(data));
 const invalid=buildEPUB(data);invalid.remove('OEBPS/chap_0.xhtml');await expect(validateEPUBStructure(invalid)).rejects.toThrow(/missing/);
 const docx=await buildDOCX(data).generateAsync({type:'arraybuffer'});const imported=await importManuscript('sample.docx',docx);
 expect(imported.chapters.map(c=>c.title)).toEqual(chapters.map(c=>c.title));expect(imported.chapters.every(c=>c.content.includes('Café lights'))).toBe(true);
 if(process.env.PUBLE_VALIDATION_DIR){const dir=process.env.PUBLE_VALIDATION_DIR;mkdirSync(dir,{recursive:true});writeFileSync(dir+'/manuscript-sample.docx',Buffer.from(docx));
  for(const cover of [false,true]){const file=dir+(cover?'/sample-cover.epub':'/sample.epub');const payload=cover?{...data,cover:{dataUrl:'data:image/jpeg;base64,'+readFileSync('tests/fixtures/cover.jpg').toString('base64'),width:8,height:12}}:data;writeFileSync(file,await buildEPUB(payload).generateAsync({type:'nodebuffer'}));if(process.env.EPUBCHECK_JAR){const result=execFileSync('java',['-jar',process.env.EPUBCHECK_JAR,file],{encoding:'utf8'});expect(result).toContain('No errors or warnings detected');}}
 }
},60000);
