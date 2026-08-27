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
      and (
        (
          s.status in ('trialing','active','grace_period')
          and (s.current_period_end is null or s.current_period_end > now())
        )
        or (
          s.status = 'canceled'
          and s.current_period_end is not null
          and s.current_period_end > now()
        )
      )
  );
$$;
