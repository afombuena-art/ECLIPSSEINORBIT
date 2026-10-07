import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  caducidadReserva,
  leerStockPublico,
  liberarReserva,
  registrarVenta,
  reservarStock,
  vaciarCacheDeStock,
} from "./stock-airtable.server";

/**
 * Airtable simulado en memoria. Reproduce lo que el código necesita de verdad:
 * filtro por pedido, filtro de reservas vigentes, `createdTime` creciente, el
 * enlace Ventas → Stock y el rollup `Vendidas`. Si Airtable cambia su API,
 * estas pruebas seguirán en verde: hay que repetir la prueba real en preproducción.
 */
type Reg = { id: string; createdTime: string; fields: Record<string, unknown> };

function airtableFalso(opts: { alCrearReserva?: (db: Record<string, Reg[]>) => void } = {}) {
  let n = 0;
  const db: Record<string, Reg[]> = { Stock: [], Ventas: [], Reservas: [] };
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

  const llamadas: string[] = [];
  const fetchFalso = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
    const url = new URL(String(input));
    const tabla = decodeURIComponent(url.pathname.split("/").pop() as string);
    const metodo = init?.method ?? "GET";
    llamadas.push(`${metodo} ${tabla}`);
    const json = (o: unknown) => new Response(JSON.stringify(o), { status: 200 });

    if (metodo === "GET") {
      const filtro = url.searchParams.get("filterByFormula") ?? "";
      let filas = db[tabla];
      if (filtro.startsWith("IS_AFTER({Caduca}")) {
        filas = filas.filter((r) => Date.parse(String(r.fields.Caduca)) > Date.now());
      } else if (filtro.startsWith("{Pedido}='")) {
        const pedido = filtro.slice("{Pedido}='".length, -1);
        filas = filas.filter((r) => r.fields.Pedido === pedido);
      }
      return json({ records: tabla === "Stock" ? filas.map(vistaStock) : filas });
    }
    if (metodo === "POST") {
      const body = JSON.parse(String(init?.body)) as {
        records: { fields: Record<string, unknown> }[];
      };
      const creados = body.records.map((r) => nuevo(r.fields));
      db[tabla].push(...creados);
      if (tabla === "Reservas") opts.alCrearReserva?.(db);
      return json({ records: creados });
    }
    // DELETE
    const ids = url.search
      .slice(1)
      .split("&")
      .map((p) => decodeURIComponent(p.split("=")[1]));
    db[tabla] = db[tabla].filter((r) => !ids.includes(r.id));
    return json({ records: ids.map((id) => ({ id, deleted: true })) });
  });
  return { db, stock, fetchFalso, llamadas, nuevo };
}

const UUID_A = "11111111-1111-4111-8111-111111111111";
const UUID_B = "22222222-2222-4222-8222-222222222222";
const AZUL_M = { producto: "camiseta-azul", talla: "M", cantidad: 1 };

