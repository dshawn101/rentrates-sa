// @vitest-environment jsdom
import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import {cleanup,fireEvent,render,screen,waitFor,within} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import {Sidebar} from '../src/components/layout/Sidebar';
import {WritingGoalsPage} from '../src/pages/WritingGoalsPage';
import {useBookStore,type Book} from '../src/store/useBookStore';
const m=vi.hoisted(()=>({rpc:vi.fn()}));
vi.mock('../src/lib/supabase',()=>({supabase:{rpc:m.rpc}}));vi.mock('../src/hooks/useAuth',()=>({useAuth:()=>({user:{id:'owner'},profile:{tier:'free'}})}));vi.mock('../src/components/help/FeedbackButton',()=>({FeedbackButton:()=>null}));
const books=[{id:'one',user_id:'owner',title:'First manuscript',wordCount:600,status:'writing',metadata:{writingGoal:{enabled:true,targetWords:1000,targetDate:null}},created_at:'2026-10-01',updated_at:'2026-10-28'},{id:'two',user_id:'owner',title:'Second manuscript',wordCount:1200,status:'writing',metadata:{writingGoal:{enabled:true,targetWords:5000,targetDate:null}},created_at:'2026-10-01',updated_at:'2026-10-29'}] as Book[];
beforeEach(()=>{m.rpc.mockReset();useBookStore.setState({books,isLoading:false,error:null});});afterEach(cleanup);
it('keeps Author Guide out of the main sidebar and gives Writing Goals an active route',()=>{
 render(<MemoryRouter initialEntries={['/writing-goals']}><Sidebar/></MemoryRouter>);const links=screen.getAllByRole('link');const names=links.map(l=>l.textContent);const costs=names.indexOf('Features & Costs');expect(names.slice(costs,costs+2)).toEqual(['Features & Costs','Help Center']);expect(screen.queryByRole('link',{name:'Author Guide'})).toBeNull();expect(screen.getByRole('link',{name:'Writing Goals'}).getAttribute('aria-current')).toBe('page');
});
it('shows one goal panel, selects a linked manuscript, and switches saved progress without mixing goal values',async()=>{
 render(<MemoryRouter initialEntries={['/writing-goals?book=one']}><WritingGoalsPage/></MemoryRouter>);expect(screen.getByLabelText('Word target').getAttribute('value')).toBe('1000');expect(screen.getByText('600 / 1,000 words')).toBeTruthy();expect(screen.getAllByRole('region',{name:/Writing goal for/})).toHaveLength(1);
 fireEvent.change(screen.getByLabelText('Manuscript'),{target:{value:'two'}});expect(screen.getByText('1,200 / 5,000 words')).toBeTruthy();expect((screen.getByLabelText('Word target') as HTMLInputElement).value).toBe('5000');expect(screen.getByRole('link',{name:/Continue writing/}).getAttribute('href')).toBe('/book/two?step=3');
 m.rpc.mockResolvedValue({data:{metadata:{writingGoal:{enabled:true,targetWords:7000,targetDate:null}},updated_at:'2026-10-29'},error:null});fireEvent.change(screen.getByLabelText('Word target'),{target:{value:'7000'}});fireEvent.click(screen.getByRole('button',{name:'Save writing goal'}));await waitFor(()=>expect(m.rpc).toHaveBeenCalledWith('save_writing_goal',{p_book:'two',p_enabled:true,p_target:7000,p_date:null}));expect(useBookStore.getState().books[0].metadata.writingGoal.targetWords).toBe(1000);
});
it('handles missing manuscripts and load errors without showing stale editable goals',()=>{
 useBookStore.setState({books:[]});const view=render(<MemoryRouter><WritingGoalsPage/></MemoryRouter>);expect(screen.getByRole('link',{name:'Open My Books'})).toBeTruthy();useBookStore.setState({books,error:'Network error'});view.rerender(<MemoryRouter><WritingGoalsPage/></MemoryRouter>);expect(screen.getByRole('alert')).toBeTruthy();expect(screen.queryByLabelText('Word target')).toBeNull();expect(within(screen.getByRole('alert').parentElement!).getByRole('button',{name:'Retry loading manuscripts'})).toBeTruthy();
});
