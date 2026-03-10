import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import JSZip from 'jszip';

interface ExportData {
  title: string;
  author: string;
  chapters: { title: string; content: string }[];
  isbn?: string;
}

export async function exportToPDF(data: ExportData, tier: string = 'free') {
  // A5 format: 148 x 210 mm
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a5'
  });

  const margins = { top: 20, bottom: 20, left: 15, right: 15 };
  let currentY = margins.top;

  // Title Page
  doc.setFont('times', 'bold');
  doc.setFontSize(28);
  doc.text(data.title, 148 / 2, 80, { align: 'center' });

  doc.setFont('times', 'normal');
  doc.setFontSize(14);
  doc.text(`By ${data.author}`, 148 / 2, 100, { align: 'center' });

  if (data.isbn) {
    doc.setFontSize(10);
    doc.text(`ISBN: ${data.isbn}`, 148 / 2, 190, { align: 'center' });
  }

  // Chapters
  for (const chapter of data.chapters) {
    doc.addPage();
    currentY = margins.top + 20;

    // Chapter Title
    doc.setFont('times', 'bold');
    doc.setFontSize(20);
    doc.text(chapter.title, 148 / 2, currentY, { align: 'center' });
    currentY += 20;

    // Chapter Content
    doc.setFont('times', 'normal');
    doc.setFontSize(11);

    // Simple text wrapping (could be improved with html2pdf for robust markdown support)
    const textLines = doc.splitTextToSize(chapter.content || '', 148 - margins.left - margins.right);

    for (let i = 0; i < textLines.length; i++) {
      if (currentY > 210 - margins.bottom) {
        doc.addPage();
        currentY = margins.top;
      }
      doc.text(textLines[i], margins.left, currentY);
      currentY += 6; // line height
    }

    // Add watermark on each page if free tier
    if (tier === 'free') {
       doc.setFont('times', 'italic');
       doc.setFontSize(8);
       doc.setTextColor(200, 200, 200);
       doc.text("Generated with Puble Studio Free Tier", 148 / 2, 205, { align: 'center' });
       doc.setTextColor(0, 0, 0); // reset
    }
  }

  doc.save(`${data.title.replace(/\s+/g, '_')}_A5_Print.pdf`);
}

export async function exportToEPUB(data: ExportData) {
  // EPUB requires a more complex folder structure inside a zip file
  // Due to browser environment limitations, we'll build a simple valid EPUB structure using JSZip
  const zip = new JSZip();

  // mimetype file
  zip.file('mimetype', 'application/epub+zip', { compression: 'STORE' });

  // META-INF folder
  const metaInf = zip.folder('META-INF')!;
  metaInf.file('container.xml', `<?xml version="1.0"?>
    <container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
      <rootfiles>
        <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
      </rootfiles>
    </container>`);

  // OEBPS folder
  const oebps = zip.folder('OEBPS')!;

  // Package document (content.opf)
  let manifestItems = '';
  let spineItems = '';

  data.chapters.forEach((ch, i) => {
    manifestItems += `<item id="chap_${i}" href="chap_${i}.html" media-type="application/xhtml+xml"/>\n`;
    spineItems += `<itemref idref="chap_${i}"/>\n`;

    // Chapter HTML files
    oebps.file(`chap_${i}.html`, `<?xml version="1.0" encoding="utf-8"?>
      <!DOCTYPE html>
      <html xmlns="http://www.w3.org/1999/xhtml">
      <head>
        <title>${ch.title}</title>
        <style>body { font-family: sans-serif; }</style>
      </head>
      <body>
        <h1>${ch.title}</h1>
        <p>${ch.content?.replace(/\n\n/g, '</p><p>') || ''}</p>
      </body>
      </html>`);
  });

  oebps.file('content.opf', `<?xml version="1.0" encoding="utf-8"?>
    <package version="3.0" unique-identifier="pub-id" xmlns="http://www.idpf.org/2007/opf">
      <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
        <dc:title>${data.title}</dc:title>
        <dc:creator>${data.author}</dc:creator>
        <dc:language>en</dc:language>
        <dc:identifier id="pub-id">${data.isbn || 'urn:uuid:' + crypto.randomUUID()}</dc:identifier>
      </metadata>
      <manifest>
        <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
        ${manifestItems}
      </manifest>
      <spine toc="ncx">
        ${spineItems}
      </spine>
    </package>`);

  // Simple NCX for older readers
  oebps.file('toc.ncx', `<?xml version="1.0" encoding="UTF-8"?>
    <ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
      <head>
        <meta name="dtb:uid" content="${data.isbn || 'unknown'}"/>
      </head>
      <docTitle><text>${data.title}</text></docTitle>
      <navMap>
        ${data.chapters.map((ch, i) => `
          <navPoint id="navPoint-${i}" playOrder="${i+1}">
            <navLabel><text>${ch.title}</text></navLabel>
            <content src="chap_${i}.html"/>
          </navPoint>
        `).join('')}
      </navMap>
    </ncx>`);

  const blob = await zip.generateAsync({ type: 'blob' });
  saveAs(blob, `${data.title.replace(/\s+/g, '_')}.epub`);
}