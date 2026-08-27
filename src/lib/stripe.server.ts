import Stripe from "stripe";

// Versión de la API fijada a la que trae este SDK (stripe@22). No cambiar como
// efecto colateral: hacerlo altera el shape de webhooks y respuestas. Ver CLAUDE.md §2.
const API_VERSION = "2026-08-26.dahlia";

let cached: Stripe | null = null;

/** Cliente de Stripe (server-only). Lanza si falta la clave secreta. */
export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY no está configurada");
  }
  if (!cached) {
    cached = new Stripe(key, { apiVersion: API_VERSION, typescript: true });
  }
  return cached;
}
