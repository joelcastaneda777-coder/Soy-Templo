-- Las operaciones privilegiadas de push viven en Supabase Edge push-gateway.
-- Eliminamos RPC SECURITY DEFINER expuestas por PostgREST para mantener el
-- principio de mínimo privilegio. El gateway valida el JWT del usuario y usa
-- service_role únicamente dentro del runtime de Supabase.

drop function if exists public.claim_push_subscription(text, text, text, text, jsonb);
drop function if exists public.get_push_admin_stats();
drop function if exists public.get_push_vapid_public_key();
