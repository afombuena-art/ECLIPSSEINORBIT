import { errorSeguro } from "@/lib/log-safety.server";

/**
 * Forma mínima del binding de Rate Limiting de Cloudflare Workers que
 * necesitamos. Se declara aquí (en vez de importar el tipo generado por
 * `wrangler types`) para poder probar `checkRateLimit` en Node, sin depender
 * del runtime de Workers ni de `cloudflare:workers`.
 * https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/
 */
export interface RateLimiterBinding {
  limit(options: { key: string }): Promise<{ success: boolean }>;
}

export type RateLimitOutcome = "allowed" | "blocked" | "error";

/**
 * ⚠️ El contador de este binding es **local por ubicación (colo) de
 * Cloudflare y eventualmente consistente entre ubicaciones**: no es un
 * cerrojo global exacto. Un atacante repartido entre varias ubicaciones
 * puede superar el límite nominal antes de que se sincronice. Es una defensa
 * de abuso razonable, no una garantía atómica — igual de razonable que la
 * que se había evaluado para Vercel WAF (ver SEGURIDAD.md, hallazgo A1).
 *
 * Falla cerrado: si el binding lanza (el servicio de rate limiting no
 * responde), se devuelve "error" y quien llama debe rechazar la petición en
 * vez de crear una sesión de Stripe sin límite.
 */
export async function checkRateLimit(
  limiter: RateLimiterBinding,
  key: string,
): Promise<RateLimitOutcome> {
  try {
    const { success } = await limiter.limit({ key });
    return success ? "allowed" : "blocked";
  } catch (error) {
    console.error("rate-limit: el binding falló", errorSeguro(error));
    return "error";
  }
}
