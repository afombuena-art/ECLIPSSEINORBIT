import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { Logo } from "@/components/Logo";

export const Route = createFileRoute("/")({
 head: () => ({
  meta: [
    { title: "ECLIPSSE™ UNIVERSE | Por y para jóvenes" },
    {
      name: "description",
      content:
        "Marca de ropa y personalización por y para jóvenes. De Sevilla al mundo.",
    },
    { name: "robots", content: "index, follow" },
    { property: "og:title", content: "ECLIPSSE™ UNIVERSE | Por y para jóvenes" },
    {
      property: "og:description",
      content:
        "Marca de ropa y personalización por y para jóvenes. De Sevilla al mundo.",
    },
    { property: "og:type", content: "website" },
    { property: "og:url", content: "https://www.eclipssebrand.es/" },
    { name: "twitter:title", content: "ECLIPSSE™ UNIVERSE | Por y para jóvenes" },
    {
      name: "twitter:description",
      content:
        "Marca de ropa y personalización por y para jóvenes. De Sevilla al mundo.",
    },
  ],
  links: [{ rel: "canonical", href: "https://www.eclipssebrand.es/" }],
}),
  component: Landing,
});

function Landing() {
  const navigate = useNavigate();
  const [going, setGoing] = useState<null | "brand" | "custom">(null);

  const go = (to: "brand" | "custom") => {
    if (going) return;
    setGoing(to);
  };

  // La navegación espera a que termine la transición de salida. Va en un efecto
  // con limpieza para que, si el usuario se va antes, no se le navegue a una
  // página que ya no había pedido.
  useEffect(() => {
    if (!going) return;
    const id = setTimeout(() => {
      navigate({ to: going === "brand" ? "/eclipssebrand" : "/personaliza" });
    }, 680);
    return () => clearTimeout(id);
  }, [going, navigate]);

  return (
    <main className="relative min-h-[100svh] overflow-hidden bg-white text-black flex flex-col items-center px-6">

      {/* Transition overlay */}
      <AnimatePresence>
        {going && (
          <motion.div
            key="transition"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-white"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 0.8, ease: "linear", repeat: Infinity }}
            >
              <Logo className="h-14 md:h-20" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Logo — fixed, no float */}
      <motion.div
        initial={{ y: -16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="pt-10 md:pt-14"
      >
        <Logo className="h-14 md:h-20" />
      </motion.div>

      {/* Center area: tagline + buttons */}
      <div className="flex-1 w-full flex flex-col items-center justify-center gap-0 max-w-sm">
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-6 font-display text-[11px] uppercase tracking-[0.35em] text-muted-foreground"
        >
          Elige tu experiencia
        </motion.p>

        <div className="w-full flex flex-col gap-4 md:gap-5">
          <ChoiceButton
            label="ECLIPSSEBRAND"
            delay={0.3}
            onClick={() => go("brand")}
            dimmed={going === "custom"}
            selected={going === "brand"}
          />
          <ChoiceButton
            label="PERSONALIZA"
            delay={0.42}
            onClick={() => go("custom")}
            dimmed={going === "brand"}
            selected={going === "custom"}
          />
        </div>
      </div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.7, delay: 0.7 }}
        className="font-display text-[10px] uppercase tracking-[0.4em] text-muted-foreground pb-8"
      >
        Por y para jóvenes
      </motion.p>
    </main>
  );
}

function ChoiceButton({
  label,
  delay,
  onClick,
  dimmed,
  selected,
}: {
  label: string;
  delay: number;
  onClick: () => void;
  dimmed: boolean;
  selected: boolean;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      initial={{ y: 20, opacity: 0 }}
      animate={{
        y: 0,
        opacity: dimmed ? 0.15 : 1,
        scale: selected ? 1.03 : 1,
      }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.97 }}
      className="float-anim relative w-full cursor-pointer"
      aria-label={`Entrar en ${label}`}
    >
      <span
        className={`block w-full rounded-full border border-black px-8 py-4 md:py-5 font-display text-base md:text-lg tracking-[0.12em] text-center transition-colors duration-300 ${
          selected ? "bg-black text-white" : "bg-white text-black hover:bg-black hover:text-white"
        }`}
      >
        {label}
      </span>
    </motion.button>
  );
}
