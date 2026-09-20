import { randomUUID } from "node:crypto";
import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import type Stripe from "stripe";
import { checkoutSchema } from "@/lib/checkout-schema";
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
 */
export const createCheckoutSession = createServerFn({ method: "POST" })
  .validator(checkoutSchema)
  .handler(async ({ data }) => {
    const stripe = getStripe();
    const origin = resolveOrigin();

    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = data.items.map(
      (item) => {
        const product = getProductById(item.id);
        if (!product) {
          throw new Error(`Producto no disponible: ${item.id}`);
        }
        if (!product.sizes.includes(item.size)) {
          throw new Error(`Talla no disponible para ${product.name}: ${item.size}`);
        }
        return {
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
        };
      },
    );

    const subtotalCents = data.items.reduce((sum, item) => {
      const product = getProductById(item.id);
      return sum + (product ? product.priceCents * item.qty : 0);
    }, 0);

    // La zona se recalcula aquí: el navegador se puede manipular y el envío no
    // puede depender de lo que diga el cliente.
    const lookup = zoneFromPostalCode(data.shippingPostalCode);
    if (!lookup.ok) {
      throw new Error(
        lookup.reason === "fuera-de-cobertura"
          ? "No enviamos a ese código postal. Escríbenos por WhatsApp y gestionamos tu pedido de otra manera."
          : "El código postal no es válido.",
      );
    }

    const quote = quoteShipping(
      data.items.map((i) => ({ id: i.id, qty: i.qty })),
      subtotalCents,
      lookup.zone,
    );
    if (!quote.ok) {
      throw new Error(
        "Este pedido supera el peso máximo de envío. Escríbenos por WhatsApp y lo gestionamos de otra manera.",
      );
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

    return { url: session.url };
  });
