create schema if not exists private;
create table private.series_bible_counts (
  day date not null,
  event text not null check (event in ('start','export','signup')),
  total integer not null check (total between 1 and 10000),
  primary key (day,event)
);
alter table private.series_bible_counts enable row level security;
revoke all on private.series_bible_counts from public, anon, authenticated;

create table public.series_bible_event_input (
  event text not null check (event in ('start','export','signup'))
);
alter table public.series_bible_event_input enable row level security;
revoke all on public.series_bible_event_input from public, anon, authenticated;
grant insert (event) on public.series_bible_event_input to anon;
create policy "Submit a predefined counter event" on public.series_bible_event_input
  for insert to anon with check (event in ('start','export','signup'));

create function private.count_series_bible_event() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.event not in ('start','export','signup') then
    raise exception 'Invalid series bible event';
  end if;
  insert into private.series_bible_counts as c (day,event,total)
  values ((now() at time zone 'UTC')::date,new.event,1)
  on conflict (day,event) do update set total=c.total+1 where c.total<10000;
  return null;
end;
$$;
revoke all on function private.count_series_bible_event() from public, anon, authenticated;
create trigger count_series_bible_event before insert on public.series_bible_event_input
  for each row execute function private.count_series_bible_event();
notify pgrst, 'reload schema';
