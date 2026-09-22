import { createFileRoute } from "@tanstack/react-router";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe.server";
import { alreadyForwarded, markForwarded, seenInMemory } from "@/lib/webhook-dedup.server";
import { zoneFromPostalCode } from "@/lib/shipping";
import { ORIGEN_PEDIDO } from "@/lib/checkout-schema";

const N8N_TIMEOUT_MS = 12_000;

/**
 * Caracteres con los que Excel y LibreOffice empiezan a interpretar una celda
 * como fórmula. Airtable no evalúa nada, pero sus exportaciones a CSV se abren
 * en una hoja de cálculo, y ahí sí se ejecutan.
 */
const INICIO_DE_FORMULA = /^[=+\-@\t\r]/;

/**
 * Texto libre del comprador listo para guardarse. Si empieza por un carácter de
 * fórmula se le antepone un apóstrofo, que es como se marca «esto es texto» en
 * una hoja de cálculo.
 */
function textoSeguro(valor: string | null | undefined): string | null {
  if (valor == null) return null;
  return INICIO_DE_FORMULA.test(valor) ? `'${valor}` : valor;
}

/** Igual que `textoSeguro`, sobre los campos libres de una dirección. */
function direccionSegura(address: Stripe.Address | null | undefined): Stripe.Address | null {
  if (!address) return null;
  return {
    ...address,
    line1: textoSeguro(address.line1),
    line2: textoSeguro(address.line2),
    city: textoSeguro(address.city),
    state: textoSeguro(address.state),
    postal_code: textoSeguro(address.postal_code),
    // `country` es un código ISO de dos letras que pone Stripe, no texto libre.
  };
}

/** `orderRef` es un `randomUUID()`; cualquier otra cosa no la generamos nosotros. */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Motivo por el que esta sesión NO es un pedido válido de esta tienda, o `null`
 * si lo es.
 *
 * La firma solo demuestra que el evento viene de Stripe para este endpoint, no
 * que la sesión la creáramos nosotros. Si la cuenta de Stripe se usara algún día
 * para otro flujo, sus sesiones llegarían igual hasta aquí.
 *
 * ⚠️ Las sesiones creadas antes de que existiera la marca `source` (pruebas de
 * septiembre de 2026) no la llevan: al reenviar uno de esos eventos antiguos se
 * descartará. Es lo esperado.
 */
function motivoParaDescartar(
  session: Stripe.Checkout.Session,
  tipo: Stripe.Event["type"],
): string | null {
  if (session.metadata?.source !== ORIGEN_PEDIDO) {
    return `no lleva la marca de origen (source=${session.metadata?.source ?? "ausente"})`;
  }
  if (session.mode !== "payment") return `modo inesperado (${session.mode})`;
  if (session.currency !== "eur") return `moneda inesperada (${session.currency})`;

  const orderRef = session.client_reference_id ?? session.metadata?.orderRef ?? "";
  if (!UUID.test(orderRef)) return "el orderRef no tiene el formato esperado";

  // Un pago fallido llega con el pedido sin pagar: ahí no se exige nada. En los
  // dos eventos de éxito, el pago tiene que constar cobrado de verdad.
  if (tipo !== "checkout.session.async_payment_failed" && session.payment_status !== "paid") {
    return `el pago no consta cobrado (payment_status=${session.payment_status})`;
  }
  return null;
}

const RELEVANT_EVENTS = new Set<Stripe.Event["type"]>([
  "checkout.session.completed",
  "checkout.session.async_payment_succeeded",
  "checkout.session.async_payment_failed",
]);

/**
 * Webhook de Stripe. Única fuente de verdad del estado del pago (CLAUDE.md §3-§4).
 *
 * Contrato de reintentos (pedido explícito de la clienta):
 *   - Solo se responde 200 a Stripe cuando n8n ha confirmado (2xx) que ha
 *     recibido el pedido.
 *   - Si n8n falla, da timeout o es inalcanzable → se responde 5xx para que
 *     Stripe reintente. Nunca 200 si el pedido no llegó a n8n.
 *   - Firma inválida → 400 (no se procesa, no se reintenta).
 *   - Evento no relevante → 200 (para que Stripe deje de reenviarlo).
 *
 * Deduplicación: aquí se descartan los eventos ya entregados, apuntados en la
 * metadata de Stripe (ver `webhook-dedup.server.ts`), y n8n vuelve a
 * descartarlos por `eventId`. Stripe puede entregar el mismo evento más de una
 * vez y en cualquier orden.
 *
 * ⚠️ **Lo que esto NO cubre**, para que nadie lo dé por resuelto:
 *   - Dos entregas simultáneas del mismo evento: ninguna de las dos barreras es
 *     atómica, así que ambas pueden llegar a n8n.
 *   - Dos Event distintos de Stripe para la misma sesión y el mismo tipo:
 *     tienen `event.id` diferente y pasan los dos.
 * En ambos casos la red de seguridad es el `upsert` de n8n. Cerrarlo de verdad
 * exige una clave de negocio persistente (`checkoutSessionId + event.type`) y
 * una operación atómica — ver M8 de `SEGURIDAD.md`.
 */
