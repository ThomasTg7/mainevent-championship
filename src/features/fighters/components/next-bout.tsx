import Link from "next/link";
import type { FightHistoryRow, NextBoutDTO } from "@/features/events/dto";
import { boutMeasure, roundsLabel } from "@/features/events/public-format";
import { formatClock } from "@/domain/clock";
import { formatDate, formatShortDate, formatTime } from "@/lib/format-date";

type NextBoutProps = { nextBout: NextBoutDTO | null; lastFight: FightHistoryRow | null };

const RESULT_TEXT = { win: "Victoria", loss: "Derrota", draw: "Empate", no_contest: "Sin resultado" } as const;

function OpponentName({ opponent }: { opponent: { slug: string; firstName: string; lastName: string; isPublic: boolean } }) {
  const name = `${opponent.firstName} ${opponent.lastName}`;
  return opponent.isPublic ? (
    <Link href={`/peleadores/${opponent.slug}`} className="underline-offset-4 hover:underline focus-visible:underline">
      {name}
    </Link>
  ) : (
    <>{name}</>
  );
}

/**
 * Bajo el hero: la próxima pelea del peleador (rival, evento, fecha) o, si no tiene una programada, la última que peleó
 * (spec §3). Sin ninguna de las dos no se muestra nada.
 */
export function NextBout({ nextBout, lastFight }: NextBoutProps) {
  if (!nextBout && !lastFight) return null;

  return (
    <section aria-labelledby="fighter-next-bout-heading" data-slot="fighter-next-bout" className="border-y border-border bg-[#0f0f0f]">
      <div className="mx-auto flex w-full max-w-[1320px] flex-col gap-2 px-[clamp(16px,4vw,64px)] py-6 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
        {nextBout ? (
          <>
            <div>
              <h2 id="fighter-next-bout-heading" className="font-cond text-[13px] font-extrabold uppercase tracking-[.2em] text-yellow">
                Próxima pelea
              </h2>
              <p className="mt-1 font-display text-[clamp(24px,4vw,40px)] uppercase leading-none text-white">
                vs <OpponentName opponent={nextBout.opponent} />
              </p>
              <p className="mt-2 font-cond text-sm font-semibold uppercase tracking-[.08em] text-muted-foreground">
                {[nextBout.isTitleFight ? "★ Por el título" : "", boutMeasure({ catchweightKg: nextBout.catchweightKg, division: nextBout.divisionName && nextBout.divisionGender ? { name: nextBout.divisionName, gender: nextBout.divisionGender } : null }), roundsLabel(nextBout)]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </div>
            <p className="font-cond text-base font-bold uppercase tracking-[.08em] text-white sm:text-right">
              <Link href={`/eventos/${nextBout.event.slug}`} className="underline-offset-4 hover:underline focus-visible:underline">
                {nextBout.event.name}
              </Link>
              <span className="block text-sm font-semibold text-muted-foreground">
                {formatShortDate(new Date(nextBout.event.startsAt))} · {formatTime(new Date(nextBout.event.startsAt))} hrs · {nextBout.event.venueCity}
              </span>
            </p>
          </>
        ) : lastFight ? (
          <>
            <div>
              <h2 id="fighter-next-bout-heading" className="font-cond text-[13px] font-extrabold uppercase tracking-[.2em] text-yellow">
                Última pelea
              </h2>
              <p className="mt-1 font-display text-[clamp(24px,4vw,40px)] uppercase leading-none text-white">
                vs <OpponentName opponent={lastFight.opponent} />
              </p>
              <p className="mt-2 font-cond text-sm font-semibold uppercase tracking-[.08em] text-muted-foreground">
                {RESULT_TEXT[lastFight.fighterResult]} · {lastFight.methodText} · R{lastFight.endRound} {formatClock(lastFight.endTimeSeconds)}
              </p>
            </div>
            <p className="font-cond text-base font-bold uppercase tracking-[.08em] text-white sm:text-right">
              <Link href={`/eventos/${lastFight.eventSlug}`} className="underline-offset-4 hover:underline focus-visible:underline">
                {lastFight.eventName}
              </Link>
              <span className="block text-sm font-semibold text-muted-foreground">{formatDate(new Date(lastFight.date))}</span>
            </p>
          </>
        ) : null}
      </div>
    </section>
  );
}
