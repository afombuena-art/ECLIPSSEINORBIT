import type Stripe from "stripe";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ORIGEN_PEDIDO } from "./checkout-schema";
import {
  conciliarVentas,
  DESDE,
  lineasDeSesion,
  marcarStockRegistrado,
  STOCK_REGISTRADO_KEY,
} from "./conciliacion.server";
import {
  registrarVentaConReintentos,
  vaciarCacheDeStock,
  anotarIncidencia,
} from "./stock-airtable.server";

/**
 * La revisión automática compara los pagos de Stripe con las ventas de Airtable.
 * Aquí se simulan los dos. Si cualquiera de las dos APIs cambia, estas pruebas
 * seguirán en verde: hay que repetir la comprobación real en preproducción.
 */

// ── Airtable simulado (stock, ventas, reservas, incidencias) ─────────────────
type Reg = { id: string; createdTime: string; fields: Record<string, unknown> };

function airtableFalso() {
  let n = 0;
  const db: Record<string, Reg[]> = { Stock: [], Ventas: [], Reservas: [], Incidencias: [] };
  const nuevo = (fields: Record<string, unknown>): Reg => {
    n += 1;
    return { id: `rec${n}`, createdTime: new Date(1_700_000_000_000 + n).toISOString(), fields };
  };
  const stock = (p: string, t: string, iniciales: number) =>
    db.Stock.push(nuevo({ Producto: p, Talla: t, "Unidades iniciales": iniciales }));
  const vistaStock = (r: Reg): Reg => {
    const vendidas = db.Ventas.filter((v) =>
      (v.fields.Stock as string[] | undefined)?.includes(r.id),
    ).reduce((s, v) => s + Number(v.fields.Cantidad), 0);
    return { ...r, fields: { ...r.fields, Vendidas: vendidas } };
  };
  const fallar = { tablas: new Set<string>() }; // tablas cuyo POST devuelve 500

  const fetchFalso = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
    const url = new URL(String(input));
    const tabla = decodeURIComponent(url.pathname.split("/").pop() as string);
    const metodo = init?.method ?? "GET";
    const json = (o: unknown) => new Response(JSON.stringify(o), { status: 200 });

    if (metodo === "GET") {
      const filtro = url.searchParams.get("filterByFormula") ?? "";
      let filas = db[tabla];
      let m: RegExpMatchArray | null;
      if (filtro.startsWith("IS_AFTER({Caduca}")) {
        filas = filas.filter((r) => Date.parse(String(r.fields.Caduca)) > Date.now());
      } else if ((m = filtro.match(/^AND\(\{Pedido\}='(.*)', \{Tipo\}='(.*)'\)$/))) {
        filas = filas.filter((r) => r.fields.Pedido === m![1] && r.fields.Tipo === m![2]);
      } else if (
        (m = filtro.match(
          /^AND\(\{Tipo\}='(.*)', IS_AFTER\(\{Registrada\}, DATEADD\(NOW\(\), -(\d+), 'hours'\)\)\)$/,
        ))
      ) {
        const limite = Date.now() - Number(m[2]) * 3_600_000;
        filas = filas.filter(
          (r) => r.fields.Tipo === m![1] && Date.parse(String(r.fields.Registrada)) > limite,
        );
      } else if ((m = filtro.match(/^\{Pedido\}='(.*)'$/))) {
        filas = filas.filter((r) => r.fields.Pedido === m![1]);
      }
      return json({ records: tabla === "Stock" ? filas.map(vistaStock) : filas });
    }
    if (metodo === "POST") {
      if (fallar.tablas.has(tabla)) return new Response("{}", { status: 500 });
      const body = JSON.parse(String(init?.body)) as {
        records: { fields: Record<string, unknown> }[];
      };
      const creados = body.records.map((r) => nuevo(r.fields));
      db[tabla].push(...creados);
      return json({ records: creados });
    }
    const ids = url.search
      .slice(1)
      .split("&")
      .map((p) => decodeURIComponent(p.split("=")[1]));
    db[tabla] = db[tabla].filter((r) => !ids.includes(r.id));
    return json({ records: ids.map((id) => ({ id, deleted: true })) });
  });
  return { db, stock, fetchFalso, fallar };
}

