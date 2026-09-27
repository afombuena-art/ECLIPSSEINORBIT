/**
 * Caracteres con los que Excel y LibreOffice empiezan a interpretar una celda
 * como fórmula. Airtable no evalúa nada, pero sus exportaciones a CSV se abren
 * en una hoja de cálculo, y ahí sí se ejecutan.
 */
const INICIO_DE_FORMULA = /^[=+\-@\t\r]/;

/**
 * Texto libre de origen externo (comprador, o cualquier dato que Stripe
 * recoja en su propio formulario) listo para guardarse en una columna que
 * pueda acabar exportada a CSV. Si empieza por un carácter de fórmula se le
 * antepone un apóstrofo, que es como se marca «esto es texto» en una hoja de
 * cálculo. Un valor que no empieza por esos caracteres (por ejemplo, un
 * código postal español válido) se devuelve exactamente igual.
 */
export function textoSeguro(valor: string | null | undefined): string | null {
  if (valor == null) return null;
  return INICIO_DE_FORMULA.test(valor) ? `'${valor}` : valor;
}
