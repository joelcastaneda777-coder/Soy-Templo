-- ============================================================
-- Soy Templo — Esquema inicial
-- Migración 0001: tablas, relaciones, índices, RLS
-- ============================================================

create extension if not exists "pgcrypto";

-- ---------- Tipos ----------
create type app_role as enum ('member', 'editor', 'admin');
create type content_status as enum ('draft', 'scheduled', 'published', 'archived');
create type plan_level as enum ('beginner', 'intermediate', 'advanced');
create type plan_state as enum ('active', 'paused', 'completed', 'restarted');
create type prayer_status as enum ('pending', 'approved', 'rejected', 'answered');
create type tx_status as enum ('created', 'pending', 'completed', 'failed', 'refunded', 'duplicate');
create type event_status as enum ('draft', 'published', 'cancelled');

-- ---------- Utilidades ----------
create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end; $$ language plpgsql;

-- ---------- Ministerios y autores ----------
create table ministries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table authors (
  id uuid primary key default gen_random_uuid(),
  display_name text not null,
  bio text,
  photo_url text,
  user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- ---------- Perfiles y roles ----------
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  phone text,
  ministry_id uuid references ministries(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table user_roles (
  user_id uuid not null references auth.users(id) on delete cascade,
  role app_role not null,
  granted_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  primary key (user_id, role)
);

-- Función de seguridad usada por políticas RLS y por la app
create or replace function has_role(check_role app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from user_roles
    where user_id = auth.uid() and role = check_role
  );
$$;

create or replace function is_staff()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from user_roles
    where user_id = auth.uid() and role in ('editor', 'admin')
  );
$$;

-- Crear perfil y rol de miembro automáticamente al registrarse
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, full_name) values (new.id, new.raw_user_meta_data->>'full_name');
  insert into user_roles (user_id, role) values (new.id, 'member');
  return new;
end; $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ---------- Devocionales ----------
create table devotional_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now()
);

create table devotionals (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  cover_url text,
  author_id uuid references authors(id) on delete set null,
  bible_reading text not null,          -- p. ej. "Salmo 46:1-11"
  key_verse text not null,              -- versículo destacado (referencia + texto propio/paráfrasis)
  reflection text not null,             -- cuerpo principal (markdown)
  application text,                     -- aplicación práctica
  questions text[],                     -- preguntas para meditar
  closing_prayer text,
  media_url text,                       -- audio o video opcional
  status content_status not null default 'draft',
  publish_at timestamptz,               -- programación
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table devotional_category_links (
  devotional_id uuid references devotionals(id) on delete cascade,
  category_id uuid references devotional_categories(id) on delete cascade,
  primary key (devotional_id, category_id)
);

create table devotional_favorites (
  user_id uuid references auth.users(id) on delete cascade,
  devotional_id uuid references devotionals(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, devotional_id)
);

create table devotional_reads (
  user_id uuid references auth.users(id) on delete cascade,
  devotional_id uuid references devotionals(id) on delete cascade,
  read_at timestamptz not null default now(),
  primary key (user_id, devotional_id)
);

-- ---------- Planes bíblicos ----------
create table bible_plans (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  cover_url text,
  duration_days int not null check (duration_days > 0),
  level plan_level not null default 'beginner',
  topic text,
  author_id uuid references authors(id) on delete set null,
  status content_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table bible_plan_lessons (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references bible_plans(id) on delete cascade,
  position int not null,
  title text not null,
  bible_reading text not null,
  explanation text not null,
  questions text[],
  activity text,
  prayer text,
  media_url text,
  resources jsonb default '[]'::jsonb,  -- [{name, url}]
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (plan_id, position)
);

create table user_plan_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_id uuid not null references bible_plans(id) on delete cascade,
  state plan_state not null default 'active',
  completed_lessons uuid[] not null default '{}',
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (user_id, plan_id)
);

create table lesson_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id uuid references bible_plan_lessons(id) on delete cascade,
  devotional_id uuid references devotionals(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (lesson_id is not null or devotional_id is not null)
);

-- ---------- Anuncios ----------
create table announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  image_url text,
  category text not null default 'general',  -- general|jovenes|ninos|mujeres|hombres|discipulado|servicio|creativo|especiales
  action_label text,
  action_url text,
  priority int not null default 0,
  publish_at timestamptz not null default now(),
  expires_at timestamptz,
  status content_status not null default 'draft',
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- ---------- Eventos ----------
create table events (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  starts_at timestamptz not null,
  ends_at timestamptz,
  location text,
  map_url text,
  image_url text,
  ministry_id uuid references ministries(id) on delete set null,
  capacity int,
  requires_registration boolean not null default false,
  stream_url text,
  contact_info text,
  status event_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table event_registrations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  guest_name text,
  guest_email text,
  created_at timestamptz not null default now(),
  unique (event_id, user_id)
);

-- ---------- Donaciones ----------
create table donation_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table donations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  category_id uuid references donation_categories(id) on delete set null,
  amount_cents int not null check (amount_cents > 0),
  currency text not null default 'USD',
  is_anonymous boolean not null default false,
  is_recurring boolean not null default false,
  donor_name text,
  donor_email text,
  created_at timestamptz not null default now()
);

