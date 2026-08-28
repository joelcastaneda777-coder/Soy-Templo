alter table public.announcements add column if not exists effective_at timestamptz, add column if not exists effective_until timestamptz, add column if not exists announcement_kind text not null default 'aviso';

update public.announcements set effective_at = coalesce(effective_at, publish_at) where effective_at is null;
alter table public.announcements alter column effective_at set not null;

alter table public.announcements drop constraint if exists announcements_effective_range_check;
alter table public.announcements add constraint announcements_effective_range_check check (effective_until is null or effective_until >= effective_at);

create index if not exists announcements_effective_at_idx on public.announcements (effective_at desc) where deleted_at is null;
create index if not exists announcements_kind_idx on public.announcements (announcement_kind) where deleted_at is null;
