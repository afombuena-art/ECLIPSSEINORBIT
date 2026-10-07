import { describe, expect, it } from "vitest";
import { products } from "./products";
import { isSoldOut, stockOf } from "./stock";

describe("existencias", () => {
  it("todo producto del catálogo tiene entrada de stock en todas sus tallas (aunque sea 0)", () => {
    for (const p of products) {
      for (const s of p.sizes) {
        expect(Number.isInteger(stockOf(p.id, s)), `${p.id} / ${s}`).toBe(true);
      }
    }
  });

  it("lo desconocido cuenta como agotado, nunca como disponible", () => {
    expect(stockOf("no-existe", "M")).toBe(0);
    expect(stockOf("camiseta-azul", "XXL")).toBe(0);
  });

  it("refleja el stock real dado por Jacobo el 2026-10-07", () => {
    expect(stockOf("camiseta-azul", "S")).toBe(1);
    expect(stockOf("camiseta-azul", "M")).toBe(1);
    expect(stockOf("camiseta-azul", "L")).toBe(0);
    expect(stockOf("camiseta-orbit", "M")).toBe(1);
    expect(stockOf("gorra-verde", "Talla única")).toBe(12);
    expect(isSoldOut("camiseta-sun", ["S", "M", "L", "XL"])).toBe(true);
    expect(isSoldOut("camiseta-gris", ["S", "M", "L", "XL"])).toBe(true);
    expect(isSoldOut("camiseta-azul", ["S", "M", "L", "XL"])).toBe(false);
  });
});
