alter table public.push_subscriptions
  add column if not exists notify_prayer boolean not null default true;

comment on column public.push_subscriptions.notify_prayer is
  'Recibe avisos cuando una nueva petición pública de oración es aprobada y publicada.';
