// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { FightHistoryRow, NextBoutDTO, OpponentDTO } from "@/features/events/dto";
import type { MediaDTO } from "@/features/media/dto";
import { NextBout } from "./next-bout";

afterEach(cleanup);

const face: MediaDTO = {
  id: "m1",
  kind: "fighter_headshot",
  width: 400,
  height: 500,
  focal: { x: 0.5, y: 0.5 },
  alt: "Diego Soto, rostro",
  variants: [{ width: 400, height: 500, url: "/media/v/soto.webp" }],
  originalUrl: "/media/soto.png",
};

const opponent: OpponentDTO = { id: "o1", slug: "diego-soto", firstName: "Diego", lastName: "Soto", nationality: "AR", isPublic: true, headshotMedia: face };

const next: NextBoutDTO = {
  boutId: "b1",
  isTitleFight: true,
  scheduledRounds: 5,
  roundSeconds: 300,
  divisionName: "Ligero",
  divisionGender: "male",
  catchweightKg: null,
  event: { id: "e1", slug: "guerra-campal-5", name: "Guerra Campal 5", startsAt: "2026-10-25T00:00:00.000Z", venueCity: "Santiago" },
  opponent,
};

describe("NextBout", () => {
  it("shows the opponent's photo next to the name, linked to their profile", () => {
    const { container } = render(<NextBout nextBout={next} lastFight={null} />);
    expect(screen.getByRole("img", { name: "Diego Soto, rostro" })).toBeDefined();
    expect(container.querySelector('[data-slot="opponent-photo"] a')?.getAttribute("href")).toBe("/peleadores/diego-soto");
    expect(screen.getByText("Próxima pelea")).toBeDefined();
  });

  it("names the photo link after the opponent, so a silhouette-only link is never an empty link for a screen reader", () => {
    const { container } = render(<NextBout nextBout={{ ...next, opponent: { ...opponent, headshotMedia: null } }} lastFight={null} />);
    const link = container.querySelector('[data-slot="opponent-photo"] a');
    expect(link?.getAttribute("aria-label")).toBe("Diego Soto");
    expect(link?.getAttribute("tabindex")).toBe("-1");
  });

  it("uses the brand silhouette when the opponent has no photo, and no link when they have no profile", () => {
    const { container } = render(<NextBout nextBout={{ ...next, opponent: { ...opponent, headshotMedia: null, isPublic: false } }} lastFight={null} />);
    expect(container.querySelector('[data-slot="opponent-photo"] [data-slot="fighter-silhouette"]')).not.toBeNull();
    expect(container.querySelector('[data-slot="opponent-photo"] a')).toBeNull();
  });

  it("lists the bout's details and the event on separate lines", () => {
    const { container } = render(<NextBout nextBout={next} lastFight={null} />);
    expect(screen.getByText("★ Por el título")).toBeDefined();
    expect(screen.getByText("Peso Ligero")).toBeDefined();
    expect(screen.getByText("5 × 5 MIN")).toBeDefined();
    expect(screen.getByRole("link", { name: "Guerra Campal 5" }).getAttribute("href")).toBe("/eventos/guerra-campal-5");
    expect(container).toHaveTextContent("Santiago");
  });

  it("shows the last fight, also with the opponent's photo, when there is no next one", () => {
    const last: FightHistoryRow = {
      boutId: "b0",
      level: "pro",
      fighterResult: "loss",
      methodText: "Descalificación (Golpe bajo)",
      roundTime: "R2 0:58",
      date: "2026-08-29T00:00:00.000Z",
      eventId: "e0",
      eventSlug: "guerra-campal-4",
      eventName: "Guerra Campal 4",
      opponent,
    };
    render(<NextBout nextBout={null} lastFight={last} />);
    expect(screen.getByText("Última pelea")).toBeDefined();
    expect(screen.getByRole("img", { name: "Diego Soto, rostro" })).toBeDefined();
    expect(screen.getByText("Derrota")).toBeDefined();
    expect(screen.getByText("Descalificación (Golpe bajo)")).toBeDefined();
  });

  it("renders nothing without a next or a last fight", () => {
    const { container } = render(<NextBout nextBout={null} lastFight={null} />);
    expect(container).toBeEmptyDOMElement();
  });
});
