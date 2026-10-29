import {readFileSync} from 'node:fs';
import {PGlite} from '@electric-sql/pglite';
import {expect,it} from 'vitest';
it('updates only owner goal metadata, preserves chapters and other fields, and denies other accounts and anonymous callers',async()=>{
 const db=new PGlite();try{
 await db.exec(`create role authenticated;create role anon;create schema auth;create table auth.users(id uuid primary key,email text unique);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema auth to authenticated;insert into auth.users values('00000000-0000-0000-0000-000000000001','one@test.invalid'),('00000000-0000-0000-0000-000000000002','two@test.invalid');`);
 await db.exec(readFileSync('supabase/migrations/20261019000000_repair_mvp_schema.sql','utf8'));await db.exec(readFileSync('supabase/migrations/20261029145625_author_writing_goals.sql','utf8'));
 await db.exec("set role authenticated;select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',false)");const book=(await db.query<{id:string}>(`insert into books(user_id,title,metadata) values(auth.uid(),'Goal test','{"coverPath":"keep","bookNotes":"private","exportPages":{"copyright":"keep"}}') returning id`)).rows[0];
 await db.query("insert into chapters(book_id,title,content,order_index) values($1,'Opening','Original manuscript',0)",[book.id]);const save=async(target:number|null,date:string|null,enabled=true)=>db.query<{b:any}>('select row_to_json(save_writing_goal($1,$2,$3,$4)) b',[book.id,enabled,target,date]);
 const saved=(await save(30000,'2026-12-01')).rows[0].b;expect(saved.metadata).toMatchObject({coverPath:'keep',bookNotes:'private',exportPages:{copyright:'keep'},targetWordCount:30000,writingGoal:{enabled:true,targetWords:30000,targetDate:'2026-12-01'}});
 await expect(save(10,null)).rejects.toThrow(/target/);await expect(save(30000,'2500-01-01')).rejects.toThrow(/date/);expect((await db.query<{content:string}>('select content from chapters')).rows[0].content).toBe('Original manuscript');
 expect((await save(null,null,false)).rows[0].b.metadata.writingGoal.enabled).toBe(false);
 await db.exec("select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000002',false)");await expect(save(40000,null)).rejects.toThrow(/unavailable/);
 await db.exec('reset role;set role anon');await expect(save(30000,null)).rejects.toThrow(/permission/);
 }finally{await db.close();}
},30000);
