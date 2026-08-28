-- Sistema de push sin secretos en Vercel.
-- IMPORTANTE: los valores de Vault se aprovisionan fuera del repositorio con
-- estos nombres: soy_templo_vapid_public, soy_templo_vapid_private y
-- soy_templo_push_gateway.

create extension if not exists pg_net with schema extensions;
create extension if not exists pg_cron with schema pg_catalog;

alter table public.push_subscriptions
  add column if not exists notify_announcements boolean not null default true,
  add column if not exists device_name text,
  add column if not exists last_seen_at timestamptz not null default now();

create index if not exists idx_push_subscriptions_last_seen on public.push_subscriptions(last_seen_at desc);

create or replace function public.get_push_vapid_public_key()
returns text
language sql
stable
security definer
set search_path = vault, pg_temp
as $$
  select decrypted_secret from vault.decrypted_secrets
  where name = 'soy_templo_vapid_public' limit 1;
$$;
revoke all on function public.get_push_vapid_public_key() from public;
grant execute on function public.get_push_vapid_public_key() to anon, authenticated, service_role;

create or replace function public.get_push_gateway_secret()
returns text
language sql
stable
security definer
set search_path = vault, pg_temp
as $$
  select decrypted_secret from vault.decrypted_secrets
  where name = 'soy_templo_push_gateway' limit 1;
$$;
revoke all on function public.get_push_gateway_secret() from public, anon, authenticated;
grant execute on function public.get_push_gateway_secret() to service_role;

create or replace function public.get_push_admin_stats()
returns table(total_devices bigint, users_with_push bigint, recent_devices bigint)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
begin
  if not exists (
    select 1 from public.user_roles
    where user_id = auth.uid() and role::text in ('admin','superadmin')
  ) then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  return query
  select count(*)::bigint,
         count(distinct ps.user_id)::bigint,
         count(*) filter (where ps.last_seen_at >= now() - interval '7 days')::bigint
  from public.push_subscriptions ps;
end;
$$;
revoke all on function public.get_push_admin_stats() from public, anon;
grant execute on function public.get_push_admin_stats() to authenticated, service_role;

