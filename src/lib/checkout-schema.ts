import { z } from "zod";

/**
 * Marca que identifica una sesión de pago creada por esta tienda. Se guarda en
 * la metadata de la Checkout Session (`checkout.server.ts`) y el webhook
 * (`api.stripe-webhook.ts`) la exige antes de reenviar el pedido a n8n.
 *
 * Vive aquí, y no en `checkout.server.ts`, para que el webhook pueda leerla sin
 * importar de paso la server function del checkout.
 */
export const ORIGEN_PEDIDO = "eclipsseinorbit-web-v1";

export const cartItemSchema = z.object({
  id: z.string().min(1),
  size: z.string().min(1).max(40),
  qty: z.number().int().min(1).max(99),
});

/**
 * Datos que aporta nuestro checkout. La dirección completa, el email y el
 * teléfono los recoge Stripe Checkout, no este formulario.
 *
 * El código postal es la excepción: hace falta AQUÍ para saber la zona y
 * calcular el envío, porque Stripe recoge la dirección cuando el importe ya
 * está fijado.
 */
export const checkoutSchema = z.object({
  shippingPostalCode: z
    .string()
    .trim()
    .regex(/^\d{5}$/, "Escribe un código postal español de 5 cifras"),
  orderNotes: z.string().trim().max(500, "Máximo 500 caracteres").optional(),
  acceptTerms: z.boolean().refine((v) => v === true, {
    message: "Debes aceptar los términos y la política de privacidad",
  }),
  marketingOptIn: z.boolean().optional(),
  // El tope de líneas no es arbitrario: Stripe rechaza una sesión con más de 100
  // line items. El catálogo entero da 17 combinaciones de producto y talla, así
  // que 20 no estorba a nadie que compre de verdad.
  items: z
    .array(cartItemSchema)
    .min(1, "El carrito está vacío")
    .max(20, "El pedido tiene demasiadas líneas distintas"),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;

/**
 * Motivos por los que el servidor rechaza un pedido, con un código estable que
 * el navegador puede traducir a un mensaje útil.
 *
 * Existen porque un `throw` no sirve: el middleware de `start.ts` convierte
 * cualquier excepción de una server function en una página de error genérica y
 * **sin mensaje**, a propósito, para no filtrar detalles internos. Sin estos
 * códigos, el cliente solo podía leer «inténtalo de nuevo» ante errores que
 * nunca se van a arreglar solos.
 *
 * Los tres primeros son permanentes: reintentar no cambia nada.
 */
export type CheckoutError =
  | "PRODUCTO_NO_DISPONIBLE"
  | "TALLA_NO_DISPONIBLE"
  | "FUERA_DE_COBERTURA"
  | "CODIGO_POSTAL_INVALIDO"
  | "DEMASIADO_PESO";

/** Respuesta de `createCheckoutSession`: o la URL de pago, o el motivo del rechazo. */
export type CheckoutResult = { ok: true; url: string } | { ok: false; error: CheckoutError };

/** Esquema del formulario (sin `items`, que se añaden en el submit desde el carrito). */
export const checkoutFormSchema = checkoutSchema.omit({ items: true });

export type CheckoutFormInput = z.infer<typeof checkoutFormSchema>;