// ── Stripe simulado ──────────────────────────────────────────────────────────
type Opciones = {
  id: string;
  orderRef: string;
  creadaHaceMin?: number;
  creada?: number; // segundos; pisa a creadaHaceMin
  marcada?: boolean;
  reembolsada?: boolean;
  origen?: string;
  pagada?: boolean;
  lineas?: { producto: string; talla: string; cantidad: number }[];
};

function stripeFalso(lista: Opciones[], ahora: number) {
  const pis = new Map<
    string,
    { id: string; metadata: Record<string, string>; latest_charge: unknown }
  >();
  const sesiones = lista.map((o) => {
    const pi = {
      id: `pi_${o.id}`,
      metadata: (o.marcada ? { [STOCK_REGISTRADO_KEY]: "1" } : {}) as Record<string, string>,
      latest_charge: { refunded: !!o.reembolsada, amount_refunded: o.reembolsada ? 2397 : 0 },
    };
    pis.set(pi.id, pi);
    const base = {
      id: o.id,
      client_reference_id: o.orderRef,
      created: o.creada ?? Math.floor((ahora - (o.creadaHaceMin ?? 120) * 60_000) / 1000),
      payment_status: o.pagada === false ? "unpaid" : "paid",
      metadata: { source: o.origen ?? ORIGEN_PEDIDO, orderRef: o.orderRef },
      payment_intent: pi,
    };
    const lineas = o.lineas ?? [{ producto: "camiseta-azul", talla: "M", cantidad: 1 }];
    const completa = {
      ...base,
      line_items: {
        data: lineas.map((l) => ({
          quantity: l.cantidad,
          price: { product: { metadata: { productId: l.producto, size: l.talla } } },
        })),
      },
    };
    return { lista: base, completa };
  });
  const listFalso = vi.fn((params: { created: { gte: number } }) => ({
    autoPagingToArray: async () =>
      sesiones.map((s) => s.lista).filter((s) => s.created >= params.created.gte),
  }));
  const stripe = {
    checkout: {
      sessions: {
        list: listFalso,
        retrieve: vi.fn(async (id: string) => sesiones.find((s) => s.lista.id === id)!.completa),
      },
    },
    paymentIntents: {
      update: vi.fn(async (id: string, data: { metadata: Record<string, string> }) => {
        Object.assign(pis.get(id)!.metadata, data.metadata);
      }),
    },
  } as unknown as Stripe;
  return { stripe, pis, listFalso };
}

const PEDIDO_A = "11111111-1111-4111-8111-111111111111";
const PEDIDO_B = "22222222-2222-4222-8222-222222222222";
const AHORA = DESDE + 24 * 3_600_000; // un día después de la fecha de corte

