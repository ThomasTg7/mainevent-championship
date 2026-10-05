import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type SectionHeadingTone = "dark" | "light";

type SectionHeadingProps = {
  kicker: string;
  title: ReactNode;
  action?: ReactNode;
  tone?: SectionHeadingTone;
  /** `id` del `h2`, para el `aria-labelledby` de la sección. */
  titleId?: string;
  /** Entra con `ScrollReveal` (`data-reveal`). */
  reveal?: boolean;
  className?: string;
};

/** Rótulo amarillo con raya + título grande de sección (maqueta) y, a la derecha, una acción opcional. */
export function SectionHeading({ kicker, title, action, tone = "dark", titleId, reveal = false, className }: SectionHeadingProps) {
  const isLight = tone === "light";

  return (
    <div data-reveal={reveal || undefined} className={cn("flex flex-wrap items-end justify-between gap-5 mb-11", className)}>
      <div>
        <div
          className={cn(
            "flex items-center gap-2.5 mb-3.5 font-cond font-extrabold uppercase tracking-[.2em] text-[13px] before:block before:h-[3px] before:w-7 before:bg-yellow",
            isLight ? "text-black" : "text-yellow",
          )}
        >
          {kicker}
        </div>
        <h2
          id={titleId}
          className={cn(
            "font-display uppercase leading-[.9] text-[clamp(40px,6vw,78px)]",
            isLight ? "text-black" : "text-white",
          )}
        >
          {title}
        </h2>
      </div>
      {action}
    </div>
  );
}
