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

## 7. Estructura del proyecto

```
src/app/                  Rutas (App Router)
  devocionales/           Lista + detalle de devocionales
  planes/                 Planes bíblicos con progreso por lección
  eventos/                Próximos eventos + exportar a calendario (.ics)
  anuncios/               Anuncios de la iglesia
  donar/                  Formulario de donación + webhook de confirmación
  oracion/                Peticiones de oración (moderadas) + "estoy orando"
  auth/                   Login / registro
  mas/                    Menú "Más" (móvil)
  admin/                  Panel administrativo (protegido por rol)
  api/payments/webhook/   Webhook de confirmación de pagos
src/components/ui/        Botón, tarjeta, badge, inputs, skeleton, estado vacío
src/components/layout/    Barra inferior (móvil) y navegación superior (escritorio)
src/lib/supabase/         Clientes de Supabase (browser, server, middleware)
src/lib/payments/         Interfaz PaymentProvider + proveedor simulado
src/lib/i18n/es.ts        Todos los textos de la interfaz (listo para agregar en.ts)
supabase/                 Migración SQL + datos de ejemplo
```

## 8. Lo que falta por construir (próximas fases)

- **Gestión de contenido en `/admin`**: crear/editar devocionales, planes, anuncios y eventos (el dashboard y el patrón de Server Actions + Zod ya están listos; solo falta repetir el patrón por sección).
- **Páginas enlazadas desde "Más" aún no implementadas**: `/transmisiones`, `/favoritos`, `/progreso`, `/perfil`, `/configuracion`, `/acerca-de`.
- **Notificaciones**: la tabla `notifications` y `notification_preferences` ya existen; falta la UI y el envío (Web Push / FCM al empaquetar con Capacitor).
- **Service worker de PWA** (offline básico, íconos reales en `public/icons/`).
- **Conectar un proveedor de pago real** (Wompi, n1co, Stripe, PayPal): implementar la interfaz `PaymentProvider` en `src/lib/payments/` y registrar el proveedor en `src/lib/payments/index.ts`. La UI y el webhook no cambian.
- **Empaquetado con Capacitor** para iOS/Android: `output: "export"` en `next.config.ts`, luego `npx cap add ios/android`.

## 9. Seguridad

- Row Level Security (RLS) está activo en todas las tablas: es la capa de seguridad primaria, no solo el middleware.
- Los roles (`member`, `editor`, `admin`) viven en `user_roles`; `has_role()` e `is_staff()` son funciones de Postgres usadas tanto por las políticas RLS como por el middleware de Next.js.
- El webhook de pagos usa el `service_role key` (solo servidor) y verifica la firma antes de procesar cualquier evento; una transacción `completed` nunca se vuelve a procesar (protección de duplicados por `reference_id`).
- Ningún dato de tarjeta pasa por esta aplicación.
