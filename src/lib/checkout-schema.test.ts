import { describe, expect, it } from "vitest";
import { checkoutSchema } from "./checkout-schema";

const validCheckout = {
  checkoutAttemptId: "6f26d48c-34a8-4ea7-b7ea-a2e285e01087",
  shippingPostalCode: "41001",
  orderNotes: "",
  acceptTerms: true,
  marketingOptIn: false,
  items: [{ id: "camiseta-azul", size: "M", qty: 1 }],
};

describe("identificador estable del intento de compra", () => {
  it("acepta un UUID", () => {
    expect(checkoutSchema.safeParse(validCheckout).success).toBe(true);
  });

  it("rechaza un identificador arbitrario", () => {
    expect(
      checkoutSchema.safeParse({ ...validCheckout, checkoutAttemptId: "pedido-manipulado" })
        .success,
    ).toBe(false);
  });
});
