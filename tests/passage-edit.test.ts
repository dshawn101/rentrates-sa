import {expect,it} from 'vitest';
import {replacePassage,parsePassageSuggestion} from '../src/lib/passage-edit';
it('replaces the exact selected occurrence and rejects stale ranges',()=>{
 expect(replacePassage('same / same',7,11,'same','new')).toBe('same / new');
 expect(()=>replacePassage('changed',0,4,'same','new')).toThrow(/changed/);
 expect(()=>replacePassage('same',-1,4,'same','new')).toThrow();
});
it('reads structured output and rejects blank or incomplete suggestions',()=>{
 expect(parsePassageSuggestion('```json\n{"replacement":"Better text","reason":"Clarity"}\n```')).toEqual({replacement:'Better text',reason:'Clarity'});
 for(const raw of ['text','{}','{"replacement":" ","reason":"x"}'])expect(()=>parsePassageSuggestion(raw)).toThrow();
});
