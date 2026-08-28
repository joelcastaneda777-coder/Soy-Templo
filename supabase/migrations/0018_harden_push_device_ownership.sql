-- Vincula cada suscripción push a una cuenta autenticada y elimina las políticas
-- permisivas originales. Los endpoints/keys son credenciales del navegador y no
-- deben ser legibles ni modificables por otros usuarios.

delete from public.push_subscriptions where user_id is null;

alter table public.push_subscriptions
  add column if not exists device_name text,
  add column if not exists last_seen_at timestamptz not null default now();

alter table public.push_subscriptions
  drop constraint if exists push_subscriptions_user_id_fkey;

alter table public.push_subscriptions
  alter column user_id set not null;

alter table public.push_subscriptions
  add constraint push_subscriptions_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete cascade;

alter table public.push_subscriptions
  drop constraint if exists push_subscriptions_device_name_length;
alter table public.push_subscriptions
  add constraint push_subscriptions_device_name_length
  check (device_name is null or char_length(device_name) <= 80);

create index if not exists idx_push_subscriptions_user_id
  on public.push_subscriptions(user_id);
create index if not exists idx_push_subscriptions_last_seen
  on public.push_subscriptions(last_seen_at desc);

drop policy if exists "anyone can subscribe" on public.push_subscriptions;
drop policy if exists "anyone can update own subscription" on public.push_subscriptions;
drop policy if exists "anyone can delete own subscription" on public.push_subscriptions;
drop policy if exists "users read own push subscriptions" on public.push_subscriptions;
drop policy if exists "users insert own push subscriptions" on public.push_subscriptions;
drop policy if exists "users update own push subscriptions" on public.push_subscriptions;
drop policy if exists "users delete own push subscriptions" on public.push_subscriptions;

create policy "users read own push subscriptions"
on public.push_subscriptions for select
to authenticated
using (user_id = (select auth.uid()));

create policy "users insert own push subscriptions"
on public.push_subscriptions for insert
to authenticated
with check (user_id = (select auth.uid()));

create policy "users update own push subscriptions"
on public.push_subscriptions for update
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy "users delete own push subscriptions"
on public.push_subscriptions for delete
to authenticated
using (user_id = (select auth.uid()));
