import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { Logo } from "@/components/Logo";
import { CookieBanner } from "@/components/CookieBanner";
import { CartProvider } from "@/lib/cart";
import { CartSheet } from "@/components/CartSheet";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-6 text-black">
      <div className="mb-10">
        <Logo className="h-12 md:h-16" />
      </div>
      <h1 className="font-display text-7xl md:text-9xl tracking-tight">404</h1>
      <p className="mt-4 text-xs uppercase tracking-[0.35em] text-muted-foreground">
        Esta órbita no existe
      </p>
      <p className="mt-2 text-sm text-muted-foreground max-w-sm text-center">
        La página que buscas se ha perdido en el espacio. Vuelve al inicio y elige una experiencia.
      </p>
      <Link
        to="/"
        className="mt-10 inline-block rounded-full border border-black bg-black text-white px-8 py-4 font-display text-[11px] uppercase tracking-[0.25em] hover:bg-white hover:text-black transition-colors"
      >
        Volver al inicio
      </Link>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();

  // En un efecto, no en el cuerpo del componente: ahí se ejecutaba en cada
  // render y se duplicaba con las comprobaciones de desarrollo de React.
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4 text-black">
      <div className="max-w-md text-center">
        <h1 className="font-display text-3xl">Algo ha fallado</h1>
        <p className="mt-2 text-sm text-muted-foreground">Inténtalo de nuevo en unos segundos.</p>
        <button
          onClick={() => {
            router.invalidate();
            reset();
          }}
          className="mt-6 border border-black bg-black text-white px-6 py-3 text-xs uppercase tracking-widest hover:bg-white hover:text-black transition-colors"
        >
          Reintentar
        </button>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { name: "theme-color", content: "#ffffff" },
    { title: "ECLIPSSE™ UNIVERSE | Por y para jóvenes" },
{
  name: "description",
  content:
    "Marca de ropa y personalización por y para jóvenes. De Sevilla al mundo.",
},
{ name: "robots", content: "index, follow" },
{ property: "og:site_name", content: "ECLIPSSE™ UNIVERSE" },
{ property: "og:type", content: "website" },
{ property: "og:title", content: "ECLIPSSE™ UNIVERSE | Por y para jóvenes" },
{
  property: "og:description",
  content:
    "Marca de ropa y personalización por y para jóvenes. De Sevilla al mundo.",
},
{ property: "og:url", content: "https://www.eclipssebrand.es/" },
{ name: "twitter:card", content: "summary_large_image" },
{ name: "twitter:title", content: "ECLIPSSE™ UNIVERSE | Por y para jóvenes" },
{
  name: "twitter:description",
  content:
    "Marca de ropa y personalización por y para jóvenes. De Sevilla al mundo.",
},
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", type: "image/png", href: "/images/favicon.png" },
      { rel: "apple-touch-icon", href: "/images/favicon.png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=League+Spartan:wght@600;700;800;900&display=swap",
      },
    ],
    scripts: [
      {
        type: "application/ld+json",
      children: JSON.stringify({
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "ECLIPSSE™ UNIVERSE",
  alternateName: "ECLIPSSEBRAND",
  slogan: "Por y para Jóvenes",
  description:
    "Marca de ropa y personalización por y para jóvenes. De Sevilla al mundo.",
  url: "https://www.eclipssebrand.es/",
  sameAs: ["https://www.instagram.com/eclipssebrand/"],
  address: {
    "@type": "PostalAddress",
    addressLocality: "Sevilla",
    addressCountry: "ES",
  },
}),
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <CartProvider>
        <Outlet />
        <CartSheet />
        <CookieBanner />
      </CartProvider>
    </QueryClientProvider>
  );
}
