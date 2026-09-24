import { createFileRoute } from "@tanstack/react-router";
import { getStripe } from "@/lib/stripe.server";
import { pareceIdDeSesion, resolveOrderStatus, type OrderStatus } from "@/lib/order-status.server";

/**
 * Estado informativo de un pedido para /pedido/confirmado (SEGURIDAD M9).
 * Ruta de servidor normal, no una `createServerFn`: el middleware de rate
 * limiting de `src/start.ts` solo limita `handlerType === "serverFn"` (la
 * creación de Checkout Sessions), y esta consulta de solo lectura no debe
 * compartir ese cupo — no crea nada en Stripe, es la misma familia que el
 * webhook.
 *
 * Devuelve solo un estado de tres valores, nunca datos del cliente, la
 * dirección ni información del pago. No marca nada como pagado ni escribe en
 * ningún sitio: es una lectura de apoyo para la interfaz, no sustituye al
 * webhook, que sigue siendo la única fuente de verdad (CLAUDE.md §3).
 */
export const Route = createFileRoute("/api/pedido-estado")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const sessionId = new URL(request.url).searchParams.get("session_id");
        if (!pareceIdDeSesion(sessionId)) {
          return Response.json({ estado: "no_confirmado" satisfies OrderStatus });
        }

        const stripe = getStripe();
        const estado: OrderStatus = await resolveOrderStatus(sessionId, (id) =>
          stripe.checkout.sessions.retrieve(id),
        );
        return Response.json({ estado });
      },
    },
  },
});
