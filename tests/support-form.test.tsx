// @vitest-environment jsdom
import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import {cleanup,fireEvent,render,screen} from '@testing-library/react';
import {MemoryRouter,Routes,Route} from 'react-router-dom';
import {Contact} from '../src/pages/Contact';
import {PublicFooter} from '../src/components/legal/PublicFooter';
import {submitSupportRequest} from '../src/lib/support';
const mocks=vi.hoisted(()=>({insert:vi.fn(),user:null as null|{id:string}}));
vi.mock('../src/hooks/useAuth',()=>({useAuth:()=>({user:mocks.user})}));
vi.mock('../src/lib/supabase',()=>({supabase:{from:()=>({insert:mocks.insert})}}));
beforeEach(()=>{vi.clearAllMocks();mocks.user=null;mocks.insert.mockResolvedValue({error:null});});afterEach(cleanup);
const input={name:' Author ',email:'AUTHOR@example.com',category:'writing',subject:'Please help',book_title:'My Book',message:'I need help finding the last saved version of my chapter.'};
function fill(){fireEvent.change(screen.getByLabelText('Your name *'),{target:{value:input.name}});fireEvent.change(screen.getByLabelText('Email address *'),{target:{value:input.email}});fireEvent.change(screen.getByLabelText('Type of query *'),{target:{value:'writing'}});fireEvent.change(screen.getByLabelText('Subject *'),{target:{value:input.subject}});fireEvent.change(screen.getByLabelText('How can we help? *'),{target:{value:input.message}});}
it('links the Company footer to the real contact page',()=>{render(<MemoryRouter><PublicFooter/></MemoryRouter>);expect(screen.getByRole('link',{name:'Contact'}).getAttribute('href')).toBe('/contact');});
it('saves an author query and displays a confirmed reference',async()=>{render(<MemoryRouter><Contact/></MemoryRouter>);fill();fireEvent.click(screen.getByText('Send support request'));await screen.findByText('Your request has been saved');expect(mocks.insert).toHaveBeenCalledWith(expect.objectContaining({name:'Author',email:'author@example.com',category:'writing'}));expect(screen.getByText(/^PS-/)).toBeTruthy();});
it('retains the message and reference ID for retries after a network failure',async()=>{mocks.insert.mockResolvedValueOnce({error:{code:'NETWORK'}});render(<MemoryRouter><Contact/></MemoryRouter>);fill();fireEvent.click(screen.getByText('Send support request'));await screen.findByRole('alert');expect((screen.getByLabelText('How can we help? *') as HTMLTextAreaElement).value).toBe(input.message);fireEvent.click(screen.getByText('Send support request'));await screen.findByText('Your request has been saved');expect(mocks.insert.mock.calls[1][0].id).toBe(mocks.insert.mock.calls[0][0].id);});
it('rejects a filled spam trap and missing required query details',async()=>{await expect(submitSupportRequest({...input,website:'bot.example'})).rejects.toThrow(/empty/);await expect(submitSupportRequest({...input,category:''})).rejects.toThrow(/Check/);expect(mocks.insert).not.toHaveBeenCalled();});
it('shows a clear submission-limit error and accepts a duplicate retry confirmation',async()=>{mocks.insert.mockResolvedValueOnce({error:{code:'P0001'}});await expect(submitSupportRequest(input)).rejects.toThrow(/try again in an hour/);mocks.insert.mockResolvedValueOnce({error:{code:'23505'}});expect(await submitSupportRequest(input,'known-id')).toBe('known-id');});

it('returns signed-in authors from Contact to the dashboard',async()=>{mocks.user={id:'author'};render(<MemoryRouter initialEntries={['/contact']}><Routes><Route path="/contact" element={<Contact/>}/><Route path="/dashboard" element={<h1>Writing dashboard</h1>}/></Routes></MemoryRouter>);expect(screen.getByRole('link',{name:'PubléStudio dashboard'}).getAttribute('href')).toBe('/dashboard');fireEvent.click(screen.getByRole('link',{name:'Back to dashboard'}));await screen.findByRole('heading',{name:'Writing dashboard'});});
it('keeps the public contact return link pointed to the homepage for guests',()=>{render(<MemoryRouter><Contact/></MemoryRouter>);expect(screen.getByRole('link',{name:'Back to home'}).getAttribute('href')).toBe('/');expect(screen.getAllByRole('link',{name:'PubléStudio home'}).every(link=>link.getAttribute('href')==='/')).toBe(true);});
