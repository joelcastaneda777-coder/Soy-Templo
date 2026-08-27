-- PayPal donation settlement and BAC reconciliation support.
-- No bank account numbers or payment credentials are stored in the database.

alter table public.payment_transactions
  add column if not exists provider_capture_id text,
  add column if not exists gross_amount_cents integer check (gross_amount_cents is null or gross_amount_cents >= 0),
  add column if not exists fee_amount_cents integer check (fee_amount_cents is null or fee_amount_cents >= 0),
  add column if not exists net_amount_cents integer check (net_amount_cents is null or net_amount_cents >= 0),
  add column if not exists settled_at timestamptz;

create table if not exists public.donation_settlements (
  id uuid primary key default gen_random_uuid(),
  provider text not null default 'paypal',
  destination_label text not null default 'BAC institucional',
  currency text not null default 'USD',
  provider_reference text,
  gross_amount_cents integer not null check (gross_amount_cents > 0),
  fee_amount_cents integer not null default 0 check (fee_amount_cents >= 0),
  net_amount_cents integer not null check (net_amount_cents >= 0),
  status text not null default 'pending' check (status in ('pending', 'completed', 'cancelled')),
  initiated_at timestamptz not null default now(),
  deposited_at timestamptz,
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.payment_transactions
  add column if not exists settlement_id uuid references public.donation_settlements(id) on delete set null;

create index if not exists idx_payment_transactions_unsettled
  on public.payment_transactions (status, created_at desc)
  where settlement_id is null;

create index if not exists idx_donation_settlements_status
  on public.donation_settlements (status, initiated_at desc);

alter table public.donation_settlements enable row level security;

drop policy if exists "admin donation settlements" on public.donation_settlements;
create policy "admin donation settlements"
  on public.donation_settlements
  for all
  using (has_role('admin'::app_role))
  with check (has_role('admin'::app_role));

drop policy if exists "admin reconcile transactions" on public.payment_transactions;
create policy "admin reconcile transactions"
  on public.payment_transactions
  for update
  using (has_role('admin'::app_role))
  with check (has_role('admin'::app_role));

drop trigger if exists trg_donation_settlements_updated on public.donation_settlements;
create trigger trg_donation_settlements_updated
  before update on public.donation_settlements
  for each row execute function public.set_updated_at();
