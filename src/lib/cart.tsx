import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { getProductById, type Product } from "@/data/products";
import { calcShippingCents } from "@/lib/shipping";
import { stockOf } from "@/data/stock";

const STORAGE_KEY = "eclipsse_cart_v1";
const MAX_QTY = 99;

export type CartLine = { id: string; size: string; qty: number };

export type CartLineDetailed = CartLine & {
  product: Product;
  lineTotalCents: number;
};

type CartContextValue = {
  /** `false` hasta que se ha leído el carrito de localStorage en el cliente. */
  hydrated: boolean;
  lines: CartLine[];
  detailedLines: CartLineDetailed[];
  count: number;
  subtotalCents: number;
  /** `null` si el pedido no se puede enviar (pesa más de lo que cubre la tabla). */
  shippingCents: number | null;
  /** `null` cuando no hay envío posible: no existe un total que enseñar. */
  totalCents: number | null;
  isOpen: boolean;
  open: () => void;
  close: () => void;
  setOpen: (v: boolean) => void;
  add: (id: string, size: string, qty?: number) => void;
  setQty: (id: string, size: string, qty: number) => void;
  remove: (id: string, size: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

/** Cantidad válida de una línea: entre 1 y lo que haya en stock (nunca más de MAX_QTY). */
const clampQty = (n: number, id: string, size: string) =>
  Math.max(1, Math.min(MAX_QTY, stockOf(id, size), Math.floor(n)));

function readStorage(): CartLine[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return (
      parsed
        .filter(
          (l): l is CartLine =>
            !!l &&
            typeof l === "object" &&
            typeof (l as CartLine).id === "string" &&
            typeof (l as CartLine).size === "string" &&
            typeof (l as CartLine).qty === "number",
        )
        // Descarta lo que el servidor rechazaría igualmente: productos que ya no
        // existen y tallas retiradas del catálogo. El carrito vive en el navegador
        // y puede llevar meses guardado; sin esto, una talla que desapareció deja
        // la línea a la vista y cada intento de pago muere en el servidor.
        .filter((l) => getProductById(l.id)?.sizes.includes(l.size))
        // Una prenda que se ha agotado desde que se guardó el carrito no puede seguir en él.
        .filter((l) => stockOf(l.id, l.size) > 0)
        .map((l) => ({ id: l.id, size: l.size, qty: clampQty(l.qty, l.id, l.size) }))
    );
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [isOpen, setOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setLines(readStorage());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      // localStorage no disponible
    }
  }, [lines, hydrated]);

  const value = useMemo<CartContextValue>(() => {
    const detailedLines = lines
      .map((l): CartLineDetailed | null => {
        const product = getProductById(l.id);
        if (!product) return null;
        return { ...l, product, lineTotalCents: product.priceCents * l.qty };
      })
      .filter((l): l is CartLineDetailed => l !== null);

    const subtotalCents = detailedLines.reduce((s, l) => s + l.lineTotalCents, 0);
    const shippingCents = calcShippingCents(
      detailedLines.map((l) => ({ id: l.id, qty: l.qty })),
      subtotalCents,
    );
    const count = detailedLines.reduce((s, l) => s + l.qty, 0);

    return {
      hydrated,
      lines,
      detailedLines,
      count,
      subtotalCents,
      shippingCents,
      totalCents: shippingCents === null ? null : subtotalCents + shippingCents,
      isOpen,
      open: () => setOpen(true),
      close: () => setOpen(false),
      setOpen,
      add: (id, size, qty = 1) => {
        // Misma regla que al leer de localStorage: producto y talla tienen que
        // existir hoy en el catálogo.
        if (!getProductById(id)?.sizes.includes(size)) return;
        if (stockOf(id, size) <= 0) return;
        setLines((prev) => {
          const i = prev.findIndex((l) => l.id === id && l.size === size);
          if (i === -1) return [...prev, { id, size, qty: clampQty(qty, id, size) }];
          const next = [...prev];
          next[i] = { ...next[i], qty: clampQty(next[i].qty + qty, id, size) };
          return next;
        });
      },
      setQty: (id, size, qty) => {
        setLines((prev) => {
          if (qty <= 0) return prev.filter((l) => !(l.id === id && l.size === size));
          return prev.map((l) =>
            l.id === id && l.size === size ? { ...l, qty: clampQty(qty, id, size) } : l,
          );
        });
      },
      remove: (id, size) =>
        setLines((prev) => prev.filter((l) => !(l.id === id && l.size === size))),
      // Si ya está vacío devuelve el MISMO array: un array nuevo cada vez regeneraba
      // `clear` y reiniciaba en bucle el efecto de /pedido/confirmado.
      clear: () => setLines((prev) => (prev.length === 0 ? prev : [])),
    };
  }, [lines, isOpen, hydrated]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart debe usarse dentro de <CartProvider>");
  return ctx;
}
