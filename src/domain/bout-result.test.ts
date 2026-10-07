import { describe, expect, it } from "vitest";
import { formatResultLine, roundAndTime, suggestDecisionType, validateBoutResult, type BoutContext, type BoutResultInput } from "./bout-result";

const THREE_ROUNDS: BoutContext = { scheduledRounds: 3, roundSeconds: 300 };
const FIVE_ROUNDS: BoutContext = { scheduledRounds: 5, roundSeconds: 300 };

const koWin: BoutResultInput = { outcome: "red_win", method: "ko_tko", koTkoType: "tko_strikes", endRound: 1, endTimeSeconds: 45 };

function errorsOf(input: BoutResultInput, ctx = THREE_ROUNDS): Record<string, string> {
  const result = validateBoutResult(input, ctx);
  if (result.ok) throw new Error("expected validation errors");
  return result.errors;
}

function valueOf(input: BoutResultInput, ctx = THREE_ROUNDS) {
  const result = validateBoutResult(input, ctx);
  if (!result.ok) throw new Error(`unexpected errors: ${JSON.stringify(result.errors)}`);
  return result.value;
}

describe("validateBoutResult — outcome and method coherence", () => {
  it("rejects a win by no contest", () => {
    expect(errorsOf({ outcome: "red_win", method: "no_contest", endRound: 1, endTimeSeconds: 30 }).method).toBeDefined();
    expect(errorsOf({ outcome: "blue_win", method: "no_contest", endRound: 1, endTimeSeconds: 30 }).method).toBeDefined();
  });

  it("only allows decisions for a draw", () => {
    expect(errorsOf({ outcome: "draw", method: "ko_tko", koTkoType: "ko", endRound: 1, endTimeSeconds: 30 }).method).toBeDefined();
    expect(errorsOf({ outcome: "draw", method: "submission", submissionTechniqueId: "t1", endRound: 1, endTimeSeconds: 30 }).method).toBeDefined();
    expect(errorsOf({ outcome: "draw", method: "disqualification", dqReason: "x", endRound: 1, endTimeSeconds: 30 }).method).toBeDefined();
    expect(valueOf({ outcome: "draw", method: "decision", decisionType: "split" }).outcome).toBe("draw");
    expect(valueOf({ outcome: "draw", method: "technical_decision", decisionType: "majority", endRound: 2, endTimeSeconds: 100 }).method).toBe("technical_decision");
  });

  it("only allows the no contest method for a no contest", () => {
    expect(errorsOf({ outcome: "no_contest", method: "decision", decisionType: "unanimous" }).method).toBeDefined();
    expect(errorsOf({ outcome: "no_contest", method: "ko_tko", koTkoType: "ko", endRound: 1, endTimeSeconds: 30 }).method).toBeDefined();
  });
});

describe("validateBoutResult — method details", () => {
  it("asks for the KO/TKO type", () => {
    expect(errorsOf({ outcome: "red_win", method: "ko_tko", endRound: 1, endTimeSeconds: 45 }).koTkoType).toBe("Elige el tipo de KO/TKO");
  });

  it("asks for the submission technique", () => {
    const errors = errorsOf({ outcome: "red_win", method: "submission", endRound: 2, endTimeSeconds: 222 });
    expect(errors.submissionTechniqueId).toBe("Elige la técnica");
  });

  it("asks for the decision type on decisions and technical decisions", () => {
    expect(errorsOf({ outcome: "red_win", method: "decision" }).decisionType).toBe("Elige el tipo de decisión");
    expect(errorsOf({ outcome: "red_win", method: "technical_decision", endRound: 2, endTimeSeconds: 100 }).decisionType).toBeDefined();
  });

  it("asks for the disqualification reason and the no contest reason", () => {
    expect(errorsOf({ outcome: "red_win", method: "disqualification", endRound: 1, endTimeSeconds: 30 }).dqReason).toBeDefined();
    expect(errorsOf({ outcome: "red_win", method: "disqualification", dqReason: "   ", endRound: 1, endTimeSeconds: 30 }).dqReason).toBeDefined();
    expect(errorsOf({ outcome: "no_contest", method: "no_contest", endRound: 1, endTimeSeconds: 30 }).ncReason).toBeDefined();
  });

  it("drops details that do not belong to the chosen method", () => {
    const value = valueOf({
      outcome: "red_win",
      method: "decision",
      decisionType: "unanimous",
      koTkoType: "ko",
      submissionTechniqueId: "t1",
      submissionType: "tap",
      dqReason: "x",
      ncReason: "other",
      ncNote: "y",
    });
    expect(value).toMatchObject({ koTkoType: null, submissionTechniqueId: null, submissionType: null, dqReason: null, ncReason: null, ncNote: null });
  });
});

