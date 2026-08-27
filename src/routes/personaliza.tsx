import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { SiteHeader } from "@/components/SiteHeader";
import { Marquee } from "@/components/Marquee";
import { ContactCTA } from "@/components/ContactCTA";
import { SiteFooter } from "@/components/SiteFooter";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { Logo } from "@/components/Logo";

export const Route = createFileRoute("/personaliza")({
  head: () => ({
    meta: [
      { title: "Personaliza tu ropa | ECLIPSSE™ UNIVERSE" },
      {
        name: "description",
        content:
          "Personaliza prendas con ECLIPSSE™ UNIVERSE. Ropa y personalización por y para jóvenes. De Sevilla al mundo.",
      },
      { name: "robots", content: "index, follow" },
      { property: "og:title", content: "Personaliza tu ropa | ECLIPSSE™ UNIVERSE" },
      {
        property: "og:description",
        content:
          "Personaliza prendas con ECLIPSSE™ UNIVERSE. Ropa y personalización por y para jóvenes. De Sevilla al mundo.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://www.eclipssebrand.es/personaliza" },
      { name: "twitter:title", content: "Personaliza tu ropa | ECLIPSSE™ UNIVERSE" },
      {
        name: "twitter:description",
        content:
          "Personaliza prendas con ECLIPSSE™ UNIVERSE. Ropa y personalización por y para jóvenes. De Sevilla al mundo.",
      },
    ],
    links: [
      {
        rel: "canonical",
        href: "https://www.eclipssebrand.es/personaliza",
      },
    ],
  }),
  component: CustomPage,
});

const steps = [
  { n: "01", t: "Cuéntanos tu idea", d: "Mándanos tu concepto, referencias y cantidades. Te asesoramos sin compromiso." },
  { n: "02", t: "Diseño y prueba", d: "Nuestro estudio prepara el arte final y una visualización digital antes de imprimir." },
  { n: "03", t: "Producción", d: "Imprimimos en serigrafía, DTF o bordado sobre prendas heavy cotton de primera calidad." },
  { n: "04", t: "Entrega", d: "Recibe tu pedido en 7–14 días en toda España. Packaging neutro disponible." },
];

const services = [
  { t: "Serigrafía", d: "Acabado profesional, colores planos y máxima durabilidad. Ideal para tiradas medianas y grandes." },
  { t: "DTF", d: "Detalle fotográfico, full color y diseños complejos. Perfecto para pequeñas cantidades." },
  { t: "Bordado", d: "Textura premium para logos, gorras y prendas corporativas." },
  { t: "Diseño gráfico", d: "Si no tienes diseño, lo creamos contigo. De la idea al artwork final." },
];

