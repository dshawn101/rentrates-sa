import {readFileSync} from 'node:fs';
import {PGlite} from '@electric-sql/pglite';
import {expect,it} from 'vitest';
it('accepts private public submissions, blocks inbox access and enforces validation and rate limits',async()=>{
 const db=new PGlite();try{
 await db.exec(`CREATE ROLE authenticated;CREATE ROLE anon;CREATE SCHEMA auth;CREATE TABLE auth.users(id uuid PRIMARY KEY);CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;GRANT USAGE ON SCHEMA auth TO anon,authenticated;`);
 await db.exec(readFileSync('supabase/migrations/20261022145110_author_support_requests.sql','utf8'));
 await db.exec('SET ROLE anon');
 const submit=(id:string,category='writing',email='author@example.invalid',message='Please help recover my saved chapter.')=>db.query(`INSERT INTO support_requests(id,name,email,category,subject,message) VALUES($1,'Author',$2,$3,'Chapter recovery',$4)`,[id,email,category,message]);
 const ids=['00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000004'];
 await submit(ids[0]);
 await expect(db.query('SELECT * FROM support_requests')).rejects.toThrow(/permission denied/);
 await expect(db.exec(`UPDATE support_requests SET status='resolved'`)).rejects.toThrow(/permission denied/);
 await expect(submit(ids[1],'fake-category')).rejects.toThrow(/check constraint/);
 await expect(submit(ids[1],'writing','author@example.invalid','short')).rejects.toThrow(/check constraint/);
 await submit(ids[1]);await submit(ids[2]);
 await expect(submit(ids[3])).rejects.toThrow(/submission limit/);
 await expect(submit(ids[2])).rejects.toThrow(/duplicate key/);
 await expect(submit(ids[2],'writing','author@example.invalid','Different message using the same request reference.')).rejects.toThrow(/reference already used/);
 await db.exec('RESET ROLE');expect((await db.query('SELECT * FROM support_requests')).rows).toHaveLength(3);
 await db.exec(`INSERT INTO auth.users VALUES('10000000-0000-0000-0000-000000000001');SET ROLE authenticated;SELECT set_config('request.jwt.claim.sub','10000000-0000-0000-0000-000000000001',false)`);
 await submit(ids[3],'ai','another@example.invalid');
 await expect(db.exec(`INSERT INTO support_requests(id,user_id,name,email,category,subject,message) VALUES(gen_random_uuid(),null,'Author','spoof@example.invalid','ai','A question','A sufficiently long question for support.')`)).rejects.toThrow(/permission denied/);
 await db.exec('RESET ROLE');expect((await db.query<{user_id:string}>('SELECT user_id FROM support_requests WHERE id=$1',[ids[3]])).rows[0].user_id).toBe('10000000-0000-0000-0000-000000000001');
 }finally{await db.close();}
},30000);
