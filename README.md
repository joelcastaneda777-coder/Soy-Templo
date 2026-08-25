# Soy Templo

PWA de Soy Templo Internacional: devocionales diarios, planes bíblicos con progreso, anuncios, eventos, donaciones y peticiones de oración, con panel administrativo.

**Stack:** Next.js 15 (App Router) + TypeScript estricto + Tailwind CSS 4 + Supabase (Postgres, Auth, RLS, Storage).

## 1. Requisitos

- Node.js 20+
- Una cuenta de [Supabase](https://supabase.com) (el plan gratuito alcanza para empezar)

## 2. Crear el proyecto en Supabase

1. Crea un proyecto nuevo en [supabase.com](https://supabase.com).
2. Ve a **SQL Editor** y ejecuta, en orden:
   - `supabase/migrations/0001_initial_schema.sql` (crea tablas, roles, funciones y políticas RLS)
   - `supabase/seed.sql` (datos de demostración en español: un devocional, un plan de 7 días, anuncios, eventos, categorías de donación)
3. En **Project Settings → API**, copia:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public key` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role key` → `SUPABASE_SERVICE_ROLE_KEY` (**nunca** la expongas en el cliente; solo se usa en `src/app/api/payments/webhook/route.ts`)

## 3. Configurar variables de entorno

```bash
cp .env.example .env.local
```

Completa `.env.local` con los valores de Supabase. Deja `PAYMENT_PROVIDER=mock` mientras no tengas un proveedor real conectado.

## 4. Instalar y correr en desarrollo

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

## 5. Crear tu primer usuario administrador

1. Regístrate normalmente desde `/auth/registro` (esto crea tu fila en `profiles` y el rol `member` automáticamente).
2. En el SQL Editor de Supabase, otórgate el rol de administrador:

```sql
insert into user_roles (user_id, role)
values ('TU-USER-ID-AQUI', 'admin');
```

Tu `user_id` lo encuentras en **Authentication → Users** dentro de Supabase. Con el rol `admin` (o `editor`) ya puedes entrar a `/admin`.

## 6. Tipos de la base de datos (opcional pero recomendado)

Para tener autocompletado y seguridad de tipos con el esquema real de Supabase:

```bash
npx supabase login
npx supabase link --project-ref TU-PROJECT-REF
npm run db:types
```

Esto genera `src/lib/database.types.ts`. Luego puedes tipar los clientes de Supabase con `createClient<Database>(...)`.

## 7. Nueva migración: Radio en línea

Si ya ejecutaste `0001_initial_schema.sql` y `seed.sql` en un proyecto existente, entra al
**SQL Editor** de Supabase y ejecuta también `supabase/migrations/0002_radio_settings.sql`.
Esto agrega el ajuste `radio` (nombre, descripción y URL de transmisión) usado por la
página `/radio`.

### Conectar tu radio de Zeno FM

1. Crea tu estación en [Zeno FM](https://zeno.fm) y copia el enlace de streaming directo
   (normalmente algo como `https://stream.zeno.fm/xxxxxxxxxxxxx`).
2. En el **SQL Editor** de Supabase, ejecuta:

```sql
update app_settings
set value = jsonb_set(value, '{stream_url}', '"https://stream.zeno.fm/TU-ENLACE"')
where key = 'radio';
```

3. Recarga `/radio` en la app — el reproductor aparecerá automáticamente. Mientras no
   configures esta URL, la página muestra un mensaje de "próximamente" en vez de un error.

## 8. Cargar devocionales por mes (con IA)

En vez de escribir cada devocional a mano en SQL, el equipo puede generar un mes completo
con Gemini (o cualquier IA) y subirlo desde el panel:

1. Sigue la guía y el prompt listos para copiar en **`docs/plantilla-devocionales.md`**.
2. Entra a `/admin/devocionales/importar` con una cuenta de rol `editor` o `admin`.
3. Pega el Markdown generado (o sube el archivo `.md`) — verás una vista previa con
   cualquier día que tenga campos faltantes, antes de publicar nada.
4. Dale clic en "Confirmar e importar". Si vuelves a importar un archivo con la misma
   fecha y título, actualiza ese devocional en vez de duplicarlo.

## 9. Estructura del proyecto

```
src/app/                  Rutas (App Router)
  devocionales/           Lista + detalle de devocionales
  planes/                 Planes bíblicos con progreso por lección
  eventos/                Próximos eventos + exportar a calendario (.ics)
  anuncios/               Anuncios de la iglesia
  donar/                  Formulario de donación + webhook de confirmación
  oracion/                Peticiones de oración (moderadas) + "estoy orando"
  radio/                  Reproductor de la radio en línea (Zeno FM u otro)
  auth/                   Login / registro
  mas/                    Menú "Más" (móvil)
  admin/                  Panel administrativo (protegido por rol)
    devocionales/         Listado + importación masiva por Markdown
  api/payments/webhook/   Webhook de confirmación de pagos
src/components/ui/        Botón, tarjeta, badge, inputs, skeleton, estado vacío
src/components/layout/    Barra inferior (móvil) y navegación superior (escritorio)
src/lib/supabase/         Clientes de Supabase (browser, server, middleware)
src/lib/payments/         Interfaz PaymentProvider + proveedor simulado
src/lib/devotionals/      Parser del formato Markdown para importación masiva
src/lib/i18n/es.ts        Todos los textos de la interfaz (listo para agregar en.ts)
supabase/                 Migraciones SQL + datos de ejemplo
docs/                     Plantilla y prompt de IA para generar devocionales
```

## 10. Lo que falta por construir (próximas fases)

- **Gestión de contenido en `/admin`** para planes, anuncios y eventos (el patrón de
  Server Actions + Zod ya está listo en devocionales; solo falta repetirlo).
- **Páginas enlazadas desde "Más" aún no implementadas**: `/favoritos`, `/progreso`,
  `/perfil`, `/configuracion`, `/acerca-de`.
- **Editor de ajustes en `/admin/configuracion`** para cambiar la URL de radio y los datos
  de la iglesia sin tocar SQL directamente.
- **Notificaciones**: la tabla `notifications` y `notification_preferences` ya existen;
  falta la UI y el envío (Web Push / FCM al empaquetar con Capacitor).
- **Service worker de PWA** (offline básico, íconos reales en `public/icons/`).
- **Conectar un proveedor de pago real** (Wompi, n1co, Stripe, PayPal): implementar la
  interfaz `PaymentProvider` en `src/lib/payments/` y registrar el proveedor en
  `src/lib/payments/index.ts`. La UI y el webhook no cambian.
- **Empaquetado con Capacitor** para iOS/Android: `output: "export"` en `next.config.ts`,
  luego `npx cap add ios/android`.

## 11. Seguridad

- Row Level Security (RLS) está activo en todas las tablas: es la capa de seguridad
  primaria, no solo el middleware.
- Los roles (`member`, `editor`, `admin`) viven en `user_roles`; `has_role()` e
  `is_staff()` son funciones de Postgres usadas tanto por las políticas RLS como por el
  middleware de Next.js. La importación de devocionales también verifica el rol antes de
  escribir en la base de datos.
- El webhook de pagos usa el `service_role key` (solo servidor) y verifica la firma antes
  de procesar cualquier evento; una transacción `completed` nunca se vuelve a procesar
  (protección de duplicados por `reference_id`).
- Ningún dato de tarjeta pasa por esta aplicación.
