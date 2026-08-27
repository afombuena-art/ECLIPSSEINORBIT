# CLAUDE.md — ECLIPSSEINORBIT / Integración Stripe

## Contexto
Proyecto TanStack Start (Vite + React) desplegado en Vercel.
Se está integrando pasarela de pago Stripe. Este documento es
de obligado cumplimiento en todo lo relacionado con pagos.

## 1. Gestión de secretos — innegociable

- NUNCA hardcodear claves de Stripe (sk_..., whsec_..., pk_...) en
  ningún archivo del repo, ni siquiera "temporalmente para probar".
- Toda clave sensible se referencia SOLO como variable de entorno:
  `process.env.STRIPE_SECRET_KEY`, `process.env.STRIPE_WEBHOOK_SECRET`.
- Solo las credenciales explícitamente publicables por Stripe (pk_...)
  pueden exponerse al navegador. Todo lo demás es server-only, sin
  excepciones ni suposiciones.
- NUNCA escribir claves, tokens ni datos de tarjeta en console.log,
  logs de servidor, comentarios de código, mensajes de commit, ni
  output de terminal.
- NUNCA imprimir variables de entorno sensibles con `env`, `printenv`,
  `console.log(process.env...)`, scripts de debug ni comandos
  equivalentes — ni siquiera para comprobar que están bien cargadas.
- NUNCA crear, editar ni leer el contenido de .env, .env.local ni
  variantes — esos archivos los gestiona Ana directamente.
- Si hace falta un valor real de una clave para probar algo, la
  respuesta correcta es pedírselo a Ana para que lo meta ella en
  Vercel o en .env.local — nunca pegarlo en el chat ni escribirlo
  en un archivo del repo.

## 2. Arquitectura de pagos

- Usar Stripe Checkout (página alojada por Stripe) como opción por
  defecto, salvo que se pida explícitamente una UI de pago propia
  con Stripe Elements. El número de tarjeta NUNCA debe pasar por
  código propio.
- La creación de Checkout Sessions se hace exclusivamente en server
  functions de TanStack Start (createServerFn), nunca en código que
  se ejecuta en el navegador.
- Usar idempotency keys en toda creación de Checkout Session /
  Payment Intent que pueda repetirse por retry. La key debe
  representar una operación lógica (ej. "checkout del pedido X"),
  no una petición HTTP aleatoria.
- No actualizar el paquete `stripe` ni cambiar de versión de API
  como parte incidental de esta integración. Si hace falta
  actualizar, parar y pedir confirmación primero. No migrar a una
  API preview/beta/experimental sin permiso explícito.

## 3. Confirmación de pago — regla principal

- NUNCA marcar un pedido como pagado, completado o entregado
  basándose en que el usuario llegó a `success_url` o en una
  respuesta del frontend. Eso solo significa que Stripe lo redirigió
  ahí, no que el pago se haya confirmado.
- El webhook verificado de Stripe es la ÚNICA fuente autoritativa
  del estado real del pago.

## 4. Webhooks

- La verificación de firma se hace sobre el body bruto/exacto
  recibido, con `stripe.webhooks.constructEvent()`. No parsear,
  transformar ni volver a serializar el payload antes de verificar
  — cuidado especial con middlewares de parseo automático que
  puedan tocar la request antes de tiempo.
- Un evento sin firma válida se rechaza, no se procesa "por si acaso".
- Procesar únicamente los tipos de evento explícitamente necesarios
  para el flujo actual (mínimo: `checkout.session.completed`; si se
  habilitan métodos de pago asíncronos, añadir también
  `checkout.session.async_payment_succeeded` /
  `async_payment_failed`). Eventos de tipos no contemplados se
  ignoran de forma segura, no se descartan con error.
- El procesamiento de webhooks debe ser idempotente: comprobar
  `event.id` contra lo ya registrado antes de aplicar cualquier
  cambio, y no asumir que los eventos llegarán en orden ni una sola
  vez.
- NO aplicar un rate limit genérico al endpoint del webhook — Stripe
  hace reintentos legítimos y un límite mal puesto puede bloquear
  entregas reales. La protección del webhook es la firma + la
  idempotencia, no el rate limiting.

## 5. Estado de pedidos y reconciliación

- Crear primero un pedido/checkout interno con un ID propio antes
  de iniciar el pago con Stripe.
- Vincular ese ID con el objeto de Stripe vía `metadata` o
  `client_reference_id` en la Checkout Session.
