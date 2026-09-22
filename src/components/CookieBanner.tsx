import { useState, useEffect } from "react";
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
          className="fixed bottom-0 left-0 right-0 z-50 border-t border-black/10 bg-white shadow-[0_-4px_24px_rgba(0,0,0,0.06)]"
        >
          <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between px-5 md:px-8 py-4 md:py-5">
            <div>
              <p className="font-display text-xs uppercase tracking-[0.2em] mb-1">Cookies</p>
              <p className="text-xs text-muted-foreground max-w-xl leading-relaxed">
                Usamos cookies propias para mejorar tu experiencia de navegación. Puedes aceptarlas o rechazarlas.{" "}
                <a href="/legal/cookies" className="underline underline-offset-2 hover:text-black transition-colors">
                  Política de cookies
                </a>
                .
              </p>
            </div>
            <div className="flex gap-3 shrink-0">
              <button
                onClick={reject}
                className="cursor-pointer px-5 py-2.5 text-[10px] uppercase tracking-widest border border-black/25 hover:border-black transition-colors"
              >
                Rechazar
              </button>
              <button
                onClick={accept}
                className="cursor-pointer px-5 py-2.5 text-[10px] uppercase tracking-widest bg-black text-white hover:bg-black/80 transition-colors"
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
