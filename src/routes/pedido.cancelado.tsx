import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { Marquee } from "@/components/Marquee";
import { SiteFooter } from "@/components/SiteFooter";

export const Route = createFileRoute("/pedido/cancelado")({
  head: () => ({
    meta: [
      { title: "Pago cancelado — ECLIPSSE™ UNIVERSE" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: PedidoCanceladoPage,
});

function PedidoCanceladoPage() {
  return (
    <div className="min-h-screen bg-white text-black flex flex-col">
      <Marquee text="POR Y PARA JÓVENES" />
      <SiteHeader current="brand" />

      <section className="flex-1 mx-auto max-w-xl px-5 md:px-8 py-24 md:py-32 text-center">
        <p className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground mb-6">Sin cargo</p>
        <h1 className="font-display text-4xl md:text-6xl leading-tight">Pago cancelado</h1>
        <p className="mt-6 text-sm md:text-base text-muted-foreground leading-relaxed">
          No se ha realizado ningún cobro. Tu carrito sigue guardado, puedes retomar la compra
          cuando quieras.
        </p>

        <div className="mt-10 flex flex-col gap-3">
          <Link
            to="/checkout"
            className="rounded-full border border-black bg-black text-white px-10 py-4 font-display text-[11px] uppercase tracking-[0.25em] hover:bg-white hover:text-black transition-colors"
          >
            Volver al checkout
          </Link>
          <Link
            to="/eclipssebrand"
            className="rounded-full border border-black px-10 py-4 font-display text-[11px] uppercase tracking-[0.25em] hover:bg-black hover:text-white transition-colors"
          >
            Seguir comprando
          </Link>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
