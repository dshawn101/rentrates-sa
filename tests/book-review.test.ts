import {expect,it} from 'vitest';
import {webcrypto} from 'node:crypto';
import {planReview,parseDigest,parseFindings,reviewFingerprint,type ReviewChapter} from '../src/lib/book-review';
const chapters:ReviewChapter[]=[{id:'one',title:'Opening',content:'Maya was thirty-two years old.',revision:1,content_format:'plain'},{id:'two',title:'Later',content:'Maya celebrated her thirtieth birthday.',revision:1,content_format:'plain'}];
it('plans every character once and rejects oversized or empty manuscripts before requests',()=>{
 const text='a'.repeat(48001),parts=planReview([{...chapters[0],content:text}]);expect(parts.map(p=>p.text).join('')).toBe(text);expect(parts).toHaveLength(3);
 expect(()=>planReview([])).toThrow(/Save/);expect(()=>planReview([{...chapters[0],content:'a'.repeat(960001)}])).toThrow(/40/);
});
it('keeps only source-backed extracted facts and bounds model output',()=>{
 const part=planReview(chapters)[0];const parsed=parseDigest(JSON.stringify({summary:'Opening',facts:[{fact:'Age 32',quote:'Maya was thirty-two years old.'},{fact:'Invented',quote:'Maya is an astronaut.'}]}),part);
 expect(parsed.facts).toHaveLength(1);expect(()=>parseDigest('truncated {',part)).toThrow(/unreadable/);
});
it('requires exact source evidence for final findings and never applies edits',()=>{
 const valid={title:'Possible age conflict',explanation:'Check the timeline.',severity:'high',evidence:chapters.map(c=>({chapterId:c.id,quote:c.content}))};
 expect(parseFindings(JSON.stringify({findings:[valid]}),chapters)).toHaveLength(1);
 expect(parseFindings(JSON.stringify({findings:[{...valid,evidence:[...valid.evidence,{chapterId:'missing',quote:'Not in the manuscript'}]}]}),chapters)).toEqual([]);
 expect(chapters[0].content).toBe('Maya was thirty-two years old.');
});
it('invalidates checkpoints for changed text, order, revision or author guide',async()=>{
 const original=globalThis.crypto;Object.defineProperty(globalThis,'crypto',{value:webcrypto,configurable:true});
 try{const first=await reviewFingerprint(chapters,'guide');expect(await reviewFingerprint([...chapters].reverse(),'guide')).not.toBe(first);expect(await reviewFingerprint(chapters,'new guide')).not.toBe(first);expect(await reviewFingerprint(chapters.map((c,i)=>i?c:{...c,revision:2}),'guide')).not.toBe(first);}finally{Object.defineProperty(globalThis,'crypto',{value:original,configurable:true});}
});
