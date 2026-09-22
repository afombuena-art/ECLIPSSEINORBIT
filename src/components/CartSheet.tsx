import { Link } from "@tanstack/react-router";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useCart } from "@/lib/cart";
import { formatEuros } from "@/lib/money";
import { FREE_SHIPPING_THRESHOLD_CENTS } from "@/lib/shipping";

export function CartSheet() {
  const cart = useCart();
  const { detailedLines, subtotalCents, shippingCents, totalCents, isOpen, setOpen } = cart;

  // `null` si el envío gratis está desactivado: entonces no se menciona.
  const remainingForFree =
    FREE_SHIPPING_THRESHOLD_CENTS === null ? null : FREE_SHIPPING_THRESHOLD_CENTS - subtotalCents;

  return (
    <Sheet open={isOpen} onOpenChange={setOpen}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md flex flex-col bg-white text-black p-0"
      >
        <SheetHeader className="px-5 md:px-6 pt-6 pb-4 border-b border-border text-left">
          <SheetTitle className="font-display text-2xl tracking-tight">
            Tu carrito
          </SheetTitle>
        </SheetHeader>

        {detailedLines.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
            <p className="text-sm uppercase tracking-[0.25em] text-muted-foreground">
              Tu carrito está vacío
            </p>
            <Link
              to="/eclipssebrand"
              onClick={() => setOpen(false)}
              className="rounded-full border border-black bg-black text-white px-8 py-3.5 font-display text-[11px] uppercase tracking-[0.25em] hover:bg-white hover:text-black transition-colors"
            >
              Ver la tienda
            </Link>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-5 md:px-6 py-4 divide-y divide-border">
              {detailedLines.map((line) => (
                <div key={`${line.id}-${line.size}`} className="flex gap-4 py-4 first:pt-0">
                  <div className="h-24 w-20 shrink-0 overflow-hidden bg-muted">
                    <img
                      src={line.product.front}
                      alt={line.product.name}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover"
                    />
                  </div>

                  <div className="flex flex-1 flex-col">
                    <div className="flex justify-between gap-3">
                      <span className="font-display text-sm leading-tight">
                        {line.product.name}
                      </span>
                      <span className="text-sm tabular-nums">
                        {formatEuros(line.lineTotalCents)}
                      </span>
                    </div>
                    <span className="mt-1 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                      Talla {line.size}
                    </span>

                    <div className="mt-auto flex items-center justify-between pt-3">
                      <div className="flex items-center border border-black">
                        <button
                          type="button"
                          onClick={() => cart.setQty(line.id, line.size, line.qty - 1)}
                          aria-label="Quitar una unidad"
                          className="h-8 w-8 cursor-pointer text-base leading-none hover:bg-black hover:text-white transition-colors"
                        >
                          −
                        </button>
                        <span className="w-8 text-center text-sm tabular-nums">{line.qty}</span>
                        <button
                          type="button"
                          onClick={() => cart.setQty(line.id, line.size, line.qty + 1)}
                          aria-label="Añadir una unidad"
                          className="h-8 w-8 cursor-pointer text-base leading-none hover:bg-black hover:text-white transition-colors"
                        >
                          +
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => cart.remove(line.id, line.size)}
                        className="cursor-pointer text-[10px] uppercase tracking-[0.2em] text-muted-foreground underline underline-offset-4 hover:text-black transition-colors"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-border px-5 md:px-6 py-5 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="tabular-nums">{formatEuros(subtotalCents)}</span>
              </div>
              {/* Estimación de península: la zona real no se sabe hasta que el
                  cliente escribe su código postal en el checkout. */}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Envío (estimado)</span>
                <span className="tabular-nums">
                  {shippingCents === null
                    ? "No disponible"
                    : shippingCents === 0
                      ? "Gratis"
                      : formatEuros(shippingCents)}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                {shippingCents === null
                  ? "Este pedido supera el peso máximo de nuestro envío habitual. Escríbenos por WhatsApp y lo gestionamos de otra manera."
                  : "El envío definitivo se calcula con tu código postal en el siguiente paso."}
              </p>

              {remainingForFree !== null &&
                (remainingForFree > 0 ? (
                  <p className="text-[11px] text-muted-foreground">
                    Te faltan <strong className="text-black">{formatEuros(remainingForFree)}</strong>{" "}
                    para el envío gratis.
                  </p>
                ) : (
                  <p className="text-[11px] text-muted-foreground">Envío gratis conseguido.</p>
                ))}

              <div className="flex justify-between border-t border-border pt-3 font-display text-base">
                <span>Total</span>
                <span className="tabular-nums">
                  {totalCents === null ? "—" : formatEuros(totalCents)}
                </span>
              </div>
              <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                IVA incluido
              </p>

              <Link
                to="/checkout"
                onClick={() => setOpen(false)}
                className="mt-2 block w-full rounded-full border border-black bg-black text-white px-8 py-4 text-center font-display text-[11px] uppercase tracking-[0.25em] hover:bg-white hover:text-black transition-colors"
              >
                Tramitar pedido
              </Link>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
