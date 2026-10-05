"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

const SEEN_KEY = "gc-intro-seen";
const SHOW_MS = 1100;
const LEAVE_MS = 600;

type Phase = "idle" | "showing" | "leaving" | "done";

/** Quién ya vio la presentación en esta sesión. El almacenamiento puede estar bloqueado: entonces no se muestra (nunca falla). */
function markSeen(): boolean {
  try {
    if (window.sessionStorage.getItem(SEEN_KEY)) return false;
    window.sessionStorage.setItem(SEEN_KEY, "1");
    return true;
  } catch {
    return false;
  }
}

/**
 * Presentación de la home (el «GC» sube y una barra amarilla se llena) solo en la primera visita de la sesión y nunca con
 * «reducir movimiento». Aparece después de hidratar: el contenido y la imagen principal ya están pintados debajo, así que no
 * retrasa nada ni esconde información. No intercepta clics y los lectores de pantalla la ignoran.
 */
export function IntroLoader() {
  const reducedMotion = useReducedMotion();
  const [phase, setPhase] = useState<Phase>("idle");
  // En desarrollo React monta el efecto dos veces: la decisión se toma una sola vez y se recuerda.
  const shouldShow = useRef<boolean | null>(null);

  useEffect(() => {
    if (reducedMotion) return;
    shouldShow.current ??= markSeen();
    if (!shouldShow.current) return;
    const start = setTimeout(() => setPhase("showing"), 0);
    const leave = setTimeout(() => setPhase("leaving"), SHOW_MS);
    const finish = setTimeout(() => setPhase("done"), SHOW_MS + LEAVE_MS);
    return () => {
      clearTimeout(start);
      clearTimeout(leave);
      clearTimeout(finish);
    };
  }, [reducedMotion]);

  if (phase === "idle" || phase === "done") return null;

  return (
    <div
      data-slot="intro-loader"
      aria-hidden="true"
      className={`pointer-events-none fixed inset-0 z-[1000] grid place-items-center bg-black transition-[clip-path] duration-[600ms] ease-gc ${phase === "leaving" ? "[clip-path:inset(0_0_100%_0)]" : "[clip-path:inset(0)]"}`}
    >
      <div className="flex overflow-hidden font-display text-[clamp(90px,18vw,220px)] leading-none">
        <span className="inline-block animate-[intro-letter_.7s_cubic-bezier(.2,.8,.2,1)_both] text-white">G</span>
        <span className="inline-block animate-[intro-letter_.7s_cubic-bezier(.2,.8,.2,1)_.1s_both] text-yellow">C</span>
      </div>
      <div className="absolute bottom-0 left-0 h-1.5 w-full origin-left animate-[intro-bar_.9s_ease-in-out_.2s_both] bg-yellow" />
    </div>
  );
}
