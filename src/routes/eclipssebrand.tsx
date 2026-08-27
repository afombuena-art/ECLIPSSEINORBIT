import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { Marquee } from "@/components/Marquee";
import { ContactCTA } from "@/components/ContactCTA";
import { SiteFooter } from "@/components/SiteFooter";
import { products } from "@/data/products";
import { formatEuros } from "@/lib/money";
import { DropCountdown } from "@/components/DropCountdown";
import hero from "@/assets/hero_drop.jpeg.asset.json";

export const Route = createFileRoute("/eclipssebrand")({
  head: () => ({
    meta: [
      { title: "ECLIPSSEBRAND | ECLIPSSE™ UNIVERSE" },
      {
        name: "description",
        content:
          "Descubre las prendas y drops de ECLIPSSEBRAND. Marca de ropa por y para jóvenes. De Sevilla al mundo.",
      },
      { name: "robots", content: "index, follow" },
      { property: "og:title", content: "ECLIPSSEBRAND | ECLIPSSE™ UNIVERSE" },
      {
        property: "og:description",
        content:
          "Descubre las prendas y drops de ECLIPSSEBRAND. Marca de ropa por y para jóvenes. De Sevilla al mundo.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://www.eclipssebrand.es/eclipssebrand" },
      { name: "twitter:title", content: "ECLIPSSEBRAND | ECLIPSSE™ UNIVERSE" },
      {
        name: "twitter:description",
        content:
          "Descubre las prendas y drops de ECLIPSSEBRAND. Marca de ropa por y para jóvenes. De Sevilla al mundo.",
      },
    ],
    links: [
      {
        rel: "canonical",
        href: "https://www.eclipssebrand.es/eclipssebrand",
      },
    ],
  }),
  component: BrandPage,
});

const historia = [
  { t: "DROP 001 — SUPERNOVA DROP", d: "Nuestro primer lanzamiento oficial. Una camiseta oversize en dos colores, con el lema \"Don't Stop Shining\". Más de 50 unidades vendidas en formato PRE-ORDER. El inicio de todo." },
  { t: "DROP 003 — YOUTH HOODIE", d: "Una sudadera llamada \"YOUTH HOODIE\" para el invierno, con la mejor calidad posible y representando nuestra marca por y para jóvenes. Venta mediante PRE-ORDER." },
  { t: "DROP 005 — De SVQ al mundo | Fulness of joy", d: "Nuestro primer lanzamiento con stock. Dos diseños de camisetas blancas para la primavera. De Sevilla al mundo." },
  { t: "Verano 2025 — Tres Drops", d: "SUMMER DROP 006: camiseta para el verano en blanco, celeste y amarillo, corte oversize y 100% algodón. DROP 002 / SUPERNOVA 1.0: segunda edición de la camiseta del SUPERNOVA DROP 001, blanca, oversize, 100% algodón. DROP 004: camiseta blanca con diseño en rojo y negro, corte oversize y 100% algodón, \"Creadores del futuro\"." },
  { t: "DROP 007 — ECLIPSSEBRAND × ANDEX", d: "La crewneck en dos colores sacada en nuestro primer invierno oficial. Una sudadera sin capucha de unidades limitadas en colaboración con Andex Cáncer Infantil Sevilla, en la que el 75% del beneficio obtenido fue donado a la asociación." },
  { t: "DROP 008 — IN ORBIT", d: "Colección para el Verano de 2026 de 5 camisetas oversize perfectas para disfrutar de la playa y una gorra vintage de alta calidad. Make in Orbit." },
];

const faqs = [
  { q: "Cómo comprar", a: "A través de Instagram DM o WhatsApp. Te respondemos lo antes posible y te orientamos en todo el proceso de compra." },
  { q: "Historia", a: "Nuestra marca trabaja mediante DROPS: lanzamientos de un número limitado de prendas, disponibles solo durante un periodo concreto o hasta agotar existencias. Cada DROP es único. Una vez se agota el stock, no vuelve a estar disponible." },
];

