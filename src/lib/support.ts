import {supabase} from './supabase';
export const SUPPORT_CATEGORIES=[
 {id:'account',label:'Account, sign-in or password access',hint:'Tell us what happens when you try to sign in and include the error message.'},
 {id:'writing',label:'Writing, autosave or manuscript recovery',hint:'Describe the affected chapter, when it last saved and what you expected to see.'},
 {id:'library',label:'My Books, folders or project organisation',hint:'Tell us which book or folder is affected and the action you were taking.'},
 {id:'import-export',label:'Importing or exporting a manuscript',hint:'Include the file format, approximate file size and any error shown.'},
 {id:'covers',label:'Cover uploads or artwork',hint:'Include the image format, dimensions if known and the error shown.'},
 {id:'ai',label:'AI providers, BYOK or model setup',hint:'Include the provider, model and error message. Never include your API key.'},
 {id:'billing',label:'Plans, pricing or billing questions',hint:'Describe your question. Please do not include payment card details.'},
 {id:'bug',label:'Report a bug or technical issue',hint:'Include the steps to reproduce the issue, your browser and device.'},
 {id:'feedback',label:'Feedback or a feature suggestion',hint:'Tell us what you are trying to achieve and what would make it easier.'},
 {id:'privacy',label:'Privacy, data access or account deletion',hint:'Describe your request. Account ownership may need to be verified before changes.'},
 {id:'other',label:'Other writing-platform question',hint:'Tell us how we can help with PubléStudio.'},
] as const;
export interface SupportInput{name:string;email:string;category:string;subject:string;book_title:string;message:string;website?:string}
export async function submitSupportRequest(input:SupportInput,id:string=crypto.randomUUID()){
 if(input.website)throw new Error('Please leave the website field empty.');
 const payload={id,name:input.name.trim(),email:input.email.trim().toLowerCase(),category:input.category,subject:input.subject.trim(),book_title:input.book_title.trim(),message:input.message.trim()};
 if(!payload.name||payload.name.length>100||payload.email.length>254||!/^\S+@[^\s@]+\.[^\s@]+$/.test(payload.email)||!SUPPORT_CATEGORIES.some(c=>c.id===payload.category)||payload.subject.length<3||payload.subject.length>160||payload.book_title.length>200||payload.message.length<20||payload.message.length>5000)throw new Error('Check the form fields. Please include a subject and a message of at least 20 characters.');
 const {error}=await supabase.from('support_requests').insert(payload);
 // Reusing the ID on retries makes an uncertain network result safe to submit again.
 if(error&&error.code!=='23505')throw new Error(error.code==='P0001'?'The support form has reached its submission limit. Please try again in an hour.':'Your request could not be confirmed. Your message is still here; please retry.');
 return id;
}
