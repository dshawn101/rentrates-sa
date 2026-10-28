// @vitest-environment jsdom
import { beforeEach, afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { webcrypto } from 'node:crypto';
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb';
import { MemoryRouter } from 'react-router-dom';
import { Settings } from '../src/pages/Settings';
import {AIProviders} from '../src/pages/AIProviders';
import { useIntegrationStore, waitForCredentials } from '../src/store/useIntegrationStore';
vi.mock('../src/hooks/useAuth',()=>({useAuth:()=>({user:{email:'author@example.test'},profile:{tier:'free'},signOut:vi.fn()})}));
beforeEach(async()=>{vi.stubGlobal('indexedDB',new IDBFactory());vi.stubGlobal('IDBKeyRange',IDBKeyRange);vi.stubGlobal('crypto',webcrypto);localStorage.clear();useIntegrationStore.getState().configureOwner(null);useIntegrationStore.getState().configureOwner('author');await waitForCredentials();});
afterEach(cleanup);
it('shows only the three author-facing settings sections',()=>{
  render(<MemoryRouter initialEntries={['/settings']}><Settings/></MemoryRouter>);
  expect(screen.getByRole('navigation',{name:'Settings sections'}).querySelectorAll('button')).toHaveLength(3);
  expect(screen.queryByRole('searchbox')).toBeNull();
  expect(screen.queryByText('No matching section.')).toBeNull();
  expect(screen.queryByRole('button',{name:/Advanced tools/})).toBeNull();
  expect(screen.getByRole('region',{name:'Account'})).toBeTruthy();
  expect(screen.queryByText('Remote MCP tools')).toBeNull();
});
it('saves writing defaults used by new books',()=>{
  render(<MemoryRouter initialEntries={['/settings?section=writing']}><Settings/></MemoryRouter>);
  fireEvent.change(screen.getByLabelText('Target book words'),{target:{value:'25000'}});
  fireEvent.click(screen.getByText('Save defaults'));
  expect(useIntegrationStore.getState().preferences.targetWordCount).toBe(25000);
});
it('offers imported cover workflow without asking authors to connect external tools',()=>{
  render(<MemoryRouter initialEntries={['/settings?section=design']}><Settings/></MemoryRouter>);
  expect(screen.getByText(/No API key or tool connection is needed/)).toBeTruthy();
  expect(screen.getByRole('link',{name:/Canva/})).toBeTruthy();
});
it('only allows saved BYOK providers as defaults and explains the Gemini fallback',async()=>{
  render(<MemoryRouter initialEntries={['/ai-providers']}><AIProviders/></MemoryRouter>);
  const select=screen.getByLabelText('Default AI provider') as HTMLSelectElement;
  expect(Array.from(select.options).every(option=>option.disabled)).toBe(true);
  fireEvent.change(screen.getByLabelText('Google Gemini API key'),{target:{value:'gemini-session-key'}});
  fireEvent.click(screen.getByText('Save key & model'));
  await waitFor(()=>expect(screen.getByText('Key remembered on this device. Test it to verify access.')).toBeTruthy());
  expect(select.options[0].disabled).toBe(false);
  expect(select.options[1].disabled).toBe(true);
  expect(screen.getByText(/Gemini fallback key available/)).toBeTruthy();
});
it('selects a saved provider from the default dropdown',()=>{
  const store=useIntegrationStore.getState();
  store.saveProvider('openai','gpt-4.1-mini','openai-session-key');
  render(<MemoryRouter initialEntries={['/ai-providers']}><AIProviders/></MemoryRouter>);
  fireEvent.change(screen.getByLabelText('Default AI provider'),{target:{value:'openai'}});
  expect(useIntegrationStore.getState().provider).toBe('openai');
  expect(screen.getByText('Default AI provider updated.')).toBeTruthy();
});
it('offers direct Anthropic and xAI connections and a configurable Other endpoint',async()=>{
 render(<MemoryRouter initialEntries={['/ai-providers']}><AIProviders/></MemoryRouter>);
 fireEvent.click(screen.getByRole('button',{name:/Anthropic.*Use Claude/}));
 expect(screen.getByLabelText('Anthropic API key')).toBeTruthy();
 fireEvent.click(screen.getByRole('button',{name:/xAI.*Write with Grok/}));
 expect(screen.getByLabelText('xAI API key')).toBeTruthy();
 fireEvent.click(screen.getByRole('button',{name:/Other.*Connect a public/}));
 fireEvent.change(screen.getByLabelText('API base URL'),{target:{value:'https://api.example.com/v1'}});
 fireEvent.change(screen.getByLabelText('Other API key'),{target:{value:'other-secret'}});
 fireEvent.change(screen.getByLabelText('Model ID'),{target:{value:'my-model'}});
 fireEvent.click(screen.getByText('Save key & model'));
  await waitFor(()=>expect(screen.getByText('Key remembered on this device. Test it to verify access.')).toBeTruthy());
 expect(useIntegrationStore.getState().providers.other.baseUrl).toBe('https://api.example.com/v1');
 fireEvent.change(screen.getByLabelText('API base URL'),{target:{value:'https://another.example.com/v1'}});
 expect((screen.getByLabelText('Other API key') as HTMLInputElement).value).toBe('');
});

it('keeps Account, Writing Defaults and Design Tools together without a provider section',()=>{
 render(<MemoryRouter initialEntries={['/profile']}><Settings/></MemoryRouter>);
 const nav=screen.getByRole('navigation',{name:'Settings sections'});
 const account=within(nav).getByRole('button',{name:/Account.*Your profile/});
 expect(account.getAttribute('aria-current')).toBe('page');
 expect(within(nav).queryByRole('button',{name:/AI Providers/})).toBeNull();
 fireEvent.click(within(nav).getByRole('button',{name:/Writing Defaults/}));
 expect(screen.getByLabelText('Target book words')).toBeTruthy();
 fireEvent.click(account);
 expect(screen.getByLabelText('Display name')).toBeTruthy();
 expect(screen.getByRole('link',{name:'Plan & payments'}).getAttribute('href')).toBe('/billing');
});

it('keeps the section menu outside the scrolling panel and resets the panel when changing sections',()=>{
 render(<MemoryRouter initialEntries={['/settings?section=account']}><Settings/></MemoryRouter>);
 const nav=screen.getByRole('navigation',{name:'Settings sections'});
 const panel=screen.getByRole('region',{name:'Account'});
 expect(panel.contains(nav)).toBe(false);
 panel.scrollTop=650;
 fireEvent.scroll(panel);
 expect(within(nav).getAllByRole('button')).toHaveLength(3);
 fireEvent.click(within(nav).getByRole('button',{name:/Writing Defaults/}));
 expect(screen.getByRole('region',{name:'Writing Defaults'})).toBe(panel);
 expect(panel.scrollTop).toBe(0);
 expect(within(nav).getAllByRole('button')).toHaveLength(3);
});
