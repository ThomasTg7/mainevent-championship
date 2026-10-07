// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { JudgesScorecards } from "./judges-scorecards";

afterEach(cleanup);

const totalRow = (table: HTMLElement) => within(table).getByRole("rowheader", { name: "Total" }).closest("tr")!;

describe("JudgesScorecards", () => {
  it("shows each judge's total for both corners and who the card went to", () => {
    render(<JudgesScorecards redName="Pérez" blueName="Soto" scorecards={[{ judge: "Rojas", red: 29, blue: 28 }, { judge: "Muñoz", red: 28, blue: 28 }]} />);
    const rojas = screen.getByRole("table", { name: "Tarjeta de Rojas" });
    expect(within(totalRow(rojas)).getAllByRole("cell").map((cell) => cell.textContent)).toEqual(["29", "28"]);
    expect(screen.getByText("Para Pérez")).toBeDefined();
    expect(screen.getByText("Empate")).toBeDefined();
    expect(within(rojas).queryByRole("rowheader", { name: "R1" })).toBeNull();
  });

  it("lists every round when the card was written round by round", () => {
    const rounds = [
      { red: 10, blue: 9 },
      { red: 9, blue: 10 },
      { red: 10, blue: 9 },
    ];
    render(<JudgesScorecards redName="Pérez" blueName="Soto" scorecards={[{ judge: "Rojas", red: 29, blue: 28, rounds }]} />);
    const table = screen.getByRole("table", { name: "Tarjeta de Rojas" });
    const r2 = within(table).getByRole("rowheader", { name: "R2" }).closest("tr")!;
    expect(within(r2).getAllByRole("cell").map((cell) => cell.textContent)).toEqual(["9", "10"]);
    expect(within(totalRow(table)).getAllByRole("cell").map((cell) => cell.textContent)).toEqual(["29", "28"]);
  });
});
