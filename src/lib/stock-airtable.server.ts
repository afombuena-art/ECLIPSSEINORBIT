/**
 * Stock real en Airtable (base «ECLIPSSE Stock», aparte de la de pedidos).
 *
 * Tres tablas:
 *   - `Stock`    (Producto, Talla, Unidades iniciales, Vendidas = rollup de Ventas)
 *   - `Ventas`   (Pedido, Producto, Talla, Cantidad, Stock = enlace a Stock)
 *   - `Reservas` (Pedido, Producto, Talla, Cantidad, Caduca)
 *
 * Disponible = Unidades iniciales − Vendidas − reservas vigentes de OTROS pedidos.
 *
 * Por qué un libro de ventas y no «restar un número»: en Airtable leer, restar y
 * escribir no es atómico; añadir una fila sí. Una reserva caducada deja de contar
 * sola (se filtra por hora), sin tareas de limpieza ni eventos extra de Stripe.
 *
 * Reglas de diseño acordadas con Ana (2026-10-07):
 *   - Si Airtable no responde, NO se puede comprar (falla cerrado).
 *   - Para MOSTRAR el stock se tolera un dato antiguo o el estático: ver
 *     `leerStockPublico`. Para COBRAR, nunca.
 *   - El aviso de stock negativo lo manda una automatización de Airtable.
 *
 * Nada aquí imprime el token ni datos personales: solo IDs de pedido y de registro.
 */
import { products } from "@/data/products";
import { stockOf } from "@/data/stock";

const API = "https://api.airtable.com/v0";
const T_STOCK = "Stock";
const T_VENTAS = "Ventas";
const T_RESERVAS = "Reservas";

/** Stripe exige que una sesión dure al menos 30 min; 31 deja margen. */
const MINUTOS_MINIMOS = 31;
/** La caducidad se redondea hacia arriba a este tramo para que los reintentos
 *  de la misma operación produzcan exactamente los mismos parámetros en Stripe
 *  (si no, su clave de idempotencia rechaza el reintento). */
const TRAMO_MS = 5 * 60_000;
const TIMEOUT_MS = 8_000;
const CACHE_MS = 60_000;

export type LineaStock = { producto: string; talla: string; cantidad: number };

export type ResultadoReserva =
  | { ok: true; expiresAt: number | null }
  | { ok: false; error: "SIN_STOCK" | "SERVICIO_NO_DISPONIBLE" };

type Config = { token: string; baseId: string };

const clave = (producto: string, talla: string) => `${producto}|${talla}`;

function leerConfig(): Config | null {
  const token = process.env.AIRTABLE_STOCK_TOKEN;
  const baseId = process.env.AIRTABLE_STOCK_BASE_ID;
  return token && baseId ? { token, baseId } : null;
}

/** Sin configuración y fuera de producción (desarrollo, pruebas): stock estático. */
function modoEstatico(): boolean {
  return !leerConfig() && process.env.NODE_ENV !== "production";
}

// ─── Acceso a la API ─────────────────────────────────────────────────────────

type Registro = { id: string; createdTime: string; fields: Record<string, unknown> };

