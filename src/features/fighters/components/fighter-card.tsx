import Link from "next/link";
import { MediaImage } from "@/components/media/media-image";
import { Flag } from "@/components/ui-gc/flag";
import { formatWeight } from "@/domain/units";
import type { FighterCardDTO } from "../dto";
import { FighterSilhouette } from "./fighter-silhouette";
import { RecordCounters } from "./record-counters";

export const FIGHTER_CARD_SIZES = "(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw";

type FighterCardProps = {
  fighter: FighterCardDTO;
  /** Solo la foto de la primera fila (la que aparece sin hacer scroll) se pide con prioridad. */
  priority?: boolean;
  /** Etiqueta sobre la foto ("Campeón", "#3"): la entregan los rankings (Plan 05). */
  badge?: string;
};

function divisionLabel(division: FighterCardDTO["division"]): string {
  return `Peso ${division.name}${division.gender === "female" ? " fem." : ""} · ${formatWeight(division.limitKg)}`;
}

/** Tarjeta del listado (estilo `.fcard` de la maqueta). Toda la tarjeta es un solo enlace a la ficha. */
export function FighterCard({ fighter, priority = false, badge }: FighterCardProps) {
  const name = `${fighter.firstName} ${fighter.lastName}`;

  return (
    <article className="group relative flex h-full flex-col overflow-hidden border border-border bg-[linear-gradient(170deg,#1c1c1c,#0a0a0a_70%)] transition-colors duration-300 focus-within:border-yellow focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-yellow hover:border-yellow">
      <div className="relative h-[clamp(210px,36vw,340px)] overflow-hidden sm:h-[clamp(240px,26vw,340px)]">
        {fighter.bodyMedia ? (
          <MediaImage
            media={fighter.bodyMedia}
            sizes={FIGHTER_CARD_SIZES}
            priority={priority}
            className="absolute inset-0 size-full object-contain transition-transform duration-700 ease-gc motion-safe:group-hover:scale-105"
          />
        ) : (
          <FighterSilhouette className="absolute bottom-[-4%] left-1/2 h-[108%] -translate-x-1/2 text-yellow transition-transform duration-700 ease-gc motion-safe:group-hover:scale-105" />
        )}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#0c0c0c] to-transparent" />
        {badge ? (
          <span className="absolute left-3 top-3 z-10 bg-yellow px-2 py-1 font-cond text-[11px] font-extrabold uppercase tracking-[.12em] text-black">
            {badge}
          </span>
        ) : null}
      </div>

      <div className="relative -mt-8 flex flex-1 flex-col px-4 pb-4 sm:px-6 sm:pb-6">
        {fighter.nickname ? (
          <p className="font-cond text-[13px] font-bold tracking-[.1em] text-yellow sm:text-sm">“{fighter.nickname}”</p>
        ) : null}
        <h2 className="my-1 font-display text-[clamp(24px,5vw,36px)] uppercase leading-[.95] text-white">
          <Link href={`/peleadores/${fighter.slug}`} className="outline-none after:absolute after:inset-0">
            {name}
          </Link>
        </h2>
        <p className="flex items-start gap-2 font-cond text-[12px] font-semibold uppercase tracking-[.08em] text-muted-foreground sm:text-[13px]">
          <Flag code={fighter.nationality} className="mt-px shrink-0" />
          <span>{divisionLabel(fighter.division)}</span>
        </p>
        <div className="mt-auto pt-4">
          <RecordCounters wins={fighter.record.wins} losses={fighter.record.losses} draws={fighter.record.draws} className="grid grid-cols-3 border-t border-border" />
        </div>
      </div>
    </article>
  );
}
