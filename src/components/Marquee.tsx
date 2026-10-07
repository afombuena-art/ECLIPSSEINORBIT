export function Marquee({ text }: { text: string }) {
  const items = Array.from({ length: 14 }, (_, i) => i);
  return (
    <div
      className="overflow-hidden border-b border-black/10 text-black/55 py-1.5"
      role="presentation"
      aria-hidden="true"
    >
      <div className="flex marquee-track whitespace-nowrap" style={{ animationDuration: "70s" }}>
        {[0, 1].map((group) => (
          <div key={group} className="flex shrink-0">
            {items.map((i) => (
              <span
                key={i}
                className="font-display text-[10px] md:text-[11px] tracking-[0.3em] px-8 uppercase"
              >
                {text}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
