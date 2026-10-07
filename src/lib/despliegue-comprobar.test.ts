import { describe, expect, it } from "vitest";
import { comprobarPaquete } from "../../scripts/despliegue-comprobar.mjs";

/**
 * Protege del error que casi sobrescribe producción el 2026-10-07: compilar sin
 * `CLOUDFLARE_ENV` produce un paquete de producción, y `wrangler deploy` lo subía
 * allí. Estas pruebas fijan qué paquete es válido para cada destino.
 */
const preprod = {
  name: "eclipsseinorbit-preprod",
  vars: {
    SITE_URL: "https://eclipsseinorbit-preprod.eclipssebrand.workers.dev",
    APP_ENV: "preprod",
  },
};
const produccion = { name: "eclipsseinorbit", vars: {} };

describe("comprobarPaquete", () => {
  it("acepta el paquete de preproducción para preprod", () => {
    expect(comprobarPaquete(preprod, "preprod")).toEqual({ ok: true });
  });

  it("acepta el paquete de producción para producción", () => {
    expect(comprobarPaquete(produccion, "produccion")).toEqual({ ok: true });
  });

  it("RECHAZA subir a preproducción un paquete compilado sin CLOUDFLARE_ENV (el error original)", () => {
    const r = comprobarPaquete(produccion, "preprod");
    expect(r.ok).toBe(false);
  });

  it("RECHAZA subir a producción un paquete de preproducción", () => {
    expect(comprobarPaquete(preprod, "produccion").ok).toBe(false);
  });

  it("rechaza un paquete de preprod al que le faltan las variables", () => {
    expect(comprobarPaquete({ name: "eclipsseinorbit-preprod", vars: {} }, "preprod").ok).toBe(
      false,
    );
  });

  it("rechaza un destino desconocido o una configuración ilegible", () => {
    expect(comprobarPaquete(preprod, "staging").ok).toBe(false);
    expect(comprobarPaquete(null, "preprod").ok).toBe(false);
  });
});
