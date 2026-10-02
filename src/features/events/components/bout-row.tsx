import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { MediaImage } from "@/components/media/media-image";
import { Flag } from "@/components/ui-gc/flag";
import { FighterSilhouette } from "@/features/fighters/components/fighter-silhouette";
import type { BoutDTO, BoutFighterDTO } from "../dto";
import { boutMeasure, fighterComparison, roundsLabel } from "../public-format";
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
      className={`relative h-[68px] w-[56px] shrink-0 overflow-hidden bg-gradient-to-b from-neutral-100 to-neutral-200 sm:h-[112px] sm:w-[92px] ${
        side === "red" ? "border-b-4 border-[#D7263D]" : "border-b-4 border-[#1E6FD9]"
      }`}
    >
      {fighter.headshotMedia ? (
        <MediaImage media={fighter.headshotMedia} sizes="(min-width: 640px) 92px, 56px" className="size-full object-cover" />
      ) : (
        <FighterSilhouette className="absolute -bottom-1 left-1/2 h-[112%] -translate-x-1/2 text-neutral-500" />
      )}
    </div>
  );
}

/**
 * Una esquina. Con resultado, la línea de arriba está siempre reservada (con «Victoria» solo en el ganador): así los dos
 * nombres quedan a la misma altura aunque uno lleve la etiqueta.
 */
function Corner({ fighter, side, won, hasResult, rankLabel }: { fighter: BoutFighterDTO; side: Side; won: boolean; hasResult: boolean; rankLabel?: string }) {
  const name = `${fighter.firstName} ${fighter.lastName}`;
  const reverse = side === "blue";

  return (
    <div data-corner={side} className={`flex min-w-0 items-start gap-3 sm:gap-[18px] ${reverse ? "flex-row-reverse text-right" : ""}`}>
      <Face fighter={fighter} side={side} />
      <div className="flex min-w-0 flex-col gap-0.5">
        {hasResult ? (
          <span className={`flex h-5 ${reverse ? "justify-end" : ""}`}>
            {won ? (
              <span data-result="win" className="inline-flex h-5 items-center bg-yellow px-2 font-cond text-[11px] font-extrabold uppercase tracking-[.12em] text-black">
                Victoria
              </span>
            ) : null}
          </span>
        ) : null}
        {/* Ranking de hoy en la división de la pelea: «C» (campeón) o «#1». */}
        <span data-slot="bout-rank" className="empty:hidden font-cond text-[13px] font-bold text-neutral-500 sm:text-sm">
          {rankLabel}
        </span>
        <h3 className="font-display text-[clamp(18px,5.4vw,34px)] uppercase leading-[1.02] break-words text-black">
          {fighter.isPublic ? (
            <Link href={`/peleadores/${fighter.slug}`} className="underline-offset-4 outline-none hover:underline focus-visible:underline focus-visible:decoration-yellow focus-visible:decoration-[3px]">
              {name}
            </Link>
          ) : (
            name
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

const VALUE_CLASS = "px-2 py-2.5 text-center font-display text-[clamp(18px,4.6vw,26px)] uppercase leading-none text-black";

/** Frente a frente de las dos esquinas: valores a los lados, el dato en el medio, todo en la misma fila. */
function Comparison({ bout }: { bout: BoutDTO }) {
  const rows = fighterComparison(bout.red, bout.blue);
  return (
    <table data-slot="bout-comparison" className="mx-auto my-4 w-full max-w-[760px] table-fixed border-collapse">
      <caption className="sr-only">
        Datos de {bout.red.lastName} y {bout.blue.lastName}
      </caption>
      <colgroup>
        <col className="w-[38%]" />
        <col />
        <col className="w-[38%]" />
      </colgroup>
      <thead>
        <tr>
          <th scope="col" className="border-b-4 border-[#D7263D] px-2 pb-2 font-cond text-[13px] font-extrabold uppercase tracking-[.1em] text-black">
            {bout.red.lastName}
          </th>
          <td className="border-b-4 border-neutral-200" />
          <th scope="col" className="border-b-4 border-[#1E6FD9] px-2 pb-2 font-cond text-[13px] font-extrabold uppercase tracking-[.1em] text-black">
            {bout.blue.lastName}
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.label} className="border-b border-neutral-200">
            <td className={VALUE_CLASS}>{row.red}</td>
            <th scope="row" className="px-1 text-center font-cond text-[11px] font-extrabold uppercase tracking-[.14em] text-neutral-500 sm:text-xs">
              {row.label}
            </th>
            <td className={VALUE_CLASS}>{row.blue}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** Una pelea de la cartelera: las dos esquinas, categoría, rounds y, si ya se peleó, quién ganó y cómo. Al tocarla se despliegan los datos de los dos. */
export function BoutRow({ bout, rankLabels }: { bout: BoutDTO; /** `C` o `#n` por id de peleador (ranking de hoy). */ rankLabels?: Record<string, string> }) {
  const measure = boutMeasure(bout);
  const { result } = bout;
  const winner = result && (result.outcome === "red_win" || result.outcome === "blue_win") ? WINNER_OF[result.outcome] : null;
  const cancelled = bout.status === "cancelled";
  const hasResult = Boolean(result);

  const summary = (
    <div className="grid grid-cols-2 items-start gap-x-4 gap-y-4 md:grid-cols-[1fr_auto_1fr] md:gap-x-5">
      <div className="md:col-start-1 md:row-start-1">
        <Corner fighter={bout.red} side="red" won={winner === "red"} hasResult={hasResult} rankLabel={rankLabels?.[bout.red.id]} />
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
        <Corner fighter={bout.blue} side="blue" won={winner === "blue"} hasResult={hasResult} rankLabel={rankLabels?.[bout.blue.id]} />
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
      details={<Comparison bout={bout} />}
    />
  );
}
