import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
import { expect, it } from 'vitest';
const repair = readFileSync('supabase/migrations/20261019000000_repair_mvp_schema.sql', 'utf8');
it('repairs an empty app schema, backfills existing users, reruns safely and enforces ownership', async () => {
  const db = new PGlite();
  try {
    await db.exec(`CREATE ROLE authenticated; CREATE ROLE anon;
      CREATE SCHEMA auth;
      CREATE TABLE auth.users (id uuid PRIMARY KEY, email text UNIQUE);
      CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
      GRANT USAGE ON SCHEMA auth TO authenticated;
      INSERT INTO auth.users VALUES ('00000000-0000-0000-0000-000000000001','existing@example.test');`);
    await db.exec(repair);
    await db.exec(readFileSync('supabase/migrations/20261019105558_restrict_rls_event_trigger_access.sql', 'utf8'));
    await db.exec(repair);
    expect((await db.query('SELECT * FROM public.user_profiles')).rows).toHaveLength(1);
    await db.exec(`INSERT INTO auth.users VALUES ('00000000-0000-0000-0000-000000000002','new@example.test');`);
    expect((await db.query('SELECT * FROM public.user_profiles')).rows).toHaveLength(2);
    await db.exec(`SET ROLE authenticated; SELECT set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',false);`);
    const book = await db.query<{ id: string }>(`INSERT INTO public.books(user_id,title) VALUES(auth.uid(),'Test Book') RETURNING id`);
    const id = book.rows[0].id;
    await db.query(`INSERT INTO public.chapters(book_id,title,content,order_index) VALUES($1,'Chapter One','Saved prose',0)`, [id]);
    expect((await db.query('SELECT * FROM public.chapters')).rows).toHaveLength(1);
    await db.exec(`SELECT set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000002',false);`);
    expect((await db.query('SELECT * FROM public.books')).rows).toHaveLength(0);
    expect((await db.query('SELECT * FROM public.chapters')).rows).toHaveLength(0);
    await expect(db.query(`INSERT INTO public.chapters(book_id,title,order_index) VALUES($1,'Not mine',0)`, [id])).rejects.toThrow(/row-level security/);
    await expect(db.exec(`UPDATE public.user_profiles SET tier='craft' WHERE id=auth.uid()`)).rejects.toThrow(/permission denied/);
    await db.exec(`RESET ROLE; UPDATE public.user_profiles SET tier='craft' WHERE id='00000000-0000-0000-0000-000000000001';`);
    await db.exec(repair);
    expect((await db.query<{ content: string }>('SELECT content FROM public.chapters')).rows[0].content).toBe('Saved prose');
    expect((await db.query<{ tier: string }>("SELECT tier FROM public.user_profiles WHERE id='00000000-0000-0000-0000-000000000001'")).rows[0].tier).toBe('craft');
  } finally { await db.close(); }
}, 30000);
