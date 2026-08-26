-- ============================================================
-- Soy Templo — Migración 0003: notificaciones push
-- ============================================================

-- Suscripciones de navegador/teléfono a notificaciones push.
-- No requiere cuenta: cualquier visitante puede activar notificaciones,
-- igual que en la mayoría de apps con PWA.
create table push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  endpoint text not null unique,
  p256dh text not null,
  auth_key text not null,
  notify_devotional boolean not null default true,
  notify_verse boolean not null default true,
  notify_events boolean not null default true,
  notify_sermons boolean not null default true,
  notify_campaigns boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_push_subscriptions_updated
  before update on push_subscriptions
  for each row execute function set_updated_at();

-- Sermones / mensajes de transmisiones pasadas.
create table sermons (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  video_url text not null,
  thumbnail_url text,
  status content_status not null default 'published',
  published_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create trigger trg_sermons_updated
  before update on sermons
  for each row execute function set_updated_at();

-- Evita enviar el mismo recordatorio de evento dos veces.
create table event_reminders_sent (
  event_id uuid not null references events(id) on delete cascade,
  kind text not null check (kind in ('day_before', 'four_hours')),
  sent_at timestamptz not null default now(),
  primary key (event_id, kind)
);

-- Evita re-enviar el push del devocional del día si el cron corre más de una vez.
alter table devotionals add column if not exists pushed_at timestamptz;

create index idx_push_subs_devotional on push_subscriptions (notify_devotional) where notify_devotional;
create index idx_push_subs_events on push_subscriptions (notify_events) where notify_events;
create index idx_push_subs_sermons on push_subscriptions (notify_sermons) where notify_sermons;
create index idx_push_subs_campaigns on push_subscriptions (notify_campaigns) where notify_campaigns;
create index idx_sermons_published on sermons (status, published_at desc) where deleted_at is null;

-- ---------- RLS ----------
alter table push_subscriptions enable row level security;
alter table sermons enable row level security;
alter table event_reminders_sent enable row level security;

-- Cualquiera puede suscribirse o actualizar SU PROPIA suscripción
-- (el endpoint del navegador funciona como identificador único e
-- imposible de adivinar, igual que un token). Nadie puede leer la
-- lista completa desde el cliente: eso solo lo hace el servidor con
-- la service role key al momento de enviar.
create policy "anyone can subscribe" on push_subscriptions for insert with check (true);
create policy "anyone can update own subscription" on push_subscriptions for update using (true) with check (true);
create policy "anyone can delete own subscription" on push_subscriptions for delete using (true);

create policy "public read published sermons" on sermons for select
  using (deleted_at is null and (status = 'published' or is_staff()));
create policy "staff write sermons" on sermons for all using (is_staff()) with check (is_staff());

create policy "admin read reminders log" on event_reminders_sent for select using (has_role('admin'));