function CustomPage() {
  return (
    <div className="min-h-screen bg-white text-black">
      <Marquee text="TÚ NOS DAS LA IDEA, NOSOTROS LA CREAMOS" />
      <SiteHeader current="custom" />

      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-5 md:px-8 pt-20 md:pt-32 pb-20 md:pb-28">
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground mb-6"
          >
            Personalizados · ECLIPSSE™ UNIVERSE
          </motion.p>
          <motion.h1
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="font-display text-5xl md:text-[8rem] leading-[0.9] tracking-tight"
          >
            Tu idea,<br />
            nuestra<br />
            órbita.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="mt-8 max-w-2xl text-base md:text-lg text-muted-foreground leading-relaxed"
          >
            En ECLIPSSE™ UNIVERSE creemos que cada idea merece convertirse en algo real. Ofrecemos productos
            personalizados, tanto para pedidos pequeños como para proyectos más grandes.
          </motion.p>
          <motion.a
            href="#contacto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.5 }}
            className="mt-10 inline-block rounded-full border border-black px-8 py-4 font-display text-[11px] uppercase tracking-[0.25em] hover:bg-black hover:text-white transition-colors"
          >
            Pedir presupuesto →
          </motion.a>
        </div>

        <motion.div
          aria-hidden
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.05, rotate: 360 }}
          transition={{ opacity: { duration: 2 }, rotate: { duration: 80, repeat: Infinity, ease: "linear" } }}
          className="pointer-events-none absolute -right-40 -bottom-40 w-[600px] h-[600px] hidden md:block"
        >
          <Logo className="w-full h-full" />
        </motion.div>
      </section>

      <section className="relative h-[72vh] min-h-[420px] overflow-hidden border-t border-border">
        <motion.img
          src="/images/personaliza-hero-wide.png"
          alt="ECLIPSSE™ UNIVERSE — Personaliza"
          initial={{ scale: 1.06 }}
          animate={{ scale: 1 }}
          transition={{ duration: 2, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0 w-full h-full object-cover grayscale"
          loading="eager"
          decoding="async"
        />
      </section>

      <section className="border-t border-border bg-black text-white">
        <div className="mx-auto max-w-5xl px-5 md:px-8 py-20 md:py-28">
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="text-[10px] uppercase tracking-[0.4em] opacity-60 mb-4">01 · Pedidos pequeños</p>
            <h2 className="font-display text-4xl md:text-6xl leading-none mb-10">1 a 3 unidades</h2>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.7, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-5 text-sm md:text-base opacity-90 leading-relaxed"
          >
            <p>Si lo que buscas es una unidad única o pocas unidades, estás en el lugar correcto. Productos personalizables como:</p>
            <ul className="list-disc list-inside space-y-1 opacity-90">
              <li>Camisetas personalizadas</li>
              <li>Sudaderas personalizadas</li>
              <li>Tazas personalizadas</li>
              <li>Otros productos seleccionados</li>
            </ul>

            <h3 className="font-display text-2xl pt-6">¿Cómo funciona?</h3>
            <ol className="list-decimal list-inside space-y-1">
              <li>Piensa el producto que quieras personalizar.</li>
              <li>Idea tu diseño.</li>
              <li>Mándanos tus ideas contactando con nosotros.</li>
            </ol>
            <p>Nosotros nos encargamos de ajustar el diseño, producir el producto y enviarlo a tu casa.</p>

            <h3 className="font-display text-2xl pt-6">A tu gusto</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>Usa tu propio diseño.</li>
              <li>Elige si va en el frontal, trasera…</li>
              <li>Crea una prenda única, hecha especialmente para ti.</li>
            </ul>
            <p className="opacity-70 text-xs uppercase tracking-[0.2em] pt-4">
              Importante: los productos personalizados se fabrican bajo pedido. No se admiten devoluciones salvo defecto de fabricación.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="border-t border-border">
        <div className="mx-auto max-w-5xl px-5 md:px-8 py-20 md:py-28">
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground mb-4">02 · Pedidos grandes</p>
            <h2 className="font-display text-4xl md:text-6xl mb-10">Más de 3 unidades</h2>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.7, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-5 text-sm md:text-base text-muted-foreground leading-relaxed"
          >
            <p>Si lo que quieres es:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Hacer ropa personalizada para una marca, grupo…</li>
              <li>Pedidos de más de 3 unidades.</li>
              <li>Algo más complejo (packaging, calidades concretas, asesoramiento).</li>
              <li>Producción más profesional y a mayor escala.</li>
            </ul>
            <p className="font-display text-black text-xl">Trabajamos contigo de forma totalmente personalizada.</p>

            <h3 className="font-display text-2xl pt-6 text-black">Trabajos a medida</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>Asesoramiento directo.</li>
              <li>Creación del producto desde cero.</li>
              <li>Producción ajustada a tu proyecto.</li>
              <li>Mejores opciones de calidad y acabado.</li>
              <li>Presupuesto personalizado.</li>
            </ul>

            <h3 className="font-display text-2xl pt-6 text-black">Cuéntanos</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>Qué producto quieres.</li>
              <li>Cantidad aproximada.</li>
              <li>Tipo de diseño.</li>
              <li>Idea o proyecto que tienes en mente.</li>
            </ul>
            <p>Te responderemos con la mejor opción posible para tu caso.</p>
          </motion.div>
        </div>
      </section>

      <section className="border-t border-border flex justify-center bg-white">
        <motion.div
          initial={{ opacity: 0, scale: 1.02 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-[540px] aspect-[4/5] overflow-hidden"
        >
          <img
            src="/images/sudaderas-grupos.png"
            alt="ECLIPSSE™ UNIVERSE — Sudaderas para grupos"
            className="w-full h-full object-cover"
            loading="lazy"
            decoding="async"
          />
        </motion.div>
      </section>

      <section className="border-t border-border">
        <div className="mx-auto max-w-7xl px-5 md:px-8 py-20 md:py-28">
          <motion.h2
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
            className="font-display text-4xl md:text-6xl mb-14"
          >
            Cómo trabajamos
          </motion.h2>
          <div className="grid md:grid-cols-4 gap-8 md:gap-10">
            {steps.map((s, i) => (
              <motion.div
                key={s.n}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.6, delay: i * 0.08 }}
                className="border-t border-black pt-5"
              >
                <span className="font-display text-3xl">{s.n}</span>
                <h3 className="font-display text-xl mt-3 mb-2">{s.t}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.d}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-black text-white border-t border-border">
        <div className="mx-auto max-w-7xl px-5 md:px-8 py-20 md:py-28">
          <p className="text-[10px] uppercase tracking-[0.4em] opacity-60 mb-4">Servicios</p>
          <h2 className="font-display text-4xl md:text-6xl mb-14">Técnicas y acabados</h2>
          <div className="grid md:grid-cols-2 gap-10 md:gap-16">
            {services.map((s, i) => (
              <motion.div
                key={s.t}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.6, delay: i * 0.08 }}
              >
                <h3 className="font-display text-2xl mb-2">{s.t}</h3>
                <p className="text-sm md:text-base opacity-80 leading-relaxed">{s.d}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <ContactCTA variant="contact" />
      <SiteFooter />
      <WhatsAppButton />
    </div>
  );
}
