import type {ContentFormat} from './manuscript-format';
export interface ReviewChapter {id:string;title:string;content:string;revision:number;content_format:ContentFormat}
export interface ReviewPart {chapterId:string;title:string;text:string;number:number}
export interface ReviewDigest {summary:string;facts:{fact:string;quote:string}[]}
export interface ReviewFinding {title:string;explanation:string;severity:'high'|'medium'|'low';evidence:{chapterId:string;quote:string}[]}
export function planReview(chapters:ReviewChapter[]):ReviewPart[]{
 const parts:ReviewPart[]=[];
 for(const chapter of chapters.filter(c=>c.content.trim()))for(let start=0;start<chapter.content.length;start+=24000)parts.push({chapterId:chapter.id,title:chapter.title,text:chapter.content.slice(start,start+24000),number:parts.length});
 if(!parts.length)throw new Error('Save some chapter text before reviewing.');
 if(parts.length>40)throw new Error('This beta review supports up to 40 text batches (about 960,000 characters). Review a shorter manuscript; no text has been sent.');
 return parts;
}
function json(raw:string){try{return JSON.parse(raw.trim().replace(/^```(?:json)?\s*/,'').replace(/\s*```$/,''));}catch{throw new Error('The provider returned unreadable review data. Pause and retry this batch.');}}
export function parseDigest(raw:string,part:ReviewPart):ReviewDigest{
 const value=json(raw);
 if(!value||typeof value.summary!=='string'||!Array.isArray(value.facts))throw new Error('The provider returned incomplete review notes. Retry this batch.');
 const facts=value.facts.slice(0,5).filter((f:Record<string,unknown>)=>f&&typeof f.fact==='string'&&typeof f.quote==='string'&&f.quote.length>=8&&f.quote.length<=180&&part.text.includes(f.quote)).map((f:{fact:string;quote:string})=>({fact:f.fact.slice(0,200),quote:f.quote}));
 return {summary:value.summary.slice(0,500),facts};
}
export function parseFindings(raw:string,chapters:ReviewChapter[]):ReviewFinding[]{
 const value=json(raw);if(!value||!Array.isArray(value.findings))throw new Error('The final review is incomplete. Retry the comparison.');
 return value.findings.slice(0,30).filter((f:ReviewFinding)=>f&&typeof f.title==='string'&&typeof f.explanation==='string'&&['high','medium','low'].includes(f.severity)&&Array.isArray(f.evidence)&&f.evidence.length>=2&&f.evidence.every(e=>typeof e?.quote==='string'&&e.quote.length>=8&&e.quote.length<=300&&chapters.some(c=>c.id===e.chapterId&&c.content.includes(e.quote)))).map((f:ReviewFinding)=>({...f,title:f.title.slice(0,180),explanation:f.explanation.slice(0,2000),evidence:f.evidence.slice(0,4)}));
}
export async function reviewFingerprint(chapters:ReviewChapter[],guide:string){
 const bytes=new TextEncoder().encode(JSON.stringify({chapters:chapters.map(c=>[c.id,c.title,c.content,c.revision,c.content_format]),guide}));
 return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))).map(n=>n.toString(16).padStart(2,'0')).join('');
}
