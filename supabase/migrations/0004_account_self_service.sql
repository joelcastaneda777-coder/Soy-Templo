create or replace function public.delete_own_account()
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  target_user uuid := auth.uid();
begin
  if target_user is null then
    raise exception 'Authentication required';
  end if;

  update public.announcements set created_by = null where created_by = target_user;
  update public.app_settings set updated_by = null where updated_by = target_user;
  update public.devotionals set created_by = null where created_by = target_user;
  update public.media_files set uploaded_by = null where uploaded_by = target_user;
  update public.notifications set created_by = null where created_by = target_user;
  update public.sermons set created_by = null where created_by = target_user;
  update public.user_roles set granted_by = null where granted_by = target_user;

  delete from public.push_subscriptions where user_id = target_user;
  delete from public.event_registrations where user_id = target_user;
  delete from public.prayer_requests where user_id = target_user;

  delete from auth.users where id = target_user;
end;
$$;

revoke all on function public.delete_own_account() from public;
grant execute on function public.delete_own_account() to authenticated;
