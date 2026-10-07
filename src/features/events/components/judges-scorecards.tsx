import { ChevronDown } from "lucide-react";
import type { Scorecard } from "@/domain/bout-result";

type JudgesScorecardsProps = { scorecards: Scorecard[]; redName: string; blueName: string };

const SCORE_CLASS = "px-2 py-2.5 text-center font-display text-[clamp(20px,5vw,28px)] leading-none tabular-nums";

/**
 * «Ver tarjetas de los jueces», al final de los datos de una pelea: el total de cada juez con la esquina roja a la
 * izquierda y la azul a la derecha (como el frente a frente) y, si se anotó round por round, cada round debajo. Es un
 * `<details>` nativo: abre sin JavaScript y con teclado.
 */
export function JudgesScorecards({ scorecards, redName, blueName }: JudgesScorecardsProps) {
  return (
    <details data-slot="judges-scorecards" className="group mx-auto mb-2 w-full max-w-[760px] border-t border-neutral-200">
      <summary className="mx-auto flex min-h-11 w-fit cursor-pointer list-none items-center gap-2 px-4 font-cond text-xs font-extrabold uppercase tracking-[.14em] text-neutral-600 hover:text-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black [&::-webkit-details-marker]:hidden">
        Ver tarjetas de los jueces
        <ChevronDown aria-hidden className="size-4 transition-transform duration-300 group-open:rotate-180 motion-reduce:transition-none" />
      </summary>
      <table className="w-full table-fixed border-collapse">
        <caption className="sr-only">
          Tarjetas de los jueces: {redName} y {blueName}
        </caption>
        <colgroup>
          <col className="w-[30%]" />
          <col />
          <col className="w-[30%]" />
        </colgroup>
        <thead>
          <tr>
            <th scope="col" className="border-b-4 border-[#D7263D] px-2 pb-2 font-cond text-[13px] font-extrabold uppercase tracking-[.1em] text-black">
              {redName}
            </th>
            <th scope="col" className="border-b-4 border-neutral-200 px-1 pb-2 font-cond text-[11px] font-extrabold uppercase tracking-[.14em] text-neutral-500">
              Juez
            </th>
            <th scope="col" className="border-b-4 border-[#1E6FD9] px-2 pb-2 font-cond text-[13px] font-extrabold uppercase tracking-[.1em] text-black">
              {blueName}
            </th>
          </tr>
        </thead>
        {scorecards.map((card, position) => (
          <tbody key={position} className="border-b border-neutral-200">
            <tr>
              <td className={`${SCORE_CLASS} ${card.red > card.blue ? "text-black" : "text-neutral-500"}`}>{card.red}</td>
              <th scope="row" className="px-1 text-center font-cond text-sm font-bold uppercase tracking-[.06em] text-neutral-700">
                {card.judge}
              </th>
              <td className={`${SCORE_CLASS} ${card.blue > card.red ? "text-black" : "text-neutral-500"}`}>{card.blue}</td>
            </tr>
            {card.rounds?.length ? (
              <tr>
                <td colSpan={3} className="pb-3 text-center">
                  <ol aria-label={`Rounds de ${card.judge}`} className="inline-flex flex-wrap justify-center gap-1.5">
                    {card.rounds.map((round, index) => (
                      <li key={index} className="bg-neutral-100 px-2 py-0.5 font-cond text-xs font-bold tabular-nums tracking-[.04em] text-neutral-700">
                        R{index + 1} {round.red}-{round.blue}
                      </li>
                    ))}
                  </ol>
                </td>
              </tr>
            ) : null}
          </tbody>
        ))}
      </table>
    </details>
  );
}
