"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type Lenis from "lenis";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

type GsapInstance = typeof import("gsap").gsap;

const LenisContext = createContext<Lenis | null>(null);

export function useLenis(): Lenis | null {
  return useContext(LenisContext);
}

export function SmoothScroll({ children }: { children: ReactNode }) {
  const reducedMotion = useReducedMotion();
  const [lenis, setLenis] = useState<Lenis | null>(null);

  useEffect(() => {
    if (reducedMotion) {
      return;
    }

    let cancelled = false;
    let instance: Lenis | undefined;
    let tick: ((time: number) => void) | undefined;
    let gsapInstance: GsapInstance | undefined;

    // Lenis y GSAP se cargan de forma diferida: solo el visitante que
    // permite animación paga el costo de este bundle.
    (async () => {
      const [{ default: LenisConstructor }, { gsap }, { ScrollTrigger }] = await Promise.all([
        import("lenis"),
        import("gsap"),
        import("gsap/ScrollTrigger"),
      ]);

      if (cancelled) {
        return;
      }

      gsapInstance = gsap;
      gsap.registerPlugin(ScrollTrigger);
      instance = new LenisConstructor();
      instance.on("scroll", ScrollTrigger.update);

      tick = (time: number) => instance?.raf(time * 1000);
      gsap.ticker.add(tick);
      gsap.ticker.lagSmoothing(0);

      setLenis(instance);
    })();

    return () => {
      cancelled = true;
      if (tick && gsapInstance) {
        gsapInstance.ticker.remove(tick);
      }
      instance?.destroy();
      setLenis(null);
    };
  }, [reducedMotion]);

  return <LenisContext.Provider value={lenis}>{children}</LenisContext.Provider>;
}