function BrandPage() {
  return (
    <div className="min-h-screen bg-white text-black">
      <Marquee text="POR Y PARA JÓVENES" />
      <SiteHeader current="brand" />

      <section className="relative h-[72vh] min-h-[480px] overflow-hidden">
        <motion.img
          src={hero.url}
          alt="ECLIPSSE™ UNIVERSE — DROP 008"
          initial={{ scale: 1.08 }}
          animate={{ scale: 1 }}
          transition={{ duration: 2, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0 w-full h-full object-cover"
          loading="eager"
          fetchPriority="high"
          decoding="async"
        />
      </section>

      <section id="coleccion" className="mx-auto max-w-7xl px-5 md:px-8 py-20 md:py-28">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="flex items-end justify-between mb-10 md:mb-14"
        >
          <h2 className="font-display text-4xl md:text-6xl">DROP 008</h2>
          <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground hidden md:block">
            {products.length} piezas
          </span>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-6 gap-x-5 gap-y-12 md:gap-x-8 md:gap-y-16">
          {products.map((p, i) => (
            <div
              key={p.slug}
              className={[
                "md:col-span-2",
                i === 3 ? "md:col-start-2" : "",
              ].join(" ").trim()}
            >
              <ProductCard {...p} index={i} />
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-border bg-white flex justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 1.02 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-[540px] aspect-[4/5] overflow-hidden"
        >
          <img
            src="/images/drop008-banner.png"
            alt="ECLIPSSE™ IN ORBIT — DROP 008"
            className="w-full h-full object-cover"
            loading="lazy"
            decoding="async"
          />
        </motion.div>
      </section>

      <section id="sobre-nosotros" className="border-t border-border bg-black text-white">
        <div className="mx-auto max-w-5xl px-5 md:px-8 py-20 md:py-28">
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="text-[10px] uppercase tracking-[0.4em] opacity-60 mb-4">Sobre nosotros</p>
            <h2 className="font-display text-4xl md:text-6xl leading-none mb-10">Sobre Nosotros</h2>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-5 text-sm md:text-base opacity-90 leading-relaxed"
          >
            <p>
              Somos una marca de ropa nacida en 2024 en Sevilla (España), fundada por un grupo de amigos jugadores de
              rugby. Bajo el lema "por y para jóvenes", nuestro objetivo es ofrecer productos únicos, con la mejor
              calidad posible y con un estilo que conecte con nuestra generación. Apostamos por un modelo responsable y
              local, buscando siempre cuidar el medioambiente.
            </p>
            <p className="font-display text-xl md:text-2xl opacity-100">DE SEVILLA AL MUNDO</p>
            <h3 className="font-display text-2xl md:text-3xl pt-6">Nuestro Objetivo</h3>
            <p>
              Somos una marca de ropa hecha con una visión clara: destacar entre las marcas ya establecidas. Ofrecer
              productos con estilo, calidad y actitud con precios asequibles y sin perder la conexión con quienes somos:
              una generación que es constante, piensa diferente y quiere dejar huella. Buscamos inspirar a otros jóvenes
              a apostar por sus ideas y construir algo propio, como hacemos nosotros. Queremos diferenciarnos de otras
              marcas y usar este proyecto para algo más que vender. Tener una identidad, una historia y una misión, por
              ejemplo ayudando a personas que lo necesiten o creando productos únicos.
            </p>
            <p className="font-display text-2xl md:text-3xl pt-6">Por y para jóvenes</p>
          </motion.div>

          <div className="mt-14 -mx-5 md:-mx-8">
            <div
              className="flex overflow-x-auto gap-3 px-5 md:px-8 pb-2 snap-x snap-mandatory"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" } as React.CSSProperties}
            >
              {[
                { src: "/images/gallery-1.png", alt: "ECLIPSSE™ — Calle" },
                { src: "/images/gallery-2.png", alt: "ECLIPSSE™ — DROP 007 Andex" },
                { src: "/images/gallery-3.png", alt: "ECLIPSSE™ — Summer Drop" },
                { src: "/images/gallery-4.png", alt: "ECLIPSSE™ — Supernova Drop 001" },
                { src: "/images/gallery-5.png", alt: "ECLIPSSE™ — DROP 006" },
              ].map((img, i) => (
                <motion.div
                  key={img.src}
                  initial={{ opacity: 0, x: 24 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.55, delay: i * 0.07 }}
                  className="flex-none snap-start w-[72vw] md:w-[36vw] lg:w-[26vw] aspect-[4/5] overflow-hidden bg-white/5"
                >
                  <img
                    src={img.src}
                    alt={img.alt}
                    className="w-full h-full object-cover grayscale"
                    loading="lazy"
                    decoding="async"
                  />
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="mas" className="border-t border-border bg-white">
        <div className="mx-auto max-w-4xl px-5 md:px-8 pt-20 md:pt-28 pb-10">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground mb-4">Información</p>
            <h2 className="font-display text-4xl md:text-6xl mb-10 md:mb-14">Información</h2>
          </motion.div>

          <div className="divide-y divide-black/15 border-y border-black/15">
            {faqs.map((f) => (
              <FaqItem key={f.q} q={f.q} a={f.a} historia={f.q === "Historia" ? historia : undefined} />
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden border-t border-border">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="relative w-full aspect-[16/7] md:aspect-[21/9] overflow-hidden"
        >
          <img
            src="/images/instagram-banner.png"
            alt="ECLIPSSE™ UNIVERSE"
            className="w-full h-full object-cover grayscale"
            loading="lazy"
            decoding="async"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <a
              href="https://www.instagram.com/eclipssebrand/p/DX42pjMDHmh/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-display text-[11px] uppercase tracking-[0.35em] text-white border border-white/70 px-8 py-4 rounded-full backdrop-blur-sm bg-white/10 hover:bg-white hover:text-black transition-colors duration-300 cursor-pointer"
            >
              Instagram
            </a>
          </div>
        </motion.div>
      </section>

      <ContactCTA />
      <DropCountdown />
      <SiteFooter />
    </div>
  );
}

function FaqItem({ q, a, historia }: { q: string; a: string; historia?: { t: string; d: string }[] }) {
  const [open, setOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (!contentRef.current) return;
    setHeight(open ? contentRef.current.scrollHeight : 0);
  }, [open]);

  return (
    <div className="py-5 md:py-7">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-6 text-left"
        aria-expanded={open}
      >
        <h3 className="font-display text-xl md:text-3xl">{q}</h3>
        <span className={`text-2xl transition-transform duration-300 ${open ? "rotate-45" : ""}`} aria-hidden="true">+</span>
      </button>
      <motion.div
        animate={{ height, opacity: open ? 1 : 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="overflow-hidden"
        style={{ height: 0 }}
      >
        <div ref={contentRef} className="pt-5 text-sm md:text-base text-muted-foreground leading-relaxed">
          <p>{a}</p>
          {historia && (
            <div className="mt-6 space-y-5">
              {historia.map((h) => (
                <div key={h.t} className="border-t border-black/15 pt-4">
                  <h4 className="font-display text-base md:text-lg text-black">{h.t}</h4>
                  <p className="text-sm leading-relaxed mt-1">{h.d}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function ProductCard({ slug, name, priceCents, front, back, index }: { slug: string; name: string; priceCents: number; front: string; back: string; index: number }) {
  const [hover, setHover] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, delay: (index % 3) * 0.06, ease: [0.22, 1, 0.36, 1] }}
    >
      <Link
        to="/prendas/$slug"
        params={{ slug }}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        className="group block text-center"
      >
        <div className="relative aspect-[4/5] overflow-hidden bg-muted">
          <img
            src={front}
            alt={name}
            loading="lazy"
            decoding="async"
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${hover ? "opacity-0" : "opacity-100"}`}
          />
          <img
            src={back}
            alt=""
            aria-hidden="true"
            loading="lazy"
            decoding="async"
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${hover ? "opacity-100" : "opacity-0"}`}
          />
        </div>
        <div className="mt-4 flex flex-col items-center gap-1">
          <h3 className="font-display text-sm md:text-base tracking-tight text-center px-1">{name}</h3>
          <span className="text-xs md:text-sm tabular-nums text-muted-foreground">{formatEuros(priceCents)}</span>
        </div>
      </Link>
    </motion.div>
  );
}
