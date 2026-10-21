import {readFileSync} from 'node:fs';
import {PGlite} from '@electric-sql/pglite';
import {expect,it} from 'vitest';
it('guards stale saves, retains 50 restore points, archives reversibly and enforces ownership',async()=>{
 const db=new PGlite();try{
 await db.exec(`CREATE ROLE authenticated;CREATE ROLE anon;CREATE SCHEMA auth;CREATE TABLE auth.users(id uuid PRIMARY KEY,email text UNIQUE);CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;GRANT USAGE ON SCHEMA auth TO authenticated;INSERT INTO auth.users VALUES('00000000-0000-0000-0000-000000000001','one@test.invalid'),('00000000-0000-0000-0000-000000000002','two@test.invalid');`);
 await db.exec(readFileSync('supabase/migrations/20261019000000_repair_mvp_schema.sql','utf8'));
 await db.exec(readFileSync('supabase/migrations/20261021182649_manuscript_safety_and_recovery.sql','utf8'));
 await db.exec(`SET ROLE authenticated;SELECT set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',false)`);
 const {rows:[book]}=await db.query<{id:string}>(`INSERT INTO books(user_id,title) VALUES(auth.uid(),'Safety test') RETURNING id`);
 const {rows:[chapter]}=await db.query<{id:string}>(`INSERT INTO chapters(book_id,title,content,order_index) VALUES($1,'Opening','Original',0) RETURNING id`,[book.id]);
 const save=(text:string,revision:number)=>db.query<{saved:{revision:number}}>(`SELECT save_chapter_draft($1,$2,'plain',$3) saved`,[chapter.id,text,revision]);
 expect((await save('Edited',0)).rows[0].saved.revision).toBe(1);
 await expect(save('Stale overwrite',0)).rejects.toThrow(/changed elsewhere/);
 const previous=(await db.query<{version_history:{content:string}[]}>('SELECT version_history FROM chapters')).rows[0].version_history;
 expect(previous[0].content).toBe('Original');
 await save('Original',1);
 for(let revision=2;revision<54;revision++)await save(`Version ${revision}`,revision);
 expect((await db.query<{n:number}>('SELECT jsonb_array_length(version_history) n FROM chapters')).rows[0].n).toBe(50);
 const outline=(items:unknown[],removed:unknown[],known:string[])=>db.query('SELECT save_book_outline($1,$2::jsonb,$3::jsonb,$4::uuid[])',[book.id,JSON.stringify(items),JSON.stringify(removed),known]);
 await expect(outline([{id:chapter.id,title:'New title',content:'Stale prose',revision:1}],[],[chapter.id])).rejects.toThrow(/changed elsewhere/);
 await outline([{id:chapter.id,title:'New title',content:'Stale prose',revision:54}],[],[chapter.id]);
 expect((await db.query<{content:string}>('SELECT content FROM chapters')).rows[0].content).toBe('Version 53');
 await outline([],[{id:chapter.id,revision:55}],[chapter.id]);
 expect((await db.query<{deleted_at:unknown}>('SELECT deleted_at FROM chapters')).rows[0].deleted_at).not.toBeNull();
 await outline([{id:chapter.id,title:'Restored',revision:56}],[],[]);
 expect((await db.query<{deleted_at:unknown}>('SELECT deleted_at FROM chapters')).rows[0].deleted_at).toBeNull();
 await db.exec(`SELECT set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000002',false)`);
 expect((await db.query('SELECT * FROM chapters')).rows).toHaveLength(0);
 await expect(save('Not mine',57)).rejects.toThrow(/unavailable/);
 await expect(outline([],[],[])).rejects.toThrow(/unavailable/);
 }finally{await db.close();}
},30000);
