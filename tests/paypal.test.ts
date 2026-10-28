import {expect,it,vi} from 'vitest';
import {paymentConfig,validateLitePlan,approvalURL,paidMonthEnd,paymentEvent,PayPalService,type PayPalConfig} from '../server/paypal-core';
const c:PayPalConfig={environment:'sandbox',clientId:'client',secret:'secret',planId:'P-TEST',webhookId:'WH-TEST',origin:'https://www.publestudio.com',supabaseUrl:'https://test.supabase.co',adminKey:'sb_secret_private',anonKey:'public'};
const plan=()=>({status:'ACTIVE',billing_cycles:[{tenure_type:'REGULAR',frequency:{interval_unit:'MONTH',interval_count:1},total_cycles:0,pricing_scheme:{fixed_price:{currency_code:'USD',value:'9.00'}}}]});
const json=(value:unknown,status=200)=>new Response(JSON.stringify(value),{status});
it('keeps checkout disabled until deliberately configured; rejects unsafe origins',()=>{
 expect(paymentConfig({})).toBeNull();const env={PAYPAL_CHECKOUT_ENABLED:'true',PAYPAL_ENVIRONMENT:'sandbox',PAYPAL_CLIENT_ID:'c',PAYPAL_CLIENT_SECRET:'s',PAYPAL_LITE_PLAN_ID:'p',PAYPAL_WEBHOOK_ID:'w',APP_ORIGIN:'https://www.publestudio.com',VITE_SUPABASE_URL:c.supabaseUrl,SUPABASE_SECRET_KEY:'private',VITE_SUPABASE_ANON_KEY:'public'};
 expect(paymentConfig(env)?.environment).toBe('sandbox');expect(paymentConfig({...env,APP_ORIGIN:'https://evil.invalid/path'})).toBeNull();expect(paymentConfig({...env,PAYPAL_ENVIRONMENT:'production'})).toBeNull();
});
it('accepts only the advertised monthly USD 9 plan without trial, extra tax or setup fees',()=>{
 expect(()=>validateLitePlan(plan())).not.toThrow();for(const edit of [(p:any)=>p.billing_cycles[0].pricing_scheme.fixed_price.value='19',(p:any)=>p.billing_cycles[0].frequency.interval_unit='YEAR',(p:any)=>p.billing_cycles.push({...p.billing_cycles[0],tenure_type:'TRIAL'}),(p:any)=>p.payment_preferences={setup_fee:{value:'1'}},(p:any)=>p.taxes={percentage:'15'},(p:any)=>p.quantity_supported=true]){const p=plan();edit(p);expect(()=>validateLitePlan(p)).toThrow();}
});
it('rejects foreign approval links and clamps monthly paid periods correctly',()=>{
 expect(approvalURL([{rel:'approve',href:'https://www.sandbox.paypal.com/webapps/billing/subscriptions?ba_token=test'}],'sandbox')).toContain('sandbox.paypal.com');expect(()=>approvalURL([{rel:'approve',href:'https://paypal.com.evil.invalid/'}],'live')).toThrow();expect(paidMonthEnd('2024-01-31T10:00:00Z')).toBe('2024-02-29T10:00:00.000Z');
 expect(()=>paymentEvent({event_type:'PAYMENT.SALE.COMPLETED',resource:{id:'SALE',state:'completed',amount:{currency:'USD',total:'1'},create_time:'2024-01-01'}})).toThrow();
});
it('uses durable request IDs and server-fixed price and owner association for checkout',async()=>{
 const send=vi.fn().mockResolvedValueOnce(json({access_token:'access'})).mockResolvedValueOnce(json(plan())).mockResolvedValueOnce(json({id:'attempt-1',created_at:new Date().toISOString()})).mockResolvedValueOnce(json({id:'I-TEST',status:'APPROVAL_PENDING',links:[{rel:'approve',href:'https://www.sandbox.paypal.com/approve'}]})).mockResolvedValueOnce(json([]));
 const out=await new PayPalService(c,send).start('author');expect(out.approvalUrl).toBe('https://www.sandbox.paypal.com/approve');const create=send.mock.calls[3];const b=JSON.parse(create[1].body);expect(b.plan_id).toBe('P-TEST');expect(b.custom_id).toBe('attempt-1');expect(b.application_context.return_url).toBe(`${c.origin}/billing?paypal=returned`);expect(create[1].headers['PayPal-Request-Id']).toBe('attempt-1');expect(send.mock.calls[2][1].headers.apikey).toBe(c.adminKey);expect(send.mock.calls[2][1].headers.Authorization).toBeUndefined();
});
it('does not write any billing data for an invalid webhook signature',async()=>{
 const send=vi.fn().mockResolvedValueOnce(json({access_token:'access'})).mockResolvedValueOnce(json({verification_status:'FAILURE'}));const h=Object.fromEntries(['auth-algo','cert-url','transmission-id','transmission-sig','transmission-time'].map(k=>[`paypal-${k}`,'test']));await expect(new PayPalService(c,send).webhook({id:'spoofed'},h)).rejects.toThrow('signature');expect(send.mock.calls.every(call=>!String(call[0]).includes('supabase'))).toBe(true);
});
it('checks subscription ownership and plan before updating a snapshot',async()=>{
 const send=vi.fn().mockResolvedValueOnce(json({plan_id:c.planId,custom_id:'another-attempt',status:'ACTIVE'}));await expect(new PayPalService(c,send).sync({id:'attempt-1',paypal_id:'I-TEST',plan_id:c.planId},'token')).rejects.toThrow('verification');expect(send).toHaveBeenCalledTimes(1);
});
it('requires a real authenticated session instead of trusting a return query or decoded token',async()=>{
 const send=vi.fn().mockResolvedValue(json({error:'invalid'},401));await expect(new PayPalService(c,send).authenticate('Bearer forged')).rejects.toThrow('Sign in');expect(send.mock.calls[0][0]).toBe(`${c.supabaseUrl}/auth/v1/user`);
});
