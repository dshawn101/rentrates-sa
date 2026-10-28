-- Payment records are service-written; authors may only read their own records.
create table public.paypal_subscriptions (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references public.user_profiles(id) on delete cascade,
 environment text not null check(environment in ('sandbox','live')),
 plan_id text not null,
 paypal_id text,
 approval_url text,
 status text not null default 'CREATING' check(status in ('CREATING','APPROVAL_PENDING','APPROVED','ACTIVE','SUSPENDED','CANCELLED','EXPIRED')),
 status_updated_at timestamptz not null default '-infinity',
 created_at timestamptz not null default now(),
 unique(environment,paypal_id)
);
create index paypal_subscriptions_owner on public.paypal_subscriptions(user_id,environment,created_at desc);
alter table public.paypal_subscriptions enable row level security;
revoke all on public.paypal_subscriptions from public,anon,authenticated;
grant select on public.paypal_subscriptions to authenticated;
grant all on public.paypal_subscriptions to service_role;
create policy "Authors read own PayPal subscriptions" on public.paypal_subscriptions for select to authenticated using((select auth.uid())=user_id);
create table public.paypal_payments (
 environment text not null check(environment in ('sandbox','live')),
 sale_id text not null,
 subscription_id uuid references public.paypal_subscriptions(id) on delete cascade,
 paid_at timestamptz,
 paid_until timestamptz,
 refunded boolean not null default false,
 primary key(environment,sale_id)
);
create index paypal_payments_subscription on public.paypal_payments(subscription_id);
alter table public.paypal_payments enable row level security;
revoke all on public.paypal_payments from public,anon,authenticated;
grant select on public.paypal_payments to authenticated;
grant all on public.paypal_payments to service_role;
create policy "Authors read own PayPal payments" on public.paypal_payments for select to authenticated using(exists(select 1 from public.paypal_subscriptions s where s.id=subscription_id and s.user_id=(select auth.uid())));
create table public.paypal_webhook_events(environment text not null,event_id text not null,processed_at timestamptz not null default now(),primary key(environment,event_id));
alter table public.paypal_webhook_events enable row level security;
revoke all on public.paypal_webhook_events from public,anon,authenticated;
grant all on public.paypal_webhook_events to service_role;

-- Invoker rights: only service_role may reserve/write. Lock per author to prevent parallel duplicate checkouts.
create function public.paypal_reserve_checkout(p_user uuid,p_environment text,p_plan text) returns public.paypal_subscriptions language plpgsql security invoker set search_path='' as $$
declare r public.paypal_subscriptions;
begin
 perform pg_advisory_xact_lock(hashtextextended(p_user::text||p_environment,0));
 select s.* into r from public.paypal_subscriptions s where s.user_id=p_user and s.environment=p_environment and (s.status not in ('CANCELLED','EXPIRED') or exists(select 1 from public.paypal_payments p where p.subscription_id=s.id and not p.refunded and p.paid_until>now())) order by s.created_at desc limit 1;
 if found then return r;end if;
 insert into public.paypal_subscriptions(user_id,environment,plan_id) values(p_user,p_environment,p_plan) returning * into r;return r;
end;$$;
create function public.paypal_update_snapshot(p_id uuid,p_status text,p_updated timestamptz) returns void language sql security invoker set search_path='' as $$
 update public.paypal_subscriptions set status=p_status,status_updated_at=p_updated where id=p_id and status_updated_at<=p_updated;
$$;
create function public.paypal_record_event(p_event text,p_environment text,p_subscription uuid,p_sale text,p_paid_at timestamptz,p_paid_until timestamptz,p_refunded boolean) returns void language plpgsql security invoker set search_path='' as $$
begin
 insert into public.paypal_webhook_events(environment,event_id) values(p_environment,p_event) on conflict do nothing;
 if not found then return;end if;
 if p_sale is null then return;end if;
 if p_refunded then
  -- A refund may arrive before the sale event. Keep a tombstone so late delivery cannot restore it.
  insert into public.paypal_payments(environment,sale_id,subscription_id,refunded) values(p_environment,p_sale,p_subscription,true) on conflict(environment,sale_id) do update set refunded=true;
 else
  if p_subscription is null or p_paid_at is null or p_paid_until is null or p_paid_until<=p_paid_at or p_paid_until>p_paid_at+interval '32 days' then raise exception 'Invalid payment window';end if;
  if not exists(select 1 from public.paypal_subscriptions where id=p_subscription and environment=p_environment) then raise exception 'Subscription mismatch';end if;
  insert into public.paypal_payments(environment,sale_id,subscription_id,paid_at,paid_until) values(p_environment,p_sale,p_subscription,p_paid_at,p_paid_until) on conflict(environment,sale_id) do update set subscription_id=coalesce(public.paypal_payments.subscription_id,excluded.subscription_id),paid_at=excluded.paid_at,paid_until=excluded.paid_until where public.paypal_payments.subscription_id is null or public.paypal_payments.subscription_id=excluded.subscription_id;
 end if;
end;$$;
-- RLS still applies to authors. Sandbox payments never grant live paid access.
create function public.paypal_has_lite(p_user uuid default auth.uid()) returns boolean language sql stable security invoker set search_path='' as $$
 select exists(select 1 from public.paypal_payments p join public.paypal_subscriptions s on s.id=p.subscription_id where s.user_id=p_user and s.environment='live' and s.status in ('ACTIVE','CANCELLED') and not p.refunded and p.paid_until>now());
$$;
revoke all on function public.paypal_reserve_checkout(uuid,text,text),public.paypal_update_snapshot(uuid,text,timestamptz),public.paypal_record_event(text,text,uuid,text,timestamptz,timestamptz,boolean),public.paypal_has_lite(uuid) from public,anon,authenticated;
grant execute on function public.paypal_reserve_checkout(uuid,text,text),public.paypal_update_snapshot(uuid,text,timestamptz),public.paypal_record_event(text,text,uuid,text,timestamptz,timestamptz,boolean),public.paypal_has_lite(uuid) to service_role;
grant execute on function public.paypal_has_lite(uuid) to authenticated;
notify pgrst,'reload schema';
