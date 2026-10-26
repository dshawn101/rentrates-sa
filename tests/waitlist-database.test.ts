import {readFileSync} from 'node:fs';
import {PGlite} from '@electric-sql/pglite';
import {expect,it} from 'vitest';
it('keeps waitlist entries private, deduplicates without enumeration and requires consent',async()=>{
 const db=new PGlite();try{
 await db.exec('CREATE ROLE anon; CREATE ROLE authenticated;');
 await db.exec(readFileSync('supabase/migrations/20261026124919_launch_waitlist.sql','utf8'));
 const insert=(email:string,consent=true,interest='lite')=>db.query('insert into launch_waitlist(email,interest,source,consent) values ($1,$2,\'pricing\',$3)',[email,interest,consent]);
 await db.exec('SET ROLE anon');await insert(' Author@Example.invalid ');
 await expect(db.query('select * from launch_waitlist')).rejects.toThrow(/permission denied/);
 await expect(db.exec("update launch_waitlist set interest='pro'")).rejects.toThrow(/permission denied/);
 await expect(db.exec('delete from launch_waitlist')).rejects.toThrow(/permission denied/);
 await insert('author@example.invalid',true,'pro');
 await expect(insert('other@example.invalid',false)).rejects.toThrow(/consent/);
 await expect(insert('bad-email')).rejects.toThrow(/fields/);
 await expect(insert('other@example.invalid',true,'invalid')).rejects.toThrow(/fields/);
 await expect(db.exec("insert into launch_waitlist(email,interest,source,consent,created_at) values ('spoof@example.invalid','lite','pricing',true,now())")).rejects.toThrow(/permission denied/);
 await db.exec('RESET ROLE');const rows=(await db.query<{email:string;interest:string}>('select * from launch_waitlist')).rows;expect(rows).toHaveLength(1);expect(rows[0].email).toBe('author@example.invalid');expect(rows[0].interest).toBe('lite');
 await db.exec('SET ROLE authenticated');await insert('signedin@example.invalid');await expect(db.query('select * from launch_waitlist')).rejects.toThrow(/permission denied/);
 await db.exec('RESET ROLE');expect((await db.query('select * from launch_waitlist')).rows).toHaveLength(2);
 }finally{await db.close();}
},30000);
