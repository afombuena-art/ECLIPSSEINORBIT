import { describe, expect, it } from "vitest";
import {
  deriveOrderStatus,
  handlePedidoEstadoRequest,
  pareceIdDeSesion,
  resolveOrderStatus,
  type SessionParaEstado,
} from "./order-status.server";
import { ORIGEN_PEDIDO } from "./checkout-schema";

const ORDER_REF = "6f26d48c-34a8-4ea7-b7ea-a2e285e01087";

function sesion(overrides: Partial<SessionParaEstado> = {}): SessionParaEstado {
  return {
    metadata: { source: ORIGEN_PEDIDO },
    mode: "payment",
    currency: "eur",
    client_reference_id: ORDER_REF,
    payment_status: "paid",
    ...overrides,
  };
}

describe("deriveOrderStatus", () => {
  it("confirmado: sesión propia, pagada, con todo en regla", () => {
    expect(deriveOrderStatus(sesion())).toBe("confirmado");
  });

  it("pendiente: sesión propia todavía sin pagar (método de pago asíncrono)", () => {
    expect(deriveOrderStatus(sesion({ payment_status: "unpaid" }))).toBe("pendiente");
  });

  it("no_confirmado: sesión inexistente (Stripe no encontró nada, null)", () => {
    expect(deriveOrderStatus(null)).toBe("no_confirmado");
  });

  it("no_confirmado: sesión ajena a esta tienda (sin la marca de origen)", () => {
    expect(deriveOrderStatus(sesion({ metadata: { source: "otra-cosa" } }))).toBe("no_confirmado");
    expect(deriveOrderStatus(sesion({ metadata: {} }))).toBe("no_confirmado");
  });

  it("no_confirmado: modo distinto de payment", () => {
    expect(deriveOrderStatus(sesion({ mode: "subscription" }))).toBe("no_confirmado");
  });

  it("no_confirmado: moneda distinta de eur", () => {
    expect(deriveOrderStatus(sesion({ currency: "usd" }))).toBe("no_confirmado");
  });

  it("no_confirmado: referencia del pedido con formato inválido", () => {
    expect(deriveOrderStatus(sesion({ client_reference_id: "pedido-manipulado" }))).toBe(
      "no_confirmado",
    );
  });

  it("no_confirmado: payment_status inesperado (no_payment_required en mode payment)", () => {
    expect(deriveOrderStatus(sesion({ payment_status: "no_payment_required" }))).toBe(
      "no_confirmado",
    );
  });
});

describe("pareceIdDeSesion", () => {
  it("acepta el formato real de Stripe, test y live", () => {
    expect(pareceIdDeSesion("cs_test_a1B2c3D4e5F6")).toBe(true);
    expect(pareceIdDeSesion("cs_live_a1B2c3D4e5F6")).toBe(true);
  });

  it("rechaza null, vacío y valores arbitrarios", () => {
    expect(pareceIdDeSesion(null)).toBe(false);
    expect(pareceIdDeSesion("")).toBe(false);
    expect(pareceIdDeSesion("' OR 1=1--")).toBe(false);
    expect(pareceIdDeSesion("pi_algo_que_no_es_una_sesion")).toBe(false);
  });
});

describe("resolveOrderStatus", () => {
  // Nunca llama a Stripe de verdad: `retrieve` es una función de mentira en
  // cada prueba, igual que se hace con el binding de rate limiting.

  it("confirmado cuando retrieve() devuelve una sesión propia pagada", async () => {
    const estado = await resolveOrderStatus("cs_test_x", async () => sesion());
    expect(estado).toBe("confirmado");
  });

  it("pendiente cuando retrieve() devuelve una sesión propia sin pagar todavía", async () => {
    const estado = await resolveOrderStatus("cs_test_x", async () =>
      sesion({ payment_status: "unpaid" }),
    );
    expect(estado).toBe("pendiente");
  });

  it("no_confirmado si retrieve() lanza (Stripe caído, timeout, ID inexistente)", async () => {
    const estado = await resolveOrderStatus("cs_test_x", async () => {
      throw new Error("No such checkout session");
    });
    expect(estado).toBe("no_confirmado");
  });

  it("pasa el sessionId recibido a retrieve(), no un valor fijo", async () => {
    const idsRecibidos: string[] = [];
    await resolveOrderStatus("cs_test_el-id-correcto", async (id) => {
      idsRecibidos.push(id);
      return sesion();
    });
    expect(idsRecibidos).toEqual(["cs_test_el-id-correcto"]);
  });
});

describe("handlePedidoEstadoRequest", () => {
  // El límite de peticiones de este endpoint es independiente del checkout:
  // aquí solo se prueba su propia lógica (permitido/bloqueado/binding caído),
  // inyectando checkLimit() de mentira. La independencia real de los dos
  // contadores se comprueba además en la preview de Cloudflare (ver
  // 00_ESTADO_PROYECTO.md).

  it("caso permitido: consulta la sesión y devuelve 200", async () => {
    const resultado = await handlePedidoEstadoRequest(
      "cs_test_x",
      async () => "allowed",
      async () => sesion(),
    );
    expect(resultado).toEqual({ estado: "confirmado", httpStatus: 200 });
  });

  it("caso bloqueado: 429 sin llegar a llamar a Stripe", async () => {
    let seLlamoARetrieve = false;
    const resultado = await handlePedidoEstadoRequest(
      "cs_test_x",
      async () => "blocked",
      async () => {
        seLlamoARetrieve = true;
        return sesion();
      },
    );
    expect(resultado).toEqual({ estado: "no_confirmado", httpStatus: 429 });
    expect(seLlamoARetrieve).toBe(false);
  });

  it("fallo del binding de rate limiting: 503, falla cerrado sin llamar a Stripe", async () => {
    let seLlamoARetrieve = false;
    const resultado = await handlePedidoEstadoRequest(
      "cs_test_x",
      async () => "error",
      async () => {
        seLlamoARetrieve = true;
        return sesion();
      },
    );
    expect(resultado).toEqual({ estado: "no_confirmado", httpStatus: 503 });
    expect(seLlamoARetrieve).toBe(false);
  });

  it("permitido pero sin session_id o con formato inválido: 200 no_confirmado, sin llamar a Stripe", async () => {
    let seLlamoARetrieve = false;
    const retrieve = async () => {
      seLlamoARetrieve = true;
      return sesion();
    };
    expect(await handlePedidoEstadoRequest(null, async () => "allowed", retrieve)).toEqual({
      estado: "no_confirmado",
      httpStatus: 200,
    });
    expect(await handlePedidoEstadoRequest("inventado", async () => "allowed", retrieve)).toEqual({
      estado: "no_confirmado",
      httpStatus: 200,
    });
    expect(seLlamoARetrieve).toBe(false);
  });
});
