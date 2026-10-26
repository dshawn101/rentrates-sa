import jsPDF from 'jspdf';
import {plainManuscript} from './manuscript-format';
import type {ExportData} from './export';
export interface PrintReport {pages:number;widthMM:number;heightMM:number;insideMM:number;outsideMM:number;topMM:number;bottomMM:number;fontEmbedded:boolean;bleed:false;watermark:boolean}
export function insideMargin(pages:number){return pages<=150?9.6:pages<=300?12.7:pages<=500?15.9:pages<=700?19.1:22.3;}
export function buildPrintPDF(data:ExportData,fontData:string,watermark=false){
 if(!fontData)throw new Error('The print font is required. Retry loading it.');
 if(!data.title.trim()||!data.author.trim()||data.author==='Unknown')throw new Error('Add a book title and author before preparing print output.');
 if(!data.chapters.some(c=>c.content.trim()))throw new Error('Save manuscript text before preparing print output.');
 if(data.title.length>300||data.author.length>200)throw new Error('Shorten the title or author name for this print template.');
 const width=152.4,height=228.6,outside=15,top=18,bottom=18;
 let inside=insideMargin(24);
 const layout=()=>{
  const doc=new jsPDF({unit:'mm',format:[width,height],compress:true,putOnlyUsedFonts:true});
  doc.addFileToVFS('DejaVuSerif.ttf',fontData);doc.addFont('DejaVuSerif.ttf','print','normal');doc.setFont('print','normal');doc.setTextColor(0,0,0);
  const metadata=doc.getFont().metadata as unknown as {cmap?:{unicode?:{codeMap?:Record<number,number>}}};
  const glyphs=metadata.cmap?.unicode?.codeMap;
  const text=[data.title,data.author,data.isbn||'',...data.chapters.flatMap(c=>[c.title,plainManuscript(c.content,c.format)])].join('');
  if(!glyphs||Array.from(text).some(c=>!/\s/.test(c)&&!glyphs[c.codePointAt(0)!]))throw new Error('This print font cannot render some manuscript characters. Use DOCX or EPUB, or revise unsupported characters.');
  const left=()=>doc.getNumberOfPages()%2===1?inside:outside;
  const usable=width-inside-outside;
  const titleLines=(text:string,size:number)=>{doc.setFontSize(size);return doc.splitTextToSize(text,usable) as string[];};
  let y=45;
  for(const line of titleLines(data.title,24)){if(y>110)throw new Error('The title is too long for this print template.');doc.text(line,left()+usable/2,y,{align:'center'});y+=11;}
  y=135;for(const line of titleLines('By '+data.author,12)){doc.text(line,left()+usable/2,y,{align:'center'});y+=6;}
  if(data.isbn){doc.setFontSize(9);doc.text(doc.splitTextToSize('ISBN: '+data.isbn,usable),left()+usable/2,185,{align:'center'});}
  for(const chapter of data.chapters){
   doc.addPage();y=top+14;
   const heading=titleLines(chapter.title,17);
   for(const line of heading){if(y>height-bottom-12){doc.addPage();y=top;}doc.text(line,left(),y);y+=8;}
   y+=8;doc.setFontSize(11);
   const lines=doc.splitTextToSize(plainManuscript(chapter.content,chapter.format),usable) as string[];
   for(const line of lines){if(y>height-bottom){doc.addPage();y=top;doc.setFontSize(11);}doc.text(line,left(),y);y+=5.4;}
  }
  while(doc.getNumberOfPages()<24||doc.getNumberOfPages()%2)doc.addPage();
  if(doc.getNumberOfPages()>828)throw new Error('This beta template supports 24–828 pages on white paper. Split the book or use a professional layout tool.');
  for(let page=1;page<=doc.getNumberOfPages();page++){doc.setPage(page);doc.setFontSize(8);doc.text(String(page),width/2,height-10,{align:'center'});if(watermark){doc.setFontSize(7);doc.text('Created with PubléStudio',width/2,height-6,{align:'center'});}}
  return doc;
 };
 let doc=layout();
 for(let pass=0;pass<5;pass++){const required=insideMargin(doc.getNumberOfPages());if(required<=inside)break;inside=required;doc=layout();}
 if(inside<insideMargin(doc.getNumberOfPages()))throw new Error('Print margins did not stabilise. Use DOCX and a layout tool.');
 const report:PrintReport={pages:doc.getNumberOfPages(),widthMM:width,heightMM:height,insideMM:inside,outsideMM:outside,topMM:top,bottomMM:bottom,fontEmbedded:true,bleed:false,watermark};
 return {doc,report};
}
export async function preparePrintPDF(data:ExportData,watermark=false){
 const response=await fetch('/fonts/DejaVuSerif.ttf');if(!response.ok)throw new Error('Could not load the print font. Retry.');
 const bytes=new Uint8Array(await response.arrayBuffer());let binary='';for(let i=0;i<bytes.length;i+=8192)binary+=String.fromCharCode(...bytes.subarray(i,i+8192));
 return buildPrintPDF(data,btoa(binary),watermark);
}
