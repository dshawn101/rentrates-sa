// @vitest-environment jsdom
import {afterEach,expect,it,vi} from 'vitest';
import {cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react';
import {MemoryRouter,useLocation} from 'react-router-dom';
import {SeriesManuscript} from '../src/components/book/SeriesManuscript';
const m=vi.hoisted(()=>({fetchBooks:vi.fn(),setChapterCount:vi.fn(),rpc:vi.fn(),eq:vi.fn(),order:vi.fn()}));
vi.mock('../src/store/useBookStore',()=>({useBookStore:()=>({books:[{id:'book-1',title:'Book #1'}],fetchBooks:m.fetchBooks,setChapterCount:m.setChapterCount})}));
vi.mock('../src/components/book/BookReview',()=>({BookReview:()=>null}));
vi.mock('../src/lib/supabase',()=>({supabase:{from:()=>({select:()=>({eq:m.eq})}),rpc:m.rpc}}));
afterEach(cleanup);
function Location(){return <output>{useLocation().pathname+useLocation().search}</output>;}
it('previews a local manuscript and saves it after existing chapters before opening the first imported chapter',async()=>{
 m.eq.mockReturnValue({is:()=>({order:m.order})});
 m.order.mockResolvedValue({data:[{id:'existing',title:'Opening',revision:3}],error:null});
 m.rpc.mockResolvedValue({error:null});
 render(<MemoryRouter><SeriesManuscript/><Location/></MemoryRouter>);
 fireEvent.change(screen.getByLabelText('Book'),{target:{value:'book-1'}});
 const file=new File(['A draft to continue.'],'draft.txt');
 Object.defineProperty(file,'arrayBuffer',{value:async()=>new TextEncoder().encode('A draft to continue.').buffer});
 fireEvent.change(screen.getByLabelText(/Manuscript file/),{target:{files:[file]}});
 await screen.findByText('draft.txt · 1 chapter');
 expect(m.rpc).not.toHaveBeenCalled();
 fireEvent.click(screen.getByRole('button',{name:'Save & open editor'}));
 await waitFor(()=>expect(m.rpc).toHaveBeenCalledWith('save_book_outline',expect.objectContaining({
  p_book:'book-1',p_known_ids:['existing'],p_removed:[],
  p_items:[expect.objectContaining({id:'existing',revision:3}),expect.objectContaining({content:'A draft to continue.'})],
 })));
 const importedId=m.rpc.mock.calls[0][1].p_items[1].id;
 expect(await screen.findByText(`/book/book-1?step=3&chapter=${importedId}`)).toBeTruthy();
 expect(m.setChapterCount).toHaveBeenCalledWith('book-1',2);
});
