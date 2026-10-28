import {supabase} from './supabase';
export type BillingAvailability={available:boolean;managementAvailable?:boolean;environment:'sandbox'|'live'|null;priceUSD:number};
export type BillingStatus={tier:'free'|'lite';environment:'sandbox'|'live';subscription:{status:string;paidUntil:string|null}|null};
export async function billingAvailability():Promise<BillingAvailability>{const r=await fetch('/api/paypal');if(!r.ok)throw new Error('Billing availability could not be checked.');return r.json();}
export async function billingAction(action:'status'|'refresh'|'checkout'|'cancel',extra:object={}):Promise<BillingStatus&{approvalUrl?:string}>{const {data:{session}}=await supabase.auth.getSession();if(!session)throw new Error('Sign in to manage billing.');const r=await fetch('/api/paypal',{method:'POST',headers:{Authorization:`Bearer ${session.access_token}`,'Content-Type':'application/json'},body:JSON.stringify({action,...extra})});const data=await r.json();if(!r.ok)throw new Error(data.error||'Billing request failed.');return data;}
export async function pdfExportTier(legacyTier='free'){
 // Refresh entitlement at download time. Browser PDF generation is a presentation feature, not DRM.
 if(legacyTier==='express'||legacyTier==='craft')return legacyTier;
 try{const {data,error}=await supabase.rpc('paypal_has_lite');return !error&&data===true?'lite':'free';}catch{return 'free';}
}
