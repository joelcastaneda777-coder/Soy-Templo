-- ============================================================
-- Readiness hardening: privileged helpers, RLS, roles and Radio
-- Requires 0010_add_staff_roles.sql to have committed first.
-- ============================================================

create schema if not exists private;
grant usage on schema private to anon, authenticated, service_role;

create or replace function private.has_role(check_role public.app_role)
returns boolean language sql stable security definer
set search_path = public, pg_temp
as $$
  select auth.uid() is not null and exists (
    select 1 from public.user_roles
    where user_id = auth.uid()
      and (role = check_role or (check_role = 'admin'::public.app_role and role = 'superadmin'::public.app_role))
  );
$$;

create or replace function private.is_staff()
returns boolean language sql stable security definer
set search_path = public, pg_temp
as $$
  select auth.uid() is not null and exists (
    select 1 from public.user_roles
    where user_id = auth.uid()
      and role in ('pastor'::public.app_role,'editor'::public.app_role,'admin'::public.app_role,'superadmin'::public.app_role)
  );
$$;

revoke all on function private.has_role(public.app_role) from public;
revoke all on function private.is_staff() from public;
grant execute on function private.has_role(public.app_role) to anon, authenticated, service_role;
grant execute on function private.is_staff() to anon, authenticated, service_role;

create or replace function public.has_role(check_role public.app_role)
returns boolean language sql stable security invoker
set search_path = public, pg_temp
as $$ select private.has_role(check_role); $$;

create or replace function public.is_staff()
returns boolean language sql stable security invoker
set search_path = public, pg_temp
as $$ select private.is_staff(); $$;

revoke all on function public.has_role(public.app_role) from public;
revoke all on function public.is_staff() from public;
grant execute on function public.has_role(public.app_role) to anon, authenticated, service_role;
grant execute on function public.is_staff() to anon, authenticated, service_role;

create or replace function private.delete_own_account()
returns void language plpgsql security definer
set search_path = public, auth, pg_temp
as $$
declare target_user uuid := auth.uid();
begin
  if target_user is null then raise exception 'Authentication required'; end if;
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
revoke all on function private.delete_own_account() from public;
grant execute on function private.delete_own_account() to authenticated, service_role;

create or replace function public.delete_own_account()
returns void language sql security invoker
set search_path = public, pg_temp
as $$ select private.delete_own_account(); $$;
revoke all on function public.delete_own_account() from public;
grant execute on function public.delete_own_account() to authenticated, service_role;

alter function public.set_updated_at() set search_path = public, pg_temp;
revoke all on function public.set_updated_at() from public;
revoke execute on function public.set_updated_at() from anon, authenticated;
grant execute on function public.set_updated_at() to service_role;

alter function public.handle_new_user() set search_path = public, pg_temp;
revoke all on function public.handle_new_user() from public;
revoke execute on function public.handle_new_user() from anon, authenticated;
grant execute on function public.handle_new_user() to service_role;

-- Provider receipts are server-only.
do $$ begin
  if to_regclass('public.plus_provider_receipts') is not null then
    execute 'alter table public.plus_provider_receipts set schema private';
  end if;
end $$;
revoke all on table private.plus_provider_receipts from public, anon, authenticated;
grant select, insert, update, delete on table private.plus_provider_receipts to service_role;

-- Optimized user-owned RLS.
drop policy if exists "own favorites" on public.devotional_favorites;
create policy "own favorites" on public.devotional_favorites for all using (user_id=(select auth.uid())) with check (user_id=(select auth.uid()));
drop policy if exists "own reads" on public.devotional_reads;
create policy "own reads" on public.devotional_reads for all using (user_id=(select auth.uid())) with check (user_id=(select auth.uid()));
drop policy if exists "own notes" on public.lesson_notes;
create policy "own notes" on public.lesson_notes for all using (user_id=(select auth.uid())) with check (user_id=(select auth.uid()));
drop policy if exists "own prefs" on public.notification_preferences;
create policy "own prefs" on public.notification_preferences for all using (user_id=(select auth.uid())) with check (user_id=(select auth.uid()));
drop policy if exists "own progress" on public.user_plan_progress;
create policy "own progress" on public.user_plan_progress for all using (user_id=(select auth.uid())) with check (user_id=(select auth.uid()));
drop policy if exists "praying interactions" on public.prayer_interactions;
create policy "praying interactions" on public.prayer_interactions for all using (user_id=(select auth.uid())) with check (user_id=(select auth.uid()));

