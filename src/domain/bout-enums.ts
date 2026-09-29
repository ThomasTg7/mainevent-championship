// Valores de las enumeraciones de peleas: los usa el esquema de la base, la validación y la interfaz.

export const EVENT_STATUSES = ["scheduled", "live", "completed", "cancelled"] as const;
export type EventStatus = (typeof EVENT_STATUSES)[number];

export const BOUT_LEVELS = ["pro", "amateur"] as const;
export type BoutLevel = (typeof BOUT_LEVELS)[number];

export const BOUT_STATUSES = ["scheduled", "completed", "cancelled"] as const;
export type BoutStatus = (typeof BOUT_STATUSES)[number];

export const OUTCOMES = ["red_win", "blue_win", "draw", "no_contest"] as const;
export type Outcome = (typeof OUTCOMES)[number];

export const METHODS = ["ko_tko", "submission", "decision", "technical_decision", "disqualification", "no_contest"] as const;
export type Method = (typeof METHODS)[number];

export const KO_TKO_TYPES = ["ko", "tko_strikes", "tko_doctor", "tko_corner", "tko_injury"] as const;
export type KoTkoType = (typeof KO_TKO_TYPES)[number];

export const SUBMISSION_TYPES = ["tap", "verbal", "strikes"] as const;
export type SubmissionType = (typeof SUBMISSION_TYPES)[number];

export const DECISION_TYPES = ["unanimous", "split", "majority"] as const;
export type DecisionType = (typeof DECISION_TYPES)[number];

export const NC_REASONS = ["accidental_foul", "overturned", "other"] as const;
export type NcReason = (typeof NC_REASONS)[number];

export const BONUSES = ["fight_of_night", "performance_of_night", "ko_of_night", "sub_of_night"] as const;
export type Bonus = (typeof BONUSES)[number];

export const SCHEDULED_ROUNDS = [3, 5] as const;
export type ScheduledRounds = (typeof SCHEDULED_ROUNDS)[number];

export const DEFAULT_ROUND_SECONDS = 300;
export const MIN_ROUND_SECONDS = 60;
export const MAX_ROUND_SECONDS = 600;

// Textos para la persona (es-CL). Empiezan con mayúscula: dentro de una frase se pasan a minúscula.

export const EVENT_STATUS_LABELS: Record<EventStatus, string> = { scheduled: "Programado", live: "En vivo", completed: "Finalizado", cancelled: "Cancelado" };

export const BOUT_LEVEL_LABELS: Record<BoutLevel, string> = { pro: "Profesional", amateur: "Amateur" };

export const OUTCOME_LABELS: Record<Outcome, string> = {
  red_win: "Gana la esquina roja",
  blue_win: "Gana la esquina azul",
  draw: "Empate",
  no_contest: "Sin resultado",
};

export const METHOD_LABELS: Record<Method, string> = {
  ko_tko: "KO/TKO",
  submission: "Sumisión",
  decision: "Decisión",
  technical_decision: "Decisión técnica",
  disqualification: "Descalificación",
  no_contest: "Sin resultado",
};

export const KO_TKO_TYPE_LABELS: Record<KoTkoType, string> = {
  ko: "KO",
  tko_strikes: "TKO (golpes)",
  tko_doctor: "TKO (detención médica)",
  tko_corner: "TKO (esquina)",
  tko_injury: "TKO (lesión)",
};

export const SUBMISSION_TYPE_LABELS: Record<SubmissionType, string> = { tap: "Golpeteo (tap)", verbal: "Verbal", strikes: "Por golpes" };

export const DECISION_TYPE_LABELS: Record<DecisionType, string> = { unanimous: "Unánime", split: "Dividida", majority: "Mayoritaria" };

export const NC_REASON_LABELS: Record<NcReason, string> = {
  accidental_foul: "Falta accidental",
  overturned: "Resultado anulado",
  other: "Otro",
};

export const BONUS_LABELS: Record<Bonus, string> = {
  fight_of_night: "Pelea de la noche",
  performance_of_night: "Actuación de la noche",
  ko_of_night: "KO de la noche",
  sub_of_night: "Sumisión de la noche",
};
