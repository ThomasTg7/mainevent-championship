"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

type RecordCountersProps = {
  wins: number;
  losses: number;
  draws: number;
  className?: string;
};

const DURATION_MS = 900;

const easeOut = (progress: number) => 1 - (1 - progress) ** 3;

/**
 * V-D-E con contador. El HTML del servidor ya trae los valores finales (legibles sin JavaScript ni animación);
 * al entrar en pantalla cuenta desde 0 salvo que la persona pida menos movimiento.
 */
export function RecordCounters({ wins, losses, draws, className }: RecordCountersProps) {
  const rootRef = useRef<HTMLDListElement>(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const root = rootRef.current;
    if (!root || reducedMotion) return;

    const numbers = [...root.querySelectorAll<HTMLElement>("[data-count]")];
    let frame = 0;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        observer.disconnect();
        const start = performance.now();
        const tick = (now: number) => {
          const progress = Math.min((now - start) / DURATION_MS, 1);
          for (const element of numbers) element.textContent = String(Math.round(Number(element.dataset.count) * easeOut(progress)));
          if (progress < 1) frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
      },
      { threshold: 0.6 },
    );
    observer.observe(root);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      // Si se cancela a mitad de camino, vuelven los valores reales.
      for (const element of numbers) element.textContent = element.dataset.count ?? "";
    };
  }, [reducedMotion, wins, losses, draws]);

  const items = [
    { label: "Vict.", value: wins, accent: true },
    { label: "Derr.", value: losses, accent: false },
    { label: "Emp.", value: draws, accent: false },
  ];

  return (
    <dl ref={rootRef} className={className}>
      {items.map((item) => (
        <div key={item.label} className="border-border pt-3.5 text-center [&:not(:first-child)]:border-l">
          <dd className={`font-display text-[clamp(26px,5vw,36px)] leading-none tabular-nums ${item.accent ? "text-yellow" : "text-white"}`}>
            <span data-count={item.value}>{item.value}</span>
          </dd>
          <dt className="mt-1 font-cond text-[11px] font-bold uppercase tracking-[.14em] text-muted-foreground">{item.label}</dt>
        </div>
      ))}
    </dl>
  );
}
