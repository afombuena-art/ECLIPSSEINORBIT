import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { SiteHeader } from "@/components/SiteHeader";
import { Marquee } from "@/components/Marquee";
import { SiteFooter } from "@/components/SiteFooter";
import { useCart } from "@/lib/cart";
import { formatEuros } from "@/lib/money";
import { checkoutFormSchema, type CheckoutFormInput } from "@/lib/checkout-schema";
import { createCheckoutSession } from "@/lib/checkout.server";
import { quoteShipping, zoneFromPostalCode, ZONE_LABELS } from "@/lib/shipping";

const WHATSAPP_URL = "https://wa.me/message/P5FFTHYMWKNRA1";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Finalizar compra — ECLIPSSE™ UNIVERSE" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: CheckoutPage,
});

const inputClass =
  "w-full border border-black/20 bg-white px-3.5 py-3 text-sm outline-none transition-colors focus:border-black";

function CheckoutPage() {
  const navigate = useNavigate();
  const { detailedLines, subtotalCents, shippingCents, hydrated } = useCart();
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (hydrated && detailedLines.length === 0) {
      navigate({ to: "/eclipssebrand" });
    }
  }, [hydrated, detailedLines.length, navigate]);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CheckoutFormInput>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: {
      shippingPostalCode: "",
      orderNotes: "",
      acceptTerms: false,
      marketingOptIn: false,
    },
  });

  // El envío depende de la zona, así que se recalcula según escribe el código
  // postal. El servidor lo vuelve a calcular: esto es solo para que lo vea.
  const postalCode = watch("shippingPostalCode") ?? "";
  const lookup = /^\d{5}$/.test(postalCode.trim()) ? zoneFromPostalCode(postalCode) : null;
  const zone = lookup?.ok ? lookup.zone : null;
  const sinCobertura = lookup !== null && !lookup.ok && lookup.reason === "fuera-de-cobertura";

  const items = detailedLines.map((l) => ({ id: l.id, qty: l.qty }));
  const quote = zone ? quoteShipping(items, subtotalCents, zone) : null;

  // Mientras no haya código postal se muestra la estimación de península, que es
  // `null` si el pedido ya pesa más de lo que se puede enviar. Sin esa segunda
  // parte, un pedido demasiado pesado se veía como «Gratis» hasta que el cliente
  // escribía las cinco cifras.
  const envioCents = quote?.ok ? quote.cents : shippingCents;
  const demasiadoPeso = quote !== null ? !quote.ok : shippingCents === null;
  const envioEsGratis = quote?.ok ? quote.free : envioCents === 0;
  const totalConEnvio = envioCents === null ? null : subtotalCents + envioCents;
  const noSePuedeEnviar = sinCobertura || demasiadoPeso;

  const onSubmit = handleSubmit(
    async (values) => {
      setSubmitError(null);
      const items = detailedLines.map((l) => ({ id: l.id, size: l.size, qty: l.qty }));
      if (items.length === 0) {
        navigate({ to: "/eclipssebrand" });
        return;
      }
      try {
        const { url } = await createCheckoutSession({ data: { ...values, items } });
        window.location.href = url;
      } catch {
        setSubmitError(
          "No se ha podido iniciar el pago. Inténtalo de nuevo en unos segundos.",
        );
      }
    },
    () => {
      setSubmitError("Revisa los campos marcados en rojo y vuelve a intentarlo.");
    },
  );

  if (hydrated && detailedLines.length === 0) return null;

  return (
    <div className="min-h-screen bg-white text-black">
      <Marquee text="POR Y PARA JÓVENES" />
      <SiteHeader current="brand" />

      <section className="mx-auto max-w-4xl px-5 md:px-8 py-10 md:py-16">
        <Link to="/eclipssebrand" className="text-[11px] uppercase tracking-[0.25em] hover:underline">
          ← Seguir comprando
        </Link>
        <h1 className="mt-6 font-display text-4xl md:text-6xl leading-tight">Finalizar compra</h1>

        <div className="mt-10 grid lg:grid-cols-[1fr_340px] gap-10 lg:gap-16 items-start">
          <form onSubmit={onSubmit} noValidate className="space-y-8">
            <div>
              <label
                className="block text-[11px] uppercase tracking-[0.2em] text-muted-foreground mb-2"
                htmlFor="shippingPostalCode"
              >
                Código postal de envío
              </label>
              <input
                id="shippingPostalCode"
                inputMode="numeric"
                autoComplete="postal-code"
                maxLength={5}
                placeholder="41001"
                className={`${inputClass} max-w-[10rem] tabular-nums`}
                {...register("shippingPostalCode")}
              />
              <p className="mt-1.5 text-[11px] text-muted-foreground">
                Lo necesitamos para calcular el envío. La dirección completa te la pedirá Stripe.
              </p>
              {errors.shippingPostalCode?.message && (
                <p className="field-error mt-1.5 text-[11px] text-red-600">
                  {errors.shippingPostalCode.message}
                </p>
              )}

              {zone && !noSePuedeEnviar && envioCents !== null && (
                <p className="mt-2 text-sm">
                  Envío a <strong>{ZONE_LABELS[zone]}</strong>:{" "}
                  <span className="tabular-nums">
                    {envioEsGratis ? "gratis" : formatEuros(envioCents)}
                  </span>
                </p>
              )}

              {noSePuedeEnviar && (
                <div
                  role="alert"
                  className="mt-3 border border-black/20 bg-muted px-4 py-3 text-sm"
                >
                  <p className="font-display text-base">
                    {sinCobertura ? "No enviamos a esa zona" : "Pedido demasiado grande"}
                  </p>
                  <p className="mt-1.5 text-muted-foreground">
                    {sinCobertura
                      ? "Nuestros envíos habituales solo llegan a la península y Baleares. Para comprar desde Canarias, Ceuta o Melilla, escríbenos por WhatsApp y gestionamos tu pedido de otra manera."
                      : "Este pedido supera el peso máximo de nuestro envío habitual. Escríbenos por WhatsApp y lo gestionamos de otra manera."}
                  </p>
                  <a
                    href={WHATSAPP_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-block rounded-full border border-black px-6 py-2.5 font-display text-[11px] uppercase tracking-[0.25em] hover:bg-black hover:text-white transition-colors"
                  >
                    Escríbenos por WhatsApp
                  </a>
                </div>
              )}
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-[0.2em] text-muted-foreground mb-2" htmlFor="orderNotes">
                Notas del pedido (opcional)
              </label>
              <textarea id="orderNotes" rows={3} className={inputClass} {...register("orderNotes")} />
              {errors.orderNotes?.message && (
                <p className="field-error mt-1.5 text-[11px] text-red-600">{errors.orderNotes.message}</p>
              )}
            </div>

            <div className="space-y-4 border-t border-border pt-6">
              <label className="flex items-start gap-3 text-sm">
                <input type="checkbox" className="mt-1" {...register("acceptTerms")} />
                <span>
                  He leído y acepto los{" "}
                  <Link to="/legal/terminos" className="underline underline-offset-4">términos y condiciones</Link>{" "}
                  y la{" "}
                  <Link to="/legal/privacidad" className="underline underline-offset-4">política de privacidad</Link>.
                </span>
              </label>
              {errors.acceptTerms?.message && (
                <p className="field-error text-[11px] text-red-600">{errors.acceptTerms.message}</p>
              )}
              <label className="flex items-start gap-3 text-sm">
                <input type="checkbox" className="mt-1" {...register("marketingOptIn")} />
                <span>Quiero recibir novedades y próximos drops por email (opcional).</span>
              </label>
            </div>

            {submitError && (
              <p className="text-sm text-red-600" role="alert">{submitError}</p>
            )}

            <button
              type="submit"
              disabled={isSubmitting || noSePuedeEnviar}
              className="w-full rounded-full border border-black bg-black text-white px-10 py-4 font-display text-[11px] uppercase tracking-[0.25em] hover:bg-white hover:text-black transition-colors disabled:opacity-50 disabled:hover:bg-black disabled:hover:text-white"
            >
              {isSubmitting ? "Redirigiendo al pago…" : "Ir a pagar"}
            </button>
            <p className="text-[11px] text-muted-foreground text-center">
              Enviamos solo a la península y Baleares. Te llevamos a la pasarela segura de Stripe
              para introducir la dirección de envío y pagar con tarjeta. El número de tarjeta lo
              gestiona Stripe, nunca ECLIPSSE™.
            </p>
          </form>

          <aside className="lg:sticky lg:top-24 border border-border p-5 md:p-6">
            <h2 className="font-display text-lg mb-4">Tu pedido</h2>
            <div className="divide-y divide-border">
              {detailedLines.map((l) => (
                <div key={`${l.id}-${l.size}`} className="flex gap-3 py-3 first:pt-0 text-sm">
                  <div className="h-16 w-14 shrink-0 overflow-hidden bg-muted">
                    <img src={l.product.front} alt={l.product.name} loading="lazy" decoding="async" className="h-full w-full object-cover" />
                  </div>
                  <div className="flex flex-1 justify-between gap-2">
                    <span>
                      {l.product.name}
                      <span className="block text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                        Talla {l.size} · x{l.qty}
                      </span>
                    </span>
                    <span className="tabular-nums">{formatEuros(l.lineTotalCents)}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="tabular-nums">{formatEuros(subtotalCents)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {noSePuedeEnviar ? "Envío" : `Envío${zone ? ` · ${ZONE_LABELS[zone]}` : " (estimado)"}`}
                </span>
                <span className="tabular-nums">
                  {noSePuedeEnviar || envioCents === null
                    ? "No disponible"
                    : envioEsGratis
                      ? "Gratis"
                      : formatEuros(envioCents)}
                </span>
              </div>
              <div className="flex justify-between border-t border-border pt-2 font-display text-base">
                <span>Total</span>
                <span className="tabular-nums">
                  {noSePuedeEnviar || totalConEnvio === null ? "—" : formatEuros(totalConEnvio)}
                </span>
              </div>
              {noSePuedeEnviar ? (
                <p className="text-[11px] text-muted-foreground">
                  No podemos enviar este pedido por la vía habitual. Escríbenos por WhatsApp y lo
                  gestionamos de otra manera.
                </p>
              ) : (
                !zone && (
                  <p className="text-[11px] text-muted-foreground">
                    Escribe tu código postal para ver el envío exacto.
                  </p>
                )
              )}
              <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">IVA incluido</p>
            </div>
          </aside>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
