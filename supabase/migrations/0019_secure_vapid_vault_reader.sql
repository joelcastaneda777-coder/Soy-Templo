-- Las claves VAPID se aprovisionan fuera del repositorio en Supabase Vault.
-- Esta función solo puede ejecutarla service_role; anon/authenticated no pueden
-- recuperar secretos. La app devuelve únicamente public_key al navegador.

create or replace function public.get_push_vapid_config()
returns table(public_key text, private_key text)
language sql
stable
security definer
set search_path = vault, pg_temp
as $$
  select
    max(decrypted_secret) filter (where name = 'soy_templo_vapid_public') as public_key,
    max(decrypted_secret) filter (where name = 'soy_templo_vapid_private') as private_key
  from vault.decrypted_secrets
  where name in ('soy_templo_vapid_public', 'soy_templo_vapid_private');
$$;

revoke all on function public.get_push_vapid_config() from public;
revoke all on function public.get_push_vapid_config() from anon;
revoke all on function public.get_push_vapid_config() from authenticated;
grant execute on function public.get_push_vapid_config() to service_role;
