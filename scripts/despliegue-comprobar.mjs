/**
 * Comprobación del paquete compilado ANTES de subirlo a Cloudflare.
 *
 * Por qué existe: con `@cloudflare/vite-plugin` el Worker de destino se elige al
 * COMPILAR (variable `CLOUDFLARE_ENV`), no al desplegar. Compilar sin ella genera
 * un paquete que apunta al Worker de PRODUCCIÓN, y `wrangler deploy` lo sube allí
 * sin avisar. Descubierto el 2026-10-07 antes de subir nada.
 */
export const DESTINOS = {
  preprod: {
    cloudflareEnv: "preprod",
    worker: "eclipsseinorbit-preprod",
    descripcion: "PREPRODUCCIÓN (eclipsseinorbit-preprod, página de pruebas con noindex)",
  },
  produccion: {
    cloudflareEnv: null,
    worker: "eclipsseinorbit",
    descripcion: "PRODUCCIÓN (eclipsseinorbit, la tienda real)",
  },
};

/** @returns {{ok: true} | {ok: false, motivo: string}} */
export function comprobarPaquete(config, destino) {
  const d = DESTINOS[destino];
  if (!d) return { ok: false, motivo: `destino desconocido: ${destino}` };
  if (!config || typeof config !== "object") {
    return { ok: false, motivo: "no se pudo leer dist/server/wrangler.json" };
  }
  if (config.name !== d.worker) {
    return {
      ok: false,
      motivo: `el paquete apunta al Worker «${config.name}» y debía apuntar a «${d.worker}»`,
    };
  }
  const appEnv = config.vars?.APP_ENV;
  if (destino === "preprod" && appEnv !== "preprod") {
    return { ok: false, motivo: "faltan las variables de preproducción (APP_ENV=preprod)" };
  }
  if (destino === "produccion" && appEnv) {
    return { ok: false, motivo: `el paquete de producción trae APP_ENV=${appEnv}` };
  }
  return { ok: true };
}
