import { fitCover } from './covers';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import JSZip from 'jszip';
import { escapeXML, manuscriptHTML, parseBlocks, plainManuscript, type ContentFormat } from './manuscript-format';

export interface ExportData {
  title: string;
  author: string;
  chapters: { title: string; content: string; format?: ContentFormat }[];
  isbn?: string;
  cover?: { dataUrl: string; width: number; height: number };
}

export function buildPDF(data: ExportData, tier: string = 'free', fontData?:string) {
  // A5 format: 148 x 210 mm
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a5'
  });

  if(fontData){doc.addFileToVFS('DejaVuSerif.ttf',fontData);for(const style of ['normal','bold','italic'])doc.addFont('DejaVuSerif.ttf','manuscript',style);}
  const font=fontData?'manuscript':'times';
  const margins = { top: 20, bottom: 20, left: 15, right: 15 };
  let currentY = margins.top;

  if (data.cover) {
    const placement = fitCover(data.cover.width, data.cover.height);
    doc.addImage(data.cover.dataUrl, 'JPEG', placement.x, placement.y, placement.width, placement.height);
    doc.addPage();
  }

  // Title Page
  doc.setFont(font, 'bold');
  doc.setFontSize(28);
  doc.text(doc.splitTextToSize(data.title, 118), 74, 50, { align: 'center' });

  doc.setFont(font, 'normal');
  doc.setFontSize(14);
  doc.text(doc.splitTextToSize(`By ${data.author}`, 118), 74, 130, { align: 'center' });

  if (data.isbn) {
    doc.setFontSize(10);
    doc.text(`ISBN: ${data.isbn}`, 148 / 2, 190, { align: 'center' });
  }

  // Chapters
  for (const chapter of data.chapters) {
    doc.addPage();
    currentY = margins.top + 20;

    // Chapter Title
    doc.setFont(font, 'bold');
    doc.setFontSize(20);
    const heading: string[] = doc.splitTextToSize(chapter.title, 118);
    for (const line of heading) {
      if (currentY > 185) { doc.addPage(); currentY = margins.top; }
      doc.text(line, 74, currentY, { align: 'center' });
      currentY += 9;
    }
    currentY += 10;

    // Chapter Content
    doc.setFont(font, 'normal');
    doc.setFontSize(11);

    // Simple text wrapping (could be improved with html2pdf for robust markdown support)
    const textLines = doc.splitTextToSize(plainManuscript(chapter.content || '', chapter.format), 148 - margins.left - margins.right);

    for (let i = 0; i < textLines.length; i++) {
      if (currentY > 210 - margins.bottom) {
        doc.addPage();
        currentY = margins.top;
      }
      doc.text(textLines[i], margins.left, currentY);
      currentY += 6; // line height
    }

  }
  for (let page=1;page<=doc.getNumberOfPages();page++) {
    doc.setPage(page); doc.setFont(font,'normal'); doc.setFontSize(8); doc.setTextColor(110,110,110);
    doc.text(String(page),133,202,{align:'right'});
    if(tier==='free') doc.text('Created with PubléStudio',74,205,{align:'center'});
    doc.setTextColor(0,0,0);
  }

  return doc;
}

export async function exportToPDF(data: ExportData, tier: string = 'free') {
  const response=await fetch('/fonts/DejaVuSerif.ttf');
  if(!response.ok)throw new Error('The PDF font could not load. Retry, or download DOCX instead.');
  const bytes=new Uint8Array(await response.arrayBuffer());
  let binary='';for(let i=0;i<bytes.length;i+=8192)binary+=String.fromCharCode(...bytes.subarray(i,i+8192));
  const doc=buildPDF(data,tier,btoa(binary));
  const metadata=doc.getFont().metadata as unknown as {cmap?:{unicode?:{codeMap?:Record<number,number>}}};
  const glyphs=metadata.cmap?.unicode?.codeMap;
  const allText=[data.title,data.author,...data.chapters.flatMap(c=>[c.title,plainManuscript(c.content,c.format)])].join('');
  if(glyphs&&Array.from(allText).some(c=>!/[\s]/.test(c)&&!glyphs[c.codePointAt(0)!]))throw new Error('Some characters cannot be rendered by the PDF font. Download DOCX or EPUB to preserve them.');
  doc.save(`${filename(data.title)}_manuscript.pdf`);
}

