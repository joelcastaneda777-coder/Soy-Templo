# Roles y permisos — Soy Templo

## Principio
Aplicar mínimo privilegio: una persona recibe únicamente los permisos necesarios para su responsabilidad. Los permisos reales se protegen con RLS y comprobaciones del servidor; ocultar opciones en la interfaz no sustituye la autorización.

| Rol | Uso previsto | Contenido | Radio | Notificaciones | Usuarios | Soy Templo+ | Donaciones | Configuración sensible |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| `member` | Usuario normal | No | No | No | No | Solo su membresía | Solo sus propias donaciones | No |
| `pastor` | Pastor / autor | Sí | Sí | Sí | No | Acceso de prueba | No | No |
| `editor` | Comunicaciones / contenido | Sí | Sí | Sí | No | Acceso de prueba | No | No |
| `admin` | Administración operativa | Sí | Sí | Sí | Sí | Sí | Sí | Sí |
| `superadmin` | Control institucional | Sí | Sí | Sí | Sí, incluidos roles superiores | Sí | Sí | Sí |

## Reglas
- `superadmin` satisface todos los controles que pidan rol `admin`.
- `pastor`, `editor`, `admin` y `superadmin` satisfacen `is_staff()`.
- Pastor/editor no deben recibir acceso a conciliación financiera ni listado completo de miembros por defecto.
- Solo administradores pueden modificar roles.
- Una vez exista un superadministrador, solo otro superadministrador puede crear, cambiar o retirar ese rol.
- Nunca se debe poder eliminar el último usuario con autoridad administrativa.
- Las cuentas de staff tienen acceso temporal a funciones Plus para pruebas, pero eso no representa una compra.

## Archivos sensibles
Los cambios visuales en `/admin` deben preservar los chequeos de rol del servidor y las políticas RLS. No mover permisos al cliente.
