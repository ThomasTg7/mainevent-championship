import { describe, expect, it } from "vitest";
import { formatDate, formatDateTime, formatLongDate, formatShortDate, formatTime } from "./format-date";

// 2026-09-29 02:30 UTC = 2026-09-28 23:30 en Santiago (UTC-3 en horario de verano).
const lateNightInChile = new Date("2026-09-29T02:30:00.000Z");

describe("formatDate", () => {
  it("uses Chile's calendar day regardless of the server timezone", () => {
    expect(formatDate(lateNightInChile)).toBe("28-09-2026");
  });
});

describe("formatDateTime", () => {
  it("includes Chile's local time", () => {
    expect(formatDateTime(lateNightInChile)).toBe("28-09-2026, 23:30");
  });
});

// 2026-10-25 00:00 UTC = sábado 24-oct 21:00 en Santiago.
const saturdayNight = new Date("2026-10-25T00:00:00.000Z");

describe("formatTime", () => {
  it("writes the hour of Chile as HH:mm", () => {
    expect(formatTime(saturdayNight)).toBe("21:00");
    expect(formatTime(lateNightInChile)).toBe("23:30");
  });
});

describe("formatShortDate and formatLongDate", () => {
  it("writes the weekday and the day of Chile, not of the server", () => {
    expect(formatShortDate(saturdayNight)).toBe("sáb 24 oct");
    expect(formatLongDate(saturdayNight)).toBe("sábado 24 de octubre de 2026");
  });
});
