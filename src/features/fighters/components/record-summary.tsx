import type { ComputedRecord } from "@/domain/record";
import type { ManualRecord } from "../dto";

type Levels<T> = { pro: T; amateur: T };

type RecordSummaryProps = {
  /** Récord de toda la carrera, cargado a mano. */
  manual: Levels<ManualRecord>;
  /** Récord en la promotora, calculado desde las peleas (Plan 03). Sin él, no se muestra esa columna. */
  computed?: Levels<ComputedRecord>;
};

const METHOD_LABELS = [
  { key: "koTko", label: "KO/TKO" },
  { key: "submission", label: "Sumisión" },
  { key: "decision", label: "Decisión" },
  { key: "dq", label: "Descalificación" },
] as const;

const STREAK_LABELS = { win: "victorias seguidas", loss: "derrotas seguidas", draw: "empates seguidos" } as const;

/** "12-2-0" (+ " · 1 NC" si hay sin resultado). */
export function formatRecord({ wins, losses, draws, noContests }: { wins: number; losses: number; draws: number; noContests: number }): string {
  return `${wins}-${losses}-${draws}${noContests > 0 ? ` · ${noContests} NC` : ""}`;
}

function isEmpty(record: ManualRecord): boolean {
  return record.wins + record.losses + record.draws + record.noContests === 0;
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-border py-2.5 last:border-b-0">
      <dt className="font-cond text-[13px] font-bold uppercase tracking-[.1em] text-muted-foreground">{label}</dt>
      <dd className="font-cond text-lg font-bold tabular-nums text-white">{children}</dd>
    </div>
  );
}

function ComputedDetails({ record }: { record: ComputedRecord }) {
  const fights = record.wins + record.losses + record.draws + record.noContests;
  if (fights === 0) return <p className="py-3 text-sm text-muted-foreground">Todavía no pelea en Guerra Campal.</p>;

  return (
    <dl>
      <Row label="Récord">{formatRecord(record)}</Row>
      {METHOD_LABELS.map(({ key, label }) => (
        <Row key={key} label={`Victorias por ${label}`}>
          {record.winsBy[key]}
        </Row>
      ))}
      {record.streak ? <Row label="Racha">{`${record.streak.count} ${STREAK_LABELS[record.streak.type]}`}</Row> : null}
      {record.finishRate !== null ? <Row label="Finalizaciones">{`${Math.round(record.finishRate * 100)} %`}</Row> : null}
    </dl>
  );
}

/** Récord total (manual) y en la promotora (calculado), cada uno con nivel profesional y amateur por separado. */
export function RecordSummary({ manual, computed }: RecordSummaryProps) {
  const levels = [
    { key: "pro", title: "Profesional" },
    { key: "amateur", title: "Amateur" },
  ] as const;

  return (
    <section aria-labelledby="fighter-record-heading" className="border-y border-border bg-[#0a0a0a]">
      <div className="mx-auto w-full max-w-[1320px] px-[clamp(16px,4vw,64px)] py-12 lg:py-16">
        <h2 id="fighter-record-heading" className="mb-8 font-display text-[clamp(32px,5vw,56px)] uppercase leading-none text-white">
          Récord
        </h2>
        <div className="grid gap-8 md:grid-cols-2">
          {levels.map(({ key, title }) => (
            <div key={key} data-level={key}>
              <h3 className="mb-3 font-cond text-[13px] font-extrabold uppercase tracking-[.2em] text-yellow">{title}</h3>
              <div className={computed ? "grid gap-6 sm:grid-cols-2" : ""}>
                <div>
                  <p className="font-cond text-[12px] font-bold uppercase tracking-[.14em] text-muted-foreground">Récord total</p>
                  {isEmpty(manual[key]) ? (
                    <p className="py-3 text-sm text-muted-foreground">Sin datos cargados.</p>
                  ) : (
                    <p className="font-display text-[clamp(40px,7vw,64px)] leading-none tabular-nums text-white" aria-label={`Récord total ${title.toLowerCase()}: ${formatRecord(manual[key])}`}>
                      {formatRecord(manual[key])}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-muted-foreground">Victorias-derrotas-empates de toda su carrera.</p>
                </div>
                {computed ? (
                  <div>
                    <p className="font-cond text-[12px] font-bold uppercase tracking-[.14em] text-muted-foreground">En Guerra Campal</p>
                    <ComputedDetails record={computed[key]} />
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
