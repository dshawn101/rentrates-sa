// @vitest-environment jsdom
import { beforeEach, expect, it, vi } from 'vitest';
import { webcrypto } from 'node:crypto';
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb';
import { readCredential, useIntegrationStore, waitForCredentials } from '../src/store/useIntegrationStore';
async function owner(id:string|null) {useIntegrationStore.getState().configureOwner(id);await waitForCredentials();}
beforeEach(async()=>{
 vi.stubGlobal('indexedDB',new IDBFactory());vi.stubGlobal('IDBKeyRange',IDBKeyRange);vi.stubGlobal('crypto',webcrypto);
 localStorage.clear();await owner(null);await owner('author-a');
});
it('restores remembered keys after sign-out without loading them into a different account',async()=>{
 const store=useIntegrationStore.getState();store.saveProvider('openai','model','my-secret-provider-key');
 await store.rememberProvider('openai',true);
 expect(localStorage.getItem('puble:integrations:author-a')).not.toContain('my-secret-provider-key');
 await owner(null);expect(readCredential('openai')).toBe('');
 await owner('author-b');expect(readCredential('openai')).toBe('');
 await owner('author-a');expect(readCredential('openai')).toBe('my-secret-provider-key');
 expect(useIntegrationStore.getState().providers.openai.remembered).toBe(true);
});
it('stores encrypted bytes and a non-extractable CryptoKey, never a plain API key record',async()=>{
 useIntegrationStore.getState().saveProvider('openai','model','my-secret-provider-key');
 await useIntegrationStore.getState().rememberProvider('openai',true);
 const records=await new Promise<any[]>((resolve,reject)=>{const r=indexedDB.open('puble-provider-keys-v1');r.onsuccess=()=>{const db=r.result;const q=db.transaction('keys').objectStore('keys').getAll();q.onsuccess=()=>{resolve(q.result);db.close();};q.onerror=()=>reject(q.error);};});
 expect(records).toHaveLength(1);expect(records[0].key.extractable).toBe(false);
 expect(JSON.stringify(records)).not.toContain('my-secret-provider-key');
 expect(new TextDecoder().decode(records[0].ciphertext)).not.toContain('my-secret-provider-key');
});
it('honours session-only use and removes an older remembered copy',async()=>{
 const store=useIntegrationStore.getState();store.saveProvider('openai','model','old-key');await store.rememberProvider('openai',true);
 store.saveProvider('openai','model','session-key');await store.rememberProvider('openai',false);
 expect(readCredential('openai')).toBe('session-key');
 await owner(null);await owner('author-a');expect(readCredential('openai')).toBe('');
 expect(useIntegrationStore.getState().providers.openai.remembered).toBe(false);
});
it('forgets a key only on explicit request, not after repeated failures',async()=>{
 const store=useIntegrationStore.getState();store.saveProvider('anthropic','model','saved-key');await store.rememberProvider('anthropic',true);
 for(let i=0;i<8;i++)store.recordProviderResult('anthropic',false);
 expect(useIntegrationStore.getState().providers.anthropic.failures).toBe(3);
 expect(readCredential('anthropic')).toBe('saved-key');
 await owner(null);await owner('author-a');expect(readCredential('anthropic')).toBe('saved-key');
 useIntegrationStore.getState().recordProviderResult('anthropic',true);expect(useIntegrationStore.getState().providers.anthropic.failures).toBe(0);
 await useIntegrationStore.getState().forgetProvider('anthropic');expect(readCredential('anthropic')).toBe('');
 await owner(null);await owner('author-a');expect(readCredential('anthropic')).toBe('');
});
it('does not restore an Other key to a changed endpoint',async()=>{
 const store=useIntegrationStore.getState();store.saveProvider('other','model','saved-key','https://api.example.com/v1');await store.rememberProvider('other',true);
 const data=JSON.parse(localStorage.getItem('puble:integrations:author-a')!);data.providers.other.baseUrl='https://another.example.com/v1';localStorage.setItem('puble:integrations:author-a',JSON.stringify(data));
 await owner(null);await owner('author-a');expect(readCredential('other')).toBe('');
});
