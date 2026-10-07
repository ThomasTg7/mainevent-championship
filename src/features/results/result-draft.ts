import {
  type Bonus,
  type DecisionType,
  type KoTkoType,
  type Method,
  type NcReason,
  type Outcome,
  type SubmissionType,
} from "@/domain/bout-enums";
import { suggestDecisionType, validateBoutResult, type BoutContext, type BoutResultInput, type NormalizedResult, type Scorecard } from "@/domain/bout-result";
import { formatClock, parseClock } from "@/domain/clock";

// El resultado tal como se escribe en el formulario (todo texto) y su conversión al resultado que valida el dominio.
// Lo comparten el formulario de resultado y la consola de la noche de pelea.

export type RoundScoreDraft = { red: string; blue: string };

/** Una tarjeta como se escribe: el total de cada esquina o, en el modo «por round», cada round (`rounds`). */
export type ScorecardDraft = { judge: string; red: string; blue: string; rounds?: RoundScoreDraft[] };

/** Cómo se anotan las tarjetas de la pelea: solo el total de cada juez, o round por round (el total se suma solo). */
export type ScorecardMode = "total" | "rounds";

export type ResultDraft = {
  outcome: Outcome | "";
  method: Method | "";
  koTkoType: KoTkoType | "";
  submissionTechniqueId: string;
  submissionType: SubmissionType | "";
  decisionType: DecisionType | "";
  dqReason: string;
  ncReason: NcReason | "";
  ncNote: string;
  /** "1".."5", o vacío. */
  endRound: string;
  /** `m:ss`, o vacío. */
  endTime: string;
  referee: string;
  scorecards: ScorecardDraft[];
  scorecardMode: ScorecardMode;
  bonuses: Bonus[];
  videoUrl: string;
  notes: string;
};

export const EMPTY_DRAFT: ResultDraft = {
  outcome: "",
  method: "",
  koTkoType: "",
  submissionTechniqueId: "",
  submissionType: "",
  decisionType: "",
  dqReason: "",
  ncReason: "",
  ncNote: "",
  endRound: "",
  endTime: "",
  referee: "",
  scorecards: [],
  scorecardMode: "total",
  bonuses: [],
  videoUrl: "",
  notes: "",
};

const WIN_METHODS: Method[] = ["ko_tko", "submission", "decision", "technical_decision", "disqualification"];

/** Métodos que tienen sentido para cada resultado (spec §4.5): un empate solo por decisión; sin resultado, uno solo. */
export function methodsForOutcome(outcome: Outcome | ""): Method[] {
  if (outcome === "draw") return ["decision", "technical_decision"];
  if (outcome === "no_contest") return ["no_contest"];
  return WIN_METHODS;
}

/** Cambia el resultado y ajusta el método: se descarta el que ya no corresponde y «sin resultado» fija el suyo. */
export function setOutcome(draft: ResultDraft, outcome: Outcome): ResultDraft {
  const allowed = methodsForOutcome(outcome);
  const method = allowed.includes(draft.method as Method) ? draft.method : allowed.length === 1 ? allowed[0]! : "";
  return { ...draft, outcome, method };
}

/** Lo que guarda una pelea con resultado (las columnas de `bouts`), con `null` donde no hay dato. */
export type SavedResult = {
  outcome: Outcome | null;
  method: Method | null;
  koTkoType: KoTkoType | null;
  submissionTechniqueId: string | null;
  submissionType: SubmissionType | null;
  decisionType: DecisionType | null;
  dqReason: string | null;
  ncReason: NcReason | null;
  ncNote: string | null;
  endRound: number | null;
  endTimeSeconds: number | null;
  referee: string | null;
  scorecards: Scorecard[] | null;
  bonuses: Bonus[];
  videoUrl: string | null;
  notes: string | null;
};

/** Un resultado guardado, otra vez como texto para corregirlo. */
export function draftFromResult(result: SavedResult): ResultDraft {
  return {
    outcome: result.outcome ?? "",
    method: result.method ?? "",
    koTkoType: result.koTkoType ?? "",
    submissionTechniqueId: result.submissionTechniqueId ?? "",
    submissionType: result.submissionType ?? "",
    decisionType: result.decisionType ?? "",
    dqReason: result.dqReason ?? "",
    ncReason: result.ncReason ?? "",
    ncNote: result.ncNote ?? "",
    endRound: result.endRound === null ? "" : String(result.endRound),
    endTime: result.endTimeSeconds === null ? "" : formatClock(result.endTimeSeconds),
    referee: result.referee ?? "",
    scorecards: (result.scorecards ?? []).map((card) => ({
      judge: card.judge,
      red: String(card.red),
      blue: String(card.blue),
      ...(card.rounds?.length ? { rounds: card.rounds.map((round) => ({ red: String(round.red), blue: String(round.blue) })) } : {}),
    })),
    scorecardMode: result.scorecards?.some((card) => card.rounds?.length) ? "rounds" : "total",
    bonuses: result.bonuses,
    videoUrl: result.videoUrl ?? "",
    notes: result.notes ?? "",
  };
}

