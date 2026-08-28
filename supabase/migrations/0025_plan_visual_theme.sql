alter table public.bible_plans
  add column if not exists theme_key text not null default 'general';

alter table public.bible_plans
  drop constraint if exists bible_plans_theme_key_check;

alter table public.bible_plans
  add constraint bible_plans_theme_key_check
  check (theme_key in ('general','fe','miedo','esperanza','tristeza','gozo','identidad','gracia','sabiduria'));

create index if not exists bible_plans_theme_key_idx
  on public.bible_plans(theme_key)
  where deleted_at is null;

-- Asignaciones visuales de demostración para los planes ya publicados.
-- Las imágenes pueden reemplazarse después desde el flujo de importación.
update public.bible_plans
set
  theme_key = case slug
    when 'siete-dias-de-quietud' then 'esperanza'
    when 'como-leer-la-biblia-sin-sacarla-de-contexto' then 'sabiduria'
    when 'gracia-culpa-y-libertad-cristiana' then 'gracia'
    when 'el-sermon-del-monte-como-formacion-del-discipulo' then 'fe'
    when 'que-significa-ser-templo-del-espiritu-santo' then 'identidad'
    when 'sufrimiento-esperanza-y-presencia-de-dios-en-los-salmos' then 'tristeza'
    when 'interpretar-biblia-sin-sacarla-de-contexto' then 'sabiduria'
    when 'gracia-culpa-libertad-cristiana' then 'gozo'
    when 'fundamentos-teologia-para-creyentes' then 'fe'
    else theme_key
  end,
  cover_url = case slug
    when 'siete-dias-de-quietud' then '/anuncios-backgrounds/month-01.jpg'
    when 'como-leer-la-biblia-sin-sacarla-de-contexto' then '/anuncios-backgrounds/month-02.jpg'
    when 'gracia-culpa-y-libertad-cristiana' then '/anuncios-backgrounds/month-03.jpg'
    when 'el-sermon-del-monte-como-formacion-del-discipulo' then '/anuncios-backgrounds/month-04.jpg'
    when 'que-significa-ser-templo-del-espiritu-santo' then '/anuncios-backgrounds/month-05.jpg'
    when 'sufrimiento-esperanza-y-presencia-de-dios-en-los-salmos' then '/anuncios-backgrounds/month-06.jpg'
    when 'interpretar-biblia-sin-sacarla-de-contexto' then '/anuncios-backgrounds/month-07.jpg'
    when 'gracia-culpa-libertad-cristiana' then '/anuncios-backgrounds/month-08.jpg'
    when 'fundamentos-teologia-para-creyentes' then '/anuncios-backgrounds/month-09.jpg'
    else cover_url
  end
where deleted_at is null;
