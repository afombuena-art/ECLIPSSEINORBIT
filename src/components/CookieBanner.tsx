import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const consent = localStorage.getItem("cookie_consent");
      if (!consent) setVisible(true);
    } catch {
      // localStorage unavailable
    }
  }, []);

  // El banner se cierra siempre, aunque no se pueda guardar la elección. Si
  // `setItem` lanza (cuota agotada, almacenamiento restringido, política del
  // navegador) y no se captura, el `setVisible(false)` no se ejecuta y el banner
  // se queda tapando la parte baja de la pantalla, botón de pagar incluido.
  const decidir = (valor: "accepted" | "rejected") => {
    try {
      localStorage.setItem("cookie_consent", valor);
    } catch {
      // Sin dónde guardarlo, el banner volverá a salir en la próxima visita.
    }
    setVisible(false);
  };

  const accept = () => decidir("accepted");
  const reject = () => decidir("rejected");

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="fixed bottom-3 left-3 right-3 md:bottom-4 md:left-4 md:right-4 z-50 mx-auto max-w-6xl rounded-2xl border border-black/10 bg-(--velo-claro) backdrop-blur-(--desenfoque) shadow-[0_8px_32px_rgba(0,0,0,0.10)]"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between px-5 md:px-8 py-4 md:py-5">
            <div>
              <p className="font-display text-xs uppercase tracking-[0.2em] mb-1">Cookies</p>
              {/* Texto casi negro y no el gris habitual: el fondo es translúcido, y sobre
                  una sección negra se vuelve gris medio. El gris de siempre daba ~2,7:1
                  de contraste ahí; así sale por encima de 6:1 sobre cualquier fondo. */}
              <p className="text-xs text-black/75 max-w-xl leading-relaxed">
                Usamos cookies propias para mejorar tu experiencia de navegación. Puedes aceptarlas
                o rechazarlas.{" "}
                <Link
                  to="/legal/cookies"
                  className="underline underline-offset-2 hover:text-black transition-colors"
                >
                  Política de cookies
                </Link>
                .
              </p>
            </div>
            <div className="flex gap-3 shrink-0">
              <button
                onClick={reject}
                className="cursor-pointer rounded-full px-5 py-2.5 text-[10px] uppercase tracking-widest border border-black/25 hover:border-black transition-colors"
              >
                Rechazar
              </button>
              <button
                onClick={accept}
                className="cursor-pointer rounded-full px-5 py-2.5 text-[10px] uppercase tracking-widest bg-black text-white hover:bg-black/80 transition-colors"
              >
                Aceptar todo
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
