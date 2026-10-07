// @vitest-environment jsdom
import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { BoutDTO, BoutFighterDTO } from "../dto";
import { BoutAccordion } from "./bout-accordion";
import { BoutRow } from "./bout-row";

afterEach(cleanup);

const fighter = (id: string, lastName: string): BoutFighterDTO => ({
  id,
  slug: lastName.toLowerCase(),
  firstName: "Peleador",
  lastName,
  nickname: null,
  nationality: "CL",
  isPublic: true,
  record: { wins: 1, losses: 0, draws: 0, noContests: 0 },
  heightCm: null,
  weightKg: null,
  reachCm: null,
  headshotMedia: null,
  bodyMedia: null,
});

const bout: BoutDTO = {
  id: "b1",
  level: "pro",
  scheduledRounds: 5,
  roundSeconds: 300,
  isTitleFight: true,
  status: "scheduled",
  cancelReason: null,
  division: { name: "Ligero", slug: "peso-ligero", gender: "male" },
  catchweightKg: null,
  red: fighter("red-1", "Pérez"),
  blue: fighter("blue-1", "Soto"),
  result: null,
};

const renderRow = (props: { rankLabels?: Record<string, string> } = {}) =>
  render(
    <BoutAccordion>
      <ul>
        <BoutRow bout={bout} eventSlug="guerra-campal-5" {...props} />
      </ul>
    </BoutAccordion>,
  ).container;

const labelOf = (container: HTMLElement, side: "red" | "blue") => container.querySelector(`[data-corner="${side}"] [data-slot="bout-rank"]`);

describe("BoutRow rank labels", () => {
  it("spells out «Campeón» for the champion and shows #n for a ranked fighter in the rank slot of each corner", () => {
    const container = renderRow({ rankLabels: { "red-1": "C", "blue-1": "#1" } });
    expect(labelOf(container, "red")?.textContent).toBe("Campeón");
    expect(labelOf(container, "blue")?.textContent).toBe("#1");
  });

  it("says «Campeona» in a women's division", () => {
    const container = render(
      <BoutAccordion>
        <ul>
          <BoutRow bout={{ ...bout, division: { name: "Paja", slug: "peso-paja-femenino", gender: "female" } }} eventSlug="guerra-campal-5" rankLabels={{ "red-1": "C" }} />
        </ul>
      </BoutAccordion>,
    ).container;
    expect(labelOf(container, "red")?.textContent).toBe("Campeona");
  });

  it("leaves the slot empty for a fighter without label", () => {
    const container = renderRow({ rankLabels: { "blue-1": "#3" } });
    expect(labelOf(container, "red")?.textContent).toBe("");
    expect(labelOf(container, "blue")?.textContent).toBe("#3");
  });

  it("works without any labels", () => {
    const container = renderRow();
    expect(labelOf(container, "red")?.textContent).toBe("");
  });
});
