import { createServerFn } from "@tanstack/react-start";
import { checkoutSchema } from "@/lib/checkout-schema";
import { getProductById } from "@/data/products";
import { calcShippingCents } from "@/lib/shipping";

export type CheckoutSummaryLine = {
  id: string;
  name: string;
  size: string;
  qty: number;
  unitCents: number;
  lineCents: number;
};

/**
 * Punto de entrada del pago. En esta fase (pre-Stripe) solo valida los datos,
 * recalcula los importes en el servidor y devuelve `{ ready: false }`.
 *
 * La tarea de Stripe rellenará el interior del `handler`:
 *   - crear un pedido interno con id propio ANTES de llamar a Stripe
 *   - crear la Checkout Session (server-only) con los `line_items` a partir de `lines`
 *     (importes ya recalculados aquí, nunca los del cliente)
 *   - idempotency key = id del pedido; vincular vía metadata / client_reference_id
 *   - success_url = /pedido/confirmado (nueva ruta a crear); cancel_url = /checkout
 *   - el webhook verificado será la ÚNICA fuente de verdad del estado del pago
 *   Ver CLAUDE.md §2–§5.
 */
export const createCheckoutSession = createServerFn({ method: "POST" })
  .validator(checkoutSchema)
  .handler(async ({ data }) => {
    const lines: CheckoutSummaryLine[] = data.items.map((item) => {
      const product = getProductById(item.id);
      if (!product) {
        throw new Error(`Producto no disponible: ${item.id}`);
      }
      if (!product.sizes.includes(item.size)) {
        throw new Error(`Talla no disponible para ${product.name}: ${item.size}`);
      }
      return {
        id: product.id,
        name: product.name,
        size: item.size,
        qty: item.qty,
        unitCents: product.priceCents,
        lineCents: product.priceCents * item.qty,
      };
    });

    const subtotalCents = lines.reduce((sum, l) => sum + l.lineCents, 0);
    const shippingCents = calcShippingCents(
      lines.map((l) => ({ id: l.id, qty: l.qty })),
      subtotalCents,
    );
    const totalCents = subtotalCents + shippingCents;

    return {
      ready: false as const,
      summary: { lines, subtotalCents, shippingCents, totalCents },
    };
  });
