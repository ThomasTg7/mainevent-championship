// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { EventPageDTO } from "../dto";
import { EventSchedule } from "./event-schedule";

afterEach(cleanup);

const event = {
  startsAt: "2026-10-25T00:00:00.000Z",
  doorsAt: "2026-10-24T22:30:00.000Z",
  endsEstimatedAt: null,
  venue: { name: "Arena Santiago", address: "Av. Ejemplo 1234", city: "Santiago", lat: null, lng: null },
  segments: [],
} as unknown as EventPageDTO;

describe("EventSchedule", () => {
  it("says the day and the time of the event now that the cover only has the name", () => {
    render(<EventSchedule event={event} />);
    expect(screen.getByText("Fecha")).toBeDefined();
    expect(screen.getByText(/sábado 24 octubre 2026|sábado 24 de octubre de 2026/)).toBeDefined();
    expect(screen.getByText(/21:00 hrs/)).toBeDefined();
  });

  it("keeps the doors and the venue", () => {
    render(<EventSchedule event={event} />);
    expect(screen.getByText("Apertura de puertas")).toBeDefined();
    expect(screen.getByText("Arena Santiago · Av. Ejemplo 1234")).toBeDefined();
  });
});
