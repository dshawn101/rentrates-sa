-- One daily attempt per account and a $10 beta reservation ceiling.
-- Failed/ambiguous requests retain their reservation to prevent overspend on retries.
create table public.platform_review_attempts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  review_day date not null default ((now() at time zone 'UTC')::date),
  reserved_usd numeric(8,4) not null default 0.10 check (reserved_usd = 0.10),
  reported_cost_usd numeric(12,8) check (reported_cost_usd >= 0),
  created_at timestamptz not null default now(),
  unique(owner_id, review_day)
);
alter table public.platform_review_attempts enable row level security;
revoke all on public.platform_review_attempts from public, anon, authenticated;
grant select, insert, update on public.platform_review_attempts to service_role;

create function public.reserve_platform_review(p_owner uuid) returns text
language plpgsql security invoker set search_path = '' as $$
declare attempt uuid;
begin
  perform pg_catalog.pg_advisory_xact_lock(681192037);
  if exists (select 1 from public.platform_review_attempts where owner_id=p_owner and review_day=(now() at time zone 'UTC')::date) then
    return 'account_limit';
  end if;
  if (select coalesce(sum(reserved_usd),0) from public.platform_review_attempts) + 0.10 > 10 then
    return 'budget_limit';
  end if;
  insert into public.platform_review_attempts(owner_id) values (p_owner) returning id into attempt;
  return attempt::text;
end;
$$;
revoke all on function public.reserve_platform_review(uuid) from public, anon, authenticated;
grant execute on function public.reserve_platform_review(uuid) to service_role;
notify pgrst,'reload schema';
