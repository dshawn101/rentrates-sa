-- A private support inbox: visitors may submit, but never read anyone's requests.
create table public.support_requests (
 id uuid primary key,
 user_id uuid default auth.uid() references auth.users(id) on delete set null,
 name text not null check(length(trim(name)) between 1 and 100),
 email text not null check(length(email)<=254 and email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),
 category text not null check(category in ('account','writing','library','import-export','covers','ai','billing','bug','feedback','privacy','other')),
 subject text not null check(length(trim(subject)) between 3 and 160),
 book_title text not null default '' check(length(book_title)<=200),
 message text not null check(length(trim(message)) between 20 and 5000),
 status text not null default 'new' check(status in ('new','in-progress','resolved')),
 created_at timestamptz not null default now()
);
create index support_requests_email_created on public.support_requests(lower(email),created_at desc);
create index support_requests_created on public.support_requests(created_at desc);
alter table public.support_requests enable row level security;
revoke all on public.support_requests from public,anon,authenticated;
grant insert(id,name,email,category,subject,book_title,message) on public.support_requests to anon,authenticated;
create policy "Visitors can submit support requests" on public.support_requests for insert to anon,authenticated
 with check(user_id is not distinct from (select auth.uid()) and status='new');
-- Privileged access is confined to an internal trigger for counting submissions.
-- It never returns stored request data or offers a public function endpoint.
create schema if not exists private;
create or replace function private.guard_support_submission() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 new.email:=lower(trim(new.email));new.name:=trim(new.name);new.subject:=trim(new.subject);new.message:=trim(new.message);new.book_title:=trim(new.book_title);
 perform pg_catalog.pg_advisory_xact_lock(381207663);
 if exists(select 1 from public.support_requests where id=new.id) then
  if exists(select 1 from public.support_requests s where s.id=new.id and s.name=new.name and s.email=new.email and s.category=new.category and s.subject=new.subject and s.book_title=new.book_title and s.message=new.message) then return new; end if;
  raise exception 'Request reference already used.' using errcode='22023';
 end if;
 if (select count(*) from public.support_requests where lower(email)=new.email and created_at>now()-interval '1 hour')>=3
 or (select count(*) from public.support_requests where created_at>now()-interval '1 hour')>=100 then
  raise exception 'Support submission limit reached. Please try again later.' using errcode='P0001';
 end if;
 return new;
end $$;
revoke all on function private.guard_support_submission() from public,anon,authenticated;
create trigger support_submission_guard before insert on public.support_requests for each row execute function private.guard_support_submission();
notify pgrst,'reload schema';
