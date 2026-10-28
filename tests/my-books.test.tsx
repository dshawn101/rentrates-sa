// @vitest-environment jsdom
import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import {cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import {MyBooks} from '../src/pages/MyBooks';
import {Dashboard} from '../src/pages/Dashboard';
import {useBookStore} from '../src/store/useBookStore';
const mocks=vi.hoisted(()=>({from:vi.fn(),toast:vi.fn(),fetch:vi.fn(),move:vi.fn(),create:vi.fn()}));
vi.mock('../src/lib/supabase',()=>({supabase:{from:mocks.from}}));
vi.mock('../src/hooks/useAuth',()=>({useAuth:()=>({user:{id:'owner',user_metadata:{display_name:'Deion Shawn'}}})}));
vi.mock('../src/store/useToastStore',()=>({useToastStore:()=>({addToast:mocks.toast})}));
vi.mock('../src/components/dashboard/DashboardHelper',()=>({DashboardHelper:()=>null}));
const books=[{id:'one',user_id:'owner',title:'Novel',status:'writing' as const,folder_id:null,metadata:{},wordCount:20,updated_at:'2026-10-21T10:00:00Z',created_at:'',tier_created:'free'}, {id:'two',user_id:'owner',title:'Second book',status:'draft' as const,folder_id:'thriller',metadata:{},updated_at:'',created_at:'',tier_created:'free'}];
beforeEach(()=>{vi.clearAllMocks();useBookStore.setState({books,isLoading:false,error:null,fetchBooks:mocks.fetch,createBook:mocks.create});mocks.move.mockResolvedValue({data:{id:'one',folder_id:'thriller'},error:null});
 mocks.from.mockImplementation(table=>table==='book_folders'?{select:()=>({eq:()=>({order:async()=>({data:[{id:'thriller',name:'Thriller'}],error:null})})})}:{update:()=>({eq:()=>({eq:()=>({select:()=>({single:mocks.move})})})})});
});
afterEach(cleanup);
it('keeps the dashboard overview separate from manuscript and resume cards',async()=>{
 render(<MemoryRouter><Dashboard/></MemoryRouter>);
 expect(screen.queryByText('Recent Projects')).toBeNull();expect(screen.queryByText('Pick up where you left off')).toBeNull();expect(screen.getByRole('link',{name:/^Open My Books/})).toBeTruthy();
});
it('shows the resume card in My Books and filters manuscripts by folder',async()=>{
 render(<MemoryRouter><MyBooks/></MemoryRouter>);await waitFor(()=>expect(screen.getAllByRole('option',{name:'Thriller'}).length).toBe(2));
 expect(screen.getByText('Pick up where you left off')).toBeTruthy();expect(screen.getByText('Recent Projects')).toBeTruthy();
 fireEvent.click(screen.getByRole('button',{name:/Thriller: 1 book/}));
 expect(screen.queryByRole('link',{name:'Open Novel'})).toBeNull();expect(screen.getByRole('link',{name:'Open Second book'})).toBeTruthy();
 fireEvent.click(screen.getByRole('button',{name:/All books: 2 books/}));expect(screen.getByRole('link',{name:'Open Novel'})).toBeTruthy();
});
it('moves a manuscript through its accessible folder selector',async()=>{
 render(<MemoryRouter><MyBooks/></MemoryRouter>);await waitFor(()=>expect(screen.getAllByRole('option',{name:'Thriller'}).length).toBe(2));
 fireEvent.change(screen.getByLabelText('Move Novel to folder'),{target:{value:'thriller'}});
 await waitFor(()=>expect(useBookStore.getState().books[0].folder_id).toBe('thriller'));expect(mocks.toast).toHaveBeenCalledWith('Manuscript moved to folder.','success');
});
it('retains the previous folder when a move fails',async()=>{
 mocks.move.mockResolvedValue({data:null,error:{message:'offline'}});
 render(<MemoryRouter><MyBooks/></MemoryRouter>);await waitFor(()=>expect(screen.getAllByRole('option',{name:'Thriller'}).length).toBe(2));
 fireEvent.change(screen.getByLabelText('Move Novel to folder'),{target:{value:'thriller'}});
 await waitFor(()=>expect(mocks.toast).toHaveBeenCalledWith('offline','error'));expect(useBookStore.getState().books[0].folder_id).toBeNull();
});
it('accepts drag/drop only for known manuscripts and uses the same move operation',async()=>{
 render(<MemoryRouter><MyBooks/></MemoryRouter>);const target=await screen.findByRole('button',{name:/Thriller: 1 book/});
 fireEvent.drop(target,{dataTransfer:{getData:()=> 'one'}});
 await waitFor(()=>expect(mocks.move).toHaveBeenCalledTimes(1));
});
it('creates new manuscripts directly inside the selected folder',async()=>{
 mocks.create.mockResolvedValue(null);
 render(<MemoryRouter><MyBooks/></MemoryRouter>);
 fireEvent.click(await screen.findByRole('button',{name:/Thriller: 1 book/}));
 fireEvent.click(screen.getByRole('button',{name:'Start new book'}));
 fireEvent.change(screen.getByPlaceholderText('e.g., The Midnight Library'),{target:{value:'New thriller'}});
 fireEvent.click(screen.getByRole('button',{name:'Create book'}));
 await waitFor(()=>expect(mocks.create).toHaveBeenCalledWith('New thriller',{},'thriller'));
});
it('ignores unknown dragged IDs and filters book titles through search',async()=>{
 render(<MemoryRouter><MyBooks/></MemoryRouter>);
 fireEvent.drop(await screen.findByRole('button',{name:/Thriller: 1 book/}),{dataTransfer:{getData:()=> 'not-an-owned-book'}});
 expect(mocks.move).not.toHaveBeenCalled();
 fireEvent.change(screen.getByLabelText('Search my books'),{target:{value:'Novel'}});
 expect(screen.getByRole('link',{name:'Open Novel'})).toBeTruthy();expect(screen.queryByRole('link',{name:'Open Second book'})).toBeNull();
});
