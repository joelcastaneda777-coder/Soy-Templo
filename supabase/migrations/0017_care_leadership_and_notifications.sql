-- Liderazgo pastoral configurable + centro interno de notificaciones.
alter table public.care_team_members
  add column if not exists ministry_title text,
  add column if not exists is_supervisor boolean not null default false,
  add column if not exists lead_prayer boolean not null default false,
  add column if not exists lead_counseling boolean not null default false,
  add column if not exists lead_hospital_visit boolean not null default false,
  add column if not exists lead_home_visit boolean not null default false,
  add column if not exists can_assign boolean not null default false,
  add column if not exists can_manage_status boolean not null default true,
  add column if not exists notify_urgent boolean not null default true,
  add column if not exists notify_assignment boolean not null default true;
alter table public.care_team_members alter column notify_new_requests set default false;

create table if not exists public.user_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('care_new','care_urgent','care_assignment','care_status')),
  title text not null check (char_length(title) between 1 and 160),
  body text not null check (char_length(body) between 1 and 500),
  url text not null default '/',
  related_care_request_id uuid references public.care_requests(id) on delete cascade,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists idx_user_notifications_user_created on public.user_notifications(user_id, created_at desc);
create index if not exists idx_user_notifications_unread on public.user_notifications(user_id, created_at desc) where read_at is null;
create index if not exists idx_user_notifications_care_request on public.user_notifications(related_care_request_id) where related_care_request_id is not null;
alter table public.user_notifications enable row level security;
create policy "users read own notifications" on public.user_notifications for select to authenticated using (user_id = (select auth.uid()));
create policy "users update own notifications" on public.user_notifications for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "users delete own notifications" on public.user_notifications for delete to authenticated using (user_id = (select auth.uid()));
revoke all on public.user_notifications from anon;
grant select, update, delete on public.user_notifications to authenticated;

create or replace function private.is_care_area_lead(target_type text) returns boolean language sql stable security definer set search_path=public,pg_temp as $$
  select auth.uid() is not null and exists (
    select 1 from public.care_team_members ctm where ctm.user_id=auth.uid() and ctm.active and (
      ctm.is_supervisor or ctm.can_triage or
      (target_type='prayer' and ctm.lead_prayer) or
      (target_type='counseling' and ctm.lead_counseling) or
      (target_type='hospital_visit' and ctm.lead_hospital_visit) or
      (target_type='home_visit' and ctm.lead_home_visit)
    )
  );
$$;

create or replace function private.can_access_care_request(target_request uuid) returns boolean language sql stable security definer set search_path=public,pg_temp as $$
  select private.is_care_admin()
    or exists (select 1 from public.care_requests cr where cr.id=target_request and cr.deleted_at is null and private.is_care_area_lead(cr.request_type))
    or exists (select 1 from public.care_assignments ca join public.care_team_members ctm on ctm.user_id=ca.user_id where ca.request_id=target_request and ca.user_id=auth.uid() and ctm.active);
$$;

create or replace function private.can_manage_care_request(target_request uuid) returns boolean language sql stable security definer set search_path=public,pg_temp as $$
  select private.is_care_admin() or exists (select 1 from public.care_team_members ctm where ctm.user_id=auth.uid() and ctm.active and ctm.can_manage_status and private.can_access_care_request(target_request));
$$;

create or replace function private.can_assign_care_request(target_request uuid) returns boolean language sql stable security definer set search_path=public,pg_temp as $$
  select private.is_care_admin() or exists (
    select 1 from public.care_requests cr join public.care_team_members ctm on ctm.user_id=auth.uid()
    where cr.id=target_request and cr.deleted_at is null and ctm.active and ctm.can_assign and (
      ctm.is_supervisor or ctm.can_triage or
      (cr.request_type='counseling' and ctm.lead_counseling) or
      (cr.request_type='hospital_visit' and ctm.lead_hospital_visit) or
      (cr.request_type='home_visit' and ctm.lead_home_visit)
    )
  );
