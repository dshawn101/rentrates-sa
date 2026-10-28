import type {IncomingMessage,ServerResponse} from 'node:http';
import {paymentConfig,PayPalService} from '../server/paypal-core.js';
export const config={maxDuration:120};
let readinessCache:{key:string;expires:number;ready:boolean;message?:string}|null=null;
export default async function handler(req:IncomingMessage&{body?:unknown;query?:Record<string,string>},res:ServerResponse){
 res.setHeader('Cache-Control','no-store');res.setHeader('Content-Type','application/json');const reply=(status:number,body:object)=>{res.statusCode=status;res.end(JSON.stringify(body));};
 const c=paymentConfig(process.env,false),enabled=process.env.PAYPAL_CHECKOUT_ENABLED==='true';
 if(req.method==='GET'){
  let ready=false,message:string|undefined;
  if(c){
   const key=[c.environment,c.planId,c.clientId,c.supabaseUrl].join('|');
   if(readinessCache?.key===key&&readinessCache.expires>Date.now()){ready=readinessCache.ready;message=readinessCache.message;}
   else{try{ready=await new PayPalService(c).readiness();}catch(error){ready=false;message=error instanceof Error?error.message:'Checkout verification failed.';}readinessCache={key,ready,message,expires:Date.now()+(ready?300000:30000)};}
  }
  return reply(200,{available:ready&&enabled,checkoutReady:ready,managementAvailable:!!c,environment:c?.environment||null,priceUSD:9,...(c&&!ready?{message:message||'Checkout verification failed.'}:{})});
 }
 if(req.method!=='POST'){res.setHeader('Allow','GET, POST');return reply(405,{error:'Use GET or POST.'});}
 if(!c)return reply(503,{error:'PayPal checkout is not available yet. Free beta access remains open.'});
 let body:any;try{let raw='';if(req.body!==undefined){raw=typeof req.body==='string'?req.body:JSON.stringify(req.body);}else for await(const chunk of req){raw+=chunk;if(raw.length>100000)return reply(413,{error:'Request too large.'});}if(raw.length>100000)return reply(413,{error:'Request too large.'});body=JSON.parse(raw);}catch{return reply(400,{error:'Invalid request.'});}
 const service=new PayPalService(c);const webhook=req.query?.action==='webhook'||new URL(req.url||'/',c.origin).searchParams.get('action')==='webhook';
 if(webhook){try{return reply(200,await service.webhook(body,req.headers));}catch{return reply(503,{error:'Webhook was not processed. Retry delivery.'});}}
 let user:string;try{user=await service.authenticate(req.headers.authorization);}catch{return reply(401,{error:'Sign in to manage billing.'});}
 if(req.headers.origin!==c.origin)return reply(403,{error:'Open billing on the main PubléStudio website.'});
 try{if(body.action==='checkout'&&!enabled)return reply(503,{error:'New checkout is not available yet.'});if(body.action==='checkout'&&body.acceptTerms===true)return reply(200,await service.start(user));if(body.action==='status')return reply(200,await service.status(user));if(body.action==='refresh')return reply(200,await service.status(user,true));if(body.action==='cancel'&&body.confirmCancel===true)return reply(200,await service.cancel(user));return reply(400,{error:'Choose a valid billing action and confirm the terms.'});}catch{return reply(502,{error:'PayPal could not complete this request. Refresh billing before retrying. If it continues, contact support; do not create a second subscription.'});}
}
