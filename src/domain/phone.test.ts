import { describe, expect, it } from "vitest";
import { telUrl, whatsappUrl } from "./phone";

describe("whatsappUrl", () => {
  it("keeps only the digits of a number written with the country code", () => {
    expect(whatsappUrl("+56 9 1234 5678")).toBe("https://wa.me/56912345678");
    expect(whatsappUrl("+56 (9) 1234-5678")).toBe("https://wa.me/56912345678");
  });

  it("adds Chile's code to a mobile number written without it", () => {
    expect(whatsappUrl("9 1234 5678")).toBe("https://wa.me/56912345678");
    expect(whatsappUrl("09 1234 5678")).toBe("https://wa.me/56912345678");
  });

  it("returns null when there is nothing to dial", () => {
    expect(whatsappUrl("")).toBeNull();
    expect(whatsappUrl("   ")).toBeNull();
    expect(whatsappUrl("123")).toBeNull();
    expect(whatsappUrl("no tengo")).toBeNull();
  });
});

describe("telUrl", () => {
  it("builds a tel: link without spaces or punctuation, keeping the plus sign", () => {
    expect(telUrl("+56 2 1234 5678")).toBe("tel:+56212345678");
    expect(telUrl("(02) 1234-5678")).toBe("tel:0212345678");
  });

  it("returns null for an empty number", () => {
    expect(telUrl("")).toBeNull();
    expect(telUrl("abc")).toBeNull();
  });
});