describe("validateBoutResult — round and time", () => {
  it("rejects a round beyond the scheduled rounds", () => {
    expect(errorsOf({ ...koWin, endRound: 4 }).endRound).toBe("El round no puede ser mayor a 3");
    expect(errorsOf({ ...koWin, endRound: 6 }, FIVE_ROUNDS).endRound).toBe("El round no puede ser mayor a 5");
  });

  it("rejects a round below 1 or a fractional round", () => {
    expect(errorsOf({ ...koWin, endRound: 0 }).endRound).toBeDefined();
    expect(errorsOf({ ...koWin, endRound: 1.5 }).endRound).toBeDefined();
  });

  it("accepts the full round time, rejects one second more", () => {
    expect(valueOf({ ...koWin, endTimeSeconds: 300 }).endTimeSeconds).toBe(300);
    expect(errorsOf({ ...koWin, endTimeSeconds: 301 }).endTimeSeconds).toBe("El tiempo no puede superar 5:00");
  });

  it("uses the round length of the fight in the message", () => {
    expect(errorsOf({ ...koWin, endTimeSeconds: 181 }, { scheduledRounds: 3, roundSeconds: 180 }).endTimeSeconds).toBe("El tiempo no puede superar 3:00");
  });

  it("rejects 0:00", () => {
    expect(errorsOf({ ...koWin, endTimeSeconds: 0 }).endTimeSeconds).toBeDefined();
  });

  it("requires round and time when the fight ended before the bell", () => {
    expect(errorsOf({ outcome: "red_win", method: "ko_tko", koTkoType: "ko" }).endRound).toBeDefined();
    expect(errorsOf({ outcome: "red_win", method: "ko_tko", koTkoType: "ko", endRound: 1 }).endTimeSeconds).toBeDefined();
    expect(errorsOf({ outcome: "no_contest", method: "no_contest", ncReason: "accidental_foul" }).endRound).toBeDefined();
  });

  it("fills a decision with the last round and the full time", () => {
    expect(valueOf({ outcome: "red_win", method: "decision", decisionType: "unanimous" })).toMatchObject({ endRound: 3, endTimeSeconds: 300 });
    expect(valueOf({ outcome: "red_win", method: "decision", decisionType: "unanimous" }, FIVE_ROUNDS)).toMatchObject({ endRound: 5, endTimeSeconds: 300 });
  });

  it("fills a technical decision with the last round but asks for the time", () => {
    const input: BoutResultInput = { outcome: "red_win", method: "technical_decision", decisionType: "unanimous" };
    expect(errorsOf(input).endTimeSeconds).toBeDefined();
    expect(valueOf({ ...input, endTimeSeconds: 120 })).toMatchObject({ endRound: 3, endTimeSeconds: 120 });
  });
});

