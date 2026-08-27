-- ============================================================
-- Soy Templo+ — membresía, acceso premium y RLS de planes
-- ============================================================

alter table public.bible_plans
  add column if not exists access_tier text not null default 'free'
  check (access_tier in ('free','plus'));

create table if not exists public.plus_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null check (provider in ('google_play','apple','manual','test')),
  product_id text not null,
  status text not null check (status in ('trialing','active','grace_period','paused','canceled','expired')),
  external_reference text unique,
  environment text not null default 'production' check (environment in ('sandbox','production')),
  current_period_start timestamptz,
  current_period_end timestamptz,
  auto_renewing boolean not null default false,
  last_verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_plus_subscriptions_user_status
  on public.plus_subscriptions (user_id, status, current_period_end desc);

alter table public.plus_subscriptions enable row level security;

create policy "own plus subscription read"
  on public.plus_subscriptions for select
  using (user_id = auth.uid());

create policy "admin plus subscription read"
  on public.plus_subscriptions for select
  using (has_role('admin'::app_role));

create trigger trg_plus_subscriptions_updated
  before update on public.plus_subscriptions
  for each row execute function public.set_updated_at();

create or replace function public.has_plus()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select auth.uid() is not null and exists (
    select 1
    from public.plus_subscriptions s
    where s.user_id = auth.uid()
      and s.status in ('trialing','active','grace_period')
      and (s.current_period_end is null or s.current_period_end > now())
  );
$$;

revoke all on function public.has_plus() from public;
grant execute on function public.has_plus() to anon, authenticated;

drop policy if exists "public read lessons of published plans" on public.bible_plan_lessons;
create policy "public read lessons of accessible published plans"
  on public.bible_plan_lessons for select
  using (
    exists (
      select 1
      from public.bible_plans p
      where p.id = bible_plan_lessons.plan_id
        and p.deleted_at is null
        and (p.status = 'published' or is_staff())
        and (p.access_tier = 'free' or has_plus() or is_staff())
    )
  );

create index if not exists idx_bible_plans_access_tier
  on public.bible_plans (access_tier, status)
  where deleted_at is null;
