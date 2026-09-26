import { createFileRoute } from "@tanstack/react-router";
import { env } from "cloudflare:workers";
import { getStripe } from "@/lib/stripe.server";
import { checkRateLimit } from "@/lib/rate-limit.server";
import { handlePedidoEstadoRequest } from "@/lib/order-status.server";

function jsonNoStore(body: unknown, status: number): Response {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

/**
 * Estado informativo de un pedido para /pedido/confirmado (SEGURIDAD M9).
 * Ruta de servidor normal, no una `createServerFn`: el middleware de rate
 * limiting de `src/start.ts` solo limita `handlerType === "serverFn"` (la
 * creación de Checkout Sessions), y esta consulta de solo lectura no debe
 * compartir ese cupo — no crea nada en Stripe, es la misma familia que el
 * webhook.
 *
 * Límite de peticiones propio (SEGURIDAD, revisión 2026-09-26): un ID con
 * formato válido pero inexistente sigue disparando una llamada real a
 * Stripe en cada petición. Reutiliza el mismo binding oficial `Rate
 * Limiting` que el checkout, pero con una clave distinta
 * (`pedido-estado:<ip>` en vez de `<ip>`), así que tiene su propio cupo:
 * consultar el estado de un pedido nunca resta cupo a la creación de
 * Checkout Sessions, ni al revés. No crea ningún binding ni recurso nuevo.
 *
 * Devuelve solo un estado de tres valores, nunca datos del cliente, la
 * dirección ni información del pago. No marca nada como pagado ni escribe en
 * ningún sitio: es una lectura de apoyo para la interfaz, no sustituye al
 * webhook, que sigue siendo la única fuente de verdad (CLAUDE.md §3).
 *
 * `Cache-Control: no-store` en toda respuesta: ni el navegador ni ningún
 * proxy intermedio deben guardar el estado de un pago.
 */
export const Route = createFileRoute("/api/pedido-estado")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const sessionId = new URL(request.url).searchParams.get("session_id");

        // `CF-Connecting-IP` la pone Cloudflare en el borde y no se puede
        // falsear desde fuera. No se registra en ningún log. Si faltara —no
        // debería pasar detrás de Cloudflare— una clave aleatoria evita que
        // esa petición comparta cupo con el resto del tráfico.
        const clientIp = request.headers.get("CF-Connecting-IP") ?? crypto.randomUUID();
        const checkLimit = () =>
          checkRateLimit(env.CHECKOUT_RATE_LIMITER, `pedido-estado:${clientIp}`);

        const { estado, httpStatus } = await handlePedidoEstadoRequest(
          sessionId,
          checkLimit,
          (id) => getStripe().checkout.sessions.retrieve(id),
        );
        return jsonNoStore({ estado }, httpStatus);
      },
    },
  },
});