describe("validateBoutResult — optional data", () => {
  it("trims text and turns blanks into null", () => {
    const value = valueOf({ ...koWin, referee: "  Juan Soto ", notes: "   ", videoUrl: "" });
    expect(value).toMatchObject({ referee: "Juan Soto", notes: null, videoUrl: null });
  });

  it("rejects a video link that is not http(s)", () => {
    expect(errorsOf({ ...koWin, videoUrl: "javascript:alert(1)" }).videoUrl).toBeDefined();
    expect(errorsOf({ ...koWin, videoUrl: "youtube" }).videoUrl).toBeDefined();
    expect(valueOf({ ...koWin, videoUrl: "https://youtu.be/abc" }).videoUrl).toBe("https://youtu.be/abc");
  });

  it("checks judges' scorecards", () => {
    const decision: BoutResultInput = { outcome: "red_win", method: "decision", decisionType: "unanimous" };
    expect(errorsOf({ ...decision, scorecards: [{ judge: " ", red: 29, blue: 28 }] }).scorecards).toBeDefined();
    expect(errorsOf({ ...decision, scorecards: [{ judge: "A", red: 29.5, blue: 28 }] }).scorecards).toBeDefined();
    expect(errorsOf({ ...decision, scorecards: [{ judge: "A", red: -1, blue: 28 }] }).scorecards).toBeDefined();
    expect(valueOf({ ...decision, scorecards: [{ judge: " A ", red: 29, blue: 28 }] }).scorecards).toEqual([{ judge: "A", red: 29, blue: 28 }]);
    expect(valueOf(decision).scorecards).toBeNull();
  });

  it("takes up to five judges", () => {
    const decision: BoutResultInput = { outcome: "red_win", method: "decision", decisionType: "unanimous" };
    const card = (judge: string) => ({ judge, red: 29, blue: 28 });
    expect(valueOf({ ...decision, scorecards: ["A", "B", "C", "D", "E"].map(card) }).scorecards).toHaveLength(5);
    expect(errorsOf({ ...decision, scorecards: ["A", "B", "C", "D", "E", "F"].map(card) }).scorecards).toBe("Máximo 5 tarjetas");
  });

  it("adds up a card written round by round, and checks each round", () => {
    const decision: BoutResultInput = { outcome: "red_win", method: "decision", decisionType: "unanimous" };
    const rounds = [
      { red: 10, blue: 9 },
      { red: 9, blue: 10 },
      { red: 10, blue: 8 },
    ];
    expect(valueOf({ ...decision, scorecards: [{ judge: "A", red: 0, blue: 0, rounds }] }).scorecards).toEqual([{ judge: "A", red: 29, blue: 27, rounds }]);
    expect(errorsOf({ ...decision, scorecards: [{ judge: "A", red: 0, blue: 0, rounds: [{ red: 11, blue: 9 }] }] }).scorecards).toBe(
      "Cada round se puntúa con números enteros de 0 a 10",
    );
    expect(errorsOf({ ...decision, scorecards: [{ judge: "A", red: 0, blue: 0, rounds: [...rounds, { red: 10, blue: 9 }] }] }).scorecards).toBe(
      "La tarjeta tiene más rounds que la pelea (3)",
    );
  });

  it("keeps each bonus once", () => {
    expect(valueOf({ ...koWin, bonuses: ["ko_of_night", "ko_of_night", "fight_of_night"] }).bonuses).toEqual(["ko_of_night", "fight_of_night"]);
    expect(valueOf(koWin).bonuses).toEqual([]);
  });
});

describe("suggestDecisionType", () => {
  it("suggests a split decision when one judge disagrees", () => {
    expect(suggestDecisionType([{ red: 29, blue: 28 }, { red: 29, blue: 28 }, { red: 28, blue: 29 }])).toEqual({ outcome: "red_win", decisionType: "split" });
    expect(suggestDecisionType([{ red: 28, blue: 29 }, { red: 29, blue: 28 }, { red: 28, blue: 29 }])).toEqual({ outcome: "blue_win", decisionType: "split" });
  });

  it("suggests a majority decision when the third judge scores a draw", () => {
    expect(suggestDecisionType([{ red: 29, blue: 28 }, { red: 28, blue: 28 }, { red: 29, blue: 28 }])).toEqual({ outcome: "red_win", decisionType: "majority" });
  });

  it("suggests a unanimous decision when the three judges agree", () => {
    expect(suggestDecisionType([{ red: 30, blue: 27 }, { red: 29, blue: 28 }, { red: 30, blue: 27 }])).toEqual({ outcome: "red_win", decisionType: "unanimous" });
    expect(suggestDecisionType([{ red: 28, blue: 28 }, { red: 29, blue: 29 }, { red: 30, blue: 30 }])).toEqual({ outcome: "draw", decisionType: "unanimous" });
  });

  it("suggests a split draw when the judges see red, blue and a draw", () => {
    expect(suggestDecisionType([{ red: 29, blue: 28 }, { red: 28, blue: 29 }, { red: 28, blue: 28 }])).toEqual({ outcome: "draw", decisionType: "split" });
  });

  it("suggests a majority draw when two judges draw and one picks a corner", () => {
    expect(suggestDecisionType([{ red: 29, blue: 28 }, { red: 28, blue: 28 }, { red: 29, blue: 29 }])).toEqual({ outcome: "draw", decisionType: "majority" });
  });

  it("also works with five judges: the winner needs most of the cards", () => {
    const red = { red: 29, blue: 28 };
    const blue = { red: 28, blue: 29 };
    const even = { red: 28, blue: 28 };
    expect(suggestDecisionType([red, red, red, red, red])).toEqual({ outcome: "red_win", decisionType: "unanimous" });
    expect(suggestDecisionType([red, red, red, blue, even])).toEqual({ outcome: "red_win", decisionType: "split" });
    expect(suggestDecisionType([red, red, red, even, even])).toEqual({ outcome: "red_win", decisionType: "majority" });
    expect(suggestDecisionType([red, red, blue, even, even])).toEqual({ outcome: "draw", decisionType: "split" });
    expect(suggestDecisionType([red, even, even, even, blue])).toEqual({ outcome: "draw", decisionType: "majority" });
  });

  it("gives no suggestion with fewer than three scorecards", () => {
    expect(suggestDecisionType([])).toBeNull();
    expect(suggestDecisionType([{ red: 29, blue: 28 }, { red: 29, blue: 28 }])).toBeNull();
  });
});