function preparar() {
  const a = airtableFalso();
  a.stock("camiseta-azul", "M", 1);
  a.stock("camiseta-azul", "S", 1);
  vi.stubGlobal("fetch", a.fetchFalso);
  return a;
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(AHORA));
  vi.stubEnv("AIRTABLE_STOCK_TOKEN", "tkn_de_prueba");
  vi.stubEnv("AIRTABLE_STOCK_BASE_ID", "appPRUEBA");
  vaciarCacheDeStock();
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  vi.spyOn(console, "info").mockImplementation(() => undefined);
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("revisión automática de ventas", () => {
  it("anota la venta que faltaba, deja la marca y avisa", async () => {
    const a = preparar();
    const { stripe, pis } = stripeFalso([{ id: "cs_1", orderRef: PEDIDO_A }], AHORA);
    const r = await conciliarVentas(stripe, AHORA, [0]);
    expect(r).toMatchObject({ pendientes: 1, recuperadas: 1, errores: 0 });
    expect(a.db.Ventas).toHaveLength(1);
    expect(a.db.Ventas[0].fields).toMatchObject({
      Pedido: PEDIDO_A,
      Producto: "camiseta-azul",
      Talla: "M",
    });
    expect(pis.get("pi_cs_1")!.metadata[STOCK_REGISTRADO_KEY]).toBe("1");
    expect(a.db.Incidencias).toHaveLength(1);
    expect(a.db.Incidencias[0].fields).toMatchObject({
      Tipo: "Venta recuperada",
      Pedido: PEDIDO_A,
    });
  });

  it("NO recrea una venta que se borró a propósito (el pago lleva la marca)", async () => {
    const a = preparar();
    const { stripe } = stripeFalso([{ id: "cs_1", orderRef: PEDIDO_A, marcada: true }], AHORA);
    const r = await conciliarVentas(stripe, AHORA, [0]);
    expect(r.pendientes).toBe(0);
    expect(a.db.Ventas).toHaveLength(0);
    expect(a.db.Incidencias).toHaveLength(0);
  });

  it("es idempotente: ejecutarla dos veces no duplica ventas ni avisos", async () => {
    const a = preparar();
    const { stripe } = stripeFalso([{ id: "cs_1", orderRef: PEDIDO_A }], AHORA);
    await conciliarVentas(stripe, AHORA, [0]);
    await conciliarVentas(stripe, AHORA, [0]);
    expect(a.db.Ventas).toHaveLength(1);
    expect(a.db.Incidencias).toHaveLength(1);
  });

  it("si la venta ya estaba anotada y solo faltaba la marca: la pone y no avisa", async () => {
    const a = preparar();
    await registrarVentaConReintentos(
      PEDIDO_A,
      [{ producto: "camiseta-azul", talla: "M", cantidad: 1 }],
      [0],
    );
    const { stripe, pis } = stripeFalso([{ id: "cs_1", orderRef: PEDIDO_A }], AHORA);
    const r = await conciliarVentas(stripe, AHORA, [0]);
    expect(r).toMatchObject({ yaAnotadas: 1, recuperadas: 0 });
    expect(a.db.Ventas).toHaveLength(1);
    expect(a.db.Incidencias).toHaveLength(0);
    expect(pis.get("pi_cs_1")!.metadata[STOCK_REGISTRADO_KEY]).toBe("1");
  });

  it("no toca pagos reembolsados: el stock ya se gestionó a mano", async () => {
    const a = preparar();
    const { stripe } = stripeFalso([{ id: "cs_1", orderRef: PEDIDO_A, reembolsada: true }], AHORA);
    const r = await conciliarVentas(stripe, AHORA, [0]);
    expect(r).toMatchObject({ reembolsadas: 1, pendientes: 0 });
    expect(a.db.Ventas).toHaveLength(0);
  });

  it("no se adelanta al webhook: ignora pagos de hace menos de 40 minutos", async () => {
    const a = preparar();
    const { stripe } = stripeFalso([{ id: "cs_1", orderRef: PEDIDO_A, creadaHaceMin: 10 }], AHORA);
    const r = await conciliarVentas(stripe, AHORA, [0]);
    expect(r.revisadas).toBe(0);
    expect(a.db.Ventas).toHaveLength(0);
  });

  it("ignora los pagos anteriores a la fecha de corte (pruebas de antes de existir la marca)", async () => {
    const a = preparar();
    const antiguo = Math.floor((DESDE - 3_600_000) / 1000);
    const { stripe } = stripeFalso([{ id: "cs_1", orderRef: PEDIDO_A, creada: antiguo }], AHORA);
    const r = await conciliarVentas(stripe, AHORA, [0]);
    expect(r.revisadas).toBe(0);
    expect(a.db.Ventas).toHaveLength(0);
  });

  it("ignora sesiones de otro origen, sin pagar o con un identificador raro", async () => {
    const a = preparar();
    const { stripe } = stripeFalso(
      [
        { id: "cs_1", orderRef: PEDIDO_A, origen: "otra-tienda" },
        { id: "cs_2", orderRef: PEDIDO_B, pagada: false },
        { id: "cs_3", orderRef: "no-es-un-uuid" },
      ],
      AHORA,
    );
    const r = await conciliarVentas(stripe, AHORA, [0]);
    expect(r.revisadas).toBe(0);
    expect(a.db.Ventas).toHaveLength(0);
  });

  it("avisa de stock negativo cuando la venta recuperada se pasa de lo que había", async () => {
    const a = preparar();
    await registrarVentaConReintentos(
      PEDIDO_B,
      [{ producto: "camiseta-azul", talla: "M", cantidad: 1 }],
      [0],
    );
    const { stripe } = stripeFalso([{ id: "cs_1", orderRef: PEDIDO_A }], AHORA);
    await conciliarVentas(stripe, AHORA, [0]);
    expect(String(a.db.Incidencias[0].fields.Detalle)).toContain("NEGATIVO");
  });

  it("si anotar falla, lo cuenta y avisa una sola vez en 24 h (sin un email por hora)", async () => {
    const a = preparar();
    a.fallar.tablas.add("Ventas");
    const { stripe, pis } = stripeFalso([{ id: "cs_1", orderRef: PEDIDO_A }], AHORA);
    const r1 = await conciliarVentas(stripe, AHORA, [0]);
    expect(r1.errores).toBe(1);
    expect(pis.get("pi_cs_1")!.metadata[STOCK_REGISTRADO_KEY]).toBeUndefined(); // se reintentará
    await conciliarVentas(stripe, AHORA, [0]);
    const errores = a.db.Incidencias.filter((i) => i.fields.Tipo === "Revisión con errores");
    expect(errores).toHaveLength(1);
  });

  it("si Stripe no responde, lo registra y no rompe", async () => {
    const a = preparar();
    const stripe = {
      checkout: {
        sessions: {
          list: () => ({
            autoPagingToArray: async () => {
              throw new Error("Stripe caído");
            },
          }),
        },
      },
    } as unknown as Stripe;
    const r = await conciliarVentas(stripe, AHORA, [0]);
    expect(r.errores).toBe(1);
    expect(a.db.Incidencias[0].fields.Tipo).toBe("Revisión con errores");
  });

  it("sin configuración de Airtable no hace nada", async () => {
    preparar();
    vi.unstubAllEnvs();
    const { stripe, listFalso } = stripeFalso([{ id: "cs_1", orderRef: PEDIDO_A }], AHORA);
    const r = await conciliarVentas(stripe, AHORA, [0]);
    expect(r.saltada).toBe(true);
    expect(listFalso).not.toHaveBeenCalled();
  });
});

