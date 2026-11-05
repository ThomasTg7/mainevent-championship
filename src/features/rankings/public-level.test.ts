import { describe, expect, it } from "vitest";
import { parseRankingLevel, rankingsHref } from "./public-level";

describe("parseRankingLevel", () => {
  it("reads Kickboxing only when the param says so; anything else is Muay Thai", () => {
    expect(parseRankingLevel("kickboxing")).toBe("amateur");
    expect(parseRankingLevel("muay-thai")).toBe("pro");
    expect(parseRankingLevel("Kickboxing")).toBe("pro");
    expect(parseRankingLevel(["kickboxing"])).toBe("pro");
    expect(parseRankingLevel(undefined)).toBe("pro");
  });

  it("keeps old ?nivel=amateur links working", () => {
    expect(parseRankingLevel(undefined, "amateur")).toBe("amateur");
    expect(parseRankingLevel(undefined, "pro")).toBe("pro");
  });
});

describe("rankingsHref", () => {
  it("gives each discipline its own URL (Kickboxing is another page)", () => {
    expect(rankingsHref("pro")).toBe("/rankings");
    expect(rankingsHref("amateur")).toBe("/rankings?disciplina=kickboxing");
  });
});
