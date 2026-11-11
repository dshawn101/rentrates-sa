const DB='puble-book-two-key-v1',STORE='keys',ID='openrouter';
type EncryptedRecord={id:string;key:CryptoKey;iv:Uint8Array<ArrayBuffer>;ciphertext:ArrayBuffer};
export function supportsSecureKeys(){return !!globalThis.crypto?.subtle&&!!globalThis.indexedDB;}
async function access<T>(mode:IDBTransactionMode,action:(store:IDBObjectStore)=>IDBRequest<T>):Promise<T>{
 if(!supportsSecureKeys())throw new Error('This browser does not support secure key storage. Use a current browser over HTTPS.');
 const db=await new Promise<IDBDatabase>((resolve,reject)=>{const r=indexedDB.open(DB,1);r.onupgradeneeded=()=>r.result.createObjectStore(STORE,{keyPath:'id'});r.onsuccess=()=>resolve(r.result);r.onerror=r.onblocked=()=>reject(new Error('Encrypted storage is unavailable. Close other tool tabs or allow site storage, then retry.'));});
 return new Promise((resolve,reject)=>{let result:T;const tx=db.transaction(STORE,mode);try{const r=action(tx.objectStore(STORE));r.onsuccess=()=>{result=r.result;};}catch{db.close();reject(new Error('Encrypted key storage failed.'));return;}tx.oncomplete=()=>{db.close();resolve(result);};tx.onerror=tx.onabort=()=>{db.close();reject(new Error('Encrypted key storage failed. Your key was not saved.'));};});
}
export async function saveOpenRouterKey(secret:string){
 if(!supportsSecureKeys())throw new Error('Secure key storage is unavailable in this browser.');
 const value=secret.trim();if(!value||value.length>2048||/\s/.test(value))throw new Error('Paste a valid OpenRouter API key without spaces.');
 const key=await crypto.subtle.generateKey({name:'AES-GCM',length:256},false,['encrypt','decrypt']);const iv=crypto.getRandomValues(new Uint8Array(12));const ciphertext=await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:new TextEncoder().encode(ID)},key,new TextEncoder().encode(value));
 await access('readwrite',store=>store.put({id:ID,key,iv,ciphertext} satisfies EncryptedRecord));
}
export async function hasOpenRouterKey(){return !!await access('readonly',store=>store.getKey(ID));}
export async function readOpenRouterKey(){const r=await access<EncryptedRecord|undefined>('readonly',store=>store.get(ID));if(!r)throw new Error('Save your OpenRouter key first.');try{const data=await crypto.subtle.decrypt({name:'AES-GCM',iv:r.iv,additionalData:new TextEncoder().encode(ID)},r.key,r.ciphertext);return new TextDecoder().decode(data);}catch{throw new Error('The saved key could not be decrypted. Forget it and save it again.');}}
export async function forgetOpenRouterKey(){await access('readwrite',store=>store.delete(ID));}
