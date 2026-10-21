-- Backward-compatible additions. All operations retain caller RLS/ownership.
alter table public.chapters add column if not exists revision bigint not null default 0;
alter table public.chapters add column if not exists content_format text not null default 'plain' check(content_format in ('plain','markdown'));
alter table public.chapters add column if not exists deleted_at timestamptz;
create or replace function public.puble_chapter_revision() returns trigger
language plpgsql security invoker set search_path=public,pg_temp as $$
declare history jsonb;
begin
  new.revision := old.revision + 1;
  new.updated_at := clock_timestamp();
  new.version_history := old.version_history;
  if new.content is distinct from old.content or new.content_format is distinct from old.content_format then
    history := case when jsonb_typeof(old.version_history)='array' then old.version_history else '[]'::jsonb end;
    history := history || jsonb_build_array(jsonb_build_object('revision',old.revision,'content',coalesce(old.content,''),'format',old.content_format,'savedAt',old.updated_at));
    select coalesce(jsonb_agg(value order by ord),'[]'::jsonb) into new.version_history
      from jsonb_array_elements(history) with ordinality as h(value,ord)
      where ord > greatest(jsonb_array_length(history)-50,0);
  end if;
  return new;
end $$;
drop trigger if exists puble_chapter_revision on public.chapters;
create trigger puble_chapter_revision before update on public.chapters for each row execute function public.puble_chapter_revision();
revoke all on function public.puble_chapter_revision() from public,anon,authenticated;

create or replace function public.save_chapter_draft(p_id uuid,p_content text,p_format text,p_revision bigint)
returns jsonb language plpgsql security invoker set search_path=public,pg_temp as $$
declare current_chapter public.chapters; result jsonb;
begin
  if auth.uid() is null then raise exception 'Sign in before saving.' using errcode='42501'; end if;
  if p_content is null or length(p_content)>1000000 or p_format not in ('plain','markdown') then raise exception 'Invalid chapter content.'; end if;
  select * into current_chapter from public.chapters where id=p_id and deleted_at is null for update;
  if not found then raise exception 'Chapter unavailable.' using errcode='42501'; end if;
  if current_chapter.revision is distinct from p_revision then raise exception 'This chapter changed elsewhere. Review the saved version before retrying.' using errcode='40001'; end if;
  if current_chapter.content is not distinct from p_content and current_chapter.content_format=p_format then return to_jsonb(current_chapter)-'version_history'; end if;
  update public.chapters set content=p_content,content_format=p_format where id=p_id returning to_jsonb(chapters)-'version_history' into result;
  return result;
end $$;
revoke all on function public.save_chapter_draft(uuid,text,text,bigint) from public,anon;
grant execute on function public.save_chapter_draft(uuid,text,text,bigint) to authenticated;

create or replace function public.save_book_outline(p_book uuid,p_items jsonb,p_removed jsonb,p_known_ids uuid[])
returns void language plpgsql security invoker set search_path=public,pg_temp as $$
declare item jsonb; previous public.chapters; position integer := 0; chapter_id uuid;
begin
  if auth.uid() is null then raise exception 'Sign in before saving.' using errcode='42501'; end if;
  perform 1 from public.books where id=p_book and user_id=auth.uid() for update;
  if not found then raise exception 'Book unavailable.' using errcode='42501'; end if;
  if jsonb_typeof(p_items)<>'array' or jsonb_array_length(p_items)>500 or jsonb_typeof(p_removed)<>'array' then raise exception 'Invalid outline.'; end if;
  if array(select id from public.chapters where book_id=p_book and deleted_at is null order by id)
     is distinct from array(select unnest(coalesce(p_known_ids,'{}'::uuid[])) order by 1) then
    raise exception 'The outline changed elsewhere. Reload before saving.' using errcode='40001';
  end if;
  for item in select value from jsonb_array_elements(p_items) loop
    chapter_id := (item->>'id')::uuid;
    if coalesce(length(trim(item->>'title')),0) not between 1 and 300 then raise exception 'Each chapter needs a title of up to 300 characters.'; end if;
    select * into previous from public.chapters where id=chapter_id for update;
    if found then
      if previous.book_id<>p_book then raise exception 'Chapter unavailable.' using errcode='42501'; end if;
      if previous.revision is distinct from (item->>'revision')::bigint then raise exception 'A chapter changed elsewhere. Reload before saving the outline.' using errcode='40001'; end if;
      -- Existing prose is never written back from an old outline copy.
      update public.chapters set title=trim(item->>'title'),order_index=position,deleted_at=null,
        ai_contribution=coalesce(ai_contribution,'{}'::jsonb)||jsonb_build_object('outline_description',coalesce(item->>'description','')) where id=chapter_id;
    else
      if item->>'revision' is not null then raise exception 'Chapter unavailable.' using errcode='40001'; end if;
      if length(coalesce(item->>'content',''))>1000000 then raise exception 'Chapter too large.'; end if;
      insert into public.chapters(id,book_id,title,content,content_format,order_index,ai_contribution)
        values(chapter_id,p_book,trim(item->>'title'),coalesce(item->>'content',''),coalesce(item->>'format','plain'),position,jsonb_build_object('outline_description',coalesce(item->>'description','')));
    end if;
    position := position+1;
  end loop;
  for item in select value from jsonb_array_elements(p_removed) loop
    select * into previous from public.chapters where id=(item->>'id')::uuid and book_id=p_book for update;
    if not found or previous.revision is distinct from (item->>'revision')::bigint then raise exception 'A removed chapter changed elsewhere. Reload first.' using errcode='40001'; end if;
    update public.chapters set deleted_at=clock_timestamp() where id=previous.id;
  end loop;
end $$;
revoke all on function public.save_book_outline(uuid,jsonb,jsonb,uuid[]) from public,anon;
grant execute on function public.save_book_outline(uuid,jsonb,jsonb,uuid[]) to authenticated;
notify pgrst,'reload schema';
