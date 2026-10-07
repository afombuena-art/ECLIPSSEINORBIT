/**
 * Existencias por prenda y talla.
 *
 * FUENTE TEMPORAL (2026-10-07): estos números los dio Jacobo a mano y NO se
 * descuentan solos al vender. Mientras viva aquí, hay que actualizarlos a mano
 * tras cada venta. El plan acordado con Ana es pasarlo a Airtable (se lee en el
 * servidor y se descuenta con cada pago confirmado); cuando eso exista, solo
 * cambia este archivo: el resto de la web ya consulta `stockOf`.
 *
 * Cero = agotada. Si un producto o una talla no aparece aquí, cuenta como
 * agotada: es más seguro equivocarse hacia «no vender» que hacia «vender lo
 * que no hay».
 */
const STOCK: Record<string, Record<string, number>> = {
  "camiseta-azul": { S: 1, M: 1, L: 0, XL: 0 },
  "camiseta-orbit": { S: 0, M: 1, L: 0, XL: 0 },
  "camiseta-sun": { S: 0, M: 0, L: 0, XL: 0 },
  "camiseta-gris": { S: 0, M: 0, L: 0, XL: 0 },
  "gorra-verde": { "Talla única": 12 },
};

/** Unidades disponibles de una prenda en una talla (0 si no hay o no existe). */
export function stockOf(productId: string, size: string): number {
  return Math.max(0, Math.floor(STOCK[productId]?.[size] ?? 0));
}

/** `true` si no queda ninguna unidad de ninguna talla. */
export function isSoldOut(productId: string, sizes: string[]): boolean {
  return sizes.every((s) => stockOf(productId, s) === 0);
}
