import { describe, expect, it } from "vitest";
import { formatDate, formatDateTime } from "./format-date";

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