$$;

create or replace function private.can_manage_prayer() returns boolean language sql stable security definer set search_path=public,pg_temp as $$
  select private.is_care_admin() or exists (select 1 from public.care_team_members ctm where ctm.user_id=auth.uid() and ctm.active and (ctm.is_supervisor or ctm.can_triage or ctm.lead_prayer or ctm.can_prayer_followup));
$$;

create or replace function private.is_active_care_member() returns boolean language sql stable security definer set search_path=public,pg_temp as $$
  select auth.uid() is not null and exists (select 1 from public.care_team_members ctm where ctm.user_id=auth.uid() and ctm.active);
$$;
create or replace function private.is_active_care_team_user(target_user uuid) returns boolean language sql stable security definer set search_path=public,pg_temp as $$
  select exists (select 1 from public.care_team_members ctm where ctm.user_id=target_user and ctm.active);
$$;

drop policy if exists "care team updates assigned requests" on public.care_requests;
drop policy if exists "authorized care team updates requests" on public.care_requests;
create policy "authorized care team updates requests" on public.care_requests for update to authenticated using ((select private.can_manage_care_request(care_requests.id))) with check ((select private.can_manage_care_request(care_requests.id)));
revoke update on public.care_requests from authenticated;
grant update(status,completed_at,updated_at) on public.care_requests to authenticated;

drop policy if exists "triage inserts care assignments" on public.care_assignments;
drop policy if exists "authorized care leaders insert assignments" on public.care_assignments;
create policy "authorized care leaders insert assignments" on public.care_assignments for insert to authenticated with check ((select private.can_assign_care_request(care_assignments.request_id)));
drop policy if exists "triage updates care assignments" on public.care_assignments;
drop policy if exists "authorized care leaders update assignments" on public.care_assignments;
create policy "authorized care leaders update assignments" on public.care_assignments for update to authenticated using ((select private.can_assign_care_request(care_assignments.request_id))) with check ((select private.can_assign_care_request(care_assignments.request_id)));
drop policy if exists "triage deletes care assignments" on public.care_assignments;
drop policy if exists "authorized care leaders delete assignments" on public.care_assignments;
create policy "authorized care leaders delete assignments" on public.care_assignments for delete to authenticated using ((select private.can_assign_care_request(care_assignments.request_id)));
drop policy if exists "read own care assignments" on public.care_assignments;
drop policy if exists "care team reads accessible assignments" on public.care_assignments;
create policy "care team reads accessible assignments" on public.care_assignments for select to authenticated using (user_id=(select auth.uid()) or (select private.can_access_care_request(care_assignments.request_id)));

drop policy if exists "moderate prayer requests" on public.prayer_requests;
drop policy if exists "authorized care team moderates prayer requests" on public.prayer_requests;
create policy "authorized care team moderates prayer requests" on public.prayer_requests for update to authenticated using ((select private.can_manage_prayer())) with check ((select private.can_manage_prayer()));
drop policy if exists "public read approved public prayers" on public.prayer_requests;
create policy "public read approved public prayers" on public.prayer_requests for select using (deleted_at is null and ((is_public and status=any(array['approved'::public.prayer_status,'answered'::public.prayer_status])) or user_id=(select auth.uid()) or (select private.can_manage_prayer())));

drop policy if exists "read care team membership" on public.care_team_members;
drop policy if exists "care team reads active directory" on public.care_team_members;
create policy "care team reads active directory" on public.care_team_members for select to authenticated using (user_id=(select auth.uid()) or (select private.is_care_admin()) or ((select private.is_active_care_member()) and active));

drop policy if exists "own profile read" on public.profiles;
drop policy if exists "own staff or care directory profile read" on public.profiles;
create policy "own staff or care directory profile read" on public.profiles for select to authenticated using (id=(select auth.uid()) or (select has_role('admin'::public.app_role)) or ((select private.is_active_care_member()) and (select private.is_active_care_team_user(profiles.id))));
