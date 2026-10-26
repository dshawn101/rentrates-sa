import {supabase} from './supabase';
export const WAITLIST_INTERESTS=[{id:'launch',label:'Product Hunt launch announcement'},{id:'free',label:'Free beta'},{id:'lite',label:'Lite · $9/month beta price'},{id:'author',label:'Author · preliminary $19/month'},{id:'pro',label:'Pro · preliminary $49/month'}] as const;
export type WaitlistInterest=typeof WAITLIST_INTERESTS[number]['id'];
export async function joinWaitlist(input:{email:string;interest:WaitlistInterest;consent:boolean;source:'landing'|'pricing';website?:string}){
 const email=input.email.trim().toLowerCase();
 if(input.website||!input.consent||email.length>254||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||!WAITLIST_INTERESTS.some(i=>i.id===input.interest))throw new Error('Enter a valid email and agree to launch notifications.');
 const {error}=await supabase.from('launch_waitlist').insert({email,interest:input.interest,source:input.source,consent:true});
 if(error)throw new Error(error.code==='P0001'?'The waitlist is busy. Please try again later.':'We could not confirm your signup. Your email remains here; please retry.');
}
