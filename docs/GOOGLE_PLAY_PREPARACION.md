# Preparación Google Play — Soy Templo

**Revisión de requisitos:** 26 de agosto de 2026. Verificar nuevamente las políticas oficiales al momento de publicar porque pueden cambiar.

## Cuenta de desarrollador
Preferencia del proyecto: cuenta de **Organización** si la personería jurídica de Soy Templo será titular de la app.

Información que debemos tener preparada:
- nombre legal de la organización;
- dirección legal;
- teléfono institucional;
- sitio web;
- correo de contacto;
- correo y teléfono públicos del desarrollador;
- persona autorizada para representar a la organización;
- número D-U-N-S.

Google Play exige D-U-N-S para cuentas de organización. Google indica que obtenerlo puede tardar hasta aproximadamente 30 días, por lo que debe solicitarse con anticipación.

La tarifa de registro de Play Console es un pago único de **USD 25**.

## Pruebas
Si por alguna razón se utilizara una cuenta **personal nueva** creada después del 13 de noviembre de 2023, Google exige actualmente una prueba cerrada con al menos **12 testers** inscritos de forma continua durante **14 días** antes de solicitar acceso a producción.

La cuenta de organización es la opción coherente con una app institucional y evita mezclar propiedad personal con los activos digitales de la iglesia.

## Monetización: punto crítico de El Salvador
Google Play actualmente permite registrar desarrolladores desde **El Salvador**, pero la tabla oficial indica que **no admite registro de comerciantes (merchant) de Google Play en El Salvador**.

Esto no impide publicar una app gratuita, pero sí afecta la activación de Soy Templo+ mediante Google Play Billing.

No resolver este punto simplemente colocando una cuenta bancaria de Estados Unidos. La estructura de comercio/pagos debe corresponder legítimamente a la entidad y al país del perfil de pagos.

Antes de activar Soy Templo+ debemos confirmar:
1. la entidad legal que será titular del merchant;
2. el país de esa entidad;
3. el perfil de pagos correspondiente;
4. la cuenta bancaria empresarial/institucional aceptada por Google;
5. obligaciones fiscales y contables aplicables.

## Soy Templo+
Soy Templo+ es contenido/funcionalidad digital y debe tratarse como suscripción digital.

Modelo previsto:
- Subscription ID: `soy_templo_plus`
- Base plan mensual: `monthly`
- Base plan anual: `annual`

Beneficios previstos:
- radio en segundo plano/pantalla bloqueada;
- planes teológicos especializados;
- archivo de Radio;
- audio y materiales ampliados;
- descargas/offline futuras.

Las compras digitales dentro de una app distribuida por Google Play normalmente requieren Google Play Billing, salvo excepciones o programas regionales aplicables que deben verificarse al implementar.

## Separación obligatoria
**Donación** y **suscripción** no son lo mismo:

- Donación → PayPal Business institucional → BAC → no desbloquea contenido.
- Soy Templo+ → Google Play Billing → desbloquea funcionalidad digital.

No presentar una compra Premium como “donación”.

## Assets que debemos preparar
- nombre final de la app;
- package ID definitivo;
- icono 512×512;
- feature graphic;
- capturas Android teléfono;
- descripción corta;
- descripción larga;
- categoría;
- email/web de soporte;
- política de privacidad pública;
- instrucciones para que Google acceda a una cuenta de revisión si el contenido requiere login;
- formulario Data Safety;
- clasificación de contenido y público objetivo.

## Orden recomendado
1. Resolver D-U-N-S y titular legal.
2. Crear Play Console institucional.
3. Definir package ID.
4. Empaquetar Android/Capacitor.
5. Internal testing.
6. Configurar Billing solo cuando exista estructura merchant válida.
7. Closed testing si la cuenta lo exige.
8. Data Safety + listing.
9. Release candidate.
10. Producción.

## Referencias oficiales a revisar antes de ejecutar
- Play Console Help: “Comienza a usar Play Console”.
- Play Console Help: “Información obligatoria para crear una cuenta de desarrollador de Play Console”.
- Play Console Help: “Requisitos de pruebas de aplicaciones para las nuevas cuentas personales de desarrollador”.
- Play Console Help: “Ubicaciones admitidas para el registro de comercios y desarrolladores”.
- Play Console Help: “Pagos” y “Entender la política de pagos de Google Play”.
