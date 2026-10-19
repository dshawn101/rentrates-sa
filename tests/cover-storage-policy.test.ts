import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
import { expect, it } from 'vitest';
it('keeps covers private and limits uploads/reads to the owner of the matching book', async () => {
  const db = new PGlite();
  try {
    await db.exec(`CREATE ROLE authenticated; CREATE ROLE anon; CREATE SCHEMA auth;
      CREATE TABLE auth.users(id uuid PRIMARY KEY,email text UNIQUE);
      CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
      GRANT USAGE ON SCHEMA auth TO authenticated;
      CREATE SCHEMA storage;
      CREATE TABLE storage.buckets(id text PRIMARY KEY,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
      CREATE TABLE storage.objects(id uuid DEFAULT gen_random_uuid() PRIMARY KEY,bucket_id text,name text);
      CREATE FUNCTION storage.foldername(name text) RETURNS text[] LANGUAGE sql IMMUTABLE AS $$ SELECT string_to_array(name,'/') $$;
      ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
      GRANT USAGE ON SCHEMA storage TO authenticated;
      GRANT SELECT,INSERT ON storage.objects TO authenticated;
      INSERT INTO auth.users VALUES('00000000-0000-0000-0000-000000000001','one@test.example'),('00000000-0000-0000-0000-000000000002','two@test.example');`);
    await db.exec(readFileSync('supabase/migrations/20261019000000_repair_mvp_schema.sql','utf8'));
    await db.exec(readFileSync('supabase/migrations/20261019121345_private_book_cover_uploads.sql','utf8'));
    expect((await db.query<{ public: boolean }>('SELECT public FROM storage.buckets')).rows[0].public).toBe(false);
    const book = await db.query<{ id: string }>("INSERT INTO public.books(user_id,title) VALUES('00000000-0000-0000-0000-000000000001','Private') RETURNING id");
    const id = book.rows[0].id;
    await db.exec(`SET ROLE authenticated; SELECT set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',false);`);
    await db.query("INSERT INTO storage.objects(bucket_id,name) VALUES('book-covers',$1)", [`00000000-0000-0000-0000-000000000001/${id}/cover.jpg`]);
    expect((await db.query('SELECT * FROM storage.objects')).rows).toHaveLength(1);
    await db.exec(`SELECT set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000002',false);`);
    expect((await db.query('SELECT * FROM storage.objects')).rows).toHaveLength(0);
    await expect(db.query("INSERT INTO storage.objects(bucket_id,name) VALUES('book-covers',$1)", [`00000000-0000-0000-0000-000000000002/${id}/stolen.jpg`])).rejects.toThrow(/row-level security/);
  } finally { await db.close(); }
},30000);
