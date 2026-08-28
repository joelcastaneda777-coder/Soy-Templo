-- One-time, idempotent transition from the old model where church activities
-- were stored as announcements with display_on_agenda=true.
with legacy as (
  select a.*,
    case
      when lower(a.title) like '%mi casa y yo%' then 'formacion'
      when lower(a.title) like '%evangel%' or lower(a.title) like '%iglesia en la calle%' then 'evangelismo'
      when lower(a.title) like '%ayuno%' then 'oracion'
      when lower(a.title) like '%brigada médica%' or lower(a.title) like '%brigada medica%' then 'cuidado'
      when a.category = 'jovenes' or lower(a.title) like '%jóven%' or lower(a.title) like '%joven%' then 'jovenes'
      when lower(a.title) like '%servicio general%' or lower(a.title) like '%santa cena%' or a.title = 'STK' or lower(a.title) like '%culto%' then 'culto'
      when a.category = 'especiales' or a.category = 'mujeres' or lower(a.title) like '%vigilia%' or lower(a.title) like '%cena%' or lower(a.title) like '%taller%' or lower(a.title) like '%campamento%' or lower(a.title) like '%misionero%' or lower(a.title) like '%invitado especial%' or lower(a.title) like '%graduación%' then 'especial'
      else 'general'
    end as event_category_slug
  from public.announcements a
  where a.display_on_agenda = true
    and a.deleted_at is null
    and a.title <> 'Se buscan voluntarios para el ministerio creativo'
), inserted as (
  insert into public.events (
    slug,name,description,starts_at,ends_at,image_url,category_id,status,
    is_featured,attendance_mode,created_by,notify_on_publish
  )
  select
    'legacy-' || left(regexp_replace(lower(translate(l.title,'ÁÉÍÓÚÜÑáéíóúüñ','AEIOUUNaeiouun')), '[^a-z0-9]+', '-', 'g'), 55)
      || '-' || to_char(l.effective_at at time zone 'America/El_Salvador','YYYYMMDD-HH24MI')
      || '-' || left(l.id::text,8),
    l.title,
    l.description,
    l.effective_at,
    l.effective_until,
    l.image_url,
    c.id,
    'published'::public.event_status,
    l.is_featured,
    'none',
    l.created_by,
    false
  from legacy l
  left join public.event_categories c on c.slug = l.event_category_slug
  where not exists (
    select 1 from public.events e
    where e.deleted_at is null and e.name = l.title and e.starts_at = l.effective_at
  )
  returning id
)
select count(*) from inserted;

update public.announcements
set status = 'archived', updated_at = now()
where display_on_agenda = true
  and deleted_at is null
  and title <> 'Se buscan voluntarios para el ministerio creativo';

update public.announcements
set display_on_agenda = false,
    announcement_kind = 'convocatoria',
    updated_at = now()
where title = 'Se buscan voluntarios para el ministerio creativo'
  and deleted_at is null;
