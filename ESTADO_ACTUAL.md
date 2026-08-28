# Estado actual — Integración Stripe + n8n

_Última actualización: 2026-08-28_
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
- **Workflow de n8n montado y probado con la URL de Test.** Recibe el payload de
  pedido pagado, valida la cabecera `X-Webhook-Secret` y registra el pedido.
  Probado end-to-end en modo test de Stripe.

## Qué falta para mañana (exacto)

1. **Activar el workflow de n8n en producción** (pasar de Test a Production /
   "Active").
2. **Actualizar `N8N_ORDER_WEBHOOK_URL`** con la URL de producción del workflow
   (en `.env.local` y en las variables de entorno de Vercel).
3. **Volver a probar el flujo completo** con la URL de producción (pago test →
   webhook → n8n → pedido registrado).
4. **Verificar la deduplicación por `eventId`**: reenviar el mismo evento de
   Stripe dos veces y confirmar que n8n no duplica el pedido.

## Bloqueado por el cliente

- **Datos fiscales** (razón social, NIF, domicilio) para completar los textos
  legales (aviso legal, términos, privacidad, devoluciones).
- **Tarifas de envío reales** para sustituir los valores provisionales del
  cálculo de envío.
