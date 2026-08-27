-- Roles adicionales. Deben agregarse en una migración separada porque PostgreSQL
-- exige confirmar los nuevos valores enum antes de utilizarlos en funciones/policies.
alter type public.app_role add value if not exists 'pastor' before 'editor';
alter type public.app_role add value if not exists 'superadmin' after 'admin';
