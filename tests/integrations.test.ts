// @vitest-environment jsdom
import { beforeEach, expect, it } from 'vitest';
import { useIntegrationStore, readCredential } from '../src/store/useIntegrationStore';
import { validateMCPUrl } from '../src/lib/mcp-client';
beforeEach(() => { useIntegrationStore.getState().configureOwner(null); localStorage.clear(); });
it('keeps API keys out of persisted settings and isolates them by account', () => {
  const store = useIntegrationStore.getState(); store.configureOwner('author-one');
  store.saveProvider('openai', 'gpt-4.1-mini', 'sk-test-secret-key');
  store.selectProvider('openai');
  expect(readCredential('openai')).toBe('sk-test-secret-key');
  expect(localStorage.getItem('puble:integrations:author-one')).not.toContain('sk-test-secret-key');
  store.configureOwner('author-two'); expect(readCredential('openai')).toBe('');
  expect(useIntegrationStore.getState().provider).toBe('gemini');
  store.configureOwner('author-one'); expect(useIntegrationStore.getState().provider).toBe('openai');
  expect(readCredential('openai')).toBe('');
});
it('never presents a saved or changed key as verified without a test', () => {
  const store = useIntegrationStore.getState(); store.configureOwner('author');
  store.saveProvider('gemini', 'gemini-3.8-flash', 'test-key-123');
  expect(useIntegrationStore.getState().providers.gemini.testedAt).toBeUndefined();
  store.markTested('gemini', ['gemini-3.8-flash']);
  expect(useIntegrationStore.getState().providers.gemini.testedAt).toBeTruthy();
  store.saveProvider('gemini', 'other-model', 'test-key-456');
  expect(useIntegrationStore.getState().providers.gemini.testedAt).toBeUndefined();
});
it('does not persist MCP tokens or accept local or credential-bearing MCP endpoints', () => {
  const store = useIntegrationStore.getState(); store.configureOwner('author');
  store.saveServer({ id: 'one', name: 'Design', url: 'https://tools.example/mcp', enabled: true }, 'oauth-token-123');
  expect(readCredential('mcp:one')).toBe('oauth-token-123');
  expect(localStorage.getItem('puble:integrations:author')).not.toContain('oauth-token-123');
  expect(validateMCPUrl('https://tools.example/mcp')).toBe('https://tools.example/mcp');
  for (const url of ['http://localhost:3000', 'https://127.0.0.1/mcp', 'https://name:secret@tools.example/mcp', 'https://tools.example/mcp?token=secret']) expect(() => validateMCPUrl(url)).toThrow();
});
it('restores Other endpoint preferences without keeping its key after sign-out',()=>{
  const store=useIntegrationStore.getState();store.configureOwner('author');
  store.saveProvider('other','model-id','other-secret','https://api.example.com/v1/');store.selectProvider('other');
  expect(localStorage.getItem('puble:integrations:author')).not.toContain('other-secret');
  store.configureOwner(null);store.configureOwner('author');
  expect(useIntegrationStore.getState().providers.other).toMatchObject({model:'model-id',baseUrl:'https://api.example.com/v1'});
  expect(readCredential('other')).toBe('');
});