create table payment_transactions (
  id uuid primary key default gen_random_uuid(),
  donation_id uuid not null references donations(id) on delete cascade,
  provider text not null,                       -- mock | wompi | stripe | bank_transfer ...
  reference_id text not null unique,            -- previene duplicados
  status tx_status not null default 'created',
  raw_payload jsonb,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- Peticiones de oración ----------
create table prayer_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  body text not null,
  category text not null default 'general',     -- salud|familia|provision|gratitud|general
  is_public boolean not null default false,
  is_anonymous boolean not null default false,
  allow_pastoral_contact boolean not null default false,
  contact_info text,
  status prayer_status not null default 'pending',
  answered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table prayer_interactions (
  user_id uuid references auth.users(id) on delete cascade,
  prayer_id uuid references prayer_requests(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, prayer_id)
);

-- ---------- Multimedia, notificaciones, configuración ----------
create table media_files (
  id uuid primary key default gen_random_uuid(),
  bucket text not null,
  path text not null,
  kind text not null default 'image',           -- image|audio|video|file
  title text,
  uploaded_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (bucket, path)
);

create table notifications (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  category text not null default 'general',     -- devocional|plan|evento|anuncio|transmision|donacion|ministerio|general
  target jsonb not null default '{"type":"all"}'::jsonb, -- {type: all|ministry|event|plan|role, id?}
  url text,
  sent_at timestamptz,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table notification_preferences (
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null,
  enabled boolean not null default true,
  primary key (user_id, category)
);

create table app_settings (
  key text primary key,
  value jsonb not null,
  updated_by uuid references auth.users(id),
  updated_at timestamptz not null default now()
);

create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity text not null,
  entity_id text,
  detail jsonb,
  created_at timestamptz not null default now()
);

-- ---------- Triggers updated_at ----------
do $$
declare t text;
begin
  foreach t in array array[
    'ministries','authors','profiles','devotionals','bible_plans','bible_plan_lessons',
    'user_plan_progress','lesson_notes','announcements','events','payment_transactions','prayer_requests'
  ] loop
    execute format('create trigger trg_%s_updated before update on %I for each row execute function set_updated_at()', t, t);
  end loop;
end $$;

-- ---------- Índices ----------
create index idx_devotionals_status_publish on devotionals (status, publish_at desc) where deleted_at is null;
create index idx_devotionals_slug on devotionals (slug);
create index idx_announcements_active on announcements (status, priority desc, publish_at desc) where deleted_at is null;
create index idx_events_upcoming on events (status, starts_at) where deleted_at is null;
create index idx_plans_status on bible_plans (status) where deleted_at is null;
create index idx_lessons_plan on bible_plan_lessons (plan_id, position);
create index idx_progress_user on user_plan_progress (user_id);
create index idx_prayers_public on prayer_requests (status, is_public, created_at desc) where deleted_at is null;
create index idx_tx_reference on payment_transactions (reference_id);
create index idx_donations_user on donations (user_id, created_at desc);
create index idx_audit_created on audit_logs (created_at desc);

-- ============================================================
-- RLS
-- ============================================================
alter table ministries enable row level security;
alter table authors enable row level security;
alter table profiles enable row level security;
alter table user_roles enable row level security;
alter table devotional_categories enable row level security;
alter table devotionals enable row level security;
alter table devotional_category_links enable row level security;
alter table devotional_favorites enable row level security;
alter table devotional_reads enable row level security;
alter table bible_plans enable row level security;
alter table bible_plan_lessons enable row level security;
alter table user_plan_progress enable row level security;
alter table lesson_notes enable row level security;
alter table announcements enable row level security;
alter table events enable row level security;
alter table event_registrations enable row level security;
alter table donation_categories enable row level security;
alter table donations enable row level security;
alter table payment_transactions enable row level security;
alter table prayer_requests enable row level security;
alter table prayer_interactions enable row level security;
alter table media_files enable row level security;
alter table notifications enable row level security;
alter table notification_preferences enable row level security;
alter table app_settings enable row level security;
alter table audit_logs enable row level security;

-- Lectura pública de contenido publicado
create policy "public read ministries" on ministries for select using (deleted_at is null);
create policy "public read authors" on authors for select using (deleted_at is null);
create policy "public read devotional categories" on devotional_categories for select using (true);
create policy "public read published devotionals" on devotionals for select
  using (deleted_at is null and (status = 'published' or is_staff()));
create policy "public read devotional links" on devotional_category_links for select using (true);
create policy "public read published plans" on bible_plans for select
  using (deleted_at is null and (status = 'published' or is_staff()));
create policy "public read lessons of published plans" on bible_plan_lessons for select
  using (exists (select 1 from bible_plans p where p.id = plan_id and p.deleted_at is null and (p.status = 'published' or is_staff())));
create policy "public read active announcements" on announcements for select
  using (deleted_at is null and (status = 'published' or is_staff()));
create policy "public read published events" on events for select
  using (deleted_at is null and (status = 'published' or is_staff()));
create policy "public read donation categories" on donation_categories for select using (is_active or is_staff());
create policy "public read approved public prayers" on prayer_requests for select
  using (
    (is_public and status in ('approved','answered') and deleted_at is null)
    or user_id = auth.uid()
    or has_role('admin')
  );

-- Datos propios del usuario
create policy "own profile read" on profiles for select using (id = auth.uid() or is_staff());
create policy "own profile update" on profiles for update using (id = auth.uid());
create policy "own roles read" on user_roles for select using (user_id = auth.uid() or has_role('admin'));
create policy "own favorites" on devotional_favorites for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own reads" on devotional_reads for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own progress" on user_plan_progress for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own notes" on lesson_notes for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own registrations" on event_registrations for select using (user_id = auth.uid() or has_role('admin'));
create policy "insert registration" on event_registrations for insert with check (user_id = auth.uid() or user_id is null);
create policy "own donations read" on donations for select using (user_id = auth.uid() or has_role('admin'));
create policy "insert donation" on donations for insert with check (user_id = auth.uid() or user_id is null);
create policy "own prefs" on notification_preferences for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "insert prayer" on prayer_requests for insert with check (user_id = auth.uid() or user_id is null);
create policy "update own prayer" on prayer_requests for update using (user_id = auth.uid() or has_role('admin'));
create policy "praying interactions" on prayer_interactions for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Gestión de contenido (editores y administradores)
create policy "staff write devotionals" on devotionals for all using (is_staff()) with check (is_staff());
create policy "staff write plans" on bible_plans for all using (is_staff()) with check (is_staff());
create policy "staff write lessons" on bible_plan_lessons for all using (is_staff()) with check (is_staff());
create policy "staff write announcements" on announcements for all using (is_staff()) with check (is_staff());
create policy "staff write events" on events for all using (is_staff()) with check (is_staff());
create policy "staff write authors" on authors for all using (is_staff()) with check (is_staff());
create policy "staff write categories" on devotional_categories for all using (is_staff()) with check (is_staff());
create policy "staff media" on media_files for all using (is_staff()) with check (is_staff());

-- Solo administradores
create policy "admin ministries" on ministries for all using (has_role('admin')) with check (has_role('admin'));
create policy "admin roles" on user_roles for all using (has_role('admin')) with check (has_role('admin'));
create policy "admin donation categories" on donation_categories for all using (has_role('admin')) with check (has_role('admin'));
create policy "admin transactions" on payment_transactions for select using (has_role('admin'));
create policy "admin notifications" on notifications for all using (has_role('admin')) with check (has_role('admin'));
create policy "admin settings write" on app_settings for all using (has_role('admin')) with check (has_role('admin'));
create policy "public settings read" on app_settings for select using (true);
create policy "admin audit read" on audit_logs for select using (has_role('admin'));

-- Las transacciones se escriben solo desde el servidor (service role, que omite RLS).
