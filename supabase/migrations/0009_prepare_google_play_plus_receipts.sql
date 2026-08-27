alter table public.plus_subscriptions
  add column if not exists base_plan_id text,
  add column if not exists offer_id text;

create table if not exists public.plus_provider_receipts (
  subscription_id uuid primary key references public.plus_subscriptions(id) on delete cascade,
  provider text not null,
  purchase_token text not null unique,
  provider_payload jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.plus_provider_receipts enable row level security;

-- Intentionally no anon/authenticated policies. Only trusted server/service-role
-- code may persist or read provider purchase tokens.
create trigger trg_plus_provider_receipts_updated
  before update on public.plus_provider_receipts
  for each row execute function public.set_updated_at();
