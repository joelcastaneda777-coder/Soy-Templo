create schema if not exists private;

grant usage on schema private to anon, authenticated;

create or replace function private.has_plus()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select auth.uid() is not null and exists (
    select 1
    from public.plus_subscriptions s
    where s.user_id = auth.uid()
      and s.status in ('trialing','active','grace_period')
      and (s.current_period_end is null or s.current_period_end > now())
  );
$$;

revoke all on function private.has_plus() from public;
grant execute on function private.has_plus() to anon, authenticated;

drop policy if exists "public read lessons of accessible published plans" on public.bible_plan_lessons;
create policy "public read lessons of accessible published plans"
  on public.bible_plan_lessons for select
  using (
    exists (
      select 1
      from public.bible_plans p
      where p.id = bible_plan_lessons.plan_id
        and p.deleted_at is null
        and (p.status = 'published' or is_staff())
        and (p.access_tier = 'free' or private.has_plus() or is_staff())
    )
  );

drop function if exists public.has_plus();
