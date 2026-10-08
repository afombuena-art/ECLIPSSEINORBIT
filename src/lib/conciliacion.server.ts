/**
 * Revisión automática de ventas: compara los pagos cobrados en Stripe con las
 * ventas anotadas en Airtable y anota las que falten.
 *
 * Por qué existe: el webhook anota la venta DESPUÉS de entregar el pedido a n8n y
 * no hace fallar el aviso si Airtable no responde (un reintento de Stripe
 * duplicaría el pedido). Sin esta revisión, esa venta quedaría sin descontar, la
 * reserva caducaría y la misma unidad volvería a venderse; y como Airtable nunca
 * llegó a saberlo, tampoco saltaría el aviso de stock negativo.
 *
 * Qué NO hace: no recrea ventas que se borraron a propósito (una prueba, una
 * devolución). El webhook deja en el PaymentIntent la marca `stockRegistrado`
 * cuando la venta quedó anotada, y aquí solo se actúa sobre pagos SIN esa marca.
 * Tampoco toca pagos reembolsados: si hay reembolso, el stock ya se gestionó a mano.
 *
 * Se ejecuta con un horario de Cloudflare (`triggers.crons` en wrangler.jsonc) y
 * es idempotente: puede correr cualquier número de veces sin duplicar nada.
 */
import type Stripe from "stripe";
import { ORIGEN_PEDIDO } from "@/lib/checkout-schema";
import { errorSeguro } from "@/lib/log-safety.server";
import {
  anotarIncidencia,
  hayConfiguracionDeStock,
  registrarVentaConReintentos,
  type LineaStock,
} from "@/lib/stock-airtable.server";

/** Marca que el webhook deja en el PaymentIntent al anotar la venta. */
export const STOCK_REGISTRADO_KEY = "stockRegistrado";

/**
 * No se miran pagos anteriores a esta fecha: son las pruebas hechas antes de que
 * existiera la marca, y recrear sus ventas descuadraría el stock ya restaurado.
 */
export const DESDE = Date.parse("2026-10-09T00:00:00Z");
/** Hasta cuándo hacia atrás se busca. Cubre una caída larga de Airtable. */
const VENTANA_MS = 72 * 3_600_000;
/**
 * Un pago reciente puede estar aún en manos del webhook. La sesión de pago dura
 * como mucho ~36 min, así que a los 40 el cobro ya es antiguo y su webhook ya ha
 * tenido tiempo y reintentos.
 */
const EDAD_MINIMA_MS = 40 * 60_000;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type ResumenRevision = {
  saltada: boolean;
  revisadas: number;
  pendientes: number;
  recuperadas: number;
  reembolsadas: number;
  yaAnotadas: number;
  errores: number;
};

const vacio = (saltada: boolean): ResumenRevision => ({
  saltada,
  revisadas: 0,
  pendientes: 0,
  recuperadas: 0,
  reembolsadas: 0,
  yaAnotadas: 0,
  errores: 0,
});

/** Deja la marca «venta anotada» en el pago. Nunca lanza. */
export async function marcarStockRegistrado(
  stripe: Stripe,
  paymentIntentId: string | null,
): Promise<void> {
  if (!paymentIntentId) return;
  try {
    await stripe.paymentIntents.update(paymentIntentId, {
      metadata: { [STOCK_REGISTRADO_KEY]: "1" },
    });
  } catch (err) {
    // Sin la marca la revisión volverá a mirar este pago; como anotar es
    // idempotente, lo peor que pasa es un trabajo de más.
    console.error("conciliación: no se pudo marcar la venta como anotada", errorSeguro(err));
  }
}

/** Líneas del pedido a partir de los metadatos del producto que puso el checkout. */
export function lineasDeSesion(session: Stripe.Checkout.Session): LineaStock[] {
  return (session.line_items?.data ?? []).flatMap((li) => {
    const product = li.price?.product;
    const meta =
      product && typeof product === "object" && !("deleted" in product) ? product.metadata : null;
    return meta?.productId && meta.size && li.quantity
      ? [{ producto: meta.productId, talla: meta.size, cantidad: li.quantity }]
      : [];
  });
}

