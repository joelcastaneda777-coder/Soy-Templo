-- Radio Soy Templo v2: programación horaria e identidad visual.

alter table public.radio_programs
  add column if not exists category text,
  add column if not exists accent_color text,
  add column if not exists is_featured boolean not null default false;

alter table public.radio_programs
  drop constraint if exists radio_programs_accent_color_check;
alter table public.radio_programs
  add constraint radio_programs_accent_color_check
  check (accent_color is null or accent_color ~ '^#[0-9A-Fa-f]{6}$');

create table if not exists public.radio_schedule (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.radio_programs(id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 0 and 6),
  start_time time not null,
  end_time time not null,
  timezone text not null default 'America/El_Salvador',
  label text,
  is_live boolean not null default false,
  is_active boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint radio_schedule_valid_window check (end_time > start_time)
);

create index if not exists idx_radio_schedule_day_time
  on public.radio_schedule(day_of_week,start_time,end_time)
  where is_active;
create index if not exists idx_radio_schedule_program on public.radio_schedule(program_id);

alter table public.radio_schedule enable row level security;

drop policy if exists "public read active radio schedule" on public.radio_schedule;
create policy "public read active radio schedule" on public.radio_schedule
for select using (is_active or (select public.is_staff()));

drop policy if exists "staff insert radio schedule" on public.radio_schedule;
create policy "staff insert radio schedule" on public.radio_schedule
for insert with check ((select public.is_staff()));

drop policy if exists "staff update radio schedule" on public.radio_schedule;
create policy "staff update radio schedule" on public.radio_schedule
for update using ((select public.is_staff())) with check ((select public.is_staff()));

drop policy if exists "staff delete radio schedule" on public.radio_schedule;
create policy "staff delete radio schedule" on public.radio_schedule
for delete using ((select public.is_staff()));

drop trigger if exists trg_radio_schedule_updated on public.radio_schedule;
create trigger trg_radio_schedule_updated
before update on public.radio_schedule
for each row execute function public.set_updated_at();
