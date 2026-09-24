import type Stripe from "stripe";
import { ORIGEN_PEDIDO } from "@/lib/checkout-schema";

/**
 * Estado visible en /pedido/confirmado (SEGURIDAD M9). Solo tres valores,
 * a propósito: la interfaz no debe distinguir más matices que estos, para no
 * exponer datos del pago. "confirmado" es la única lectura optimista; todo lo
 * demás —pendiente de verdad, sesión ajena, sesión que no existe, o un fallo
 * al leer Stripe— cae en un estado que no promete nada.
 */
export type OrderStatus = "confirmado" | "pendiente" | "no_confirmado";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Forma de una Checkout Session de Stripe que hace falta para decidir el estado. */
export type SessionParaEstado = Pick<
  Stripe.Checkout.Session,
  "metadata" | "mode" | "currency" | "client_reference_id" | "payment_status"
>;

/**
 * Deriva el estado a partir de una Checkout Session ya leída de Stripe (o
 * `null` si no se pudo leer). Función pura, sin llamadas a Stripe: así se
 * puede probar con sesiones de mentira, sin secretos ni red.
 *
 * ⚠️ Esto es solo informativo. Nunca marca el pedido como pagado, nunca
 * escribe en Airtable ni llama a n8n: el webhook sigue siendo la única
 * fuente de verdad del pago (CLAUDE.md §3). Esta función solo decide qué
 * lectura, entre tres, se le enseña al comprador mientras espera.
 *
 * Los mismos cuatro criterios que ya exige el webhook antes de aceptar una
 * sesión como propia (`motivoParaDescartar` en api.stripe-webhook.ts): marca
 * de origen, modo, moneda y formato de la referencia del pedido. Si
 * cualquiera de ellos falla, o la sesión no es de esta tienda, es
 * "no_confirmado" — nunca se afirma nada sobre una sesión ajena.
 */
export function deriveOrderStatus(session: SessionParaEstado | null): OrderStatus {
  if (!session) return "no_confirmado";
  if (session.metadata?.source !== ORIGEN_PEDIDO) return "no_confirmado";
  if (session.mode !== "payment") return "no_confirmado";
  if (session.currency !== "eur") return "no_confirmado";

  const orderRef = session.client_reference_id ?? session.metadata?.orderRef ?? "";
  if (!UUID.test(orderRef)) return "no_confirmado";

  if (session.payment_status === "paid") return "confirmado";
  if (session.payment_status === "unpaid") return "pendiente";
  // "no_payment_required" no debería darse en mode: "payment". Por prudencia,
  // no se interpreta como pagado.
  return "no_confirmado";
}

/** ID de Checkout Session válido a simple vista, antes de gastar una llamada a Stripe. */
export function pareceIdDeSesion(sessionId: string | null): sessionId is string {
  return sessionId !== null && /^cs_(test|live)_[A-Za-z0-9]+$/.test(sessionId);
}

/**
 * Lee la sesión (vía `retrieve`, inyectado para poder probarlo sin llamar a
 * Stripe de verdad) y deriva el estado. Un fallo de Stripe —caído, timeout,
 * ID que no existe— se trata igual que una sesión ajena: "no_confirmado", no
 * se propaga el error a la interfaz ni se afirma nada que no se ha podido
 * comprobar.
 */
export async function resolveOrderStatus(
  sessionId: string,
  retrieve: (sessionId: string) => Promise<SessionParaEstado>,
): Promise<OrderStatus> {
  try {
    const session = await retrieve(sessionId);
    return deriveOrderStatus(session);
  } catch (error) {
    console.error("pedido-estado: no se pudo leer la sesión en Stripe", error);
    return "no_confirmado";
  }
}
