import type JSZip from 'jszip';
// Browser-side structure checks supplement, not replace, EPUBCheck in CI.
export async function validateEPUBStructure(zip:JSZip){
 const file=async(path:string)=>{const entry=zip.file(path);if(!entry)throw new Error(`EPUB structure check failed: missing ${path}.`);return entry.async('string');};
 if(await file('mimetype')!=='application/epub+zip')throw new Error('EPUB mimetype is invalid.');
 const parse=(xml:string)=>{const doc=new DOMParser().parseFromString(xml,'application/xml');if(doc.getElementsByTagName('parsererror').length)throw new Error('EPUB contains malformed XML.');return doc;};
 const container=parse(await file('META-INF/container.xml'));
 const packagePath=container.getElementsByTagNameNS('*','rootfile')[0]?.getAttribute('full-path');
 if(!packagePath||packagePath.includes('..')||packagePath.startsWith('/'))throw new Error('EPUB package path is invalid.');
 const opf=parse(await file(packagePath)),base=packagePath.slice(0,packagePath.lastIndexOf('/')+1);
 for(const name of ['title','creator','language','identifier'])if(!opf.getElementsByTagNameNS('*',name)[0]?.textContent?.trim())throw new Error(`EPUB metadata is missing ${name}.`);
 const items=Array.from(opf.getElementsByTagNameNS('*','item')),ids=new Set(items.map(i=>i.getAttribute('id')));
 if(ids.size!==items.length)throw new Error('EPUB contains duplicate manifest identifiers.');
 if(!items.some(i=>i.getAttribute('properties')?.split(/\s+/).includes('nav')))throw new Error('EPUB navigation is missing.');
 for(const item of items){const href=item.getAttribute('href');if(!href||href.includes('..')||href.includes(':')||!zip.file(base+href))throw new Error('EPUB references a missing or unsupported resource.');if(item.getAttribute('media-type')==='application/xhtml+xml'){
  const page=parse(await file(base+href));for(const link of Array.from(page.getElementsByTagNameNS('*','a'))){const target=link.getAttribute('href')?.split('#')[0];if(target&&!target.includes(':')&&!zip.file(base+target))throw new Error('EPUB navigation references a missing chapter.');}
 }}
 const spine=Array.from(opf.getElementsByTagNameNS('*','itemref'));
 if(!spine.length||spine.some(i=>!ids.has(i.getAttribute('idref'))))throw new Error('EPUB reading order is invalid.');
 return {resources:items.length,readingOrder:spine.length};
}
