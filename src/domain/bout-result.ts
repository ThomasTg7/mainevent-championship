import {
  BONUSES,
  DECISION_TYPE_LABELS,
  KO_TKO_TYPE_LABELS,
  NC_REASON_LABELS,
  type Bonus,
  type DecisionType,
  type KoTkoType,
  type Method,
  type NcReason,
  type Outcome,
  type ScheduledRounds,
  type SubmissionType,
} from "./bout-enums";
import { formatClock } from "./clock";

export type Scorecard = { judge: string; red: number; blue: number };

export type BoutResultInput = {
  outcome: Outcome;
  method: Method;
  koTkoType?: KoTkoType | null;
  submissionTechniqueId?: string | null;
  submissionType?: SubmissionType | null;
  decisionType?: DecisionType | null;
  dqReason?: string | null;
  ncReason?: NcReason | null;
  ncNote?: string | null;
  endRound?: number | null;
  endTimeSeconds?: number | null;
  referee?: string | null;
  scorecards?: Scorecard[] | null;
  bonuses?: Bonus[] | null;
  videoUrl?: string | null;
  notes?: string | null;
};

export type BoutContext = { scheduledRounds: ScheduledRounds; roundSeconds: number };

/** Resultado listo para guardar: los mismos nombres que las columnas de `bouts`; lo que no aplica al método va en `null`. */
export type NormalizedResult = {
  outcome: Outcome;
  method: Method;
  koTkoType: KoTkoType | null;
  submissionTechniqueId: string | null;
  submissionType: SubmissionType | null;
  decisionType: DecisionType | null;
  dqReason: string | null;
  ncReason: NcReason | null;
  ncNote: string | null;
  endRound: number;
  endTimeSeconds: number;
  referee: string | null;
  scorecards: Scorecard[] | null;
  bonuses: Bonus[];
  videoUrl: string | null;
  notes: string | null;
};

export type ValidationResult = { ok: true; value: NormalizedResult } | { ok: false; errors: Record<string, string> };

const MAX_SCORE = 50;
const DRAW_METHODS: readonly Method[] = ["decision", "technical_decision"];

function trimmed(value: string | null | undefined): string | null {
  return value?.trim() || null;
}

/** Un ganador y un método que no se contradicen (spec §4.5). */
function coherenceError(outcome: Outcome, method: Method): string | null {
  if (outcome === "no_contest") return method === "no_contest" ? null : "Un sin resultado no lleva otro método";
  if (method === "no_contest") return "Elige cómo terminó la pelea";
  if (outcome === "draw" && !DRAW_METHODS.includes(method)) return "Un empate solo puede ser por decisión";
  return null;
}

function validateScorecards(scorecards: Scorecard[] | null | undefined): { value: Scorecard[] | null; error?: string } {
  if (!scorecards || scorecards.length === 0) return { value: null };
  const cleaned: Scorecard[] = [];
  for (const card of scorecards) {
    const judge = card.judge.trim();
    if (!judge) return { value: null, error: "Cada tarjeta necesita el nombre del juez" };
    const validScore = (score: number) => Number.isInteger(score) && score >= 0 && score <= MAX_SCORE;
    if (!validScore(card.red) || !validScore(card.blue)) {
      return { value: null, error: `Los puntajes deben ser números enteros entre 0 y ${MAX_SCORE}` };
    }
    cleaned.push({ judge, red: card.red, blue: card.blue });
  }
  return { value: cleaned };
}

function validVideoUrl(value: string): boolean {
  try {
    const { protocol } = new URL(value);
    return protocol === "https:" || protocol === "http:";
  } catch {
    return false;
  }
}

/**
 * Comprueba y normaliza el resultado de una pelea. En decisión, el round y el tiempo vacíos se completan
 * (último round, tiempo completo); en decisión técnica solo el round (el tiempo en que se detuvo hay que indicarlo).
 */
