import type Stripe from "stripe";

/**
 * Deduplicación de eventos de Stripe (segundo cerrojo).
 *
 * Stripe puede entregar el mismo evento más de una vez (reintentos, reenvíos
 * manuales). Sin esta comprobación, el mismo pedido llega dos veces a n8n y se
 * duplica en Airtable.
 *
 * n8n también deduplica por `eventId`, pero depender solo de eso es frágil:
 * basta con que alguien toque ese nodo para que vuelvan a duplicarse pedidos.
 * Aquí se comprueba antes de salir de la web.
 *
 * Dónde se apunta: este proyecto no tiene base de datos, así que se usa la
 * metadata del PaymentIntent de Stripe, que ya viene sin coste extra al expandir
 * la sesión. Si no hubiera PaymentIntent, se cae a la metadata de la propia
 * Checkout Session.
 */

/** Clave de metadata donde se apuntan los eventos ya entregados a n8n. */
const FORWARDED_KEY = "n8nForwarded";

/** Stripe limita cada valor de metadata a 500 caracteres. Dejamos margen. */
const MAX_VALUE_CHARS = 480;

/**
 * Caché en memoria: primera barrera, sin llamar a Stripe. Solo vale dentro de
 * esta instancia del servidor, por eso NO sustituye a la marca en Stripe.
 */
const seenInThisInstance = new Set<string>();
const SEEN_MAX = 500;

function remember(eventId: string): void {
  if (seenInThisInstance.size >= SEEN_MAX) seenInThisInstance.clear();
  seenInThisInstance.add(eventId);
}

/** `true` si este evento ya se procesó en esta misma instancia del servidor. */
export function seenInMemory(eventId: string): boolean {
  return seenInThisInstance.has(eventId);
}

function readForwarded(metadata: Stripe.Metadata | null | undefined): string[] {
  const raw = metadata?.[FORWARDED_KEY];
  if (!raw) return [];
  return raw.split(",").filter(Boolean);
}

/** El PaymentIntent expandido, o `null` si no viene como objeto. */
function expandedPaymentIntent(session: Stripe.Checkout.Session): Stripe.PaymentIntent | null {
  const pi = session.payment_intent;
  return pi && typeof pi !== "string" ? pi : null;
}

/**
 * `true` si este evento ya se entregó a n8n. Se lee de la sesión ya recuperada,
 * sin llamadas extra a la API.
 */
export function alreadyForwarded(session: Stripe.Checkout.Session, eventId: string): boolean {
  if (seenInMemory(eventId)) return true;
  const pi = expandedPaymentIntent(session);
  return readForwarded(pi ? pi.metadata : session.metadata).includes(eventId);
}

/**
 * Apunta el evento como entregado. Se llama SOLO después de que n8n haya
 * confirmado (2xx).
 *
 * Nunca lanza: si Stripe rechaza la escritura, el pedido ya está en n8n y no
 * queremos provocar un reintento. Se registra el fallo y la deduplicación de
 * n8n sigue actuando como red de seguridad.
 */
export async function markForwarded(
  stripe: Stripe,
  session: Stripe.Checkout.Session,
  eventId: string,
): Promise<void> {
  remember(eventId);

  const pi = expandedPaymentIntent(session);
  const current = readForwarded(pi ? pi.metadata : session.metadata);
  if (current.includes(eventId)) return;

  // Se conservan los más recientes; al llenarse el campo se descartan los viejos
  // (un evento de hace semanas ya no lo va a reintentar Stripe).
  const next = [...current, eventId];
  while (next.join(",").length > MAX_VALUE_CHARS && next.length > 1) next.shift();

  try {
    if (pi) {
      await stripe.paymentIntents.update(pi.id, {
        metadata: { [FORWARDED_KEY]: next.join(",") },
      });
    } else {
      await stripe.checkout.sessions.update(session.id, {
        metadata: { [FORWARDED_KEY]: next.join(",") },
      });
    }
  } catch (err) {
    console.error(
      `stripe-webhook: no se pudo marcar el evento ${eventId} como entregado. ` +
        `El pedido SÍ llegó a n8n; ante un reintento de Stripe la deduplicación ` +
        `dependerá de n8n.`,
      err,
    );
  }
}
