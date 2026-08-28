create table if not exists public.event_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  name text not null,
  color_hex text not null default '#5B5FEF' check (color_hex ~ '^#[0-9A-Fa-f]{6}$'),
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.event_categories enable row level security;

drop policy if exists "public read event categories" on public.event_categories;
create policy "public read event categories" on public.event_categories for select using (active or (select public.is_staff()));
drop policy if exists "staff insert event categories" on public.event_categories;
create policy "staff insert event categories" on public.event_categories for insert with check ((select public.is_staff()));
drop policy if exists "staff update event categories" on public.event_categories;
create policy "staff update event categories" on public.event_categories for update using ((select public.is_staff())) with check ((select public.is_staff()));
drop policy if exists "staff delete event categories" on public.event_categories;
create policy "staff delete event categories" on public.event_categories for delete using ((select public.is_staff()));

drop trigger if exists trg_event_categories_updated_at on public.event_categories;
create trigger trg_event_categories_updated_at before update on public.event_categories for each row execute function public.set_updated_at();

insert into public.event_categories (slug,name,color_hex,sort_order) values
  ('general','General','#5B5FEF',10),('culto','Cultos y servicios','#8B5CF6',20),('oracion','Oración y ayuno','#10B981',30),
  ('cuidado','Visitación y cuidado','#F59E0B',40),('evangelismo','Evangelismo','#EF4444',50),('formacion','Formación y discipulado','#0EA5E9',60),
  ('jovenes','Jóvenes','#EC4899',70),('ninos','Niñez','#14B8A6',80),('especial','Actividad especial','#F97316',90)
on conflict (slug) do nothing;

alter table public.events
  add column if not exists category_id uuid references public.event_categories(id) on delete set null,
  add column if not exists recurrence_group_id uuid,
  add column if not exists recurrence_kind text not null default 'single',
  add column if not exists is_featured boolean not null default false,
  add column if not exists attendance_mode text not null default 'none',
  add column if not exists registration_deadline timestamptz,
  add column if not exists registered_count integer not null default 0,
  add column if not exists created_by uuid references public.profiles(id) on delete set null,
  add column if not exists notify_on_publish boolean not null default true;

do $$ begin
  if not exists (select 1 from pg_constraint where conname='events_recurrence_kind_check') then alter table public.events add constraint events_recurrence_kind_check check (recurrence_kind in ('single','weekly','monthly')); end if;
  if not exists (select 1 from pg_constraint where conname='events_attendance_mode_check') then alter table public.events add constraint events_attendance_mode_check check (attendance_mode in ('none','rsvp','registration')); end if;
  if not exists (select 1 from pg_constraint where conname='events_registered_count_check') then alter table public.events add constraint events_registered_count_check check (registered_count >= 0); end if;
  if not exists (select 1 from pg_constraint where conname='events_capacity_positive_check') then alter table public.events add constraint events_capacity_positive_check check (capacity is null or capacity > 0); end if;
end $$;

update public.events set category_id=(select id from public.event_categories where slug='general' limit 1) where category_id is null;
create index if not exists idx_events_calendar on public.events(starts_at) where deleted_at is null;
create index if not exists idx_events_category on public.events(category_id,starts_at) where deleted_at is null;
create index if not exists idx_events_recurrence_group on public.events(recurrence_group_id,starts_at) where recurrence_group_id is not null and deleted_at is null;
create index if not exists idx_events_featured on public.events(starts_at) where is_featured and status='published' and deleted_at is null;

alter table public.event_registrations
  add column if not exists registration_type text not null default 'registration',
  add column if not exists status text not null default 'active',
  add column if not exists party_size integer not null default 1,
  add column if not exists updated_at timestamptz not null default now();

do $$ begin
  if not exists (select 1 from pg_constraint where conname='event_registrations_type_check') then alter table public.event_registrations add constraint event_registrations_type_check check (registration_type in ('rsvp','registration')); end if;
  if not exists (select 1 from pg_constraint where conname='event_registrations_status_check') then alter table public.event_registrations add constraint event_registrations_status_check check (status in ('active','cancelled')); end if;
  if not exists (select 1 from pg_constraint where conname='event_registrations_party_size_check') then alter table public.event_registrations add constraint event_registrations_party_size_check check (party_size between 1 and 20); end if;
end $$;

create unique index if not exists uq_event_registration_active_user on public.event_registrations(event_id,user_id) where user_id is not null and status='active';
create index if not exists idx_event_registrations_event_active on public.event_registrations(event_id,status);
drop trigger if exists trg_event_registrations_updated_at on public.event_registrations;
create trigger trg_event_registrations_updated_at before update on public.event_registrations for each row execute function public.set_updated_at();

