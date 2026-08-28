alter table public.bible_plans
  add column if not exists visual_theme text not null default 'faith',
  add column if not exists accent_color text not null default '#5B5FEF',
  add column if not exists cover_image_url text;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'bible_plans_visual_theme_check'
  ) then
    alter table public.bible_plans
      add constraint bible_plans_visual_theme_check
      check (visual_theme in ('faith','fear','hope','sadness','joy','grace','identity','wisdom','rest','theology'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'bible_plans_accent_color_check'
  ) then
    alter table public.bible_plans
      add constraint bible_plans_accent_color_check
      check (accent_color ~ '^#[0-9A-Fa-f]{6}$');
  end if;
end $$;

update public.bible_plans
set visual_theme = case
      when slug like '%sufrimiento%' then 'hope'
      when slug like '%quietud%' then 'rest'
      when slug like '%gracia%' then 'grace'
      when slug like '%templo-del-espiritu%' then 'identity'
      when slug like '%sermon-del-monte%' then 'faith'
      when slug like '%interpretar%' or slug like '%leer-la-biblia%' then 'wisdom'
      when slug like '%teologia%' then 'theology'
      else visual_theme
    end,
    accent_color = case
      when slug like '%sufrimiento%' then '#D97706'
      when slug like '%quietud%' then '#0F766E'
      when slug like '%gracia%' then '#7C3AED'
      when slug like '%templo-del-espiritu%' then '#2563EB'
      when slug like '%sermon-del-monte%' then '#15803D'
      when slug like '%interpretar%' or slug like '%leer-la-biblia%' then '#B45309'
      when slug like '%teologia%' then '#4338CA'
      else accent_color
    end,
    cover_image_url = case
      when slug like '%sufrimiento%' then '/anuncios-backgrounds/month-11.jpg'
      when slug like '%quietud%' then '/anuncios-backgrounds/month-06.jpg'
      when slug like '%gracia%' then '/anuncios-backgrounds/month-10.jpg'
      when slug like '%templo-del-espiritu%' then '/anuncios-backgrounds/month-03.jpg'
      when slug like '%sermon-del-monte%' then '/anuncios-backgrounds/month-05.jpg'
      when slug like '%interpretar%' or slug like '%leer-la-biblia%' then '/anuncios-backgrounds/month-09.jpg'
      when slug like '%teologia%' then '/anuncios-backgrounds/month-12.jpg'
      else coalesce(cover_image_url, '/plans/lesson-cover-example.jpg')
    end
where deleted_at is null;
