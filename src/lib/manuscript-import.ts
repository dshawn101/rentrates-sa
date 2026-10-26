import JSZip from 'jszip';
import type {ContentFormat} from './manuscript-format';
export interface ImportedChapter { title:string;content:string;format:ContentFormat }
export interface ManuscriptImport {chapters:ImportedChapter[];warnings:string[]}
const W='http://schemas.openxmlformats.org/wordprocessingml/2006/main';
const chapterHeading=/^(?:chapter\s+(?:\d+|[ivxlcdm]+)\b.*|introduction|prologue|epilogue|conclusion)$/i;
function splitText(text:string,format:ContentFormat):ImportedChapter[]{
 const chapters:ImportedChapter[]=[];let title='Imported chapter',lines:string[]=[];
 const flush=()=>{if(lines.join('').trim())chapters.push({title,content:lines.join('\n').trim(),format});lines=[];};
 for(const line of text.replace(/^\uFEFF/,'').replace(/\r\n?/g,'\n').split('\n')){
  if(chapterHeading.test(line.trim()) || (format==='markdown' && /^#\s+/.test(line))){flush();title=line.trim().replace(/^#\s+/,'').slice(0,300);}else lines.push(line);
 }
 flush();return chapters;
}
// Inspect central-directory sizes before inflating any XML (ZIP64 is not imported).
function inspectZip(bytes:ArrayBuffer){
 const view=new DataView(bytes);let end=-1;
 for(let i=bytes.byteLength-22;i>=Math.max(0,bytes.byteLength-65557);i--)if(view.getUint32(i,true)===0x06054b50){end=i;break;}
 if(end<0)throw new Error('This DOCX file is not a readable Word document.');
 const count=view.getUint16(end+10,true);let offset=view.getUint32(end+16,true),total=0;
 if(count>2000 || offset>=end)throw new Error('This document is too complex to import. Export a simpler DOCX or TXT copy.');
 for(let i=0;i<count;i++){
  if(offset+46>end || view.getUint32(offset,true)!==0x02014b50)throw new Error('Invalid DOCX archive.');
  const size=view.getUint32(offset+24,true),nameLength=view.getUint16(offset+28,true),extra=view.getUint16(offset+30,true),comment=view.getUint16(offset+32,true);
  const name=new TextDecoder().decode(new Uint8Array(bytes,offset+46,nameLength));total+=size;
  if(size===0xffffffff || total>40_000_000 || (name==='word/document.xml' && size>5_000_000))throw new Error('Expanded document is too large. Split it into smaller files first.');
  offset+=46+nameLength+extra+comment;
 }
}
export async function importManuscript(name:string,bytes:ArrayBuffer):Promise<ManuscriptImport>{
 if(bytes.byteLength>10_000_000)throw new Error('Choose a manuscript file smaller than 10 MB.');
 const extension=name.toLowerCase().split('.').pop();let chapters:ImportedChapter[],warnings:string[]=[];
 if(extension==='txt'||extension==='md')chapters=splitText(new TextDecoder('utf-8',{fatal:true}).decode(bytes),extension==='md'?'markdown':'plain');
 else if(extension==='docx'){
  inspectZip(bytes);const zip=await JSZip.loadAsync(bytes);const entry=zip.file('word/document.xml');
  if(!entry)throw new Error('This file does not contain a Word manuscript.');
  const xml=await entry.async('string');if(/<!DOCTYPE|<!ENTITY/i.test(xml))throw new Error('Unsupported XML in this document.');
  const doc=new DOMParser().parseFromString(xml,'application/xml');if(doc.getElementsByTagName('parsererror').length)throw new Error('The Word document could not be read.');
  chapters=[];let title='Imported chapter',lines:string[]=[];
  const flush=()=>{if(lines.join('').trim())chapters.push({title,content:lines.join('\n\n'),format:'markdown'});lines=[];};
  for(const p of Array.from(doc.getElementsByTagNameNS(W,'p'))){
   const style=p.getElementsByTagNameNS(W,'pStyle')[0]?.getAttributeNS(W,'val')||'';
   if(/^(Title|Subtitle)$/i.test(style)){warnings.push('Title/subtitle paragraphs are not imported as chapters. Add them in Book Setup.');continue;}
   const plain=Array.from(p.getElementsByTagNameNS(W,'t')).map(t=>t.textContent||'').join('');
   if(!plain.trim())continue;
   if(/^heading\s?1$/i.test(style)||chapterHeading.test(plain.trim())){flush();title=plain.trim().slice(0,300);continue;}
   const runs=Array.from(p.getElementsByTagNameNS(W,'r')).map(r=>{
    let t=Array.from(r.childNodes).map(n=>(n as Element).localName==='t'?n.textContent||'':(n as Element).localName==='br'?'\n':(n as Element).localName==='tab'?'\t':(n as Element).localName==='footnoteReference'?`[Note ${(n as Element).getAttributeNS(W,'id')}]`:'').join('');
    // Imported literal asterisks are retained; complex emphasis is flagged below.
    const b=r.getElementsByTagNameNS(W,'b')[0],i=r.getElementsByTagNameNS(W,'i')[0];
    if(b && !['0','false','off'].includes(b.getAttributeNS(W,'val')||''))t=`**${t}**`;
    else if(i && !['0','false','off'].includes(i.getAttributeNS(W,'val')||''))t=`*${t}*`;
    return t;
   }).join('');
   const heading=/^heading\s?([234])$/i.exec(style);
   lines.push(heading?`${'#'.repeat(Number(heading[1])-1)} ${runs}`:p.getElementsByTagNameNS(W,'numPr').length?`- ${runs}`:runs);
  }
  flush();
  warnings.push('Imports preserve main-body text, common headings and basic bold/italic. Review the preview: custom styles, page layout, comments, tracked changes, native footnotes, images and advanced formatting are not preserved.');
  const count=(tag:string)=>doc.getElementsByTagNameNS(W,tag).length;
  if(count('drawing')||count('pict'))warnings.push(`${count('drawing')+count('pict')} drawing/image objects detected. Images are not imported; retain the original DOCX.`);
  if(count('ins')||count('del'))warnings.push('Tracked changes detected. Inserted text is imported; deleted text is omitted. Accept or reject changes in Word first for a clean source.');
  if(count('commentRangeStart'))warnings.push('Comments detected. Comments are not imported.');
  if(count('hyperlink'))warnings.push('Hyperlink labels are imported; link destinations are not retained.');
  if(count('footnoteReference')){
   const notes=zip.file('word/footnotes.xml');
   if(notes){const source=await notes.async('string');if(/<!DOCTYPE|<!ENTITY/i.test(source))throw new Error('Unsupported XML in footnotes.');const notesDoc=new DOMParser().parseFromString(source,'application/xml');if(notesDoc.getElementsByTagName('parsererror').length)throw new Error('Could not read footnotes.');
    const lines=Array.from(notesDoc.getElementsByTagNameNS(W,'footnote')).filter(n=>Number(n.getAttributeNS(W,'id'))>0).map(n=>`[Note ${n.getAttributeNS(W,'id')}] `+Array.from(n.getElementsByTagNameNS(W,'t')).map(t=>t.textContent||'').join(''));
    if(lines.length)chapters.push({title:'Imported notes',content:lines.join('\n\n'),format:'plain'});
   }
   warnings.push('Footnote references become [Note n] markers. Available note text is appended as an Imported notes chapter, not native linked footnotes. Review all references.');
  }
  if(zip.file(/^word\/(?:header|footer|endnotes)/).length)warnings.push('Headers, footers or endnotes detected. Their text is not imported; review the original file.');
  if(doc.getElementsByTagNameNS(W,'tbl').length)warnings.push('Tables were flattened into paragraphs. Review their reading order.');
 }else throw new Error('Choose a DOCX, UTF-8 TXT or Markdown (.md) file. PDF and legacy .doc are not editable manuscript imports.');
 if(!chapters.length)throw new Error('No manuscript text was found.');
 if(chapters.length>200 || chapters.some(c=>c.content.length>1_000_000))throw new Error('Split this manuscript into smaller files before importing.');
 return {chapters,warnings:[...new Set(warnings)]};
}
