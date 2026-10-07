import type { Scorecard } from "@/domain/bout-result";

type JudgesScorecardsProps = { scorecards: Scorecard[]; redName: string; blueName: string };

const CELL = "px-3 py-2 text-center font-display text-xl leading-none tabular-nums";

const winnerClass = (mine: number, theirs: number) => (mine > theirs ? "text-black" : "text-neutral-500");

/** Para quién fue la tarjeta: «Para Soto», o «Empate». */
function verdict(card: Scorecard, redName: string, blueName: string): string {
  if (card.red === card.blue) return "Empate";
  return `Para ${card.red > card.blue ? redName : blueName}`;
}

/**
 * Las tarjetas de los jueces con todo el detalle (al final de la página de la pelea): por juez, cada round con el
 * puntaje de las dos esquinas (si se anotó round por round) y el total, con el ganador de cada fila destacado.
 */
export function JudgesScorecards({ scorecards, redName, blueName }: JudgesScorecardsProps) {
  return (
    <ul data-slot="judges-scorecards" className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {scorecards.map((card, position) => (
        <li key={position} className="flex flex-col border border-neutral-200 bg-white">
          <div className="flex items-baseline justify-between gap-3 border-b border-neutral-200 px-4 py-3">
            <h3 className="font-cond text-lg font-extrabold uppercase tracking-[.06em] text-black">{card.judge}</h3>
            <span className="font-cond text-xs font-bold uppercase tracking-[.12em] text-neutral-500">{verdict(card, redName, blueName)}</span>
          </div>
          <table className="w-full table-fixed border-collapse">
            <caption className="sr-only">Tarjeta de {card.judge}</caption>
            <thead>
              <tr>
                <th scope="col" className="w-[28%] px-3 py-2 text-left font-cond text-[11px] font-extrabold uppercase tracking-[.14em] text-neutral-500">
                  {card.rounds?.length ? "Round" : ""}
                </th>
                <th scope="col" className="border-b-4 border-[#D7263D] px-3 py-2 font-cond text-xs font-extrabold uppercase tracking-[.1em] text-black">
                  {redName}
                </th>
                <th scope="col" className="border-b-4 border-[#1E6FD9] px-3 py-2 font-cond text-xs font-extrabold uppercase tracking-[.1em] text-black">
                  {blueName}
                </th>
              </tr>
            </thead>
            <tbody>
              {(card.rounds ?? []).map((round, index) => (
                <tr key={index} className="border-b border-neutral-100">
                  <th scope="row" className="px-3 py-2 text-left font-cond text-sm font-bold uppercase tracking-[.06em] text-neutral-600">
                    R{index + 1}
                  </th>
                  <td className={`${CELL} ${winnerClass(round.red, round.blue)}`}>{round.red}</td>
                  <td className={`${CELL} ${winnerClass(round.blue, round.red)}`}>{round.blue}</td>
                </tr>
              ))}
              <tr className="bg-neutral-100">
                <th scope="row" className="px-3 py-3 text-left font-cond text-sm font-extrabold uppercase tracking-[.08em] text-black">
                  Total
                </th>
                <td className={`${CELL} py-3 text-2xl ${winnerClass(card.red, card.blue)}`}>{card.red}</td>
                <td className={`${CELL} py-3 text-2xl ${winnerClass(card.blue, card.red)}`}>{card.blue}</td>
              </tr>
            </tbody>
          </table>
        </li>
      ))}
    </ul>
  );
}
