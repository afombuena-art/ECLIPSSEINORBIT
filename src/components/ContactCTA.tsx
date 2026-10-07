import { motion, type Variants } from "framer-motion";

import { WHATSAPP_URL, EMAIL } from "@/data/contacto";
import { WhatsAppIcon } from "./SocialIcons";

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
    <section id="contacto" className="border-t border-border bg-background">
      <motion.div
        className="mx-auto max-w-lg px-5 md:px-8 py-20 md:py-28 text-center"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
      >
        <motion.h2
          variants={itemVariants}
          className="font-display text-5xl md:text-7xl leading-[0.95]"
        >
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

        <motion.p
          variants={itemVariants}
          className="mt-10 font-display text-xs uppercase tracking-[0.25em] text-muted-foreground"
        >
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
        </motion.div>

        <motion.p variants={itemVariants} className="mt-5 text-sm text-muted-foreground">
          <a
            href={`mailto:${EMAIL}`}
            className="inline-block py-2 hover:text-black transition-colors underline underline-offset-4"
          >
            {EMAIL}
          </a>
        </motion.p>
      </motion.div>
    </section>
  );
}
