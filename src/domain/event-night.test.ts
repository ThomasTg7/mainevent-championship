import { describe, expect, it } from "vitest";
import { isEventNight } from "./event-night";

const startsAt = new Date("2026-10-25T00:00:00.000Z");
const hoursBefore = (hours: number) => new Date(startsAt.getTime() - hours * 60 * 60 * 1000);

describe("isEventNight", () => {
  it("is false a week before the event", () => {
    expect(isEventNight(startsAt, hoursBefore(7 * 24))).toBe(false);
  });

  it("is false the day before, and true from 12 hours before the start", () => {
    expect(isEventNight(startsAt, hoursBefore(24))).toBe(false);
    expect(isEventNight(startsAt, hoursBefore(12.01))).toBe(false);
    expect(isEventNight(startsAt, hoursBefore(12))).toBe(true);
    expect(isEventNight(startsAt, hoursBefore(2))).toBe(true);
  });

  it("stays true once the event has started, however late", () => {
    expect(isEventNight(startsAt, startsAt)).toBe(true);
    expect(isEventNight(startsAt, hoursBefore(-30))).toBe(true);
  });
});
