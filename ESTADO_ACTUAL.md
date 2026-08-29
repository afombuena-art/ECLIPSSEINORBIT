# Estado actual — Integración Stripe + n8n

_Última actualización: 2026-08-29_
_Branch: `feature/stripe-integration`_

## Qué está hecho

- **Stripe Checkout integrado** (página alojada por Stripe). La Checkout Session
  se crea server-side en `src/lib/checkout.server.ts`; los importes se recalculan
  desde el catálogo, nunca se confía en el frontend. El número de tarjeta no pasa
  por código propio.
- **Webhook de Stripe verificado** (`src/routes/api.stripe-webhook.ts`). Firma
  validada sobre el body bruto con `constructEventAsync`. Solo responde 200 a
  Stripe cuando n8n confirma (2xx) que recibió el pedido; si n8n falla, responde
  5xx para que Stripe reintente.
- **Workflow de n8n funcionando en producción** (ya no en modo Test). Recibe el
  payload de pedido pagado, valida la cabecera `X-Webhook-Secret` y registra el
  pedido en Airtable.
- **Venta solo en España — confirmado.** No se toca el código de envío ni de
  países.

## Bug abierto — deduplicación por `eventId`

- **Síntoma:** al reenviar el evento `evt_1U9q0m3pSwZ8rGo9SvI6bh3A` con
  `stripe events resend`, se creó un **registro duplicado en Airtable con el
  mismo `eventId`**. La tabla estaba vacía antes de la prueba.
- **Impacto:** la deduplicación no está protegiendo contra los reintentos
  legítimos de Stripe. Riesgo de pedidos duplicados en producción.

### Pendiente para mañana (diagnóstico)

1. Abrir el historial de **Executions** de n8n y localizar la ejecución de ese
   reenvío (`evt_1U9q0m3pSwZ8rGo9SvI6bh3A`).
2. Ver **qué devolvió el nodo "Buscar duplicado"** en esa ejecución concreta.
3. Determinar dónde está el fallo:
   - **En la búsqueda** → no encontró el registro ya existente (filtro mal,
     campo equivocado, timing/carrera entre las dos ejecuciones...).
   - **En el nodo "¿Ya existe?"** → sí encontró el registro pero tomó la rama
     equivocada (condición invertida o mal evaluada).
4. Corregir el nodo que corresponda y volver a probar el reenvío del mismo
   evento → no debe duplicar.

## Bloqueado por el cliente

- **Datos fiscales** (razón social, NIF, domicilio) para completar los textos
  legales (aviso legal, términos, privacidad, devoluciones).
- **Tarifas de envío reales** para sustituir los valores provisionales del
  cálculo de envío.
