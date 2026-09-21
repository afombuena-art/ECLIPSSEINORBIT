import { getProductById } from "@/data/products";

/**
 * Tarifas de envío de Correos vía Packlink PRO, enviando desde 41001 (Sevilla).
 * Tabla facilitada por el cliente el 2026-09-20.
 *
 * El precio depende de DOS cosas: el peso del pedido y la zona de destino.
 * La zona se deduce de los dos primeros dígitos del código postal, que se pide
 * en nuestro propio checkout (Stripe recoge la dirección después, cuando el
 * importe ya está fijado, así que no sirve para calcular).
 */

export type ShippingZone = "sevilla" | "limitrofes" | "peninsula" | "baleares";

/** Resultado de mirar un código postal. */
export type ZoneLookup =
  | { ok: true; zone: ShippingZone }
  /** Canarias, Ceuta y Melilla: fuera de la tabla, el cliente debe contactar. */
  | { ok: false; reason: "fuera-de-cobertura" }
  /** No son cinco dígitos o el prefijo no existe en España. */
  | { ok: false; reason: "codigo-invalido" };

/**
 * Provincias que lindan con Sevilla: Cádiz (11), Huelva (21), Córdoba (14),
 * Málaga (29) y Badajoz (06).
 *
 * El cliente nombró solo las cuatro primeras y dijo «aproximadamente», así que
 * el 2026-09-21 Ana decidió usar la definición geográfica habitual e incluir
 * Badajoz. ⚠️ Si Packlink acabara cobrando Badajoz como península, la tienda
 * perdería la diferencia (9 céntimos en el tramo de hasta 1 kg). Si se ve en
 * las facturas reales, basta con quitar el "06" de esta lista.
 */
const PREFIJOS_LIMITROFES = new Set(["11", "21", "14", "29", "06"]);

/** Canarias (35, 38), Ceuta (51) y Melilla (52). No se envía: fuera del IVA peninsular. */
const PREFIJOS_SIN_COBERTURA = new Set(["35", "38", "51", "52"]);

const PREFIJO_SEVILLA = "41";
const PREFIJO_BALEARES = "07";

/** Zona de destino a partir del código postal español. */
export function zoneFromPostalCode(postalCode: string): ZoneLookup {
  const cp = postalCode.trim();
  if (!/^\d{5}$/.test(cp)) return { ok: false, reason: "codigo-invalido" };

  const prefijo = cp.slice(0, 2);
  const provincia = Number(prefijo);
  // Las provincias españolas van del 01 al 52.
  if (provincia < 1 || provincia > 52) return { ok: false, reason: "codigo-invalido" };

  if (PREFIJOS_SIN_COBERTURA.has(prefijo)) return { ok: false, reason: "fuera-de-cobertura" };
  if (prefijo === PREFIJO_SEVILLA) return { ok: true, zone: "sevilla" };
  if (prefijo === PREFIJO_BALEARES) return { ok: true, zone: "baleares" };
  if (PREFIJOS_LIMITROFES.has(prefijo)) return { ok: true, zone: "limitrofes" };
  return { ok: true, zone: "peninsula" };
}

/** Nombre de la zona para mostrar al cliente. */
export const ZONE_LABELS: Record<ShippingZone, string> = {
  sevilla: "Sevilla",
  limitrofes: "Provincia limítrofe",
  peninsula: "Península",
  baleares: "Baleares",
};

/**
 * Tramos de peso → precio por zona, en céntimos. Se elige el primer tramo cuyo
 * `maxGrams` cubre el peso total del pedido.
 *
 * La tabla del cliente llega hasta 15 kg. Por encima no hay tarifa, así que el
 * pedido se trata como fuera de cobertura (son unas 68 camisetas: en la
 * práctica no ocurre, pero el código no puede inventarse un precio).
 */
export const SHIPPING_TABLE: {
  maxGrams: number;
  cents: Record<ShippingZone, number>;
}[] = [
  { maxGrams: 1000, cents: { sevilla: 450, limitrofes: 490, peninsula: 499, baleares: 650 } },
  { maxGrams: 2000, cents: { sevilla: 490, limitrofes: 499, peninsula: 550, baleares: 699 } },
  { maxGrams: 3000, cents: { sevilla: 490, limitrofes: 499, peninsula: 550, baleares: 750 } },
  { maxGrams: 4000, cents: { sevilla: 550, limitrofes: 550, peninsula: 599, baleares: 799 } },
  { maxGrams: 5000, cents: { sevilla: 550, limitrofes: 599, peninsula: 650, baleares: 799 } },
  { maxGrams: 10000, cents: { sevilla: 650, limitrofes: 699, peninsula: 750, baleares: 999 } },
  { maxGrams: 15000, cents: { sevilla: 850, limitrofes: 899, peninsula: 950, baleares: 1299 } },
];

/** Peso máximo con tarifa en la tabla. */
export const MAX_SHIPPABLE_GRAMS = SHIPPING_TABLE[SHIPPING_TABLE.length - 1].maxGrams;

/**
 * Envío gratis a partir de este subtotal, en céntimos.
 *
 * **Desactivado por decisión del cliente el 2026-09-20: no hay envío gratis.**
 * El umbral anterior (7500 = 75 €) no lo había decidido nadie y le costaba el
 * envío de su bolsillo en cada pedido que lo alcanzara.
 *
 * Para reactivarlo, poner el subtotal en céntimos en lugar de `null`. El aviso
 * de «te faltan X para el envío gratis» del carrito reaparece solo.
 */
export const FREE_SHIPPING_THRESHOLD_CENTS: number | null = null;

export type ShippingItem = { id: string; qty: number };

export function totalWeightGrams(items: ShippingItem[]): number {
  return items.reduce((sum, item) => {
    const product = getProductById(item.id);
    return sum + (product ? product.weightGrams * item.qty : 0);
  }, 0);
}

export type ShippingQuote =
  | { ok: true; cents: number; free: boolean }
  | { ok: false; reason: "demasiado-peso" };

/**
 * Precio del envío para una zona concreta. Devuelve `ok: false` si el pedido
 * pesa más de lo que cubre la tabla, para no inventar un importe.
 */
export function quoteShipping(
  items: ShippingItem[],
  subtotalCents: number,
  zone: ShippingZone,
): ShippingQuote {
  if (items.length === 0) return { ok: true, cents: 0, free: false };

  const weight = totalWeightGrams(items);
  if (weight > MAX_SHIPPABLE_GRAMS) return { ok: false, reason: "demasiado-peso" };

  if (FREE_SHIPPING_THRESHOLD_CENTS !== null && subtotalCents >= FREE_SHIPPING_THRESHOLD_CENTS) {
    return { ok: true, cents: 0, free: true };
  }

  const bracket = SHIPPING_TABLE.find((b) => weight <= b.maxGrams) ?? SHIPPING_TABLE[0];
  return { ok: true, cents: bracket.cents[zone], free: false };
}

/**
 * Precio del envío en céntimos. Para mostrar una estimación antes de saber el
 * destino se usa `peninsula`, que es la zona más probable.
 */
export function calcShippingCents(
  items: ShippingItem[],
  subtotalCents: number,
  zone: ShippingZone = "peninsula",
): number {
  const quote = quoteShipping(items, subtotalCents, zone);
  return quote.ok ? quote.cents : 0;
}
