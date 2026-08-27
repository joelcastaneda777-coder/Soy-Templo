create index if not exists care_assignments_assigned_by_idx on public.care_assignments(assigned_by);
create index if not exists care_request_notes_author_idx on public.care_request_notes(author_id);
create index if not exists care_team_members_added_by_idx on public.care_team_members(added_by);
create index if not exists staff_access_invites_claimed_user_idx on public.staff_access_invites(claimed_user_id);
create index if not exists staff_access_invites_invited_by_idx on public.staff_access_invites(invited_by);

drop policy if exists "admins manage care team" on public.care_team_members;
create policy "admins insert care team" on public.care_team_members
for insert to authenticated
with check ((select private.is_care_admin()));
create policy "admins update care team" on public.care_team_members
for update to authenticated
using ((select private.is_care_admin()))
with check ((select private.is_care_admin()));
create policy "admins delete care team" on public.care_team_members
for delete to authenticated
using ((select private.is_care_admin()));

drop policy if exists "triage manages care assignments" on public.care_assignments;
create policy "triage inserts care assignments" on public.care_assignments
for insert to authenticated
with check ((select private.is_care_triager()));
create policy "triage updates care assignments" on public.care_assignments
for update to authenticated
using ((select private.is_care_triager()))
with check ((select private.is_care_triager()));
create policy "triage deletes care assignments" on public.care_assignments
for delete to authenticated
using ((select private.is_care_triager()));