create or replace function public.claim_push_subscription(
  p_endpoint text,
  p_p256dh text,
  p_auth_key text,
  p_device_name text default null,
  p_preferences jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_existing public.push_subscriptions%rowtype;
  v_id uuid;
begin
  if v_user_id is null then raise exception 'authentication required' using errcode='42501'; end if;
  if p_endpoint is null or length(p_endpoint) < 10 or p_p256dh is null or p_auth_key is null then
    raise exception 'invalid subscription' using errcode='22023';
  end if;
  select * into v_existing from public.push_subscriptions where endpoint=p_endpoint for update;
  if found then
    if v_existing.p256dh is distinct from p_p256dh or v_existing.auth_key is distinct from p_auth_key then
      raise exception 'subscription key mismatch' using errcode='23505';
    end if;
    update public.push_subscriptions set
      user_id=v_user_id,
      device_name=nullif(left(trim(coalesce(p_device_name,'')),80),''),
      last_seen_at=now(),
      notify_devotional=coalesce((p_preferences->>'notify_devotional')::boolean,notify_devotional),
      notify_verse=coalesce((p_preferences->>'notify_verse')::boolean,notify_verse),
      notify_events=coalesce((p_preferences->>'notify_events')::boolean,notify_events),
      notify_sermons=coalesce((p_preferences->>'notify_sermons')::boolean,notify_sermons),
      notify_campaigns=coalesce((p_preferences->>'notify_campaigns')::boolean,notify_campaigns),
      notify_prayer=coalesce((p_preferences->>'notify_prayer')::boolean,notify_prayer),
      notify_announcements=coalesce((p_preferences->>'notify_announcements')::boolean,notify_announcements),
      updated_at=now()
    where id=v_existing.id returning id into v_id;
    return v_id;
  end if;
  insert into public.push_subscriptions(
    user_id,endpoint,p256dh,auth_key,device_name,last_seen_at,
    notify_devotional,notify_verse,notify_events,notify_sermons,notify_campaigns,notify_prayer,notify_announcements
  ) values (
    v_user_id,p_endpoint,p_p256dh,p_auth_key,nullif(left(trim(coalesce(p_device_name,'')),80),''),now(),
    coalesce((p_preferences->>'notify_devotional')::boolean,true),
    coalesce((p_preferences->>'notify_verse')::boolean,true),
    coalesce((p_preferences->>'notify_events')::boolean,true),
    coalesce((p_preferences->>'notify_sermons')::boolean,true),
    coalesce((p_preferences->>'notify_campaigns')::boolean,true),
    coalesce((p_preferences->>'notify_prayer')::boolean,true),
    coalesce((p_preferences->>'notify_announcements')::boolean,true)
  ) returning id into v_id;
  return v_id;
end;
$$;
revoke all on function public.claim_push_subscription(text,text,text,text,jsonb) from public, anon;
grant execute on function public.claim_push_subscription(text,text,text,text,jsonb) to authenticated;

create table if not exists private.push_dispatch_queue (
  id uuid primary key default gen_random_uuid(),
  event_key text not null unique,
  payload jsonb not null,
  status text not null default 'pending' check(status in ('pending','queued','sent','failed','cancelled')),
  attempts integer not null default 0 check(attempts>=0),
  next_attempt_at timestamptz not null default now(),
  request_id bigint,
  last_attempt_at timestamptz,
  sent_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_push_dispatch_queue_due on private.push_dispatch_queue(status,next_attempt_at) where status='pending';
create index if not exists idx_push_dispatch_queue_request on private.push_dispatch_queue(request_id) where request_id is not null;
revoke all on private.push_dispatch_queue from public, anon, authenticated;

create or replace function private.enqueue_push_dispatch(p_event_key text,p_payload jsonb,p_available_at timestamptz default now())
returns void language plpgsql security definer set search_path=private,public,pg_temp as $$
begin
  if p_event_key is null or length(trim(p_event_key))=0 or p_payload is null then return; end if;
  insert into private.push_dispatch_queue(event_key,payload,status,next_attempt_at)
  values(p_event_key,p_payload,'pending',coalesce(p_available_at,now()))
  on conflict(event_key) do update set
    payload=excluded.payload,
    next_attempt_at=excluded.next_attempt_at,
    status=case when private.push_dispatch_queue.status in ('pending','failed','cancelled') then 'pending' else private.push_dispatch_queue.status end,
    request_id=case when private.push_dispatch_queue.status in ('pending','failed','cancelled') then null else private.push_dispatch_queue.request_id end,
    last_error=case when private.push_dispatch_queue.status in ('pending','failed','cancelled') then null else private.push_dispatch_queue.last_error end,
    updated_at=now();
end; $$;
revoke all on function private.enqueue_push_dispatch(text,jsonb,timestamptz) from public,anon,authenticated;

create or replace function private.process_push_dispatch_queue()
returns void language plpgsql security definer set search_path=private,public,vault,net,pg_temp as $$
declare r record; gateway_secret text; req_id bigint; err_text text;
begin
  for r in select q.id,q.attempts,q.request_id,h.status_code,h.timed_out,h.error_msg,h.content
    from private.push_dispatch_queue q join net._http_response h on h.id=q.request_id where q.status='queued'
  loop
    if r.status_code between 200 and 299 and not coalesce(r.timed_out,false) and r.error_msg is null then
      update private.push_dispatch_queue set status='sent',sent_at=now(),last_error=null,updated_at=now() where id=r.id;
    elsif r.attempts>=5 then
      update private.push_dispatch_queue set status='failed',last_error=left(coalesce(r.error_msg,'HTTP '||coalesce(r.status_code::text,'sin respuesta')||': '||coalesce(r.content,'')),1000),updated_at=now() where id=r.id;
    else
      update private.push_dispatch_queue set status='pending',request_id=null,next_attempt_at=now()+(interval '5 minutes'*greatest(r.attempts,1)),last_error=left(coalesce(r.error_msg,'HTTP '||coalesce(r.status_code::text,'sin respuesta')||': '||coalesce(r.content,'')),1000),updated_at=now() where id=r.id;
    end if;
  end loop;

  update private.push_dispatch_queue q set
    status=case when attempts>=5 then 'failed' else 'pending' end,
    request_id=case when attempts>=5 then request_id else null end,
    next_attempt_at=case when attempts>=5 then next_attempt_at else now()+interval '10 minutes' end,
    last_error='Tiempo de espera agotado esperando respuesta de pg_net',updated_at=now()
  where status='queued' and last_attempt_at<now()-interval '10 minutes'
    and not exists(select 1 from net._http_response h where h.id=q.request_id);

  select decrypted_secret into gateway_secret from vault.decrypted_secrets where name='soy_templo_push_gateway' limit 1;
  if gateway_secret is null then return; end if;

  for r in select id,payload from private.push_dispatch_queue where status='pending' and next_attempt_at<=now() order by created_at limit 25 for update skip locked
  loop
    begin
      select net.http_post(
        url:='https://bgvpplhqnwcxzbjfbdma.supabase.co/functions/v1/push-gateway',
        body:=r.payload,
        headers:=jsonb_build_object('Content-Type','application/json','x-soy-templo-gateway',gateway_secret),
        timeout_milliseconds:=8000
      ) into req_id;
      update private.push_dispatch_queue set status='queued',request_id=req_id,attempts=attempts+1,last_attempt_at=now(),last_error=null,updated_at=now() where id=r.id;
    exception when others then
      get stacked diagnostics err_text=message_text;
      update private.push_dispatch_queue set attempts=attempts+1,status=case when attempts+1>=5 then 'failed' else 'pending' end,next_attempt_at=now()+interval '5 minutes',last_error=left(err_text,1000),updated_at=now() where id=r.id;
    end;
  end loop;
end; $$;
revoke all on function private.process_push_dispatch_queue() from public,anon,authenticated;

create or replace function private.trigger_new_care_push() returns trigger language plpgsql security definer set search_path=private,public,pg_temp as $$
begin if new.deleted_at is null then perform private.enqueue_push_dispatch('care:new:'||new.id,jsonb_build_object('action','care_new','requestId',new.id::text),now()); end if; return new; end; $$;
create or replace function private.trigger_new_prayer_push() returns trigger language plpgsql security definer set search_path=private,public,pg_temp as $$
begin if new.deleted_at is null then perform private.enqueue_push_dispatch('prayer:new:'||new.id,jsonb_build_object('action','prayer_new','prayerId',new.id::text),now()); end if; return new; end; $$;
create or replace function private.trigger_published_prayer_push() returns trigger language plpgsql security definer set search_path=private,public,pg_temp as $$
begin if new.deleted_at is null and new.is_public and new.status::text='approved' and (old.status::text is distinct from 'approved' or old.is_public is distinct from true) then perform private.enqueue_push_dispatch('prayer:published:'||new.id,jsonb_build_object('action','prayer_published','prayerId',new.id::text),now()); end if; return new; end; $$;
create or replace function private.trigger_care_assignment_push() returns trigger language plpgsql security definer set search_path=private,public,pg_temp as $$
begin perform private.enqueue_push_dispatch('care:assignment:'||new.request_id||':'||new.user_id||':'||extract(epoch from new.created_at)::bigint,jsonb_build_object('action','care_assignment','requestId',new.request_id::text,'userId',new.user_id::text),now()); return new; end; $$;

create or replace function private.trigger_announcement_push() returns trigger language plpgsql security definer set search_path=private,public,pg_temp as $$
declare v_event_key text:='announcement:'||new.id;
begin
  if new.deleted_at is not null or new.status::text<>'published' then
    update private.push_dispatch_queue q set status='cancelled',updated_at=now() where q.event_key=v_event_key and q.status='pending'; return new;
  end if;
  perform private.enqueue_push_dispatch(v_event_key,jsonb_build_object('action','category','category','announcements','payload',jsonb_build_object('title',left(new.title,80),'body',left(new.description,200),'url','/anuncios','tag','announcement-'||new.id)),new.publish_at);
  return new;
end; $$;

create or replace function private.trigger_sermon_push() returns trigger language plpgsql security definer set search_path=private,public,pg_temp as $$
begin
  if new.deleted_at is null and new.status::text='published' then
    perform private.enqueue_push_dispatch('sermon:'||new.id,jsonb_build_object('action','category','category','sermons','payload',jsonb_build_object('title','Nuevo sermón disponible','body',left(new.title,200),'url','/sermones','tag','sermon-'||new.id)),coalesce(new.published_at,now()));
  end if; return new;
end; $$;

create or replace function private.trigger_devotional_push() returns trigger language plpgsql security definer set search_path=private,public,pg_temp as $$
begin
  if new.deleted_at is null and new.status::text='published' then
    perform private.enqueue_push_dispatch('devotional:'||new.id,jsonb_build_object('action','category','category','devotional','payload',jsonb_build_object('title','Nuevo devocional disponible','body',left(new.title,200),'url','/devocionales/'||new.slug,'tag','devotional-'||new.id)),new.publish_at);
    perform private.enqueue_push_dispatch('verse:'||new.id,jsonb_build_object('action','category','category','verse','payload',jsonb_build_object('title','Versículo del día','body',left(new.key_verse,200),'url','/devocionales/'||new.slug,'tag','verse-'||new.id)),new.publish_at);
  end if; return new;
end; $$;

create or replace function private.enqueue_due_event_reminders() returns void language plpgsql security definer set search_path=private,public,pg_temp as $$
declare e record; inserted_kind text;
begin
  for e in select id,name,starts_at,location from public.events where status::text='published' and deleted_at is null and starts_at>now() and starts_at<=now()+interval '24 hours 15 minutes'
  loop
    if e.starts_at between now()+interval '23 hours 45 minutes' and now()+interval '24 hours 15 minutes' then
      inserted_kind:=null; insert into public.event_reminders_sent(event_id,kind) values(e.id,'day_before') on conflict do nothing returning kind into inserted_kind;
      if inserted_kind is not null then perform private.enqueue_push_dispatch('event:day-before:'||e.id,jsonb_build_object('action','category','category','events','payload',jsonb_build_object('title','Mañana: '||left(e.name,120),'body',case when e.location is not null and length(trim(e.location))>0 then 'Te esperamos en '||left(e.location,150) else 'No te lo pierdas.' end,'url','/eventos','tag','event-day-before-'||e.id)),now()); end if;
    end if;
    if e.starts_at between now()+interval '3 hours 45 minutes' and now()+interval '4 hours 15 minutes' then
      inserted_kind:=null; insert into public.event_reminders_sent(event_id,kind) values(e.id,'four_hours') on conflict do nothing returning kind into inserted_kind;
      if inserted_kind is not null then perform private.enqueue_push_dispatch('event:four-hours:'||e.id,jsonb_build_object('action','category','category','events','payload',jsonb_build_object('title','En 4 horas: '||left(e.name,120),'body',case when e.location is not null and length(trim(e.location))>0 then 'Nos vemos en '||left(e.location,150) else '¡Ya casi es hora!' end,'url','/eventos','tag','event-four-hours-'||e.id)),now()); end if;
    end if;
  end loop;
end; $$;

create or replace function private.run_push_maintenance() returns void language plpgsql security definer set search_path=private,public,pg_temp as $$
begin perform private.enqueue_due_event_reminders(); perform private.process_push_dispatch_queue(); end; $$;
revoke all on function private.enqueue_due_event_reminders() from public,anon,authenticated;
revoke all on function private.run_push_maintenance() from public,anon,authenticated;

drop trigger if exists soy_templo_care_new_push on public.care_requests;
create trigger soy_templo_care_new_push after insert on public.care_requests for each row execute function private.trigger_new_care_push();
drop trigger if exists soy_templo_prayer_new_push on public.prayer_requests;
create trigger soy_templo_prayer_new_push after insert on public.prayer_requests for each row execute function private.trigger_new_prayer_push();
drop trigger if exists soy_templo_prayer_published_push on public.prayer_requests;
create trigger soy_templo_prayer_published_push after update of status,is_public on public.prayer_requests for each row execute function private.trigger_published_prayer_push();
drop trigger if exists soy_templo_care_assignment_push on public.care_assignments;
create trigger soy_templo_care_assignment_push after insert on public.care_assignments for each row execute function private.trigger_care_assignment_push();
drop trigger if exists soy_templo_announcement_push on public.announcements;
create trigger soy_templo_announcement_push after insert or update of status,publish_at,title,description,deleted_at on public.announcements for each row execute function private.trigger_announcement_push();
drop trigger if exists soy_templo_sermon_push on public.sermons;
create trigger soy_templo_sermon_push after insert or update of status,published_at,title,deleted_at on public.sermons for each row execute function private.trigger_sermon_push();
drop trigger if exists soy_templo_devotional_push on public.devotionals;
create trigger soy_templo_devotional_push after insert or update of status,publish_at,title,key_verse,slug,deleted_at on public.devotionals for each row execute function private.trigger_devotional_push();

select cron.schedule('soy-templo-push-maintenance','*/5 * * * *','select private.run_push_maintenance();')
where not exists(select 1 from cron.job where jobname='soy-templo-push-maintenance');
