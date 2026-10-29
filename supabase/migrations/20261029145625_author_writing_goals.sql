-- Update only the goal fields, preserving unrelated book metadata under the row lock.
create or replace function public.save_writing_goal(p_book uuid,p_enabled boolean,p_target integer default null,p_date date default null)
returns public.books language plpgsql security invoker set search_path='' as $$
declare saved public.books;
begin
 if auth.uid() is null then raise exception 'Sign in before saving a goal' using errcode='42501';end if;
 if p_enabled is null or (p_enabled and (p_target is null or p_target<1000 or p_target>200000)) then raise exception 'Word target must be between 1000 and 200000';end if;
 if p_date is not null and (p_date<'2000-01-01'::date or p_date>'2200-12-31'::date) then raise exception 'Choose a valid target date';end if;
 update public.books set metadata=(coalesce(metadata,'{}'::jsonb)||jsonb_build_object('writingGoal',jsonb_build_object('enabled',p_enabled,'targetWords',case when p_enabled then p_target else null end,'targetDate',case when p_enabled then p_date else null end)))||(case when p_enabled then jsonb_build_object('targetWordCount',p_target) else '{}'::jsonb end),updated_at=now() where id=p_book and user_id=(select auth.uid()) returning * into saved;
 if not found then raise exception 'Book unavailable' using errcode='42501';end if;
 return saved;
end;$$;
revoke all on function public.save_writing_goal(uuid,boolean,integer,date) from public,anon;
grant execute on function public.save_writing_goal(uuid,boolean,integer,date) to authenticated;
notify pgrst,'reload schema';
