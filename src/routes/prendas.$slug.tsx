import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { Marquee } from "@/components/Marquee";
import { ContactCTA } from "@/components/ContactCTA";
import { SiteFooter } from "@/components/SiteFooter";
import { getProduct, products } from "@/data/products";
import { formatEuros } from "@/lib/money";
import { useCart } from "@/lib/cart";

const WHATSAPP_URL = "https://wa.me/message/P5FFTHYMWKNRA1";

const SIZE_GUIDE = [
  { talla: "S", pecho: 53, largo: 69, manga: 24 },
  { talla: "M", pecho: 57, largo: 73, manga: 25 },
  { talla: "L", pecho: 60, largo: 75, manga: 26 },
  { talla: "XL", pecho: 64, largo: 77, manga: 27 },
];

const CARE_GUIDE = [
  "No usar secadora",
  "No limpieza en seco",
  "Planchar máximo 110º",
  "No usar lejía / blanqueador",
  "Lavar a máquina max. 20ºC. Centrifugado corto",
];

export const Route = createFileRoute("/prendas/$slug")({
  head: ({ params }) => {
    const p = getProduct(params.slug);
    return {
      meta: [
        { title: p ? `${p.name} — ECLIPSSE™ UNIVERSE` : "Prenda | ECLIPSSE™ UNIVERSE" },
        { name: "description", content: p?.description ?? "Prenda ECLIPSSE™ UNIVERSE" },
        ...(p ? [{ property: "og:image" as const, content: p.front }] : []),
        { property: "og:url", content: `/prendas/${params.slug}` },
      ],
      links: [{ rel: "canonical", href: `/prendas/${params.slug}` }],
    };
  },
  component: ProductPage,
  notFoundComponent: () => (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <p className="text-sm uppercase tracking-[0.3em]">Prenda no encontrada</p>
    </div>
  ),
  loader: ({ params }) => {
    const p = getProduct(params.slug);
    if (!p) throw notFound();
    return { product: p };
  },
});

