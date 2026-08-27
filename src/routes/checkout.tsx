import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { SiteHeader } from "@/components/SiteHeader";
import { Marquee } from "@/components/Marquee";
import { SiteFooter } from "@/components/SiteFooter";
import { useCart } from "@/lib/cart";
import { formatEuros } from "@/lib/money";
import { checkoutSchema, PROVINCES, type CheckoutInput } from "@/lib/checkout-schema";
import { createCheckoutSession } from "@/lib/checkout.server";

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
const labelClass = "block text-[11px] uppercase tracking-[0.2em] text-muted-foreground mb-2";

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="mt-1.5 text-[11px] text-red-600">{msg}</p>;
}

function CheckoutPage() {
  const navigate = useNavigate();
  const { detailedLines, subtotalCents, shippingCents, totalCents, hydrated, clear } = useCart();
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
  } = useForm<CheckoutInput>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      email: "",
      phone: "",
      firstName: "",
      lastName: "",
      address1: "",
      address2: "",
      postalCode: "",
      city: "",
      province: "",
      country: "ES",
      billingSameAsShipping: true,
      invoiceNif: "",
      orderNotes: "",
      acceptTerms: false,
      marketingOptIn: false,
      items: [],
    },
  });

  const billingSame = watch("billingSameAsShipping");

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);
    const items = detailedLines.map((l) => ({ id: l.id, size: l.size, qty: l.qty }));
    if (items.length === 0) {
      navigate({ to: "/eclipssebrand" });
      return;
    }
    try {
      const result = await createCheckoutSession({ data: { ...values, items } });
      // Pre-Stripe: el pago aún no está activo. Guardamos el carrito y vamos a la página puente.
      if (!result.ready) {
        navigate({ to: "/pedido/pendiente" });
        return;
      }
      // (Cuando Stripe esté activo, aquí se redirige a result.url y se limpia el carrito tras el pago.)
      clear();
    } catch {
      setSubmitError(
        "No se ha podido procesar el pedido. Revisa los datos e inténtalo de nuevo en unos segundos.",
      );
    }
  });

  if (hydrated && detailedLines.length === 0) return null;

  return (
    <div className="min-h-screen bg-white text-black">
      <Marquee text="POR Y PARA JÓVENES" />
      <SiteHeader current="brand" />

      <section className="mx-auto max-w-6xl px-5 md:px-8 py-10 md:py-16">
        <Link to="/eclipssebrand" className="text-[11px] uppercase tracking-[0.25em] hover:underline">
          ← Seguir comprando
        </Link>
        <h1 className="mt-6 font-display text-4xl md:text-6xl leading-tight">Finalizar compra</h1>

        <div className="mt-10 grid lg:grid-cols-[1fr_380px] gap-10 lg:gap-16 items-start">
          {/* Formulario */}
          <form onSubmit={onSubmit} noValidate className="space-y-10">
            <fieldset className="space-y-5">
              <legend className="font-display text-lg mb-4">Contacto</legend>
              <div>
                <label className={labelClass} htmlFor="email">Email</label>
                <input id="email" type="email" autoComplete="email" className={inputClass} {...register("email")} />
                <FieldError msg={errors.email?.message} />
              </div>
              <div>
                <label className={labelClass} htmlFor="phone">Teléfono</label>
                <input id="phone" type="tel" autoComplete="tel" className={inputClass} {...register("phone")} />
                <FieldError msg={errors.phone?.message} />
              </div>
            </fieldset>

            <fieldset className="space-y-5">
              <legend className="font-display text-lg mb-4">Dirección de envío</legend>
              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label className={labelClass} htmlFor="firstName">Nombre</label>
                  <input id="firstName" autoComplete="given-name" className={inputClass} {...register("firstName")} />
                  <FieldError msg={errors.firstName?.message} />
                </div>
                <div>
                  <label className={labelClass} htmlFor="lastName">Apellidos</label>
                  <input id="lastName" autoComplete="family-name" className={inputClass} {...register("lastName")} />
                  <FieldError msg={errors.lastName?.message} />
                </div>
              </div>
              <div>
                <label className={labelClass} htmlFor="address1">Dirección (calle y número)</label>
                <input id="address1" autoComplete="address-line1" className={inputClass} {...register("address1")} />
                <FieldError msg={errors.address1?.message} />
              </div>
              <div>
                <label className={labelClass} htmlFor="address2">Piso, puerta, otros (opcional)</label>
                <input id="address2" autoComplete="address-line2" className={inputClass} {...register("address2")} />
                <FieldError msg={errors.address2?.message} />
              </div>
              <div className="grid sm:grid-cols-3 gap-5">
                <div>
                  <label className={labelClass} htmlFor="postalCode">Código postal</label>
                  <input id="postalCode" inputMode="numeric" autoComplete="postal-code" className={inputClass} {...register("postalCode")} />
                  <FieldError msg={errors.postalCode?.message} />
                </div>
                <div>
                  <label className={labelClass} htmlFor="city">Población</label>
                  <input id="city" autoComplete="address-level2" className={inputClass} {...register("city")} />
                  <FieldError msg={errors.city?.message} />
                </div>
                <div>
                  <label className={labelClass} htmlFor="province">Provincia</label>
                  <select id="province" className={inputClass} {...register("province")}>
                    <option value="">Selecciona…</option>
                    {PROVINCES.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                  <FieldError msg={errors.province?.message} />
                </div>
              </div>
              <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                Envíos solo a España peninsular y territorios de Correos.
              </p>
            </fieldset>

            <fieldset className="space-y-4">
              <legend className="font-display text-lg mb-4">Facturación</legend>
              <label className="flex items-start gap-3 text-sm">
                <input type="checkbox" className="mt-1" {...register("billingSameAsShipping")} />
                <span>La dirección de facturación es la misma que la de envío</span>
              </label>
              {!billingSame && (
                <p className="text-[11px] text-muted-foreground">
                  Escríbenos tu dirección de facturación en las notas del pedido y la ajustamos antes de emitir la factura.
                </p>
              )}
              <div>
                <label className={labelClass} htmlFor="invoiceNif">NIF / CIF para factura (opcional)</label>
                <input id="invoiceNif" className={inputClass} {...register("invoiceNif")} />
                <FieldError msg={errors.invoiceNif?.message} />
              </div>
            </fieldset>

            <fieldset className="space-y-4">
              <legend className="font-display text-lg mb-4">Notas del pedido (opcional)</legend>
              <textarea rows={3} className={inputClass} {...register("orderNotes")} />
              <FieldError msg={errors.orderNotes?.message} />
            </fieldset>

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
              <FieldError msg={errors.acceptTerms?.message} />
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
              disabled={isSubmitting}
              className="w-full rounded-full border border-black bg-black text-white px-10 py-4 font-display text-[11px] uppercase tracking-[0.25em] hover:bg-white hover:text-black transition-colors disabled:opacity-50"
            >
              {isSubmitting ? "Procesando…" : "Ir a pagar"}
            </button>
            <p className="text-[11px] text-muted-foreground text-center">
              Pago seguro con tarjeta. El número de tarjeta lo gestiona la pasarela de pago, nunca ECLIPSSE™.
            </p>
          </form>

          {/* Resumen */}
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
                <span className="text-muted-foreground">Envío</span>
                <span className="tabular-nums">{shippingCents === 0 ? "Gratis" : formatEuros(shippingCents)}</span>
              </div>
              <div className="flex justify-between border-t border-border pt-2 font-display text-base">
                <span>Total</span>
                <span className="tabular-nums">{formatEuros(totalCents)}</span>
              </div>
              <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">IVA incluido</p>
            </div>
          </aside>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
