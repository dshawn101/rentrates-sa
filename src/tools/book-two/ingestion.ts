export const MAX_TEXT_BYTES=2*1024*1024;
export const MAX_FILE_BYTES=20*1024*1024;
export interface ParsedManuscript {name:string;text:string;characters:number;bytes:number;preview:string;warnings:string[]}
function read(file:File,asText:boolean,signal?:AbortSignal):Promise<string|ArrayBuffer>{
 return new Promise((resolve,reject)=>{const reader=new FileReader();const abort=()=>reader.abort();const cleanup=()=>signal?.removeEventListener('abort',abort);reader.onload=()=>{cleanup();resolve(reader.result as string|ArrayBuffer);};reader.onerror=()=>{cleanup();reject(new Error('This file could not be read. Choose a readable local file.'));};reader.onabort=()=>{cleanup();reject(new DOMException('Cancelled','AbortError'));};if(signal?.aborted){reject(new DOMException('Cancelled','AbortError'));return;}signal?.addEventListener('abort',abort,{once:true});if(asText)reader.readAsText(file,'UTF-8');else reader.readAsArrayBuffer(file);});
}
export function checkText(text:string,maxBytes=MAX_TEXT_BYTES){const bytes=new TextEncoder().encode(text).byteLength;if(bytes>maxBytes)throw new Error(`Extracted text exceeds the ${Math.round(maxBytes/1024/1024*10)/10} MB limit. Use a smaller manuscript or text-only export.`);return bytes;}
// Check ZIP metadata before Mammoth inflates a DOCX. Reject ZIP64/oversized archives.
export function checkDocxArchive(buffer:ArrayBuffer){
 const view=new DataView(buffer);let end=-1;for(let i=buffer.byteLength-22;i>=Math.max(0,buffer.byteLength-65557);i--)if(view.getUint32(i,true)===0x06054b50){end=i;break;}
 if(end<0)throw new Error('This Word file could not be parsed. Save a valid .docx or export it as UTF-8 text.');
 const count=view.getUint16(end+10,true);let at=view.getUint32(end+16,true),total=0;if(count>10000)throw new Error('This DOCX contains too many embedded files. Export a text-only copy.');
 for(let i=0;i<count;i++){if(at+46>buffer.byteLength||view.getUint32(at,true)!==0x02014b50)throw new Error('This Word archive is damaged or unsupported. Export a fresh .docx.');const size=view.getUint32(at+24,true);if(size===0xffffffff||(total+=size)>64*1024*1024)throw new Error('This DOCX expands beyond the local parsing limit. Export a text-only copy.');at+=46+view.getUint16(at+28,true)+view.getUint16(at+30,true)+view.getUint16(at+32,true);}
}
export async function parseManuscript(file:File,options:{maxTextBytes?:number;signal?:AbortSignal;onProgress?:(message:string)=>void}={}):Promise<ParsedManuscript>{
 const {signal,onProgress}=options;const max=options.maxTextBytes??MAX_TEXT_BYTES;const ext=file.name.split('.').pop()?.toLowerCase();if(!['txt','md','docx','pdf'].includes(ext||''))throw new Error('Choose a .txt, .md, .docx or .pdf file.');if(!file.size)throw new Error('The selected file is empty.');if(file.size>MAX_FILE_BYTES)throw new Error('This file exceeds the 20 MB upload limit. Nothing was uploaded; choose a smaller local file.');
 let text='';const warnings:string[]=[];onProgress?.('Reading your manuscript…');
 if(ext==='txt'||ext==='md')text=await read(file,true,signal) as string;
 else if(ext==='docx'){
  const buffer=await read(file,false,signal) as ArrayBuffer;checkDocxArchive(buffer);
  try{const mammoth=await import('mammoth');const result=await mammoth.extractRawText({arrayBuffer:buffer});text=result.value;if(result.messages.length)warnings.push('Some Word features could not be extracted. Check the preview; images, comments and page layout are not analysed.');}catch{throw new Error('This Word file could not be parsed. Save a valid .docx or export it as UTF-8 text.');}
 }else{
  const buffer=await read(file,false,signal) as ArrayBuffer;const pdfjs=await import('pdfjs-dist');
  pdfjs.GlobalWorkerOptions.workerSrc=new URL('pdfjs-dist/build/pdf.worker.min.mjs',import.meta.url).href;
  const task=pdfjs.getDocument({data:new Uint8Array(buffer),verbosity:0,useSystemFonts:false,useWasm:false,cMapUrl:`${location.origin}/tools/pdfjs/cmaps/`,cMapPacked:true,standardFontDataUrl:`${location.origin}/tools/pdfjs/standard_fonts/`});const cancel=()=>{void task.destroy();};signal?.addEventListener('abort',cancel,{once:true});
  try{const pdf=await task.promise;if(pdf.numPages>2000)throw new Error('PDFs over 2,000 pages are not supported. Export a smaller text file.');let bytes=0,emptyPages=0;const pages:string[]=[];
   for(let i=1;i<=pdf.numPages;i++){signal?.throwIfAborted();onProgress?.(`Reading PDF page ${i} of ${pdf.numPages}…`);const page=await pdf.getPage(i);const content=await page.getTextContent();const value=content.items.map(item=>'str' in item?item.str+(item.hasEOL?'\n':' '):'').join('');if(!value.trim())emptyPages++;bytes+=new TextEncoder().encode(value+'\n\n').byteLength;if(bytes>max)throw new Error('Extracted text exceeds the 2 MB limit. Choose a smaller manuscript.');pages.push(value);page.cleanup();}text=pages.join('\n\n');if(emptyPages)warnings.push(`${emptyPages} of ${pdf.numPages} PDF page(s) had no extractable text and could not be analysed. Use OCR first if those pages contain story content.`);warnings.push('PDF reading order can differ from the page layout. Scanned pages need OCR before import.');
  }catch(error){if(signal?.aborted)throw new DOMException('Cancelled','AbortError');if(error instanceof Error&&/exceeds|2,000/.test(error.message))throw error;throw new Error('This PDF could not be read. It may be password-protected, damaged or unsupported. Export an unlocked text-based PDF or a .txt file.');}finally{signal?.removeEventListener('abort',cancel);await task.destroy();}
 }
 signal?.throwIfAborted();text=text.replace(/^\uFEFF/,'').replace(/\u0000/g,'').trim();if(!text)throw new Error(ext==='pdf'?'No readable text was found in this PDF. Scanned pages require OCR; import a text-based PDF or .txt file.':'No readable text was found in this file. Choose a manuscript containing text.');const bytes=checkText(text,max);return {name:file.name,text,characters:Array.from(text).length,bytes,preview:text.slice(0,700),warnings};
}
