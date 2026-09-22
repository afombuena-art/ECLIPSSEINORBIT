import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { Marquee } from "@/components/Marquee";
import { SiteFooter } from "@/components/SiteFooter";
import { useCart } from "@/lib/cart";

export const Route = createFileRoute("/pedido/confirmado")({
  head: () => ({
    meta: [
      { title: "Gracias por tu compra — ECLIPSSE™ UNIVERSE" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: PedidoConfirmadoPage,
});

function PedidoConfirmadoPage() {
  const { clear, hydrated } = useCart();

  // Llegar aquí solo significa que Stripe redirigió tras el pago. La confirmación
  // real del pedido la da el webhook. Vaciamos el carrito local por comodidad.
  //
  // ⚠️ Por eso el texto NO afirma que el pago esté recibido: esta página no lo
  // comprueba. Cualquiera puede abrir la URL directamente, y un comprador puede
  // llegar antes de que el webhook haya terminado. Pendiente (SEGURIDAD M9): que
  // el servidor lea el `session_id`, compruebe que es una sesión nuestra y
  // muestre confirmado / pendiente / no confirmado.
  //
  // ⚠️ El texto promete un email con el justificante de pago. Eso lo manda
  // **Stripe**, no este código, y solo si sigue activa la casilla «Pagos que se
  // han efectuado correctamente» en Configuración → Emails a clientes, en modo
  // live (activada por Ana el 2026-09-22). Si algún día se desactiva, hay que
  // quitar esa frase de aquí: la web estaría prometiendo algo que no ocurre.
  // El justificante NO incluye seguimiento del envío: nadie manda ese email hoy.
  useEffect(() => {
    if (hydrated) clear();
  }, [hydrated, clear]);

  return (
    <div className="min-h-screen bg-white text-black flex flex-col">
      <Marquee text="POR Y PARA JÓVENES" />
      <SiteHeader current="brand" />

      <section className="flex-1 mx-auto max-w-xl px-5 md:px-8 py-24 md:py-32 text-center">
        <p className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground mb-6">Gracias</p>
        <h1 className="font-display text-4xl md:text-6xl leading-tight">Gracias por tu compra</h1>
        <p className="mt-6 text-sm md:text-base text-muted-foreground leading-relaxed">
          Stripe ha terminado el proceso de pago y estamos confirmando tu pedido. Recibirás por
          email el justificante del pago. Si tienes cualquier duda, escríbenos a{" "}
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
