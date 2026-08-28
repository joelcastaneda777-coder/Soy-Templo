# Push de Soy Templo

La entrega de notificaciones usa Supabase como plano seguro de ejecución:

`Postgres triggers -> private.push_dispatch_queue -> pg_cron/pg_net -> Edge Function push-gateway -> Web Push`

- Las claves VAPID y la firma interna viven en Supabase Vault y nunca en GitHub.
- Vercel no necesita `SUPABASE_SERVICE_ROLE_KEY` ni la clave VAPID privada.
- Los usuarios registran su propio dispositivo con JWT; el gateway valida la sesión.
- Las acciones administrativas (`self_test`, campañas, estadísticas) validan `admin`/`superadmin`.
- Oración/cuidado escriben además avisos internos sin PII en el push.
- La cola reintenta entregas y limpia suscripciones 404/410.
- Los recordatorios de eventos se generan desde Supabase; no dependen de Vercel Cron ni GitHub Actions.