function preparar(opts?: Parameters<typeof airtableFalso>[0]) {
  const a = airtableFalso(opts);
  a.stock("camiseta-azul", "M", 1);
  a.stock("camiseta-azul", "S", 1);
  a.stock("gorra-verde", "Talla única", 12);
  vi.stubGlobal("fetch", a.fetchFalso);
  return a;
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-10-07T12:00:00Z"));
  vi.stubEnv("AIRTABLE_STOCK_TOKEN", "tkn_de_prueba");
  vi.stubEnv("AIRTABLE_STOCK_BASE_ID", "appPRUEBA");
  vaciarCacheDeStock();
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("reservar", () => {
  it("aparta la unidad y la segunda persona se queda sin ella", async () => {
    preparar();
    const a = await reservarStock(UUID_A, [AZUL_M]);
    expect(a.ok).toBe(true);
    const b = await reservarStock(UUID_B, [AZUL_M]);
    expect(b).toEqual({ ok: false, error: "SIN_STOCK" });
  });

  it("una reserva caducada deja de contar sola", async () => {
    preparar();
    await reservarStock(UUID_A, [AZUL_M]);
    vi.setSystemTime(new Date("2026-10-07T12:40:00Z"));
    expect((await reservarStock(UUID_B, [AZUL_M])).ok).toBe(true);
  });

  it("el reintento de la misma operación no se bloquea a sí mismo y no duplica reservas", async () => {
    const { db } = preparar();
    await reservarStock(UUID_A, [AZUL_M]);
    expect((await reservarStock(UUID_A, [AZUL_M])).ok).toBe(true);
    expect(db.Reservas.filter((r) => r.fields.Pedido === UUID_A)).toHaveLength(1);
  });

  it("rechaza lo que no existe en la tabla Stock", async () => {
    preparar();
    const r = await reservarStock(UUID_A, [{ producto: "camiseta-sun", talla: "M", cantidad: 1 }]);
    expect(r).toEqual({ ok: false, error: "SIN_STOCK" });
  });

  it("rechaza pedir más unidades de las que hay", async () => {
    preparar();
    expect(await reservarStock(UUID_A, [{ ...AZUL_M, cantidad: 2 }])).toEqual({
      ok: false,
      error: "SIN_STOCK",
    });
    expect(
      (
        await reservarStock(UUID_A, [
          { producto: "gorra-verde", talla: "Talla única", cantidad: 12 },
        ])
      ).ok,
    ).toBe(true);
  });

  it("si dos personas reservan a la vez, solo se queda la que se creó antes", async () => {
    // Simula la carrera: justo al crear la nuestra, aparece otra más antigua.
    const a = preparar({
      alCrearReserva: (db) => {
        const rival = {
          id: "recRIVAL",
          createdTime: new Date(1_600_000_000_000).toISOString(),
          fields: {
            Pedido: UUID_B,
            Producto: "camiseta-azul",
            Talla: "M",
            Cantidad: 1,
            Caduca: new Date(Date.now() + 31 * 60_000).toISOString(),
          },
        };
        if (!db.Reservas.some((r) => r.id === "recRIVAL")) db.Reservas.push(rival);
      },
    });
    const r = await reservarStock(UUID_A, [AZUL_M]);
    expect(r).toEqual({ ok: false, error: "SIN_STOCK" });
    // y no deja basura: solo queda la reserva del rival
    expect(a.db.Reservas.map((x) => x.fields.Pedido)).toEqual([UUID_B]);
  });

  it("si Airtable falla, no se vende y no se deja reserva a medias", async () => {
    const a = preparar();
    const normal = a.fetchFalso.getMockImplementation()!;
    a.fetchFalso.mockImplementation(async (u, init) => {
      if (init?.method === "POST") throw new Error("red caída");
      return normal(u, init);
    });
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    expect(await reservarStock(UUID_A, [AZUL_M])).toEqual({
      ok: false,
      error: "SERVICIO_NO_DISPONIBLE",
    });
    expect(a.db.Reservas).toHaveLength(0);
  });

  it("nunca imprime el token", async () => {
    const a = preparar();
    const espia = vi.spyOn(console, "error").mockImplementation(() => undefined);
    a.fetchFalso.mockRejectedValue(new Error("fallo con Bearer tkn_de_prueba"));
    await reservarStock(UUID_A, [AZUL_M]);
    // El mensaje del error sí puede llegar; el código no añade cabeceras ni URLs.
    for (const llamada of espia.mock.calls) {
      expect(JSON.stringify(llamada)).not.toContain("Authorization");
    }
  });
});

describe("sin configuración de Airtable", () => {
  it("en producción no se vende", async () => {
    vi.unstubAllEnvs();
    vi.stubEnv("NODE_ENV", "production");
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    expect(await reservarStock(UUID_A, [AZUL_M])).toEqual({
      ok: false,
      error: "SERVICIO_NO_DISPONIBLE",
    });
    await expect(registrarVenta(UUID_A, [AZUL_M])).rejects.toThrow();
  });

  it("en desarrollo usa el stock estático", async () => {
    vi.unstubAllEnvs();
    vi.stubEnv("NODE_ENV", "test");
    expect(await reservarStock(UUID_A, [AZUL_M])).toEqual({ ok: true, expiresAt: null });
    expect(
      await reservarStock(UUID_A, [{ producto: "camiseta-sun", talla: "M", cantidad: 1 }]),
    ).toEqual({
      ok: false,
      error: "SIN_STOCK",
    });
  });
});

describe("registrar la venta", () => {
  it("anota la venta enlazada, libera la reserva y deja el stock a cero", async () => {
    const a = preparar();
    await reservarStock(UUID_A, [AZUL_M]);
    const r = await registrarVenta(UUID_A, [AZUL_M]);
    expect(r).toEqual({ registradas: 1, negativas: [] });
    expect(a.db.Reservas).toHaveLength(0);
    expect(a.db.Ventas).toHaveLength(1);
    expect(a.db.Ventas[0].fields.Stock).toEqual([a.db.Stock[0].id]);
    expect((await reservarStock(UUID_B, [AZUL_M])).ok).toBe(false);
  });

  it("es idempotente: repetir el aviso de Stripe no duplica la venta", async () => {
    const a = preparar();
    await registrarVenta(UUID_A, [AZUL_M]);
    const otra = await registrarVenta(UUID_A, [AZUL_M]);
    expect(otra.registradas).toBe(0);
    expect(a.db.Ventas).toHaveLength(1);
  });

  it("avisa cuando el stock queda en negativo (el email lo manda Airtable)", async () => {
    preparar();
    const espia = vi.spyOn(console, "error").mockImplementation(() => undefined);
    await registrarVenta(UUID_A, [AZUL_M]);
    const r = await registrarVenta(UUID_B, [AZUL_M]);
    expect(r.negativas).toEqual(["camiseta-azul M"]);
    expect(espia.mock.calls.some((c) => String(c[0]).includes("STOCK NEGATIVO"))).toBe(true);
  });

  it("una prenda que no está en Stock se registra igualmente y se avisa", async () => {
    const a = preparar();
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const r = await registrarVenta(UUID_A, [
      { producto: "camiseta-nueva", talla: "M", cantidad: 1 },
    ]);
    expect(r.negativas[0]).toContain("sin fila en Stock");
    expect(a.db.Ventas).toHaveLength(1);
  });
});

describe("liberar y mostrar", () => {
  it("liberar borra solo las reservas de ese pedido", async () => {
    const a = preparar();
    await reservarStock(UUID_A, [AZUL_M]);
    await reservarStock(UUID_B, [{ producto: "gorra-verde", talla: "Talla única", cantidad: 2 }]);
    await liberarReserva(UUID_A);
    expect(a.db.Reservas.map((r) => r.fields.Pedido)).toEqual([UUID_B]);
  });

  it("lo que se muestra descuenta lo vendido y lo reservado", async () => {
    preparar();
    await reservarStock(UUID_A, [{ producto: "gorra-verde", talla: "Talla única", cantidad: 2 }]);
    vaciarCacheDeStock();
    const p = await leerStockPublico();
    expect(p.fiable).toBe(true);
    expect(p.stock["gorra-verde|Talla única"]).toBe(10);
    expect(p.stock["camiseta-azul|M"]).toBe(1);
  });

  it("si Airtable falla al mostrar, no rompe la web: último dato bueno", async () => {
    const a = preparar();
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    await leerStockPublico();
    vi.setSystemTime(new Date("2026-10-07T12:05:00Z"));
    a.fetchFalso.mockRejectedValue(new Error("caído"));
    const p = await leerStockPublico();
    expect(p.fiable).toBe(true);
    expect(p.stock["gorra-verde|Talla única"]).toBe(12);
  });

  it("sin dato previo y con Airtable caído, enseña el estático marcado como no fiable", async () => {
    const a = preparar();
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    a.fetchFalso.mockRejectedValue(new Error("caído"));
    const p = await leerStockPublico();
    expect(p.fiable).toBe(false);
    expect(p.stock["camiseta-sun|M"]).toBe(0);
  });
});

describe("caducidad", () => {
  it("dura al menos 31 minutos y es estable dentro del mismo tramo de 5", () => {
    const t0 = Date.parse("2026-10-07T12:00:10Z");
    const c = caducidadReserva(t0);
    expect(c - t0).toBeGreaterThanOrEqual(31 * 60_000);
    expect(c - t0).toBeLessThan(37 * 60_000);
    expect(caducidadReserva(t0 + 2_000)).toBe(c);
  });
});
