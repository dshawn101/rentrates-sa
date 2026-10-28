import {readFileSync} from 'node:fs';
import {PGlite} from '@electric-sql/pglite';
import {expect,it} from 'vitest';
it('isolates billing, prevents duplicate checkout, deduplicates payments and never restores refunded access on late delivery',async()=>{
 const db=new PGlite();const user='00000000-0000-0000-0000-000000000001',other='00000000-0000-0000-0000-000000000002';
 try{
 await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create function auth.uid() returns uuid language sql as $$select nullif(current_setting('test.uid',true),'')::uuid$$;grant usage on schema auth to authenticated,service_role;create table public.user_profiles(id uuid primary key);insert into public.user_profiles values('${user}'),('${other}');`);
 await db.exec(readFileSync('supabase/migrations/20261028093322_paypal_lite_billing.sql','utf8'));
 await db.exec('set role service_role');const reserve=async(env='live')=>(await db.query<{r:any}>('select row_to_json(public.paypal_reserve_checkout($1,$2,\'P-TEST\')) r',[user,env])).rows[0].r;
 const s=await reserve();expect((await reserve()).id).toBe(s.id);await db.query("update paypal_subscriptions set paypal_id='I-TEST',status='ACTIVE' where id=$1",[s.id]);
 const event=async(id:string,sale:string,refund=false,sub:string|null=s.id)=>db.query('select paypal_record_event($1,\'live\',$2,$3,now(),now()+interval \'1 month\',$4)',[id,sub,sale,refund]);
 await event('event-1','sale-1');await event('event-1','sale-1');expect((await db.query('select * from paypal_payments')).rows).toHaveLength(1);
 await db.exec(`reset role;set test.uid='${user}';set role authenticated;`);expect((await db.query<{yes:boolean}>('select paypal_has_lite() yes')).rows[0].yes).toBe(true);
 await expect(db.exec("update paypal_subscriptions set status='ACTIVE'")).rejects.toThrow(/permission/);await expect(db.query('select paypal_reserve_checkout($1,\'live\',\'P\')',[user])).rejects.toThrow(/permission/);await expect(db.exec('select * from paypal_webhook_events')).rejects.toThrow(/permission/);
 await db.exec(`reset role;set test.uid='${other}';set role authenticated;`);expect((await db.query('select * from paypal_subscriptions')).rows).toHaveLength(0);expect((await db.query<{yes:boolean}>('select paypal_has_lite($1) yes',[user])).rows[0].yes).toBe(false);
 await db.exec('reset role;set role service_role');await event('refund','sale-1',true);await event('late-sale','sale-1');await event('early-refund','sale-2',true,null);await event('late-complete','sale-2');expect((await db.query<{yes:boolean}>('select paypal_has_lite($1) yes',[user])).rows[0].yes).toBe(false);
 const sandbox=await reserve('sandbox');await db.query("update paypal_subscriptions set status='ACTIVE' where id=$1",[sandbox.id]);await db.query("select paypal_record_event('sandbox-sale','sandbox',$1,'sale-sandbox',now(),now()+interval '1 month',false)",[sandbox.id]);expect((await db.query<{yes:boolean}>('select paypal_has_lite($1) yes',[user])).rows[0].yes).toBe(false);
 await event('paid-again','sale-3');await db.query("update paypal_subscriptions set status='CANCELLED' where id=$1",[s.id]);expect((await db.query<{yes:boolean}>('select paypal_has_lite($1) yes',[user])).rows[0].yes).toBe(true);expect((await reserve()).id).toBe(s.id);
 await db.query("update paypal_payments set paid_until=now()-interval '1 second' where subscription_id=$1",[s.id]);expect((await db.query<{yes:boolean}>('select paypal_has_lite($1) yes',[user])).rows[0].yes).toBe(false);expect((await reserve()).id).not.toBe(s.id);
 await db.exec('reset role;set role anon');await expect(db.exec('select * from paypal_subscriptions')).rejects.toThrow(/permission/);await expect(db.exec('select paypal_has_lite()')).rejects.toThrow(/permission/);
 }finally{await db.close();}
},30000);
