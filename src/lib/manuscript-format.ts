export type ContentFormat='plain'|'markdown';
export interface TextRun { text:string; bold?:boolean; italic?:boolean }
export interface TextBlock { kind:'paragraph'|'heading'|'bullet'|'quote'; level?:number; runs:TextRun[] }
export const escapeXML=(value:string)=>value.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]!)).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g,'');
export function inlineRuns(text:string):TextRun[] {
 const result:TextRun[]=[];const pattern=/\*\*([^*]+)\*\*|\*([^*]+)\*/g;let from=0;
 for(const match of text.matchAll(pattern)){if(match.index!>from)result.push({text:text.slice(from,match.index)});result.push({text:match[1]||match[2],bold:!!match[1],italic:!!match[2]});from=match.index!+match[0].length;}
 if(from<text.length)result.push({text:text.slice(from)});return result.length?result:[{text}];
}
export function parseBlocks(content:string,format:ContentFormat='plain'):TextBlock[]{
 if(format==='plain')return content.replace(/\r\n/g,'\n').split(/\n\s*\n/).map(text=>({kind:'paragraph',runs:[{text}]}));
 const blocks:TextBlock[]=[];let paragraph:string[]=[];
 const flush=()=>{if(paragraph.length){blocks.push({kind:'paragraph',runs:inlineRuns(paragraph.join('\n'))});paragraph=[];}};
 for(const line of content.replace(/\r\n/g,'\n').split('\n')){
   const heading=/^(#{1,3})\s+(.+)$/.exec(line), bullet=/^[-*]\s+(.+)$/.exec(line),quote=/^>\s?(.*)$/.exec(line);
   if(!line.trim()){flush();continue;}
   if(heading||bullet||quote){flush();blocks.push({kind:heading?'heading':bullet?'bullet':'quote',level:heading?.[1].length,runs:inlineRuns((heading||bullet||quote)![heading?2:1])});}else paragraph.push(line);
 }
 flush();return blocks;
}
export function plainManuscript(content:string,format:ContentFormat='plain'){
 return parseBlocks(content,format).map(b=>(b.kind==='bullet'?'• ':'')+b.runs.map(r=>r.text).join('')).join('\n\n');
}
export function manuscriptHTML(content:string,format:ContentFormat='plain'){
 return parseBlocks(content,format).map(b=>{
   const text=b.runs.map(r=>{let t=escapeXML(r.text).replace(/\n/g,'<br/>');if(r.bold)t=`<strong>${t}</strong>`;if(r.italic)t=`<em>${t}</em>`;return t;}).join('');
   if(b.kind==='heading')return `<h${Math.min(4,(b.level||1)+1)}>${text}</h${Math.min(4,(b.level||1)+1)}>`;
   return b.kind==='quote'?`<blockquote><p>${text}</p></blockquote>`:b.kind==='bullet'?`<ul><li>${text}</li></ul>`:`<p>${text}</p>`;
 }).join('\n');
}
