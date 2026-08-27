import { getProductById } from "@/data/products";

/** Envío gratis a partir de este subtotal (75 €). */
export const FREE_SHIPPING_THRESHOLD_CENTS = 7500;

/**
 * Tramos de peso → coste de envío, en céntimos. Envío único de Correos (vía Packlink PRO).
 * Se elige el primer tramo cuyo `maxGrams` cubre el peso total del pedido; si el peso
 * supera todos los tramos, se aplica el último.
 *
 * TODO Ana: sustituir por las tarifas reales de Correos / Packlink PRO.
 */
export const SHIPPING_BRACKETS: { maxGrams: number; cents: number }[] = [
  { maxGrams: 500, cents: 395 },
  { maxGrams: 1000, cents: 495 },
  { maxGrams: 2000, cents: 650 },
  { maxGrams: 5000, cents: 890 },
  { maxGrams: Infinity, cents: 1290 },
];

export type ShippingItem = { id: string; qty: number };

export function totalWeightGrams(items: ShippingItem[]): number {
  return items.reduce((sum, item) => {
    const product = getProductById(item.id);
    return sum + (product ? product.weightGrams * item.qty : 0);
  }, 0);
}

/**
 * Coste de envío en céntimos. `0` si el subtotal alcanza el umbral de envío gratis
 * o si el pedido está vacío.
 */
export function calcShippingCents(items: ShippingItem[], subtotalCents: number): number {
  if (items.length === 0) return 0;
  if (subtotalCents >= FREE_SHIPPING_THRESHOLD_CENTS) return 0;

  const weight = totalWeightGrams(items);
  const bracket = SHIPPING_BRACKETS.find((b) => weight <= b.maxGrams);
  return bracket ? bracket.cents : SHIPPING_BRACKETS[SHIPPING_BRACKETS.length - 1].cents;
}
