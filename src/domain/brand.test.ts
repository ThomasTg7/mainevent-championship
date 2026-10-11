import { describe, expect, it } from "vitest";
import { BRAND } from "./brand";

describe("Open Fight Latam identity", () => {
  it("exposes the official name, profile and approved colors", () => {
    expect(BRAND.name).toBe("Open Fight Latam");
    expect(BRAND.shortName).toBe("OFL");
    expect(BRAND.instagramUrl).toBe("https://www.instagram.com/openfightlatam/");
    expect(BRAND.colors).toMatchObject({ primary: "#C51B3A", violet: "#643374", accent: "#C59BE5" });
  });
});
