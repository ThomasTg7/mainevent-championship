import type { BoutDTO } from "../dto";
import { fighterComparison } from "../public-format";

const VALUE_CLASS = "px-2 py-2.5 text-center font-display text-[clamp(18px,4.6vw,26px)] uppercase leading-none text-black";

/** Frente a frente de las dos esquinas: valores a los lados, el dato en el medio, todo en la misma fila. */
export function BoutComparison({ bout }: { bout: BoutDTO }) {
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