function ProductPage() {
  const { product } = Route.useLoaderData();
  const [active, setActive] = useState(0);
  const [direction, setDirection] = useState(0);
  const [size, setSize] = useState(product.sizes[0]);
  const [qty, setQty] = useState(1);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const [careOpen, setCareOpen] = useState(false);
  const sizeGuideRef = useRef<HTMLDivElement>(null);
  const cart = useCart();
  const images = product.images;
  const isCamiseta = product.category === "Camiseta";

  useEffect(() => {
    setActive(0);
    setDirection(0);
    setQty(1);
    setSize(product.sizes[0]);
  }, [product.slug, product.sizes]);

  const goTo = (index: number) => {
    setDirection(index > active ? 1 : -1);
    setActive(index);
  };

  const openSizeGuide = () => {
    setSizeGuideOpen(true);
    setTimeout(() => {
      sizeGuideRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  };

  const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? "100%" : "-100%", opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? "-100%" : "100%", opacity: 0 }),
  };

  return (
    <div className="min-h-screen bg-white text-black">
      <Marquee text="POR Y PARA JÓVENES" />
      <SiteHeader current="brand" />

      <section className="mx-auto max-w-7xl px-5 md:px-8 py-10 md:py-16 grid md:grid-cols-2 gap-10 md:gap-16">
        <div>
          <div
            className="relative aspect-[4/5] bg-muted overflow-hidden select-none"
          >
            <AnimatePresence initial={false} custom={direction} mode="popLayout">
              <motion.img
                key={active}
                src={images[active]}
                alt={product.name}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="absolute inset-0 w-full h-full object-cover"
                decoding="async"
                draggable={false}
              />
            </AnimatePresence>
            {images.length > 1 && (
              <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 pointer-events-none">
                {images.map((_: string, i: number) => (
                  <span
                    key={i}
                    className={`w-1.5 h-1.5 rounded-full transition-colors duration-300 ${i === active ? "bg-white" : "bg-white/50"}`}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 grid grid-cols-4 gap-3">
            {images.map((src: string, i: number) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className={`cursor-pointer aspect-square overflow-hidden border-2 transition-colors ${active === i ? "border-black" : "border-transparent"}`}
                aria-label={`Imagen ${i + 1}`}
              >
                <img src={src} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        <div>
          <Link to="/eclipssebrand" className="text-[11px] uppercase tracking-[0.25em] hover:underline">
            ← Volver a DROP 008
          </Link>
          <p className="mt-6 text-[10px] uppercase tracking-[0.4em] text-muted-foreground">{product.category}</p>

          <div className="flex items-start gap-4 mt-2">
            <div className="flex-1">
              <h1 className="font-display text-4xl md:text-6xl leading-tight">{product.name}</h1>
              <p className="mt-4 text-2xl">{formatEuros(product.priceCents)}</p>
            </div>
            <div className="shrink-0 mt-1">
              <span
                className="inline-block rotate-[-8deg] border-2 border-black rounded-sm px-2.5 py-1.5 font-display text-[9px] uppercase tracking-[0.2em] leading-tight bg-white shadow-sm"
                style={{ textAlign: "center", minWidth: "76px" }}
              >
                Unidades<br />limitadas
              </span>
            </div>
          </div>

          <div className="mt-10">
            <p className="text-[11px] uppercase tracking-[0.25em] mb-3">Talla</p>
            <div className="flex flex-wrap gap-2">
              {product.sizes.map((s: string) => (
                <button
                  key={s}
                  onClick={() => setSize(s)}
                  aria-pressed={size === s}
                  className={`cursor-pointer min-w-[52px] min-h-[44px] px-4 py-3 text-sm rounded-full border transition-colors ${
                    size === s ? "bg-black text-white border-black" : "border-black hover:bg-black hover:text-white"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>

            {isCamiseta && (
              <button
                onClick={openSizeGuide}
                className="cursor-pointer mt-3 text-[11px] uppercase tracking-[0.2em] text-muted-foreground underline underline-offset-4 hover:text-black transition-colors"
              >
                Guía de tallas
              </button>
            )}
          </div>

          <div className="mt-10 flex flex-col sm:flex-row gap-3">
            <div className="flex items-center border border-black self-start">
              <button
                type="button"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                aria-label="Quitar una unidad"
                className="cursor-pointer h-12 w-12 text-lg leading-none hover:bg-black hover:text-white transition-colors"
              >
                −
              </button>
              <span className="w-10 text-center tabular-nums">{qty}</span>
              <button
                type="button"
                onClick={() => setQty((q) => Math.min(99, q + 1))}
                aria-label="Añadir una unidad"
                className="cursor-pointer h-12 w-12 text-lg leading-none hover:bg-black hover:text-white transition-colors"
              >
                +
              </button>
            </div>
            <button
              type="button"
              onClick={() => {
                cart.add(product.id, size, qty);
                cart.open();
              }}
              className="cursor-pointer flex-1 text-center rounded-full border border-black bg-black text-white px-10 py-4 font-display text-[11px] uppercase tracking-[0.25em] hover:bg-white hover:text-black transition-colors"
            >
              Añadir al carrito
            </button>
          </div>
          <p className="mt-4 text-xs uppercase tracking-[0.25em] text-muted-foreground">
            ¿Dudas con tu pedido?{" "}
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-4 hover:text-black transition-colors"
            >
              Escríbenos por WhatsApp
            </a>
          </p>

          <div className="mt-12 border-t border-border pt-8">
            <h2 className="font-display text-lg mb-3">Descripción</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">{product.description}</p>
          </div>

          <div className="mt-8 border-t border-border pt-8">
            <h2 className="font-display text-lg mb-3">Detalles</h2>
            <ul className="text-sm text-muted-foreground leading-relaxed space-y-1">
              {product.details.map((d: string) => (
                <li key={d}>— {d}</li>
              ))}
            </ul>
          </div>

          {isCamiseta && (
            <div ref={sizeGuideRef} className="mt-8 border-t border-border pt-8">
              <button
                onClick={() => setSizeGuideOpen((v) => !v)}
                className="cursor-pointer w-full flex items-center justify-between gap-4 text-left"
                aria-expanded={sizeGuideOpen}
              >
                <h2 className="font-display text-lg">Guía de tallas</h2>
                <span className={`text-xl transition-transform duration-300 ${sizeGuideOpen ? "rotate-45" : ""}`} aria-hidden="true">+</span>
              </button>

              <motion.div
                initial={false}
                animate={{ height: sizeGuideOpen ? "auto" : 0, opacity: sizeGuideOpen ? 1 : 0 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className="overflow-hidden"
              >
                <div className="pt-5">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-2 pr-4 text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-normal"></th>
                        {SIZE_GUIDE.map((r) => (
                          <th key={r.talla} className="py-2 px-3 text-[10px] uppercase tracking-[0.2em] font-display font-semibold text-center">{r.talla}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      <tr>
                        <td className="py-3 pr-4 text-[11px] uppercase tracking-[0.15em] text-muted-foreground whitespace-nowrap">Ancho pecho</td>
                        {SIZE_GUIDE.map((r) => (
                          <td key={r.talla} className="py-3 px-3 text-center text-sm tabular-nums">{r.pecho}</td>
                        ))}
                      </tr>
                      <tr>
                        <td className="py-3 pr-4 text-[11px] uppercase tracking-[0.15em] text-muted-foreground whitespace-nowrap">Largo frontal</td>
                        {SIZE_GUIDE.map((r) => (
                          <td key={r.talla} className="py-3 px-3 text-center text-sm tabular-nums">{r.largo}</td>
                        ))}
                      </tr>
                      <tr>
                        <td className="py-3 pr-4 text-[11px] uppercase tracking-[0.15em] text-muted-foreground whitespace-nowrap">Manga</td>
                        {SIZE_GUIDE.map((r) => (
                          <td key={r.talla} className="py-3 px-3 text-center text-sm tabular-nums">{r.manga}</td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                  <p className="mt-3 text-[10px] text-muted-foreground">Medidas en cm. Tolerancia de producción ±5%.</p>
                  <p className="mt-1 text-[10px] text-muted-foreground">Corte <strong className="text-black">oversize</strong> — si dudas entre tallas, elige la menor.</p>
                </div>
              </motion.div>
            </div>
          )}

          <div className="mt-8 border-t border-border pt-8">
            <button
              onClick={() => setCareOpen((v) => !v)}
              className="cursor-pointer w-full flex items-center justify-between gap-4 text-left"
              aria-expanded={careOpen}
            >
              <h2 className="font-display text-lg">Guía de cuidado de ropa</h2>
              <span className={`text-xl transition-transform duration-300 ${careOpen ? "rotate-45" : ""}`} aria-hidden="true">+</span>
            </button>

            <motion.div
              initial={false}
              animate={{ height: careOpen ? "auto" : 0, opacity: careOpen ? 1 : 0 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden"
            >
              <ul className="pt-5 text-sm text-muted-foreground leading-relaxed space-y-1">
                {CARE_GUIDE.map((c) => (
                  <li key={c}>— {c}</li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="border-t border-border">
        <div className="mx-auto max-w-7xl px-5 md:px-8 py-16">
          <h2 className="font-display text-2xl md:text-3xl mb-8">También del DROP 008</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {products
              .filter((p) => p.slug !== product.slug)
              .slice(0, 4)
              .map((p) => (
                <Link key={p.slug} to="/prendas/$slug" params={{ slug: p.slug }} className="group block text-center">
                  <div className="aspect-[4/5] bg-muted overflow-hidden">
                    <img
                      src={p.front}
                      alt={p.name}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="mt-3 flex flex-col items-center gap-0.5">
                    <span className="font-display text-sm">{p.name}</span>
                    <span className="text-xs text-muted-foreground">{formatEuros(p.priceCents)}</span>
                  </div>
                </Link>
              ))}
          </div>
        </div>
      </section>

      <ContactCTA />
      <SiteFooter />
    </div>
  );
}
