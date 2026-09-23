export function Marquee({ text }: { text: string }) {
  const items = Array.from({ length: 14 }, (_, i) => i);
  return (
    <div
      className="overflow-hidden bg-black text-white py-2.5"
      role="presentation"
      aria-hidden="true"
    >
      <div className="flex marquee-track whitespace-nowrap">
        {[0, 1].map((group) => (
          <div key={group} className="flex shrink-0">
            {items.map((i) => (
              <span
                key={i}
                className="font-display text-[13px] md:text-sm tracking-[0.18em] px-8 uppercase"
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
