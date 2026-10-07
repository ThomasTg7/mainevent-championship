// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { JudgesScorecards } from "./judges-scorecards";

afterEach(cleanup);

describe("JudgesScorecards", () => {
  it("lists each judge with both totals, red on the left and blue on the right", () => {
    render(<JudgesScorecards redName="Pérez" blueName="Soto" scorecards={[{ judge: "Rojas", red: 29, blue: 28 }, { judge: "Muñoz", red: 28, blue: 29 }]} />);
    expect(screen.getByText("Ver tarjetas de los jueces")).toBeDefined();
    const rojas = screen.getByRole("rowheader", { name: "Rojas" }).closest("tr")!;
    expect(within(rojas).getAllByRole("cell").map((cell) => cell.textContent)).toEqual(["29", "28"]);
    expect(screen.queryByRole("list")).toBeNull();
  });

  it("shows each round when the card was written round by round", () => {
    const rounds = [
      { red: 10, blue: 9 },
      { red: 9, blue: 10 },
      { red: 10, blue: 9 },
    ];
    render(<JudgesScorecards redName="Pérez" blueName="Soto" scorecards={[{ judge: "Rojas", red: 29, blue: 28, rounds }]} />);
    const list = screen.getByRole("list", { name: "Rounds de Rojas" });
    expect(within(list).getAllByRole("listitem").map((item) => item.textContent)).toEqual(["R1 10-9", "R2 9-10", "R3 10-9"]);
  });
});
