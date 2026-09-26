/**
 * Reduce un error externo (Stripe, fetch, el binding de rate limiting de
 * Cloudflare...) a los campos técnicos que `CLAUDE.md` §6 permite loguear:
 * IDs y códigos de error — nunca bodies completos de requests/responses de
 * Stripe ni objetos Stripe completos que puedan contener datos del cliente.
 *
 * Un `Stripe.errors.StripeError` lleva, entre otras cosas, `raw` (la
 * respuesta HTTP completa de Stripe) y `headers`: por eso nunca se debe
 * hacer `console.error(error)` directamente sobre un error de Stripe. Esta
 * función se usa en su lugar en todas las rutas de pago, el webhook, el
 * marcado de eventos entregados y el rate limiting.
 *
 * No se comprueba con `instanceof Stripe.errors.StripeError` a propósito:
 * así funciona igual para errores de Stripe, de `fetch()` y del binding de
 * Cloudflare, sin que cada fichero tenga que importar el SDK de Stripe solo
 * para esto.
 */
export function errorSeguro(error: unknown): Record<string, unknown> {
  if (esErrorConFormaDeStripe(error)) {
    const salida: Record<string, unknown> = {};
    if (typeof error.type === "string") salida.tipo = error.type;
    if (typeof error.code === "string") salida.codigo = error.code;
    if (typeof error.statusCode === "number") salida.estadoHttp = error.statusCode;
    if (typeof error.requestId === "string") salida.requestId = error.requestId;
    return salida;
  }
  if (error instanceof Error) {
    return { nombre: error.name, mensaje: error.message };
  }
  return { valor: typeof error === "string" ? error : String(error) };
}

function esErrorConFormaDeStripe(
  error: unknown,
): error is { type?: unknown; code?: unknown; statusCode?: unknown; requestId?: unknown } {
  return (
    typeof error === "object" &&
    error !== null &&
    ("requestId" in error || "statusCode" in error) &&
    "type" in error
  );
}
