export type PassageAction = 'proofread' | 'tighten' | 'clarify' | 'custom';
export function replacePassage(original:string,start:number,end:number,expected:string,replacement:string){
 if(!Number.isInteger(start)||!Number.isInteger(end)||start<0||end<=start||end>original.length||original.slice(start,end)!==expected)throw new Error('The selected passage changed. Select it again.');
 return original.slice(0,start)+replacement+original.slice(end);
}
export function parsePassageSuggestion(raw:string):{replacement:string;reason:string}{
 const clean=raw.trim().replace(/^```(?:json)?\s*/,'').replace(/\s*```$/,'');
 let value;try{value=JSON.parse(clean);}catch{throw new Error('The provider returned an unreadable suggestion. Your writing has not changed. Retry.');}
 if(typeof value.replacement!=='string'||!value.replacement.trim()||typeof value.reason!=='string')throw new Error('The provider returned an incomplete suggestion. Your writing has not changed.');
 return {replacement:value.replacement,reason:value.reason.slice(0,1500)};
}
