import { Link } from "@tanstack/react-router";
import { INSTAGRAM_URL, TIKTOK_URL, WHATSAPP_URL } from "@/data/contacto";
import { InstagramIcon, TikTokIcon, WhatsAppIcon } from "./SocialIcons";

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

const redes = [
  { href: INSTAGRAM_URL, label: "Instagram", Icono: InstagramIcon },
  { href: WHATSAPP_URL, label: "WhatsApp", Icono: WhatsAppIcon },
  { href: TIKTOK_URL, label: "TikTok", Icono: TikTokIcon },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-black/10 bg-surface">
      <div className="mx-auto max-w-7xl px-5 md:px-8 py-5 flex flex-col items-center gap-3 md:flex-row md:justify-between">
        <div className="flex items-center gap-2">
          {redes.map(({ href, label, Icono }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={label}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-black/70 text-black hover:bg-black hover:text-white hover:-translate-y-px"
            >
              <Icono size={15} />
            </a>
          ))}
        </div>
        <nav
          aria-label="Enlaces legales"
          className="flex flex-wrap justify-center gap-x-4"
        >
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="py-2 text-[10px] uppercase tracking-[0.15em] text-black/70 hover:text-black transition-colors"
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <span className="text-[10px] tracking-[0.1em] text-black/65">
          © ECLIPSSE™ universe {new Date().getFullYear()} · Sevilla
        </span>
      </div>
    </footer>
  );
}
