import { describe, expect, it } from "vitest";
import { textoSeguro } from "./csv-safe-text";

/**
 * Auditoría de seguridad 2026-09-27: el código postal de entrega que Stripe
 * recoge en su propio formulario llegaba sin sanear a Airtable (a diferencia
 * del resto de campos libres, que ya pasaban por `textoSeguro`). Estas
 * pruebas fijan que un CP válido no cambia y que un valor que empieza por un
 * carácter de fórmula queda marcado como texto.
 */
describe("textoSeguro", () => {
  it("conserva exactamente un código postal español válido", () => {
    expect(textoSeguro("41001")).toBe("41001");
  });

  it.each(["=1+1", "+34600000000", "-1", "@SUM(A1:A9)"])(
    "antepone un apóstrofo si empieza por %s",
    (valor) => {
      expect(textoSeguro(valor)).toBe(`'${valor}`);
    },
  );

  it("devuelve null si no hay valor", () => {
    expect(textoSeguro(null)).toBeNull();
    expect(textoSeguro(undefined)).toBeNull();
  });
});
