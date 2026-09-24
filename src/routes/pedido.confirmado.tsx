import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { Marquee } from "@/components/Marquee";
import { SiteFooter } from "@/components/SiteFooter";
import { useCart } from "@/lib/cart";
import { EMAIL } from "@/data/contacto";
import type { OrderStatus } from "@/lib/order-status.server";

export const Route = createFileRoute("/pedido/confirmado")({
  head: () => ({
    meta: [
      { title: "Gracias por tu compra — ECLIPSSE™ UNIVERSE" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: PedidoConfirmadoPage,
});

type EstadoVisible = "cargando" | OrderStatus;

// ⚠️ El texto de "confirmado" promete un email con el justificante de pago.
// Eso lo manda **Stripe**, no este código, y solo si sigue activa la casilla
// «Pagos que se han efectuado correctamente» en Configuración → Emails a
// clientes, en modo live (activada por Ana el 2026-09-22). Si algún día se
// desactiva, hay que quitar esa frase de aquí: la web estaría prometiendo
// algo que no ocurre. El justificante NO incluye seguimiento del envío:
// nadie manda ese email hoy.
const TEXTOS: Record<EstadoVisible, { titulo: string; cuerpo: string; contacto: boolean }> = {
  cargando: {
    titulo: "Comprobando tu pedido",
    cuerpo: "Un momento, estamos comprobando el estado de tu pago con Stripe.",
    contacto: false,
  },
  confirmado: {
    titulo: "Gracias por tu compra",
    cuerpo:
      "Stripe ha confirmado tu pago y estamos preparando tu pedido. Recibirás por email el " +
      "justificante del pago. Si tienes cualquier duda, escríbenos a",
    contacto: true,
  },
  pendiente: {
    titulo: "Estamos confirmando tu pago",
    cuerpo:
      "Stripe todavía está terminando de procesar el pago — algunos métodos tardan unos " +
      "segundos más. No hace falta que vuelvas a pagar. Si en unos minutos sigue igual, " +
      "escríbenos a",
    contacto: true,
  },
  no_confirmado: {
    titulo: "No hemos podido confirmar este pedido",
    cuerpo:
      "No encontramos un pago confirmado para este pedido. Si has completado un pago, no te " +
      "preocupes: escríbenos a",
    contacto: true,
  },
};

function PedidoConfirmadoPage() {
  const { clear, hydrated } = useCart();
  const [estado, setEstado] = useState<EstadoVisible>("cargando");

  // Llegar aquí solo significa que Stripe redirigió tras el pago; en sí mismo
  // no confirma nada (CLAUDE.md §3). El estado real se comprueba en el
  // servidor contra Stripe (SEGURIDAD M9) — ver src/lib/order-status.server.ts
  // y la ruta /api/pedido-estado. Esta consulta es solo informativa: el
  // webhook sigue siendo la única fuente de verdad del pago.
  useEffect(() => {
    const sessionId = new URLSearchParams(window.location.search).get("session_id");
    if (!sessionId) {
      setEstado("no_confirmado");
      return;
    }
    let cancelado = false;
    fetch(`/api/pedido-estado?session_id=${encodeURIComponent(sessionId)}`)
      .then((res) => res.json() as Promise<{ estado?: OrderStatus }>)
      .then((data) => {
        if (!cancelado) setEstado(data.estado ?? "no_confirmado");
      })
      .catch(() => {
        if (!cancelado) setEstado("no_confirmado");
      });
    return () => {
      cancelado = true;
    };
  }, []);

  // El carrito local se vacía al llegar aquí, sin depender del estado del
  // pago: es limpieza de la sesión del navegador, no una confirmación de
  // pedido (comportamiento ya existente, sin cambios).
  useEffect(() => {
    if (hydrated) clear();
  }, [hydrated, clear]);

  const texto = TEXTOS[estado];

  return (
    <div className="min-h-screen bg-white text-black flex flex-col">
      <Marquee text="POR Y PARA JÓVENES" />
      <SiteHeader current="brand" />

      <section className="flex-1 mx-auto max-w-xl px-5 md:px-8 py-24 md:py-32 text-center">
        <p className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground mb-6">
          {estado === "confirmado" ? "Gracias" : "Tu pedido"}
        </p>
        <h1 className="font-display text-4xl md:text-6xl leading-tight">{texto.titulo}</h1>
        <p className="mt-6 text-sm md:text-base text-muted-foreground leading-relaxed">
          {texto.cuerpo}
          {texto.contacto && (
            <>
              {" "}
              <a href={`mailto:${EMAIL}`} className="underline underline-offset-4">
                {EMAIL}
              </a>
              .
            </>
          )}
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
