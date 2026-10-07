import { createContext, useContext, useMemo, type ReactNode } from "react";
import { stockOf as stockEstatico } from "@/data/stock";
import type { StockPublico } from "@/lib/stock-airtable.server";

type Valor = {
  /** Unidades que se pueden comprar ahora de una prenda en una talla. */
  stockOf: (productId: string, size: string) => number;
  /** `true` si no queda ninguna unidad de ninguna talla. */
  isSoldOut: (productId: string, sizes: string[]) => boolean;
};

const hacer = (datos: StockPublico["stock"] | null): Valor => {
  const stockOf = (productId: string, size: string) =>
    datos
      ? Math.max(0, Math.floor(datos[`${productId}|${size}`] ?? 0))
      : stockEstatico(productId, size);
  return { stockOf, isSoldOut: (id, sizes) => sizes.every((s) => stockOf(id, s) === 0) };
};

const StockContext = createContext<Valor>(hacer(null));

export function StockProvider({
  datos,
  children,
}: {
  datos: StockPublico["stock"] | null;
  children: ReactNode;
}) {
  const valor = useMemo(() => hacer(datos), [datos]);
  return <StockContext.Provider value={valor}>{children}</StockContext.Provider>;
}

export const useStock = () => useContext(StockContext);
