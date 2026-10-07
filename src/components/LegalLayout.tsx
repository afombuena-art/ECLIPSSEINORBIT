import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import type { ReactNode } from "react";

export function LegalLayout({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-black">
      <SiteHeader current="brand" />
      <article className="mx-auto max-w-2xl px-5 md:px-8 py-10 md:py-14">
        <button
          onClick={() => window.history.back()}
          className="cursor-pointer py-2.5 text-[10px] uppercase tracking-[0.2em] hover:underline"
        >
          ← Volver
        </button>
        <h1 className="font-display text-xl md:text-2xl mt-4 mb-6 leading-tight">{title}</h1>
        <div className="space-y-3 text-xs text-muted-foreground leading-relaxed [&_h2]:font-display [&_h2]:text-black [&_h2]:text-sm [&_h2]:pt-4 [&_h2]:pb-0.5 [&_strong]:text-black [&_a]:underline">
          {children}
        </div>
      </article>
      <SiteFooter />
    </div>
  );
}
