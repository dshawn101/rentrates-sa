-- Public submission, private mailing list. No public read/update or email enumeration.
create table public.launch_waitlist (
 id uuid primary key default gen_random_uuid(),
 email text not null unique check(length(email)<=254 and email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),
 interest text not null check(interest in ('launch','free','lite','author','pro')),
 source text not null check(source in ('landing','pricing')),
 consent boolean not null check(consent),
 consent_version text not null default 'launch-v1' check(consent_version='launch-v1'),
 created_at timestamptz not null default now()
);
create index launch_waitlist_created on public.launch_waitlist(created_at desc);
alter table public.launch_waitlist enable row level security;
revoke all on public.launch_waitlist from public,anon,authenticated;
grant insert(email,interest,source,consent) on public.launch_waitlist to anon,authenticated;
create policy "Visitors can request launch notifications" on public.launch_waitlist for insert to anon,authenticated
 with check(consent=true and consent_version='launch-v1');
create schema if not exists private;
create function private.guard_launch_waitlist() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 new.email:=lower(trim(new.email));
 if new.consent is distinct from true or length(new.email)>254 or new.email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
 or new.interest not in ('launch','free','lite','author','pro') or new.source not in ('landing','pricing') then
  raise exception 'Check waitlist fields and notification consent.' using errcode='22023';
 end if;
 perform pg_catalog.pg_advisory_xact_lock(381207664);
 -- Duplicate submissions get the same empty success response; original preferences are not overwritten by strangers.
 if exists(select 1 from public.launch_waitlist where email=new.email) then return null; end if;
 if (select count(*) from public.launch_waitlist where created_at>now()-interval '1 hour')>=1000 then
  raise exception 'Waitlist busy. Please try again later.' using errcode='P0001';
 end if;
 return new;
end $$;
revoke all on function private.guard_launch_waitlist() from public,anon,authenticated;
create trigger launch_waitlist_guard before insert on public.launch_waitlist for each row execute function private.guard_launch_waitlist();
notify pgrst,'reload schema';
