import type { ComputedRecord } from "@/domain/record";
import type { ManualRecord } from "../dto";

type Levels<T> = { pro: T; amateur: T };

type RecordSummaryProps = {
  /** Récord de toda la carrera, cargado a mano. */
  manual: Levels<ManualRecord>;
  /** Récord en la promotora, calculado desde las peleas (Plan 03). Sin peleas todavía es 0-0-0. */
  computed: Levels<ComputedRecord>;
};

const METHOD_LABELS = [
  { key: "koTko", label: "KO/TKO" },
  { key: "submission", label: "Sumisión" },
  { key: "decision", label: "Decisión" },
  { key: "dq", label: "Descalif." },
] as const;

const STREAK_LABELS = { win: "victorias seguidas", loss: "derrotas seguidas", draw: "empates seguidos" } as const;

/** "12-2-0": victorias-derrotas-empates. Los sin resultado se cuentan aparte (`noContestsLabel`). */
export function formatRecord({ wins, losses, draws }: { wins: number; losses: number; draws: number; noContests?: number }): string {
  return `${wins}-${losses}-${draws}`;
}

function noContestsLabel(noContests: number): string | null {
  return noContests > 0 ? `${noContests} sin resultado` : null;
}

function isEmpty(record: ManualRecord): boolean {
  return record.wins + record.losses + record.draws + record.noContests === 0;
}

const hasFights = (record: ComputedRecord): boolean => !isEmpty(record);

const RECORD_CLASS = "font-display text-[clamp(30px,8vw,64px)] leading-none tabular-nums whitespace-nowrap text-white";

function TotalRecord({ record, title }: { record: ManualRecord; title: string }) {
  const extra = noContestsLabel(record.noContests);
  return (
    <>
      <p className={RECORD_CLASS} aria-label={`Récord total ${title.toLowerCase()}: ${formatRecord(record)}`}>
        {formatRecord(record)}
      </p>
      {extra ? <p className="mt-1 text-xs text-muted-foreground">{extra}</p> : null}
    </>
  );
}

function GuerraCampalRecord({ record, title }: { record: ComputedRecord; title: string }) {
  const extra = [noContestsLabel(record.noContests), record.streak ? `Racha: ${record.streak.count} ${STREAK_LABELS[record.streak.type]}` : null]
    .filter(Boolean)
    .join(" · ");
  return (
    <>
      <p className={RECORD_CLASS} aria-label={`Récord en Guerra Campal ${title.toLowerCase()}: ${formatRecord(record)}`}>
        {formatRecord(record)}
      </p>
      {extra ? <p className="mt-1 text-xs text-muted-foreground">{extra}</p> : null}
      <ul className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-muted-foreground">
        {METHOD_LABELS.map(({ key, label }) => (
          <li key={key} className="flex justify-between gap-2">
            <span>{label}</span>
            <span className="font-bold tabular-nums text-white">{record.winsBy[key]}</span>
          </li>
        ))}
        {record.finishRate !== null ? (
          <li className="col-span-2 flex justify-between gap-2">
            <span>Finalizaciones</span>
            <span className="font-bold tabular-nums text-white">{Math.round(record.finishRate * 100)} %</span>
          </li>
        ) : null}
      </ul>
    </>
  );
}

const labelClass = "mb-1 font-cond text-[12px] font-bold uppercase tracking-[.14em] text-muted-foreground";

/**
 * Récord profesional y amateur por separado; cada uno con el récord total (manual) y el de Guerra Campal
 * (calculado) lado a lado, también en celular, donde "Guerra Campal" se abrevia a "GC" para caber en una línea.
 * Lo que no tiene datos no se muestra: sin récord amateur no hay bloque amateur, sin peleas en GC no hay columna GC,
 * y sin nada de eso no hay sección.
 */
export function RecordSummary({ manual, computed }: RecordSummaryProps) {
  const levels = (
    [
      { key: "pro", title: "Profesional" },
      { key: "amateur", title: "Amateur" },
    ] as const
  )
    .map((level) => ({ ...level, showTotal: !isEmpty(manual[level.key]), showGc: hasFights(computed[level.key]) }))
    .filter((level) => level.showTotal || level.showGc);

  if (levels.length === 0) return null;

  return (
    <section aria-labelledby="fighter-record-heading" className="border-y border-border bg-[#0a0a0a]">
      <div className="mx-auto w-full max-w-[1320px] px-[clamp(16px,4vw,64px)] py-12 lg:py-16">
        <h2 id="fighter-record-heading" className="mb-8 font-display text-[clamp(32px,5vw,56px)] uppercase leading-none text-white">
          Récord
        </h2>
        <div className={`grid gap-10 ${levels.length > 1 ? "md:grid-cols-2" : ""}`}>
          {levels.map(({ key, title, showTotal, showGc }) => (
            <div key={key} data-level={key}>
              <h3 className="mb-4 font-cond text-[13px] font-extrabold uppercase tracking-[.2em] text-yellow">{title}</h3>
              <div className={`grid gap-4 sm:gap-8 ${showTotal && showGc ? "grid-cols-2" : "grid-cols-1"}`}>
                {showTotal ? (
                  <div data-record="total">
                    <p className={labelClass}>Récord total</p>
                    <TotalRecord record={manual[key]} title={title} />
                  </div>
                ) : null}
                {showGc ? (
                  <div data-record="gc">
                    <p className={labelClass}>
                      <span className="sm:hidden" aria-hidden="true">
                        GC
                      </span>
                      <span className="sr-only sm:not-sr-only sm:inline">Guerra Campal</span>
                    </p>
                    <GuerraCampalRecord record={computed[key]} title={title} />
                  </div>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
