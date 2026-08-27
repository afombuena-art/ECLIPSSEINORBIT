import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { Marquee } from "@/components/Marquee";
import { SiteFooter } from "@/components/SiteFooter";
import { useCart } from "@/lib/cart";

export const Route = createFileRoute("/pedido/confirmado")({
  head: () => ({
    meta: [
      { title: "Pedido confirmado — ECLIPSSE™ UNIVERSE" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: PedidoConfirmadoPage,
});

function PedidoConfirmadoPage() {
  const { clear, hydrated } = useCart();

  // Llegar aquí solo significa que Stripe redirigió tras el pago. La confirmación
  // real del pedido la da el webhook. Vaciamos el carrito local por comodidad.
  useEffect(() => {
    if (hydrated) clear();
  }, [hydrated, clear]);

  return (
    <div className="min-h-screen bg-white text-black flex flex-col">
      <Marquee text="POR Y PARA JÓVENES" />
      <SiteHeader current="brand" />

      <section className="flex-1 mx-auto max-w-xl px-5 md:px-8 py-24 md:py-32 text-center">
        <p className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground mb-6">Gracias</p>
        <h1 className="font-display text-4xl md:text-6xl leading-tight">Pedido confirmado</h1>
        <p className="mt-6 text-sm md:text-base text-muted-foreground leading-relaxed">
          Hemos recibido tu pago. Te enviaremos un email con los detalles y el seguimiento del
          envío. Si tienes cualquier duda, escríbenos a{" "}
          <a href="mailto:eclipssebrand@gmail.com" className="underline underline-offset-4">eclipssebrand@gmail.com</a>.
        </p>

        <div className="mt-10">
          <Link
            to="/eclipssebrand"
            className="inline-block rounded-full border border-black bg-black text-white px-10 py-4 font-display text-[11px] uppercase tracking-[0.25em] hover:bg-white hover:text-black transition-colors"
          >
            Volver a la tienda
          </Link>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