drop policy if exists "insert registration" on public.event_registrations;
drop policy if exists "own registrations" on public.event_registrations;
drop policy if exists "authenticated insert own registration" on public.event_registrations;
create policy "authenticated insert own registration" on public.event_registrations for insert to authenticated with check (user_id=(select auth.uid()));
drop policy if exists "own or staff read registrations" on public.event_registrations;
create policy "own or staff read registrations" on public.event_registrations for select to authenticated using (user_id=(select auth.uid()) or (select public.is_staff()));
drop policy if exists "own update registrations" on public.event_registrations;
create policy "own update registrations" on public.event_registrations for update to authenticated using (user_id=(select auth.uid())) with check (user_id=(select auth.uid()));
drop policy if exists "own delete registrations" on public.event_registrations;
create policy "own delete registrations" on public.event_registrations for delete to authenticated using (user_id=(select auth.uid()));

create or replace function private.enforce_event_registration() returns trigger language plpgsql security definer set search_path=public,private,pg_temp as $$
declare v_event public.events%rowtype; v_taken integer;
begin
  if new.user_id is null then raise exception 'Debes iniciar sesión para confirmar asistencia.' using errcode='42501'; end if;
  if new.status='cancelled' then return new; end if;
  select * into v_event from public.events where id=new.event_id for update;
  if not found or v_event.deleted_at is not null or v_event.status::text<>'published' then raise exception 'El evento no está disponible.' using errcode='22023'; end if;
  if v_event.starts_at<=now() then raise exception 'El evento ya comenzó.' using errcode='22023'; end if;
  if v_event.registration_deadline is not null and v_event.registration_deadline<now() then raise exception 'La inscripción ya cerró.' using errcode='22023'; end if;
  if v_event.attendance_mode='none' or v_event.attendance_mode<>new.registration_type then raise exception 'Este evento no admite este tipo de confirmación.' using errcode='22023'; end if;
  if v_event.capacity is not null then
    select coalesce(sum(party_size),0)::integer into v_taken from public.event_registrations where event_id=new.event_id and status='active' and id is distinct from new.id;
    if v_taken+new.party_size>v_event.capacity then raise exception 'No quedan suficientes cupos.' using errcode='22023'; end if;
  end if;
  return new;
end $$;
revoke all on function private.enforce_event_registration() from public,anon,authenticated;
drop trigger if exists trg_enforce_event_registration on public.event_registrations;
create trigger trg_enforce_event_registration before insert or update of event_id,user_id,registration_type,status,party_size on public.event_registrations for each row execute function private.enforce_event_registration();

create or replace function private.sync_event_registered_count() returns trigger language plpgsql security definer set search_path=public,private,pg_temp as $$
declare v_event_id uuid;
begin
  v_event_id=coalesce(new.event_id,old.event_id);
  update public.events e set registered_count=(select coalesce(sum(r.party_size),0)::integer from public.event_registrations r where r.event_id=v_event_id and r.status='active') where e.id=v_event_id;
  if tg_op='UPDATE' and old.event_id is distinct from new.event_id then update public.events e set registered_count=(select coalesce(sum(r.party_size),0)::integer from public.event_registrations r where r.event_id=old.event_id and r.status='active') where e.id=old.event_id; end if;
  return coalesce(new,old);
end $$;
revoke all on function private.sync_event_registered_count() from public,anon,authenticated;
drop trigger if exists trg_sync_event_registered_count on public.event_registrations;
create trigger trg_sync_event_registered_count after insert or update or delete on public.event_registrations for each row execute function private.sync_event_registered_count();
update public.events e set registered_count=(select coalesce(sum(r.party_size),0)::integer from public.event_registrations r where r.event_id=e.id and r.status='active');

alter table public.announcements add column if not exists is_featured boolean not null default false, add column if not exists display_on_agenda boolean not null default true, add column if not exists event_id uuid references public.events(id) on delete set null;
create index if not exists idx_announcements_agenda on public.announcements(priority desc,publish_at desc) where display_on_agenda and status='published' and deleted_at is null;

create or replace function private.trigger_event_published_push() returns trigger language plpgsql security definer set search_path=private,public,pg_temp as $$
begin
  if new.deleted_at is null and new.status::text='published' and new.notify_on_publish and new.starts_at>now() and (tg_op='INSERT' or old.status::text is distinct from 'published') then
    perform private.enqueue_push_dispatch('event:published:'||new.id,jsonb_build_object('action','category','category','events','payload',jsonb_build_object('title','Nueva actividad: '||left(new.name,100),'body',case when new.location is not null and length(trim(new.location))>0 then 'Consulta fecha, hora y ubicación en la agenda.' else 'Consulta fecha y hora en la agenda.' end,'url','/eventos/'||new.slug,'tag','event-published-'||new.id)),now());
  end if;
  return new;
end $$;
revoke all on function private.trigger_event_published_push() from public,anon,authenticated;
drop trigger if exists trg_event_published_push on public.events;
create trigger trg_event_published_push after insert or update of status on public.events for each row execute function private.trigger_event_published_push();
