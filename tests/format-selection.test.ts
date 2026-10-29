import {expect,it} from 'vitest';
import {formatSelection} from '../src/lib/format-selection';
import {inlineRuns,manuscriptHTML} from '../src/lib/manuscript-format';
it('preserves and reselects prose while toggling bold and italic independently',()=>{
 let r=formatSelection('Small beginnings',0,5,'bold');expect(r).toEqual({content:'**Small** beginnings',start:2,end:7});
 r=formatSelection(r.content,r.start,r.end,'italic');expect(r).toEqual({content:'***Small*** beginnings',start:3,end:8});
 expect(inlineRuns(r.content)[0]).toMatchObject({text:'Small',bold:true,italic:true});
 r=formatSelection(r.content,r.start,r.end,'bold');expect(r).toEqual({content:'*Small* beginnings',start:1,end:6});r=formatSelection(r.content,r.start,r.end,'italic');expect(r.content).toBe('Small beginnings');
});
it('formats whole selected lines, changes block type and removes repeated prefixes without inserting placeholder prose',()=>{
 let r=formatSelection('Opening\nSecond\nLeave this',2,14,'bullet');expect(r.content).toBe('- Opening\n- Second\nLeave this');r=formatSelection(r.content,r.start,r.end,'heading');expect(r.content).toBe('# Opening\n# Second\nLeave this');r=formatSelection(r.content,r.start,r.end,'heading');expect(r.content).toBe('Opening\nSecond\nLeave this');
 expect(formatSelection('One\nTwo',0,4,'quote').content).toBe('> One\nTwo');expect(formatSelection('\nNext',0,0,'heading')).toEqual({content:'# \nNext',start:2,end:2});expect(formatSelection('',0,0,'bold')).toEqual({content:'****',start:2,end:2});
});
it('removes formatting when the selected text includes its delimiters and exports combined emphasis safely',()=>{
 expect(formatSelection('**Whole**',0,9,'bold').content).toBe('Whole');expect(formatSelection('***Both***',0,10,'italic').content).toBe('**Both**');const html=manuscriptHTML('***<script>literal</script>***','markdown');expect(html).toBe('<p><em><strong>&lt;script&gt;literal&lt;/script&gt;</strong></em></p>');
});
