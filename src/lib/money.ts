const EUR = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
});

/** Formatea un importe en céntimos como "23,97 €". */
export function formatEuros(cents: number): string {
  return EUR.format(cents / 100);
}
