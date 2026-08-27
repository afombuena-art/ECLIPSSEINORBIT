import { z } from "zod";

/** Provincias de España (para el selector de dirección de envío). */
export const PROVINCES = [
  "Álava", "Albacete", "Alicante", "Almería", "Asturias", "Ávila", "Badajoz",
  "Barcelona", "Burgos", "Cáceres", "Cádiz", "Cantabria", "Castellón", "Ciudad Real",
  "Córdoba", "La Coruña", "Cuenca", "Gerona", "Granada", "Guadalajara", "Guipúzcoa",
  "Huelva", "Huesca", "Islas Baleares", "Jaén", "León", "Lérida", "Lugo", "Madrid",
  "Málaga", "Murcia", "Navarra", "Orense", "Palencia", "Las Palmas", "Pontevedra",
  "La Rioja", "Salamanca", "Santa Cruz de Tenerife", "Segovia", "Sevilla", "Soria",
  "Tarragona", "Teruel", "Toledo", "Valencia", "Valladolid", "Vizcaya", "Zamora",
  "Zaragoza", "Ceuta", "Melilla",
] as const;

const PROVINCE_SET = new Set<string>(PROVINCES);

const requiredText = (label: string, max = 120) =>
  z.string().trim().min(1, `${label} es obligatorio`).max(max, `${label} es demasiado largo`);

const optionalText = (max: number) =>
  z.string().trim().max(max, "Texto demasiado largo").optional();

export const cartItemSchema = z.object({
  id: z.string().min(1),
  size: z.string().min(1).max(40),
  qty: z.number().int().min(1).max(99),
});

export const checkoutSchema = z.object({
  // Contacto
  email: z.string().trim().min(1, "El email es obligatorio").email("Email no válido").max(180),
  phone: requiredText("El teléfono", 30).regex(/^[+()\d\s-]{6,}$/, "Teléfono no válido"),

  // Envío
  firstName: requiredText("El nombre"),
  lastName: requiredText("Los apellidos"),
  address1: requiredText("La dirección", 180),
  address2: optionalText(120),
  postalCode: z.string().trim().regex(/^\d{5}$/, "El código postal debe tener 5 dígitos"),
  city: requiredText("La población"),
  province: z.string().refine((v) => PROVINCE_SET.has(v), { message: "Selecciona una provincia" }),
  country: z.literal("ES"),

  // Facturación
  billingSameAsShipping: z.boolean(),
  invoiceNif: optionalText(20),

  // Extras
  orderNotes: optionalText(500),

  // Legal
  acceptTerms: z.boolean().refine((v) => v === true, {
    message: "Debes aceptar los términos y la política de privacidad",
  }),
  marketingOptIn: z.boolean().optional(),

  // Carrito
  items: z.array(cartItemSchema).min(1, "El carrito está vacío"),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
