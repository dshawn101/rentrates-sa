import {randomUUID} from 'node:crypto';
export type PayPalConfig={environment:'sandbox'|'live';clientId:string;secret:string;planId:string;webhookId:string;origin:string;supabaseUrl:string;adminKey:string;anonKey:string};
export function paymentConfig(env:NodeJS.ProcessEnv=process.env,requireEnabled=true):PayPalConfig|null{
 if((requireEnabled&&env.PAYPAL_CHECKOUT_ENABLED!=='true')||!['sandbox','live'].includes(env.PAYPAL_ENVIRONMENT||''))return null;
 const planId=(env.PAYPAL_LITE_PLAN_ID||env.PAYPAL_PLAN_ID||'').trim();
 const required=['PAYPAL_CLIENT_ID','PAYPAL_CLIENT_SECRET','PAYPAL_WEBHOOK_ID','APP_ORIGIN','VITE_SUPABASE_URL','SUPABASE_SECRET_KEY','VITE_SUPABASE_ANON_KEY'];
 if(!planId||required.some(k=>!env[k]?.trim()))return null;
 try{const u=new URL(env.APP_ORIGIN!);if(u.protocol!=='https:'||u.username||u.password||u.pathname!=='/'||u.search||u.hash)return null;}catch{return null;}
 return {environment:env.PAYPAL_ENVIRONMENT as 'sandbox'|'live',clientId:env.PAYPAL_CLIENT_ID!,secret:env.PAYPAL_CLIENT_SECRET!,planId,webhookId:env.PAYPAL_WEBHOOK_ID!,origin:new URL(env.APP_ORIGIN!).origin,supabaseUrl:env.VITE_SUPABASE_URL!.replace(/\/$/,''),adminKey:env.SUPABASE_SECRET_KEY!,anonKey:env.VITE_SUPABASE_ANON_KEY!};
}
export function validateLitePlan(p:any){
 const c=p.billing_cycles;
 if(p.status!=='ACTIVE'||p.quantity_supported===true||!Array.isArray(c)||c.length!==1||c[0].tenure_type!=='REGULAR'||c[0].frequency?.interval_unit!=='MONTH'||c[0].frequency?.interval_count!==1||c[0].total_cycles!==0||c[0].pricing_scheme?.fixed_price?.currency_code!=='USD'||Number(c[0].pricing_scheme.fixed_price.value)!==9||Number(p.payment_preferences?.setup_fee?.value||0)!==0||Number(p.taxes?.percentage||0)!==0)throw new Error('The Lite plan must be active at exactly USD 9 per month, without trials, setup fees or additional tax.');
}
export function approvalURL(links:any,environment:string){
 const href=Array.isArray(links)?links.find((l:any)=>l.rel==='approve')?.href:null;
 if(typeof href!=='string')return null;const u=new URL(href);const host=environment==='live'?'www.paypal.com':'www.sandbox.paypal.com';
 if(u.protocol!=='https:'||u.hostname!==host||u.port||u.username||u.password)throw new Error('Invalid PayPal approval destination.');return u.href;
}
export function paidMonthEnd(value:string){const d=new Date(value);if(!Number.isFinite(d.getTime())||d.getTime()>Date.now()+300000)throw new Error('Invalid payment date.');const day=d.getUTCDate();d.setUTCDate(1);d.setUTCMonth(d.getUTCMonth()+1);const last=new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth()+1,0)).getUTCDate();d.setUTCDate(Math.min(day,last));return d.toISOString();}
export function paymentEvent(e:any){
 const r=e.resource||{};const type=e.event_type;let saleId:string|null=null,paidUntil:string|null=null,paidAt:string|null=null,refunded=false;
 if(type==='PAYMENT.SALE.COMPLETED'){
  if(r.state!=='completed'||r.amount?.currency!=='USD'||Number(r.amount?.total)!==9)throw new Error('Unexpected subscription payment.');saleId=r.id;paidAt=r.create_time;paidUntil=paidMonthEnd(paidAt!);
 }else if(type==='PAYMENT.SALE.REFUNDED'||type==='PAYMENT.SALE.REVERSED'){
  saleId=r.sale_id||(type==='PAYMENT.SALE.REVERSED'?r.id:null);refunded=true;
  if(!saleId)throw new Error('Refund needs a sale identifier.');
 }
 if(saleId&&!/^[A-Za-z0-9-]{3,80}$/.test(saleId))throw new Error('Invalid sale identifier.');
 return {saleId,paidUntil,paidAt,refunded,subscriptionId:type?.startsWith('BILLING.SUBSCRIPTION.')?r.id:r.billing_agreement_id||null};
}
export class PayPalService{
 readonly config:PayPalConfig;readonly request:typeof fetch;
 constructor(config:PayPalConfig,request:typeof fetch=fetch){this.config=config;this.request=request;}
 private async json(url:string,init:RequestInit):Promise<any>{const r=await this.request(url,{...init,redirect:'error',signal:AbortSignal.timeout(20000)});if(!r.ok)throw new Error('Payment service request failed.');return r.status===204?null:r.json();}
 async db(path:string,body?:unknown,method=body===undefined?'GET':'POST'){
  // New secret keys go in apikey, never a browser bundle or a JWT bearer header.
  return this.json(`${this.config.supabaseUrl}/rest/v1/${path}`,{method,headers:{apikey:this.config.adminKey,...(!this.config.adminKey.startsWith('sb_secret_')?{Authorization:`Bearer ${this.config.adminKey}`} : {}),'Content-Type':'application/json',Prefer:'return=representation'},...(body!==undefined?{body:JSON.stringify(body)}:{})});
 }
 async readiness(){let token:string;try{token=await this.token();}catch{throw new Error('PayPal app credentials could not be verified.');}let plan;try{plan=await this.paypal(`/v1/billing/plans/${encodeURIComponent(this.config.planId)}`,token);}catch{throw new Error('The PayPal plan could not be found in this environment.');}validateLitePlan(plan);try{await this.db('paypal_subscriptions?select=id&limit=0');await this.db('paypal_payments?select=sale_id&limit=0');}catch{throw new Error('Billing database access could not be verified.');}return true;}
 async token(){const b=Buffer.from(`${this.config.clientId}:${this.config.secret}`).toString('base64');const r=await this.json(`${this.base}/v1/oauth2/token`,{method:'POST',headers:{Authorization:`Basic ${b}`,'Content-Type':'application/x-www-form-urlencoded'},body:'grant_type=client_credentials'});if(!r?.access_token)throw new Error('PayPal authentication failed.');return r.access_token as string;}
 get base(){return this.config.environment==='live'?'https://api-m.paypal.com':'https://api-m.sandbox.paypal.com';}
 async paypal(path:string,token:string,body?:unknown,requestId?:string){return this.json(`${this.base}${path}`,{method:body===undefined?'GET':'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json',...(requestId?{'PayPal-Request-Id':requestId}:{}),Prefer:'return=representation'},...(body!==undefined?{body:JSON.stringify(body)}:{})});}
 async authenticate(authorization:string|undefined){if(!authorization?.startsWith('Bearer '))throw new Error('Sign in to manage billing.');const r=await this.request(`${this.config.supabaseUrl}/auth/v1/user`,{headers:{apikey:this.config.anonKey,Authorization:authorization},redirect:'error',signal:AbortSignal.timeout(15000)});if(!r.ok)throw new Error('Sign in to manage billing.');const u:any=await r.json();if(typeof u.id!=='string')throw new Error('Sign in to manage billing.');return u.id as string;}
 async rows(user:string){return this.db(`paypal_subscriptions?user_id=eq.${encodeURIComponent(user)}&environment=eq.${this.config.environment}&order=created_at.desc`);}
 async sync(row:any,token:string){if(!row.paypal_id)return row;const remote=await this.paypal(`/v1/billing/subscriptions/${encodeURIComponent(row.paypal_id)}`,token);if(remote.plan_id!==row.plan_id||remote.custom_id!==row.id||remote.plan_overridden===true)throw new Error('Subscription verification failed.');
  const statuses=['APPROVAL_PENDING','APPROVED','ACTIVE','SUSPENDED','CANCELLED','EXPIRED'];if(!statuses.includes(remote.status))throw new Error('Unknown subscription state.');
  await this.db('rpc/paypal_update_snapshot',{p_id:row.id,p_status:remote.status,p_updated:remote.status_update_time||remote.update_time||remote.create_time});return {...row,status:remote.status};
 }
 async start(user:string){const token=await this.token();validateLitePlan(await this.paypal(`/v1/billing/plans/${encodeURIComponent(this.config.planId)}`,token));
  const row=await this.db('rpc/paypal_reserve_checkout',{p_user:user,p_environment:this.config.environment,p_plan:this.config.planId});
  if(row.paypal_id){const current=await this.sync(row,token);if(!['APPROVAL_PENDING','APPROVED'].includes(current.status))throw new Error('You already have a subscription. Refresh billing before starting another.');return {approvalUrl:approvalURL([{rel:'approve',href:row.approval_url}],this.config.environment)};}
  if(Date.now()-new Date(row.created_at).getTime()>70*3600000)throw new Error('This checkout needs support reconciliation before retrying.');
  const remote=await this.paypal('/v1/billing/subscriptions',token,{plan_id:this.config.planId,custom_id:row.id,quantity:'1',application_context:{brand_name:'PubléStudio',shipping_preference:'NO_SHIPPING',user_action:'SUBSCRIBE_NOW',return_url:`${this.config.origin}/billing?paypal=returned`,cancel_url:`${this.config.origin}/billing?paypal=cancelled`}},row.id);
  if(!/^I-[A-Z0-9]+$/.test(remote.id))throw new Error('Invalid subscription identifier.');const url=approvalURL(remote.links,this.config.environment);if(!url)throw new Error('PayPal did not provide approval.');
  await this.db(`paypal_subscriptions?id=eq.${row.id}`,{paypal_id:remote.id,approval_url:url,status:remote.status},'PATCH');return {approvalUrl:url};
 }
 async status(user:string,refresh=false){let rows=await this.rows(user);if(refresh){const token=await this.token();for(const r of rows.slice(0,3))await this.sync(r,token);rows=await this.rows(user);}
  const paid=await this.db(`paypal_payments?subscription_id=in.(${rows.map((r:any)=>r.id).join(',')||'00000000-0000-0000-0000-000000000000'})&refunded=eq.false&order=paid_until.desc&limit=1`);
  const current=rows[0];const livePaid=await this.db('rpc/paypal_has_lite',{p_user:user});return {tier:livePaid?'lite':'free',environment:this.config.environment,subscription:current?{status:current.status,paidUntil:paid[0]?.paid_until||null}:null};
 }
 async cancel(user:string){const rows=await this.rows(user);const row=rows[0];if(!row?.paypal_id)throw new Error('No subscription to cancel.');const token=await this.token();const current=await this.sync(row,token);if(current.status!=='CANCELLED'&&current.status!=='EXPIRED')await this.paypal(`/v1/billing/subscriptions/${encodeURIComponent(row.paypal_id)}/cancel`,token,{reason:'Author cancelled renewal in PubléStudio.'},randomUUID());await this.sync(row,token);return this.status(user);}
 async webhook(event:any,headers:Record<string,string|string[]|undefined>){
  const token=await this.token();const header=(n:string)=>{const v=headers[n];if(typeof v!=='string'||!v||v.length>2000)throw new Error('Missing webhook signature.');return v;};
  const verification=await this.paypal('/v1/notifications/verify-webhook-signature',token,{auth_algo:header('paypal-auth-algo'),cert_url:header('paypal-cert-url'),transmission_id:header('paypal-transmission-id'),transmission_sig:header('paypal-transmission-sig'),transmission_time:header('paypal-transmission-time'),webhook_id:this.config.webhookId,webhook_event:event});
  if(verification.verification_status!=='SUCCESS')throw new Error('Invalid webhook signature.');
  if(typeof event.id!=='string'||event.id.length>100)throw new Error('Invalid event.');const e=paymentEvent(event);
  if(!e.subscriptionId&&!e.refunded)return {received:true};
  let row=null;if(e.subscriptionId){const rows=await this.db(`paypal_subscriptions?paypal_id=eq.${encodeURIComponent(e.subscriptionId)}&environment=eq.${this.config.environment}`);row=rows[0];if(!row)throw new Error('Subscription mapping is not yet available.');await this.sync(row,token);}
  await this.db('rpc/paypal_record_event',{p_event:event.id,p_environment:this.config.environment,p_subscription:row?.id||null,p_sale:e.saleId,p_paid_at:e.paidAt,p_paid_until:e.paidUntil,p_refunded:e.refunded});return {received:true};
 }
}
