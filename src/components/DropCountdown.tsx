import { useState, useEffect } from "react";
import { motion } from "framer-motion";

const TARGET = new Date("2026-09-01T00:00:00");

function getTimeLeft() {
  const diff = TARGET.getTime() - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000),
  };
}

function Digit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center gap-2 md:gap-3">
      <span
        className="font-display text-5xl md:text-7xl lg:text-8xl tabular-nums leading-none tracking-tight"
        suppressHydrationWarning
      >
        {String(value).padStart(2, "0")}
      </span>
      <span className="text-[9px] md:text-[10px] uppercase tracking-[0.35em] text-muted-foreground">
        {label}
      </span>
    </div>
  );
}

export function DropCountdown() {
  const [mounted, setMounted] = useState(false);
  const [time, setTime] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    setMounted(true);
    setTime(getTimeLeft());
    const id = setInterval(() => setTime(getTimeLeft()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="border-t border-border bg-white text-black">
      <motion.div
        className="mx-auto max-w-4xl px-5 md:px-8 py-20 md:py-32 text-center"
        initial={{ opacity: 0, y: 28 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
      >
        <p className="text-[9px] uppercase tracking-[0.45em] text-muted-foreground mb-10">
          En órbita...
        </p>

        <div
          className="flex justify-center gap-4 sm:gap-6 md:gap-14"
          style={{ opacity: mounted ? 1 : 0, transition: "opacity 0.3s" }}
        >
          <Digit value={time.days} label="días" />
          <span
            className="font-display text-4xl md:text-6xl text-black/20 self-start mt-1"
            aria-hidden="true"
          >
            :
          </span>
          <Digit value={time.hours} label="horas" />
          <span
            className="font-display text-4xl md:text-6xl text-black/20 self-start mt-1"
            aria-hidden="true"
          >
            :
          </span>
          <Digit value={time.minutes} label="min" />
          <span
            className="font-display text-4xl md:text-6xl text-black/20 self-start mt-1"
            aria-hidden="true"
          >
            :
          </span>
          <Digit value={time.seconds} label="seg" />
        </div>

        <p className="mt-12 text-sm md:text-base text-muted-foreground leading-relaxed max-w-sm mx-auto">
          El tiempo que queda para el fin del verano.
        </p>
      </motion.div>
    </section>
  );
}
