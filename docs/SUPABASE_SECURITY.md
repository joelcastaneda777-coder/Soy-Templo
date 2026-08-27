# Seguridad Supabase — estado de readiness

## Cerrado en esta fase
- Helpers privilegiados (`has_role`, `is_staff`, eliminación de cuenta) con implementación sensible en esquema `private` y wrappers públicos `SECURITY INVOKER`.
- `search_path` fijado en funciones de trigger sensibles.
- Ejecución anónima/autenticada retirada de funciones que solo deben ejecutarse como triggers.
- Receipts/tokens de proveedor de Soy Templo+ movidos fuera del esquema público.
- RLS de datos del usuario optimizada usando `(select auth.uid())` para evitar reevaluación por fila.
- Políticas administrativas amplias separadas por INSERT/UPDATE/DELETE para reducir políticas permisivas solapadas.
- Índices añadidos a foreign keys relevantes.
- `pastor` y `superadmin` incorporados al modelo de roles.
- Lectura de perfiles de otros usuarios limitada a administradores; pastor/editor no pueden explorar la base completa de miembros.
- Fuentes de audio premium de Radio almacenadas en esquema privado.
- Bucket `radio-archive` privado; no existe política de lectura directa para usuarios.

## Estado de Advisors después del hardening
Los warnings de funciones SECURITY DEFINER expuestas y los warnings de rendimiento de RLS fueron eliminados.

Los avisos de índices recién creados como “unused” son informativos y no justifican eliminarlos inmediatamente; la aplicación aún tiene poco tráfico para generar estadísticas de uso representativas.

## Pendiente de configuración de Auth
Supabase sigue avisando que **Leaked Password Protection** está desactivada. Esta opción comprueba contraseñas contra Pwned Passwords y se gestiona en la configuración de Auth del proyecto. Supabase documenta esta función para planes compatibles (Pro o superior).

Antes del lanzamiento:
1. comprobar el plan de Supabase contratado;
2. activar Leaked Password Protection si está disponible;
3. revisar longitud/requisitos mínimos de contraseña;
4. configurar SMTP propio para correos transaccionales de producción;
5. probar registro, confirmación y recuperación de contraseña desde Android.

No cambiar funciones SECURITY DEFINER ni permisos de RLS para “eliminar warnings” sin entender qué identidad debe ejecutar cada operación.
