import { randomUUID } from "node:crypto";
import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import type Stripe from "stripe";
import { checkoutSchema, ORIGEN_PEDIDO, type CheckoutResult } from "@/lib/checkout-schema";
import { getProductById } from "@/data/products";
import { quoteShipping, zoneFromPostalCode, ZONE_LABELS } from "@/lib/shipping";
import { getStripe } from "@/lib/stripe.server";

function resolveOrigin(): string {
  const fromEnv = process.env.SITE_URL?.replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  return new URL(getRequest().url).origin;
}

/**
 * Crea una Checkout Session de Stripe. Los importes se recalculan aquí desde el
 * catálogo (nunca se confía en lo que manda el cliente — CLAUDE.md §6). La
 * dirección de envío la recoge Stripe. El estado real del pago llega por el
 * webhook verificado (`/api/stripe-webhook`), que es la única fuente de verdad.
 *
 * Devuelve la URL de pago, o el motivo del rechazo con un código estable. Solo
 * lanza ante fallos imprevistos (Stripe caído, configuración rota), que el
 * navegador muestra como error genérico.
 */
export const createCheckoutSession = createServerFn({ method: "POST" })
  .validator(checkoutSchema)
  .handler(async ({ data }): Promise<CheckoutResult> => {
    const stripe = getStripe();
    const origin = resolveOrigin();

    // Un carrito manipulado puede mandar la misma prenda repetida en muchas
    // líneas. Se agrupan por producto+talla antes de construir nada: Stripe
    // rechaza la sesión a partir de 100 line items y el error saldría en la
    // cara del comprador. Se conserva el orden de la primera aparición.
    const items = [
      ...data.items
        .reduce((acc, item) => {
          const clave = `${item.id}__${item.size}`;
          const previo = acc.get(clave);
          acc.set(clave, previo ? { ...previo, qty: previo.qty + item.qty } : { ...item });
          return acc;
        }, new Map<string, (typeof data.items)[number]>())
        .values(),
    ];

    // Los rechazos previsibles se devuelven con un código, no se lanzan: una
    // excepción llega al navegador como una página de error sin mensaje y el
    // comprador se queda sin saber qué corregir. Ver `CheckoutError`.
    //
    // Un solo recorrido valida, construye las líneas y suma el subtotal, para
    // que no haya forma de que las tres cosas se calculen sobre catálogos
    // distintos.
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
    let subtotalCents = 0;

    for (const item of items) {
      const product = getProductById(item.id);
      if (!product) {
        console.warn(`checkout: producto no disponible (${item.id})`);
        return { ok: false, error: "PRODUCTO_NO_DISPONIBLE" };
      }
      if (!product.sizes.includes(item.size)) {
        console.warn(`checkout: talla no disponible (${product.id} / ${item.size})`);
        return { ok: false, error: "TALLA_NO_DISPONIBLE" };
      }

      subtotalCents += product.priceCents * item.qty;
      lineItems.push({
        quantity: item.qty,
        price_data: {
          currency: "eur",
          unit_amount: product.priceCents,
          product_data: {
            name: `${product.name} · Talla ${item.size}`,
            images: [`${origin}${product.front}`],
            metadata: { productId: product.id, size: item.size },
          },
        },
      });
    }

    // La zona se recalcula aquí: el navegador se puede manipular y el envío no
    // puede depender de lo que diga el cliente.
    const lookup = zoneFromPostalCode(data.shippingPostalCode);
    if (!lookup.ok) {
      return {
        ok: false,
        error: lookup.reason === "fuera-de-cobertura" ? "FUERA_DE_COBERTURA" : "CODIGO_POSTAL_INVALIDO",
      };
    }

    const quote = quoteShipping(
      items.map((i) => ({ id: i.id, qty: i.qty })),
      subtotalCents,
      lookup.zone,
    );
    if (!quote.ok) {
      return { ok: false, error: "DEMASIADO_PESO" };
    }
    const shippingCents = quote.cents;

    // Pedido interno con id propio ANTES del pago (CLAUDE.md §5). Sirve de
    // idempotency key y de referencia para conciliar en el webhook / n8n.
    const orderRef = randomUUID();

    const session = await stripe.checkout.sessions.create(
      {
        mode: "payment",
        locale: "es",
        client_reference_id: orderRef,
        line_items: lineItems,
        shipping_address_collection: { allowed_countries: ["ES"] },
        phone_number_collection: { enabled: true },
        shipping_options: [
          {
            shipping_rate_data: {
              type: "fixed_amount",
              display_name:
                shippingCents === 0
                  ? "Envío gratis"
                  : `Envío estándar (Correos) · ${ZONE_LABELS[lookup.zone]}`,
              fixed_amount: { amount: shippingCents, currency: "eur" },
              delivery_estimate: {
                minimum: { unit: "business_day", value: 3 },
                maximum: { unit: "business_day", value: 10 },
              },
            },
          },
        ],
        success_url: `${origin}/pedido/confirmado?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/pedido/cancelado`,
        metadata: {
          // Marca de origen. El webhook exige encontrarla antes de mandar nada a
          // n8n: así, si algún día esta cuenta de Stripe se usa para otro flujo,
          // sus sesiones no acaban en el Airtable de pedidos de la tienda.
          // Si se cambia este valor, hay que cambiarlo también en el webhook.
          source: ORIGEN_PEDIDO,
          orderRef,
          notes: data.orderNotes ?? "",
          marketingOptIn: String(Boolean(data.marketingOptIn)),
          // Con qué se cobró el envío. El webhook lo compara con la dirección
          // que acabe recogiendo Stripe, por si no coinciden.
          shippingZone: lookup.zone,
          shippingPostalCode: data.shippingPostalCode,
        },
        payment_intent_data: { metadata: { orderRef } },
      },
      { idempotencyKey: `checkout:${orderRef}` },
    );

    if (!session.url) {
      throw new Error("Stripe no devolvió una URL de pago");
    }

    return { ok: true, url: session.url };
  });
