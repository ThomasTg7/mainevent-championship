import { describe, expect, it } from "vitest";
import {
  P4P_SLOTS,
  applySuggestion,
  computeMovement,
  rankingScopeKey,
  suggestAfterEvent,
  validateRanking,
  type RankingSuggestion,
} from "./rankings";

describe("computeMovement", () => {
  it("compares positions against the previous version", () => {
    const movement = computeMovement(["a", "b", "c"], ["b", "a", "d"]);
    expect(movement.get("a")).toEqual({ kind: "up", by: 1 });
    expect(movement.get("b")).toEqual({ kind: "down", by: 1 });
    expect(movement.get("c")).toEqual({ kind: "new" });
  });

  it("marks everyone as new when there is no previous version", () => {
    const movement = computeMovement(["a", "b"], null);
    expect(movement.get("a")).toEqual({ kind: "new" });
    expect(movement.get("b")).toEqual({ kind: "new" });
  });

  it("marks an unchanged position as same", () => {
    expect(computeMovement(["a", "b"], ["a", "b"]).get("b")).toEqual({ kind: "same" });
  });

  it("measures a jump of several places", () => {
    expect(computeMovement(["x", "a", "b", "c"], ["a", "b", "c", "x"]).get("x")).toEqual({ kind: "up", by: 3 });
  });
});

describe("suggestAfterEvent", () => {
  const ranking = ["herrera", "munoz", "lagos-rival", "perez", "soto"];
  const base = { ranking, championId: "champ", slots: 5 };

  it("suggests moving a ranked winner to the loser's position", () => {
    const suggestions = suggestAfterEvent({
      ...base,
      results: [{ winnerId: "soto", loserId: "herrera", winnerName: "Soto", loserName: "Herrera" }],
    });
    expect(suggestions).toEqual([{ kind: "move", fighterId: "soto", toPosition: 1, reason: "Soto (#5) venció a Herrera (#1)" }]);
  });

  it("suggests entering an unranked winner at the loser's position", () => {
    const suggestions = suggestAfterEvent({
      ...base,
      results: [{ winnerId: "lagos", loserId: "lagos-rival", winnerName: "Lagos", loserName: "Muñoz" }],
    });
    expect(suggestions).toEqual([{ kind: "enter", fighterId: "lagos", toPosition: 3, reason: "Lagos (sin ranking) venció a Muñoz (#3)" }]);
  });

  it("does not suggest anything when the winner is already ranked better than the loser", () => {
    expect(
      suggestAfterEvent({ ...base, results: [{ winnerId: "herrera", loserId: "soto", winnerName: "Herrera", loserName: "Soto" }] }),
    ).toEqual([]);
  });

  it("does not suggest anything when the loser is unranked", () => {
    expect(
      suggestAfterEvent({ ...base, results: [{ winnerId: "soto", loserId: "nobody", winnerName: "Soto", loserName: "Nadie" }] }),
    ).toEqual([]);
  });

  it("leaves beating the champion to the title change", () => {
    expect(
      suggestAfterEvent({ ...base, results: [{ winnerId: "lagos", loserId: "champ", winnerName: "Lagos", loserName: "Campeón" }] }),
    ).toEqual([]);
  });

  it("does not suggest ranking the champion when they win", () => {
    expect(
      suggestAfterEvent({ ...base, results: [{ winnerId: "champ", loserId: "munoz", winnerName: "Campeón", loserName: "Muñoz" }] }),
    ).toEqual([]);
  });
});

describe("applySuggestion", () => {
  const move: RankingSuggestion = { kind: "move", fighterId: "e", toPosition: 2, reason: "" };
  const enter: RankingSuggestion = { kind: "enter", fighterId: "z", toPosition: 2, reason: "" };

  it("moves a ranked fighter up and pushes the others down", () => {
    expect(applySuggestion(["a", "b", "c", "d", "e"], move, 5)).toEqual(["a", "e", "b", "c", "d"]);
  });

  it("inserts a newcomer and drops whoever falls out of the slots", () => {
    expect(applySuggestion(["a", "b", "c", "d", "e"], enter, 5)).toEqual(["a", "z", "b", "c", "d"]);
  });

  it("keeps a short ranking short", () => {
    expect(applySuggestion(["a", "b"], enter, 5)).toEqual(["a", "z", "b"]);
  });
});

describe("rankingScopeKey", () => {
  it("builds a stable key per level and division, with p4p for null", () => {
    expect(rankingScopeKey({ level: "pro", divisionId: "d1" })).toBe("pro:d1");
    expect(rankingScopeKey({ level: "amateur", divisionId: null })).toBe("amateur:p4p");
  });
});

describe("validateRanking", () => {
  const ctx = { slots: 5, championId: "champ", eligible: new Set(["a", "b", "c", "d", "e", "f", "champ"]) };

  it("accepts a valid ranking", () => {
    expect(validateRanking(["a", "b", "c"], ctx)).toEqual([]);
  });

  it("rejects the champion in the numbered ranking", () => {
    expect(validateRanking(["a", "champ"], ctx)).toContain("El campeón no puede estar en el ranking numerado");
  });

  it("rejects more entries than slots", () => {
    expect(validateRanking(["a", "b", "c", "d", "e", "f"], ctx)).toContain("Máximo 5 puestos");
  });

  it("rejects a repeated fighter", () => {
    expect(validateRanking(["a", "a"], ctx)).toContain("Peleador repetido");
  });

  it("rejects an ineligible fighter", () => {
    expect(validateRanking(["a", "ghost"], ctx)).toContain("ghost no es elegible");
  });

  it("names the ineligible fighter when a label is given", () => {
    expect(validateRanking(["ghost"], { ...ctx, nameOf: () => "Pérez" })).toContain("Pérez no es elegible");
  });

  it("allows the champion when there is none to exclude (P4P)", () => {
    expect(validateRanking(["champ", "a"], { ...ctx, championId: null })).toEqual([]);
  });
});

describe("P4P_SLOTS", () => {
  it("is ten", () => {
    expect(P4P_SLOTS).toBe(10);
  });
});
