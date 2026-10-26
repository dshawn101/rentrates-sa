// @vitest-environment jsdom
import {afterEach,expect,it,vi} from 'vitest';
import {cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react';
import {ManuscriptImport} from '../src/components/book/ManuscriptImport';
vi.mock('../src/lib/manuscript-import',()=>({importManuscript:async()=>({chapters:[{title:'Opening',content:'First. Second.',format:'plain'}],warnings:[]})}));
afterEach(cleanup);
it('reviews and splits text, then combines without losing prose before committing',async()=>{
 const onImport=vi.fn();render(<ManuscriptImport initialOpen onImport={onImport}/>);
 fireEvent.change(screen.getByLabelText('Import manuscript file'),{target:{files:[{name:'draft.txt',arrayBuffer:async()=>new ArrayBuffer(0)}]}});
 const text=await screen.findByLabelText('Chapter text · place the cursor to split') as HTMLTextAreaElement;
 text.setSelectionRange(7,7);fireEvent.select(text);fireEvent.click(screen.getByText('Split at cursor'));
 expect(screen.getByText('Preview · 2 chapters')).toBeTruthy();expect(onImport).not.toHaveBeenCalled();
 fireEvent.click(screen.getByText('Combine with next'));
 await waitFor(()=>expect((screen.getByLabelText('Chapter text · place the cursor to split') as HTMLTextAreaElement).value).toBe('First. \n\nSecond.'));
 fireEvent.change(screen.getByLabelText('Chapter title'),{target:{value:'New title'}});
 fireEvent.click(screen.getByText('Add imported chapters to outline'));
 expect(onImport).toHaveBeenCalledWith([{title:'New title',content:'First. \n\nSecond.',format:'plain'}]);
});
