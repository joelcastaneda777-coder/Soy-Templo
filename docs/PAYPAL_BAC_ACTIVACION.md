# Activación PayPal Business → BAC — Soy Templo

## Objetivo
Usar una cuenta **PayPal Business institucional** para recibir donaciones y retirar manualmente el saldo hacia la cuenta BAC de la organización, manteniendo trazabilidad contable.

## Flujo aprobado
```text
Donante
  ↓
PayPal Business institucional
  ↓
Captura confirmada por servidor
  ↓
Saldo PayPal
  ↓
Revisión / aprobación de tesorería
  ↓
Retiro manual
  ↓
BAC institucional
  ↓
Conciliación en /admin/donaciones
```

## Antes de conectar la app
La organización debe crear/verificar PayPal Business usando sus datos legales reales. No usar cuentas personales como puente.

Tener a mano:
- nombre legal exacto;
- dirección legal;
- teléfono y correo institucional;
- representante autorizado;
- documentación de personería jurídica que PayPal pueda solicitar;
- cuenta BAC institucional que recibirá los fondos.

## Conexión técnica
Cuando la cuenta exista:
1. entrar a PayPal Developer con la cuenta autorizada;
2. crear una aplicación para Soy Templo;
3. comenzar en Sandbox;
4. obtener Client ID y Client Secret;
5. registrar el webhook de pagos;
6. obtener el Webhook ID;
7. guardar las credenciales exclusivamente como secretos del servidor/Vercel;
8. probar creación → aprobación → captura → webhook;
9. pasar a Live solo después de Sandbox.

Variables preparadas:
```env
PAYMENT_PROVIDER=paypal
PAYPAL_ENVIRONMENT=sandbox
PAYPAL_CLIENT_ID=
PAYPAL_CLIENT_SECRET=
PAYPAL_WEBHOOK_ID=
```

**Nunca** poner Client Secret, contraseñas, códigos 2FA ni datos bancarios sensibles en GitHub o en conversaciones.

## Prueba financiera recomendada
Después de activar Live:
1. hacer una donación real pequeña de USD 1–5;
2. comprobar monto bruto;
3. comprobar comisión real de PayPal;
4. comprobar monto neto;
5. iniciar un retiro pequeño al BAC;
6. registrar la referencia del retiro en `/admin/donaciones`;
7. esperar la acreditación real;
8. marcar conciliado únicamente cuando tesorería vea el depósito en BAC.

Esto nos permitirá medir las tarifas y tiempos reales de la cuenta concreta, sin asumir porcentajes genéricos.

## Regla contable
- La app nunca marcará un retiro como depositado automáticamente basándose solo en una solicitud.
- Tesorería confirma el BAC y luego registra la conciliación.
- Donaciones y Soy Templo+ usan tablas y proveedores separados.
- Una donación jamás activa Premium.

## Operación sugerida
Definir internamente una frecuencia de conciliación, por ejemplo semanal o mensual. No hace falta automatizar el retiro de PayPal para lanzar la primera versión.

## Estado actual
Infraestructura de aplicación: preparada.
Cuenta PayPal Business institucional: pendiente de creación/verificación.
Credenciales Live: pendientes.
Prueba PayPal → BAC: pendiente.
