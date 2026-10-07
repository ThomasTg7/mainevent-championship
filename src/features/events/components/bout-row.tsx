import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { MediaImage } from "@/components/media/media-image";
import { Flag } from "@/components/ui-gc/flag";
import { championWord } from "@/domain/rankings";
import { FighterName } from "@/features/fighters/components/fighter-name";
import { FighterSilhouette } from "@/features/fighters/components/fighter-silhouette";
import type { BoutDTO, BoutFighterDTO } from "../dto";
import { boutMeasure, roundsLabel } from "../public-format";
import { BoutComparison } from "./bout-comparison";
import { JudgesScorecards } from "./judges-scorecards";
import { BoutItem } from "./bout-accordion";

type Side = "red" | "blue";

const WINNER_OF: Record<"red_win" | "blue_win", Side> = { red_win: "red", blue_win: "blue" };

function record({ record: manual }: BoutFighterDTO): string {
  return `${manual.wins}-${manual.losses}-${manual.draws}`;
}

/** Foto de rostro (o silueta) con el color de la esquina; en celular es más chica. */
function Face({ fighter, side }: { fighter: BoutFighterDTO; side: Side }) {
  return (
    <div
      data-slot="bout-face"
      className={`relative h-[68px] w-[56px] shrink-0 overflow-hidden bg-gradient-to-b from-neutral-100 to-neutral-200 sm:h-[112px] sm:w-[92px] ${
        side === "red" ? "border-b-4 border-[#D7263D]" : "border-b-4 border-[#1E6FD9]"
      }`}
    >
      {fighter.headshotMedia ? (
        <MediaImage media={fighter.headshotMedia} sizes="(min-width: 640px) 92px, 56px" className="size-full object-cover" />
      ) : (
        <FighterSilhouette className="absolute -bottom-1 left-1/2 h-[112%] -translate-x-1/2 text-neutral-900" />
      )}
    </div>
  );
}

/** Una esquina: la foto (con «Victoria» debajo si ganó), el ranking, el nombre, el apodo y el récord. */
function Corner({
  fighter,
  side,
  won,
  rankLabel,
  gender,
}: {
  fighter: BoutFighterDTO;
  side: Side;
  won: boolean;
  /** `C` (campeón) o `#n`. */
  rankLabel?: string;
  /** Género de la división de la pelea («Campeón» o «Campeona»); las peleas sin división no llevan etiqueta. */
  gender: "male" | "female";
}) {
  const reverse = side === "blue";

  return (
    <div data-corner={side} className={`flex min-w-0 items-start gap-3 sm:gap-[18px] ${reverse ? "flex-row-reverse text-right" : ""}`}>
      <div className="flex shrink-0 flex-col items-stretch">
        <Face fighter={fighter} side={side} />
        {won ? (
          <span data-result="win" className="flex h-5 items-center justify-center bg-yellow font-cond text-[10px] font-extrabold uppercase tracking-[.1em] text-black sm:h-6 sm:text-[11px] sm:tracking-[.12em]">
            Victoria
          </span>
        ) : null}
      </div>
      <div className="flex min-w-0 flex-col gap-0.5">
        {/* Ranking de hoy en la división de la pelea: «Campeón»/«Campeona» o «#1». */}
        <span data-slot="bout-rank" className={`empty:hidden font-cond font-bold ${
            rankLabel === "C" ? `w-fit bg-black px-2 py-0.5 text-[11px] uppercase tracking-[.1em] text-yellow sm:text-xs ${reverse ? "self-end" : ""}` : "text-[13px] text-neutral-500 sm:text-sm"
          }`}>
          {rankLabel === "C" ? championWord(gender) : rankLabel}
        </span>
        <h3 className="font-display text-[clamp(18px,5.4vw,34px)] uppercase leading-[1.02] break-words text-black">
          {fighter.isPublic ? (
            <Link href={`/peleadores/${fighter.slug}`} className="underline-offset-4 outline-none hover:underline focus-visible:underline focus-visible:decoration-yellow focus-visible:decoration-[3px]">
              <FighterName firstName={fighter.firstName} lastName={fighter.lastName} />
            </Link>
          ) : (
            <FighterName firstName={fighter.firstName} lastName={fighter.lastName} />
          )}
        </h3>
        {fighter.nickname ? <p className="font-cond text-[13px] font-semibold tracking-[.06em] text-neutral-500">“{fighter.nickname}”</p> : null}
        <p className={`mt-0.5 flex items-center gap-2 font-cond text-sm font-semibold tracking-[.04em] text-neutral-600 sm:text-[15px] ${reverse ? "flex-row-reverse" : ""}`}>
          <Flag code={fighter.nationality} />
          <span>{record(fighter)}</span>
        </p>
      </div>
    </div>
  );
}

