import { motion, type Variants } from "framer-motion";

import { WHATSAPP_URL, INSTAGRAM_URL, TIKTOK_URL, EMAIL } from "@/data/contacto";

function InstagramIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
    </svg>
  );
}

function TikTokIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.3 6.3 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.16 8.16 0 0 0 4.77 1.52V6.76a4.85 4.85 0 0 1-1-.07z"/>
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884M20.463 3.488A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
    </svg>
  );
}

// El tipo `Variants` no es decorativo: sin él, TypeScript deduce que `ease` es
// un `number[]` de longitud libre, y framer-motion exige exactamente cuatro
// números (los de una curva de Bézier). En el resto del proyecto no pasa porque
// las animaciones van escritas dentro del propio JSX, donde el tipo del atributo
// ya dice de qué forma tiene que ser.
const containerVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

export function ContactCTA({ variant = "shop" }: { variant?: "shop" | "contact" }) {
  return (
    <section id="contacto" className="border-t border-border bg-white">
      <motion.div
        className="mx-auto max-w-lg px-5 md:px-8 py-20 md:py-28 text-center"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
      >
        <motion.h2 variants={itemVariants} className="font-display text-5xl md:text-7xl leading-[0.95]">
          Escríbenos.
        </motion.h2>

        {variant === "contact" && (
          <motion.a
            variants={itemVariants}
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-10 inline-block w-full rounded-full border border-black bg-black text-white px-10 py-4 font-display text-[11px] uppercase tracking-[0.25em] hover:bg-white hover:text-black transition-colors"
          >
            Compra por WhatsApp
          </motion.a>
        )}

        <motion.p variants={itemVariants} className="mt-10 font-display text-xs uppercase tracking-[0.25em] text-muted-foreground">
          {variant === "contact" ? "También por:" : "Contacto:"}
        </motion.p>

        <motion.div variants={itemVariants} className="mt-4 flex flex-col gap-3">
          {variant === "shop" && (
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2.5 w-full rounded-full border border-black px-5 py-3 font-display text-[11px] uppercase tracking-[0.2em] hover:bg-black hover:text-white transition-colors"
            >
              <WhatsAppIcon />
              WhatsApp
            </a>
          )}
          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2.5 w-full rounded-full border border-black px-5 py-3 font-display text-[11px] uppercase tracking-[0.2em] hover:bg-black hover:text-white transition-colors"
          >
            <InstagramIcon />
            Instagram
          </a>
          <a
            href={TIKTOK_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2.5 w-full rounded-full border border-black px-5 py-3 font-display text-[11px] uppercase tracking-[0.2em] hover:bg-black hover:text-white transition-colors"
          >
            <TikTokIcon />
            TikTok
          </a>
        </motion.div>

        <motion.p variants={itemVariants} className="mt-5 text-sm text-muted-foreground">
          <a href={`mailto:${EMAIL}`} className="hover:text-black transition-colors underline underline-offset-4">
            {EMAIL}
          </a>
        </motion.p>
      </motion.div>
    </section>
  );
}