drop policy if exists "insert registration" on public.event_registrations;
create policy "insert registration" on public.event_registrations for insert with check (user_id=(select auth.uid()) or user_id is null);
drop policy if exists "own registrations" on public.event_registrations;
create policy "own registrations" on public.event_registrations for select using (user_id=(select auth.uid()) or (select public.has_role('admin'::public.app_role)));

drop policy if exists "insert donation" on public.donations;
create policy "insert donation" on public.donations for insert with check (user_id=(select auth.uid()) or user_id is null);
drop policy if exists "own donations read" on public.donations;
create policy "own donations read" on public.donations for select using (user_id=(select auth.uid()) or (select public.has_role('admin'::public.app_role)));

drop policy if exists "insert prayer" on public.prayer_requests;
create policy "insert prayer" on public.prayer_requests for insert with check (user_id=(select auth.uid()) or user_id is null);
drop policy if exists "public read approved public prayers" on public.prayer_requests;
create policy "public read approved public prayers" on public.prayer_requests for select using ((is_public and status in ('approved'::public.prayer_status,'answered'::public.prayer_status) and deleted_at is null) or user_id=(select auth.uid()) or (select public.has_role('admin'::public.app_role)));
drop policy if exists "update own prayer" on public.prayer_requests;
create policy "update own prayer" on public.prayer_requests for update using (user_id=(select auth.uid()) or (select public.has_role('admin'::public.app_role))) with check (user_id=(select auth.uid()) or (select public.has_role('admin'::public.app_role)));

drop policy if exists "own profile read" on public.profiles;
create policy "own profile read" on public.profiles for select using (id=(select auth.uid()) or (select public.has_role('admin'::public.app_role)));
drop policy if exists "own profile update" on public.profiles;
create policy "own profile update" on public.profiles for update using (id=(select auth.uid())) with check (id=(select auth.uid()));

drop policy if exists "own plus subscription read" on public.plus_subscriptions;
drop policy if exists "admin plus subscription read" on public.plus_subscriptions;
drop policy if exists "own or admin plus subscription read" on public.plus_subscriptions;
create policy "own or admin plus subscription read" on public.plus_subscriptions for select using (user_id=(select auth.uid()) or (select public.has_role('admin'::public.app_role)));

drop policy if exists "own roles read" on public.user_roles;
create policy "own roles read" on public.user_roles for select using (user_id=(select auth.uid()) or (select public.has_role('admin'::public.app_role)));
drop policy if exists "admin roles" on public.user_roles;
drop policy if exists "admin insert roles" on public.user_roles;
drop policy if exists "admin update roles" on public.user_roles;
drop policy if exists "admin delete roles" on public.user_roles;
create policy "admin insert roles" on public.user_roles for insert with check ((select public.has_role('admin'::public.app_role)));
create policy "admin update roles" on public.user_roles for update using ((select public.has_role('admin'::public.app_role))) with check ((select public.has_role('admin'::public.app_role)));
create policy "admin delete roles" on public.user_roles for delete using ((select public.has_role('admin'::public.app_role)));

-- Indexes for foreign keys and frequently joined ownership columns.
create index if not exists idx_announcements_created_by on public.announcements(created_by);
create index if not exists idx_app_settings_updated_by on public.app_settings(updated_by);
create index if not exists idx_audit_logs_actor_id on public.audit_logs(actor_id);
create index if not exists idx_authors_user_id on public.authors(user_id);
create index if not exists idx_bible_plans_author_id on public.bible_plans(author_id);
create index if not exists idx_devotional_category_links_category_id on public.devotional_category_links(category_id);
create index if not exists idx_devotional_favorites_devotional_id on public.devotional_favorites(devotional_id);
create index if not exists idx_devotional_reads_devotional_id on public.devotional_reads(devotional_id);
create index if not exists idx_devotionals_author_id on public.devotionals(author_id);
create index if not exists idx_devotionals_created_by on public.devotionals(created_by);
create index if not exists idx_donation_settlements_created_by on public.donation_settlements(created_by);
create index if not exists idx_donations_category_id on public.donations(category_id);
create index if not exists idx_event_registrations_user_id on public.event_registrations(user_id);
create index if not exists idx_events_ministry_id on public.events(ministry_id);
create index if not exists idx_lesson_notes_devotional_id on public.lesson_notes(devotional_id);
create index if not exists idx_lesson_notes_lesson_id on public.lesson_notes(lesson_id);
create index if not exists idx_lesson_notes_user_id on public.lesson_notes(user_id);
create index if not exists idx_media_files_uploaded_by on public.media_files(uploaded_by);
create index if not exists idx_notifications_created_by on public.notifications(created_by);
create index if not exists idx_payment_transactions_donation_id on public.payment_transactions(donation_id);
create index if not exists idx_payment_transactions_settlement_id on public.payment_transactions(settlement_id);
create index if not exists idx_prayer_interactions_prayer_id on public.prayer_interactions(prayer_id);
create index if not exists idx_prayer_requests_user_id on public.prayer_requests(user_id);
create index if not exists idx_profiles_ministry_id on public.profiles(ministry_id);
create index if not exists idx_push_subscriptions_user_id on public.push_subscriptions(user_id);
create index if not exists idx_sermons_created_by on public.sermons(created_by);
create index if not exists idx_user_plan_progress_plan_id on public.user_plan_progress(plan_id);
create index if not exists idx_user_roles_granted_by on public.user_roles(granted_by);

