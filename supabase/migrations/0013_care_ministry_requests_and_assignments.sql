create table if not exists public.care_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  request_type text not null check (request_type in ('counseling','hospital_visit','home_visit')),
  requester_name text not null check (char_length(btrim(requester_name)) between 2 and 120),
  contact_phone text,
  contact_email text,
  preferred_contact text not null default 'whatsapp' check (preferred_contact in ('whatsapp','phone','email')),
  message text not null check (char_length(btrim(message)) between 10 and 3000),
  priority text not null default 'normal' check (priority in ('normal','soon','urgent')),
  status text not null default 'new' check (status in ('new','reviewing','assigned','contacted','scheduled','completed','closed')),
  subject_name text,
  relationship_to_subject text,
  hospital_name text,
  room_details text,
  address text,
  municipality text,
  location_notes text,
  preferred_schedule text,
  consent_to_contact boolean not null default false,
  consent_to_visit boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint care_request_contact_required check (
    nullif(btrim(coalesce(contact_phone, '')), '') is not null
    or nullif(btrim(coalesce(contact_email, '')), '') is not null
  ),
  constraint care_hospital_fields check (
    request_type <> 'hospital_visit'
    or (
      nullif(btrim(coalesce(subject_name, '')), '') is not null
      and nullif(btrim(coalesce(hospital_name, '')), '') is not null
      and consent_to_visit
    )
  ),
  constraint care_home_fields check (
    request_type <> 'home_visit'
    or (
      nullif(btrim(coalesce(address, '')), '') is not null
      and consent_to_visit
    )
  )
);

create table if not exists public.care_team_members (
  user_id uuid primary key references auth.users(id) on delete cascade,
  can_counseling boolean not null default false,
  can_hospital_visit boolean not null default false,
  can_home_visit boolean not null default false,
  can_prayer_followup boolean not null default false,
  can_triage boolean not null default false,
  active boolean not null default true,
  notify_new_requests boolean not null default true,
  added_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.care_assignments (
  request_id uuid not null references public.care_requests(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  assigned_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  primary key (request_id, user_id)
);

create table if not exists public.care_request_notes (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.care_requests(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  note text not null check (char_length(btrim(note)) between 2 and 3000),
  created_at timestamptz not null default now()
);

create index if not exists care_requests_user_created_idx on public.care_requests(user_id, created_at desc);
create index if not exists care_requests_status_type_idx on public.care_requests(status, request_type, created_at desc) where deleted_at is null;
create index if not exists care_assignments_user_idx on public.care_assignments(user_id, created_at desc);
create index if not exists care_notes_request_idx on public.care_request_notes(request_id, created_at desc);

create trigger set_care_requests_updated_at
before update on public.care_requests
for each row execute function public.set_updated_at();

create trigger set_care_team_members_updated_at
before update on public.care_team_members
for each row execute function public.set_updated_at();

create or replace function private.is_care_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select auth.uid() is not null and exists (
    select 1 from public.user_roles ur
    where ur.user_id = auth.uid()
      and ur.role::text in ('admin','superadmin')
  );
$$;

create or replace function private.is_care_triager()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select private.is_care_admin() or exists (
    select 1 from public.care_team_members ctm
    where ctm.user_id = auth.uid()
      and ctm.active
      and ctm.can_triage
  );
$$;

create or replace function private.can_access_care_request(target_request uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select private.is_care_triager() or exists (
    select 1 from public.care_assignments ca
    join public.care_team_members ctm on ctm.user_id = ca.user_id
    where ca.request_id = target_request
      and ca.user_id = auth.uid()
      and ctm.active
  );
$$;

revoke all on function private.is_care_admin() from public;
revoke all on function private.is_care_triager() from public;
revoke all on function private.can_access_care_request(uuid) from public;
grant usage on schema private to anon, authenticated;
grant execute on function private.is_care_admin() to authenticated;
grant execute on function private.is_care_triager() to anon, authenticated;
grant execute on function private.can_access_care_request(uuid) to authenticated;

alter table public.care_requests enable row level security;
alter table public.care_team_members enable row level security;
alter table public.care_assignments enable row level security;
alter table public.care_request_notes enable row level security;

drop policy if exists "submit care request" on public.care_requests;
create policy "submit care request" on public.care_requests
for insert to anon, authenticated
with check ((user_id is null or user_id = (select auth.uid())) and consent_to_contact);

drop policy if exists "read own or assigned care requests" on public.care_requests;
create policy "read own or assigned care requests" on public.care_requests
for select to authenticated
using (
  deleted_at is null and (
    user_id = (select auth.uid())
    or (select private.can_access_care_request(id))
  )
);

drop policy if exists "care team updates assigned requests" on public.care_requests;
create policy "care team updates assigned requests" on public.care_requests
for update to authenticated
using ((select private.can_access_care_request(id)))
with check ((select private.can_access_care_request(id)));

drop policy if exists "read care team membership" on public.care_team_members;
create policy "read care team membership" on public.care_team_members
for select to authenticated
using (user_id = (select auth.uid()) or (select private.is_care_admin()));

drop policy if exists "admins manage care team" on public.care_team_members;
create policy "admins manage care team" on public.care_team_members
for all to authenticated
using ((select private.is_care_admin()))
with check ((select private.is_care_admin()));

drop policy if exists "read own care assignments" on public.care_assignments;
create policy "read own care assignments" on public.care_assignments
for select to authenticated
using (user_id = (select auth.uid()) or (select private.is_care_triager()));

drop policy if exists "triage manages care assignments" on public.care_assignments;
create policy "triage manages care assignments" on public.care_assignments
for all to authenticated
using ((select private.is_care_triager()))
with check ((select private.is_care_triager()));

drop policy if exists "care team reads notes" on public.care_request_notes;
create policy "care team reads notes" on public.care_request_notes
for select to authenticated
using ((select private.can_access_care_request(request_id)));

drop policy if exists "care team adds notes" on public.care_request_notes;
create policy "care team adds notes" on public.care_request_notes
for insert to authenticated
with check (author_id = (select auth.uid()) and (select private.can_access_care_request(request_id)));

drop policy if exists "authors or triage update notes" on public.care_request_notes;
create policy "authors or triage update notes" on public.care_request_notes
for update to authenticated
using (author_id = (select auth.uid()) or (select private.is_care_triager()))
with check (author_id = (select auth.uid()) or (select private.is_care_triager()));

drop policy if exists "triage deletes notes" on public.care_request_notes;
create policy "triage deletes notes" on public.care_request_notes
for delete to authenticated
using ((select private.is_care_triager()));

drop policy if exists "public read approved public prayers" on public.prayer_requests;
create policy "public read approved public prayers" on public.prayer_requests
for select to anon, authenticated
using (
  deleted_at is null and (
    (is_public and status in ('approved'::prayer_status, 'answered'::prayer_status))
    or user_id = (select auth.uid())
    or (select private.is_care_triager())
  )
);

drop policy if exists "update own prayer" on public.prayer_requests;
drop policy if exists "moderate prayer requests" on public.prayer_requests;
create policy "moderate prayer requests" on public.prayer_requests
for update to authenticated
using ((select private.is_care_triager()))
with check ((select private.is_care_triager()));

revoke delete on public.care_requests from anon, authenticated;
revoke delete on public.care_team_members from anon;
revoke delete on public.care_assignments from anon;
revoke all on public.care_request_notes from anon;
