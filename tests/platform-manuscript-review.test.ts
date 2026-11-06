import {expect,it,vi} from 'vitest';
import {readFileSync} from 'node:fs';
import {PGlite} from '@electric-sql/pglite';
import {runManuscriptReview} from '../server/manuscript-review';
import {reviewFingerprint} from '../src/lib/book-review';

const id='00000000-0000-4000-8000-000000000001';
const owner='00000000-0000-4000-8000-000000000002';
const attempt='00000000-0000-4000-8000-000000000003';
const config={url:'https://example.supabase.co',anon:'public',admin:'sb_secret_test',key:'review-only',model:'approved/model'};
const chapters=[{id,title:'First',content:'The year was 1990. The year was 1995.',revision:1,content_format:'plain' as const}];
const payload=async()=>({bookId:id,consent:true,fingerprint:await reviewFingerprint(chapters,'')});
const request=(budget:string=attempt,owned=true)=>vi.fn(async (url:string|URL)=>{
 const s=String(url);
 if(s.includes('/auth/v1/user'))return Response.json({id:owner});
 if(s.includes('/books?'))return Response.json(owned?[{id}]:[]);
 if(s.includes('/chapters?'))return Response.json(chapters);
 if(s.endsWith('/api/v1/key'))return Response.json({data:{limit:10,limit_reset:null,limit_remaining:10}});
 if(s.includes('/rpc/'))return Response.json(budget);
 if(s.includes('/platform_review_attempts?'))return new Response(null,{status:204});
 return Response.json({usage:{cost:0.001},choices:[{finish_reason:'stop',message:{content:JSON.stringify({findings:[
  {title:'Conflicting years',explanation:'Check the chronology',severity:'medium',evidence:[{chapterId:id,quote:'The year was 1990.'},{chapterId:id,quote:'The year was 1995.'}]},
  {title:'Invented',explanation:'Ignore',severity:'medium',evidence:[{chapterId:id,quote:'Not in the source.'},{chapterId:id,quote:'The year was 1995.'}]},
 ]})}}]});
});
it('rejects missing consent, custom prompts, foreign books and changed snapshots before reserving spend',async()=>{
 const job=await payload();
 for(const [input,owned] of [[{...job,consent:false},true],[{...job,prompt:'arbitrary completion'},true],[job,false],[{...job,fingerprint:'0'.repeat(64)},true]] as const){
  const send=request(attempt,owned);await expect(runManuscriptReview(config,'Bearer session',input,send)).rejects.toThrow();
  expect(send.mock.calls.some(([url])=>/rpc|openrouter/.test(String(url)))).toBe(false);
 }
});
it('uses the fixed review-only model and key after reservation, and returns only source-backed findings',async()=>{
 const send=request();const spy=vi.fn<typeof fetch>((url)=>send(url));
 const out=await runManuscriptReview(config,'Bearer session',await payload(),spy);
 const call=spy.mock.calls.find(([url])=>String(url).includes('/chat/completions'))!;
 const provider=JSON.parse(String(call[1]?.body));
 expect(provider).toMatchObject({model:config.model,max_tokens:2500,provider:{zdr:true,allow_fallbacks:false,max_price:{request:0}}});
 expect(new Headers(call[1]?.headers).get('Authorization')).toBe('Bearer review-only');
 expect(out.findings.map(x=>x.title)).toEqual(['Conflicting years']);
 expect(spy.mock.calls.some(([url,opts])=>String(url).includes('/platform_review_attempts?')&&String(opts?.body).includes('0.001'))).toBe(true);
});
it('does not call the provider after account or budget rejection',async()=>{
 for(const limit of ['account_limit','budget_limit']){
  const send=request(limit);await expect(runManuscriptReview(config,'Bearer session',await payload(),send)).rejects.toMatchObject({status:429});
  expect(send.mock.calls.some(([url])=>String(url).includes('/chat/completions'))).toBe(false);
 }
});
it('keeps reservations private and enforces the daily limit and cumulative budget in PostgreSQL',async()=>{
 const db=new PGlite();try{
  await db.exec('create role anon;create role authenticated;create role service_role bypassrls;');
  await db.exec(readFileSync('supabase/migrations/20261106160350_platform_review_budget.sql','utf8'));
  await db.exec('set role authenticated');
  await expect(db.query('select public.reserve_platform_review($1::uuid)',[owner])).rejects.toThrow(/permission/);
  await db.exec('reset role;set role service_role');
  const reserve=async()=>(await db.query<{r:string}>('select public.reserve_platform_review($1::uuid) r',[owner])).rows[0].r;
  expect(await reserve()).toMatch(/^[a-f0-9-]{36}$/);
  expect(await reserve()).toBe('account_limit');
  await db.exec('insert into public.platform_review_attempts(owner_id) select gen_random_uuid() from generate_series(1,99)');
  expect((await db.query<{r:string}>('select public.reserve_platform_review($1::uuid) r',[id])).rows[0].r).toBe('budget_limit');
 }finally{await db.close();}
},30000);
