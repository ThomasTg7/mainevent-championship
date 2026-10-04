import { describe, expect, it } from "vitest";
import type { RankedFighterDTO, RankingCardDTO, RankingEntryDTO } from "@/features/rankings/dto";
import { MAX_HIGHLIGHTS, pickHighlights } from "./highlights";

const fighter = (id: string): RankedFighterDTO => ({ id, slug: id, name: id, nationality: "CL", record: { wins: 1, losses: 0, draws: 0, noContests: 0 }, bodyMedia: null });
const entry = (position: number, id: string): RankingEntryDTO => ({ position, fighter: fighter(id), movement: { kind: "same" } as RankingEntryDTO["movement"] });
const division = (slug: string, gender: "male" | "female" = "male") => ({ id: `d-${slug}`, name: slug, slug, gender });

function card(slug: string | null, champion: string | null, entries: [number, string][], gender: "male" | "female" = "male"): RankingCardDTO {
  return {
    level: "pro",
    division: slug ? division(slug, gender) : null,
    champion: champion ? { ...fighter(champion), since: null } : null,
    entries: entries.map(([position, id]) => entry(position, id)),
    updatedAt: null,
  };
}

describe("pickHighlights", () => {
  it("takes each division's champion and its first three, with the word for the title and the position shown on the site", () => {
    const cards = [
      card(null, null, [[1, "perez"], [2, "rojas"]]),
      card("ligero", "perez", [[1, "soto"], [2, "araya"], [3, "vera"], [4, "otro"]]),
      card("paja", "rojas", [[1, "cortes"]], "female"),
    ];

    expect(pickHighlights(cards)).toEqual([
      { id: "perez", badge: "Campeón", backdrop: "C" },
      { id: "soto", badge: "#1", backdrop: "1" },
      { id: "araya", badge: "#2", backdrop: "2" },
      { id: "vera", badge: "#3", backdrop: "3" },
      { id: "rojas", badge: "Campeona", backdrop: "C" },
      { id: "cortes", badge: "#1", backdrop: "1" },
    ]);
  });

  it("uses the position of the card as it is: it never recomputes the numbers", () => {
    const cards = [card("ligero", "perez", [[3, "soto"], [5, "araya"]])];

    expect(pickHighlights(cards).map((item) => item.badge)).toEqual(["Campeón", "#3", "#5"]);
  });

  it("does not repeat a fighter that shows up in two divisions, and keeps the first label", () => {
    const cards = [card("ligero", "perez", [[1, "soto"]]), card("welter", "soto", [[1, "perez"]])];

    expect(pickHighlights(cards).map((item) => item.id)).toEqual(["perez", "soto"]);
    expect(pickHighlights(cards)[1]?.badge).toBe("#1");
  });

  it("skips a vacant title and stops at the maximum", () => {
    const cards = [card("ligero", null, [[1, "a"], [2, "b"], [3, "c"]]), card("welter", "d", [[1, "e"], [2, "f"], [3, "g"]]), card("pluma", "h", [[1, "i"]])];

    const picked = pickHighlights(cards);

    expect(picked).toHaveLength(MAX_HIGHLIGHTS);
    expect(picked.map((item) => item.id)).toEqual(["a", "b", "c", "d", "e", "f", "g", "h"]);
  });

  it("is empty when the level is hidden or has no cards", () => {
    expect(pickHighlights([])).toEqual([]);
  });
});
