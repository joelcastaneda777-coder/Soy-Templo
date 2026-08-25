-- ============================================================
-- Soy Templo — Migración 0002: ajustes de radio en línea
-- ============================================================

insert into app_settings (key, value)
values (
  'radio',
  '{
    "name": "Radio Soy Templo",
    "description": "Alabanza, enseñanza y compañía todo el día.",
    "stream_url": null
  }'::jsonb
)
on conflict (key) do nothing;
