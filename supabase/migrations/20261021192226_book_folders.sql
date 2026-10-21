-- Private, flat folders. Folder removal unfiles books; it never deletes manuscripts.
create table public.book_folders (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 name text not null check(length(trim(name)) between 1 and 80),
 created_at timestamptz not null default now(),
 unique(user_id,id)
);
create unique index book_folders_owner_name on public.book_folders(user_id,lower(trim(name)));
alter table public.book_folders enable row level security;
create policy "Owners manage their folders" on public.book_folders for all to authenticated
 using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
revoke all on public.book_folders from anon,authenticated;
grant select,insert,delete on public.book_folders to authenticated;
grant update(name) on public.book_folders to authenticated;
alter table public.books add column folder_id uuid;
alter table public.books add constraint books_private_folder foreign key(user_id,folder_id)
 references public.book_folders(user_id,id) on delete set null(folder_id);
create index books_folder_id on public.books(folder_id);
notify pgrst,'reload schema';
