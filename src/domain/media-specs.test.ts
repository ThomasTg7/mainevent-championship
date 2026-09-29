import { describe, expect, it } from "vitest";
import { MEDIA_SPECS, checkResolution, clampCrop, describeSpec, variantWidthsFor } from "./media-specs";

describe("checkResolution", () => {
  it("warns with the exact minimum when the image is too small", () => {
    expect(checkResolution("fighter_body", 700, 1050)).toEqual({
      ok: false,
      warning: "La imagen es más chica que el mínimo recomendado (800×1200) y puede verse pixelada.",
    });
  });

  it("accepts an image at the recommended size", () => {
    expect(checkResolution("fighter_body", 1200, 1800)).toEqual({ ok: true });
  });

  it("accepts an image exactly at the minimum", () => {
    expect(checkResolution("fighter_body", 800, 1200).ok).toBe(true);
  });

  it("judges free-form gallery images by their longest side", () => {
    expect(checkResolution("gallery", 1200, 300).ok).toBe(true);
    expect(checkResolution("gallery", 400, 1000).ok).toBe(false);
    expect(checkResolution("gallery", 1000, 400).warning).toContain("(1200 px de lado largo)");
  });
});

describe("variantWidthsFor", () => {
  it("omits variants wider than the cropped width", () => {
    expect(variantWidthsFor("news_cover", 1000)).toEqual([400, 800]);
  });

  it("keeps every variant when the crop is large enough", () => {
    expect(variantWidthsFor("news_cover", 1600)).toEqual([400, 800, 1600]);
  });

  it("keeps 300 and 600 for raster logos", () => {
    expect(variantWidthsFor("sponsor_logo", 600)).toEqual([300, 600]);
    expect(MEDIA_SPECS.sponsor_logo.accepts).toContain("image/svg+xml");
  });

  it("falls back to the cropped width when it is below every variant", () => {
    expect(variantWidthsFor("fighter_body", 300)).toEqual([300]);
  });
});

describe("clampCrop", () => {
  it("shrinks a crop that overflows the image by rounding", () => {
    expect(clampCrop({ x: 10, y: 0, width: 1001, height: 500 }, { w: 1000, h: 500 })).toEqual({
      x: 10,
      y: 0,
      width: 990,
      height: 500,
    });
  });

  it("rounds to integers and keeps at least one pixel", () => {
    expect(clampCrop({ x: -3.4, y: 0.6, width: 0.2, height: 10.4 }, { w: 100, h: 100 })).toEqual({
      x: 0,
      y: 1,
      width: 1,
      height: 10,
    });
  });
});

describe("MEDIA_SPECS", () => {
  it("only accepts SVG for sponsor logos", () => {
    const withSvg = Object.entries(MEDIA_SPECS)
      .filter(([, spec]) => spec.accepts.includes("image/svg+xml"))
      .map(([kind]) => kind);
    expect(withSvg).toEqual(["sponsor_logo"]);
  });
});

describe("describeSpec", () => {
  it("describes fixed-aspect kinds with recommended, minimum and ratio", () => {
    expect(describeSpec("fighter_body")).toBe("Recomendado: 1200×1800 · Mínimo: 800×1200 · Proporción 2:3");
    expect(describeSpec("og_image")).toBe("Recomendado: 1200×630 · Mínimo: 1200×630 · Proporción 1.91:1");
  });

  it("describes free-form kinds by their longest side", () => {
    expect(describeSpec("gallery")).toBe(
      "Recomendado: lado largo 2400 px · Mínimo: lado largo 1200 px · Proporción libre",
    );
  });
});
