import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ShoppingBag } from "lucide-react";
import { Logo } from "./Logo";
import { useCart } from "@/lib/cart";

export function SiteHeader({ current }: { current: "brand" | "custom" }) {
  const other = current === "brand" ? "custom" : "brand";
  const otherLabel = other === "brand" ? "ECLIPSSEBRAND" : "PERSONALIZA";
  const otherTo = other === "brand" ? "/eclipssebrand" : "/personaliza";
  const homeTo = current === "brand" ? "/eclipssebrand" : "/personaliza";
  const navigate = useNavigate();
  const location = useRouterState({ select: (s) => s.location.pathname });
  const { count, open } = useCart();

  const handleInicio = () => {
    if (location === homeTo) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      navigate({ to: homeTo }).then(() => {
        window.scrollTo({ top: 0, behavior: "instant" });
      });
    }
  };

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="sticky top-3 z-40 px-3 md:px-6 pt-3 pointer-events-none"
    >
      {/* Isla centrada y translúcida (referencia de Jacobo: Becay). El cristal deja ver
          el fondo y las fotos al pasar por debajo; el borde claro y la sombra suave
          la separan sin necesidad de una barra a todo el ancho. */}
      <div className="pointer-events-auto mx-auto flex w-fit max-w-full items-center justify-between gap-3 md:gap-8 rounded-full border border-white/70 bg-white/75 px-3 py-2 md:px-5 md:py-2.5 shadow-[0_8px_30px_rgb(0_0_0/0.08)] backdrop-blur-xl backdrop-saturate-150">
        <div className="flex items-center gap-3 md:gap-5 shrink-0">
          <Link to="/" className="flex items-center" aria-label="Inicio ECLIPSSE">
            <Logo className="h-5 md:h-6" />
          </Link>
          <button
            onClick={handleInicio}
            className="font-display text-[10px] md:text-[11px] uppercase tracking-[0.2em] text-black transition-opacity duration-300 hover:opacity-50"
          >
            INICIO
          </button>
        </div>

        <nav className="flex items-center gap-2 md:gap-3">
          <Link
            to={otherTo}
            className="font-display text-[10px] md:text-[11px] uppercase tracking-[0.2em] rounded-full border border-black/80 px-3 py-1.5 md:px-4 md:py-2 transition-all duration-300 hover:bg-black hover:text-white hover:-translate-y-px"
          >
            ↔ {otherLabel}
          </Link>
          <button
            type="button"
            onClick={open}
            aria-label={count > 0 ? `Abrir carrito (${count})` : "Abrir carrito"}
            className="relative flex h-8 w-8 md:h-9 md:w-9 items-center justify-center rounded-full border border-black/80 transition-all duration-300 hover:bg-black hover:text-white hover:-translate-y-px"
          >
            <ShoppingBag className="h-4 w-4" aria-hidden="true" />
            {count > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-black px-1 text-[10px] font-display leading-none text-white tabular-nums">
                {count}
              </span>
            )}
          </button>
        </nav>
      </div>
    </motion.header>
  );
}
