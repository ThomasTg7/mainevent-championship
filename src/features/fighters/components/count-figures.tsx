"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

export type CountFigure = { label: string; value: number; accent?: boolean };

type CountFiguresProps = {
  items: CountFigure[];
  className?: string;
  /** Tamaño de las cifras (la tarjeta usa las chicas; la ficha, las del hero). */
  valueClassName?: string;
};

const DURATION_MS = 900;

const easeOut = (progress: number) => 1 - (1 - progress) ** 3;

/**
 * Cifras con contador (V-D-E de la tarjeta, cifras del hero de la ficha). El HTML del servidor ya trae los
 * valores finales (legibles sin JavaScript ni animación); al entrar en pantalla cuenta desde 0 salvo que la
 * persona pida menos movimiento.
 */
export function CountFigures({ items, className, valueClassName = "text-[clamp(26px,5vw,36px)]" }: CountFiguresProps) {
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
  }, [reducedMotion, items]);

  return (
    <dl ref={rootRef} className={className}>
      {items.map((item) => (
        // El término va antes que el valor en el HTML (lectores de pantalla); `flex-col-reverse` pone la cifra arriba.
        <div key={item.label} className="flex flex-col-reverse border-border pt-3.5 text-center [&:not(:first-child)]:border-l">
          <dt className="mt-1 font-cond text-[11px] font-bold uppercase tracking-[.14em] text-muted-foreground">{item.label}</dt>
          <dd className={`font-display leading-none tabular-nums ${valueClassName} ${item.accent ? "text-yellow" : "text-white"}`}>
            <span data-count={item.value}>{item.value}</span>
          </dd>
        </div>
      ))}
    </dl>
  );
}