async function airtable<T>(
  cfg: Config,
  tabla: string,
  init: { method: "GET" | "POST" | "DELETE"; query?: string; body?: unknown },
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const url = `${API}/${cfg.baseId}/${encodeURIComponent(tabla)}${init.query ? `?${init.query}` : ""}`;
    const res = await fetch(url, {
      method: init.method,
      headers: {
        Authorization: `Bearer ${cfg.token}`,
        ...(init.body ? { "Content-Type": "application/json" } : {}),
      },
      body: init.body ? JSON.stringify(init.body) : undefined,
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`Airtable ${init.method} ${tabla} respondió ${res.status}`);
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

async function listar(cfg: Config, tabla: string, filtro?: string): Promise<Registro[]> {
  const todos: Registro[] = [];
  let offset: string | undefined;
  do {
    const q = new URLSearchParams();
    if (filtro) q.set("filterByFormula", filtro);
    if (offset) q.set("offset", offset);
    const r = await airtable<{ records: Registro[]; offset?: string }>(cfg, tabla, {
      method: "GET",
      query: q.toString(),
    });
    todos.push(...r.records);
    offset = r.offset;
  } while (offset);
  return todos;
}

async function crear(cfg: Config, tabla: string, filas: Record<string, unknown>[]) {
  const creados: Registro[] = [];
  for (let i = 0; i < filas.length; i += 10) {
    const r = await airtable<{ records: Registro[] }>(cfg, tabla, {
      method: "POST",
      body: { records: filas.slice(i, i + 10).map((fields) => ({ fields })) },
    });
    creados.push(...r.records);
  }
  return creados;
}

async function borrar(cfg: Config, tabla: string, ids: string[]) {
  for (let i = 0; i < ids.length; i += 10) {
    const q = ids
      .slice(i, i + 10)
      .map((id) => `records[]=${encodeURIComponent(id)}`)
      .join("&");
    await airtable(cfg, tabla, { method: "DELETE", query: q });
  }
}

/** Los IDs de pedido son UUID; aun así se escapa por si acaso. */
const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
const filtroPedido = (pedido: string) => `{Pedido}='${esc(pedido)}'`;
const FILTRO_VIGENTES = "IS_AFTER({Caduca}, NOW())";

// ─── Lectura ─────────────────────────────────────────────────────────────────

type FilaStock = { recordId: string; iniciales: number; vendidas: number };

async function leerStock(cfg: Config): Promise<Map<string, FilaStock>> {
  const filas = await listar(cfg, T_STOCK);
  const mapa = new Map<string, FilaStock>();
  for (const f of filas) {
    const producto = String(f.fields["Producto"] ?? "");
    const talla = String(f.fields["Talla"] ?? "");
    if (!producto || !talla) continue;
    mapa.set(clave(producto, talla), {
      recordId: f.id,
      iniciales: Number(f.fields["Unidades iniciales"] ?? 0) || 0,
      vendidas: Number(f.fields["Vendidas"] ?? 0) || 0,
    });
  }
  return mapa;
}

type Reserva = LineaStock & { recordId: string; pedido: string; creada: string };

async function leerReservasVigentes(cfg: Config): Promise<Reserva[]> {
  const filas = await listar(cfg, T_RESERVAS, FILTRO_VIGENTES);
  return filas.map((f) => ({
    recordId: f.id,
    pedido: String(f.fields["Pedido"] ?? ""),
    producto: String(f.fields["Producto"] ?? ""),
    talla: String(f.fields["Talla"] ?? ""),
    cantidad: Number(f.fields["Cantidad"] ?? 0) || 0,
    creada: f.createdTime,
  }));
}

function disponible(
  stock: Map<string, FilaStock>,
  reservas: Reserva[],
  producto: string,
  talla: string,
  excluirPedido?: string,
): number {
  const fila = stock.get(clave(producto, talla));
  if (!fila) return 0; // lo desconocido cuenta como agotado, nunca como disponible
  const apartadas = reservas
    .filter((r) => r.producto === producto && r.talla === talla && r.pedido !== excluirPedido)
    .reduce((s, r) => s + r.cantidad, 0);
  return fila.iniciales - fila.vendidas - apartadas;
}

// ─── Mostrar (la web) ────────────────────────────────────────────────────────

export type StockPublico = {
  /** `producto|talla` → unidades que se pueden comprar ahora mismo. */
  stock: Record<string, number>;
  /** `false` si es el stock estático porque Airtable no respondió: solo orientativo. */
  fiable: boolean;
};

let cache: { en: number; datos: StockPublico } | null = null;

function stockEstatico(): Record<string, number> {
  const out: Record<string, number> = {};
  for (const p of products) for (const t of p.sizes) out[clave(p.id, t)] = stockOf(p.id, t);
  return out;
}

/**
 * Stock para PINTAR la web. Nunca bloquea la página: si Airtable falla, devuelve
 * el último dato bueno (aunque tenga más de 60 s) o, en su defecto, el estático
 * marcado como no fiable. El cobro, en cambio, siempre pregunta en directo.
 */
export async function leerStockPublico(): Promise<StockPublico> {
  const cfg = leerConfig();
  if (!cfg) return { stock: stockEstatico(), fiable: modoEstatico() };
  if (cache && Date.now() - cache.en < CACHE_MS) return cache.datos;
  try {
    const [stock, reservas] = await Promise.all([leerStock(cfg), leerReservasVigentes(cfg)]);
    const out: Record<string, number> = {};
    for (const k of stock.keys()) {
      const [p, t] = k.split("|");
      out[k] = Math.max(0, disponible(stock, reservas, p, t));
    }
    cache = { en: Date.now(), datos: { stock: out, fiable: true } };
    return cache.datos;
  } catch (err) {
    console.error("stock: no se pudo leer Airtable para mostrar", mensajeSeguro(err));
    return cache?.datos ?? { stock: stockEstatico(), fiable: false };
  }
}

// ─── Cobrar: reservar ────────────────────────────────────────────────────────

/** Caducidad común de la reserva y de la sesión de Stripe, estable en el tramo. */
export function caducidadReserva(ahora = Date.now()): number {
  return Math.ceil((ahora + MINUTOS_MINIMOS * 60_000) / TRAMO_MS) * TRAMO_MS;
}

/**
 * Aparta las unidades del pedido hasta `expiresAt` (ms) o rechaza si no hay.
 * Sin Airtable configurado: en desarrollo usa el estático (sin reserva); en
 * producción falla cerrado.
 */
export async function reservarStock(
  orderRef: string,
  lineas: LineaStock[],
): Promise<ResultadoReserva> {
  const cfg = leerConfig();
  if (!cfg) {
    if (!modoEstatico()) {
      console.error("stock: faltan AIRTABLE_STOCK_TOKEN / AIRTABLE_STOCK_BASE_ID; no se vende");
      return { ok: false, error: "SERVICIO_NO_DISPONIBLE" };
    }
    const sin = lineas.some((l) => stockOf(l.producto, l.talla) < l.cantidad);
    return sin ? { ok: false, error: "SIN_STOCK" } : { ok: true, expiresAt: null };
  }

  const creadas: string[] = [];
  try {
    const expiresAt = caducidadReserva();

    // Un reintento de la misma operación sustituye su reserva anterior.
    const previas = await listar(cfg, T_RESERVAS, filtroPedido(orderRef));
    if (previas.length)
      await borrar(
        cfg,
        T_RESERVAS,
        previas.map((p) => p.id),
      );

    const [stock, reservas] = await Promise.all([leerStock(cfg), leerReservasVigentes(cfg)]);
    for (const l of lineas) {
      if (disponible(stock, reservas, l.producto, l.talla, orderRef) < l.cantidad) {
        console.warn(`stock: sin stock de ${l.producto} ${l.talla} para el pedido ${orderRef}`);
        return { ok: false, error: "SIN_STOCK" };
      }
    }

    const hechas = await crear(
      cfg,
      T_RESERVAS,
      lineas.map((l) => ({
        Pedido: orderRef,
        Producto: l.producto,
        Talla: l.talla,
        Cantidad: l.cantidad,
        Caduca: new Date(expiresAt).toISOString(),
      })),
    );
    creadas.push(...hechas.map((h) => h.id));

    // Segunda comprobación: si dos personas reservaron a la vez, gana la que
    // se creó antes. Ambas ven el mismo orden, así que solo una se queda.
    const ahora = await leerReservasVigentes(cfg);
    for (const l of lineas) {
      const delProducto = ahora
        .filter((r) => r.producto === l.producto && r.talla === l.talla)
        .sort((a, b) => a.creada.localeCompare(b.creada) || a.recordId.localeCompare(b.recordId));
      const fila = stock.get(clave(l.producto, l.talla));
      let libre = (fila?.iniciales ?? 0) - (fila?.vendidas ?? 0);
      for (const r of delProducto) {
        if (r.pedido === orderRef) {
          if (libre < r.cantidad) {
            await borrar(cfg, T_RESERVAS, creadas).catch(() => undefined);
            console.warn(`stock: carrera perdida en ${l.producto} ${l.talla}, pedido ${orderRef}`);
            return { ok: false, error: "SIN_STOCK" };
          }
          break;
        }
        libre -= r.cantidad;
      }
    }
    return { ok: true, expiresAt };
  } catch (err) {
    console.error(`stock: no se pudo reservar (pedido ${orderRef})`, mensajeSeguro(err));
    if (creadas.length) await borrar(cfg, T_RESERVAS, creadas).catch(() => undefined);
    return { ok: false, error: "SERVICIO_NO_DISPONIBLE" };
  }
}

/** Libera la reserva de un pedido (p. ej. si Stripe no llegó a crear la sesión). */
export async function liberarReserva(orderRef: string): Promise<void> {
  const cfg = leerConfig();
  if (!cfg) return;
  try {
    const previas = await listar(cfg, T_RESERVAS, filtroPedido(orderRef));
    if (previas.length)
      await borrar(
        cfg,
        T_RESERVAS,
        previas.map((p) => p.id),
      );
  } catch (err) {
    console.error(`stock: no se pudo liberar la reserva (pedido ${orderRef})`, mensajeSeguro(err));
  }
}

// ─── Pago confirmado: registrar la venta ─────────────────────────────────────

export type ResultadoVenta = { registradas: number; negativas: string[] };

/**
 * Anota cada línea como venta, enlazada a su fila de Stock, y libera la reserva.
 * Idempotente por pedido+producto+talla: Stripe puede repetir el aviso. Lanza si
 * no puede (el llamador decide qué hacer; el pedido ya está en n8n).
 */
export async function registrarVenta(
  orderRef: string,
  lineas: LineaStock[],
): Promise<ResultadoVenta> {
  const cfg = leerConfig();
  if (!cfg) {
    if (modoEstatico()) return { registradas: 0, negativas: [] };
    throw new Error("Faltan AIRTABLE_STOCK_TOKEN / AIRTABLE_STOCK_BASE_ID");
  }
  const [stock, previas] = await Promise.all([
    leerStock(cfg),
    listar(cfg, T_VENTAS, filtroPedido(orderRef)),
  ]);
  const yaAnotadas = new Set(
    previas.map((v) => clave(String(v.fields["Producto"] ?? ""), String(v.fields["Talla"] ?? ""))),
  );

  const nuevas: Record<string, unknown>[] = [];
  const negativas: string[] = [];
  for (const l of lineas) {
    if (yaAnotadas.has(clave(l.producto, l.talla))) continue;
    const fila = stock.get(clave(l.producto, l.talla));
    nuevas.push({
      Pedido: orderRef,
      Producto: l.producto,
      Talla: l.talla,
      Cantidad: l.cantidad,
      ...(fila ? { Stock: [fila.recordId] } : {}),
    });
    if (!fila) {
      negativas.push(`${l.producto} ${l.talla} (sin fila en Stock)`);
    } else if (fila.iniciales - fila.vendidas - l.cantidad < 0) {
      negativas.push(`${l.producto} ${l.talla}`);
    }
  }
  if (nuevas.length) await crear(cfg, T_VENTAS, nuevas);
  await liberarReserva(orderRef);
  cache = null; // lo que se muestra debe reflejar la venta enseguida
  if (negativas.length) {
    console.error(
      `stock: STOCK NEGATIVO tras el pedido ${orderRef}: ${negativas.join(", ")}. Reembolsar a mano.`,
    );
  }
  return { registradas: nuevas.length, negativas };
}

function mensajeSeguro(err: unknown): string {
  // Solo el mensaje: las URLs y cabeceras (con el token) nunca se incluyen.
  return err instanceof Error ? err.message.slice(0, 200) : "error desconocido";
}

/** Solo para pruebas. */
export function vaciarCacheDeStock(): void {
  cache = null;
}
