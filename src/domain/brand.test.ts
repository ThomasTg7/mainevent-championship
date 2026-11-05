import { describe, expect, it } from "vitest";
import { BRAND } from "./brand";

describe("Mainevent Championship identity", () => {
  it("exposes the official name and the logo colors", () => {
    expect(BRAND.name).toBe("Mainevent Championship");
    expect(BRAND.shortName).toBe("MAIN");
    expect(BRAND.colors).toMatchObject({ primary: "#FFE500", orange: "#FF8A00", ink: "#000000" });
  });

  it("does not invent an Instagram profile", () => {
    expect(BRAND.instagramUrl).toBeNull();
  });
});
