import { describe, expect, it } from "vitest";
import { products, getProduct, getProductById } from "./products";

/**
 * Comprobaciones de cordura del catálogo.
 *
 * Por qué existen: los productos viven en código, y la idea es que Jacobo vaya
 * añadiendo y quitando prendas. Ninguno de estos fallos rompe el build ni da
 * error de tipos — el código sería perfectamente válido — pero cada uno cuesta
 * dinero o ventas:
 *
 *   - `priceCents: 24` en vez de `2397`: la tienda cobra 24 céntimos.
 *   - `weightGrams` a cero o mal puesto: se pierde dinero en portes.
 *   - un `id` repetido: el checkout vende la prenda equivocada, sin fallar.
 *
 * Si una de estas pruebas falla, lo primero que hay que mirar es si el número
 * está en la unidad correcta, no si la prueba está mal.
 */

/** Nadie va a vender una camiseta por menos de 5 € ni por más de 200 €. */
const PRECIO_MINIMO_CENTIMOS = 500;
const PRECIO_MAXIMO_CENTIMOS = 20_000;

/** Una prenda con su packaging pesa más de 50 g y menos de 2 kg. */
const PESO_MINIMO_GRAMOS = 50;
const PESO_MAXIMO_GRAMOS = 2_000;

describe("catálogo de productos", () => {
  it("tiene al menos un producto", () => {
    expect(products.length).toBeGreaterThan(0);
  });

  it("no repite ningún id", () => {
    const ids = products.map((p) => p.id);
    // Un id repetido no rompe nada visiblemente: `getProductById` devuelve el
    // primero que encuentra, así que se vendería la prenda equivocada en
    // silencio.
    expect(new Set(ids).size, `ids duplicados en ${ids.join(", ")}`).toBe(ids.length);
  });

  it("no repite ningún slug", () => {
    const slugs = products.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it.each(products.map((p) => [p.id, p] as const))("%s: el id coincide con el slug", (_id, p) => {
    // El propio tipo `Product` lo documenta. Si dejaran de coincidir, el enlace
    // de la ficha y el id que viaja al checkout apuntarían a cosas distintas.
    expect(p.id).toBe(p.slug);
  });

  it.each(products.map((p) => [p.id, p] as const))(
    "%s: el precio está en céntimos y es razonable",
    (_id, p) => {
      expect(Number.isInteger(p.priceCents), `${p.priceCents} no es un entero`).toBe(true);
      expect(
        p.priceCents,
        `${p.priceCents} parece estar en euros y no en céntimos`,
      ).toBeGreaterThanOrEqual(PRECIO_MINIMO_CENTIMOS);
      expect(p.priceCents).toBeLessThanOrEqual(PRECIO_MAXIMO_CENTIMOS);
    },
  );

  it.each(products.map((p) => [p.id, p] as const))(
    "%s: el peso está en gramos y es razonable",
    (_id, p) => {
      expect(Number.isInteger(p.weightGrams)).toBe(true);
      expect(p.weightGrams, "el peso decide el envío que se cobra").toBeGreaterThanOrEqual(
        PESO_MINIMO_GRAMOS,
      );
      expect(p.weightGrams).toBeLessThanOrEqual(PESO_MAXIMO_GRAMOS);
    },
  );

  it.each(products.map((p) => [p.id, p] as const))("%s: tiene tallas sin repetir", (_id, p) => {
    expect(p.sizes.length).toBeGreaterThan(0);
    expect(new Set(p.sizes).size).toBe(p.sizes.length);
  });

  it.each(products.map((p) => [p.id, p] as const))("%s: tiene nombre e imágenes", (_id, p) => {
    expect(p.name.trim()).not.toBe("");
    expect(p.description.trim()).not.toBe("");
    expect(p.images.length).toBeGreaterThan(0);
    // Rutas del sitio: si alguna dejara de empezar por "/", la imagen no
    // cargaría y Stripe tampoco podría mostrarla en la pantalla de pago.
    for (const src of [p.front, p.back, ...p.images]) {
      expect(src.startsWith("/"), `${src} no es una ruta del sitio`).toBe(true);
    }
  });
});

describe("búsqueda de productos", () => {
  it("encuentra por slug y por id", () => {
    const primero = products[0];
    expect(getProduct(primero.slug)).toBe(primero);
    expect(getProductById(primero.id)).toBe(primero);
  });

  it("devuelve undefined si no existe, en vez de lanzar", () => {
    expect(getProduct("no-existe")).toBeUndefined();
    expect(getProductById("no-existe")).toBeUndefined();
  });
});
