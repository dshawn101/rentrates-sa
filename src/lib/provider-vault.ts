// Remembered provider keys stay on this device, never in the application database.
// Non-extractable AES keys prevent raw-key export; same-origin scripts can still
// use them. This is not a password-protected vault or an XSS defence.
export interface SavedProviderKey { owner:string; provider:string; endpoint:string; secret:string }
interface EncryptedKey { owner:string; provider:string; endpoint:string; key:CryptoKey; iv:Uint8Array<ArrayBuffer>; ciphertext:ArrayBuffer }
const database='puble-provider-keys-v1';
function open():Promise<IDBDatabase> {
  return new Promise((resolve,reject)=>{
    if (!globalThis.indexedDB || !crypto.subtle) return reject(new Error('This browser cannot remember encrypted keys. Use a supported browser or save for this session only.'));
    const request=indexedDB.open(database,1);
    request.onupgradeneeded=()=>request.result.createObjectStore('keys',{keyPath:['owner','provider']});
    request.onsuccess=()=>resolve(request.result);
    request.onerror=()=>reject(new Error('Encrypted key storage is unavailable. Your key is still available for this session.'));
    request.onblocked=()=>reject(new Error('Close other PubléStudio tabs and try saving the key again.'));
  });
}
async function access<T>(mode:IDBTransactionMode,operation:(store:IDBObjectStore)=>IDBRequest<T>):Promise<T> {
 const db=await open();
 return new Promise((resolve,reject)=>{
   let result:T;
   const transaction=db.transaction('keys',mode);
   let request:IDBRequest<T>;
   try { request=operation(transaction.objectStore('keys')); } catch { db.close();reject(new Error('This browser could not save the encrypted key. Your key remains available for this session.'));return; }
   request.onsuccess=()=>{result=request.result;};
   transaction.oncomplete=()=>{db.close();resolve(result);};
   transaction.onerror=transaction.onabort=()=>{db.close();reject(new Error('Could not update encrypted key storage. Please try again.'));};
 });
}
function context(owner:string,provider:string,endpoint:string){return new TextEncoder().encode(JSON.stringify([owner,provider,endpoint]));}
export async function rememberProviderKey(owner:string,provider:string,secret:string,endpoint='') {
 const key=await crypto.subtle.generateKey({name:'AES-GCM',length:256},false,['encrypt','decrypt']);
 const iv=crypto.getRandomValues(new Uint8Array(12));
 const ciphertext=await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:context(owner,provider,endpoint)},key,new TextEncoder().encode(secret));
 await access('readwrite',store=>store.put({owner,provider,endpoint,key,iv,ciphertext} satisfies EncryptedKey));
}
export async function forgetProviderKey(owner:string,provider:string) {
 await access('readwrite',store=>store.delete([owner,provider]));
}
export async function loadProviderKeys(owner:string):Promise<SavedProviderKey[]> {
 if (!globalThis.indexedDB) return [];
 const records=await access<EncryptedKey[]>('readonly',store=>store.getAll(IDBKeyRange.bound([owner,''],[owner,'\uffff'])));
 const result:SavedProviderKey[]=[];
 for(const record of records){
   if(record.owner!==owner) continue;
   try {
     const plaintext=await crypto.subtle.decrypt({name:'AES-GCM',iv:record.iv,additionalData:context(owner,record.provider,record.endpoint)},record.key,record.ciphertext);
     result.push({owner,provider:record.provider,endpoint:record.endpoint,secret:new TextDecoder().decode(plaintext)});
   } catch { throw new Error('A remembered key could not be opened on this device. It has not been deleted. Re-save it in AI Providers to repair it.'); }
 }
 return result;
}
