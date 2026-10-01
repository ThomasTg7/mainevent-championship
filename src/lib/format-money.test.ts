import { describe, expect, it } from "vitest";
import { formatClp } from "./format-money";

describe("formatClp", () => {
  it("writes pesos with a dollar sign and a dot as the thousands separator", () => {
    expect(formatClp(15000)).toBe("$15.000");
    expect(formatClp(45000)).toBe("$45.000");
    expect(formatClp(1250000)).toBe("$1.250.000");
  });

  it("writes small amounts and zero without decimals", () => {
    expect(formatClp(500)).toBe("$500");
    expect(formatClp(0)).toBe("$0");
  });
});
