import { describe, expect, it } from "vitest";
import { errorSeguro } from "./log-safety.server";

/** Igual de completo que un `Stripe.errors.StripeError` real: incluye
 * `raw` y `headers`, que es justo lo que `errorSeguro` no debe dejar pasar. */
function errorDeStripeDeMentira() {
  return {
    type: "StripeInvalidRequestError",
    code: "resource_missing",
    statusCode: 404,
    requestId: "req_5mzVBe7b1XLJgG",
    message: "No such checkout session: 'cs_test_no_existe'",
    raw: {
      type: "invalid_request_error",
      headers: { "stripe-version": "2026-08-26.dahlia" },
      statusCode: 404,
    },
    headers: {
      "request-id": "req_5mzVBe7b1XLJgG",
      "reporting-endpoints": "csp=https://q.stripe.com/csp-report-v2?q=algo-largo",
    },
  };
}

describe("errorSeguro", () => {
  it("de un error con forma de Stripe, extrae solo tipo/código/estadoHttp/requestId", () => {
    const salida = errorSeguro(errorDeStripeDeMentira());
    expect(salida).toEqual({
      tipo: "StripeInvalidRequestError",
      codigo: "resource_missing",
      estadoHttp: 404,
      requestId: "req_5mzVBe7b1XLJgG",
    });
  });

  it("nunca incluye `raw`, `headers` ni `message` de un error de Stripe", () => {
    const salida = errorSeguro(errorDeStripeDeMentira());
    const claves = Object.keys(salida);
    expect(claves).not.toContain("raw");
    expect(claves).not.toContain("headers");
    expect(claves).not.toContain("message");
    expect(JSON.stringify(salida)).not.toContain("stripe-version");
    expect(JSON.stringify(salida)).not.toContain("csp-report");
  });

  it("de un Error normal (fetch, binding de Cloudflare...), devuelve nombre y mensaje", () => {
    const salida = errorSeguro(new TypeError("Failed to fetch"));
    expect(salida).toEqual({ nombre: "TypeError", mensaje: "Failed to fetch" });
  });

  it("de un valor que no es un error, lo convierte a texto sin lanzar", () => {
    expect(errorSeguro("mensaje de texto")).toEqual({ valor: "mensaje de texto" });
    expect(errorSeguro(undefined)).toEqual({ valor: "undefined" });
    expect(errorSeguro(null)).toEqual({ valor: "null" });
  });
});
