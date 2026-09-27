export const PREPROD_ROBOTS_TAG = "noindex, nofollow, noarchive";

/**
 * Marca como no indexables las respuestas HTML de preproducción (`APP_ENV`
 * viene vacío en producción, donde esta función no hace nada). Se ignoran
 * las respuestas que no sean HTML (assets, JSON de server functions) porque
 * `X-Robots-Tag` en ellas no aporta nada y podría confundir un diagnóstico.
 */
export function applyPreprodRobotsHeader(headers: Headers, appEnv: string | undefined): void {
  if (appEnv !== "preprod") return;
  if (!headers.get("content-type")?.includes("text/html")) return;
  headers.set("X-Robots-Tag", PREPROD_ROBOTS_TAG);
}