export function validateBoutResult(input: BoutResultInput, ctx: BoutContext): ValidationResult {
  const { outcome, method } = input;
  const incoherent = coherenceError(outcome, method);
  if (incoherent) return { ok: false, errors: { method: incoherent } };

  const errors: Record<string, string> = {};

  const koTkoType = method === "ko_tko" ? (input.koTkoType ?? null) : null;
  if (method === "ko_tko" && !koTkoType) errors.koTkoType = "Elige el tipo de KO/TKO";

  const submissionTechniqueId = method === "submission" ? trimmed(input.submissionTechniqueId) : null;
  if (method === "submission" && !submissionTechniqueId) errors.submissionTechniqueId = "Elige la técnica";
  const submissionType = method === "submission" ? (input.submissionType ?? null) : null;

  const isDecision = method === "decision" || method === "technical_decision";
  const decisionType = isDecision ? (input.decisionType ?? null) : null;
  if (isDecision && !decisionType) errors.decisionType = "Elige el tipo de decisión";

  const dqReason = method === "disqualification" ? trimmed(input.dqReason) : null;
  if (method === "disqualification" && !dqReason) errors.dqReason = "Indica el motivo de la descalificación";

  const ncReason = method === "no_contest" ? (input.ncReason ?? null) : null;
  if (method === "no_contest" && !ncReason) errors.ncReason = "Elige el motivo";
  const ncNote = method === "no_contest" ? trimmed(input.ncNote) : null;

  let endRound = input.endRound ?? null;
  let endTimeSeconds = input.endTimeSeconds ?? null;
  if (endRound === null && isDecision) endRound = ctx.scheduledRounds;
  if (endTimeSeconds === null && method === "decision") endTimeSeconds = ctx.roundSeconds;

  if (endRound === null) errors.endRound = "Elige el round";
  else if (!Number.isInteger(endRound) || endRound < 1) errors.endRound = "Elige un round válido";
  else if (endRound > ctx.scheduledRounds) errors.endRound = `El round no puede ser mayor a ${ctx.scheduledRounds}`;

  if (endTimeSeconds === null) errors.endTimeSeconds = "Indica el tiempo (m:ss)";
  else if (!Number.isInteger(endTimeSeconds) || endTimeSeconds <= 0) errors.endTimeSeconds = "El tiempo debe ser mayor a 0:00";
  else if (endTimeSeconds > ctx.roundSeconds) errors.endTimeSeconds = `El tiempo no puede superar ${formatClock(ctx.roundSeconds)}`;

  const scorecards = validateScorecards(isDecision ? input.scorecards : null);
  if (scorecards.error) errors.scorecards = scorecards.error;

  const videoUrl = trimmed(input.videoUrl);
  if (videoUrl && !validVideoUrl(videoUrl)) errors.videoUrl = "El enlace del video no es válido (debe empezar con https://)";

  const bonuses = [...new Set(input.bonuses ?? [])];
  if (bonuses.some((bonus) => !BONUSES.includes(bonus))) errors.bonuses = "Bono no válido";

  if (Object.keys(errors).length > 0 || endRound === null || endTimeSeconds === null) return { ok: false, errors };

  return {
    ok: true,
    value: {
      outcome,
      method,
      koTkoType,
      submissionTechniqueId,
      submissionType,
      decisionType,
      dqReason,
      ncReason,
      ncNote,
      endRound,
      endTimeSeconds,
      referee: trimmed(input.referee),
      scorecards: scorecards.value,
      bonuses,
      videoUrl,
      notes: trimmed(input.notes),
    },
  };
}

/** Con tres tarjetas, qué resultado y qué tipo de decisión corresponden. Con otra cantidad no sugiere nada. */
export function suggestDecisionType(
  scorecards: { red: number; blue: number }[],
): { outcome: "red_win" | "blue_win" | "draw"; decisionType: DecisionType } | null {
  if (scorecards.length !== 3) return null;

  const red = scorecards.filter((card) => card.red > card.blue).length;
  const blue = scorecards.filter((card) => card.blue > card.red).length;
  const draws = scorecards.length - red - blue;

  if (red === 3) return { outcome: "red_win", decisionType: "unanimous" };
  if (blue === 3) return { outcome: "blue_win", decisionType: "unanimous" };
  if (draws === 3) return { outcome: "draw", decisionType: "unanimous" };
  if (red >= 2) return { outcome: "red_win", decisionType: blue > 0 ? "split" : "majority" };
  if (blue >= 2) return { outcome: "blue_win", decisionType: red > 0 ? "split" : "majority" };
  // Quedan dos empates y una tarjeta con ganador, o una tarjeta de cada tipo.
  return { outcome: "draw", decisionType: draws === 2 ? "majority" : "split" };
}

export type ResultLineInput = NormalizedResult & { redName: string; blueName: string; techniqueName?: string | null };

function decisionText(base: string, type: DecisionType | null): string {
  return type ? `${base} ${DECISION_TYPE_LABELS[type].toLowerCase()}` : base;
}

function methodText(result: ResultLineInput): string {
  switch (result.method) {
    case "ko_tko":
      return result.koTkoType ? KO_TKO_TYPE_LABELS[result.koTkoType] : "KO/TKO";
    case "submission":
      return result.techniqueName ? `Sumisión (${result.techniqueName})` : "Sumisión";
    case "decision":
      return decisionText("Decisión", result.decisionType);
    case "technical_decision":
      return decisionText("Decisión técnica", result.decisionType);
    case "disqualification":
      return result.dqReason ? `Descalificación (${result.dqReason})` : "Descalificación";
    case "no_contest":
      return "Sin resultado";
  }
}

/** "Pérez vence a Soto · Sumisión (Mataleón) · R2 3:42" · "Pérez y Soto empatan · Decisión dividida" · "Pérez vs Soto · Sin resultado (falta accidental)". */
export function formatResultLine(result: ResultLineInput): string {
  const { redName, blueName } = result;

  if (result.outcome === "no_contest") {
    const reason = result.ncReason === "other" ? (result.ncNote ?? "otro") : result.ncReason ? NC_REASON_LABELS[result.ncReason].toLowerCase() : null;
    return `${redName} vs ${blueName} · Sin resultado${reason ? ` (${reason})` : ""}`;
  }
  if (result.outcome === "draw") return `${redName} y ${blueName} empatan · ${methodText(result)}`;

  const [winner, loser] = result.outcome === "red_win" ? [redName, blueName] : [blueName, redName];
  return `${winner} vence a ${loser} · ${methodText(result)} · R${result.endRound} ${formatClock(result.endTimeSeconds)}`;
}
