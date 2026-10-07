import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import type { ReactNode } from "react";

export function LegalLayout({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-black">
      <SiteHeader current="brand" />
      <article className="mx-auto max-w-3xl px-5 md:px-8 py-16 md:py-24">
        <button
          onClick={() => window.history.back()}
          className="cursor-pointer text-[11px] uppercase tracking-[0.25em] hover:underline"
        >
          ← Volver
        </button>
        <h1 className="font-display text-4xl md:text-6xl mt-6 mb-10 leading-tight">{title}</h1>
        <div className="space-y-5 text-sm md:text-base text-muted-foreground leading-relaxed [&_h2]:font-display [&_h2]:text-black [&_h2]:text-xl [&_h2]:md:text-2xl [&_h2]:pt-6 [&_h2]:pb-1 [&_strong]:text-black [&_a]:underline">
          {children}
        </div>
      </article>
      <SiteFooter />
    </div>
  );
}
