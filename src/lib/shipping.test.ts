import { describe, expect, it } from "vitest";
import {
  calcShippingCents,
  MAX_SHIPPABLE_GRAMS,
  quoteShipping,
  SHIPPING_TABLE,
  totalWeightGrams,
  zoneFromPostalCode,
  type ShippingZone,
} from "./shipping";

/**
 * El cálculo del envío es lo único de la tienda que decide dinero y no se
 * comprueba con los ojos: el comprador ve un importe ya calculado. Estas
 * pruebas fijan la tabla que dio el cliente el 2026-09-20 y las decisiones que
 * se tomaron sobre ella.
 *
 * Si alguna falla después de tocar `shipping.ts`, la pregunta correcta es si el
 * cambio estaba previsto, no si la prueba sobra.
 */

const ZONAS: ShippingZone[] = ["sevilla", "limitrofes", "peninsula", "baleares"];

describe("zona a partir del código postal", () => {
  it("41xxx es Sevilla", () => {
    expect(zoneFromPostalCode("41001")).toEqual({ ok: true, zone: "sevilla" });
  });

  it("07xxx es Baleares", () => {
    expect(zoneFromPostalCode("07001")).toEqual({ ok: true, zone: "baleares" });
  });

  it.each([
    ["11001", "Cádiz"],
    ["21001", "Huelva"],
    ["14001", "Córdoba"],
    ["29001", "Málaga"],
  ])("%s (%s) es provincia limítrofe", (cp) => {
    expect(zoneFromPostalCode(cp)).toEqual({ ok: true, zone: "limitrofes" });
  });

  it("06xxx (Badajoz) es limítrofe, por la decisión de Ana del 2026-09-21", () => {
    // El cliente nombró solo cuatro provincias y dijo «aproximadamente». Se optó
    // por la definición geográfica habitual. Si algún día se quita Badajoz de la
    // lista, esta prueba lo avisará: no es un olvido, es una decisión.
    expect(zoneFromPostalCode("06001")).toEqual({ ok: true, zone: "limitrofes" });
  });

  it("el resto de España es península", () => {
    expect(zoneFromPostalCode("28001")).toEqual({ ok: true, zone: "peninsula" });
    expect(zoneFromPostalCode("08001")).toEqual({ ok: true, zone: "peninsula" });
  });

  it.each([
    ["35001", "Las Palmas"],
    ["38001", "Santa Cruz de Tenerife"],
    ["51001", "Ceuta"],
    ["52001", "Melilla"],
  ])("%s (%s) queda fuera de cobertura", (cp) => {
    expect(zoneFromPostalCode(cp)).toEqual({ ok: false, reason: "fuera-de-cobertura" });
  });

  it.each([
    ["1234", "cuatro cifras"],
    ["410011", "seis cifras"],
    ["00000", "provincia 00, no existe"],
    ["53001", "provincia 53, no existe"],
    ["99999", "provincia 99, no existe"],
    ["abcde", "letras"],
    ["", "vacío"],
  ])("%s (%s) es un código inválido", (cp) => {
    expect(zoneFromPostalCode(cp)).toEqual({ ok: false, reason: "codigo-invalido" });
  });

  it("ignora los espacios de sobra", () => {
    expect(zoneFromPostalCode("  41001  ")).toEqual({ ok: true, zone: "sevilla" });
  });
});

describe("tabla de tarifas", () => {
  it("va de menos a más peso", () => {
    const pesos = SHIPPING_TABLE.map((t) => t.maxGrams);
    expect([...pesos].sort((a, b) => a - b)).toEqual(pesos);
  });

  it("cada tramo tiene precio para las cuatro zonas", () => {
    for (const tramo of SHIPPING_TABLE) {
      for (const zona of ZONAS) {
        const cents = tramo.cents[zona];
        expect(Number.isInteger(cents), `${zona} en el tramo ${tramo.maxGrams}`).toBe(true);
        expect(cents).toBeGreaterThan(0);
      }
    }
  });

  it("Baleares nunca sale más barato que península", () => {
    for (const tramo of SHIPPING_TABLE) {
      expect(tramo.cents.baleares, `tramo ${tramo.maxGrams}`).toBeGreaterThanOrEqual(
        tramo.cents.peninsula,
      );
    }
  });

  it("el peso máximo es el del último tramo", () => {
    expect(MAX_SHIPPABLE_GRAMS).toBe(SHIPPING_TABLE[SHIPPING_TABLE.length - 1].maxGrams);
  });
});

describe("peso del pedido", () => {
  it("suma el peso de cada línea por su cantidad", () => {
    // 220 g la camiseta, 120 g la gorra.
    expect(totalWeightGrams([{ id: "camiseta-azul", qty: 2 }])).toBe(440);
    expect(
      totalWeightGrams([
        { id: "camiseta-azul", qty: 1 },
        { id: "gorra-verde", qty: 1 },
      ]),
    ).toBe(340);
  });

  it("un producto que ya no existe no suma peso", () => {
    expect(totalWeightGrams([{ id: "no-existe", qty: 99 }])).toBe(0);
  });
});

describe("precio del envío", () => {
  it("una camiseta a península entra en el primer tramo", () => {
    const quote = quoteShipping([{ id: "camiseta-azul", qty: 1 }], 2397, "peninsula");
    expect(quote).toEqual({ ok: true, cents: 499, free: false });
  });

  it("la misma camiseta sale más barata a Sevilla y más cara a Baleares", () => {
    const items = [{ id: "camiseta-azul", qty: 1 }];
    const sevilla = quoteShipping(items, 2397, "sevilla");
    const baleares = quoteShipping(items, 2397, "baleares");
    expect(sevilla).toEqual({ ok: true, cents: 450, free: false });
    expect(baleares).toEqual({ ok: true, cents: 650, free: false });
  });

  it("el carrito vacío no paga envío", () => {
    expect(quoteShipping([], 0, "peninsula")).toEqual({ ok: true, cents: 0, free: false });
  });

  it("no hay envío gratis: la decisión del cliente del 2026-09-20", () => {
    // Un pedido grande sigue pagando portes. Si algún día se reactiva el umbral,
    // esta prueba avisará de que es un cambio de condiciones, no un descuido.
    const quote = quoteShipping([{ id: "camiseta-azul", qty: 10 }], 23_970, "peninsula");
    expect(quote.ok && quote.free).toBe(false);
  });

  it("justo en el límite de peso todavía se envía", () => {
    // 68 camisetas × 220 g = 14.960 g, por debajo de los 15.000 g de la tabla.
    const quote = quoteShipping([{ id: "camiseta-azul", qty: 68 }], 100_000, "peninsula");
    expect(quote).toEqual({ ok: true, cents: 950, free: false });
  });

  it("pasado el límite no se inventa un precio", () => {
    // 69 × 220 g = 15.180 g.
    const quote = quoteShipping([{ id: "camiseta-azul", qty: 69 }], 100_000, "peninsula");
    expect(quote).toEqual({ ok: false, reason: "demasiado-peso" });
  });
});

describe("calcShippingCents", () => {
  it("devuelve null, y no cero, cuando el pedido no se puede enviar", () => {
    // Regresión de CALIDAD M-10: devolver 0 hacía que el carrito enseñara
    // «Envío: Gratis» y un total que no era el que se iba a cobrar.
    expect(calcShippingCents([{ id: "camiseta-azul", qty: 69 }], 100_000)).toBeNull();
  });

  it("sin zona, estima península", () => {
    expect(calcShippingCents([{ id: "camiseta-azul", qty: 1 }], 2397)).toBe(499);
  });
});
