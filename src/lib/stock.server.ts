import { createServerFn } from "@tanstack/react-start";
import { leerStockPublico, type StockPublico } from "@/lib/stock-airtable.server";

/**
 * Stock para PINTAR la web (tienda, ficha, carrito). Se lee en el servidor, con
 * caché de 60 s, y nunca bloquea la página: si Airtable falla devuelve el último
 * dato bueno o el estático (`fiable: false`). El cobro NO usa esto: reserva
 * siempre en directo en `createCheckoutSession`.
 */
export const getStockPublico = createServerFn({ method: "GET" }).handler(
  async (): Promise<StockPublico> => leerStockPublico(),
);
