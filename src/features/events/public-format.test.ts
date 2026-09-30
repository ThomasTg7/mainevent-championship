import { describe, expect, it } from "vitest";
import { boutMeasure, countdownParts, mapEmbedUrl, mapLinkUrl, roundsLabel, showsCountdown, youtubeEmbedUrl } from "./public-format";

describe("boutMeasure", () => {
  it("writes the division like the rest of the site", () => {
    expect(boutMeasure({ catchweightKg: null, division: { name: "Ligero", gender: "male" } })).toBe("Peso Ligero");
    expect(boutMeasure({ catchweightKg: null, division: { name: "Paja", gender: "female" } })).toBe("Peso Paja fem.");
  });

  it("prefers an agreed catch weight", () => {
    expect(boutMeasure({ catchweightKg: 72.5, division: null })).toBe("Peso pactado 72.5 kg");
    expect(boutMeasure({ catchweightKg: 73, division: { name: "Ligero", gender: "male" } })).toBe("Peso pactado 73.0 kg");
  });

  it("is empty without division or weight", () => {
    expect(boutMeasure({ catchweightKg: null, division: null })).toBe("");
  });
});

describe("roundsLabel", () => {
  it("writes rounds × minutes", () => {
    expect(roundsLabel({ scheduledRounds: 5, roundSeconds: 300 })).toBe("5 × 5 MIN");
    expect(roundsLabel({ scheduledRounds: 3, roundSeconds: 180 })).toBe("3 × 3 MIN");
  });

  it("keeps the seconds of a round that is not a whole number of minutes", () => {
    expect(roundsLabel({ scheduledRounds: 3, roundSeconds: 90 })).toBe("3 × 1:30 MIN");
  });
});

describe("countdownParts", () => {
  it("splits the time left into days, hours, minutes and seconds", () => {
    expect(countdownParts(((1 * 24 + 2) * 60 + 3) * 60 * 1000 + 4000)).toEqual({ days: 1, hours: 2, minutes: 3, seconds: 4 });
    expect(countdownParts(59_000)).toEqual({ days: 0, hours: 0, minutes: 0, seconds: 59 });
  });

  it("is null once the time is up", () => {
    expect(countdownParts(0)).toBeNull();
    expect(countdownParts(-1)).toBeNull();
  });
});

describe("youtubeEmbedUrl", () => {
  it("turns the usual YouTube links into a privacy-friendly embed", () => {
    const embed = "https://www.youtube-nocookie.com/embed/abc123XYZ_-";
    expect(youtubeEmbedUrl("https://www.youtube.com/watch?v=abc123XYZ_-")).toBe(embed);
    expect(youtubeEmbedUrl("https://youtu.be/abc123XYZ_-?t=5")).toBe(embed);
    expect(youtubeEmbedUrl("https://www.youtube.com/live/abc123XYZ_-")).toBe(embed);
    expect(youtubeEmbedUrl("https://m.youtube.com/watch?v=abc123XYZ_-&feature=share")).toBe(embed);
  });

  it("does not embed anything else", () => {
    expect(youtubeEmbedUrl("https://vimeo.com/123")).toBeNull();
    expect(youtubeEmbedUrl("https://www.youtube.com/@guerracampal")).toBeNull();
    expect(youtubeEmbedUrl("https://evil.example.com/watch?v=abc123")).toBeNull();
    expect(youtubeEmbedUrl("javascript:alert(1)")).toBeNull();
    expect(youtubeEmbedUrl("no es un enlace")).toBeNull();
  });
});

describe("map links", () => {
  it("builds an OpenStreetMap embed around the point, and a link to open it", () => {
    expect(mapEmbedUrl(-33.4489, -70.6693)).toBe(
      "https://www.openstreetmap.org/export/embed.html?bbox=-70.6793%2C-33.4589%2C-70.6593%2C-33.4389&layer=mapnik&marker=-33.4489%2C-70.6693",
    );
    expect(mapLinkUrl(-33.4489, -70.6693)).toBe("https://www.openstreetmap.org/?mlat=-33.4489&mlon=-70.6693#map=17/-33.4489/-70.6693");
  });
});

describe("showsCountdown", () => {
  const now = Date.parse("2026-10-23T00:00:00Z");

  it("shows the clock for a scheduled event that has not started, and for one that is live", () => {
    expect(showsCountdown({ eventStatus: "scheduled", startsAt: "2026-10-24T00:00:00Z" }, now)).toBe(true);
    expect(showsCountdown({ eventStatus: "live", startsAt: "2026-10-22T20:00:00Z" }, now)).toBe(true);
  });

  it("does not for finished or cancelled events, nor for a scheduled event whose time already passed", () => {
    expect(showsCountdown({ eventStatus: "completed", startsAt: "2026-10-24T00:00:00Z" }, now)).toBe(false);
    expect(showsCountdown({ eventStatus: "cancelled", startsAt: "2026-10-24T00:00:00Z" }, now)).toBe(false);
    expect(showsCountdown({ eventStatus: "scheduled", startsAt: "2026-10-22T00:00:00Z" }, now)).toBe(false);
  });
});
