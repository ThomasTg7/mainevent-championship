import type { CSSProperties } from "react";
import { cn } from "@/lib/cn";

/** Fixed spark layout (no randomness: server and client render the same markup). */
const EMBERS = Array.from({ length: 18 }, (_, index) => ({
  left: `${(index * 37 + 7) % 100}%`,
  size: `${2 + (index % 3)}px`,
  duration: `${8 + (index % 5) * 1.6}s`,
  delay: `${-((index * 1.7) % 11)}s`,
  sway: `${index % 2 === 0 ? "" : "-"}${20 + (index % 4) * 14}px`,
}));

/**
 * Decorative poster stage of Mainevent Championship: drifting gold dust, rising embers and a light sweep. Purely visual
 * (`aria-hidden`), animates only transform/opacity and stands still with «reduce motion».
 */
export function PosterStage({ className, embers = true, sweep = true }: { className?: string; embers?: boolean; sweep?: boolean }) {
  return (
    <div aria-hidden className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}>
      <div className="mec-gold-dust" />
      {embers
        ? EMBERS.map((ember, index) => (
            <span
              key={index}
              className="mec-ember"
              style={{ left: ember.left, "--size": ember.size, "--duration": ember.duration, "--delay": ember.delay, "--sway": ember.sway } as CSSProperties}
            />
          ))
        : null}
      {sweep ? <div className="mec-light-sweep" /> : null}
    </div>
  );
}

/** The logo's three stars, twinkling. */
export function PosterStars({ className }: { className?: string }) {
  const star = "M0 -14L3.5 -4.9L13.3 -4.3L5.7 1.9L8.2 11.3L0 6L-8.2 11.3L-5.7 1.9L-13.3 -4.3L-3.5 -4.9Z";
  return (
    <svg aria-hidden focusable="false" viewBox="-120 -20 240 60" className={cn("pointer-events-none", className)}>
      <path className="mec-star" d={star} transform="translate(-90 16) scale(.8)" fill="var(--color-brand)" />
      <path className="mec-star" d={star} transform="translate(0 0)" fill="var(--color-brand)" />
      <path className="mec-star" d={star} transform="translate(90 16) scale(.8)" fill="var(--color-brand)" />
    </svg>
  );
}
