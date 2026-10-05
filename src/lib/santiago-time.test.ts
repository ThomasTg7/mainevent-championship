import { describe, expect, it } from "vitest";
import { fromSantiagoInputs, isCalendarDay, santiagoToday, toSantiagoInputs, toSantiagoIso } from "./santiago-time";

describe("santiago time", () => {
  it("reads a date and time typed in Chile summer time (UTC-3)", () => {
    expect(fromSantiagoInputs("2026-10-15", "20:00")?.toISOString()).toBe("2026-10-15T23:00:00.000Z");
  });

  it("reads a date and time typed in Chile winter time (UTC-4)", () => {
    expect(fromSantiagoInputs("2026-07-01", "12:00")?.toISOString()).toBe("2026-07-01T16:00:00.000Z");
  });

  it("returns null while the date or time is missing or invalid", () => {
    expect(fromSantiagoInputs("", "12:00")).toBeNull();
    expect(fromSantiagoInputs("2026-07-01", "")).toBeNull();
    expect(fromSantiagoInputs("2026-13-40", "12:00")).toBeNull();
  });

  it("splits an instant back into Santiago date and time inputs", () => {
    expect(toSantiagoInputs(new Date("2026-10-15T23:00:00Z"))).toEqual({ date: "2026-10-15", time: "20:00" });
    expect(toSantiagoInputs(new Date("2026-07-01T03:30:00Z"))).toEqual({ date: "2026-06-30", time: "23:30" });
  });

  it("writes an instant with the Santiago offset: -03:00 in summer and -04:00 in winter", () => {
    expect(toSantiagoIso(new Date("2026-10-15T23:00:00Z"))).toBe("2026-10-15T20:00:00-03:00");
    expect(toSantiagoIso(new Date("2031-05-11T00:00:00Z"))).toBe("2031-05-10T20:00:00-04:00");
  });

  it("gives today's Santiago calendar day, even when UTC is already tomorrow", () => {
    expect(santiagoToday(new Date("2026-10-01T00:30:00Z")).toISOString()).toBe("2026-09-30T12:00:00.000Z");
    expect(santiagoToday(new Date("2026-10-01T15:00:00Z")).toISOString()).toBe("2026-10-01T12:00:00.000Z");
  });

  it("isCalendarDay accepts real days only, and never throws on a month or day out of range", () => {
    expect(isCalendarDay("2024-02-29")).toBe(true);
    for (const value of ["2026-02-29", "2026-02-30", "2026-13-01", "2026-00-10", "2026-04-31", "2026-1-1", "", "hoy"]) {
      expect(isCalendarDay(value)).toBe(false);
    }
  });
});
