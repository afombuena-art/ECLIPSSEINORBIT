import { createStart, createMiddleware, createCsrfMiddleware } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { env } from "cloudflare:workers";

import { renderErrorPage } from "./lib/error-page";
import { checkRateLimit } from "./lib/rate-limit.server";

// Protege las server functions (RPC same-origin) frente a peticiones cross-site.
// Va antes que el límite de peticiones: una petición cross-site rechazada no
// debe gastar cuota del contador.
const csrfMiddleware = createCsrfMiddleware({
  filter: (ctx) => ctx.handlerType === "serverFn",
});

/**
 * Límite de peticiones para crear sesiones de Checkout (SEGURIDAD.md, A1). No
 * cubre /api/stripe-webhook, que no es una server function: CLAUDE.md §4
 * prohíbe limitarlo.
 *
 * Va aquí, como middleware de petición, y no dentro del `.handler()` de
 * `createCheckoutSession`: comprobado con dos variantes del middleware de
 * función oficial de TanStack (`createMiddleware({type: "function"})`) que
 * awaitear el binding de Rate Limiting de Cloudflare dentro del árbol de
 * dispatch de una `createServerFn` rompe la construcción de la respuesta
 * (error 500 genérico en vez de servir el resultado), tanto devolviendo un
 * `Response` propio desde el middleware de función (rechazado además por el
 * compilador: su contrato exige devolver el resultado de `next()`) como
 * pasando el resultado por `sendContext` y devolviendo el 429 desde el
 * propio `.handler()`. En esta capa, antes de que arranque ese dispatch
 * interno, funciona bien.
 *
 * El filtro por `handlerType === "serverFn"` limita hoy exactamente a
 * `createCheckoutSession`, porque es la única server function del proyecto
 * (comprobado leyendo `createStartHandler.js`: `handlerType: "serverFn"` se
 * fija por el prefijo de la URL, antes de resolver qué función concreta es).
 * Si se añade otra, revisar este filtro para no limitarla también sin
 * querer.
 *
 * ⚠️ El contador del binding es local por ubicación de Cloudflare y
 * eventualmente consistente entre ubicaciones: es una defensa de abuso
 * razonable, no un cerrojo global exacto.
 */
const rateLimitMiddleware = createMiddleware().server(async ({ next, handlerType }) => {
  if (handlerType !== "serverFn") return await next();

  // `CF-Connecting-IP` la pone Cloudflare en el borde y no se puede falsear
  // desde fuera (a diferencia de `X-Forwarded-For`). No se registra en ningún
  // log. Si faltara —no debería pasar detrás de Cloudflare— se usa una clave
  // aleatoria por petición en vez de una clave compartida: una petición sin
  // esa cabecera no debe compartir cupo con el resto del tráfico.
  const clientIp = getRequest().headers.get("CF-Connecting-IP") ?? crypto.randomUUID();

  const outcome = await checkRateLimit(env.CHECKOUT_RATE_LIMITER, clientIp);
  if (outcome === "blocked") {
    return Response.json({ ok: false, error: "DEMASIADAS_PETICIONES" }, { status: 429 });
  }
  // Falla cerrado: si el binding no responde, no se crea una sesión de
  // Stripe sin límite.
  if (outcome === "error") {
    return Response.json({ ok: false, error: "SERVICIO_NO_DISPONIBLE" }, { status: 503 });
  }
  return await next();
});

const errorMiddleware = createMiddleware().server(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    if (error != null && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    console.error(error);
    return new Response(renderErrorPage(), {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
});

export const startInstance = createStart(() => ({
  requestMiddleware: [csrfMiddleware, rateLimitMiddleware, errorMiddleware],
}));
