// @vitest-environment jsdom
import {webcrypto} from 'node:crypto';
import {IDBFactory} from 'fake-indexeddb';
import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import {forgetOpenRouterKey,hasOpenRouterKey,readOpenRouterKey,saveOpenRouterKey,supportsSecureKeys} from '../src/tools/book-two/key-vault';
beforeEach(()=>{vi.stubGlobal('crypto',webcrypto);vi.stubGlobal('indexedDB',new IDBFactory());});afterEach(()=>vi.unstubAllGlobals());
it('stores AES-256-GCM ciphertext with a non-extractable key, restores it and forgets the complete record',async()=>{
 await saveOpenRouterKey('synthetic-browser-only-key');expect(await hasOpenRouterKey()).toBe(true);expect(await readOpenRouterKey()).toBe('synthetic-browser-only-key');
 const records=await new Promise<any[]>((resolve,reject)=>{const r=indexedDB.open('puble-book-two-key-v1');r.onsuccess=()=>{const db=r.result;const q=db.transaction('keys').objectStore('keys').getAll();q.onsuccess=()=>{resolve(q.result);db.close();};q.onerror=()=>reject(q.error);};});
 expect(records).toHaveLength(1);expect(records[0].key.extractable).toBe(false);expect(records[0].key.algorithm).toMatchObject({name:'AES-GCM',length:256});expect(new TextDecoder().decode(records[0].ciphertext)).not.toContain('synthetic-browser-only-key');expect(JSON.stringify(records)).not.toContain('synthetic-browser-only-key');expect(localStorage.length).toBe(0);await forgetOpenRouterKey();expect(await hasOpenRouterKey()).toBe(false);await expect(readOpenRouterKey()).rejects.toThrow(/Save/);
});
it('disables secure storage when crypto.subtle is missing',async()=>{vi.stubGlobal('crypto',{});expect(supportsSecureKeys()).toBe(false);await expect(saveOpenRouterKey('fake')).rejects.toThrow(/unavailable/);});
