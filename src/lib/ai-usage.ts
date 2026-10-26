export interface AIUsage {inputTokens?:number;outputTokens?:number;costUSD?:number}
export interface UsageRecord extends AIUsage {provider:string;model:string;at:string}
export interface ModelPrice {inputUSD:number;outputUSD:number;requestUSD:number;checkedAt:string}
export function estimateCost(characters:number,outputTokens:number,price:ModelPrice){
 // Character heuristic, intentionally labelled approximate. Not a billing cap.
 const inputTokens=Math.ceil(Math.max(0,characters)/3)+100;
 return {inputTokens,outputTokens,costUSD:inputTokens*price.inputUSD+outputTokens*price.outputUSD+price.requestUSD};
}
const key=(owner:string)=>`puble:ai-usage:${owner}`;
export function readUsage(owner:string|null):UsageRecord[]{try{const data=owner?JSON.parse(localStorage.getItem(key(owner))||'[]'):[];return Array.isArray(data)?data.filter(r=>r&&typeof r.provider==='string'&&typeof r.model==='string'&&typeof r.at==='string').slice(0,50):[];}catch{return [];}}
export function recordUsage(owner:string,record:UsageRecord){try{localStorage.setItem(key(owner),JSON.stringify([record,...readUsage(owner)].slice(0,50)));window.dispatchEvent(new Event('puble:usage'));}catch{/* usage history never blocks writing */}}
export const dollars=(n:number)=>'$'+n.toFixed(n<0.01?6:4)+' USD';
