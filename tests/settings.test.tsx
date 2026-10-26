// @vitest-environment jsdom
import { beforeEach, afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { webcrypto } from 'node:crypto';
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb';
import { MemoryRouter } from 'react-router-dom';
import { Settings } from '../src/pages/Settings';
import { useIntegrationStore, waitForCredentials } from '../src/store/useIntegrationStore';
vi.mock('../src/hooks/useAuth',()=>({useAuth:()=>({user:{email:'author@example.test'},profile:{tier:'free'},signOut:vi.fn()})}));
beforeEach(async()=>{vi.stubGlobal('indexedDB',new IDBFactory());vi.stubGlobal('IDBKeyRange',IDBKeyRange);vi.stubGlobal('crypto',webcrypto);localStorage.clear();useIntegrationStore.getState().configureOwner(null);useIntegrationStore.getState().configureOwner('author');await waitForCredentials();});
afterEach(cleanup);
it('shows only four author-facing settings sections with advanced tools collapsed',()=>{
  render(<MemoryRouter initialEntries={['/settings']}><Settings/></MemoryRouter>);
  expect(screen.getByRole('navigation',{name:'Settings sections'}).querySelectorAll('button')).toHaveLength(4);
  expect(screen.getByRole('button',{name:/Advanced tools/}).getAttribute('aria-expanded')).toBe('false');
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
  render(<MemoryRouter initialEntries={['/settings?section=providers']}><Settings/></MemoryRouter>);
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
  render(<MemoryRouter initialEntries={['/settings?section=providers']}><Settings/></MemoryRouter>);
  fireEvent.change(screen.getByLabelText('Default AI provider'),{target:{value:'openai'}});
  expect(useIntegrationStore.getState().provider).toBe('openai');
  expect(screen.getByText('Default AI provider updated.')).toBeTruthy();
});
it('offers direct Anthropic and xAI connections and a configurable Other endpoint',async()=>{
 render(<MemoryRouter initialEntries={['/settings?section=providers']}><Settings/></MemoryRouter>);
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