- Los IDs de Stripe (`checkout_session_id`, `payment_intent_id`)
  se guardan server-side asociados al pedido correspondiente.
- El estado local del pedido se actualiza solo mediante operaciones
  idempotentes, comprobando el estado actual antes de modificarlo.
- Nunca confiar en un ID de pedido que venga del cliente sin
  comprobar server-side que pertenece a esa sesión/usuario.
- `metadata` se usa para IDs internos opacos (order_id, user_id),
  nunca para copiar datos sensibles o personales del usuario.

## 6. Validación y manejo de errores

- Validar todo input que llegue del cliente en el servidor antes de
  crear cualquier cobro. El importe a cobrar se recalcula
  server-side desde el catálogo real — nunca se confía en el
  importe tal cual venga del frontend.
- Los mensajes de error al usuario final son genéricos ("No se pudo
  procesar el pago").
- Los logs de servidor contienen solo lo necesario para
  diagnosticar: IDs (request_id, event.id, checkout_session.id,
  order_id) y códigos de error — nunca bodies completos de
  requests/responses de Stripe ni objetos Stripe completos que
  puedan contener datos del cliente.

## 7. Red y acceso

- CORS es una defensa adicional, no un mecanismo de autenticación.
  Nunca autorizar una operación de pago basándose solo en Origin,
  Referer o headers controlables por el cliente — cualquiera puede
  llamar al endpoint sin pasar por el navegador.
- Toda operación que dependa de identidad valida la sesión
  server-side.
- Rate limiting sí aplica a endpoints iniciados por usuarios
  (ej. el que crea la Checkout Session), no al webhook.
- Toda comunicación en producción va sobre HTTPS (Vercel lo fuerza
  por defecto — no desactivar).

## 8. Entornos

- Durante todo el desarrollo se usan claves de test
  (sk_test_/pk_test_). No se prueba con claves live salvo
  indicación explícita de Ana confirmando que es intencional.
- Antes de cualquier despliegue a producción con claves live,
  confirmar explícitamente con Ana que el cambio está listo.

## 9. Higiene del repositorio

- No modificar nada dentro de .vercel/output — es un artefacto de
  build generado automáticamente. Si aparece cualquier cambio ahí,
  es señal de que algo se ejecutó mal, no un cambio a subir.
- Confirmar que .env, .env.local y variantes están en .gitignore.
  Si no lo están, avisar antes de hacer ningún commit.
- Nunca hacer `git push` directo a main. Todo el trabajo vive en
  el branch feature/stripe-integration hasta revisión.

## 10. Pruebas antes de dar por bueno el flujo (manual, en test mode)

Antes de considerar la integración lista, verificar manualmente
con claves de test:
- Pago completado correctamente → el pedido se marca como pagado
  solo tras recibir y verificar el webhook, no antes.
- Firma de webhook inválida → el evento se rechaza.
- Mismo webhook enviado dos veces → no se duplica el efecto.
- Llegar a `success_url` sin que el webhook haya llegado todavía →
  el pedido NO aparece como pagado.
- Un importe manipulado desde el frontend → el servidor lo
  recalcula y no confía en el valor recibido.

## 11. Cuándo parar y preguntar

Claude Code debe detenerse y pedir confirmación explícita antes de:
- Instalar cualquier dependencia nueva no mencionada por Ana.
- Actualizar el SDK de Stripe o cambiar de versión de API.
- Modificar archivos de configuración de despliegue (vercel.json,
  config de Nitro, etc.).
- Hacer cualquier `git push` o abrir un Pull Request.
- Tocar cualquier archivo de autenticación, sesiones de usuario, o
  datos sensibles ya existentes en el proyecto, aunque no tenga
  relación directa con Stripe.

## 12. Mantenimiento del hook de gitleaks

El hook de pre-commit (`.githooks/pre-commit`) busca el binario de
gitleaks en el PATH y, si no lo encuentra, en rutas conocidas de
WinGet/Chocolatey. Si se cambia de máquina, se reinstala gitleaks en
otra ubicación, o pasan un par de semanas de desarrollo activo,
conviene verificar que el hook sigue bloqueando commits con secretos:

1. Crear un archivo de prueba con una clave falsa `sk_live_` de
   formato válido (prefijo `sk_live_` seguido de ~24-30 caracteres
   alfanuméricos).
2. Hacer `git add` de ese archivo e intentar un commit: debe fallar.
3. Borrar el archivo de prueba sin dejar rastro — que no quede ni en
   el index, ni en el disco, ni en ningún commit del historial.