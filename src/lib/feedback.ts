import {submitSupportRequest} from './support';
export const FEEDBACK_TYPES=[{id:'bug',label:'Bug'},{id:'feature',label:'Feature'},{id:'general',label:'General Feedback'}] as const;
export type FeedbackType=typeof FEEDBACK_TYPES[number]['id'];
export async function submitFeedback(input:{name:string;email:string;type:FeedbackType;message:string;rating:number;page:string;website?:string},id:string){
 if(!FEEDBACK_TYPES.some(t=>t.id===input.type)||!Number.isInteger(input.rating)||input.rating<0||input.rating>5||input.message.trim().length<20||input.message.trim().length>4500)throw new Error('Choose a feedback type and write a message between 20 and 4,500 characters. Rating is optional.');
 const label=FEEDBACK_TYPES.find(t=>t.id===input.type)!.label;
 return submitSupportRequest({name:input.name,email:input.email,category:input.type==='bug'?'bug':'feedback',subject:`${label} · PubléStudio`,book_title:'',message:`Type: ${label}\nExperience: ${input.rating?`${input.rating}/5`:'Not rated'}\nPage: ${input.page.slice(0,200)}\n\n${input.message.trim()}`,website:input.website},id);
}