describe("formatResultLine", () => {
  const names = { redName: "Pérez", blueName: "Soto" };

  function line(input: BoutResultInput, extra: { techniqueName?: string } = {}, ctx = THREE_ROUNDS): string {
    return formatResultLine({ ...valueOf(input, ctx), ...names, ...extra });
  }

  it("writes a submission with the technique", () => {
    const input: BoutResultInput = { outcome: "red_win", method: "submission", submissionTechniqueId: "t1", endRound: 2, endTimeSeconds: 222 };
    expect(line(input, { techniqueName: "Mataleón" })).toBe("Pérez vence a Soto · Sumisión (Mataleón) · R2 3:42");
  });

  it("puts the winner first even when blue wins", () => {
    const input: BoutResultInput = { outcome: "blue_win", method: "ko_tko", koTkoType: "tko_strikes", endRound: 1, endTimeSeconds: 45 };
    expect(line(input)).toBe("Soto vence a Pérez · TKO (golpes) · R1 0:45");
    expect(line({ ...input, koTkoType: "ko" })).toBe("Soto vence a Pérez · KO · R1 0:45");
  });

  it("writes decisions with their type only: a decision goes the distance, the round adds nothing", () => {
    expect(line({ outcome: "red_win", method: "decision", decisionType: "split" })).toBe("Pérez vence a Soto · Decisión dividida");
    expect(line({ outcome: "red_win", method: "decision", decisionType: "unanimous" }, {}, FIVE_ROUNDS)).toBe("Pérez vence a Soto · Decisión unánime");
  });

  it("writes technical decisions and disqualifications", () => {
    expect(line({ outcome: "blue_win", method: "technical_decision", decisionType: "majority", endRound: 2, endTimeSeconds: 100 })).toBe(
      "Soto vence a Pérez · Decisión técnica mayoritaria · R2 1:40",
    );
    expect(line({ outcome: "red_win", method: "disqualification", dqReason: "Golpe bajo", endRound: 2, endTimeSeconds: 100 })).toBe(
      "Pérez vence a Soto · Descalificación (Golpe bajo) · R2 1:40",
    );
  });

  it("writes a draw without a winner, with the round only when it was stopped (technical decision)", () => {
    expect(line({ outcome: "draw", method: "decision", decisionType: "majority" })).toBe("Pérez y Soto empatan · Decisión mayoritaria");
    expect(line({ outcome: "draw", method: "technical_decision", decisionType: "split", endRound: 2, endTimeSeconds: 100 })).toBe(
      "Pérez y Soto empatan · Decisión técnica dividida · R2 1:40",
    );
  });

  it("roundAndTime says where the fight ended, and nothing for a decision", () => {
    expect(roundAndTime({ method: "ko_tko", endRound: 1, endTimeSeconds: 45 })).toBe("R1 0:45");
    expect(roundAndTime({ method: "technical_decision", endRound: 2, endTimeSeconds: 100 })).toBe("R2 1:40");
    expect(roundAndTime({ method: "decision", endRound: 3, endTimeSeconds: 300 })).toBeNull();
  });

  it("writes a no contest with its reason", () => {
    expect(line({ outcome: "no_contest", method: "no_contest", ncReason: "accidental_foul", endRound: 1, endTimeSeconds: 30 })).toBe(
      "Pérez vs Soto · Sin resultado (falta accidental)",
    );
    expect(line({ outcome: "no_contest", method: "no_contest", ncReason: "other", ncNote: "Corte de luz", endRound: 1, endTimeSeconds: 30 })).toBe(
      "Pérez vs Soto · Sin resultado (Corte de luz)",
    );
  });
});
