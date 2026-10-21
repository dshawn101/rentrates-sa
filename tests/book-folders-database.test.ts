import {readFileSync} from 'node:fs';
import {PGlite} from '@electric-sql/pglite';
import {expect,it} from 'vitest';
it('keeps folders private, rejects cross-account moves, and unfiles books without deleting text',async()=>{
 const db=new PGlite();try{
 await db.exec(`CREATE ROLE authenticated;CREATE ROLE anon;CREATE SCHEMA auth;CREATE TABLE auth.users(id uuid PRIMARY KEY,email text UNIQUE);CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;GRANT USAGE ON SCHEMA auth TO authenticated;INSERT INTO auth.users VALUES('00000000-0000-0000-0000-000000000001','one@example.invalid'),('00000000-0000-0000-0000-000000000002','two@example.invalid');`);
 await db.exec(readFileSync('supabase/migrations/20261019000000_repair_mvp_schema.sql','utf8'));
 await db.exec(readFileSync('supabase/migrations/20261021192226_book_folders.sql','utf8'));
 await db.exec(`SET ROLE authenticated;SELECT set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',false)`);
 const {rows:[folder]}=await db.query<{id:string}>(`INSERT INTO book_folders(user_id,name) VALUES(auth.uid(),'Thriller') RETURNING id`);
 const {rows:[book]}=await db.query<{id:string}>(`INSERT INTO books(user_id,title,folder_id) VALUES(auth.uid(),'My manuscript',$1) RETURNING id`,[folder.id]);
 await db.query(`INSERT INTO chapters(book_id,title,content,order_index) VALUES($1,'Opening','Keep this writing.',0)`,[book.id]);
 await expect(db.query(`INSERT INTO book_folders(user_id,name) VALUES(auth.uid(),' thriller ')`)).rejects.toThrow(/unique/);
 await db.query(`UPDATE book_folders SET name='Romance' WHERE id=$1`,[folder.id]);
 await db.exec(`SELECT set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000002',false)`);
 expect((await db.query('SELECT * FROM book_folders')).rows).toHaveLength(0);
 const {rows:[otherBook]}=await db.query<{id:string}>(`INSERT INTO books(user_id,title) VALUES(auth.uid(),'Other owner') RETURNING id`);
 await expect(db.query(`UPDATE books SET folder_id=$1 WHERE id=$2`,[folder.id,otherBook.id])).rejects.toThrow(/foreign key/);
 await expect(db.query(`INSERT INTO book_folders(user_id,name) VALUES('00000000-0000-0000-0000-000000000001','Intrusion')`)).rejects.toThrow(/row-level security/);
 expect((await db.query('DELETE FROM book_folders WHERE id=$1 RETURNING id',[folder.id])).rows).toHaveLength(0);
 await db.exec(`SELECT set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',false)`);
 await db.query('DELETE FROM book_folders WHERE id=$1',[folder.id]);
 expect((await db.query<{folder_id:string|null}>('SELECT folder_id FROM books WHERE id=$1',[book.id])).rows[0].folder_id).toBeNull();
 expect((await db.query<{content:string}>('SELECT content FROM chapters')).rows[0].content).toBe('Keep this writing.');
 }finally{await db.close();}
},30000);
