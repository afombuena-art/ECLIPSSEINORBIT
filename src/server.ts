import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";
import { errorSeguro } from "./lib/log-safety.server";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!body.includes('"unhandled":true') || !body.includes('"message":"HTTPError"')) {
    return response;
  }

  console.error(
    "server: h3 swallowed SSR error",
    errorSeguro(consumeLastCapturedError() ?? new Error("HTTPError")),
  );
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error("server: error sin capturar en el fetch handler", errorSeguro(error));
      return new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },

  /**
   * Horario de Cloudflare (`triggers.crons` en wrangler.jsonc): revisión automática
   * de ventas. Compara los pagos de Stripe con el stock de Airtable y anota los que
   * falten. Ver `src/lib/conciliacion.server.ts`. Nunca lanza: un fallo aquí no puede
   * afectar a la web, solo se registra (y, si se puede, se avisa por Incidencias).
   */
  async scheduled(
    _event: unknown,
    env: Record<string, unknown>,
    ctx: { waitUntil: (p: Promise<unknown>) => void },
  ) {
    ctx.waitUntil(
      (async () => {
        try {
          // Los secretos del Worker llegan en `env`; el código del proyecto los lee
          // de process.env. Se copian solo los textos y sin pisar los que ya estén.
          for (const [clave, valor] of Object.entries(env)) {
            if (typeof valor === "string" && process.env[clave] === undefined) {
              process.env[clave] = valor;
            }
          }
          const [{ conciliarVentas }, { getStripe }] = await Promise.all([
            import("./lib/conciliacion.server"),
            import("./lib/stripe.server"),
          ]);
          await conciliarVentas(getStripe());
        } catch (error) {
          console.error("server: la revisión automática de ventas falló", errorSeguro(error));
        }
      })(),
    );
  },
};
