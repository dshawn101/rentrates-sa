import {supabase} from './supabase';
import type {ReviewFinding} from './book-review';

export async function requestPlatformReview(bookId:string,fingerprint:string){
 const {data:{session}}=await supabase.auth.getSession();
 if(!session)throw new Error('Sign in before reviewing.');
 const response=await fetch('/api/manuscript-review',{
  method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+session.access_token},
  body:JSON.stringify({bookId,fingerprint,consent:true}),
 });
 const data=await response.json().catch(()=>null);
 if(!response.ok||!Array.isArray(data?.findings))throw new Error(data?.error||'Platform review is unavailable. You can choose to use your own key instead.');
 return data.findings as ReviewFinding[];
}