const filename=(title:string)=>title.replace(/[^\p{L}\p{N}_-]+/gu,'_').slice(0,100)||'manuscript';
export function buildTXT(data:ExportData) {
 return [data.title,`By ${data.author}`,...data.chapters.map(ch=>`${ch.title}\n\n${plainManuscript(ch.content,ch.format)}`)].join('\n\n');
}
export function buildMarkdown(data:ExportData) {
 return [`# ${data.title}`,`By ${data.author}`,...data.chapters.map(ch=>`# ${ch.title}\n\n${ch.content}`)].join('\n\n');
}
export function buildDOCX(data:ExportData) {
 const zip=new JSZip();
 const run=(text:string,bold=false,italic=false)=>`<w:r><w:rPr>${bold?'<w:b/>':''}${italic?'<w:i/>':''}</w:rPr>${text.split('\n').map((line,i)=>`${i?'<w:br/>':''}<w:t xml:space="preserve">${escapeXML(line)}</w:t>`).join('')}</w:r>`;
 const paragraph=(text:string,style='Normal',pageBreak=false)=>`<w:p><w:pPr><w:pStyle w:val="${style}"/>${pageBreak?'<w:pageBreakBefore/>':''}</w:pPr>${run(text)}</w:p>`;
 const chapters=data.chapters.map(ch=>paragraph(ch.title,'Heading1',true)+parseBlocks(ch.content,ch.format).map(b=>`<w:p><w:pPr><w:pStyle w:val="${b.kind==='heading'?'Heading'+Math.min(4,(b.level||1)+1):b.kind==='quote'?'Quote':'Normal'}"/></w:pPr>${b.kind==='bullet'?run('• '):''}${b.runs.map(r=>run(r.text,r.bold,r.italic)).join('')}</w:p>`).join('')).join('');
 zip.file('[Content_Types].xml',`<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/></Types>`);
 zip.file('_rels/.rels','<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>');
 zip.file('word/_rels/document.xml.rels','<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rIdStyles" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>');
 zip.file('word/styles.xml',`<?xml version="1.0"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:rPr><w:sz w:val="24"/></w:rPr></w:style>${['Title','Subtitle','Heading1','Heading2','Heading3','Heading4','Quote'].map((style,i)=>`<w:style w:type="paragraph" w:styleId="${style}"><w:name w:val="${style}"/><w:basedOn w:val="Normal"/><w:rPr>${style==='Quote'?'<w:i/>':'<w:b/>'}<w:sz w:val="${i<2?36:28}"/></w:rPr></w:style>`).join('')}</w:styles>`);
 zip.file('word/document.xml',`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${paragraph(data.title,'Title')}${paragraph(`By ${data.author}`,'Subtitle')}${data.isbn?paragraph(`ISBN: ${data.isbn}`,'Subtitle'):''}${chapters}<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/></w:sectPr></w:body></w:document>`);
 return zip;
}
export function buildEPUB(data:ExportData) {
 const zip=new JSZip(),e=escapeXML,uid=data.isbn?`urn:isbn:${data.isbn}`:`urn:uuid:${crypto.randomUUID()}`;
 zip.file('mimetype','application/epub+zip',{compression:'STORE'});
 zip.file('META-INF/container.xml','<?xml version="1.0"?><container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container"><rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles></container>');
 const html=(title:string,body:string)=>`<?xml version="1.0" encoding="UTF-8"?><html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" lang="en"><head><title>${e(title)}</title><link rel="stylesheet" type="text/css" href="style.css"/></head><body>${body}</body></html>`;
 zip.file('OEBPS/style.css','body{font-family:serif;line-height:1.5;margin:5%}h1,h2,h3{break-after:avoid}p{white-space:pre-wrap}img{max-width:100%;height:auto}blockquote{margin-left:1.5em}');
 zip.file('OEBPS/title.xhtml',html(data.title,`<h1>${e(data.title)}</h1><p>By ${e(data.author)}</p>`));
 data.chapters.forEach((ch,i)=>zip.file(`OEBPS/chap_${i}.xhtml`,html(ch.title,`<h1>${e(ch.title)}</h1>${manuscriptHTML(ch.content,ch.format)}`)));
 zip.file('OEBPS/nav.xhtml',html('Contents',`<nav epub:type="toc" id="toc"><h1>Contents</h1><ol>${data.chapters.map((ch,i)=>`<li><a href="chap_${i}.xhtml">${e(ch.title)}</a></li>`).join('')}</ol></nav>`));
 let coverManifest='',coverSpine='';
 if(data.cover){const match=/^data:image\/jpeg;base64,(.+)$/s.exec(data.cover.dataUrl);if(match){zip.file('OEBPS/cover.jpg',match[1],{base64:true});zip.file('OEBPS/cover.xhtml',html('Cover','<img src="cover.jpg" alt="Book cover"/>'));coverManifest='<item id="cover-image" href="cover.jpg" media-type="image/jpeg" properties="cover-image"/><item id="cover" href="cover.xhtml" media-type="application/xhtml+xml"/>';coverSpine='<itemref idref="cover"/>';}}
 zip.file('OEBPS/content.opf',`<?xml version="1.0" encoding="UTF-8"?><package version="3.0" unique-identifier="pub-id" xmlns="http://www.idpf.org/2007/opf"><metadata xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:identifier id="pub-id">${e(uid)}</dc:identifier><dc:title>${e(data.title)}</dc:title><dc:creator>${e(data.author)}</dc:creator><dc:language>en</dc:language><meta property="dcterms:modified">${new Date().toISOString().replace(/\.\d{3}Z$/,'Z')}</meta></metadata><manifest><item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/><item id="style" href="style.css" media-type="text/css"/><item id="title" href="title.xhtml" media-type="application/xhtml+xml"/>${coverManifest}${data.chapters.map((_,i)=>`<item id="ch${i}" href="chap_${i}.xhtml" media-type="application/xhtml+xml"/>`).join('')}</manifest><spine>${coverSpine}<itemref idref="title"/>${data.chapters.map((_,i)=>`<itemref idref="ch${i}"/>`).join('')}</spine></package>`);
 return zip;
}
export async function exportToEPUB(data:ExportData){saveAs(await buildEPUB(data).generateAsync({type:'blob'}),`${filename(data.title)}.epub`);}
export async function exportToDOCX(data:ExportData){saveAs(await buildDOCX(data).generateAsync({type:'blob',mimeType:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'}),`${filename(data.title)}.docx`);}
export async function exportToTXT(data:ExportData){saveAs(new Blob([buildTXT(data)],{type:'text/plain;charset=utf-8'}),`${filename(data.title)}.txt`);}
export async function exportToMarkdown(data:ExportData){saveAs(new Blob([buildMarkdown(data)],{type:'text/markdown;charset=utf-8'}),`${filename(data.title)}.md`);}
