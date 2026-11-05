import type { BoutDTO } from "../dto";
import { fighterComparison } from "../public-format";

const VALUE_CLASS = "px-2 py-2.5 text-center font-display text-[clamp(18px,4.6vw,26px)] uppercase leading-none";

/** Colores por superficie: la tarjeta-afiche de la cartelera es negra; la página de la pelea, blanca. */
const TONES = {
  light: { ink: "text-black", muted: "text-neutral-500", rule: "border-neutral-200" },
  dark: { ink: "text-white", muted: "text-white/60", rule: "border-white/10" },
} as const;

/** Frente a frente de las dos esquinas: valores a los lados, el dato en el medio, todo en la misma fila. */
export function BoutComparison({ bout, tone = "light" }: { bout: BoutDTO; tone?: keyof typeof TONES }) {
  const rows = fighterComparison(bout.red, bout.blue);
  const colors = TONES[tone];
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
          <th scope="col" className={`border-b-4 border-[#D7263D] px-2 pb-2 font-cond text-[13px] font-extrabold uppercase tracking-[.1em] ${colors.ink}`}>
            {bout.red.lastName}
            {bout.red.nickname ? <span className={`block font-cond text-xs font-semibold normal-case tracking-[.04em] ${colors.muted}`}>“{bout.red.nickname}”</span> : null}
          </th>
          <td className={`border-b-4 ${colors.rule}`} />
          <th scope="col" className={`border-b-4 border-[#1E6FD9] px-2 pb-2 font-cond text-[13px] font-extrabold uppercase tracking-[.1em] ${colors.ink}`}>
            {bout.blue.lastName}
            {bout.blue.nickname ? <span className={`block font-cond text-xs font-semibold normal-case tracking-[.04em] ${colors.muted}`}>“{bout.blue.nickname}”</span> : null}
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.label} className={`border-b ${colors.rule}`}>
            <td className={`${VALUE_CLASS} ${colors.ink}`}>{row.red}</td>
            <th scope="row" className={`px-1 text-center font-cond text-[11px] font-extrabold uppercase tracking-[.14em] ${colors.muted} sm:text-xs`}>
              {row.label}
            </th>
            <td className={`${VALUE_CLASS} ${colors.ink}`}>{row.blue}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