function reembolsado(pi: Stripe.PaymentIntent): boolean {
  const charge = pi.latest_charge;
  return !!charge && typeof charge === "object" && (charge.refunded || charge.amount_refunded > 0);
}

export async function conciliarVentas(
  stripe: Stripe,
  ahora = Date.now(),
  esperas?: number[],
): Promise<ResumenRevision> {
  if (!hayConfiguracionDeStock()) {
    console.info("conciliación: sin configuración de Airtable, no se revisa nada");
    return vacio(true);
  }
  const resumen = vacio(false);
  const detalleErrores: string[] = [];

  try {
    const desde = Math.floor(Math.max(DESDE, ahora - VENTANA_MS) / 1000);
    const sesiones = await stripe.checkout.sessions
      .list({
        created: { gte: desde },
        limit: 100,
        expand: ["data.payment_intent.latest_charge"],
      })
      .autoPagingToArray({ limit: 500 });

    for (const s of sesiones) {
      const orderRef = s.client_reference_id ?? s.metadata?.orderRef ?? "";
      if (s.metadata?.source !== ORIGEN_PEDIDO) continue;
      if (s.payment_status !== "paid" || !UUID.test(orderRef)) continue;
      if (s.created * 1000 > ahora - EDAD_MINIMA_MS) continue;
      resumen.revisadas += 1;

      const pi = typeof s.payment_intent === "object" ? s.payment_intent : null;
      if (!pi) continue;
      if (pi.metadata?.[STOCK_REGISTRADO_KEY] === "1") continue;
      if (reembolsado(pi)) {
        resumen.reembolsadas += 1;
        continue;
      }
      resumen.pendientes += 1;

      try {
        const completa = await stripe.checkout.sessions.retrieve(s.id, {
          expand: ["line_items", "line_items.data.price.product"],
        });
        const lineas = lineasDeSesion(completa);
        if (!lineas.length) continue;

        const r = await registrarVentaConReintentos(orderRef, lineas, esperas);
        await marcarStockRegistrado(stripe, pi.id);

        if (r.registradas === 0) {
          // La venta ya estaba en Airtable: solo faltaba la marca. Sin aviso.
          resumen.yaAnotadas += 1;
          continue;
        }
        resumen.recuperadas += 1;
        await anotarIncidencia({
          tipo: "Venta recuperada",
          pedido: orderRef,
          unicaPorPedido: true,
          resumen: `Venta recuperada: pedido ${orderRef.slice(0, 8)}`,
          detalle:
            `La revisión automática encontró un pago cobrado cuya venta no estaba anotada en el stock, y la ha anotado.\n\n` +
            `Prendas: ${lineas.map((l) => `${l.cantidad} × ${l.producto} ${l.talla}`).join(", ")}.` +
            (r.negativas.length
              ? `\n\n⚠️ El stock queda en NEGATIVO en: ${r.negativas.join(", ")}. Hay que reembolsar un pedido (y borrar su fila de Ventas).`
              : ""),
        });
      } catch (err) {
        resumen.errores += 1;
        detalleErrores.push(`pedido ${orderRef.slice(0, 8)}: ${errorSeguro(err)}`);
      }
    }
  } catch (err) {
    resumen.errores += 1;
    detalleErrores.push(`no se pudo consultar Stripe: ${errorSeguro(err)}`);
  }

  if (resumen.errores) {
    await anotarIncidencia({
      tipo: "Revisión con errores",
      resumen: `La revisión automática de ventas tuvo ${resumen.errores} error(es)`,
      detalle:
        `${detalleErrores.join("\n")}\n\nSe volverá a intentar en la próxima revisión. ` +
        `Si el aviso se repite, mira los registros del servidor en Cloudflare.`,
      unicaEnHoras: 24,
    });
  }
  console.info(`conciliación: ${JSON.stringify(resumen)}`);
  return resumen;
}