describe("piezas sueltas", () => {
  it("reintenta anotar la venta y acaba consiguiéndolo", async () => {
    const a = preparar();
    let intentos = 0;
    const normal = a.fetchFalso.getMockImplementation()!;
    a.fetchFalso.mockImplementation(async (u, init) => {
      if (init?.method === "POST" && String(u).includes("Ventas") && ++intentos < 2) {
        return new Response("{}", { status: 500 });
      }
      return normal(u, init);
    });
    await registrarVentaConReintentos(
      PEDIDO_A,
      [{ producto: "camiseta-azul", talla: "M", cantidad: 1 }],
      [0, 0],
    );
    expect(intentos).toBe(2);
    expect(a.db.Ventas).toHaveLength(1);
  });

  it("si agota los intentos, lanza el error", async () => {
    const a = preparar();
    a.fallar.tablas.add("Ventas");
    await expect(
      registrarVentaConReintentos(
        PEDIDO_A,
        [{ producto: "camiseta-azul", talla: "M", cantidad: 1 }],
        [0, 0],
      ),
    ).rejects.toThrow();
  });

  it("una incidencia por pedido: la segunda igual no se escribe", async () => {
    const a = preparar();
    const una = {
      tipo: "Venta no anotada" as const,
      pedido: PEDIDO_A,
      unicaPorPedido: true,
      resumen: "x",
      detalle: "y",
    };
    expect(await anotarIncidencia(una)).toBe(true);
    expect(await anotarIncidencia(una)).toBe(false);
    expect(a.db.Incidencias).toHaveLength(1);
  });

  it("anotarIncidencia nunca lanza, aunque Airtable falle", async () => {
    const a = preparar();
    a.fallar.tablas.add("Incidencias");
    await expect(
      anotarIncidencia({ tipo: "Stock negativo", resumen: "x", detalle: "y" }),
    ).resolves.toBe(false);
  });

  it("marcarStockRegistrado nunca lanza", async () => {
    const stripe = {
      paymentIntents: {
        update: vi.fn(async () => {
          throw new Error("Stripe caído");
        }),
      },
    } as unknown as Stripe;
    await expect(marcarStockRegistrado(stripe, "pi_1")).resolves.toBeUndefined();
    await expect(marcarStockRegistrado(stripe, null)).resolves.toBeUndefined();
  });

  it("lineasDeSesion lee producto, talla y cantidad de los metadatos", () => {
    const sesion = {
      line_items: {
        data: [
          {
            quantity: 2,
            price: { product: { metadata: { productId: "gorra-verde", size: "Talla única" } } },
          },
          { quantity: 1, price: { product: { metadata: {} } } }, // sin metadatos: se ignora
        ],
      },
    } as unknown as Stripe.Checkout.Session;
    expect(lineasDeSesion(sesion)).toEqual([
      { producto: "gorra-verde", talla: "Talla única", cantidad: 2 },
    ]);
  });
});
