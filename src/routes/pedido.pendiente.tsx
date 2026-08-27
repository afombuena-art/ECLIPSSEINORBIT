import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { Marquee } from "@/components/Marquee";
import { SiteFooter } from "@/components/SiteFooter";

const WHATSAPP_URL = "https://wa.me/message/P5FFTHYMWKNRA1";

export const Route = createFileRoute("/pedido/pendiente")({
  head: () => ({
    meta: [
      { title: "Pedido en proceso — ECLIPSSE™ UNIVERSE" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: CheckoutPendientePage,
});

function CheckoutPendientePage() {
  return (
    <div className="min-h-screen bg-white text-black flex flex-col">
      <Marquee text="POR Y PARA JÓVENES" />
      <SiteHeader current="brand" />

      <section className="flex-1 mx-auto max-w-xl px-5 md:px-8 py-24 md:py-32 text-center">
        <p className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground mb-6">
          Casi listo
        </p>
        <h1 className="font-display text-4xl md:text-6xl leading-tight">
          Estamos activando el pago online
        </h1>
        <p className="mt-6 text-sm md:text-base text-muted-foreground leading-relaxed">
          Ya tenemos tus datos y el resumen de tu pedido. Muy pronto podrás completar la
          compra y pagar con tarjeta aquí mismo. Tu carrito se ha guardado.
        </p>
        <p className="mt-4 text-sm md:text-base text-muted-foreground leading-relaxed">
          Si quieres reservar tu pedido ahora, escríbenos por WhatsApp y lo dejamos apartado.
        </p>

        <div className="mt-10 flex flex-col gap-3">
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-black bg-black text-white px-10 py-4 font-display text-[11px] uppercase tracking-[0.25em] hover:bg-white hover:text-black transition-colors"
          >
            Reservar por WhatsApp
          </a>
          <Link
            to="/eclipssebrand"
            className="rounded-full border border-black px-10 py-4 font-display text-[11px] uppercase tracking-[0.25em] hover:bg-black hover:text-white transition-colors"
          >
            Volver a la tienda
          </Link>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
