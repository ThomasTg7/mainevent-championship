"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

const SPEED = 0.1;

/** Desplaza su contenido un poco más lento que el scroll. Solo `transform` y solo mientras es visible; sin movimiento si la persona lo pidió. */
export function HeroParallax({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const element = ref.current;
    if (!element || reducedMotion) return;

    let frame = 0;
    let visible = false;
    const update = () => {
      frame = 0;
      element.style.transform = `translate3d(0, ${Math.round(window.scrollY * SPEED)}px, 0)`;
    };
    const onScroll = () => {
      if (visible && frame === 0) frame = requestAnimationFrame(update);
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = Boolean(entry?.isIntersecting);
    });
    observer.observe(element.parentElement ?? element);
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      observer.disconnect();
      cancelAnimationFrame(frame);
      element.style.transform = "";
    };
  }, [reducedMotion]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
