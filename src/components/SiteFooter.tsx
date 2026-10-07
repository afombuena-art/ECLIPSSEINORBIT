import { Link } from "@tanstack/react-router";

const links: {
  to:
    | "/legal/aviso-legal"
    | "/legal/privacidad"
    | "/legal/cookies"
    | "/legal/terminos"
    | "/legal/devoluciones";
  label: string;
}[] = [
  { to: "/legal/aviso-legal", label: "Aviso legal" },
  { to: "/legal/privacidad", label: "Privacidad" },
  { to: "/legal/cookies", label: "Cookies" },
  { to: "/legal/terminos", label: "Términos" },
  { to: "/legal/devoluciones", label: "Envíos y devoluciones" },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-black/10 bg-surface">
      <div className="mx-auto max-w-7xl px-5 md:px-8 py-10 flex flex-col gap-6">
        <nav
          aria-label="Enlaces legales"
          className="flex flex-wrap justify-center md:justify-start gap-x-5 gap-y-2"
        >
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="text-[11px] uppercase tracking-[0.2em] text-black/70 hover:text-black transition-colors"
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex flex-col md:flex-row justify-between gap-3 text-[10px] uppercase tracking-[0.3em] text-black/65">
          <span>© ECLIPSSE™ UNIVERSE {new Date().getFullYear()}</span>
          <span>Sevilla, España · Por y para jóvenes</span>
        </div>
      </div>
    </footer>
  );
}
