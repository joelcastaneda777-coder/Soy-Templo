create index if not exists idx_events_created_by on public.events(created_by) where created_by is not null;
create index if not exists idx_announcements_event_id on public.announcements(event_id) where event_id is not null;

create or replace function private.sync_event_registered_count()
returns trigger
language plpgsql
security definer
set search_path=public,private,pg_temp
as $$
declare
  v_event_id uuid;
  v_old_event_id uuid;
begin
  if tg_op = 'DELETE' then
    v_event_id := old.event_id;
  else
    v_event_id := new.event_id;
    if tg_op = 'UPDATE' then v_old_event_id := old.event_id; end if;
  end if;

  update public.events e
  set registered_count=(
    select coalesce(sum(r.party_size),0)::integer
    from public.event_registrations r
    where r.event_id=v_event_id and r.status='active'
  )
  where e.id=v_event_id;

  if tg_op='UPDATE' and v_old_event_id is distinct from v_event_id then
    update public.events e
    set registered_count=(
      select coalesce(sum(r.party_size),0)::integer
      from public.event_registrations r
      where r.event_id=v_old_event_id and r.status='active'
    )
    where e.id=v_old_event_id;
  end if;

  if tg_op='DELETE' then return old; end if;
  return new;
end $$;
revoke all on function private.sync_event_registered_count() from public,anon,authenticated;