/** Una pelea de la cartelera: las dos esquinas, categoría, rounds y, si ya se peleó, quién ganó y cómo. Al tocarla se despliegan los datos de los dos. */
export function BoutRow({ bout, rankLabels }: { bout: BoutDTO; /** `C` (campeón) o `#n` por id de peleador (ranking de hoy). */ rankLabels?: Record<string, string> }) {
  const measure = boutMeasure(bout);
  const { result } = bout;
  const winner = result && (result.outcome === "red_win" || result.outcome === "blue_win") ? WINNER_OF[result.outcome] : null;
  const cancelled = bout.status === "cancelled";

  const summary = (
    <div className="grid grid-cols-2 items-start gap-x-4 gap-y-4 md:grid-cols-[1fr_auto_1fr] md:gap-x-5">
      <div className="md:col-start-1 md:row-start-1">
        <Corner fighter={bout.red} side="red" won={winner === "red"} rankLabel={rankLabels?.[bout.red.id]} gender={bout.division?.gender ?? "male"} />
      </div>
      <div className="order-last col-span-2 flex flex-col items-center gap-1 self-center text-center md:order-none md:col-span-1 md:col-start-2 md:row-start-1 md:min-w-[170px]">
        {measure ? <span className="font-cond text-xs font-extrabold uppercase tracking-[.12em] text-neutral-600">{measure}</span> : null}
        <span className="font-display text-[26px] leading-none text-black md:text-[34px]">VS</span>
        {bout.isTitleFight ? <span className="inline-flex items-center gap-1.5 bg-black px-2.5 py-1 font-cond text-[11px] font-extrabold uppercase tracking-[.1em] text-yellow">★ Pelea por el título</span> : null}
        <span className="font-cond text-xs font-semibold uppercase tracking-[.1em] text-neutral-500">
          {roundsLabel(bout)}
          {bout.level === "amateur" ? " · Amateur" : ""}
        </span>
        {cancelled ? (
          <span className="font-cond text-xs font-extrabold uppercase tracking-[.12em] text-[#D7263D]">Cancelada{bout.cancelReason ? ` · ${bout.cancelReason}` : ""}</span>
        ) : null}
        {result && !winner ? (
          <span data-result="none" className="bg-neutral-800 px-2 py-0.5 font-cond text-[11px] font-extrabold uppercase tracking-[.12em] text-white">
            {result.outcome === "draw" ? "Empate" : "Sin resultado"}
          </span>
        ) : null}
      </div>
      <div data-corner-wrap className="md:col-start-3 md:row-start-1">
        <Corner fighter={bout.blue} side="blue" won={winner === "blue"} rankLabel={rankLabels?.[bout.blue.id]} gender={bout.division?.gender ?? "male"} />
      </div>
      {result ? (
        <p className="order-last col-span-2 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-center font-cond text-[15px] font-bold uppercase tracking-[.05em] text-black md:order-none md:col-span-3" data-result-line>
          <span>{result.line}</span>
          {result.videoUrl ? (
            <a href={result.videoUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 border-b-2 border-yellow text-[13px] hover:text-neutral-600">
              Ver la pelea <ExternalLink aria-hidden className="size-3.5" />
            </a>
          ) : null}
        </p>
      ) : null}
    </div>
  );

  return (
    <BoutItem
      boutId={bout.id}
      label={`${bout.red.lastName} vs ${bout.blue.lastName}`}
      className={`border-b border-neutral-200 py-6 md:py-7 ${cancelled ? "opacity-60" : ""}`}
      summary={summary}
      details={
        <>
          <BoutComparison bout={bout} />
          {result?.scorecards?.length ? <JudgesScorecards scorecards={result.scorecards} redName={bout.red.lastName} blueName={bout.blue.lastName} /> : null}
        </>
      }
    />
  );
}