const CLOCK_MESSAGE = "Escribe el tiempo como m:ss, por ejemplo 3:42";
const SCORE_MESSAGE = "Los puntajes deben ser números enteros";
const ROUNDS_MESSAGE = "Completa los puntos de cada round";

/** Cuántos rounds se puntúan: todos los de la pelea en una decisión; en una decisión técnica, hasta el round en que se detuvo. */
export function scorecardRoundCount(draft: Pick<ResultDraft, "method" | "endRound">, ctx: { scheduledRounds: number }): number {
  const stoppedAt = Number(draft.endRound);
  return draft.method === "technical_decision" && Number.isInteger(stoppedAt) && stoppedAt >= 1 ? Math.min(stoppedAt, ctx.scheduledRounds) : ctx.scheduledRounds;
}

const isBlank = (text: string | undefined) => !text?.trim();
const toNumber = (text: string) => (text.trim() ? Number(text) : Number.NaN);

/**
 * Las tarjetas escritas → las del dominio. Se saltan las vacías; en el modo «por round» cada round hasta `roundCount`
 * debe tener los dos puntajes (el total lo suma el dominio). Devuelve el mensaje si algo no es un número.
 */
function cardsFromDraft(draft: ResultDraft, roundCount: number): { cards: Scorecard[]; error?: string } {
  const cards: Scorecard[] = [];
  for (const card of draft.scorecards) {
    if (draft.scorecardMode === "rounds") {
      const rounds = (card.rounds ?? []).slice(0, roundCount);
      if (isBlank(card.judge) && rounds.every((round) => isBlank(round.red) && isBlank(round.blue))) continue;
      const scores = rounds.map((round) => ({ red: toNumber(round.red), blue: toNumber(round.blue) }));
      if (scores.length < roundCount || scores.some((round) => Number.isNaN(round.red) || Number.isNaN(round.blue))) return { cards, error: ROUNDS_MESSAGE };
      cards.push({ judge: card.judge, red: 0, blue: 0, rounds: scores });
      continue;
    }
    if (isBlank(card.judge) && isBlank(card.red) && isBlank(card.blue)) continue;
    const [red, blue] = [toNumber(card.red), toNumber(card.blue)];
    if (Number.isNaN(red) || Number.isNaN(blue)) return { cards, error: SCORE_MESSAGE };
    cards.push({ judge: card.judge, red, blue });
  }
  return { cards };
}

/** Con 3 a 5 tarjetas completas (en cualquiera de los dos modos), el resultado y el tipo de decisión que dicen. */
export function suggestFromCards(draft: ResultDraft, ctx: BoutContext): ReturnType<typeof suggestDecisionType> {
  const { cards, error } = cardsFromDraft(draft, scorecardRoundCount(draft, ctx));
  if (error) return null;
  const totals = cards.map((card) => (card.rounds ? { red: card.rounds.reduce((sum, round) => sum + round.red, 0), blue: card.rounds.reduce((sum, round) => sum + round.blue, 0) } : card));
  return suggestDecisionType(totals);
}

export type DraftResult =
  | { ok: true; input: BoutResultInput; value: NormalizedResult }
  | { ok: false; errors: Record<string, string> };

/**
 * Convierte el texto del formulario al resultado y lo valida con las mismas reglas que el servidor: los errores
 * salen antes de enviar y con el mismo mensaje (el servidor vuelve a validar).
 */
export function draftToInput(draft: ResultDraft, ctx: BoutContext): DraftResult {
  if (!draft.outcome) return { ok: false, errors: { outcome: "Elige el resultado" } };
  if (!draft.method) return { ok: false, errors: { method: "Elige el método" } };

  const errors: Record<string, string> = {};

  // Una decisión no muestra round ni tiempo (termina en el último round, con el tiempo completo): lo que se escribió
  // antes de cambiar de método no debe viajar.
  const asksRoundAndTime = draft.method !== "decision";

  let endTimeSeconds: number | null = null;
  if (asksRoundAndTime && draft.endTime.trim()) {
    endTimeSeconds = parseClock(draft.endTime);
    if (endTimeSeconds === null) errors.endTimeSeconds = CLOCK_MESSAGE;
  }

  const { cards: scorecards, error: scorecardsError } = cardsFromDraft(draft, scorecardRoundCount(draft, ctx));
  if (scorecardsError) errors.scorecards = scorecardsError;

  const input: BoutResultInput = {
    outcome: draft.outcome,
    method: draft.method,
    koTkoType: draft.koTkoType || null,
    submissionTechniqueId: draft.submissionTechniqueId || null,
    submissionType: draft.submissionType || null,
    decisionType: draft.decisionType || null,
    dqReason: draft.dqReason,
    ncReason: draft.ncReason || null,
    ncNote: draft.ncNote,
    endRound: asksRoundAndTime && draft.endRound.trim() ? Number(draft.endRound) : null,
    endTimeSeconds,
    referee: draft.referee,
    scorecards,
    bonuses: draft.bonuses,
    videoUrl: draft.videoUrl,
    notes: draft.notes,
  };

  const validated = validateBoutResult(input, ctx);
  if (!validated.ok) Object.assign(errors, { ...validated.errors, ...errors });
  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return validated.ok ? { ok: true, input, value: validated.value } : { ok: false, errors };
}