-- Radio archive metadata.
create table if not exists public.radio_programs (
  id uuid primary key default gen_random_uuid(), slug text not null unique, name text not null,
  description text, host_name text, cover_url text, schedule_text text,
  status public.content_status not null default 'draft', created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), deleted_at timestamptz
);
create table if not exists public.radio_episodes (
  id uuid primary key default gen_random_uuid(), program_id uuid not null references public.radio_programs(id) on delete cascade,
  slug text not null unique, title text not null, description text,
  duration_seconds integer check (duration_seconds is null or duration_seconds>=0),
  access_tier text not null default 'plus' check (access_tier in ('free','plus')),
  status public.content_status not null default 'draft', published_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), deleted_at timestamptz
);
create table if not exists public.radio_favorites (
  user_id uuid not null references auth.users(id) on delete cascade,
  episode_id uuid not null references public.radio_episodes(id) on delete cascade,
  created_at timestamptz not null default now(), primary key(user_id,episode_id)
);
create table if not exists public.radio_listen_later (
  user_id uuid not null references auth.users(id) on delete cascade,
  episode_id uuid not null references public.radio_episodes(id) on delete cascade,
  created_at timestamptz not null default now(), primary key(user_id,episode_id)
);
create table if not exists private.radio_episode_sources (
  episode_id uuid primary key references public.radio_episodes(id) on delete cascade,
  audio_path text, external_url text, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

alter table public.radio_programs enable row level security;
alter table public.radio_episodes enable row level security;
alter table public.radio_favorites enable row level security;
alter table public.radio_listen_later enable row level security;
revoke all on table private.radio_episode_sources from public, anon, authenticated;
grant select,insert,update,delete on table private.radio_episode_sources to service_role;

create index if not exists idx_radio_programs_status on public.radio_programs(status,created_at desc) where deleted_at is null;
create index if not exists idx_radio_episodes_program on public.radio_episodes(program_id,published_at desc) where deleted_at is null;
create index if not exists idx_radio_episodes_access on public.radio_episodes(access_tier,status,published_at desc) where deleted_at is null;
create index if not exists idx_radio_programs_created_by on public.radio_programs(created_by);
create index if not exists idx_radio_episodes_created_by on public.radio_episodes(created_by);
create index if not exists idx_radio_favorites_episode on public.radio_favorites(episode_id);
create index if not exists idx_radio_listen_later_episode on public.radio_listen_later(episode_id);

drop policy if exists "public read published radio programs" on public.radio_programs;
create policy "public read published radio programs" on public.radio_programs for select using (deleted_at is null and (status='published'::public.content_status or (select public.is_staff())));
drop policy if exists "staff insert radio programs" on public.radio_programs;
create policy "staff insert radio programs" on public.radio_programs for insert with check ((select public.is_staff()));
drop policy if exists "staff update radio programs" on public.radio_programs;
create policy "staff update radio programs" on public.radio_programs for update using ((select public.is_staff())) with check ((select public.is_staff()));
drop policy if exists "staff delete radio programs" on public.radio_programs;
create policy "staff delete radio programs" on public.radio_programs for delete using ((select public.is_staff()));

drop policy if exists "public read accessible radio episodes" on public.radio_episodes;
drop policy if exists "public read published radio episode metadata" on public.radio_episodes;
create policy "public read published radio episode metadata" on public.radio_episodes for select using (deleted_at is null and (status='published'::public.content_status or (select public.is_staff())));
drop policy if exists "staff insert radio episodes" on public.radio_episodes;
create policy "staff insert radio episodes" on public.radio_episodes for insert with check ((select public.is_staff()));
drop policy if exists "staff update radio episodes" on public.radio_episodes;
create policy "staff update radio episodes" on public.radio_episodes for update using ((select public.is_staff())) with check ((select public.is_staff()));
drop policy if exists "staff delete radio episodes" on public.radio_episodes;
create policy "staff delete radio episodes" on public.radio_episodes for delete using ((select public.is_staff()));

drop policy if exists "own radio favorites" on public.radio_favorites;
create policy "own radio favorites" on public.radio_favorites for all using (user_id=(select auth.uid())) with check (user_id=(select auth.uid()));
drop policy if exists "own radio listen later" on public.radio_listen_later;
create policy "own radio listen later" on public.radio_listen_later for all using (user_id=(select auth.uid())) with check (user_id=(select auth.uid()));

drop trigger if exists trg_radio_programs_updated on public.radio_programs;
create trigger trg_radio_programs_updated before update on public.radio_programs for each row execute function public.set_updated_at();
drop trigger if exists trg_radio_episodes_updated on public.radio_episodes;
create trigger trg_radio_episodes_updated before update on public.radio_episodes for each row execute function public.set_updated_at();

create or replace function private.get_radio_episode_source(target_episode uuid)
returns table(audio_path text,external_url text)
language sql stable security definer set search_path=public,private,pg_temp
as $$
  select s.audio_path,s.external_url from public.radio_episodes e
  join private.radio_episode_sources s on s.episode_id=e.id
  where e.id=target_episode and e.deleted_at is null and e.status='published'::public.content_status
    and (e.access_tier='free' or private.has_plus() or private.is_staff()) limit 1;
$$;
revoke all on function private.get_radio_episode_source(uuid) from public;
grant execute on function private.get_radio_episode_source(uuid) to anon,authenticated,service_role;

create or replace function public.get_radio_episode_source(target_episode uuid)
returns table(audio_path text,external_url text)
language sql stable security invoker set search_path=public,pg_temp
as $$ select * from private.get_radio_episode_source(target_episode); $$;
revoke all on function public.get_radio_episode_source(uuid) from public;
grant execute on function public.get_radio_episode_source(uuid) to anon,authenticated,service_role;

create or replace function private.set_radio_episode_source(target_episode uuid,new_audio_path text default null,new_external_url text default null)
returns void language plpgsql security definer set search_path=public,private,pg_temp
as $$
begin
  if not private.is_staff() then raise exception 'Not authorized'; end if;
  if not exists(select 1 from public.radio_episodes where id=target_episode and deleted_at is null) then raise exception 'Episode not found'; end if;
  insert into private.radio_episode_sources(episode_id,audio_path,external_url)
  values(target_episode,nullif(trim(new_audio_path),''),nullif(trim(new_external_url),''))
  on conflict(episode_id) do update set audio_path=excluded.audio_path,external_url=excluded.external_url,updated_at=now();
end;
$$;
revoke all on function private.set_radio_episode_source(uuid,text,text) from public;
grant execute on function private.set_radio_episode_source(uuid,text,text) to authenticated,service_role;

create or replace function public.set_radio_episode_source(target_episode uuid,new_audio_path text default null,new_external_url text default null)
returns void language sql security invoker set search_path=public,pg_temp
as $$ select private.set_radio_episode_source(target_episode,new_audio_path,new_external_url); $$;
revoke all on function public.set_radio_episode_source(uuid,text,text) from public;
grant execute on function public.set_radio_episode_source(uuid,text,text) to authenticated,service_role;

-- Private storage for future uploaded episodes. Playback is delivered through short-lived signed URLs.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('radio-archive','radio-archive',false,104857600,array['audio/mpeg','audio/mp4','audio/aac','audio/ogg','audio/webm'])
on conflict(id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;

drop policy if exists "staff upload radio archive" on storage.objects;
create policy "staff upload radio archive" on storage.objects for insert to authenticated with check (bucket_id='radio-archive' and (select public.is_staff()));
drop policy if exists "staff update radio archive" on storage.objects;
create policy "staff update radio archive" on storage.objects for update to authenticated using (bucket_id='radio-archive' and (select public.is_staff())) with check (bucket_id='radio-archive' and (select public.is_staff()));
drop policy if exists "staff delete radio archive" on storage.objects;
create policy "staff delete radio archive" on storage.objects for delete to authenticated using (bucket_id='radio-archive' and (select public.is_staff()));
