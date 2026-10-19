// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { DashboardHelper } from '../src/components/dashboard/DashboardHelper';
import { Dashboard } from '../src/pages/Dashboard';
import { useIntegrationStore } from '../src/store/useIntegrationStore';
import { useBookStore } from '../src/store/useBookStore';
import { authorFirstName } from '../src/lib/author-profile';
const { request } = vi.hoisted(()=>({request:vi.fn()}));
vi.mock('../src/lib/ai-provider',()=>({requestAI:request}));
vi.mock('../src/hooks/useAuth',()=>({useAuth:()=>({user:{id:'author',user_metadata:{display_name:'Deion Shawn'}}})}));
vi.mock('../src/components/book/BookCard',()=>({BookCard:()=>null}));
const book={id:'book',user_id:'author',title:'My Book',status:'writing' as const,tier_created:'free',metadata:{targetWordCount:1000},wordCount:250,created_at:'2026-10-01T10:00:00Z',updated_at:'2026-10-01T10:00:00Z',lastEditedChapter:{id:'chapter',title:'A beginning',updatedAt:'2026-10-19T10:00:00Z',orderIndex:0}};
beforeEach(()=>{
  localStorage.clear();useIntegrationStore.getState().configureOwner(null);useIntegrationStore.getState().configureOwner('author');
  useBookStore.setState({books:[book],isLoading:false,error:null,fetchBooks:vi.fn().mockResolvedValue(undefined)});
  request.mockReset();
});
afterEach(cleanup);
it('greets by first name and shows saved chapter progress without an AI request',()=>{
  render(<MemoryRouter><Dashboard/></MemoryRouter>);
  expect(screen.getByRole('heading',{name:'Hello, Deion'})).toBeTruthy();
  expect(screen.getByText('250 saved words of 1,000 target')).toBeTruthy();
  expect(screen.getByText('A beginning')).toBeTruthy();
  expect(screen.getByRole('progressbar').getAttribute('value')).toBe('250');
  expect(request).not.toHaveBeenCalled();
});
it('offers setup instead of sending an unconfigured helper request',()=>{
  render(<MemoryRouter><DashboardHelper book={book} firstName="Deion" unavailable={false}/></MemoryRouter>);
  expect(screen.getByRole('link',{name:/Add your OpenRouter key/})).toBeTruthy();
  expect(screen.queryByRole('button',{name:'Suggest my next step'})).toBeNull();
  expect(request).not.toHaveBeenCalled();
});
it('uses OpenRouter only on click and shares summary fields rather than manuscript or keys',async()=>{
  useIntegrationStore.getState().saveProvider('openrouter','openai/gpt-4.1-mini','router-secret');
  useIntegrationStore.getState().saveProvider('openai','primary-model','primary-key');
  useIntegrationStore.getState().selectProvider('openai');
  request.mockResolvedValue({text:'Try a short writing session on your next scene.'});
  render(<MemoryRouter><DashboardHelper book={{...book,metadata:{...book.metadata,manuscript:'PRIVATE MANUSCRIPT'}}} firstName="Deion" unavailable={false}/></MemoryRouter>);
  expect(request).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button',{name:'Suggest my next step'}));
  await screen.findByText(/Try a short writing session/);
  const [action,provider,options]=request.mock.calls[0];
  expect([action,provider]).toEqual(['generate','openrouter']);
  expect(options).toMatchObject({model:'openai/gpt-4.1-mini',maxOutputTokens:250});
  expect(options.prompt).toContain('A beginning');
  expect(options.prompt).not.toMatch(/PRIVATE MANUSCRIPT|router-secret|primary-key/);
  expect(useIntegrationStore.getState().provider).toBe('openai');
});
it('keeps saved progress usable when OpenRouter fails',async()=>{
  useIntegrationStore.getState().saveProvider('openrouter','model','router-secret');request.mockRejectedValue(new Error('Quota reached'));
  render(<MemoryRouter><DashboardHelper book={book} firstName="Deion" unavailable={false}/></MemoryRouter>);
  fireEvent.click(screen.getByRole('button',{name:'Suggest my next step'}));
  expect((await screen.findByRole('alert')).textContent).toContain('continue writing without the helper');
  expect(request).toHaveBeenCalledTimes(1);
});
it('does not guess names from email addresses',()=>{
  expect(authorFirstName(undefined)).toBe('');
  expect(authorFirstName('  Deion   Shawn ')).toBe('Deion');
  expect(authorFirstName('Élodie Martin')).toBe('Élodie');
});
it('shows loading and failure states without presenting saved progress as current',()=>{
  useBookStore.setState({isLoading:true});
  const view=render(<MemoryRouter><Dashboard/></MemoryRouter>);
  expect(screen.getByText('Checking your saved progress…')).toBeTruthy();
  expect(screen.queryByText('250 saved words of 1,000 target')).toBeNull();
  useBookStore.setState({isLoading:false,error:'Could not load your books'});
  view.rerender(<MemoryRouter><Dashboard/></MemoryRouter>);
  expect(screen.getByText('Progress unavailable')).toBeTruthy();
  expect(screen.queryByText('250 saved words of 1,000 target')).toBeNull();
});