export const Route = createFileRoute("/api/stripe-webhook")({
  server: {
    handlers: {
      GET: () => new Response("Method Not Allowed", { status: 405 }),
      POST: async ({ request }) => {
        const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
        const n8nUrl = process.env.N8N_ORDER_WEBHOOK_URL;
        const n8nSecret = process.env.N8N_ORDER_WEBHOOK_SECRET;

        if (!webhookSecret || !n8nUrl || !n8nSecret) {
          console.error("stripe-webhook: faltan variables de entorno (STRIPE_WEBHOOK_SECRET / N8N_ORDER_WEBHOOK_URL / N8N_ORDER_WEBHOOK_SECRET)");
          return new Response("Webhook mal configurado", { status: 500 });
        }

        const signature = request.headers.get("stripe-signature");
        if (!signature) {
          return new Response("Falta la cabecera stripe-signature", { status: 400 });
        }

        const rawBody = await request.text();
        const stripe = getStripe();

        let event: Stripe.Event;
        try {
          event = await stripe.webhooks.constructEventAsync(rawBody, signature, webhookSecret);
        } catch (err) {
          console.error("stripe-webhook: firma no válida", err);
          return new Response("Firma no válida", { status: 400 });
        }

        if (!RELEVANT_EVENTS.has(event.type)) {
          return new Response("ignored", { status: 200 });
        }

        // Primera barrera, sin llamar a Stripe: ya procesado en esta instancia.
        if (seenInMemory(event.id)) {
          console.info(`stripe-webhook: evento ${event.id} ya procesado (memoria), se descarta`);
          return new Response("duplicado", { status: 200 });
        }

        const sessionRef = event.data.object as Stripe.Checkout.Session;

        // Pago asíncrono todavía pendiente: esperamos al async_payment_succeeded.
        if (
          event.type === "checkout.session.completed" &&
          sessionRef.payment_status === "unpaid"
        ) {
          return new Response("pago pendiente", { status: 200 });
        }

        // Cronómetro: la entrega buena tarda varios segundos y Stripe corta los
        // webhooks lentos. Estas marcas dicen en qué tramo se va el tiempo.
        const tInicio = Date.now();
        let msReleer = 0;
        let msN8n = 0;

        // Releemos la sesión completa (line items, dirección recogida, importes).
        let session: Stripe.Checkout.Session;
        try {
          session = await stripe.checkout.sessions.retrieve(sessionRef.id, {
            // `payment_intent` se expande para leer de su metadata los eventos
            // ya entregados a n8n, sin una llamada extra a la API.
            expand: ["line_items", "line_items.data.price.product", "payment_intent"],
          });
        } catch (err) {
          console.error("stripe-webhook: no se pudo releer la sesión", err);
          return new Response("retry", { status: 500 });
        }
        msReleer = Date.now() - tInicio;

        // ¿Es esto un pedido nuestro y en un estado que podamos dar por bueno?
        // Se responde 200: reintentarlo no va a cambiar nada.
        const descartar = motivoParaDescartar(session, event.type);
        if (descartar) {
          console.warn(
            `stripe-webhook: sesión ${session.id} descartada, ${descartar}. No se envía a n8n.`,
          );
          return new Response("no es un pedido de esta tienda", { status: 200 });
        }

        // Segunda barrera: este evento ya se entregó a n8n en una entrega anterior.
        if (alreadyForwarded(session, event.id)) {
          console.info(`stripe-webhook: evento ${event.id} ya entregado a n8n, se descarta`);
          return new Response("duplicado", { status: 200 });
        }

        const paymentIntentId =
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : (session.payment_intent?.id ?? null);

        // El envío se cobró según el código postal que el cliente escribió en
        // nuestro checkout, antes de que Stripe recogiera la dirección real.
        // Si no coinciden, el pedido se marca para que se revise a mano: puede
        // ser un error del comprador o un intento de pagar de menos.
        const cobradoPor = session.metadata?.shippingPostalCode ?? null;
        const cobradoZona = session.metadata?.shippingZone ?? null;
        const entregaEn = session.collected_information?.shipping_details?.address?.postal_code ?? null;
        const zonaEntrega = entregaEn ? zoneFromPostalCode(entregaEn) : null;
        const zonaRealEntrega = zonaEntrega?.ok ? zonaEntrega.zone : null;

        // Un solo texto listo para volcar en una columna de Airtable: quien
        // prepara el pedido tiene que verlo sin interpretar nada.
        let avisoEnvio: string | null = null;
        if (entregaEn !== null && cobradoZona !== null) {
          if (zonaEntrega && !zonaEntrega.ok) {
            avisoEnvio =
              zonaEntrega.reason === "fuera-de-cobertura"
                ? `NO ENVIAR — la dirección de entrega (CP ${entregaEn}) está en Canarias, Ceuta o Melilla, donde no enviamos. Se cobró como ${cobradoZona} (CP ${cobradoPor}). Contactar con el cliente y devolver o regularizar.`
                : `REVISAR — el CP de entrega (${entregaEn}) no es un código postal español válido. Se cobró como ${cobradoZona} (CP ${cobradoPor}).`;
          } else if (zonaRealEntrega !== cobradoZona) {
            avisoEnvio = `REVISAR — se cobró envío de ${cobradoZona} (CP ${cobradoPor}) pero la entrega es en ${zonaRealEntrega} (CP ${entregaEn}). Puede faltar diferencia de portes.`;
          }
        }
        const revisarEnvio = avisoEnvio !== null;

        if (avisoEnvio) {
          console.warn(`stripe-webhook: pedido ${session.id} — ${avisoEnvio}`);
        }

        const orderPayload = {
          eventId: event.id,
          eventType: event.type,
          status:
            event.type === "checkout.session.async_payment_failed" ? "payment_failed" : "paid",
          orderRef: session.client_reference_id ?? session.metadata?.orderRef ?? null,
          createdAt: new Date(event.created * 1000).toISOString(),
          stripe: {
            checkoutSessionId: session.id,
            paymentIntentId,
            mode: session.mode,
            livemode: event.livemode,
          },
          amount: {
            currency: session.currency,
            subtotal: session.amount_subtotal,
            shipping: session.total_details?.amount_shipping ?? 0,
            total: session.amount_total,
          },
          // El nombre, la dirección y las notas los escribe el comprador: van
          // por `textoSeguro` para que una exportación de Airtable a CSV no se
          // convierta en una fórmula en el Excel de quien la abra.
          customer: {
            email: session.customer_details?.email ?? null,
            name: textoSeguro(session.customer_details?.name),
            phone: session.customer_details?.phone ?? null,
          },
          shipping: session.collected_information?.shipping_details
            ? {
                name: textoSeguro(session.collected_information.shipping_details.name),
                address: direccionSegura(session.collected_information.shipping_details.address),
              }
            : null,
          notes: textoSeguro(session.metadata?.notes) ?? "",
          marketingOptIn: session.metadata?.marketingOptIn === "true",
          envio: {
            zonaCobrada: cobradoZona,
            codigoPostalCobrado: cobradoPor,
            codigoPostalEntrega: entregaEn,
            zonaEntrega: zonaRealEntrega,
            /** `true` si la zona de entrega no coincide con la cobrada. */
            revisar: revisarEnvio,
            /**
             * Texto para la persona que prepara el pedido, o cadena vacía si
             * todo cuadra. Va tal cual a una columna de Airtable.
             */
            aviso: avisoEnvio ?? "",
          },
          items: (session.line_items?.data ?? []).map((li) => ({
            description: li.description,
            quantity: li.quantity,
            amountSubtotal: li.amount_subtotal,
            amountTotal: li.amount_total,
            productMetadata:
              li.price && typeof li.price.product === "object" && !("deleted" in li.price.product)
                ? li.price.product.metadata
                : null,
          })),
        };

        // Reenvío a n8n. Solo 200 a Stripe si n8n responde 2xx.
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), N8N_TIMEOUT_MS);
        const tN8n = Date.now();
        try {
          const res = await fetch(n8nUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Webhook-Secret": n8nSecret,
            },
            body: JSON.stringify(orderPayload),
            signal: controller.signal,
          });
          if (!res.ok) {
            console.error(`stripe-webhook: n8n respondió ${res.status} para el evento ${event.id}`);
            return new Response("n8n error", { status: 502 });
          }
        } catch (err) {
          console.error(`stripe-webhook: no se pudo entregar a n8n el evento ${event.id}`, err);
          return new Response("n8n inalcanzable", { status: 504 });
        } finally {
          clearTimeout(timeout);
          msN8n = Date.now() - tN8n;
        }

        // n8n ha confirmado: se apunta el evento para no volver a entregarlo.
        const tMarcar = Date.now();
        await markForwarded(stripe, session, event.id);

        console.info(
          `stripe-webhook: ${event.id} entregado en ${Date.now() - tInicio} ms ` +
            `(releer sesión ${msReleer} · n8n ${msN8n} · marcar ${Date.now() - tMarcar})`,
        );

        return new Response("ok", { status: 200 });
      },
    },
  },
});
