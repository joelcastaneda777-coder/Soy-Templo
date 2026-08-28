# Notificaciones de Soy Templo

## Arquitectura vigente

`Postgres -> private.push_dispatch_queue -> pg_cron -> pg_net -> Supabase Edge push-gateway -> Web Push`

Las claves VAPID y la firma interna del gateway se aprovisionan en **Supabase Vault** y nunca deben escribirse en GitHub, Vercel ni el cliente. El navegador solo recibe la clave VAPID pública mediante `get_push_vapid_public_key()`.

## Seguridad

- Cada `push_subscription` pertenece a un usuario autenticado y RLS solo permite leer/editar/borrar dispositivos propios.
- `claim_push_subscription()` permite vincular o transferir el mismo navegador entre cuentas únicamente cuando las claves criptográficas coinciden.
- `get_push_vapid_config()` y `get_push_gateway_secret()` son exclusivas de `service_role`.
- El panel administrativo usa el JWT normal del admin; no necesita `SUPABASE_SERVICE_ROLE_KEY` en Vercel.
- El Edge gateway valida `admin/superadmin` para pruebas y campañas.
- Las alertas pastorales no incluyen PII ni detalles sensibles en el payload push.

## Automatizaciones

Los triggers generan trabajos idempotentes para nuevas solicitudes de cuidado, nuevas peticiones de oración, aprobación de oración pública, asignaciones, anuncios, sermones y devocionales. `pg_cron` procesa la cola cada 5 minutos y también crea recordatorios de eventos de 24 h y 4 h. Los fallos se reintentan hasta cinco veces.

## Preferencias del usuario

Devocional, verso, eventos, sermones, oración comunitaria, anuncios importantes y campañas de donación pueden activarse o desactivarse por dispositivo.

## Prueba

1. Iniciar sesión.
2. Ir a Más -> Notificaciones y activar el dispositivo.
3. Como admin, abrir `/admin/notificaciones`.
4. Usar **Enviar prueba a mis dispositivos**.
5. Debe llegar el push y también guardarse una copia en `/notificaciones`.
