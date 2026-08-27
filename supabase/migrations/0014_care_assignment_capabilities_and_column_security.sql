create or replace function private.validate_care_assignment()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  target_type text;
  member public.care_team_members%rowtype;
begin
  select request_type into target_type
  from public.care_requests
  where id = new.request_id and deleted_at is null;

  if target_type is null then
    raise exception 'Care request not found';
  end if;

  select * into member
  from public.care_team_members
  where user_id = new.user_id and active;

  if not found then
    raise exception 'Assignee is not an active care team member';
  end if;

  if target_type = 'counseling' and not member.can_counseling then
    raise exception 'Assignee is not enabled for counseling';
  elsif target_type = 'hospital_visit' and not member.can_hospital_visit then
    raise exception 'Assignee is not enabled for hospital visitation';
  elsif target_type = 'home_visit' and not member.can_home_visit then
    raise exception 'Assignee is not enabled for home visitation';
  end if;

  return new;
end;
$$;

revoke all on function private.validate_care_assignment() from public, anon, authenticated;

drop trigger if exists validate_care_assignment on public.care_assignments;
create trigger validate_care_assignment
before insert or update of user_id, request_id on public.care_assignments
for each row execute function private.validate_care_assignment();

revoke update on public.care_requests from authenticated;
grant update (status, completed_at) on public.care_requests to authenticated;
