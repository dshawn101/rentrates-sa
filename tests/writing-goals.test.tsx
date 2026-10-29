// @vitest-environment jsdom
import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import {cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react';
import {WritingGoals} from '../src/components/author/WritingGoals';
import {useBookStore,type Book} from '../src/store/useBookStore';
const m=vi.hoisted(()=>({rpc:vi.fn()}));vi.mock('../src/lib/supabase',()=>({supabase:{rpc:m.rpc}}));
const book={id:'book',user_id:'owner',title:'My draft',metadata:{coverPath:'keep',targetWordCount:30000},wordCount:400} as Book;
beforeEach(()=>{m.rpc.mockReset();useBookStore.setState({books:[book]});});afterEach(cleanup);
it('saves an optional goal and preserves loaded progress instead of replacing book aggregates',async()=>{
 m.rpc.mockResolvedValue({data:{metadata:{coverPath:'keep',targetWordCount:50000,writingGoal:{enabled:true,targetWords:50000,targetDate:'2026-12-01'}},updated_at:'2026-10-29T10:00:00Z'},error:null});render(<WritingGoals book={book}/>);fireEvent.change(screen.getByLabelText('Word target'),{target:{value:'50000'}});fireEvent.change(screen.getByLabelText('Target date · optional'),{target:{value:'2026-12-01'}});fireEvent.click(screen.getByText('Save writing goal'));await screen.findByText('Writing goal saved.');expect(m.rpc).toHaveBeenCalledWith('save_writing_goal',{p_book:'book',p_enabled:true,p_target:50000,p_date:'2026-12-01'});expect(useBookStore.getState().books[0]).toMatchObject({wordCount:400,metadata:{coverPath:'keep',writingGoal:{targetWords:50000}}});
});
it('retains the previous goal after a failed save and lets authors turn it off explicitly',async()=>{
 const withGoal={...book,metadata:{writingGoal:{enabled:true,targetWords:1000,targetDate:null}}};useBookStore.setState({books:[withGoal]});m.rpc.mockResolvedValueOnce({data:null,error:new Error('Connection unavailable')}).mockResolvedValueOnce({data:{metadata:{writingGoal:{enabled:false}},updated_at:'now'},error:null});render(<WritingGoals book={withGoal}/>);expect(screen.getByText('600 words to go.')).toBeTruthy();fireEvent.click(screen.getByText('Save writing goal'));await screen.findByRole('alert');expect(useBookStore.getState().books[0].metadata.writingGoal.enabled).toBe(true);fireEvent.click(screen.getByText('Turn off goal'));await waitFor(()=>expect(m.rpc).toHaveBeenLastCalledWith('save_writing_goal',{p_book:'book',p_enabled:false,p_target:null,p_date:null}));
});
