alter table public.sermons
  add column if not exists notify_on_publish boolean not null default true;

create or replace function private.trigger_sermon_push()
returns trigger
language plpgsql
security definer
set search_path=private,public,pg_temp
as $$
begin
  if new.deleted_at is null and new.status::text='published' and coalesce(new.notify_on_publish,true) then
    perform private.enqueue_push_dispatch(
      'sermon:'||new.id,
      jsonb_build_object(
        'action','category',
        'category','sermons',
        'payload',jsonb_build_object(
          'title','Nuevo sermón disponible',
          'body',left(new.title,200),
          'url','/sermones',
          'tag','sermon-'||new.id
        )
      ),
      coalesce(new.published_at,now())
    );
  end if;
  return new;
end;
$$;

revoke all on function private.trigger_sermon_push() from public,anon,authenticated;
