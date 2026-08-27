import { z } from "zod";

export const cartItemSchema = z.object({
  id: z.string().min(1),
  size: z.string().min(1).max(40),
  qty: z.number().int().min(1).max(99),
});

/**
 * Datos que aporta nuestro checkout. La dirección de envío, el email y el
 * teléfono los recoge Stripe Checkout, no este formulario.
 */
export const checkoutSchema = z.object({
  orderNotes: z.string().trim().max(500, "Máximo 500 caracteres").optional(),
  acceptTerms: z.boolean().refine((v) => v === true, {
    message: "Debes aceptar los términos y la política de privacidad",
  }),
  marketingOptIn: z.boolean().optional(),
  items: z.array(cartItemSchema).min(1, "El carrito está vacío"),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;

/** Esquema del formulario (sin `items`, que se añaden en el submit desde el carrito). */
export const checkoutFormSchema = checkoutSchema.omit({ items: true });

export type CheckoutFormInput = z.infer<typeof checkoutFormSchema>;
